import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Home, AlertTriangle, Play, CheckCircle2, Printer } from "lucide-react";
import { Order } from "@/hooks/useOrders";
import { differenceInMinutes, differenceInSeconds } from "date-fns";
import { useState, useEffect } from "react";
import { PrintableOrder } from "@/components/orders/PrintableOrder";

interface KitchenOrderCardProps {
    order: Order;
    onStartOrder: (id: string) => void;
    onFinishOrder: (id: string) => void;
}

export const KitchenOrderCard = ({ order, onStartOrder, onFinishOrder }: KitchenOrderCardProps) => {
    // Local timer for smooth updates
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const getTimeStatus = (): { minutes: number; status: "green" | "yellow" | "red" } => {
        const referenceTime = order.started_at || order.created_at;
        const minutes = differenceInMinutes(currentTime, new Date(referenceTime));
        const targetTime = 15;

        if (minutes < targetTime * 0.7) {
            return { minutes, status: "green" };
        } else if (minutes < targetTime) {
            return { minutes, status: "yellow" };
        } else {
            return { minutes, status: "red" };
        }
    };

    const formatTime = (): string => {
        const referenceTime = order.started_at || order.created_at;
        const totalSeconds = differenceInSeconds(currentTime, new Date(referenceTime));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    const getCardClass = (status: "green" | "yellow" | "red") => {
        const classes: Record<string, string> = {
            green: "kitchen-card-green",
            yellow: "kitchen-card-yellow",
            red: "kitchen-card-red",
        };
        return classes[status];
    };

    const getOrderTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            delivery: "Delivery",
            counter: "Balcão",
            room: "Quarto",
        };
        return labels[type] || type;
    };

    const timeStatus = getTimeStatus();

    const handlePrint = () => {
        window.print();
    };

    // Determine status configuration for dynamic styling
    const statusConfig = {
        borderColor: timeStatus.status === 'green' ? 'border-green-500' :
            timeStatus.status === 'yellow' ? 'border-yellow-500' :
                'border-red-500',
        // You can add more status-based styling here if needed
    };

    return (
        <Card className={`relative overflow-hidden transition-all hover:shadow-lg border-l-4 ${statusConfig.borderColor} ${order.status === 'pending' ? 'animate-pulse-subtle' : ''}`}>
            {/* Hidden Print Component */}
            <div className="hidden print:block fixed inset-0 z-[9999] bg-white p-0 m-0">
                <PrintableOrder order={order} />
            </div>

            <CardHeader className="pb-3 bg-muted/20">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <span className="font-black text-2xl">#{order.order_number}</span>
                            {order.room_number && (
                                <Badge variant="outline" className="font-bold bg-white">
                                    Quarto {order.room_number}
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription className="font-medium flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="mx-1">•</span>
                            {order.customers?.full_name}
                        </CardDescription>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handlePrint} title="Imprimir Pedido">
                        <Printer className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">
                        {order.customers?.full_name || "Cliente"}
                    </span>
                </div>

                {order.room_number && (
                    <div className="flex items-center gap-2 text-lg">
                        <Home className="h-5 w-5" />
                        <span>Quarto {order.room_number}</span>
                    </div>
                )}

                <div className="space-y-2">
                    {order.order_items?.map((item) => (
                        <div key={item.id} className="bg-background/50 rounded-lg p-2">
                            <div className="font-semibold text-lg">
                                {item.quantity}x {item.product_name}
                            </div>
                            {item.notes && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {item.notes}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {order.notes && (
                    <div className="bg-warning/20 rounded-lg p-2 flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                        <p className="text-sm">{order.notes}</p>
                    </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-2xl font-mono font-bold">
                        <Clock className="h-6 w-6" />
                        {formatTime()}
                    </div>

                    {order.status === 'pending' ? (
                        <Button size="lg" onClick={() => onStartOrder(order.id)} className="gap-2">
                            <Play className="h-5 w-5" />
                            Iniciar
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            variant="default"
                            onClick={() => onFinishOrder(order.id)}
                            className="gap-2 bg-success hover:bg-success/90"
                        >
                            <CheckCircle2 className="h-5 w-5" />
                            Pronto
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
