import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Customer {
    id: string;
    full_name: string;
    phone: string;
    order_type: "delivery" | "counter" | "room";
    room_number: string | null;
}

export const useCustomers = () => {
    return useQuery({
        queryKey: ["customers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("customers")
                .select("*")
                .order("full_name");

            if (error) throw error;
            return data as Customer[];
        },
    });
};
