import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, ImageIcon } from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface Category {
    id: string;
    name: string;
}

interface ProductListProps {
    products: Product[];
    categories: Category[];
    selectedCategory: string;
    searchQuery: string;
    onProductClick: (product: Product) => void;
    isDeliveryMode?: boolean;
}

export function ProductList({
    products,
    categories,
    selectedCategory,
    searchQuery,
    onProductClick,
    isDeliveryMode,
}: ProductListProps) {
    const filteredProducts = products.filter((product) => {
        const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
        const matchesSearch =
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    if (filteredProducts.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl mt-10">
                <Search className="h-16 w-16 mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold">Nenhum item encontrado</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-24">
            {categories
                .filter((cat) => selectedCategory === "all" || selectedCategory === cat.id)
                .map((category) => {
                    const catProducts = filteredProducts.filter((p) => p.category_id === category.id);
                    if (catProducts.length === 0) return null;

                    return (
                        <div key={category.id} className="space-y-4">
                            <h3 className={`text-xl font-bold ml-1 ${isDeliveryMode ? 'text-emerald-900' : 'text-gray-800'}`}>{category.name}</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {catProducts.map((product) => (
                                    <Card
                                        key={product.id}
                                        className={`group relative flex overflow-hidden border bg-white shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl cursor-pointer ${isDeliveryMode
                                                ? 'border-emerald-100 hover:border-emerald-300'
                                                : 'border-gray-100 hover:border-primary/20'
                                            }`}
                                        onClick={() => onProductClick(product)}
                                    >
                                        {/* Content Section */}
                                        <div className="flex-1 p-5 flex flex-col justify-between z-10">
                                            <div className="space-y-2">
                                                <h4 className={`font-bold text-lg leading-tight transition-colors ${isDeliveryMode ? 'text-gray-900 group-hover:text-emerald-700' : 'text-gray-800 group-hover:text-primary'
                                                    }`}>
                                                    {product.name}
                                                </h4>
                                                <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed font-medium">
                                                    {product.description || "Delicioso e preparado na hora."}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between mt-4">
                                                <span className={`font-black text-lg ${isDeliveryMode ? 'text-emerald-700' : 'text-gray-900'}`}>
                                                    {formatCurrency(product.price)}
                                                </span>
                                                <Button
                                                    size="icon"
                                                    className={`h-9 w-9 rounded-xl text-white shadow-lg transition-all duration-300 shrink-0 ${isDeliveryMode
                                                            ? 'bg-emerald-600 shadow-emerald-200 group-hover:bg-emerald-700 group-hover:shadow-emerald-300'
                                                            : 'bg-gray-900 shadow-gray-900/20 group-hover:bg-primary group-hover:shadow-primary/30'
                                                        }`}
                                                >
                                                    <Plus className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Image Section */}
                                        {product.image_url ? (
                                            <div className="w-32 h-auto relative shrink-0">
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/5" />
                                            </div>
                                        ) : (
                                            <div className={`w-32 flex items-center justify-center shrink-0 relative overflow-hidden ${isDeliveryMode ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                                                <ImageIcon className={`h-8 w-8 relative z-10 ${isDeliveryMode ? 'text-emerald-200' : 'text-gray-300'}`} />
                                                {/* Decorative pattern */}
                                                <div className="absolute inset-0 opacity-[0.03]"
                                                    style={{
                                                        backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                                                        backgroundSize: "10px 10px"
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </div>
                    );
                })}
        </div>
    );
}
