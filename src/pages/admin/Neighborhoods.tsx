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
import { Map, Plus, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Neighborhood {
    id: string;
    name: string;
    fee: number;
    active: boolean;
}

export default function Neighborhoods() {
    const { isAdmin } = useAuth();
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Neighborhood | null>(null);

    // Form State
    const [form, setForm] = useState({
        name: "",
        fee: ""
    });

    useEffect(() => {
        fetchNeighborhoods();
    }, []);

    const fetchNeighborhoods = async () => {
        const { data, error } = await supabase
            .from("delivery_neighborhoods")
            .select("*")
            .order("name");

        if (error) {
            console.error("Error fetching neighborhoods:", error);
            // Fail silently or toast if critical, but table might not exist yet if migration wasn't run
            // toast.error("Erro ao carregar bairros"); 
            return;
        }

        setNeighborhoods(data as Neighborhood[] || []);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim()) {
            toast.error("Nome é obrigatório");
            return;
        }

        const fee = parseFloat(form.fee.replace(",", ".")) || 0;

        const neighborhoodData = {
            name: form.name.trim(),
            fee: fee
        };

        if (editingItem) {
            const { error } = await supabase
                .from("delivery_neighborhoods")
                .update(neighborhoodData)
                .eq("id", editingItem.id);

            if (error) {
                toast.error("Erro ao atualizar bairro");
                return;
            }
            toast.success("Bairro atualizado!");
        } else {
            const { error } = await supabase.from("delivery_neighborhoods").insert(neighborhoodData);

            if (error) {
                toast.error("Erro ao criar bairro");
                return;
            }
            toast.success("Bairro criado!");
        }

        setIsDialogOpen(false);
        resetForm();
        fetchNeighborhoods();
    };

    const handleEdit = (item: Neighborhood) => {
        setEditingItem(item);
        setForm({
            name: item.name,
            fee: item.fee.toString()
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este bairro?")) return;

        const { error } = await supabase.from("delivery_neighborhoods").delete().eq("id", id);

        if (error) {
            toast.error("Erro ao excluir bairro");
            return;
        }

        toast.success("Bairro excluído!");
        fetchNeighborhoods();
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from("delivery_neighborhoods")
            .update({ active: !currentStatus })
            .eq("id", id);

        if (error) {
            toast.error("Erro ao atualizar status");
            return;
        }

        toast.success(`Bairro ${!currentStatus ? "ativado" : "desativado"}!`);
        fetchNeighborhoods();
    };

    const resetForm = () => {
        setEditingItem(null);
        setForm({
            name: "",
            fee: ""
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
                    <Map className="h-8 w-8 text-primary" />
                    Gerenciar Bairros
                </h1>
                <p className="text-muted-foreground">
                    Gerencie os bairros atendidos e suas respectivas taxas de entrega.
                </p>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Bairros Cadastrados</CardTitle>
                            <CardDescription>
                                Lista de bairros disponíveis para delivery.
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
                                    Novo Bairro
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingItem ? "Editar Bairro" : "Novo Bairro"}
                                    </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome do Bairro</Label>
                                        <Input
                                            id="name"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="Ex: Centro"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fee">Taxa de Entrega (R$)</Label>
                                        <Input
                                            id="fee"
                                            type="number"
                                            step="0.50"
                                            value={form.fee}
                                            onChange={(e) => setForm({ ...form, fee: e.target.value })}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>

                                    <Button type="submit" className="w-full mt-4">
                                        {editingItem ? "Salvar Alterações" : "Criar Bairro"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {neighborhoods.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhum bairro cadastrado.
                        </div>
                    ) : (
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-100/80">
                                    <TableRow className="h-8 hover:bg-transparent">
                                        <TableHead className="h-8 py-1 px-2 text-xs font-semibold text-slate-600 border-r">Nome</TableHead>
                                        <TableHead className="h-8 py-1 px-2 text-xs font-semibold text-slate-600 border-r w-[150px]">Taxa</TableHead>
                                        <TableHead className="h-8 py-1 px-2 text-xs font-semibold text-slate-600 border-r w-[100px] text-center">Status</TableHead>
                                        <TableHead className="h-8 py-1 px-2 text-xs font-semibold text-slate-600 text-center w-[100px]">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {neighborhoods.map((item, index) => (
                                        <TableRow
                                            key={item.id}
                                            className={`h-8 hover:bg-blue-50/50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                                        >
                                            <TableCell className="py-1 px-2 text-xs border-r border-slate-100 font-medium text-slate-700">
                                                {item.name}
                                            </TableCell>
                                            <TableCell className="py-1 px-2 text-xs border-r border-slate-100 text-slate-600 font-mono">
                                                R$ {item.fee.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="py-0 px-1 border-r border-slate-100 text-center align-middle">
                                                <div className="flex justify-center items-center h-full">
                                                    <Switch
                                                        className="scale-[0.6]"
                                                        checked={item.active}
                                                        onCheckedChange={() => handleToggleActive(item.id, item.active)}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-0 px-1 text-center align-middle">
                                                <div className="flex justify-center items-center gap-1 h-full">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 hover:bg-blue-100 text-slate-500 hover:text-blue-600"
                                                        onClick={() => handleEdit(item)}
                                                        title="Editar"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 hover:bg-red-100 text-slate-400 hover:text-red-600"
                                                        onClick={() => handleDelete(item.id)}
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
