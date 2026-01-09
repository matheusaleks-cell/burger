import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Bell, Volume2, VolumeX, Plus, ListFilter, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useOrders, Order } from "@/hooks/useOrders";
import { OrderTable } from "@/components/orders/OrderTable";
import { KanbanBoard } from "@/components/orders/KanbanBoard";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationSound } from "@/hooks/useNotificationSound";

export default function Orders() {
  const { orders, isLoading } = useOrders();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playNewOrderSound, playOrderReadySound, stopNewOrderLoop } = useNotificationSound();

  // Status Update Logic
  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    const updateData: any = { status };

    if (status === "preparing") {
      updateData.started_at = new Date().toISOString();
    } else if (status === "ready" || status === "delivered") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    // Stop the new order loop when we acknowledge/update an order
    stopNewOrderLoop();

    toast.success("Status atualizado!");

    // Play sound if order is ready and sound enabled
    if (status === 'ready' && soundEnabled) {
      playOrderReadySound();
    }

    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const cancelOrder = async (orderId: string) => {
    // Removed confirm to ensure it executes
    // if (!confirm("Tem certeza que deseja cancelar este pedido?")) return;
    toast.info("Cancelando pedido...");
    await updateOrderStatus(orderId, "cancelled");
  };

  const deleteOrder = async (orderId: string) => {
    toast.info("Apagando pedido...");

    // Delete items first
    await supabase.from("order_items").delete().eq("order_id", orderId);

    // Then delete order
    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) {
      console.error("Error deleting order:", error);
      toast.error("Erro ao apagar pedido (Permissão?)");
      return;
    }

    toast.success("Pedido apagado com sucesso!");
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toString().includes(searchTerm) ||
      order.customers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.room_number && order.room_number.includes(searchTerm));
    return matchesSearch;
  });

  // Count ready orders for notification badge
  const readyOrdersCount = orders.filter(o => o.status === "ready").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-slate-900">Gestor de Pedidos</h1>
          <p className="text-sm font-medium text-muted-foreground italic">
            {viewMode === 'kanban' ? 'Fluxo de Produção em Tempo Real' : 'Histórico e Lista Completa'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {readyOrdersCount > 0 && (
            <Badge variant="default" className="bg-green-500 text-white animate-pulse gap-1 px-3 py-1 font-black uppercase text-[10px]">
              <Bell className="h-3 w-3" />
              {readyOrdersCount} pronto{readyOrdersCount > 1 ? "s" : ""}
            </Badge>
          )}

          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-8 px-3 text-xs font-bold ${viewMode === 'kanban' ? 'shadow-sm' : 'text-gray-500'}`}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-8 px-3 text-xs font-bold ${viewMode === 'list' ? 'shadow-sm' : 'text-gray-500'}`}
              onClick={() => setViewMode('list')}
            >
              <ListFilter className="w-3.5 h-3.5 mr-1.5" /> Lista
            </Button>
          </div>


          <Button
            variant={soundEnabled ? "outline" : "ghost"}
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Som ativo" : "Som desligado"}
            className="hidden sm:flex"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hidden sm:flex"
            onClick={() => {
              playNewOrderSound();
              toast.success("Testando som...");
            }}
          >
            Testar Som
          </Button>

          <Button
            className="gap-2 font-black uppercase text-xs tracking-widest px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Novo Pedido
          </Button>

          <CreateOrderDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
      </div>

      {
        viewMode === 'kanban' ? (
          <div className="flex-1 min-h-0 bg-gray-50/50 rounded-2xl border border-gray-200/50 p-4">
            {/* Kanban only needs filtered active orders, but we pass full filtered list and let it filter active */}
            <KanbanBoard
              orders={filteredOrders}
              onStatusUpdate={updateOrderStatus}
              onCancelOrder={cancelOrder}
            />
          </div>
        ) : (
          <div className="flex-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {/* List View Filters */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <OrderTable
                orders={filteredOrders} // In list view, we usually want to see everything
                onViewClick={() => { }}
                onStatusUpdate={updateOrderStatus}
                onCancelClick={cancelOrder}
                onDeleteClick={deleteOrder}
              />
            </div>
          </div>
        )
      }
    </div >
  );
}
