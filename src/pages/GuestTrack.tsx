import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import {
  ArrowLeft,
  Clock,
  ChefHat,
  CheckCircle2,
  Truck,
  XCircle,
  Package,
  Bell,
  UtensilsCrossed,
  Copy,
  QrCode,
  Check,
  Phone
} from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
}

interface Order {
  id: string;
  order_number: number;
  status: string;
  order_type: string;
  room_number: string | null;
  total: number;
  notes: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

const STATUS_CONFIG = {
  pending: {
    label: "Aguardando",
    icon: Clock,
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    description: "Seu pedido foi recebido e está aguardando confirmação",
    step: 1,
  },
  preparing: {
    label: "Em Produção",
    icon: ChefHat,
    color: "bg-blue-500",
    textColor: "text-blue-500",
    description: "A cozinha já está preparando seu pedido com carinho",
    step: 2,
  },
  ready: {
    label: "Pronto",
    icon: CheckCircle2,
    color: "bg-green-500",
    textColor: "text-green-500",
    description: "Seu pedido está pronto! A entrega está saindo.",
    step: 3,
  },
  delivered: {
    label: "Entregue",
    icon: Truck,
    color: "bg-primary",
    textColor: "text-primary",
    description: "Pedido entregue. Aproveite sua estadia!",
    step: 4,
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    color: "bg-destructive",
    textColor: "text-destructive",
    description: "Este pedido foi cancelado",
    step: 0,
  },
};

export default function GuestTrack() {
  const navigate = useNavigate();
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const { playNewOrderSound, playOrderReadySound } = useNotificationSound();
  const previousStatusRef = useRef<string | null>(null);
  const hasNotifiedRef = useRef<{ [key: string]: boolean }>({});

  // Constant for PIX KEY - Ideally this would come from a config/settings table
  const PIX_KEY = "pousada@pix.com.br"; // Placeholder

  useEffect(() => {
    if (orderNumber) {
      fetchOrder(orderNumber);
    } else {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    if (!order) return;

    // Realtime subscription
    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const newOrder = payload.new as Order;
          handleOrderUpdate(newOrder);
        }
      )
      .subscribe();

    // Polling fallback (every 4 seconds)
    const pollInterval = setInterval(() => {
      if (orderNumber) fetchOrder(orderNumber, true); // true = silent update (no loading spinner)
    }, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [order?.id, orderNumber]);

  // Helper to handle updates from both Realtime and Polling
  const handleOrderUpdate = (newOrder: Order) => {
    const newStatus = newOrder.status;
    const prevStatus = previousStatusRef.current;

    setOrder(newOrder);

    if (prevStatus && prevStatus !== newStatus && !hasNotifiedRef.current[newStatus]) {
      hasNotifiedRef.current[newStatus] = true;

      const config = STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG];

      if (newStatus === "preparing") {
        playNewOrderSound();
        toast.info("A cozinha começou a preparar seu pedido!", {
          duration: 8000,
          icon: <ChefHat className="h-6 w-6 text-blue-500 animate-bounce" />,
        });
      } else if (newStatus === "ready") {
        playOrderReadySound();
        toast.success("Seu pedido está pronto!", {
          duration: 15000,
          description: "Ele será entregue em breve no seu quarto.",
          icon: <Bell className="h-6 w-6 text-green-500 animate-bounce" />,
        });
      } else if (newStatus === "delivered") {
        toast.success("Pedido entregue!", {
          duration: 10000,
          description: "Bom proveito! Se precisar de algo mais, estamos à disposição.",
        });
      }
    }

    previousStatusRef.current = newStatus;
  };

  const fetchOrder = async (num: string, silent = false) => {
    if (!silent) {
      setLoading(true);
      setNotFound(false);
    }

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", parseInt(num))
      .single();

    if (orderError || !orderData) {
      if (!silent) {
        setNotFound(true);
        setLoading(false);
      }
      return;
    }

    // Call shared handler to manage status changes/toasts
    // We only need to check status changes here if we are polling
    if (silent) {
      handleOrderUpdate(orderData as Order);
    } else {
      setOrder(orderData);
      previousStatusRef.current = orderData.status; // Initial set
    }

    if (!silent) {
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderData.id);

      if (itemsData) setItems(itemsData);
      setLoading(false);
    }
  };

  const copyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center rounded-3xl overflow-hidden border-none shadow-xl">
          <CardHeader className="bg-white pb-6">
            <div className="mx-auto p-5 rounded-full bg-gray-100 mb-2 w-fit">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <CardTitle className="text-2xl font-black">Ops! Não encontramos.</CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              O pedido #{orderNumber} não está no nosso sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6 pt-0">
            <Button onClick={() => navigate("/")} className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90">
              Ir para o Cardápio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-100"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-lg font-black tracking-tight">Status do Pedido</h1>
              <p className="text-xs font-bold text-primary uppercase">Pedido #{order.order_number}</p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary text-primary font-bold px-3 py-1 rounded-full">
            Quarto {order.room_number}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-xl">
        {/* Status Visualization */}
        <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-white">
          <CardContent className="pt-8 pb-8 px-6">
            <div className="text-center space-y-4 mb-10">
              <div className={`mx-auto p-6 rounded-full ${statusConfig.color}/10 w-fit animate-pulse`}>
                <StatusIcon className={`h-16 w-16 ${statusConfig.textColor}`} />
              </div>
              <div className="space-y-1">
                <h3 className={`text-2xl font-black ${statusConfig.textColor}`}>
                  {statusConfig.label}
                </h3>
                <p className="text-gray-500 font-medium text-sm max-w-xs mx-auto">
                  {statusConfig.description}
                </p>
              </div>
            </div>

            {/* Progress Visualization */}
            {order.status !== "cancelled" && (
              <div className="relative px-2">
                <div className="absolute top-4 left-0 right-0 h-1 bg-gray-100 z-0 mx-8 rounded-full" />
                <div className="relative z-10 flex items-center justify-between">
                  {["pending", "preparing", "ready", "delivered"].map((step, index) => {
                    const stepConfig = getStatusConfig(step);
                    const currentStep = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.step;
                    const isActive = currentStep >= stepConfig.step;
                    const isProcessing = order.status === step;

                    return (
                      <div key={step} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? stepConfig.color + " shadow-lg" : "bg-gray-200"
                            } ${isProcessing ? "ring-4 ring-offset-2 ring-white ring-" + stepConfig.color.split('-')[1] + "-200" : ""}`}
                        >
                          {isActive && !isProcessing ? (
                            <Check className="h-4 w-4 text-white" />
                          ) : (
                            <stepConfig.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                          )}
                        </div>
                        <span className={`text-[10px] mt-2 font-black uppercase tracking-tighter text-center leading-none ${isActive ? stepConfig.textColor : "text-gray-400"}`}>
                          {stepConfig.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PIX Payment Card */}
        <Card className="rounded-3xl border-2 border-primary/20 bg-primary/5 shadow-inner overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-primary">
                <QrCode className="h-5 w-5" />
                PAGAMENTO VIA PIX
              </CardTitle>
              <Badge className="bg-primary text-white font-black">{formatCurrency(order.total)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-primary/70 font-bold leading-tight">
              Para agilizar seu pedido, realize o pagamento via PIX e envie o comprovante para nosso WhatsApp.
            </p>
            <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-primary/10">
              <div className="overflow-hidden mr-2">
                <p className="text-[10px] font-black text-gray-400 uppercase">Chave PIX</p>
                <p className="font-bold text-gray-800 truncate text-sm">{PIX_KEY}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-primary hover:bg-primary/5 h-10 w-10"
                onClick={copyPix}
              >
                {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700 h-12 rounded-xl font-bold gap-2">
              <Phone className="h-4 w-4" /> Enviar Comprovante
            </Button>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-sm font-black flex items-center justify-between text-gray-800">
              <span className="flex items-center gap-2"><UtensilsCrossed className="h-4 w-4" /> ITENS PEDIDOS</span>
              <span className="text-gray-400">Total: {formatCurrency(order.total)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-xs text-gray-500">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">
                        {item.product_name}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-gray-500 font-medium italic">{item.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-gray-800 text-sm">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
              <span className="text-xs font-black text-gray-400 uppercase">Resumo Financeiro</span>
              <div className="text-right">
                <p className="text-lg font-black text-primary">{formatCurrency(order.total)}</p>
                <p className="text-[10px] text-green-600 font-bold">Pagamento Pendente via PIX</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-gray-800 uppercase tracking-tight">
              <Clock className="h-4 w-4" /> Fluxo do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-800">Pedido Confirmado</p>
                  <p className="text-[10px] text-gray-400 font-medium">Iniciado às {formatTime(order.created_at)}</p>
                </div>
              </div>
              {order.started_at && (
                <div className="flex items-start gap-4 border-l-2 border-gray-100 ml-0.5 pl-3.5 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-800">Preparando na Cozinha</p>
                    <p className="text-[10px] text-gray-400 font-medium">Iniciado às {formatTime(order.started_at)}</p>
                  </div>
                </div>
              )}
              {order.completed_at && (
                <div className="flex items-start gap-4 border-l-2 border-gray-100 ml-0.5 pl-3.5 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-800">Concluído / Entregue</p>
                    <p className="text-[10px] text-gray-400 font-medium">{formatTime(order.completed_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer help */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-400 font-medium">Dúvidas sobre o pedido? Ligue para a recepção.</p>
        </div>
      </main>
    </div>
  );
}
