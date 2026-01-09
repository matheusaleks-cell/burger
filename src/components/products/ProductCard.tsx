import { Product } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Package, Clock } from "lucide-react";

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
    onToggleActive: (product: Product) => void;
    onToggleAvailable: (product: Product) => void;
}

export const ProductCard = ({
    product,
    onEdit,
    onDelete,
    onToggleActive,
    onToggleAvailable,
}: ProductCardProps) => {

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    return (
        <Card
            className={`glass-card transition-all hover:shadow-lg ${!product.is_active || !product.is_available ? "opacity-60" : ""
                }`}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                        {product.categories && (
                            <Badge variant="secondary" className="mt-1">
                                {product.categories.name}
                            </Badge>
                        )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(product)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(product.id)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-lg"
                    />
                ) : (
                    <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                )}

                {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                    </p>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                        {formatCurrency(product.price)}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {product.prep_time_minutes} min
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                        {product.is_active ? "Ativo" : "Inativo"}
                    </span>
                    <Switch
                        checked={product.is_active}
                        onCheckedChange={() => onToggleActive(product)}
                    />
                </div>

                <div className={`flex items-center justify-between mt-3 p-2 rounded-lg transition-colors ${product.is_available ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                    <span className={`text-sm font-bold ${product.is_available ? "text-green-700" : "text-red-700"}`}>
                        {product.is_available ? "Disponível" : "Esgotado"}
                    </span>
                    <Switch
                        checked={!!product.is_available}
                        onCheckedChange={() => onToggleAvailable(product)}
                        className={product.is_available ? "data-[state=checked]:bg-green-600" : "data-[state=unchecked]:bg-red-300"}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
