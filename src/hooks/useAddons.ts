import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ComplementItem {
    id: string;
    group_id: string;
    name: string;
    description: string | null;
    price: number;
    is_active: boolean;
    max_quantity: number | null;
    external_id: string | null;
}

export interface ComplementGroup {
    id: string;
    name: string;
    min_quantity: number;
    max_quantity: number | null;
    external_id: string | null;
    items?: ComplementItem[];
}

export type ComplementGroupInput = Omit<ComplementGroup, "id" | "items"> & { display_order?: number };
export type ComplementItemInput = Omit<ComplementItem, "id" | "group_id"> & { display_order?: number };

export const useAddons = () => {
    const queryClient = useQueryClient();

    const { data: addonGroups = [], isLoading } = useQuery({
        queryKey: ["complement_groups"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("complement_groups")
                .select("*, items:complement_items!complement_items_group_id_fkey(*)")
                .order("display_order", { ascending: true })
                .order("display_order", { foreignTable: "complement_items", ascending: true });

            if (error) {
                toast.error("Erro ao carregar complementos");
                throw error;
            }
            return data as ComplementGroup[];
        },
    });

    const createGroup = useMutation({
        mutationFn: async (newGroup: ComplementGroupInput) => {
            const { data, error } = await supabase
                .from("complement_groups")
                .insert(newGroup)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["complement_groups"] });
            toast.success("Grupo de complementos criado!");
        },
        onError: (error) => {
            toast.error(`Erro ao criar grupo: ${error.message}`);
        },
    });

    // Updates a group details
    const updateGroup = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<ComplementGroupInput> & { id: string }) => {
            const { data, error } = await supabase
                .from("complement_groups")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["complement_groups"] });
            toast.success("Grupo atualizado!");
        },
        onError: (error) => {
            toast.error(`Erro ao atualizar grupo: ${error.message}`);
        },
    });

    const updateGroupsOrder = useMutation({
        mutationFn: async (updates: { id: string; display_order: number }[]) => {
            for (const update of updates) {
                const { error } = await supabase
                    .from("complement_groups")
                    .update({ display_order: update.display_order })
                    .eq("id", update.id);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["complement_groups"] });
        },
        onError: (error) => {
            toast.error(`Erro ao ordenar grupos: ${error.message}`);
        }
    });

    const deleteGroup = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("complement_groups").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["complement_groups"] });
            toast.success("Grupo excluído!");
        },
        onError: (error) => {
            toast.error(`Erro ao excluir: ${error.message}`);
        }
    });

    // Items Management
    const createItem = useMutation({
        mutationFn: async (item: ComplementItemInput & { group_id: string }) => {
            const { data, error } = await supabase.from("complement_items").insert(item).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["complement_groups"] });
        },
        onError: (error) => {
            toast.error(`Erro ao adicionar item: ${error.message}`);
        }
    });

    const updateItem = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<ComplementItemInput> & { id: string }) => {
            const { data, error } = await supabase.from("complement_items").update(updates).eq("id", id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["complement_groups"] });
        }
    });

    const updateItemsOrder = useMutation({
        mutationFn: async (updates: { id: string; display_order: number }[]) => {
            for (const update of updates) {
                const { error } = await supabase
                    .from("complement_items")
                    .update({ display_order: update.display_order })
                    .eq("id", update.id);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["complement_groups"] });
        }
    });

    const deleteItem = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("complement_items").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["complement_groups"] });
        }
    });

    return {
        addonGroups,
        isLoading,
        createGroup,
        updateGroup,
        updateGroupsOrder,
        deleteGroup,
        createItem,
        updateItem,
        updateItemsOrder,
        deleteItem
    };
};
