import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface FooterCartProps {
    onCheckout: () => void;
}

export function FooterCart({ onCheckout }: FooterCartProps) {
    const { cartItemsCount, cartTotal } = useCart();
    const { t } = useLanguage();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    if (cartItemsCount === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50">
            <div className="container mx-auto max-w-2xl">
                <Button
                    className="w-full h-14 text-white font-black text-lg bg-primary hover:bg-primary/90 flex items-center justify-between px-6 rounded-xl shadow-xl shadow-primary/20"
                    onClick={onCheckout}
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 h-9 w-9 flex items-center justify-center rounded-lg">
                            {cartItemsCount}
                        </div>
                        <span>{t.guest.cart.view_cart}</span>
                    </div>
                    <span>{formatCurrency(cartTotal)}</span>
                </Button>
            </div>
        </div>
    );
}
