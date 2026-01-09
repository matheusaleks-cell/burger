import { Order } from "@/hooks/useOrders";
import { OrderCard } from "./OrderCard";

interface OrderListProps {
    orders: Order[];
    onViewClick: (order: Order) => void;
    onStatusUpdate: (orderId: string, status: Order["status"]) => void;
    onCancelClick: (orderId: string) => void;
    onDeleteClick: (orderId: string) => void;
}

export const OrderList = ({
    orders,
    onViewClick,
    onStatusUpdate,
    onCancelClick,
    onDeleteClick,
}: OrderListProps) => {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
                <OrderCard
                    key={order.id}
                    order={order}
                    onViewClick={onViewClick}
                    onStatusUpdate={onStatusUpdate}
                    onCancelClick={onCancelClick}
                    onDeleteClick={onDeleteClick}
                />
            ))}
        </div>
    );
};
