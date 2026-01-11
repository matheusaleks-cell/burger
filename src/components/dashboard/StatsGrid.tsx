import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, Wallet, LucideIcon } from "lucide-react";
import { DashboardStats } from "@/hooks/useDashboardStats";

interface StatsGridProps {
    stats: DashboardStats;
}

interface StatCardConfig {
    title: string;
    value: number;
    subtitle: string;
    icon: LucideIcon;
    colorClass: string;
    bgClass: string;
}

export const StatsGrid = ({ stats }: StatsGridProps) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const cards: StatCardConfig[] = [
        {
            title: "Hoje",
            value: stats.todaySales,
            subtitle: "Vendas do dia",
            icon: DollarSign,
            colorClass: "text-primary bg-primary/10",
            bgClass: "bg-primary/5",
        },
        {
            title: "Semana",
            value: stats.weekSales,
            subtitle: "Últimos 7 dias",
            icon: TrendingUp,
            colorClass: "text-primary bg-primary/10",
            bgClass: "bg-primary/5",
        },
        {
            title: "Mês",
            value: stats.monthSales,
            subtitle: "Vendas no período",
            icon: ShoppingCart,
            colorClass: "text-primary bg-primary/10",
            bgClass: "bg-primary/5",
        },
        {
            title: "Ticket Médio",
            value: stats.averageTicket,
            subtitle: "Média por pedido",
            icon: Wallet,
            colorClass: "text-primary bg-primary/10",
            bgClass: "bg-primary/5",
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
            {cards.map((card, index) => (
                <Card
                    key={index}
                    className="relative overflow-hidden border-none shadow-md bg-white hover:shadow-lg transition-all group"
                >
                    <div
                        className={`absolute right-0 top-0 h-32 w-32 translate-x-10 translate-y-10 rounded-full transition-colors ${card.bgClass} group-hover:opacity-80`}
                    />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            {card.title}
                        </CardTitle>
                        <div
                            className={`p-2 rounded-lg group-hover:scale-110 transition-transform ${card.colorClass}`}
                        >
                            <card.icon className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-black text-slate-800">
                            {formatCurrency(card.value)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            {card.subtitle}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
