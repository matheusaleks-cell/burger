import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function RevenueChart() {
    const { data: chartData, isLoading } = useQuery({
        queryKey: ["revenue-chart"],
        queryFn: async () => {
            // Fetch last 7 days orders
            const startDate = startOfDay(subDays(new Date(), 6)).toISOString();

            const { data } = await supabase
                .from("orders")
                .select("total, created_at")
                .gte("created_at", startDate)
                .neq("status", "cancelled");

            if (!data) return [];

            // Group by day
            const grouped = data.reduce((acc, order) => {
                const date = format(new Date(order.created_at), "dd/MM", { locale: ptBR });
                if (!acc[date]) {
                    acc[date] = 0;
                }
                acc[date] += order.total;
                return acc;
            }, {} as Record<string, number>);

            // Fill missing days
            const result = [];
            for (let i = 6; i >= 0; i--) {
                const date = subDays(new Date(), i);
                const key = format(date, "dd/MM", { locale: ptBR });
                result.push({
                    name: key,
                    total: grouped[key] || 0
                });
            }

            return result;
        }
    });

    if (isLoading) {
        return <div className="h-[350px] w-full bg-gray-100 animate-pulse rounded-xl" />;
    }

    return (
        <Card className="col-span-1 lg:col-span-2 border-gray-100 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base font-bold text-gray-800">Receita nos últimos 7 dias</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `R$${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                        />
                        <Bar
                            dataKey="total"
                            fill="currentColor"
                            radius={[4, 4, 0, 0]}
                            className="fill-primary"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
