import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ComplementItem {
    id: string;
    name: string;
    price: number;
    max_quantity: number | null;
    is_active: boolean;
}

export interface ComplementGroup {
    id: string;
    name: string;
    min_quantity: number;
    max_quantity: number | null;
    items: ComplementItem[];
}

export const useProductAddons = (productId: string | null) => {
    return useQuery({
        queryKey: ["product-addons", productId],
        queryFn: async () => {
            if (!productId) return [];

            // First, get the groups associated with this product
            const { data: associations, error: assocError } = await supabase
                .from("product_complement_groups")
                .select("complement_group_id")
                .eq("product_id", productId);

            if (assocError) throw assocError;

            if (!associations || associations.length === 0) return [];

            const groupIds = associations.map((a) => a.complement_group_id);

            // Then fetch the details of those groups and their items
            const { data: groups, error: groupsError } = await supabase
                .from("complement_groups")
                .select(`
          id,
          name,
          min_quantity,
          max_quantity,
          items:complement_items(
            id,
            name,
            price,
            max_quantity,
            is_active
          )
        `)
                .in("id", groupIds)
                .eq("is_active", true)
                .eq("items.is_active", true);

            if (groupsError) throw groupsError;

            // Sort items by price (optional, but good for UX)
            const formattedGroups: ComplementGroup[] = groups.map((g: any) => ({
                ...g,
                items: (g.items || []).sort((a: any, b: any) => a.price - b.price),
            }));

            return formattedGroups;
        },
        enabled: !!productId,
    });
};
