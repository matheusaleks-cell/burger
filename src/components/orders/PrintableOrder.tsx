import { Order } from "@/hooks/useOrders";
import { format } from "date-fns";

interface PrintableOrderProps {
    order: Order;
}

export function PrintableOrder({ order }: PrintableOrderProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    return (
        <div className="hidden print:block p-0 m-0 w-[80mm] text-black bg-white font-mono text-xs leading-tight">
            {/* Header */}
            <div className="text-center border-b border-black pb-2 mb-2">
                <h1 className="text-xl font-bold uppercase">Burger Pousada</h1>
                <p className="text-[10px]">Pedido #{order.order_number}</p>
                <p className="text-[10px]">{format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}</p>
            </div>

            {/* Customer Info */}
            <div className="mb-4 border-b border-black pb-2">
                <p className="font-bold text-sm">
                    {order.order_type === 'delivery' ? 'ENTREGA' : (order.order_type === 'room' ? 'QUARTO' : 'MESA')}
                </p>
                <p className="text-sm">Cliente: {order.customers?.full_name || "Convidado"}</p>
                {order.order_type === 'room' && (
                    <p className="text-lg font-bold mt-1">QUARTO: {order.room_number}</p>
                )}
                {order.customers?.phone && (
                    <p>Tel: {order.customers.phone}</p>
                )}
            </div>

            {/* Items */}
            <div className="mb-4">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="py-1 w-8">Qtd</th>
                            <th className="py-1">Item</th>
                            <th className="py-1 text-right">R$</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.order_items?.map((item) => (
                            <tr key={item.id} className="border-b border-gray-400 border-dashed">
                                <td className="py-2 align-top font-bold">{item.quantity}x</td>
                                <td className="py-2 align-top">
                                    <div className="font-bold">{item.product?.name || item.product_name}</div>
                                    {item.notes && (
                                        <div className="text-[10px] italic mt-1">Obs: {item.notes}</div>
                                    )}
                                </td>
                                <td className="py-2 align-top text-right">
                                    {formatCurrency(item.unit_price * item.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="text-right border-t border-black pt-2 mb-8">
                <p className="text-lg font-bold">TOTAL: {formatCurrency(order.total)}</p>
                <p className="text-[10px] uppercase mt-1">Pagamento via: {order.payment_method || "Pendente"}</p>
            </div>

            <div className="text-center text-[10px] mb-8">
                <p>*** FIM DO PEDIDO ***</p>
            </div>
        </div>
    );
}
