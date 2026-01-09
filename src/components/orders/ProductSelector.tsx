import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Category } from "@/hooks/useCategories";
import { Product } from "@/hooks/useProducts";
import { Package, Bed, ShoppingBasket, Coffee, Hotel } from "lucide-react";

interface ProductSelectorProps {
    categories: Category[];
    products: Product[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
    onAddItem: (productId: string) => void;
    cartItems: { product_id: string; quantity: number }[];
}

export const ProductSelector = ({
    categories,
    products,
    selectedCategory,
    onAddItem,
    cartItems
}: ProductSelectorProps) => {

    const getCategoryIcon = (categoryName: string) => {
        const name = categoryName.toLowerCase();
        if (name.includes("frigobar") || name.includes("lazer") || name.includes("kit")) {
            return <Package className="h-4 w-4" />;
        }
        if (name.includes("bebida") || name.includes("drink") || name.includes("vinho") || name.includes("cerveja")) {
            return <Coffee className="h-4 w-4" />;
        }
        if (name.includes("hospedagem") || name.includes("quarto") || name.includes("diária")) {
            return <Bed className="h-4 w-4" />;
        }
        return <ShoppingBasket className="h-4 w-4" />;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    return (
        <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
                <TabsTrigger value="all" className="text-xs gap-1">
                    <Hotel className="h-3 w-3" />
                    Todos
                </TabsTrigger>
                {categories.map((cat) => (
                    <TabsTrigger key={cat.id} value={cat.id} className="text-xs gap-1">
                        {getCategoryIcon(cat.name)}
                        {cat.name}
                    </TabsTrigger>
                ))}
            </TabsList>

            <TabsContent value="all" className="mt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1 text-left"> {/* Added text-left explicitly */}
                    {products.map((product) => {
                        const itemInCart = cartItems.find(i => i.product_id === product.id);
                        return (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => onAddItem(product.id)}
                                className={`p-3 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5 relative ${itemInCart ? "border-primary bg-primary/10" : "border-border"
                                    }`}
                            >
                                {itemInCart && (
                                    <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center">
                                        {itemInCart.quantity}
                                    </Badge>
                                )}
                                <p className="font-medium text-sm truncate">{product.name}</p>
                                <p className="text-primary font-bold text-sm">{formatCurrency(product.price)}</p>
                            </button>
                        );
                    })}
                </div>
            </TabsContent>

            {categories.map((cat) => (
                <TabsContent key={cat.id} value={cat.id} className="mt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1 text-left">
                        {products.filter(p => p.category_id === cat.id).map((product) => {
                            const itemInCart = cartItems.find(i => i.product_id === product.id);
                            return (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => onAddItem(product.id)}
                                    className={`p-3 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5 relative ${itemInCart ? "border-primary bg-primary/10" : "border-border"
                                        }`}
                                >
                                    {itemInCart && (
                                        <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center">
                                            {itemInCart.quantity}
                                        </Badge>
                                    )}
                                    <p className="font-medium text-sm truncate">{product.name}</p>
                                    <p className="text-primary font-bold text-sm">{formatCurrency(product.price)}</p>
                                </button>
                            );
                        })}
                    </div>
                </TabsContent>
            ))}
        </Tabs>
    );
};
