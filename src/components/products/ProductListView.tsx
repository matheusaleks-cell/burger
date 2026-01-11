import { Product } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Package, Clock, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductListViewProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
    onToggleActive: (product: Product) => void;
    onToggleAvailable: (product: Product) => void;
}

export function ProductListView({
    products,
    onEdit,
    onDelete,
    onToggleActive,
    onToggleAvailable,
}: ProductListViewProps) {
    if (products.length === 0) {
        return (
            <div className="col-span-full text-center py-12 animate-fade-in bg-white rounded-lg border border-dashed">
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

    // Group products by category
    const groupedProducts = products.reduce((acc, product) => {
        const categoryName = product.categories?.name || "Sem Categoria";
        if (!acc[categoryName]) {
            acc[categoryName] = [];
        }
        acc[categoryName].push(product);
        return acc;
    }, {} as Record<string, Product[]>);

    // Sort categories by display_order
    const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
        if (a === "Sem Categoria") return 1;
        if (b === "Sem Categoria") return -1;

        // Find a product in each group to access the category's display_order
        const catA = groupedProducts[a][0].categories;
        const catB = groupedProducts[b][0].categories;

        return (catA?.display_order || 999) - (catB?.display_order || 999);
    });

    // Sort products within categories
    sortedCategories.forEach(cat => {
        groupedProducts[cat].sort((a, b) => {
            return (a.display_order || 999) - (b.display_order || 999);
        });
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {sortedCategories.map((category) => (
                <CategoryGroup
                    key={category}
                    categoryName={category}
                    products={groupedProducts[category]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleActive={onToggleActive}
                    onToggleAvailable={onToggleAvailable}
                />
            ))}
        </div>
    );
}

function CategoryGroup({
    categoryName,
    products,
    onEdit,
    onDelete,
    onToggleActive,
    onToggleAvailable
}: {
    categoryName: string,
    products: Product[]
} & Omit<ProductListViewProps, 'products'>) {
    const [isOpen, setIsOpen] = useState(true);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                    <ChevronRight className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-90")} />
                    <h3 className="font-bold text-lg text-slate-800">{categoryName}</h3>
                    <Badge variant="secondary" className="ml-2 font-mono text-xs">
                        {products.length}
                    </Badge>
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="divide-y divide-gray-100">
                    {products.map((product) => (
                        <div key={product.id} className="group flex flex-col sm:flex-row items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                            {/* Image */}
                            <div className="shrink-0 relative">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-16 h-16 object-cover rounded-md shadow-sm border border-gray-100"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200">
                                        <Package className="h-6 w-6 text-gray-300" />
                                    </div>
                                )}
                                {!product.is_active && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-md flex items-center justify-center">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/80 px-1 rounded">Inativo</span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 text-center sm:text-left w-full sm:w-auto">
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                    <h4 className="font-semibold text-slate-900 truncate">{product.name}</h4>
                                    {product.promotional_price && (
                                        <Badge className="bg-green-500 hover:bg-green-600 text-xs px-1 h-5">Promo</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                    {product.description || "Sem descrição"}
                                </p>
                                <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-500">
                                    <span className="font-mono font-bold text-slate-900 text-base">
                                        {formatCurrency(product.price)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {product.prep_time_minutes} min
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-row sm:items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                                {/* Switches Group */}
                                <div className="flex items-center gap-6">
                                    {/* Active Switch */}
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Ativo</span>
                                        <Switch
                                            checked={product.is_active}
                                            onCheckedChange={() => onToggleActive(product)}
                                            className="data-[state=checked]:bg-slate-800"
                                        />
                                    </div>

                                    {/* Availability Switch */}
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Disponível</span>
                                        <Switch
                                            checked={!!product.is_available}
                                            onCheckedChange={() => onToggleAvailable(product)}
                                            className={product.is_available ? "data-[state=checked]:bg-green-600" : "data-[state=unchecked]:bg-red-300"}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 pl-4 border-l border-gray-100">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(product)}
                                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(product.id)}
                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
