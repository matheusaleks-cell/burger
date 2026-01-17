import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Search, Phone, MapPin, Home, History, FileText, UserCog, Ban, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  order_type: "delivery" | "counter" | "room";
  room_number: string | null;
  address: string | null;
  created_at: string;
  internal_notes?: string;
  is_blocked?: boolean;
}

interface OrderHistoryItem {
  id: string;
  order_number: number;
  total: number;
  status: string;
  created_at: string;
  order_items: { product_name: string; quantity: number }[];
}

interface CustomerWithStats extends Customer {
  orders?: OrderHistoryItem[];
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  favoriteItem?: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithStats | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    order_type: "counter" as "delivery" | "counter" | "room",
    room_number: "",
    address: "",
    internal_notes: "",
    is_blocked: false
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select(`
        *,
        orders (
          id,
          order_number,
          total,
          status,
          created_at,
          order_items (
            product_name,
            quantity
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customers:", error);
      toast.error("Erro ao carregar clientes: " + error.message);
      setLoading(false);
      return;
    }

    if (data) {
      const enriched = data.map((c: any) => {
        const orders = c.orders || [];
        const totalSpent = orders.reduce((acc: number, o: any) => acc + (o.total || 0), 0);
        const lastOrder = orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        // Calculate Favorite Item
        const itemCounts: Record<string, number> = {};
        orders.forEach((o: any) => {
          o.order_items?.forEach((item: any) => {
            const name = item.product_name;
            itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
          });
        });

        let favoriteItem = "-";
        let maxCount = 0;

        Object.entries(itemCounts).forEach(([name, count]) => {
          if (count > maxCount) {
            maxCount = count;
            favoriteItem = name;
          }
        });

        return {
          ...c,
          orders: orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
          totalOrders: orders.length,
          totalSpent: totalSpent,
          lastOrderDate: lastOrder ? lastOrder.created_at : null,
          favoriteItem
        };
      });

      setCustomers(enriched);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const customerData = {
      full_name: formData.full_name,
      phone: formData.phone,
      order_type: formData.order_type,
      room_number: formData.order_type === "room" ? formData.room_number : null,
      address: formData.order_type === "delivery" ? formData.address : null,
      internal_notes: formData.internal_notes,
      is_blocked: formData.is_blocked
    };

    if (editingCustomer) {
      const { error } = await supabase
        .from("customers")
        .update(customerData)
        .eq("id", editingCustomer.id);

      if (error) {
        toast.error("Erro ao atualizar cliente: " + error.message);
        return;
      }
      toast.success("Cliente atualizado!");
    } else {
      const { error } = await supabase.from("customers").insert(customerData);

      if (error) {
        toast.error("Erro ao criar cliente: " + error.message);
        return;
      }
      toast.success("Cliente criado!");
    }

    setIsSheetOpen(false);
    resetForm();
    fetchCustomers();
  };

  const handleEdit = (customer: CustomerWithStats) => {
    setEditingCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      phone: customer.phone,
      order_type: customer.order_type,
      room_number: customer.room_number || "",
      address: customer.address || "",
      internal_notes: customer.internal_notes || "",
      is_blocked: customer.is_blocked || false
    });
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente? O histórico de pedidos será mantido, mas desvinculado.")) return;

    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir cliente");
      return;
    }

    toast.success("Cliente excluído!");
    fetchCustomers();
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      full_name: "",
      phone: "",
      order_type: "counter",
      room_number: "",
      address: "",
      internal_notes: "",
      is_blocked: false
    });
  };

  const getOrderTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      delivery: "Delivery",
      counter: "Balcão",
      room: "Quarto",
    };
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      delivery: "default",
      counter: "secondary",
      room: "outline",
    };
    return (
      <Badge variant={variants[type] || "secondary"}>
        {labels[type] || type}
      </Badge>
    );
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.room_number && customer.room_number.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Gestão de Clientes (CRM)</h1>
          <p className="text-muted-foreground">Gerencie perfis, histórico e anotações.</p>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) resetForm();
        }}>
          <Button onClick={() => { resetForm(); setIsSheetOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo ClienteManual
          </Button>

          <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                {editingCustomer ? <UserCog className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
                {editingCustomer ? "Detalhes do Cliente" : "Novo Cliente"}
              </SheetTitle>
              <SheetDescription>
                Visualize o histórico, adicione notas ou bloqueie o acesso.
              </SheetDescription>
            </SheetHeader>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 p-1 bg-gray-100 rounded-xl">
                <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <UserCog className="h-4 w-4 mr-2" /> Perfil
                </TabsTrigger>
                <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <FileText className="h-4 w-4 mr-2" /> Notas
                </TabsTrigger>
                <TabsTrigger value="history" disabled={!editingCustomer} className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <History className="h-4 w-4 mr-2" /> Histórico
                </TabsTrigger>
              </TabsList>

              {/* PROFILE TAB */}
              <TabsContent value="profile">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Card className="border-gray-100 shadow-sm">
                    <CardContent className="pt-6 space-y-4">

                      {/* Block Toggle */}
                      <div className={`flex items-center justify-between p-4 rounded-xl border ${formData.is_blocked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex items-center gap-3">
                          {formData.is_blocked ? <Ban className="h-6 w-6 text-red-600" /> : <CheckCircle className="h-6 w-6 text-green-600" />}
                          <div>
                            <h4 className={`font-bold ${formData.is_blocked ? 'text-red-900' : 'text-green-900'}`}>
                              {formData.is_blocked ? 'Cliente Bloqueado' : 'Cliente Ativo'}
                            </h4>
                            <p className={`text-xs ${formData.is_blocked ? 'text-red-700' : 'text-green-700'}`}>
                              {formData.is_blocked ? 'Este cliente não poderá realizar novos pedidos.' : 'Este cliente pode pedir normalmente.'}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={formData.is_blocked}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_blocked: checked })}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Nome Completo</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                            className="bg-gray-50/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(00) 00000-0000"
                            required
                            className="bg-gray-50/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="order_type">Modo Preferido (Último)</Label>
                        <Select
                          value={formData.order_type}
                          onValueChange={(value: "delivery" | "counter" | "room") =>
                            setFormData({ ...formData, order_type: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-50/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="counter">Balcão (Retirada)</SelectItem>
                            <SelectItem value="delivery">Delivery</SelectItem>
                            <SelectItem value="room">Consumo Local / Quarto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.order_type === "room" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                          <Label htmlFor="room_number">Número do Quarto / Mesa</Label>
                          <Input
                            id="room_number"
                            value={formData.room_number || ''}
                            onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                            required
                          />
                        </div>
                      )}

                      {formData.order_type === "delivery" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                          <Label htmlFor="address">Endereço de Entrega</Label>
                          <Textarea
                            id="address"
                            value={formData.address || ''}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            required
                            rows={3}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1 h-12 text-base font-bold">
                      {editingCustomer ? "Salvar Alterações" : "Criar Cliente"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="h-12 border-gray-200">
                      Cancelar
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* NOTES TAB */}
              <TabsContent value="notes">
                <Card className="border-gray-100 shadow-sm h-[400px] flex flex-col">
                  <CardContent className="pt-6 flex-1 flex flex-col gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-800 text-sm">
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <FileText className="h-4 w-4" />
                        Atenção
                      </div>
                      Estas anotações são **internas**. O cliente nunca terá acesso a elas. Use para registrar preferências, incidentes ou dicas de atendimento.
                    </div>

                    <div className="flex-1">
                      <Label className="mb-2 block">Anotações Internas</Label>
                      <Textarea
                        value={formData.internal_notes}
                        onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                        placeholder="Ex: Cliente prefere coca-cola sem gelo; Não gosta de cebola; Já reclamou da entrega..."
                        className="h-full resize-none bg-yellow-50/30 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-200"
                      />
                    </div>
                  </CardContent>
                </Card>
                <Button onClick={handleSubmit} className="w-full mt-4 h-12 bg-yellow-500 hover:bg-yellow-600 text-white font-bold">
                  Salvar Notas
                </Button>
              </TabsContent>

              {/* HISTORY TAB */}
              <TabsContent value="history">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                      <span className="text-xs text-muted-foreground uppercase font-bold">Total Gasto (LTV)</span>
                      <div className="text-2xl font-black text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(editingCustomer?.totalSpent || 0)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <span className="text-xs text-muted-foreground uppercase font-bold">Total Pedidos</span>
                      <div className="text-2xl font-black text-gray-700">
                        {editingCustomer?.totalOrders || 0}
                      </div>
                    </div>
                  </div>

                  <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider mt-4">Últimos Pedidos</h4>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {editingCustomer?.orders?.map((order) => (
                      <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-primary/20 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <Badge variant="outline" className="mb-1">#{order.order_number}</Badge>
                            <p className="text-xs text-gray-400 font-medium">
                              {format(new Date(order.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-800">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                            </div>
                            <span className={`text-[10px] uppercase font-bold ${order.status === 'completed' ? 'text-green-600' :
                                order.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'
                              }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 border-t border-gray-50 pt-2">
                          {order.order_items.map((item, idx) => (
                            <span key={idx}>{item.quantity}x {item.product_name}{idx < order.order_items.length - 1 ? ', ' : ''}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {(!editingCustomer?.orders || editingCustomer.orders.length === 0) && (
                      <p className="text-center text-gray-400 py-8 italic">Nenhum pedido registrado.</p>
                    )}
                  </div>
                </div>
              </TabsContent>

            </Tabs>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou quarto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 shadow-sm"
        />
      </div>

      {/* Customers Table */}
      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Histórico</TableHead>
                <TableHead>Favorito</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => handleEdit(customer)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold transition-all ${customer.is_blocked ? 'bg-red-100 text-red-600 ring-2 ring-red-200' : 'bg-primary/10 text-primary'
                        }`}>
                        {customer.is_blocked ? <Ban className="h-5 w-5" /> : customer.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className={`font-medium ${customer.is_blocked ? 'text-red-900 line-through decoration-red-300' : ''}`}>
                          {customer.full_name}
                        </span>
                        {customer.order_type === "room" && customer.room_number && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Home className="h-3 w-3" /> {customer.room_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Phone className="h-3 w-3" /> {customer.phone}
                      </span>
                      {customer.internal_notes && (
                        <span className="flex items-center gap-1 text-[10px] text-yellow-600 bg-yellow-50 w-fit px-1.5 py-0.5 rounded-full mt-1">
                          <FileText className="h-3 w-3" /> Possui anotações
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.is_blocked ? (
                      <Badge variant="destructive" className="uppercase text-[10px]">Bloqueado</Badge>
                    ) : (
                      getOrderTypeBadge(customer.order_type)
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="font-bold text-gray-700">{customer.totalOrders} pedidos</span>
                      <span className="text-emerald-600 font-bold text-xs">
                        LTV: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(customer.totalSpent || 0)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block max-w-[120px] truncate" title={customer.favoriteItem}>
                      {customer.favoriteItem || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-gray-100"
                        onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}
                      >
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">Nenhum cliente encontrado</p>
                    <p className="text-sm text-gray-400">Tente buscar por outro termo</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
