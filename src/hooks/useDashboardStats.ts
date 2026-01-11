import { useMemo } from "react";
import { useOrders, Order } from "./useOrders";
import { startOfDay, startOfWeek, startOfMonth, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface DashboardStats {
    todaySales: number;
    weekSales: number;
    monthSales: number;
    totalOrders: number;
    pendingOrders: number;
    preparingOrders: number;
    completedOrders: number;
    averageTicket: number;
}

export interface PopularItem {
    id: string; // product name as ID for aggregation
    name: string;
    count: number;
    revenue: number;
}

export const useDashboardStats = () => {
    const { orders = [], isLoading } = useOrders();

    const stats = useMemo<DashboardStats>(() => {
        // Return zeros if no orders
        if (!orders.length) {
            return {
                todaySales: 0,
                weekSales: 0,
                monthSales: 0,
                totalOrders: 0,
                pendingOrders: 0,
                preparingOrders: 0,
                completedOrders: 0,
                averageTicket: 0,
            };
        }

        const now = new Date();
        // Use proper start dates
        const todayStart = startOfDay(now);
        const weekStart = startOfWeek(now, { locale: ptBR });
        const monthStart = startOfMonth(now);

        // Helpers
        const isActive = (o: Order) => o.status !== "cancelled";
        const isCompleted = (o: Order) => o.status === "delivered" || o.status === "ready";

        // Filter orders
        const activeOrders = orders.filter(isActive);
        const todayOrders = activeOrders.filter(o => isAfter(new Date(o.created_at), todayStart));
        const weekOrders = activeOrders.filter(o => isAfter(new Date(o.created_at), weekStart));
        const monthOrders = activeOrders.filter(o => isAfter(new Date(o.created_at), monthStart));

        // Calculate totals
        const sumTotal = (list: Order[]) => list.reduce((acc, o) => acc + Number(o.total), 0);

        const completedCount = orders.filter(isCompleted).length;
        const totalCompletedValue = orders.filter(isCompleted).reduce((acc, o) => acc + Number(o.total), 0);

        return {
            todaySales: sumTotal(todayOrders),
            weekSales: sumTotal(weekOrders),
            monthSales: sumTotal(monthOrders),
            totalOrders: monthOrders.length, // Monthly orders as "total" context usually
            pendingOrders: orders.filter((o) => o.status === "pending").length,
            preparingOrders: orders.filter((o) => o.status === "preparing").length,
            completedOrders: completedCount,
            averageTicket: completedCount > 0 ? totalCompletedValue / completedCount : 0,
        };
    }, [orders]);

    const popularItems = useMemo<PopularItem[]>(() => {
        if (!orders.length) return [];

        const itemMap = new Map<string, PopularItem>();

        orders.forEach(order => {
            // Only count items from valid (non-cancelled) orders? 
            // Usually popular items should reflect demand, even if cancelled, but to match revenue metrics, 
            // we probably should exclude cancelled ones or purely stick to "what people want".
            // Let's exclude cancelled for consistency with sales stats.
            if (order.status === 'cancelled') return;

            order.order_items?.forEach(item => {
                const existing = itemMap.get(item.product_name) || {
                    id: item.product_name,
                    name: item.product_name,
                    count: 0,
                    revenue: 0
                };

                existing.count += item.quantity;
                existing.revenue += (item.unit_price * item.quantity);
                itemMap.set(item.product_name, existing);
            });
        });

        // Convert to array and sort by count (desc)
        return Array.from(itemMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5
    }, [orders]);

    const recentOrders = useMemo(() => {
        return orders.slice(0, 5);
    }, [orders]);

    return {
        stats,
        recentOrders,
        popularItems,
        isLoading,
    };
};
