import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, Bell } from "lucide-react";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-6">
            <SidebarTrigger />
            {/* New logo and admin text */}
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-full bg-white shadow-sm overflow-hidden border border-gray-100 shrink-0">
                <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
              </div>
              <span className="font-display font-black text-xl tracking-tighter text-slate-800">
                ADMIN
              </span>
            </div>
            <div className="flex-1" /> {/* Spacer to push items to the right */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex gap-2 mr-2">
                    <ExternalLink className="h-4 w-4" />
                    Acessar Cardápio
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.open("/", "_blank")}>
                    Pousada (Consumo Local)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open("/?delivery=true", "_blank")}>
                    Delivery / Retirada
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center animate-in zoom-in">
                  3
                </span>
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <div className="flex-1 p-4 lg:p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider >
  );
}
