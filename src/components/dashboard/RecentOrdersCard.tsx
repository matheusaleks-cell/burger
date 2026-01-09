import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/hooks/useOrders";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Store, Utensils } from "lucide-react";

interface RecentOrdersCardProps {
    orders: Order[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const StatusBadge = ({ status }: { status: string }) => {
    const configs: Record<string, { label: string; className: string }> = {
        pending: { label: "Aguardando", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
        preparing: { label: "Preparando", className: "bg-blue-100 text-blue-700 border-blue-200" },
        ready: { label: "Pronto", className: "bg-green-100 text-green-700 border-green-200" },
        delivered: { label: "Entregue", className: "bg-gray-100 text-gray-700 border-gray-200" },
        cancelled: { label: "Cancelado", className: "bg-red-100 text-red-700 border-red-200" },
    };

    const config = configs[status] || { label: status, className: "bg-gray-100 text-gray-600" };

    return (
        <Badge variant="outline" className={`font-bold border px-2.5 py-0.5 ${config.className}`}>
            {config.label}
        </Badge>
    );
};

const OrderTypeIcon = ({ type, room }: { type: string, room?: string | null }) => {
    switch (type) {
        case 'room':
            return <><MapPin className="h-3 w-3 mr-1" /> Quarto {room}</>;
        case 'delivery':
            return <><Utensils className="h-3 w-3 mr-1" /> Delivery</>;
        case 'counter':
            return <><Store className="h-3 w-3 mr-1" /> Balcão</>;
        default:
            return <><Clock className="h-3 w-3 mr-1" /> {type}</>;
    }
};

export const RecentOrdersCard = ({ orders }: RecentOrdersCardProps) => {
    return (
        <Card className="border-none shadow-md bg-white overflow-hidden animate-fade-in">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-black text-gray-800 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Pedidos Recentes
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-lg">Pedido</th>
                                <th className="px-6 py-4">Cliente / Local</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right rounded-tr-lg">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium">
                                        Nenhum pedido recente encontrado
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                                                #{order.order_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">
                                                {order.customers?.full_name || "Cliente"}
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                                <OrderTypeIcon type={order.order_type} room={order.room_number} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900">
                                            {formatCurrency(Number(order.total))}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};
