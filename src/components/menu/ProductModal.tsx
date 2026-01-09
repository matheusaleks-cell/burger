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

    const { data: addonGroups = [], isLoading } = useProductAddons(product?.id || null);

    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setNotes("");
            setSelectedComplements([]);
        }
    }, [isOpen, product]);

    const handleQuantityChange = (delta: number) => {
        setQuantity((prev) => Math.max(1, prev + delta));
    };

    const handleComplementToggle = (group: ComplementGroup, item: ComplementItem, checked: boolean) => {
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
                } else {
                    // Cannot uncheck in radio mode usually, but handling it just in case logic needs it
                    // Actually for radio, clicking another option triggers this.
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

        // Validate required groups
        for (const group of addonGroups) {
            if (group.min_quantity > 0) {
                const count = selectedComplements.filter(s => s.groupId === group.id).length;
                if (count < group.min_quantity) {
                    toast.error(`Selecione pelo menos ${group.min_quantity} opção(ões) de ${group.name}`);
                    return;
                }
            }
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
                    <div className="p-6 space-y-6">
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
                        {!isLoading && addonGroups.map((group) => (
                            <div key={group.id} className="space-y-3 border-b border-gray-100 pb-4 last:border-0">
                                <div className="flex justify-between items-baseline">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{group.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {group.min_quantity > 0 && group.max_quantity === 1 ? (
                                                t.guest.product.choice_1
                                            ) : (
                                                `${group.min_quantity > 0 ? `${t.guest.product.choice_min} ${group.min_quantity}` : `${t.guest.product.choice_max}`} ${group.max_quantity ? group.max_quantity : t.guest.product.choice_many}`
                                            )}
                                        </p>
                                    </div>
                                    {group.min_quantity > 0 && (
                                        <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">{t.guest.product.required}</span>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {group.items.map((item) => {
                                        const isSelected = selectedComplements.some(s => s.groupId === group.id && s.itemId === item.id);
                                        const isGroupFull = group.max_quantity !== null
                                            && selectedComplements.filter(s => s.groupId === group.id).length >= group.max_quantity;
                                        const disabled = !isSelected && isGroupFull && group.max_quantity !== 1; // Don't disable if radio mode (max=1) because clicking another should swap

                                        return (
                                            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 bg-white border border-transparent hover:border-gray-100 transition-colors cursor-pointer" onClick={() => {
                                                if (!disabled) {
                                                    // Simplified handler trigger (reusing the same logic or calling click on input)
                                                }
                                            }}>
                                                <div className="flex items-center space-x-3 w-full">
                                                    {group.max_quantity === 1 ? (
                                                        <RadioGroup
                                                            value={selectedComplements.find(s => s.groupId === group.id)?.itemId || ""}
                                                            onValueChange={() => handleComplementToggle(group, item, true)}
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <RadioGroupItem value={item.id} id={item.id} />
                                                                <Label htmlFor={item.id} className="flex-1 cursor-pointer font-medium">
                                                                    {item.name}
                                                                </Label>
                                                            </div>
                                                        </RadioGroup>
                                                    ) : (
                                                        <div className="flex items-center space-x-3">
                                                            <Checkbox
                                                                id={item.id}
                                                                checked={isSelected}
                                                                onCheckedChange={(checked) => handleComplementToggle(group, item, checked as boolean)}
                                                                disabled={disabled}
                                                            />
                                                            <Label htmlFor={item.id} className={`flex-1 cursor-pointer font-medium ${disabled ? "opacity-50" : ""}`}>
                                                                {item.name}
                                                            </Label>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-600">
                                                    {item.price > 0 ? `+${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.price)}` : t.guest.product.free}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}

                        <div className="space-y-2">
                            <Label htmlFor="notes">{t.guest.product.notes}</Label>
                            <textarea
                                id="notes"
                                className="w-full min-h-[80px] p-3 rounded-md border border-gray-300 focus:ring-primary focus:border-primary"
                                placeholder="Ex: Tirar cebola, ponto da carne..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <span className="font-medium text-gray-500">{t.guest.product.item_total}</span>
                        <span className="text-xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(calculateTotal())}</span>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-lg">
                            <button
                                onClick={() => handleQuantityChange(-1)}
                                className="h-8 w-8 flex items-center justify-center bg-white rounded-md shadow-sm hover:scale-105 transition-transform"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-6 text-center font-bold">{quantity}</span>
                            <button
                                onClick={() => handleQuantityChange(1)}
                                className="h-8 w-8 flex items-center justify-center bg-white rounded-md shadow-sm hover:scale-105 transition-transform"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        <Button
                            className="flex-1 h-12 text-base font-bold"
                            onClick={handleAddToCart}
                            disabled={isLoading}
                        >
                            {t.guest.product.add_to_cart}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
