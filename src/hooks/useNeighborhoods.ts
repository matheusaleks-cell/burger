import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Neighborhood {
    id: string;
    name: string;
    fee: number;
    active: boolean;
}

export const useNeighborhoods = () => {
    const { data: neighborhoods = [], isLoading } = useQuery({
        queryKey: ["neighborhoods"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("delivery_neighborhoods" as any) // Type assertion until generated types catch up
                .select("*")
                .eq("active", true)
                .order("name");

            if (error) {
                console.error("Error fetching neighborhoods:", error);
                toast.error("Erro ao carregar bairros de entrega");
                return [];
            }
            return data as unknown as Neighborhood[];
        },
    });

    return {
        neighborhoods,
        isLoading
    };
};
