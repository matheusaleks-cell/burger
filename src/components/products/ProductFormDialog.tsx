import { useState, useEffect } from "react";
import { Product, ProductInput } from "@/hooks/useProducts";
import { Category } from "@/hooks/useCategories";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAddons } from "@/hooks/useAddons";
import { usePousadas } from "@/hooks/usePousadas";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
    categories: Category[];
    onSubmit: (data: ProductInput & { id?: string; complementGroupIds?: string[] }) => void;
    isLoading?: boolean;
}

export const ProductFormDialog = ({
    open,
    onOpenChange,
    product,
    categories,
    onSubmit,
    isLoading
}: ProductFormDialogProps) => {
    const { addonGroups } = useAddons();
    const { pousadas } = usePousadas();
    const [activeTab, setActiveTab] = useState("details");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category_id: "",
        image_url: "",
        is_active: true,
        is_available: true,
        available_all: true,
        prep_time_minutes: "15",
        external_id: "",
        promotional_price: "",
        availability_status: "available",
        daily_stock: "",
    });

    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [selectedPousadaIds, setSelectedPousadaIds] = useState<string[]>([]);

    const { data: existingGroups } = useQuery({
        queryKey: ["product_groups", product?.id],
        queryFn: async () => {
            if (!product?.id) return [];
            const { data } = await supabase.from("product_complement_groups").select("complement_group_id").eq("product_id", product.id);
            return data?.map(d => d.complement_group_id) || [];
        },
        enabled: !!product?.id && open
    });

    useEffect(() => {
        if (open) {
            setActiveTab("details");
            if (product) {
                setFormData({
                    name: product.name,
                    description: product.description || "",
                    price: product.price.toString(),
                    category_id: product.category_id || "",
                    image_url: product.image_url || "",
                    is_active: product.is_active,
                    is_available: product.is_available ?? true,
                    available_all: product.available_all ?? true,
                    prep_time_minutes: product.prep_time_minutes.toString(),
                    external_id: product.external_id || "",
                    promotional_price: product.promotional_price?.toString() || "",
                    availability_status: product.availability_status || "available",
                    daily_stock: product.daily_stock?.toString() || "",
                });
                // Initialize Pousada selection
                setSelectedPousadaIds(product.pousada_ids || []);
            } else {
                setFormData({
                    name: "",
                    description: "",
                    price: "",
                    category_id: "",
                    image_url: "",
                    is_active: true,
                    is_available: true,
                    available_all: true,
                    prep_time_minutes: "15",
                    external_id: "",
                    promotional_price: "",
                    availability_status: "available",
                    daily_stock: "",
                });
                setSelectedGroupIds([]);
                setSelectedPousadaIds([]);
            }
        }
    }, [open, product]);

    useEffect(() => {
        if (existingGroups && product) {
            setSelectedGroupIds(existingGroups);
        } else if (!product) {
            setSelectedGroupIds([]);
        }
    }, [existingGroups, product]);

    const handleGroupToggle = (groupId: string) => {
        setSelectedGroupIds(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        );
    };

    const handlePousadaToggle = (pousadaId: string) => {
        setSelectedPousadaIds(prev =>
            prev.includes(pousadaId)
                ? prev.filter(id => id !== pousadaId)
                : [...prev, pousadaId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.category_id) {
            alert("Por favor, selecione uma categoria.");
            return;
        }

        const submittedData: ProductInput & { id?: string; complementGroupIds?: string[] } = {
            id: product?.id,
            name: formData.name,
            description: formData.description || null,
            price: parseFloat(formData.price),
            category_id: formData.category_id || null,
            image_url: formData.image_url || null,
            is_active: formData.is_active,
            is_available: formData.is_available,
            available_all: formData.available_all,
            prep_time_minutes: parseInt(formData.prep_time_minutes),
            display_order: product?.display_order || 0,
            external_id: formData.external_id || null,
            promotional_price: formData.promotional_price ? parseFloat(formData.promotional_price) : null,
            availability_status: formData.availability_status,
            daily_stock: formData.daily_stock ? parseInt(formData.daily_stock) : null,
            complementGroupIds: selectedGroupIds,
            pousada_ids: selectedPousadaIds
        };

        onSubmit(submittedData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {product ? "Editar Produto" : "Novo Produto"}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Detalhes</TabsTrigger>
                        <TabsTrigger value="addons">Complementos ({selectedGroupIds.length})</TabsTrigger>
                        <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto mt-2 px-1">
                        <TabsContent value="details" className="space-y-4 data-[state=activie]:block">
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Preço Base (R$) *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price}
                                            onChange={(e) =>
                                                setFormData({ ...formData, price: e.target.value })
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="promotional_price">Preço Promocional (R$)</Label>
                                        <Input
                                            id="promotional_price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.promotional_price}
                                            onChange={(e) =>
                                                setFormData({ ...formData, promotional_price: e.target.value })
                                            }
                                            placeholder="Opcional"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Categoria *</Label>
                                        <Select
                                            value={formData.category_id}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, category_id: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="prep_time">Tempo Preparo (min)</Label>
                                        <Input
                                            id="prep_time"
                                            type="number"
                                            min="1"
                                            value={formData.prep_time_minutes}
                                            onChange={(e) =>
                                                setFormData({ ...formData, prep_time_minutes: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="availability_status">Status de Disponibilidade</Label>
                                        <Select
                                            value={formData.availability_status}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, availability_status: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="available">Disponível</SelectItem>
                                                <SelectItem value="unavailable">Esgotado (Indisponível)</SelectItem>
                                                <SelectItem value="paused">Pausado (Oculto)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="daily_stock">Estoque Diário</Label>
                                        <Input
                                            id="daily_stock"
                                            type="number"
                                            min="0"
                                            value={formData.daily_stock}
                                            onChange={(e) =>
                                                setFormData({ ...formData, daily_stock: e.target.value })
                                            }
                                            placeholder="Infinito se vazio"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="external_id">ID Externo (PDV)</Label>
                                    <Input
                                        id="external_id"
                                        value={formData.external_id}
                                        onChange={(e) =>
                                            setFormData({ ...formData, external_id: e.target.value })
                                        }
                                        placeholder="Ref. externa"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="image_url">URL da Imagem</Label>
                                    <Input
                                        id="image_url"
                                        type="url"
                                        value={formData.image_url}
                                        onChange={(e) =>
                                            setFormData({ ...formData, image_url: e.target.value })
                                        }
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="is_active">Produto Ativo no Sistema</Label>
                                        <div className="text-xs text-muted-foreground">Desative para remover do cardápio permanentemente</div>
                                    </div>
                                    <Switch
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, is_active: checked })
                                        }
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="addons" className="space-y-4 h-full">
                            <div className="rounded-md border p-4 bg-muted/10 h-full">
                                <Label className="mb-4 block text-base">Selecione os grupos de complementos para este produto:</Label>
                                <ScrollArea className="h-[300px] w-full rounded-md border p-2 bg-background">
                                    <div className="space-y-3">
                                        {addonGroups.length === 0 && <p className="text-sm text-muted-foreground p-2">Nenhum grupo cadastrado.</p>}
                                        {addonGroups.map(group => (
                                            <div key={group.id} className="flex items-center space-x-2 border-b last:border-0 pb-2 last:pb-0">
                                                <Checkbox
                                                    id={`group-${group.id}`}
                                                    checked={selectedGroupIds.includes(group.id)}
                                                    onCheckedChange={() => handleGroupToggle(group.id)}
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label
                                                        htmlFor={`group-${group.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {group.name}
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {group.min_quantity > 0 ? `Obrigatório (Min ${group.min_quantity})` : "Opcional"} • Max: {group.max_quantity || "Ilimitado"}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </TabsContent>

                        <TabsContent value="availability" className="space-y-4 h-full">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Disponível em todas as filiais</Label>
                                        <div className="text-sm text-muted-foreground">
                                            Se ativado, este produto aparecerá em todas as pousadas cadastradas.
                                        </div>
                                    </div>
                                    <Switch
                                        checked={formData.available_all}
                                        onCheckedChange={(checked) => setFormData({ ...formData, available_all: checked })}
                                    />
                                </div>

                                {!formData.available_all && (
                                    <div className="rounded-md border p-4 bg-muted/10">
                                        <Label className="mb-4 block text-base">Selecione as pousadas onde este produto estará disponível:</Label>
                                        <ScrollArea className="h-[300px] w-full rounded-md border p-2 bg-background">
                                            <div className="space-y-3">
                                                {pousadas.length === 0 && <p className="text-sm text-muted-foreground p-2">Nenhuma pousada cadastrada.</p>}
                                                {pousadas.map(pousada => (
                                                    <div key={pousada.id} className="flex items-center space-x-2 border-b last:border-0 pb-2 last:pb-0">
                                                        <Checkbox
                                                            id={`pousada-${pousada.id}`}
                                                            checked={selectedPousadaIds.includes(pousada.id)}
                                                            onCheckedChange={() => handlePousadaToggle(pousada.id)}
                                                        />
                                                        <div className="grid gap-1.5 leading-none">
                                                            <label
                                                                htmlFor={`pousada-${pousada.id}`}
                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                            >
                                                                {pousada.name}
                                                            </label>
                                                            <p className="text-xs text-muted-foreground">
                                                                {pousada.address}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <div className="mt-6">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {product ? "Salvar Alterações" : "Criar Produto"}
                            </Button>
                        </div>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
