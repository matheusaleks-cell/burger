import { Order } from "@/hooks/useOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, Home, Bike, Store, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderCardProps {
    order: Order;
    onViewClick: (order: Order) => void;
    onStatusUpdate: (orderId: string, status: Order["status"]) => void;
    onCancelClick: (orderId: string) => void;
    onDeleteClick: (orderId: string) => void;
}

export const OrderCard = ({
    order,
    onViewClick,
    onStatusUpdate,
    onCancelClick,
    onDeleteClick
}: OrderCardProps) => {

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: "Aguardando",
            preparing: "Preparando",
            ready: "Pronto",
            delivered: "Entregue",
            cancelled: "Cancelado",
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "status-pending",
            preparing: "status-preparing",
            ready: "status-ready",
            delivered: "status-delivered",
            cancelled: "status-cancelled",
        };
        return colors[status] || "";
    };

    const getOrderTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            delivery: "Delivery",
            counter: "Balcão",
            room: "Quarto",
        };
        return labels[type] || type;
    };

    const getOrderTypeIcon = (type: string) => {
        switch (type) {
            case "delivery": return <Bike className="h-4 w-4" />;
            case "room": return <Home className="h-4 w-4" />;
            default: return <Store className="h-4 w-4" />;
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    return (
        <Card className={`glass-card ${order.status === "ready" ? "ring-2 ring-success animate-pulse" : ""}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">Pedido #{order.order_number}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} border`}>
                        {getStatusLabel(order.status)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customers?.full_name || "Cliente não informado"}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                        {getOrderTypeIcon(order.order_type)}
                        {getOrderTypeLabel(order.order_type)}
                    </Badge>
                    {order.room_number && (
                        <Badge variant="secondary" className="gap-1">
                            <Home className="h-3 w-3" />
                            Quarto {order.room_number}
                        </Badge>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {order.status === "pending" && (
                        <Button
                            variant="default"
                            size="sm"
                            className="w-full bg-primary hover:bg-primary/90"
                            onClick={() => onStatusUpdate(order.id, "preparing")}
                        >
                            Iniciar Preparo
                        </Button>
                    )}
                    {order.status === "preparing" && (
                        <Button
                            variant="default"
                            size="sm"
                            className="w-full bg-success hover:bg-success/90 text-white"
                            onClick={() => onStatusUpdate(order.id, "ready")}
                        >
                            Marcar Pronto
                        </Button>
                    )}
                    {order.status === "ready" && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={() => onStatusUpdate(order.id, "delivered")}
                        >
                            Entregar
                        </Button>
                    )}
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-sm">
                    <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onViewClick(order)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => order.status === "cancelled" ? onDeleteClick(order.id) : onCancelClick(order.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
