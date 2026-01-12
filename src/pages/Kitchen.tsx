import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Bell, Clock, Volume2, VolumeX, BellDot } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useKitchenSound } from "@/hooks/useKitchenSound";
import { KitchenOrderCard } from "@/components/kitchen/KitchenOrderCard";

export default function Kitchen() {
  const { orders: allOrders, isLoading, updateOrderStatus } = useOrders();
  const { soundEnabled, setSoundEnabled, playAlarm, stopAlarm, isPlaying } = useKitchenSound();
  const previousOrdersRef = useRef<string[]>([]);

  const pendingOrders = allOrders.filter((o) => o.status === "pending");
  const preparingOrders = allOrders.filter((o) => o.status === "preparing");
  const kitchenOrders = [...pendingOrders, ...preparingOrders];

  // Handle looping alarm based on pending orders
  useEffect(() => {
    if (!isLoading) {
      if (pendingOrders.length > 0 && soundEnabled) {
        playAlarm();
      } else {
        stopAlarm();
      }
    }

    // Safety stop if component unmounts
    return () => stopAlarm();
  }, [pendingOrders.length, soundEnabled, isLoading, playAlarm, stopAlarm]);

  // Show a toast with sound only when a *new* order arrives (ID detection)
  useEffect(() => {
    if (!isLoading) {
      const currentIds = kitchenOrders.map(o => o.id);
      const prevIds = previousOrdersRef.current;
      const hasNewOrder = currentIds.some(id => !prevIds.includes(id));

      if (hasNewOrder && prevIds.length > 0) {
        toast.info("🔔 NOVO PEDIDO!", {
          duration: 10000,
          description: "Uma nova solicitação de hóspede acabou de chegar.",
          className: "bg-primary text-white border-2 border-primary-foreground shadow-2xl scale-110",
        });
      }

      previousOrdersRef.current = currentIds;
    }
  }, [kitchenOrders, isLoading]);


  const handleStartOrder = (orderId: string) => {
    updateOrderStatus.mutate({ orderId, status: "preparing" });
    toast.success("Pedido iniciado!");
  };

  const handleFinishOrder = (orderId: string) => {
    updateOrderStatus.mutate({ orderId, status: "ready" });
    toast.success("✅ Pedido pronto!", { duration: 5000 });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-fade-in kitchen-display transition-colors duration-500 ${isPlaying ? "bg-red-50/30" : ""}`}>
      {/* Persistent Flashing Header for Pending Orders */}
      <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${pendingOrders.length > 0 ? 'bg-red-500 text-white animate-pulse shadow-xl scale-[1.01]' : 'bg-transparent'}`}>
        <div>
          <h1 className={`text-3xl lg:text-4xl font-display font-black tracking-tighter flex items-center gap-3 leading-none ${pendingOrders.length > 0 ? 'text-white' : 'text-slate-900'}`}>
            <Bell className={`h-8 w-8 lg:h-10 lg:w-10 ${pendingOrders.length > 0 ? 'text-white' : 'text-primary'}`} />
            Serviço de Quarto
          </h1>
          <p className={`text-sm font-bold uppercase tracking-wider mt-2 ${pendingOrders.length > 0 ? 'text-white/90' : 'text-muted-foreground'}`}>
            {pendingOrders.length} aguardando • {preparingOrders.length} em atendimento
          </p>
        </div>

        <Button
          variant={isPlaying ? "destructive" : (soundEnabled ? "default" : "outline")}
          size="lg"
          onClick={() => {
            if (isPlaying) stopAlarm();
            else setSoundEnabled(!soundEnabled);
          }}
          className={`gap-2 font-black uppercase text-xs tracking-widest shadow-lg ${isPlaying ? "bg-white text-red-600 hover:bg-white/90" : (pendingOrders.length > 0 ? "bg-white/20 text-white border-white/40 hover:bg-white/30" : "")}`}
        >
          {isPlaying ? (
            <>
              <Volume2 className="h-5 w-5" />
              Silenciar Alerta
            </>
          ) : soundEnabled ? (
            <>
              <Volume2 className="h-5 w-5" />
              Notificação Ativa
            </>
          ) : (
            <>
              <VolumeX className="h-5 w-5" />
              Notificação Desligada
            </>
          )}
        </Button>
      </div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight flex items-center gap-2 text-slate-800">
            <Clock className="h-6 w-6 text-warning" />
            Solicitações Pendentes ({pendingOrders.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pendingOrders.map((order) => (
              <KitchenOrderCard
                key={order.id}
                order={order}
                onStartOrder={handleStartOrder}
                onFinishOrder={handleFinishOrder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preparing Orders */}
      {preparingOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight flex items-center gap-2 text-slate-800">
            <Bell className="h-6 w-6 text-primary" />
            Em Atendimento ({preparingOrders.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {preparingOrders.map((order) => (
              <KitchenOrderCard
                key={order.id}
                order={order}
                onStartOrder={handleStartOrder}
                onFinishOrder={handleFinishOrder}
              />
            ))}
          </div>
        </div>
      )}

      {kitchenOrders.length === 0 && (
        <Card className="glass-card border-none shadow-md overflow-hidden bg-white/50 border-2 border-dashed border-muted">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-6 rounded-full bg-muted/20 mb-6">
              <Bell className="h-16 w-16 text-muted-foreground opacity-20" />
            </div>
            <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Nenhuma solicitação ativa</h2>
            <p className="text-muted-foreground font-medium mt-2">
              As solicitações dos hóspedes aparecerão aqui em tempo real.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
