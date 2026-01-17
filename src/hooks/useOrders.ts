import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Customer } from "./useCustomers";
import { useNotificationSound } from "./useNotificationSound";

export interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    notes: string | null;
}

export interface Order {
    id: string;
    order_number: number;
    customer_id: string | null;
    order_type: "delivery" | "counter" | "room";
    status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
    payment_method: "pix" | "card" | "cash" | null;
    notes: string | null;
    total: number;
    room_number: string | null;
    created_at: string;
    started_at?: string;
    completed_at?: string;
    customers?: Customer;
    order_items?: OrderItem[];
}

export const useOrders = () => {
    // Legacy hook wrapper - mainly for Kitchen which expects everything but really only needs active
    // We'll map it to useActiveOrders for Kitchen safety, or just let components migrate.
    // For now, let's keep a generic one that returns active + recent history? 
    // No, let's allow parameters.
    return usePaginatedOrders({ page: 1, pageSize: 1000 }); // "Mock" legacy behavior
};

export const useActiveOrders = () => {
    const queryClient = useQueryClient();
    const { playNewOrderSound, startNewOrderLoop, stopNewOrderLoop } = useNotificationSound();
    const lastOrderDateRef = useRef<string | null>(null);

    // Initial load: Active Orders (Pending, Preparing, Ready)
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["active_orders"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("orders")
                .select(`
                    *,
                    order_items (
                        *,
                        product:products(*)
                    ),
                    pousada:pousadas(*),
                    customer:customers(*)
                `)
                .in('status', ['pending', 'preparing', 'ready'])
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Order[];
        },
        refetchInterval: 30000,
    });

    // Realtime subscription for Active Orders
    useEffect(() => {
        const channel = supabase
            .channel("active-orders-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders", filter: "status=in.(pending,preparing,ready)" },
                // Note: filter above might not work complexly in Supabase Client yet for IN, so generic table filter is safer
                // Realtime filters are limited. Let's listen to all and filter in callback or just invalidate.
                () => {
                    queryClient.invalidateQueries({ queryKey: ["active_orders"] });
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [queryClient]);

    // Sound Logic (Shared)
    useEffect(() => {
        if (!orders.length) return;
        const latestOrder = orders.find(o => o.status === 'pending'); // Only ping on pending
        // ... (Simplified logic: if there is a pending order that is new)

        // Use the same logic as before for new order detection
        if (latestOrder && (!lastOrderDateRef.current || latestOrder.created_at > lastOrderDateRef.current)) {
            if (latestOrder.status === 'pending') {
                console.log("🆕 New active order!", latestOrder);
                startNewOrderLoop();
                toast.success("Novo pedido recebido!");
            }
            lastOrderDateRef.current = latestOrder.created_at;
        }
    }, [orders, startNewOrderLoop]);

    // Mutation reused
    const updateOrderStatus = useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string; status: Order["status"] }) => {
            const updateData: any = { status };
            if (status === "preparing") updateData.started_at = new Date().toISOString();
            if (status === "ready" || status === "delivered") updateData.completed_at = new Date().toISOString();

            const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["active_orders"] });
            queryClient.invalidateQueries({ queryKey: ["paginated_orders"] }); // Refresh history too
            stopNewOrderLoop();
        },
        onError: () => toast.error("Erro ao atualizar status"),
    });

    return { orders, isLoading, updateOrderStatus };
};

export const usePaginatedOrders = ({ page = 1, pageSize = 20, status = undefined }: { page?: number; pageSize?: number; status?: string } = {}) => {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["paginated_orders", page, pageSize, status],
        queryFn: async () => {
            let query = supabase
                .from("orders")
                .select(`
                    *,
                    order_items (
                        *,
                        product:products(*)
                    ),
                    pousada:pousadas(*),
                    customer:customers(*)
                `, { count: 'exact' });

            if (status) {
                query = query.eq('status', status);
            }

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await query
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;
            return { orders: data as Order[], total: count || 0 };
        },
        placeholderData: (previousData) => previousData, // Keep data while fetching new page
    });

    // Mutation (Same as above, ideally refactored to shared function but duplicated for speed)
    const updateOrderStatus = useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string; status: Order["status"] }) => {
            const updateData: any = { status };
            if (status === "preparing") updateData.started_at = new Date().toISOString();
            if (status === "ready" || status === "delivered") updateData.completed_at = new Date().toISOString();

            const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["paginated_orders"] });
            queryClient.invalidateQueries({ queryKey: ["active_orders"] });
        },
        onError: () => toast.error("Erro ao atualizar status"),
    });

    return {
        orders: data?.orders || [],
        total: data?.total || 0,
        isLoading,
        updateOrderStatus,
        pageCount: data?.total ? Math.ceil(data.total / pageSize) : 0
    };
};
