import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Minus, Plus } from "lucide-react";
import { useProductAddons, ComplementGroup, ComplementItem } from "@/hooks/useProductAddons";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Product {
    id: string;
    name: string;
    price: number;
    description: string | null;
    image_url: string | null;
}

export interface SelectedComplement {
    groupId: string;
    itemId: string;
    name: string;
    price: number;
    quantity: number;
}

interface ProductModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (product: Product, quantity: number, complements: SelectedComplement[], notes: string) => void;
}

export function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
    const { t } = useLanguage();
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState("");
    const [selectedComplements, setSelectedComplements] = useState<SelectedComplement[]>([]);

    // Proactive Validation State
    const [isValid, setIsValid] = useState(false);
    const [touched, setTouched] = useState(false);

    const { data: addonGroups = [], isLoading } = useProductAddons(product?.id || null);

    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setNotes("");
            setSelectedComplements([]);
            setTouched(false);
        }
    }, [isOpen, product]);

    // Validation Logic
    useEffect(() => {
        if (!isOpen || isLoading) return;

        let valid = true;
        for (const group of addonGroups) {
            if (group.min_quantity > 0) {
                const count = selectedComplements.filter(s => s.groupId === group.id).length;
                if (count < group.min_quantity) {
                    valid = false;
                    break;
                }
            }
        }
        setIsValid(valid);
    }, [selectedComplements, addonGroups, isOpen, isLoading]);


    const handleQuantityChange = (delta: number) => {
        setQuantity((prev) => Math.max(1, prev + delta));
    };

    const handleComplementToggle = (group: ComplementGroup, item: ComplementItem, checked: boolean) => {
        setTouched(true);
        setSelectedComplements((prev) => {
            // Create a copy of current selections
            let newSelections = [...prev];

            if (group.max_quantity === 1) {
                // Validation for single choice (Radio-like behavior)
                // If selecting this item, remove other items from the same group
                if (checked) {
                    newSelections = newSelections.filter(s => s.groupId !== group.id);
                    newSelections.push({
                        groupId: group.id,
                        itemId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: 1
                    });
                }
            } else {
                // Multiple choice logic (Checkbox)
                if (checked) {
                    // Check if we hit the max limit for the group
                    const groupCount = newSelections.filter(s => s.groupId === group.id).length;
                    if (group.max_quantity !== null && groupCount >= group.max_quantity) {
                        toast.error(`Máximo de ${group.max_quantity} opções permitidas neste grupo.`);
                        return prev;
                    }

                    newSelections.push({
                        groupId: group.id,
                        itemId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: 1
                    });
                } else {
                    newSelections = newSelections.filter(s => !(s.groupId === group.id && s.itemId === item.id));
                }
            }

            return newSelections;
        });
    };

    const calculateTotal = () => {
        if (!product) return 0;
        const complementsTotal = selectedComplements.reduce((acc, curr) => acc + curr.price, 0);
        return (product.price + complementsTotal) * quantity;
    };

    const handleAddToCart = () => {
        if (!product) return;
        if (!isValid) {
            // Should be covered by disabled button, but as safety:
            toast.error("Por favor, selecione os itens obrigatórios.");
            return;
        }

        onAddToCart(product, quantity, selectedComplements, notes);
        onClose();
    };

    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white rounded-xl">
                {/* Header Image */}
                <div className="relative h-48 w-full bg-gray-100 shrink-0">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            {t.guest.product.no_image}
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Content Scrollable */}
                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8">
                        <div>
                            <DialogTitle className="text-2xl font-bold mb-2">{product.name}</DialogTitle>
                            <DialogDescription className="text-base text-gray-600">
                                {product.description}
                            </DialogDescription>
                            <p className="text-xl font-bold text-green-600 mt-2">
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}
                            </p>
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}

                        {/* Addon Groups */}
                        {!isLoading && addonGroups.map((group) => {
                            const currentCount = selectedComplements.filter(s => s.groupId === group.id).length;
                            const isRequired = group.min_quantity > 0;
                            const isSatisfied = currentCount >= group.min_quantity;

                            return (
                                <div key={group.id} className={`space-y-4 border-b border-gray-100 pb-6 last:border-0 ${isRequired && !isSatisfied && touched ? 'bg-red-50/50 -mx-4 px-4 py-2 rounded-lg' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                                {group.name}
                                                {isRequired && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isSatisfied ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {isSatisfied ? 'OK' : 'Obrigatório'}
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {group.min_quantity > 0 && group.max_quantity === 1 ? (
                                                    t.guest.product.choice_1
                                                ) : (
                                                    <>
                                                        Escolha {group.min_quantity > 0 ? `pelo menos ${group.min_quantity}` : ''} {group.max_quantity ? `até ${group.max_quantity}` : ''}
                                                    </>
                                                )}
                                                <span className="block text-xs font-semibold mt-1 text-primary">
                                                    Selecionado: {currentCount} / {group.max_quantity || '∞'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {group.items.map((item) => {
                                            const isSelected = selectedComplements.some(s => s.groupId === group.id && s.itemId === item.id);
                                            const isGroupFull = group.max_quantity !== null
                                                && currentCount >= group.max_quantity;
                                            const disabled = !isSelected && isGroupFull && group.max_quantity !== 1; // Don't disable if radio mode (max=1) because clicking another should swap

                                            return (
                                                <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`} onClick={() => {
                                                    if (!disabled) {
                                                        // Handle logic
                                                        // Trigger logic is inside components but we can click the container
                                                        // Need to ensure we don't double trigger if clicking directly on input
                                                        // Actually we can just rely on the label/input click propagation or manual call.
                                                        // For accessible inputs, clicking container to toggle is good.
                                                        // Let's manually toggle if it's the container, but inputs stop propagation? 
                                                        // Easier: Toggle logic is state based, let's call it.
                                                        // BUT: `Checkbox` and `RadioGroupItem` handle their own clicks.
                                                        // Let's wrap safely or leave standard behavior.
                                                        // To improve UX, clickable container is key. 
                                                        // We'll call the toggle function if it's a div click, but we need to know the state.
                                                        // Simpler approach: Just rely on label being full width usually.
                                                        // Let's bind onClick to container and prevent default on inputs if needed, or better, let the Input control it.
                                                        // Since we have `onClick` on div below, let's keep it simple.
                                                        const isRadio = group.max_quantity === 1;
                                                        if (isRadio) handleComplementToggle(group, item, true);
                                                        else handleComplementToggle(group, item, !isSelected);
                                                    }
                                                }}>
                                                    <div className="flex items-center space-x-3 w-full pointer-events-none">
                                                        {/* pointer-events-none ensures the click passes to container handler or we just handle container click only. */}
                                                        {/* Wait, if we use shadcn checkbox, it is interactive. */}
                                                        {/* Better approach: Let container handle click, and input just show state to avoid double toggle. */}
                                                        {group.max_quantity === 1 ? (
                                                            <div className={`h-4 w-4 rounded-full border border-primary flex items-center justify-center ${isSelected ? 'bg-primary' : ''}`}>
                                                                {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                                            </div>
                                                        ) : (
                                                            <div className={`h-4 w-4 rounded border border-primary flex items-center justify-center ${isSelected ? 'bg-primary' : ''}`}>
                                                                {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="2"><path d="M1 4L3.5 6.5L9 1" /></svg>}
                                                            </div>
                                                        )}
                                                        <span className={`flex-1 font-medium ${disabled ? "opacity-50" : ""}`}>
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-gray-700">
                                                        {item.price > 0 ? `+${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.price)}` : t.guest.product.free}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}

                        <div className="space-y-2 pt-4">
                            <Label htmlFor="notes" className="font-bold text-gray-700">{t.guest.product.notes}</Label>
                            <textarea
                                id="notes"
                                className="w-full min-h-[80px] p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary resize-none bg-gray-50"
                                placeholder="Ex: Tirar cebola, ponto da carne..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-gray-100 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <span className="font-medium text-gray-500">{t.guest.product.item_total}</span>
                        <span className="text-2xl font-black text-gray-900">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(calculateTotal())}</span>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-xl border border-gray-200">
                            <button
                                onClick={() => handleQuantityChange(-1)}
                                className="h-10 w-10 flex items-center justify-center bg-white rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all text-gray-700"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-6 text-center font-bold text-lg">{quantity}</span>
                            <button
                                onClick={() => handleQuantityChange(1)}
                                className="h-10 w-10 flex items-center justify-center bg-white rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all text-gray-700"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        <Button
                            className={`flex-1 h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/25 transition-all ${!isValid && !isLoading
                                    ? 'bg-gray-300 text-gray-500 hover:bg-gray-300 cursor-not-allowed shadow-none'
                                    : 'hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                            onClick={handleAddToCart}
                            disabled={isLoading || !isValid}
                        >
                            {!isValid && !isLoading ? 'Selecione os itens' : t.guest.product.add_to_cart}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
