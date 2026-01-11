import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  MapPin,
  UtensilsCrossed,
  ChefHat,
  LucideIcon,
  List
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Define a strict type for menu items
type MenuItem = {
  title: string;
  icon: LucideIcon;
  href: string;
  roles: ("admin" | "attendant" | "kitchen")[];
};

{
  title: "CATEGORIAS (Novo)",
    icon: List,
      href: "/menu-management",
        roles: ["admin", "attendant"],
  },
{
  title: "Pedidos / Delivery",
    icon: ShoppingBag,
      href: "/orders",
        roles: ["admin", "attendant"],
  },
// KDS Removed as requested
{
  title: "Dashboard",
    icon: LayoutDashboard,
      href: "/dashboard",
        roles: ["admin", "attendant"],
  },
{
  title: "Cardápio / Produtos",
    icon: Package,
      href: "/products",
        roles: ["admin"],
  },
{
  title: "Categorias / Sessões",
    icon: UtensilsCrossed,
      href: "/menu-management",
        roles: ["admin"],
  },
{
  title: "Clientes",
    icon: Users,
      href: "/customers",
        roles: ["admin", "attendant"],
  },
{
  title: "Relatórios",
    icon: BarChart3,
      href: "/reports",
        roles: ["admin"],
  },
];

const SYSTEM_MENU_ITEMS: MenuItem[] = [
  {
    title: "Locais / Pousadas",
    icon: MapPin,
    href: "/pousadas",
    roles: ["admin"],
  },
  {
    title: "Bairros / Taxas",
    icon: MapPin,
    href: "/neighborhoods",
    roles: ["admin"],
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/settings",
    roles: ["admin"],
  },
];

export function AppSidebar() {
  const { role, fullName, username, signOut, isAdmin } = useAuth();
  const location = useLocation();

  // Determine effective role for filtering
  const effectiveRole = isAdmin ? "admin" : (role as "admin" | "attendant" | "kitchen" | null);

  const filterItems = (items: MenuItem[]) => {
    if (!effectiveRole) return [];
    return items.filter((item) => item.roles.includes(effectiveRole));
  };

  const filteredMainMenu = filterItems(MAIN_MENU_ITEMS);
  const filteredSystemMenu = filterItems(SYSTEM_MENU_ITEMS);

  return (
    <Sidebar className="border-r-0 glass-sidebar">
      <SidebarHeader className="p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-white leading-none">BURGER</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-200 font-semibold mt-1">NOW</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        {filteredMainMenu.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-bold text-indigo-200/50 uppercase tracking-widest px-2 mb-3">
              Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1.5">
                {filteredMainMenu.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`
                        transition-all duration-300 px-4 py-3 h-auto rounded-xl group relative overflow-hidden
                        ${isActive
                            ? 'bg-white/10 text-white shadow-lg border border-white/5'
                            : 'text-indigo-100/70 hover:bg-white/5 hover:text-white'
                          }
                      `}
                      >
                        <NavLink to={item.href} className="flex items-center w-full z-10 relative">
                          <item.icon className={`h-5 w-5 mr-3 transition-transform duration-300 ${isActive ? 'scale-110 text-amber-400' : 'group-hover:scale-110'}`} />
                          <span className="font-medium tracking-wide text-[15px]">{item.title}</span>
                          {isActive && (
                            <div className="absolute right-0 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredSystemMenu.length > 0 && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-[11px] font-bold text-indigo-200/50 uppercase tracking-widest px-2 mb-3">
              Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1.5">
                {filteredSystemMenu.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`
                        transition-all duration-300 px-4 py-3 h-auto rounded-xl group relative overflow-hidden
                        ${isActive
                            ? 'bg-white/10 text-white shadow-lg border border-white/5'
                            : 'text-indigo-100/70 hover:bg-white/5 hover:text-white'
                          }
                      `}
                      >
                        <NavLink to={item.href} className="flex items-center w-full z-10 relative">
                          <item.icon className={`h-5 w-5 mr-3 transition-transform duration-300 ${isActive ? 'scale-110 text-amber-400' : 'group-hover:scale-110'}`} />
                          <span className="font-medium tracking-wide text-[15px]">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white font-bold shadow-lg">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {fullName || username || "Usuário"}
            </p>
            <p className="text-xs text-indigo-200 font-medium capitalize">
              {role === "admin" ? "Administrador" : role === "attendant" ? "Atendente" : "Cozinha"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="shrink-0 h-9 w-9 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
