import { Package } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
    onToggleActive: (product: Product) => void;
    onToggleAvailable: (product: Product) => void;
}

export function ProductGrid({
    products,
    onEdit,
    onDelete,
    onToggleActive,
    onToggleAvailable,
}: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="col-span-full text-center py-12 animate-fade-in">
                <div className="bg-gray-50 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-4">
                    <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                    Tente ajustar os filtros ou adicione um novo item ao cardápio.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleActive={onToggleActive}
                    onToggleAvailable={onToggleAvailable}
                />
            ))}
        </div>
    );
}
