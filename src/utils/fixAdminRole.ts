import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const fixAdminRole = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // For recovery purposes, we will attempt to promote ANY logged user if this function is called
        // This is a dev-helper function.
        if (user) {
            // 1. Check if user is ALREADY admin
            const { data: existingRole } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .eq('role', 'admin')
                .single();

            if (existingRole) {
                console.log("Usuário já é admin. Nenhuma ação necessária.");
                return;
            }

            console.log("Tentando corrigir permissões para o usuário atual...");

            const { error } = await supabase
                .from('user_roles')
                .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id,role' });

            if (error) {
                console.error("Erro ao atualizar role:", error);
                // toast.error("Erro ao aplicar permissões de Admin: " + error.message);
            } else {
                console.log("Permissões de Admin aplicadas com sucesso!");
                toast.success("Você agora é ADMIN! Recarregue a página (F5) para ver o menu completo.", { duration: 5000 });
            }
        }
    } catch (e) {
        console.error("Erro fatal no fixAdminRole:", e);
    }
};
