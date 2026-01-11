import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PopularItem } from "@/hooks/useDashboardStats";

interface PopularItemsCardProps {
    items: PopularItem[];
    isLoading?: boolean;
}

export function PopularItemsCard({ items, isLoading }: PopularItemsCardProps) {
    if (isLoading) {
        return <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-xl" />;
    }

    return (
        <Card className="col-span-1 border-gray-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-rose-500" />
                    Mais Vendidos
                </CardTitle>
                <Link to="/products" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    Ver Cardápio <ArrowRight className="w-3 h-3" />
                </Link>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            Nenhum item vendido ainda.
                        </div>
                    ) : (
                        items.map((item, index) => (
                            <div key={item.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        index === 1 ? 'bg-gray-100 text-gray-600' :
                                            index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'
                                        }`}>
                                        {index + 1}º
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</p>
                                        <p className="text-xs text-gray-400 font-medium">{item.count} pedidos</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-700">R$ {item.revenue.toFixed(2)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
