import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Plus, Minus } from "lucide-react";

interface OrderCartProps {
    items: {
        product_id: string;
        product_name: string;
        unit_price: number;
        quantity: number;
    }[];
    onUpdateQuantity: (productId: string, quantity: number) => void;
    total: number;
}

export const OrderCart = ({ items, onUpdateQuantity, total }: OrderCartProps) => {

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Carrinho ({items.length})
            </Label>
            <div className="border rounded-lg p-3 bg-muted/30 min-h-32 max-h-64 overflow-y-auto">
                {items.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                        Selecione produtos ao lado
                    </p>
                ) : (
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div
                                key={item.product_id}
                                className="flex items-center justify-between gap-2 p-2 bg-background rounded-lg"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{item.product_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatCurrency(item.unit_price)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {items.length > 0 && (
                <div className="pt-3 border-t border-border">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(total)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
