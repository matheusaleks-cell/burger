import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Home, AlertTriangle, Play, CheckCircle2 } from "lucide-react";
import { Order } from "@/hooks/useOrders";
import { differenceInMinutes, differenceInSeconds } from "date-fns";
import { useState, useEffect } from "react";

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

    return (
        <Card
            className={`kitchen-card ${getCardClass(timeStatus.status)} ${order.status === 'pending' ? 'border-l-4 border-l-primary shadow-xl shadow-primary/5' : ''} transition-all duration-500`}
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl lg:text-3xl font-display">
                        #{order.order_number}
                    </CardTitle>
                    <Badge variant="outline" className="text-lg">
                        {getOrderTypeLabel(order.order_type)}
                    </Badge>
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
