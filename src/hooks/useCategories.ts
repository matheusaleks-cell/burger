import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Category {
    id: string;
    name: string;
    description?: string;
    display_order: number;
    is_active: boolean;
    is_featured?: boolean;
}

export const useCategories = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("display_order", { ascending: true });

            if (error) throw error;
            return data as Category[];
        },
    });

    const createCategory = useMutation({
        mutationFn: async (category: Omit<Category, "id">) => {
            const { data, error } = await supabase
                .from("categories")
                .insert(category)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Categoria criada com sucesso!");
        },
        onError: (error) => {
            toast.error("Erro ao criar categoria");
            console.error(error);
        },
    });

    const updateCategory = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
            const { data, error } = await supabase
                .from("categories")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Categoria atualizada!");
        },
        onError: (error) => {
            toast.error("Erro ao atualizar categoria");
            console.error(error);
        },
    });

    const deleteCategory = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Categoria removida!");
        },
        onError: (error) => {
            toast.error("Erro ao remover categoria");
            console.error(error);
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

    return {
        ...query,
        createCategory,
        updateCategory,
        deleteCategory,
        updateCategoriesOrder
    };
};
