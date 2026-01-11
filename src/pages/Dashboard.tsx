import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { OrderStatusGrid } from "@/components/dashboard/OrderStatusGrid";
import { RecentOrdersCard } from "@/components/dashboard/RecentOrdersCard";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { PopularItemsCard } from "@/components/dashboard/PopularItemsCard";

export default function Dashboard() {
  const { stats, recentOrders, popularItems, isLoading } = useDashboardStats();
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-display font-black tracking-tighter text-slate-900 leading-none">Visão Geral</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <p className="text-sm font-medium">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        <Button
          size="lg"
          onClick={() => setIsOrderDialogOpen(true)}
          className="gap-2 font-black uppercase text-xs tracking-widest px-8 py-6 shadow-xl shadow-primary/20 animate-pulse hover:animate-none group transition-all"
        >
          <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
            <Plus className="h-5 w-5" />
          </div>
          Lançar Consumo / Novo Pedido
        </Button>
      </div>

      <CreateOrderDialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen} />

      <StatsGrid stats={stats} />
      <OrderStatusGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersCard orders={recentOrders} />
        </div>
        <div className="lg:col-span-1">
          <PopularItemsCard items={popularItems} />
        </div>
      </div>
    </div>
  );
}
