import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Category {
    id: string;
    name: string;
    display_order: number;
}

export const useCategories = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("id, name") // Removed display_order causing error
                .eq("is_active", true);
            // .order("display_order", { ascending: true }); // Temporarily disabled

            if (error) throw error;
            return data as Category[];
        },
    });

    const updateCategoriesOrder = useMutation({
        mutationFn: async (categories: { id: string; display_order: number }[]) => {
            const promises = categories.map((cat) =>
                supabase
                    .from("categories")
                    .update({ display_order: cat.display_order })
                    .eq("id", cat.id)
            );
            const results = await Promise.all(promises);
            const firstError = results.find((r) => r.error)?.error;
            if (firstError) throw firstError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Ordem das categorias atualizada!");
        },
        onError: (error) => {
            toast.error("Erro ao atualizar ordem das categorias");
            console.error(error);
        },
    });

    return { ...query, updateCategoriesOrder };
};
