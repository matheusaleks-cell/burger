import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Hotel, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pousada } from "@/hooks/usePousadas";
import { useCategories } from "@/hooks/useCategories";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Pousadas() {
  const { isAdmin } = useAuth();
  const [pousadas, setPousadas] = useState<Pousada[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPousada, setEditingPousada] = useState<Pousada | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    address: "",
    delivery_fee: "", // Legacy flat fee (used as fallback or base)
    latitude: "",
    longitude: "",
    delivery_radius_km: "5",
    base_delivery_fee: "0",
    fee_per_km: "1.50",
    fee_per_km: "1.50",
    is_hq: false,
    slug: "",
    ask_room: true,
    hidden_categories: [] as string[]
  });

  const { data: categories = [] } = useCategories();

  useEffect(() => {
    fetchPousadas();
  }, []);

  const fetchPousadas = async () => {
    const { data, error } = await supabase
      .from("pousadas")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Erro ao carregar pousadas");
      return;
    }

    setPousadas(data as Pousada[] || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    // Helper to sanitize numeric input
    const sanitizeNumber = (val: string) => {
      if (!val) return "";
      return val.replace(",", ".");
    };

    // Parse numeric values
    const deliveryFee = parseFloat(sanitizeNumber(form.delivery_fee)) || 0;
    const lat = form.latitude ? parseFloat(sanitizeNumber(form.latitude)) : null;
    const lng = form.longitude ? parseFloat(sanitizeNumber(form.longitude)) : null;
    const radius = parseFloat(sanitizeNumber(form.delivery_radius_km)) || 5;
    const baseFee = parseFloat(sanitizeNumber(form.base_delivery_fee)) || 0;
    const kmFee = parseFloat(sanitizeNumber(form.fee_per_km)) || 0;

    const pousadaData = {
      name: form.name.trim(),
      address: form.address.trim(),
      delivery_fee: deliveryFee,
      latitude: lat,
      longitude: lng,
      delivery_radius_km: radius,
      base_delivery_fee: baseFee,
      fee_per_km: kmFee,
      fee_per_km: kmFee,
      is_hq: form.is_hq,
      slug: form.slug ? form.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : null,
      ask_room: form.ask_room,
      hidden_categories: form.hidden_categories || []
    };

    console.log("Submitting Pousada Data:", pousadaData);

    if (editingPousada) {
      console.log("Updating ID:", editingPousada.id);
      const { data: updateData, error } = await supabase
        .from("pousadas")
        .update(pousadaData)
        .eq("id", editingPousada.id)
        .select();

      console.log("Update Result - Data:", updateData, "Error:", error);

      if (error) {
        toast.error("Erro ao atualizar pousada: " + error.message);
        return;
      }
      toast.success("Pousada atualizada!");
    } else {
      const { error } = await supabase.from("pousadas").insert(pousadaData);

      if (error) {
        toast.error("Erro ao criar pousada");
        return;
      }
      toast.success("Pousada criada!");
    }

    setIsDialogOpen(false);
    resetForm();
    fetchPousadas();
  };

  const handleEdit = (pousada: Pousada) => {
    setEditingPousada(pousada);
    setForm({
      name: pousada.name,
      address: pousada.address || "",
      delivery_fee: pousada.delivery_fee?.toString() || "0",
      latitude: pousada.latitude?.toString() || "",
      longitude: pousada.longitude?.toString() || "",
      delivery_radius_km: pousada.delivery_radius_km?.toString() || "5",
      base_delivery_fee: pousada.base_delivery_fee?.toString() || "0",
      fee_per_km: pousada.fee_per_km?.toString() || "1.50",
      is_hq: pousada.is_hq || false,
      slug: pousada.slug || "",
      ask_room: pousada.ask_room !== false, // If undefined, treat as true
      hidden_categories: pousada.hidden_categories || []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta pousada?")) return;

    const { error } = await supabase.from("pousadas").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir pousada");
      return;
    }

    toast.success("Pousada excluída!");
    fetchPousadas();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("pousadas")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    toast.success(`Pousada ${!currentStatus ? "ativada" : "desativada"}!`);
    fetchPousadas();
  };

  const resetForm = () => {
    setEditingPousada(null);
    setForm({
      name: "",
      address: "",
      delivery_fee: "",
      latitude: "",
      longitude: "",
      delivery_radius_km: "5",
      base_delivery_fee: "0",
      fee_per_km: "1.50",
      is_hq: false,
      slug: "",
      hidden_categories: []
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso não autorizado</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Hotel className="h-8 w-8 text-primary" />
          Pousadas & Delivery
        </h1>
        <p className="text-muted-foreground">
          Gerencie locais, taxas de entrega e áreas de cobertura.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Locais Cadastrados</CardTitle>
              <CardDescription>
                Pousadas, Filiais ou Pontos de Delivery.
              </CardDescription>
            </div>

            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Local
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPousada ? "Editar Local" : "Novo Local"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="name">Nome do Local</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Ex: Pousada Central"
                        required
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="slug">Slug (URL Amigável)</Label>
                      <Input
                        id="slug"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        placeholder="Ex: adega-do-gordo"
                      />
                      <p className="text-xs text-muted-foreground">
                        Link: {window.location.origin}/?parceiro={form.slug || '...'}
                      </p>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="address">Endereço Completo</Label>
                      <Input
                        id="address"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Ex: Av. Principal, 1000 - Centro"
                        required
                      />
                    </div>

                    <div className="col-span-2 border-t pt-4 mt-2">
                      <h4 className="font-semibold text-sm mb-2 text-primary flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Configuração de Entrega (Raio)
                      </h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        Para cálculo automático, preencha as coordenadas. Você pode obter no Google Maps clicando com botão direito no local.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                        placeholder="Ex: -23.550520"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                        placeholder="Ex: -46.633308"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="radius">Raio Máx. (km)</Label>
                      <Input
                        id="radius"
                        type="number"
                        value={form.delivery_radius_km}
                        onChange={(e) => setForm({ ...form, delivery_radius_km: e.target.value })}
                        placeholder="5"
                      />
                    </div>

                    <div className="space-y-2">
                      {/* Spacer */}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="base_fee">Taxa Base (R$)</Label>
                      <Input
                        id="base_fee"
                        type="number"
                        step="0.50"
                        value={form.base_delivery_fee}
                        onChange={(e) => setForm({ ...form, base_delivery_fee: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="km_fee">Preço por Km (R$)</Label>
                      <Input
                        id="km_fee"
                        type="number"
                        step="0.10"
                        value={form.fee_per_km}
                        onChange={(e) => setForm({ ...form, fee_per_km: e.target.value })}
                        placeholder="1.50"
                      />
                    </div>
                    <div className="space-y-4 col-span-2 border p-4 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="ask_room"
                          checked={form.ask_room !== false}
                          onCheckedChange={(checked) => setForm({ ...form, ask_room: checked })}
                        />
                        <Label htmlFor="ask_room">Pedir "Quarto/Mesa"? (Desmarque para parceiros que não precisam)</Label>
                      </div>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Categorias Ocultas (Não exibir neste cardápio)</Label>
                      <ScrollArea className="h-[150px] w-full border rounded-md p-4">
                        <div className="grid grid-cols-2 gap-4">
                          {categories.map((cat) => (
                            <div key={cat.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`cat-${cat.id}`}
                                checked={form.hidden_categories.includes(cat.id)}
                                onCheckedChange={(checked) => {
                                  let newHidden = [...form.hidden_categories];
                                  if (checked) {
                                    newHidden.push(cat.id);
                                  } else {
                                    newHidden = newHidden.filter(id => id !== cat.id);
                                  }
                                  setForm({ ...form, hidden_categories: newHidden });
                                }}
                              />
                              <Label
                                htmlFor={`cat-${cat.id}`}
                                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {cat.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>


                  <Button type="submit" className="w-full mt-6">
                    {editingPousada ? "Salvar Alterações" : "Criar Local"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {pousadas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum local cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Config. Entrega</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pousadas.map((pousada) => (
                  <TableRow key={pousada.id}>
                    <TableCell className="font-medium">
                      {pousada.name}
                      {pousada.is_hq && (
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
                          🏠 LOJA PRINCIPAL
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={pousada.address}>
                      {pousada.address}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs space-y-1">
                        {pousada.is_hq ? (
                          <>
                            <Badge variant="outline" className="w-fit text-green-600 border-green-200 bg-green-50">
                              Raio: {pousada.delivery_radius_km}km
                            </Badge>
                            <span className="text-muted-foreground">
                              Base: R${pousada.base_delivery_fee?.toFixed(2)} + R${pousada.fee_per_km?.toFixed(2)}/km
                            </span>
                          </>
                        ) : (
                          <>
                            <Badge variant="outline" className="w-fit text-blue-600 border-blue-200 bg-blue-50">
                              Fixo
                            </Badge>
                            <span className="text-muted-foreground font-medium">
                              Taxa Fixa: R${pousada.delivery_fee?.toFixed(2)}
                            </span>
                          </>
                        )}
                        {pousada.slug && (
                          <div className="mt-2 pt-1 border-t border-dashed">
                            <a
                              href={`/?parceiro=${pousada.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                            >
                              🔗 Link do Parceiro
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={pousada.is_active}
                          onCheckedChange={() =>
                            handleToggleActive(pousada.id, pousada.is_active)
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(pousada)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pousada.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div >
  );
}
