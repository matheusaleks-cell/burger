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

import { useActiveOrders, usePaginatedOrders, Order } from "@/hooks/useOrders";
import { OrderTable } from "@/components/orders/OrderTable";
import { KanbanBoard } from "@/components/orders/KanbanBoard";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationSound } from "@/hooks/useNotificationSound";

export default function Orders() {
  // Two separate queries for different views
  const { orders: activeOrders, isLoading: loadingActive, updateOrderStatus: updateActive } = useActiveOrders();

  // Pagination State for List View
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { orders: historyOrders, isLoading: loadingHistory, updateOrderStatus: updateHistory, total, pageCount } = usePaginatedOrders({ page, pageSize });

  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playNewOrderSound, playOrderReadySound, stopNewOrderLoop } = useNotificationSound();

  // Helper to unify update call
  const handleStatusUpdate = (orderId: string, status: Order["status"]) => {
    if (viewMode === 'kanban') updateActive.mutate({ orderId, status });
    else updateHistory.mutate({ orderId, status });
  };

  const cancelOrder = async (orderId: string) => {
    toast.info("Cancelando pedido...");
    handleStatusUpdate(orderId, "cancelled");
  };

  const deleteOrder = async (orderId: string) => {
    // Delete logic remains same... but needs to access supabase directly or add delete mutation to hook
    // For now assuming direct supabase call is fine in page
    toast.info("Apagando pedido...");
    await supabase.from("order_items").delete().eq("order_id", orderId);
    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) {
      toast.error("Erro ao apagar");
    } else {
      toast.success("Apagado!");
      queryClient.invalidateQueries({ queryKey: ["active_orders"] });
      queryClient.invalidateQueries({ queryKey: ["paginated_orders"] });
    }
  };

  // Determine which orders to show
  const currentOrders = viewMode === 'kanban' ? activeOrders : historyOrders;
  const isLoading = viewMode === 'kanban' ? loadingActive : loadingHistory;

  const filteredOrders = currentOrders.filter((order) => {
    const term = searchTerm.toLowerCase();
    return (
      order.order_number.toString().includes(term) ||
      order.customers?.full_name?.toLowerCase().includes(term) ||
      (order.room_number && order.room_number.includes(term))
    );
  });

  const readyOrdersCount = activeOrders.filter(o => o.status === "ready").length;

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
            {viewMode === 'kanban' ? 'Fluxo de Produção (Ativos)' : 'Histórico Completo (Paginado)'}
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
            <KanbanBoard
              orders={filteredOrders}
              onStatusUpdate={(id, status) => handleStatusUpdate(id, status)}
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
                orders={filteredOrders}
                onViewClick={() => { }}
                onStatusUpdate={(id, status) => handleStatusUpdate(id, status)}
                onCancelClick={cancelOrder}
                onDeleteClick={deleteOrder}
              />
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <p className="text-xs text-slate-500 font-medium">
                Página {page} de {pageCount} (Total: {total})
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pageCount}
                  onClick={() => setPage(p => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
