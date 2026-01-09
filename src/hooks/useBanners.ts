import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Banner {
    id: string;
    image_url: string;
    title: string | null;
    link: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

export const useBanners = () => {
    const queryClient = useQueryClient();

    const { data: banners = [], isLoading } = useQuery({
        queryKey: ["banners"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("banners")
                .select("*")
                .order("display_order", { ascending: true })
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching banners:", error);
                return [];
            }
            return data as Banner[];
        },
    });

    const uploadBanner = useMutation({
        mutationFn: async ({ file, title, link }: { file: File; title?: string; link?: string }) => {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload Image
            const { error: uploadError } = await supabase.storage
                .from("banners")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from("banners")
                .getPublicUrl(filePath);

            // 3. Insert Record
            const { error: dbError } = await (supabase as any).from("banners").insert({
                image_url: publicUrl,
                title,
                link,
                display_order: 0,
            });

            if (dbError) throw dbError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["banners"] });
            toast.success("Banner adicionado com sucesso!");
        },
        onError: (error) => {
            console.error("Error uploading banner:", error);
            toast.error("Erro ao fazer upload do banner.");
        },
    });

    const deleteBanner = useMutation({
        mutationFn: async (id: string) => {
            // Optimistically delete the record. 
            // Note: We might want to delete the file from storage too, but we need the path.
            // For simplicity, we just delete the record for now.
            const { error } = await (supabase as any).from("banners").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["banners"] });
            toast.success("Banner removido!");
        },
        onError: (error) => {
            console.error("Error removing banner:", error);
            toast.error("Erro ao remover banner.");
        },
    });

    const toggleBannerStatus = useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            const { error } = await (supabase as any)
                .from("banners")
                .update({ is_active })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["banners"] });
            toast.success("Status atualizado!");
        },
        onError: () => {
            toast.error("Erro ao atualizar status.");
        }
    });

    return {
        banners,
        isLoading,
        uploadBanner,
        deleteBanner,
        toggleBannerStatus
    };
};
