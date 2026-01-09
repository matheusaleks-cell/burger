import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, BedDouble, ChefHat, ArrowRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function GuestLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero_background.png')" }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-12 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4 animate-slide-up">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-primary/20 backdrop-blur-md border border-white/10 shadow-2xl">
              <UtensilsCrossed className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter text-white">
            Burger<span className="text-gradient">System</span>
          </h1>
          <p className="text-gray-300 text-xl md:text-2xl max-w-xl mx-auto font-light">
            Elegância e praticidade no seu atendimento de Room Service
          </p>
        </div>

        {/* Options */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Guest Option */}
          <Card
            className="glass-card border-white/10 hover:border-primary/50 group transition-all duration-500 cursor-pointer overflow-hidden transform hover:-translate-y-2"
            onClick={() => navigate("/guest/menu")}
          >
            <CardHeader className="text-center pb-2 relative">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="mx-auto p-5 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-500 mb-4 scale-110">
                <BedDouble className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-white group-hover:text-primary transition-colors">
                Sou Hóspede
              </CardTitle>
              <CardDescription className="text-gray-400 text-base">
                Explore nosso cardápio gourmet e faça seu pedido direto do quarto
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8 pt-4">
              <Button className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all" size="lg">
                Ver Cardápio
              </Button>
            </CardContent>
          </Card>

          {/* Staff Option */}
          <Card
            className="glass-card border-white/10 hover:border-white/30 group transition-all duration-500 cursor-pointer overflow-hidden transform hover:-translate-y-2 text-white"
            onClick={() => navigate(user ? "/dashboard" : "/auth")}
          >
            <CardHeader className="text-center pb-2 relative">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div className="mx-auto p-5 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-all duration-500 mb-4 scale-110">
                {user ? (
                  <LayoutDashboard className="h-12 w-12 text-white" />
                ) : (
                  <ChefHat className="h-12 w-12 text-white" />
                )}
              </div>
              <CardTitle className="text-3xl font-bold transition-colors">
                Sou Funcionário
              </CardTitle>
              <CardDescription className="text-gray-400 text-base">
                Acesse o painel administrativo, cozinha ou controle de pedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8 pt-4">
              <Button variant="outline" className="w-full h-12 text-lg font-bold border-white/20 hover:bg-white/10 transition-all" size="lg">
                {user ? "Ir para o Painel" : "Acesse sua Conta"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Track order link */}
        <div className="text-center animate-fade-in [animation-delay:600ms]">
          <Button
            variant="ghost"
            onClick={() => navigate("/track")}
            className="text-gray-400 hover:text-white hover:bg-white/5 text-base py-6"
          >
            Já fez um pedido? <span className="text-primary font-bold ml-1">Acompanhe aqui o status</span>
          </Button>
        </div>
      </div>

      {/* Decorative gradient blur */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
