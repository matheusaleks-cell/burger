import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Pousada {
    id: string;
    name: string;
    address: string;
    delivery_fee: number;
    is_active: boolean;
    latitude?: number;
    longitude?: number;
    delivery_radius_km?: number;
    base_delivery_fee?: number;
    fee_per_km?: number;
    is_hq?: boolean;
    is_open?: boolean;
    pix_key?: string;
    pix_key_type?: string;
    opening_hours?: string;
    estimated_time_min?: number;
    estimated_time_max?: number;
    accepted_payment_methods?: string[];
    show_banners?: boolean;
    first_order_discount_enabled?: boolean;
    first_order_discount_type?: 'percentage' | 'fixed' | 'delivery_free';
    first_order_discount_value?: number;
}

export type PousadaInput = Omit<Pousada, "id">;

export const usePousadas = () => {
    const queryClient = useQueryClient();

    const { data: pousadas = [], isLoading } = useQuery({
        queryKey: ["pousadas"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("pousadas")
                .select("*")
                .order("name");

            if (error) {
                toast.error("Erro ao carregar pousadas");
                throw error;
            }
            return data as Pousada[];
        },
    });

    const updatePousada = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Pousada> & { id: string }) => {
            const { error } = await supabase
                .from("pousadas")
                .update(updates)
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pousadas"] });
            toast.success("Configurações salvas com sucesso!");
        },
        onError: (error) => {
            console.error("Error updating pousada:", error);
            toast.error("Erro ao salvar configurações.");
        }
    });

    return {
        pousadas,
        isLoading,
        updatePousada
    };
};

