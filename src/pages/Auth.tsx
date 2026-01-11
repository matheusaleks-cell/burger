import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Hotel, Loader2 } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(4, "Senha deve ter no mínimo 4 caracteres"),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    // Normalize username to email internally
    // User types "matheus" -> System checks "matheus@sistema.com"
    const cleanUsername = loginData.username.toLowerCase().trim().replace(/\s+/g, '');
    const email = cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@sistema.com`;

    const { error } = await signIn(email, loginData.password);

    setIsLoading(false);

    if (error) {
      console.error(error);
      toast.error("Usuário ou senha incorretos.");
      return;
    }

    toast.success("Login realizado! Redirecionando...");
    // Force redirect to Dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <Card className="w-full max-w-md glass-card animate-slide-up relative">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-primary/20 overflow-hidden group hover:scale-105 transition-transform duration-500">
            <img src="/logo.png" alt="Burger Pousada" className="h-full w-full object-cover" />
          </div>
          <div>
            <CardTitle className="text-3xl font-display font-black tracking-tighter">POUSADA ADMIN</CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground">
              Acesso exclusivo para administradores
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Usuário</Label>
              <Input
                id="login-username"
                type="text"
                placeholder="Ex: matheus"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                autoComplete="username"
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                autoComplete="current-password"
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>

            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={async () => {
                  toast.info("Criando usuário Mathes...");
                  const { error } = await supabase.auth.signUp({
                    email: 'matheus@sistema.com',
                    password: '211198',
                    options: { data: { full_name: 'Matheus Admin' } }
                  });

                  if (error) {
                    // Check if user already exists
                    if (error.message.includes("already registered")) {
                      toast.success("Usuário já existe! Pode entrar com a senha.");
                    } else {
                      toast.error("Erro: " + error.message);
                    }
                  } else {
                    toast.success("Usuário criado com sucesso! Pode entrar.");
                  }
                  setIsLoading(false);
                }}
                className="text-sm text-primary underline hover:text-primary/80 font-medium"
              >
                ⚠️ Primeiro Acesso? Clique aqui para criar o usuário "Matheus"
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="absolute bottom-4 text-xs text-muted-foreground opacity-30">
        Supabase Project: {import.meta.env.VITE_SUPABASE_PROJECT_ID || "..."}
      </div>
    </div>
  );
}
