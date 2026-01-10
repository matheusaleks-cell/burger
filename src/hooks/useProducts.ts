import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Category } from "./useCategories";

export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category_id: string | null;
    image_url: string | null;
    is_active: boolean;
    is_available?: boolean;
    prep_time_minutes: number;
    display_order: number;
    external_id?: string | null;
    promotional_price?: number | null;
    availability_status?: string;
    daily_stock?: number | null;
    available_all: boolean;
    categories?: Category;
    pousada_ids?: string[]; // IDs of pousadas where this product is available (if !available_all)
    product_pousadas?: { pousada_id: string }[]; // Raw join data
}

export type ProductInput = Omit<Product, "id" | "categories" | "pousada_ids" | "product_pousadas"> & {
    pousada_ids?: string[];
};

export const useProducts = () => {
    const queryClient = useQueryClient();

    const { data: products = [], isLoading } = useQuery({
        queryKey: ["products"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("products")
                .select("*, categories(*), product_pousadas(pousada_id)");

            if (error) {
                console.error("Error fetching products:", error);
                toast.error("Erro ao carregar produtos");
                return [];
            }

            return (data as any[]).map(p => ({
                ...p,
                is_available: p.availability_status === 'available' || !p.availability_status,
                pousada_ids: p.product_pousadas?.map((pp: any) => pp.pousada_id) || []
            })) as Product[];
        },
    });

    // Real-time Subscription
    useEffect(() => {
        const channel = supabase
            .channel('products-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products'
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["products"] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const createProduct = useMutation({
        mutationFn: async ({ product, complementGroupIds }: { product: ProductInput, complementGroupIds?: string[] }) => {
            // Remove helper fields that don't exist in DB
            const { pousada_ids, is_available, ...productData } = product as any;

            // 1. Create Product
            const { data, error } = await supabase.from("products").insert(productData).select().single();
            if (error) throw error;

            // 2. Insert Associations (Complements)
            if (data && complementGroupIds && complementGroupIds.length > 0) {
                const { error: groupsError } = await supabase.from("product_complement_groups").insert(
                    complementGroupIds.map((groupId, index) => ({
                        product_id: data.id,
                        complement_group_id: groupId,
                        display_order: index
                    }))
                );
                if (groupsError) throw groupsError;
            }

            // 3. Insert Associations (Pousadas) - Only if not available_all
            if (data && !productData.available_all && pousada_ids && pousada_ids.length > 0) {
                const { error: pousadasError } = await supabase.from("product_pousadas").insert(
                    pousada_ids.map(pousadaId => ({
                        product_id: data.id,
                        pousada_id: pousadaId
                    }))
                );
                if (pousadasError) throw pousadasError;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Produto criado com sucesso!");
        },
        onError: (error) => {
            console.error("FAILED TO CREATE PRODUCT:", error);
            toast.error(`Erro ao criar produto: ${error.message}`);
        },
    });

    const updateProduct = useMutation({
        mutationFn: async ({ id, updates, complementGroupIds }: { id: string, updates: Partial<ProductInput>, complementGroupIds?: string[] }) => {
            // Remove helper fields that don't exist in DB
            const { pousada_ids, is_available, ...productUpdates } = updates as any;

            // 1. Update Product
            const { data, error } = await supabase.from("products").update(productUpdates).eq("id", id).select().maybeSingle();
            if (error) throw error;
            if (!data) throw new Error("Produto não encontrado ou permissão negada. Verifique se seu usuário possui a role 'admin' no banco de dados.");

            // 2. Update Complements (if provided)
            if (complementGroupIds) {
                const { error: deleteError } = await supabase.from("product_complement_groups").delete().eq("product_id", id);
                if (deleteError) throw deleteError;

                if (complementGroupIds.length > 0) {
                    const { error: insertError } = await supabase.from("product_complement_groups").insert(
                        complementGroupIds.map((groupId, index) => ({
                            product_id: id,
                            complement_group_id: groupId,
                            display_order: index
                        }))
                    );
                    if (insertError) throw insertError;
                }
            }

            // 3. Update Pousadas (if provided)
            if (pousada_ids !== undefined) {
                // Always clean up old associations first for simplicity
                const { error: deletePousadasError } = await supabase.from("product_pousadas").delete().eq("product_id", id);
                if (deletePousadasError) throw deletePousadasError;

                // If strictly not available all, add selected pousadas
                if (updates.available_all === false && pousada_ids.length > 0) {
                    const { error: insertPousadasError } = await supabase.from("product_pousadas").insert(
                        pousada_ids.map(pousadaId => ({
                            product_id: id,
                            pousada_id: pousadaId
                        }))
                    );
                    if (insertPousadasError) throw insertPousadasError;
                }
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Produto atualizado!");
        },
        onError: (error) => {
            toast.error(`Erro ao atualizar produto: ${error.message}`);
        },
    });

    const updateProductsOrder = useMutation({
        mutationFn: async (products: { id: string; display_order: number }[]) => {
            const promises = products.map((p) =>
                supabase.from("products").update({ display_order: p.display_order }).eq("id", p.id)
            );
            const results = await Promise.all(promises);
            const firstError = results.find((r) => r.error)?.error;
            if (firstError) throw firstError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Ordem dos produtos atualizada!");
        },
        onError: (error) => {
            toast.error("Erro ao atualizar ordem dos produtos");
            console.error(error);
        },
    });

    const deleteProduct = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("products").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Produto excluído!");
        },
        onError: (error) => {
            toast.error(`Erro ao excluir produto: ${error.message}`);
        },
    });

    return {
        products,
        isLoading,
        createProduct,
        updateProduct,
        updateProductsOrder,
        deleteProduct
    };
};
