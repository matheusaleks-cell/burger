import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Order } from "@/hooks/useOrders";
import { Eye, MapPin, Store, Utensils, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderTableProps {
    orders: Order[];
    onViewClick: (order: Order) => void;
    onStatusUpdate: (orderId: string, status: Order["status"]) => void;
    onCancelClick: (orderId: string) => void;
    onDeleteClick: (orderId: string) => void;
}

const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
        pending: { label: "Aguardando", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200" },
        preparing: { label: "Preparando", className: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200" },
        ready: { label: "Pronto", className: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" },
        delivered: { label: "Entregue", className: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200" },
        cancelled: { label: "Cancelado", className: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200" },
    };
    return configs[status] || { label: status, className: "bg-gray-100 text-gray-600" };
};

const getOrderTypeIcon = (type: string) => {
    switch (type) {
        case 'room': return <MapPin className="h-4 w-4 mr-1 text-primary" />;
        case 'delivery': return <Utensils className="h-4 w-4 mr-1 text-orange-500" />;
        case 'counter': return <Store className="h-4 w-4 mr-1 text-blue-500" />;
        default: return null;
    }
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export function OrderTable({
    orders,
    onViewClick,
    onStatusUpdate,
    onCancelClick,
    onDeleteClick,
}: OrderTableProps) {
    if (orders.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-lg border border-dashed">
                <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden animate-fade-in">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow>
                        <TableHead className="w-[100px]">Pedido</TableHead>
                        <TableHead>Cliente / Local</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        return (
                            <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="font-medium">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                                        #{order.order_number}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="font-bold text-gray-800 text-sm">{order.customers?.full_name || "Cliente"}</div>
                                    <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                        {getOrderTypeIcon(order.order_type)}
                                        {order.order_type === 'room' && `Quarto ${order.room_number}`}
                                        {order.order_type === 'counter' && 'Balcão'}
                                        {order.order_type === 'delivery' && 'Delivery'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="max-w-[200px] truncate text-xs text-muted-foreground" title={order.order_items?.map(i => `${i.quantity}x ${i.product_name}`).join(", ")}>
                                        {order.order_items?.length
                                            ? `${order.order_items[0].quantity}x ${order.order_items[0].product_name}${order.order_items.length > 1 ? ` +${order.order_items.length - 1}` : ''}`
                                            : "Sem itens"}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`font-bold border px-2.5 py-0.5 cursor-pointer ${statusConfig.className}`}>
                                        {statusConfig.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {format(new Date(order.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                </TableCell>
                                <TableCell className="text-right font-black text-gray-900">
                                    {formatCurrency(Number(order.total))}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Actions could be dropdown or direct buttons */}
                                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onCancelClick(order.id)} title="Cancelar">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDeleteClick(order.id)} title="Apagar">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
