import { Toaster } from "@/components/ui/toaster";
import React, { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PousadaProvider } from "@/contexts/PousadaContext";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
// Pages (Lazy Loaded)
const Auth = React.lazy(() => import("./pages/Auth"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Products = React.lazy(() => import("./pages/Products"));
const Customers = React.lazy(() => import("./pages/Customers"));
const Orders = React.lazy(() => import("./pages/Orders"));
const Kitchen = React.lazy(() => import("./pages/Kitchen"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Pousadas = React.lazy(() => import("./pages/Pousadas"));
const Track = React.lazy(() => import("./pages/Track"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
// const GuestLanding = React.lazy(() => import("./pages/GuestLanding")); // Not used?
const GuestMenu = React.lazy(() => import("./pages/GuestMenu"));
const GuestTrack = React.lazy(() => import("./pages/GuestTrack"));
const MenuManagement = React.lazy(() => import("./pages/MenuManagement"));
const Addons = React.lazy(() => import("./pages/Addons"));
const Neighborhoods = React.lazy(() => import("./pages/admin/Neighborhoods"));

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, role, loading, isAdmin } = useAuth();

  useEffect(() => {
    // Admin role should be set via Supabase Dashboard only
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Determine effective role same as Sidebar
  const effectiveRole = isAdmin ? "admin" : role;

  if (allowedRoles && effectiveRole && !allowedRoles.includes(effectiveRole)) {
    // Redirect unauthorized access to kitchen as safe default
    return <Navigate to="/kitchen" replace />;
  }


  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/orders" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <Routes>
        {/* Guest routes (no auth required) */}
        <Route path="/" element={<GuestMenu />} />
        <Route path="/guest/menu" element={<Navigate to="/" replace />} />
        <Route path="/guest/track/:orderNumber" element={<GuestTrack />} />

        {/* Auth routes */}
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />

        {/* Legacy welcome page redirected to root */}
        <Route path="/welcome" element={<Navigate to="/" replace />} />

        {/* Order tracking (legacy) */}
        <Route path="/track" element={<Track />} />
        <Route path="/track/:orderNumber" element={<Track />} />

        {/* Protected routes with layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "attendant"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={["admin", "attendant"]}>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={["admin", "attendant", "kitchen"]}>
                <Kitchen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addons"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Addons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/menu-management"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <MenuManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={["admin", "attendant"]}>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pousadas"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Pousadas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/neighborhoods"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Neighborhoods />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </React.Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <PousadaProvider>
              <CartProvider>
                <AppRoutes />
              </CartProvider>
            </PousadaProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
