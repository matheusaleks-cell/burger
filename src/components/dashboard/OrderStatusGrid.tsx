import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ChefHat, CheckCircle2 } from "lucide-react";
import { DashboardStats } from "@/hooks/useDashboardStats";

interface OrderStatusGridProps {
    stats: DashboardStats;
}

export const OrderStatusGrid = ({ stats }: OrderStatusGridProps) => {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-card border-l-4 border-l-warning">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
                    <Clock className="h-5 w-5 text-warning" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-warning">{stats.pendingOrders}</div>
                    <p className="text-xs text-muted-foreground">pedidos na fila</p>
                </CardContent>
            </Card>

            <Card className="glass-card border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Em Preparo</CardTitle>
                    <ChefHat className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-primary">{stats.preparingOrders}</div>
                    <p className="text-xs text-muted-foreground">na cozinha</p>
                </CardContent>
            </Card>

            <Card className="glass-card border-l-4 border-l-success">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
                    <CheckCircle2 className="h-5 w-5 text-success" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-success">{stats.completedOrders}</div>
                    <p className="text-xs text-muted-foreground">este mês</p>
                </CardContent>
            </Card>
        </div>
    );
};
