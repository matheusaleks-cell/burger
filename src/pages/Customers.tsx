import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Search, Phone, MapPin, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  order_type: "delivery" | "counter" | "room";
  room_number: string | null;
  address: string | null;
  created_at: string;
}

interface CustomerWithStats extends Customer {
  orders?: { id: string; total: number; created_at: string }[];
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    order_type: "counter" as "delivery" | "counter" | "room",
    room_number: "",
    address: "",
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
          total,
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
      toast.error("Erro ao carregar clientes");
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
    };

    if (editingCustomer) {
      const { error } = await supabase
        .from("customers")
        .update(customerData)
        .eq("id", editingCustomer.id);

      if (error) {
        toast.error("Erro ao atualizar cliente");
        return;
      }
      toast.success("Cliente atualizado!");
    } else {
      const { error } = await supabase.from("customers").insert(customerData);

      if (error) {
        toast.error("Erro ao criar cliente");
        return;
      }
      toast.success("Cliente criado!");
    }

    setIsDialogOpen(false);
    resetForm();
    fetchCustomers();
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      phone: customer.phone,
      order_type: customer.order_type,
      room_number: customer.room_number || "",
      address: customer.address || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e visualize estatísticas.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_type">Tipo de Pedido</Label>
                <Select
                  value={formData.order_type}
                  onValueChange={(value: "delivery" | "counter" | "room") =>
                    setFormData({ ...formData, order_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="counter">Balcão</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="room">Quarto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.order_type === "room" && (
                <div className="space-y-2">
                  <Label htmlFor="room_number">Número do Quarto</Label>
                  <Input
                    id="room_number"
                    value={formData.room_number}
                    onChange={(e) =>
                      setFormData({ ...formData, room_number: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              {formData.order_type === "delivery" && (
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              <Button type="submit" className="w-full">
                {editingCustomer ? "Salvar Alterações" : "Criar Cliente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou quarto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estatísticas</TableHead>
                <TableHead>Favorito</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {customer.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{customer.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {customer.phone}
                    </div>
                  </TableCell>
                  <TableCell>{getOrderTypeBadge(customer.order_type)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="font-bold text-gray-700">{customer.totalOrders} pedido(s)</span>
                      <span className="text-emerald-600 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(customer.totalSpent || 0)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-600 truncate max-w-[150px] block" title={(customer as any).favoriteItem}>
                      {(customer as any).favoriteItem || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {customer.order_type === "room" && customer.room_number && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Home className="h-4 w-4" />
                        Quarto {customer.room_number}
                      </div>
                    )}
                    {customer.order_type === "delivery" && customer.address && (
                      <div className="flex items-center gap-2 text-muted-foreground max-w-xs truncate">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {customer.address}
                      </div>
                    )}
                    {customer.order_type === "counter" && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(customer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum cliente encontrado</p>
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
