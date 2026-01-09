import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/hooks/useOrders";
import {
    Clock,
    MapPin,
    Phone,
    User,
    CreditCard,
    StickyNote,
    ShoppingBag,
    Receipt,
    Printer,
    CalendarDays
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OrderDetailsDialogProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
}

export function OrderDetailsDialog({ order, isOpen, onClose }: OrderDetailsDialogProps) {
    const [customerOrderCount, setCustomerOrderCount] = useState<number | null>(null);

    useEffect(() => {
        if (order?.customer_id) {
            // Fetch total orders for this customer to show loyalty/stats
            const fetchStats = async () => {
                const { count, error } = await supabase
                    .from("orders")
                    .select("*", { count: "exact", head: true })
                    .eq("customer_id", order.customer_id);

                if (!error) {
                    setCustomerOrderCount(count);
                }
            };
            fetchStats();
        } else {
            setCustomerOrderCount(null);
        }
    }, [order?.customer_id]);

    if (!order) return null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const calculateTotal = () => {
        // If we have items, sum them (fallback for legacy orders without total)
        if (order.total > 0) return order.total;
        return order.order_items?.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0) || 0;
    };

    const getTotalItems = () => {
        return order.order_items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
    }

    const handlePrint = async () => {
        // Load settings dynamically
        const savedSettings = localStorage.getItem("printer_settings");
        const settings = savedSettings ? JSON.parse(savedSettings) : {
            paperWidth: "80mm",
            fontSize: "normal",
            showHeader: true,
            showNotes: true
        };
        import("@/utils/printUtils").then(mod => {
            mod.printOrderReceipt(order, settings);
        });
    };


    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 gap-0 border-none shadow-2xl">
                {/* Header */}
                <div className="bg-white p-6 border-b border-gray-100 sticky top-0 z-10">
                    <DialogHeader className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    Pedido #{order.order_number}
                                    <Badge variant={order.order_type === 'delivery' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                                        {order.order_type === 'delivery' ? 'Delivery' : order.order_type === 'room' ? `Quarto ${order.room_number}` : 'Balcão'}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription className="text-gray-500 font-medium mt-1 flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" /> {formatDate(order.created_at)}
                                </DialogDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-400 uppercase">Total</p>
                                <p className="text-3xl font-black text-primary">{formatCurrency(calculateTotal())}</p>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 bg-gray-50 space-y-6">
                    {/* Customer Info Card */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <User className="h-4 w-4" /> Cliente
                        </h3>
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-lg">
                                {order.customers?.full_name?.charAt(0) || "C"}
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="font-bold text-gray-900 text-lg leading-none">
                                    {order.customers?.full_name || "Cliente não identificado"}
                                </p>
                                {order.customers?.phone && (
                                    <p className="text-gray-500 font-medium flex items-center gap-2">
                                        <Phone className="h-3 w-3" /> {order.customers.phone}
                                    </p>
                                )}
                                {/* Address if delivery (using notes hack or future address field if implemented) */}
                                {order.order_type === 'delivery' && (
                                    <div className="mt-3 p-3 bg-orange-50 text-orange-800 rounded-xl text-sm font-medium flex items-start gap-2">
                                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span>Verificar endereço nas observações ou cadastro</span>
                                    </div>
                                )}
                            </div>
                            {customerOrderCount !== null && (
                                <div className="text-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                    <span className="block text-2xl font-black text-gray-900">{customerOrderCount}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Pedidos</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" /> Itens ({getTotalItems()})
                        </h3>
                        <div className="divide-y divide-gray-100">
                            {order.order_items?.map((item) => (
                                <div key={item.id} className="py-3 flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-gray-100 text-gray-600 font-black h-6 w-6 rounded flex items-center justify-center text-xs mt-0.5">
                                            {item.quantity}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{item.product_name}</p>
                                            {item.notes && (
                                                <p className="text-xs text-orange-600 font-medium italic mt-0.5 flex items-start gap-1">
                                                    <StickyNote className="h-3 w-3 mt-0.5" /> {item.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">
                                        {formatCurrency(item.unit_price * item.quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CreditCard className="h-4 w-4" /> Pagamento
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium text-sm">Método</span>
                                    <Badge variant="outline" className="uppercase font-bold">
                                        {order.payment_method || "Não informado"}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium text-sm">Status</span>
                                    <Badge className={order.status === 'delivered' ? 'bg-green-500' : 'bg-yellow-500'}>
                                        {order.status === 'delivered' ? 'Pago' : 'Pendente'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Receipt className="h-4 w-4" /> Observações
                            </h3>
                            <p className="text-sm text-gray-600 font-medium italic">
                                {order.notes || "Nenhuma observação no pedido."}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-white border-t border-gray-100 gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 h-12 font-bold gap-2"
                        onClick={handlePrint}
                    >
                        <Printer className="h-4 w-4" /> Imprimir Cupom
                    </Button>
                    <Button onClick={onClose} className="flex-1 h-12 font-bold bg-gray-900 text-white hover:bg-black">
                        Fechar Detalhes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
