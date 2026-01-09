import { useState, useEffect } from "react";
import { Order } from "@/hooks/useOrders";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, ChefHat, AlertCircle, ShoppingBag, Truck, MessageCircle, X, Printer } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { differenceInMinutes } from "date-fns";
import { format } from "date-fns";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { usePousadas } from "@/hooks/usePousadas";

interface KanbanBoardProps {
    orders: Order[];
    onStatusUpdate: (orderId: string, status: Order["status"]) => void;
    onCancelOrder: (orderId: string) => void;
}

const COLUMNS = [
    {
        id: "pending",
        label: "Em análise",
        color: "bg-orange-500",
        lightColor: "bg-orange-50",
        borderColor: "border-orange-200",
        icon: AlertCircle,
        countColor: "text-orange-600"
    },
    {
        id: "preparing",
        label: "Em produção",
        color: "bg-yellow-400", // Anotaí uses a vibrant yellow/orange
        lightColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        icon: ChefHat,
        countColor: "text-yellow-700"
    },
    {
        id: "ready", // This maps to "Prontos para entrega"
        label: "Prontos para entrega",
        color: "bg-green-500",
        lightColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: CheckCircle2,
        countColor: "text-green-600"
    }
];

export function KanbanBoard({ orders, onStatusUpdate, onCancelOrder }: KanbanBoardProps) {
    // Filter active orders only (exclude delivered/cancelled for the board)
    const activeOrders = orders.filter(o => ["pending", "preparing", "ready"].includes(o.status));
    const { pousadas } = usePousadas();

    // Assume HQ or first pousada defines the global estimated time for now
    const currentSettings = pousadas.find(p => p.is_hq) || pousadas[0];
    const estimatedTime = currentSettings
        ? `${currentSettings.estimated_time_min || 30}-${currentSettings.estimated_time_max || 45} min`
        : "30-45 min";

    const getOrdersByStatus = (status: string) => {
        return activeOrders.filter(o => o.status === status).sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    };

    const getElapsedTime = (dateString: string) => {
        const minutes = differenceInMinutes(new Date(), new Date(dateString));
        return `${minutes} min`;
    };

    const [activeTab, setActiveTab] = useState("pending");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header Stats - Anotaí Style */}
            <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 pr-6 border-r border-gray-100">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg"><ShoppingBag className="w-5 h-5" /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Pedidos Hoje</p>
                        <p className="text-xl font-black text-gray-900">{orders.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 pr-6 border-r border-gray-100">
                    <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg"><Truck className="w-5 h-5" /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Delivery</p>
                        <p className="text-xl font-black text-gray-900">{orders.filter(o => o.order_type === 'delivery').length}</p>
                    </div>
                </div>
                {/* Time Estimate from Settings */}
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-lg"><Clock className="w-5 h-5" /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Tempo Estimado</p>
                        <p className="text-xl font-black text-gray-900">{estimatedTime}</p>
                    </div>
                </div>
            </div>

            {/* Kanban Columns - Responsive Grid/Tabs */}
            {/* Desktop View (Hidden on mobile) */}
            <div className="hidden lg:flex flex-1 overflow-x-auto">
                <div className="flex h-full w-full gap-4">
                    {COLUMNS.map((col) => {
                        const colOrders = getOrdersByStatus(col.id);
                        return (
                            <KanbanColumn
                                key={col.id}
                                col={col}
                                orders={colOrders}
                                onStatusUpdate={onStatusUpdate}
                                onCancelOrder={onCancelOrder}
                                getElapsedTime={getElapsedTime}
                                onOrderClick={handleOrderClick}
                            />
                        )
                    })}
                </div>
            </div>

            {/* Mobile View (Tabs) */}
            <div className="lg:hidden flex-1 flex flex-col min-h-0">
                <div className="grid grid-cols-3 gap-1 mb-2">
                    {COLUMNS.map((col) => {
                        const count = getOrdersByStatus(col.id).length;
                        return (
                            <button
                                key={col.id}
                                onClick={() => setActiveTab(col.id)}
                                className={`p-2 rounded-lg text-xs font-bold uppercase transition-all flex flex-col items-center gap-1 border ${activeTab === col.id ? `${col.lightColor} ${col.countColor} border-${col.id === 'pending' ? 'orange' : col.id === 'preparing' ? 'yellow' : 'green'}-300 shadow-sm` : 'bg-white text-gray-400 border-gray-100'}`}
                            >
                                <col.icon className="w-4 h-4" />
                                <span>{col.label.split(' ')[0]}</span>
                                <span className="text-[10px] bg-white/50 px-1.5 rounded-full border border-black/5">{count}</span>
                            </button>
                        )
                    })}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {COLUMNS.map((col) => {
                        if (col.id !== activeTab) return null;
                        const colOrders = getOrdersByStatus(col.id);
                        return (
                            <KanbanColumn
                                key={col.id}
                                col={col}
                                orders={colOrders}
                                onStatusUpdate={onStatusUpdate}
                                onCancelOrder={onCancelOrder}
                                getElapsedTime={getElapsedTime}
                                onOrderClick={handleOrderClick}
                            />
                        )
                    })}
                </div>
            </div>

            <OrderDetailsDialog
                order={selectedOrder}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />
        </div>
    );
}

// Extracted Column Component to avoid duplication
function KanbanColumn({ col, orders, onStatusUpdate, onCancelOrder, getElapsedTime, onOrderClick }: any) {
    const Icon = col.icon;
    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50/50 rounded-2xl border border-gray-200/60 overflow-hidden min-w-[300px] lg:min-w-0">
            {/* Column Header */}
            <div className={`${col.color} text-white p-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-wide">{col.label}</span>
                </div>
                <Badge className="bg-white/20 text-white border-0 font-bold">{orders.length}</Badge>
            </div>

            {/* Sub-header */}
            <div className="bg-white p-2 text-center border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {col.id === 'pending' ? 'Confirmação Rápida' : col.id === 'preparing' ? 'Cozinha a mil' : 'Saindo!'}
            </div>

            {/* Orders List */}
            <ScrollArea className="flex-1 p-3">
                <div className="space-y-3 pb-4">
                    {orders.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl m-2">
                            <p className="text-sm font-medium">Nenhum pedido</p>
                        </div>
                    ) : (
                        orders.map((order: any) => (
                            <Card
                                key={order.id}
                                className="border-l-4 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden cursor-pointer"
                                style={{ borderLeftColor: col.id === 'pending' ? '#f97316' : col.id === 'preparing' ? '#facc15' : '#22c55e' }}
                                onClick={() => onOrderClick && onOrderClick(order)}
                            >
                                <CardContent className="p-4">
                                    {/* Card Header: ID + Time */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-xs font-black text-gray-400">#{order.order_number}</span>
                                            <h4 className="font-bold text-gray-900 leading-tight">
                                                {order.customers?.full_name || order.notes?.split('|')[0]?.replace('Cliente: ', '') || "Visitante"}
                                            </h4>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <Badge variant="outline" className="bg-gray-50 text-gray-600 text-[10px] font-bold gap-1 mb-1">
                                                <Clock className="w-3 h-3" /> {getElapsedTime(order.created_at)}
                                            </Badge>
                                            {order.order_type === 'delivery' ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold border-0 px-1.5 h-5">Delivery</Badge>
                                            ) : (
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] font-bold border-0 px-1.5 h-5">Mesa/Qto</Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Items Summary (First 2 items + more) */}
                                    <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg border border-gray-100/50">
                                        {order.order_items?.slice(0, 2).map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center py-0.5">
                                                <span className="truncate max-w-[140px] text-xs font-medium"><span className="font-bold">{item.quantity}x</span> {item.product_name}</span>
                                            </div>
                                        ))}
                                        {(order.order_items?.length || 0) > 2 && (
                                            <p className="text-[10px] text-gray-400 font-medium italic mt-1">+ {(order.order_items?.length || 0) - 2} itens...</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                        {col.id === 'pending' && (
                                            <Button size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600 font-bold text-xs h-9"
                                                onClick={() => onStatusUpdate(order.id, 'preparing')}>
                                                Aceitar Pedido
                                            </Button>
                                        )}

                                        {col.id === 'preparing' && (
                                            <Button size="sm" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xs h-9"
                                                onClick={() => onStatusUpdate(order.id, 'ready')}>
                                                <ChefHat className="w-4 h-4 mr-1.5" /> Finalizar
                                            </Button>
                                        )}

                                        {col.id === 'ready' && (
                                            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 font-bold text-xs h-9"
                                                onClick={() => onStatusUpdate(order.id, 'delivered')}>
                                                <Truck className="w-4 h-4 mr-1.5" /> Entregar
                                            </Button>
                                        )}

                                        <Button size="icon" variant="ghost" className="h-9 w-9 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                                            onClick={() => {
                                                // Load settings
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
                                            }} title="Imprimir Cupom">
                                            <Printer className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                            onClick={() => onCancelOrder(order.id)} title="Cancelar">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
