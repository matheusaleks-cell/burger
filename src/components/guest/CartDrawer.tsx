import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, ArrowRight, Truck, CreditCard, QrCode, Banknote, AlertCircle, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    guestName: string;
    onSubmitOrder: (paymentDetails?: string) => void;
    isSubmitting: boolean;
    deliveryFee: number;
    pousadaName?: string;
}

export function CartDrawer({
    isOpen,
    onClose,
    guestName,
    onSubmitOrder,
    isSubmitting,
    deliveryFee,
    pousadaName
}: CartDrawerProps) {
    const { cart, updateQuantity, cartTotal } = useCart();
    const [step, setStep] = useState<"referral" | "payment">("referral");
    const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "cash">("pix");
    const [changeFor, setChangeFor] = useState("");

    // Reset step when closed
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep("referral");
                setPaymentMethod("pix");
                setChangeFor("");
            }, 300);
        }
    }, [isOpen]);

    const finalTotal = cartTotal + deliveryFee;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const handleNextStep = () => {
        setStep("payment");
    };

    const handleFinalSubmit = () => {
        // Prepare payment details string
        let paymentDetails = `Pagamento: ${paymentMethod === 'card' ? 'Cartão' : paymentMethod === 'pix' ? 'Pix' : 'Dinheiro'}`;
        if (paymentMethod === 'cash' && changeFor) {
            paymentDetails += ` (Troco para R$ ${changeFor})`;
        }

        // Pass this back to parent via onSubmitOrder prop
        // We need to change the prop signature in parent to accept this string, 
        // OR we can hack it by appending to the FIRST item's notes if the parent is strict.
        // Ideally, the parent component (GuestMenu) should receive this.
        // For now, let's assume the parent can handle this extra data or we append it to the call.

        // Since the interface is onSubmitOrder: () => void, we must modify the parent or use a hack.
        // Let's modify the parent (GuestMenu) right after this.
        // For now, we call the prop, but we need to EXPORT the payment state or modify the prop.
        // Actually, the best way without breaking the interface immediately is to expose the payment state 
        // via a callback or Ref to the parent, OR update the prop signature.
        // Let's changing prop signature is cleaner.

        onSubmitOrder(paymentDetails);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl gap-0 border-none shadow-2xl">
                <div className="p-6 bg-white border-b border-gray-100">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-800">
                            {step === "referral" ? "Revisar Pedido" : "Pagamento"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 font-medium pt-1">
                            {step === "referral" ? `Confira os itens para ${guestName}` : "Escolha como deseja pagar"}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto bg-gray-50 min-h-[300px]">
                    {step === "referral" ? (
                        <>
                            <section className="space-y-3">
                                <h5 className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Itens no Carrinho</h5>
                                {cart.map((item) => (
                                    <div key={item.id} className="flex flex-col bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800">{item.product.name}</p>
                                                <p className="text-sm text-gray-500 font-medium">
                                                    {formatCurrency(item.product.price + item.selectedComplements.reduce((acc, c) => acc + c.price, 0))}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-full border border-gray-100">
                                                <button
                                                    className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                >
                                                    <Minus className="h-4 w-4 text-primary" />
                                                </button>
                                                <span className="w-5 text-center font-black text-gray-800">{item.quantity}</span>
                                                <button
                                                    className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                >
                                                    <Plus className="h-4 w-4 text-primary" />
                                                </button>
                                            </div>
                                        </div>

                                        {(item.selectedComplements.length > 0 || item.notes) && (
                                            <div className="text-xs text-gray-500 border-t border-gray-50 pt-2 mt-1 space-y-1">
                                                {item.selectedComplements.map((comp, idx) => (
                                                    <div key={idx} className="flex justify-between">
                                                        <span>+ {comp.name}</span>
                                                        {comp.price > 0 && <span>{formatCurrency(comp.price)}</span>}
                                                    </div>
                                                ))}
                                                {item.notes && (
                                                    <div className="text-orange-600 font-medium mt-1">
                                                        Adj: {item.notes}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </section>

                            <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                                <div className="flex items-center justify-between text-gray-500">
                                    <span className="font-medium">Subtotal</span>
                                    <span>{formatCurrency(cartTotal)}</span>
                                </div>

                                <div className="flex items-center justify-between text-gray-500">
                                    <span className="font-medium flex items-center gap-2">
                                        <Truck className="w-4 h-4" />
                                        Entrega {pousadaName && `(${pousadaName})`}
                                    </span>
                                    <span className="text-gray-800 font-medium">
                                        {deliveryFee > 0 ? formatCurrency(deliveryFee) : <span className="text-green-600 font-bold">Grátis</span>}
                                    </span>
                                </div>

                                <div className="h-[1px] bg-gray-100" />
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-black text-gray-800">Total</span>
                                    <span className="text-2xl font-black text-primary">{formatCurrency(finalTotal)}</span>
                                </div>
                            </section>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-black text-gray-800 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-primary" /> Forma de Pagamento
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => setPaymentMethod('pix')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'border-gray-100'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                                                <QrCode className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-gray-700">PIX</span>
                                        </div>
                                        {paymentMethod === 'pix' && <div className="w-4 h-4 rounded-full bg-primary" />}
                                    </button>

                                    <button
                                        onClick={() => setPaymentMethod('card')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-gray-100'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <CreditCard className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-gray-700">Cartão (Maquininha)</span>
                                        </div>
                                        {paymentMethod === 'card' && <div className="w-4 h-4 rounded-full bg-primary" />}
                                    </button>

                                    <button
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-gray-100'}`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                                    <Banknote className="w-5 h-5" />
                                                </div>
                                                <span className="font-bold text-gray-700">Dinheiro</span>
                                            </div>
                                            {paymentMethod === 'cash' && <div className="w-4 h-4 rounded-full bg-primary" />}
                                        </div>

                                        {paymentMethod === 'cash' && (
                                            <div className="mt-4 pl-12 animate-in fade-in slide-in-from-top-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Troco para quanto?</label>
                                                <div className="relative mt-1">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Ex: 50,00"
                                                        value={changeFor}
                                                        onChange={(e) => setChangeFor(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl">
                                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                                    <span className="text-gray-400 font-medium">Total a Pagar</span>
                                    <span className="text-3xl font-black">{formatCurrency(finalTotal)}</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm text-gray-400">
                                    <AlertCircle className="w-5 h-5 shrink-0 text-yellow-400" />
                                    <p>Verifique o pedido antes de finalizar. O pagamento será feito na entrega.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-white border-t border-gray-100 flex-col sm:flex-row gap-3">
                    {step === "referral" ? (
                        <>
                            <Button
                                variant="ghost"
                                className="flex-1 h-14 font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Adicionar Mais
                            </Button>
                            <Button
                                className="flex-[2] h-14 text-lg font-black bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20"
                                onClick={handleNextStep}
                                disabled={isSubmitting || cart.length === 0}
                            >
                                Continuar <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                className="flex-1 h-14 font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl"
                                onClick={() => setStep("referral")}
                                disabled={isSubmitting}
                            >
                                Voltar
                            </Button>
                            <Button
                                className="flex-[2] h-14 text-lg font-black bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-xl shadow-green-600/20"
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                                ) : (
                                    <span className="flex items-center gap-2">Confirmar Pedido <Check className="h-5 w-5" /></span>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
