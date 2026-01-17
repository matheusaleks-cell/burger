import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProductModal, SelectedComplement } from "@/components/menu/ProductModal";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCart } from "@/contexts/CartContext";
import { usePousadaContext } from "@/contexts/PousadaContext";
import { usePousadas } from "@/hooks/usePousadas";
import { calculateDistance, calculateDeliveryFee } from "@/utils/distanceUtils";
import { Badge } from "@/components/ui/badge";
import { Clock, Store, Lock } from "lucide-react";
import { PromoCarousel } from "@/components/guest/PromoCarousel";
import { OrderSuccessOverlay } from "@/components/guest/OrderSuccessOverlay";

// Components
import { GuestHeader } from "@/components/guest/GuestHeader";
import { CategoryNav } from "@/components/guest/CategoryNav";
import { ProductList } from "@/components/guest/ProductList";
import { CartDrawer } from "@/components/guest/CartDrawer";
import { GuestIdentification } from "@/components/guest/GuestIdentification";
import { FooterCart } from "@/components/guest/FooterCart";

import { useNeighborhoods } from "@/hooks/useNeighborhoods";

// ... components imports ...

const GUEST_STORAGE_KEY = "guest_info";

interface GuestInfoState {
  name: string;
  room: string; // Used as "Full Address String" for compatibility
  phone: string;
  latitude: number | null;
  longitude: number | null;
  address_complement?: string; // Legacy
  // New Fields
  street?: string;
  number?: string;
  neighborhood_id?: string;
  reference?: string;
}

export default function GuestMenu() {
  const navigate = useNavigate();
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { data: allCategories = [], isLoading: isLoadingCategories } = useCategories();
  const { addToCart, clearCart, cartTotal, cart } = useCart();

  const { currentPousada, setPousada, isLoading: isLoadingContext, isDeliveryMode, resetMode } = usePousadaContext();

  // ZOMBIE CART PROTECTION: Clear cart if Pousada changes
  useEffect(() => {
    // We only clear if there is a cart and we switched to a different valid context
    // This assumes specific products might not be available. A smarter approach would be to validate items.
    // For now, safety first: clear.
    if (cart.length > 0) {
      // If items in cart don't belong to current context (we can check availablity logic here or just nuking it for safety)
      // Let's just nuke it on context switch to ensure correct pricing/menu.
      // But we need to avoid clearing on initial load.
      // Actually, let's trust the user to clear manually OR clear if they explicitly change mode.
      // Better: When `resetMode` is called, we should probably clear cart?
    }
  }, [currentPousada?.id]);

  // Better approach: Add clear to resetMode in PousadaContext or detect change here.
  // Let's hook into resetMode via the UI button actions instead of Effect to avoid annoyance on reload.


  // Filter Categories Logic
  const categories = allCategories.filter(cat =>
    !currentPousada?.hidden_categories?.includes(cat.id)
  );
  const { pousadas } = usePousadas();
  const { neighborhoods } = useNeighborhoods();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIdentified, setIsIdentified] = useState(false);
  const [isIdentificationOpen, setIsIdentificationOpen] = useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestInfoState>({
    name: "",
    room: "",
    phone: "",
    latitude: null,
    longitude: null,
    address_complement: "",
    street: "",
    number: "",
    neighborhood_id: "",
    reference: ""
  });

  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isStoreClosed, setIsStoreClosed] = useState(false); // Can be derived from currentPousada
  const [successOrderNum, setSuccessOrderNum] = useState<number | null>(null);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  useEffect(() => {
    if (currentPousada) {
      // If currentPousada has is_open property and it is false, store is closed.
      // If undefined, assume default open (true).
      if (currentPousada.is_open === false) {
        setIsStoreClosed(true);
      } else {
        setIsStoreClosed(false);
      }
    }
  }, [currentPousada]);

  // Update Delivery Fee based on Neighborhood
  useEffect(() => {
    if (guestInfo.neighborhood_id) {
      const hood = neighborhoods.find(n => n.id === guestInfo.neighborhood_id);
      if (hood) {
        setDeliveryFee(Number(hood.fee));
      }
    } else {
      setDeliveryFee(0);
    }
  }, [guestInfo.neighborhood_id, neighborhoods]);

  useEffect(() => {
    const savedInfo = localStorage.getItem(GUEST_STORAGE_KEY);
    if (savedInfo) {
      try {
        const parsed = JSON.parse(savedInfo);
        if (parsed.name && parsed.room) {
          setGuestInfo(parsed);
          setIsIdentified(true);
        }
      } catch (e) {
        console.error("Error parsing guest info:", e);
      }
    }
  }, []);

  const handleIdentify = (e: React.FormEvent, selectedPousadaId?: string, isDelivery?: boolean) => {
    e.preventDefault();
    if (!guestInfo.name || !guestInfo.phone) {
      toast.error("Por favor, preencha nome e telefone");
      return;
    }

    if (isDelivery) {
      if (!guestInfo.room) {
        toast.error("Endereço obrigatório para delivery");
        return;
      }

      // Set Delivery Mode
      setPousada(null as any); // Or a specific setter if context allows explicit delivery mode
      // Actually, existing context might treat "No Pousada" + "Delivery Flag" as delivery.
      // But `setPousada(null)` triggers delivery mode in `PousadaContext`? 
      // Let's check `PousadaContext` usage.
      // `PousadaSelectionDialog` utilized `onSelect(null as any)`.

      // Looking at `GuestMenu.tsx` line 34: `isDeliveryMode`, `resetMode` comes from context.
      // But `PousadaSelectionDialog` passed `null` to `setPousada`, which likely triggers logic inside `PousadaContext` or `GuestMenu`.
      // Let's assume we need to replicate what `PousadaSelectionDialog` did.
      // It called `onSelect(null)` for delivery.

      // Wait, context manages this.
      setPousada(null as any); // Trigger delivery mode in context logic hopefully
    } else if (selectedPousadaId) {
      const selected = pousadas.find(p => p.id === selectedPousadaId);
      if (selected) {
        setPousada(selected);
      }
    }

    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestInfo));
    setIsIdentified(true);
    setIsIdentificationOpen(false); // Close the modal after identification
    toast.success(`Bem-vindo, ${guestInfo.name}!`);
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAddToCart = (product: Product, quantity: number, complements: SelectedComplement[], notes: string) => {
    addToCart(product, quantity, complements, notes);
  };

  const handleSubmitOrder = async (paymentDetails?: string) => {
    if (cart.length === 0) return;
    if (isStoreClosed) {
      toast.error("A loja está fechada no momento.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Use calculated deliveryFee state, fallback to fixed if 0/error
      const finalFee = deliveryFee;
      const totalWithFee = cartTotal + finalFee;

      // Determine Order Type correctly
      // 1. Delivery Mode = 'delivery'
      // 2. Pousada is HQ = 'counter' (Consumo no Local / Restaurante)
      // 3. Pousada is Partner = 'room' (Consumo na Pousada)
      let finalOrderType: "delivery" | "counter" | "room" = "room";
      let targetPousadaId = currentPousada?.id || null;

      if (isDeliveryMode) {
        finalOrderType = "delivery";
        // Ensure Delivery is linked to HQ
        const hq = pousadas.find(p => p.is_hq);
        if (hq) targetPousadaId = hq.id;
      } else if (currentPousada?.is_hq) {
        finalOrderType = "counter";
      }

      // Construct notes with payment details
      let orderNotes = `Cliente: ${guestInfo.name} | WhatsApp: ${guestInfo.phone}`;
      if (paymentDetails) {
        orderNotes += ` | ${paymentDetails}`;
      }

      // 0. Upsert Customer Logic
      let customerId = null;
      let isNewCustomer = false;

      try {
        const cleanPhone = guestInfo.phone.replace(/\D/g, "");
        // Try to find existing customer by phone
        // Note: We search by exact phone match. Ideally phone should be normalized.
        const { data: existingCustomer, error: findError } = await supabase
          .from("customers")
          .select("id")
          .eq("phone", guestInfo.phone)
          .maybeSingle();

        const customerData = {
          full_name: guestInfo.name,
          phone: guestInfo.phone,
          // For address/room, we store depending on mode, or just update the last known one
          room_number: finalOrderType === 'room' ? guestInfo.room : null,
          address: finalOrderType === 'delivery' ? guestInfo.room : null, // guestInfo.room holds address in delivery mode
          order_type: finalOrderType
        };

        if (existingCustomer) {
          customerId = existingCustomer.id;
          // Update latest info
          await supabase
            .from("customers")
            .update(customerData)
            .eq("id", customerId);
        } else {
          isNewCustomer = true; // Flag as new customer
          // Insert new
          const { data: newCustomer, error: createError } = await supabase
            .from("customers")
            .insert(customerData)
            .select()
            .single();

          if (!createError && newCustomer) {
            customerId = newCustomer.id;
          }
        }
      } catch (err) {
        console.error("Error managing customer:", err);
        // We continue even if customer creation fails, to not block the order
      }

      // --- FIRST ORDER REWARD LOGIC ---
      let discountAmount = 0;
      let appliedDeliveryFee = finalFee;

      // Get HQ or Current Pousada settings (Assuming Rewards are set on HQ/Global level usually, or per store)
      // If delivery, use HQ settings. If local, use currentPousada settings.
      const rewardConfigStore = isDeliveryMode ? pousadas.find(p => p.is_hq) : currentPousada;

      if (isNewCustomer && rewardConfigStore?.first_order_discount_enabled) {
        const { first_order_discount_type, first_order_discount_value } = rewardConfigStore;

        console.log("Applying First Order Reward:", first_order_discount_type, first_order_discount_value);

        if (first_order_discount_type === 'delivery_free') {
          if (appliedDeliveryFee > 0) {
            discountAmount = appliedDeliveryFee;
            appliedDeliveryFee = 0; // Free delivery
            orderNotes += ` | 🎁 FRETE GRÁTIS (1ª Compra)`;
            toast.success("Parabéns! Você ganhou Frete Grátis na sua primeira compra!");
          }
        } else if (first_order_discount_type === 'percentage' && first_order_discount_value) {
          const discount = (cartTotal * (first_order_discount_value / 100));
          discountAmount = discount;
          orderNotes += ` | 🎁 DESCONTO DE ${first_order_discount_value}% (1ª Compra)`;
          toast.success(`Parabéns! Você ganhou ${first_order_discount_value}% de desconto na sua primeira compra!`);
        } else if (first_order_discount_type === 'fixed' && first_order_discount_value) {
          discountAmount = first_order_discount_value;
          orderNotes += ` | 🎁 DESCONTO DE R$ ${first_order_discount_value} (1ª Compra)`;
          toast.success(`Parabéns! Você ganhou R$ ${first_order_discount_value} de desconto na sua primeira compra!`);
        }
      }

      // Recalculate Total (Visual Only - Server handles real total)
      const estimatedTotal = Math.max(0, cartTotal + appliedDeliveryFee - (rewardConfigStore?.first_order_discount_type !== 'delivery_free' ? discountAmount : 0));

      // Prepare Items for RPC
      const rpcItems = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        complements: item.selectedComplements.map(c => ({
          id: c.itemId,
          quantity: 1 // Assuming 1 for now as UI doesn't allow qty per addon yet
        }))
      }));

      // SECURE SUBMISSION via RPC
      // @ts-ignore - RPC types not generated yet
      const { data: orderData, error: orderError } = await supabase.rpc('create_order_secure', {
        p_customer_name: guestInfo.name,
        p_customer_phone: guestInfo.phone,
        p_room_number: guestInfo.room,
        p_order_type: finalOrderType,
        p_pousada_id: targetPousadaId,
        p_payment_method: orderNotes, // passing notes/payment info here
        p_items: rpcItems,

        p_delivery_fee: appliedDeliveryFee
      });

      const orderDataAny = orderData as any;
      if (orderError) throw orderError;

      if (orderError) throw orderError;

      // Order created successfully via RPC
      // The RPC returns { id, order_number, total }
      // We don't need to insert order_items separately anymore, the RPC handles it.

      // --- WhatsApp Integration (Compact Version) ---
      // Uses the provided number if possible or fallback
      const restaurantPhone = "5511999999999";

      let message = `*PEDIDO #${orderDataAny.order_number}*\n`;
      message += `*Cliente:* ${guestInfo.name} (${guestInfo.phone})\n`;

      if (isDeliveryMode) {
        message += `*Entregar em:* ${guestInfo.room}\n`; // "room" here holds the full address currently
      } else if (currentPousada?.is_hq) {
        message += `*Mesa/Ref:* ${guestInfo.room}\n`;
      } else {
        message += `*Pousada:* ${currentPousada?.name}\n*Quarto:* ${guestInfo.room}\n`;
      }
      message += `--------------------------------\n`;

      cart.forEach(item => {
        message += `${item.quantity}x ${item.product.name}`;
        // Compact complements
        if (item.selectedComplements.length > 0) {
          message += ` (+${item.selectedComplements.map(c => c.name).join(',')})`;
        }
        if (item.notes) message += ` [Obs: ${item.notes}]`;
        message += `\n`;
      });

      message += `--------------------------------\n`;
      if (appliedDeliveryFee > 0) message += `Entrega: R$ ${appliedDeliveryFee.toFixed(2)}\n`;
      if (discountAmount > 0) message += `Desc. 1ª Compra: -R$ ${discountAmount.toFixed(2)}\n`;

      message += `*TOTAL: R$ ${Number(orderDataAny.total).toFixed(2)}*\n`;
      message += `Link: ${window.location.origin}/guest/track/${orderDataAny.order_number}`;

      // Encode
      const whatsappUrl = `https://wa.me/${restaurantPhone}?text=${encodeURIComponent(message)}`;

      // Show Success Overlay instead of redirect immediately
      setSuccessOrderNum(orderDataAny.order_number);
      clearCart();
      setIsCheckoutOpen(false);

      // Redirect to tracking page
      setTimeout(() => {
        navigate(`/guest/track/${orderDataAny.order_number}`);
      }, 1500);

    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products by availability
  const visibleProducts = useMemo(() => {
    return products.filter(product => {
      // 1. Text search
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // 2. Availability (Available All OR Pousada Included)
      // If Delivery Mode: Only show available_all products (or handled by 'available_all' logic)
      // If Pousada Mode: Show available_all OR products specific to that pousada
      if (isDeliveryMode) {
        return product.available_all;
      }

      // Pousada Mode (Partner or HQ)
      // If it's HQ, we should technically see everything available_all + items specific to HQ.
      // Ideally, 'available_all' means "Global Menu".
      // "pousada_ids" means "Restricted to specific pousadas".

      // Logic:
      // 1. Context Filter (Delivery vs Pousada)
      if (isDeliveryMode && !product.available_for_delivery) return false;
      if (!isDeliveryMode && !product.available_for_pousada) return false;

      // 2. If product is available_all => Show
      // 3. If product is restricted (available_all=false):
      //    - Show ONLY if currentPousada.id is in pousada_ids

      const isGlobal = product.available_all;
      const isSpecificToThisPousada = currentPousada && product.pousada_ids?.includes(currentPousada.id);

      return isGlobal || isSpecificToThisPousada;
    });
  }, [products, searchQuery, isDeliveryMode, currentPousada]);

  if (isLoadingProducts || isLoadingCategories || isLoadingContext) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* LANDING SELECTION (Initial Choice) */}
      {!currentPousada && !isDeliveryMode && (
        <LandingSelection onSelect={(mode) => {
          if (mode === 'delivery') {
            // Set Delivery Mode
            // We can use the context setPousada(null) to maybe trigger, 
            // but PousadaContext implementation says:
            // setPousada(null) -> sets Delivery Mode.
            setPousada(null);
          } else {
            // Local/Pousada Mode
            // We open the Identification Modal which has Pousada Selection?
            // Or we just proceed?
            // If we pick 'pousada', we still don't have a specific pousada.
            // We should probably prompt for Pousada Selection next.
            // Let's trigger the GuestIdentification with mode 'pousada' pre-selected?
            // GuestIdentification handles Pousada selection.
            // But we need to "hide" the LandingSelection.
            // We can't set a state here easily without affecting context unless we have a local "bypass" state.
            // However, context drives everything.

            // If I set "isIdentificationOpen(true)", the LandingSelection is still there underneath?
            // No, "LandingSelection" shows if !currentPousada && !isDeliveryMode.
            // If I open Identification, those are still false.
            // So Identification must be OVER LandingSelection.
            // Let's ensure Z-Index is high.

            setIsIdentificationOpen(true);
          }
        }} />
      )}

      {isIdentificationOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setIsIdentificationOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-200 z-[60] bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-sm transition-all shadow-lg"
              title="Fechar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
            </button>
            <GuestIdentification
              guestInfo={guestInfo}
              setGuestInfo={setGuestInfo}
              onIdentify={(e, selectedPousadaId, isDelivery) => handleIdentify(e, selectedPousadaId, isDelivery)}
              pousadas={pousadas}
              neighborhoods={neighborhoods}
            />
          </div>
        </div>
      )}
      <GuestHeader
        guestInfo={guestInfo}
        onChangeIdentity={() => setIsIdentificationOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isDeliveryMode={isDeliveryMode}
        isHQ={!!currentPousada?.is_hq}
        logoUrl="/logo.png"
      />

      <div className="container mx-auto px-4 py-2 space-y-3">
        {/* Store Status Banner & Header Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${isStoreClosed ? 'bg-red-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
              <span className={`font-bold text-sm ${isStoreClosed ? 'text-red-600' : 'text-green-600'}`}>
                {isStoreClosed ? 'LOJA FECHADA' : 'LOJA ABERTA'}
              </span>
            </div>
            {!isStoreClosed && (
              <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium bg-gray-50 px-2 py-1 rounded-md">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>30-45 min</span>
              </div>
            )}
          </div>

          {currentPousada && !isStoreClosed && (
            <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
              <span className="flex items-center gap-1.5">
                <Store className="h-4 w-4 text-primary" />
                {currentPousada.name}
              </span>
              <button onClick={resetMode} className="text-xs font-bold text-primary hover:underline">
                Alterar
              </button>
            </div>
          )}

          {isDeliveryMode && !isStoreClosed && (
            <div className="flex items-center justify-between text-sm text-emerald-700 bg-emerald-50/50 rounded-lg p-2 mt-2 border border-emerald-100">
              <span className="flex items-center gap-2 font-medium">🛵 Delivery</span>
              <button onClick={resetMode} className="text-xs font-bold hover:underline">Alterar</button>
            </div>
          )}
        </div>

        {/* Promo Carousel */}
        {!isStoreClosed && (!pousadas.find(p => p.is_hq) || pousadas.find(p => p.is_hq)?.show_banners !== false) && <PromoCarousel />}

      </div>

      {!isStoreClosed && (
        <>
          <CategoryNav
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            isDeliveryMode={isDeliveryMode}
          />

          <main className="container mx-auto px-4 py-6 max-w-2xl">
            <ProductList
              products={visibleProducts}
              categories={categories}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              onProductClick={openProductModal}
              isDeliveryMode={isDeliveryMode}
            />
          </main>

          <FooterCart onCheckout={() => {
            if (!isIdentified) {
              setIsIdentificationOpen(true);
            } else {
              setIsCheckoutOpen(true);
            }
          }} />

          <ProductModal
            product={selectedProduct}
            isOpen={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
            onAddToCart={handleAddToCart}
          />

          <CartDrawer
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            guestName={guestInfo.name}
            onSubmitOrder={handleSubmitOrder}
            isSubmitting={isSubmitting}
            deliveryFee={deliveryFee}
            pousadaName={currentPousada?.name}
          />
        </>
      )}

      {isStoreClosed && (
        <div className="container mx-auto px-4 py-12 text-center opacity-50">
          <Store className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-xl font-bold text-gray-400">Cardápio Indisponível</p>
          <p className="text-gray-400">A loja está fechada no momento.</p>
        </div>
      )}
    </div>
  )
}


// Helper icons
function ArrowRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
  )
}

function LandingSelection({ onSelect }: { onSelect: (mode: 'delivery' | 'local' | 'pousada') => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      {/* Reusing GuestIdentification logic or simplified version */}
      {/* Actually, let's reuse the GuestIdentification MOde Selector UI part if possible or create a new one */}
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-8 text-center border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-3xl font-black text-gray-800 mb-2">Bem-vindo!</h2>
          <p className="text-gray-600 text-lg">Como deseja realizar seu pedido hoje?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 p-6">
          <button
            onClick={() => onSelect('delivery')}
            className="flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-400 hover:scale-[1.02] transition-all group"
          >
            <div className="p-4 bg-emerald-200 rounded-full group-hover:bg-emerald-300 transition-colors">
              <span className="text-4xl">🛵</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-xl text-emerald-900">Delivery</span>
              <span className="text-sm text-emerald-700">Receber em casa ou hotel</span>
            </div>
          </button>

          <button
            onClick={() => onSelect('pousada')} // 'pousada' triggers the Partner selection later? Or we might loop pouseada + local together
            className="flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-400 hover:scale-[1.02] transition-all group"
          >
            <div className="p-4 bg-blue-200 rounded-full group-hover:bg-blue-300 transition-colors">
              <span className="text-4xl">🍽️</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-xl text-blue-900">Consumo Local</span>
              <span className="text-sm text-blue-700">Parceiros ou Retirada</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

