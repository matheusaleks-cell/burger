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
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
            <div className="container mx-auto max-w-2xl">
                <Button
                    className="w-full h-16 text-white font-black text-lg bg-primary hover:bg-primary/90 flex items-center justify-between px-6 rounded-2xl shadow-xl shadow-primary/25 border-2 border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={onCheckout}
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 h-10 w-10 flex items-center justify-center rounded-xl backdrop-blur-sm">
                            <span className="text-lg">{cartItemsCount}</span>
                        </div>
                        <span className="uppercase tracking-wide text-sm">{t.guest.cart.view_cart}</span>
                    </div>
                    <span className="bg-black/20 px-3 py-1 rounded-lg backdrop-blur-sm">{formatCurrency(cartTotal)}</span>
                </Button>
            </div>
        </div>
    );
}
