import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCustomers } from "@/hooks/useCustomers";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Plus, ShoppingCart } from "lucide-react";
import { ProductSelector } from "./ProductSelector";
import { OrderCart } from "./OrderCart";

interface CreateOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CreateOrderDialog = ({ open, onOpenChange }: CreateOrderDialogProps) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { products } = useProducts();
    const { data: categories = [] } = useCategories();
    const { data: customers = [] } = useCustomers();

    const [formData, setFormData] = useState({
        customer_id: "",
        customer_name: "",
        order_type: "counter" as "delivery" | "counter" | "room",
        room_number: "",
        payment_method: "cash" as "pix" | "card" | "cash",
        notes: "",
        items: [] as { product_id: string; product_name: string; quantity: number; unit_price: number; notes?: string }[],
    });

    const [selectedCategory, setSelectedCategory] = useState("all");

    const resetForm = () => {
        setFormData({
            customer_id: "",
            customer_name: "",
            order_type: "counter",
            room_number: "",
            payment_method: "cash",
            notes: "",
            items: [],
        });
        setSelectedCategory("all");
    };

    const addItem = (productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        const existingItem = formData.items.find((i) => i.product_id === productId);
        if (existingItem) {
            setFormData({
                ...formData,
                items: formData.items.map((i) =>
                    i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i
                ),
            });
        } else {
            setFormData({
                ...formData,
                items: [
                    ...formData.items,
                    {
                        product_id: productId,
                        product_name: product.name,
                        quantity: 1,
                        unit_price: product.price,
                    },
                ],
            });
        }
    };

    const updateItemQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            setFormData({
                ...formData,
                items: formData.items.filter((i) => i.product_id !== productId),
            });
            return;
        }
        setFormData({
            ...formData,
            items: formData.items.map((i) =>
                i.product_id === productId ? { ...i, quantity } : i
            ),
        });
    };

    const calculateTotal = () => {
        return formData.items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.items.length === 0) {
            toast.error("Adicione pelo menos um item ao pedido");
            return;
        }

        const total = calculateTotal();
        const selectedCustomer = customers.find((c) => c.id === formData.customer_id);

        const orderData = {
            customer_id: formData.customer_id || null,
            order_type: selectedCustomer?.order_type || formData.order_type,
            room_number: selectedCustomer?.room_number || (formData.order_type === "room" ? formData.room_number : null),
            payment_method: formData.payment_method,
            notes: formData.customer_name || formData.room_number
                ? `Hóspede: ${formData.customer_name || "?"} | Quarto: ${formData.room_number || "?"}${formData.notes ? ` | Obs: ${formData.notes}` : ""}`
                : formData.notes || null,
            total,
            status: "pending" as const,
            created_by: user?.id,
        };

        const { data: newOrder, error: orderError } = await supabase
            .from("orders")
            .insert(orderData)
            .select()
            .single();

        if (orderError || !newOrder) {
            toast.error("Erro ao criar pedido");
            return;
        }

        const orderItems = formData.items.map((item) => ({
            order_id: newOrder.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            notes: item.notes || null,
        }));

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

        if (itemsError) {
            toast.error("Erro ao adicionar itens");
            return;
        }

        toast.success("Pedido criado com sucesso!");
        onOpenChange(false);
        resetForm();
        queryClient.invalidateQueries({ queryKey: ["orders"] });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Pedido
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Pedido</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Guest and Order Info */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4 mb-6 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-1 bg-primary rounded-full" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Identificação do Hóspede</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Número do Quarto *</Label>
                                <Input
                                    value={formData.room_number}
                                    onChange={(e) =>
                                        setFormData({ ...formData, room_number: e.target.value })
                                    }
                                    placeholder="Ex: 101"
                                    className="font-bold text-lg h-12 border-2 focus:border-primary"
                                    required
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-1 lg:col-span-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Nome do Hóspede / Cliente</Label>
                                <Input
                                    value={formData.customer_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, customer_name: e.target.value })
                                    }
                                    placeholder="Digite o nome para facilitar o controle"
                                    className="h-12 border-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Origem</Label>
                                <Select
                                    value={formData.order_type}
                                    onValueChange={(value: "delivery" | "counter" | "room") =>
                                        setFormData({ ...formData, order_type: value })
                                    }
                                >
                                    <SelectTrigger className="h-12 border-2 font-medium">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="counter">Recepção</SelectItem>
                                        <SelectItem value="room">Quarto</SelectItem>
                                        <SelectItem value="delivery">Delivery</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Método de Pagamento</Label>
                            <Select
                                value={formData.payment_method}
                                onValueChange={(value: "pix" | "card" | "cash") =>
                                    setFormData({ ...formData, payment_method: value })
                                }
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Dinheiro</SelectItem>
                                    <SelectItem value="card">Cartão</SelectItem>
                                    <SelectItem value="pix">Pix</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Product Selection */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 space-y-2">
                            <Label>Selecione os Produtos</Label>
                            <ProductSelector
                                categories={categories}
                                products={products}
                                selectedCategory={selectedCategory}
                                onSelectCategory={setSelectedCategory}
                                onAddItem={addItem}
                                cartItems={formData.items}
                            />
                        </div>

                        {/* Cart */}
                        <OrderCart
                            items={formData.items}
                            onUpdateQuantity={updateItemQuantity}
                            total={calculateTotal()}
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Ex: sem cebola, ponto da carne..."
                            rows={2}
                        />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={formData.items.length === 0}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Criar Pedido - {formatCurrency(calculateTotal())}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};
