import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Clock, CheckCircle2, Bell, Package, XCircle, Hotel, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  order_number: number;
  order_type: "delivery" | "counter" | "room";
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  notes: string | null;
  total: number;
  room_number: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  customers?: { full_name: string };
  order_items?: OrderItem[];
}

export default function Track() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchNumber, setSearchNumber] = useState(orderNumber || "");

  useEffect(() => {
    if (orderNumber) {
      fetchOrder(orderNumber);
    }
  }, [orderNumber]);

  useEffect(() => {
    if (!order) return;

    const channel = supabase
      .channel("track-order")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          setOrder((prev) => prev ? { ...prev, ...payload.new } : null);
          if (payload.new.status === "ready") {
            toast.success("Seu pedido está pronto!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id]);

  const fetchOrder = async (number: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, customers(full_name), order_items(*)")
      .eq("order_number", parseInt(number))
      .single();

    setLoading(false);

    if (error || !data) {
      toast.error("Pedido não encontrado");
      setOrder(null);
      return;
    }

    setOrder(data);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchNumber) {
      fetchOrder(searchNumber);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; color: string; description: string }> = {
      pending: {
        label: "Aguardando",
        icon: Clock,
        color: "text-warning",
        description: "Sua solicitação está na fila de atendimento",
      },
      preparing: {
        label: "Em preparo",
        icon: Bell,
        color: "text-primary",
        description: "Estamos preparando sua solicitação",
      },
      ready: {
        label: "Pronto!",
        icon: CheckCircle2,
        color: "text-success",
        description: "Sua solicitação está pronta!",
      },
      delivered: {
        label: "Entregue",
        icon: Package,
        color: "text-muted-foreground",
        description: "Solicitação entregue no quarto",
      },
      cancelled: {
        label: "Cancelado",
        icon: XCircle,
        color: "text-destructive",
        description: "Esta solicitação foi cancelada",
      },
    };
    return statusMap[status] || statusMap.pending;
  };

  const statusInfo = order ? getStatusInfo(order.status) : null;
  const StatusIcon = statusInfo?.icon || Clock;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Hotel className="h-6 w-6 text-primary" />
            <span className="font-display font-black text-xl tracking-tighter">POUSADA CARDÁPIO</span>
          </div>
        </div>

        {/* Search */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-center">Acompanhe seu Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Número do pedido"
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                type="number"
                className="text-lg"
              />
              <Button type="submit" className="gap-2" disabled={loading}>
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Order Status */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {order && statusInfo && (
          <Card className="glass-card animate-slide-up">
            <CardContent className="pt-6 space-y-6">
              {/* Status Display */}
              <div className="text-center space-y-4">
                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${order.status === "ready" ? "bg-success/20" :
                  order.status === "preparing" ? "bg-primary/20" :
                    order.status === "pending" ? "bg-warning/20" : "bg-muted"
                  }`}>
                  <StatusIcon className={`h-10 w-10 ${statusInfo.color}`} />
                </div>
                <div>
                  <h2 className="text-3xl font-display font-bold">#{order.order_number}</h2>
                  <Badge className={`mt-2 text-lg px-4 py-1 ${order.status === "ready" ? "bg-success" :
                    order.status === "preparing" ? "bg-primary" :
                      order.status === "pending" ? "bg-warning text-warning-foreground" : ""
                    }`}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{statusInfo.description}</p>
              </div>

              {/* Progress Steps */}
              <div className="flex justify-between items-center px-4">
                {["pending", "preparing", "ready"].map((step, index) => {
                  const steps = ["pending", "preparing", "ready"];
                  const currentIndex = steps.indexOf(order.status);
                  const isCompleted = index <= currentIndex;
                  const isCurrent = index === currentIndex;

                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        } ${isCurrent ? "ring-4 ring-primary/30" : ""}`}>
                        {index + 1}
                      </div>
                      <span className="text-xs mt-2 text-muted-foreground">
                        {step === "pending" ? "Fila" : step === "preparing" ? "Preparo" : "Pronto"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Order Details */}
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cliente</span>
                  <span>{order.customers?.full_name || "Não informado"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data</span>
                  <span>{format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
                {order.room_number && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quarto</span>
                    <span>{order.room_number}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-3">Itens do Pedido</h4>
                <div className="space-y-2">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span>{formatCurrency(item.quantity * Number(item.unit_price))}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-border pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(Number(order.total))}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!order && !loading && searchNumber && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum pedido encontrado com o número informado
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
