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
    const queryClient = useQueryClient();
    const { playNewOrderSound, startNewOrderLoop, stopNewOrderLoop } = useNotificationSound();

    // Track the latest order timestamp to detect new ones via polling
    const lastOrderDateRef = useRef<string | null>(null);

    const [isPageVisible, setIsPageVisible] = useState(true);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsPageVisible(document.visibilityState === 'visible');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["orders"],
        queryFn: async () => {
            console.log("Fetching orders...");
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
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching orders:", error);
                // toast.error("Erro ao carregar pedidos");
                // Don't toast on polling error to avoid spam
                throw error;
            }
            return data;
        },
        refetchInterval: isPageVisible ? 3000 : 30000, // Poll every 3s when visible, 30s when background
    });

    const updateOrderStatus = useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string; status: Order["status"] }) => {
            const updateData: any = { status };
            if (status === "preparing") updateData.started_at = new Date().toISOString();
            if (status === "ready" || status === "delivered") updateData.completed_at = new Date().toISOString();

            const { error } = await supabase
                .from("orders")
                .update(updateData)
                .eq("id", orderId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            // Stop sound loop when ANY status is updated (assuming it's an acknowledgement)
            stopNewOrderLoop();
        },
        onError: () => {
            toast.error("Erro ao atualizar status");
        },
    });

    // Validates new orders arriving via Polling or Realtime
    useEffect(() => {
        if (!orders.length) return;

        const latestOrder = orders[0];

        // Initial load: store the latest date, don't play sound
        if (!lastOrderDateRef.current) {
            lastOrderDateRef.current = latestOrder.created_at;
            return;
        }

        // Check if the latest order is NEWER than what we last saw
        // String comparison works for ISO dates
        if (latestOrder.created_at > lastOrderDateRef.current) {
            console.log("🆕 New order detected via Sync/Polling!", latestOrder);
            startNewOrderLoop();
            toast.success("Novo pedido recebido!");
            lastOrderDateRef.current = latestOrder.created_at;
        }
    }, [orders, startNewOrderLoop]);

    useEffect(() => {
        const channel = supabase
            .channel("orders-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                (payload) => {
                    console.log("🔔 Supabase Realtime Event:", payload);
                    queryClient.invalidateQueries({ queryKey: ["orders"] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return { orders, isLoading, updateOrderStatus };
};
