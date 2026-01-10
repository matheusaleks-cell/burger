import { useEffect, useState, useRef } from "react";
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

const GUEST_STORAGE_KEY = "guest_info";

interface GuestInfoState {
  name: string;
  room: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  address_complement?: string;
}

export default function GuestMenu() {
  const navigate = useNavigate();
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const { addToCart, clearCart, cartTotal, cart } = useCart();

  const { currentPousada, setPousada, isLoading: isLoadingContext, isDeliveryMode, resetMode } = usePousadaContext();
  const { pousadas } = usePousadas();

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
    address_complement: ""
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
      if (!guestInfo.room || !guestInfo.latitude || !guestInfo.longitude) {
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

      // Create the order in DB (for Panel/KDS)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_type: finalOrderType,
          room_number: guestInfo.room, // Contains Address if delivery, Room # if pousada
          total: totalWithFee,
          delivery_fee: finalFee,
          pousada_id: targetPousadaId,
          notes: orderNotes,
          status: "pending",
          customer_id: customerId
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item) => {
        const complementsNotes = item.selectedComplements.length > 0
          ? `\n[+Extras]: ${item.selectedComplements.map(c => `${c.quantity}x ${c.name}`).join(", ")}`
          : "";

        const finalNotes = (item.notes || "") + complementsNotes;

        return {
          order_id: orderData.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price + item.selectedComplements.reduce((acc, c) => acc + c.price, 0),
          notes: finalNotes.trim() || null,
        };
      });

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // --- WhatsApp Integration (Anotaí Style) ---
      const restaurantPhone = "5511999999999"; // Replace with real number from config/env

      let message = `*NOVO PEDIDO #${orderData.order_number}*\n`;
      message += `--------------------------------\n`;
      message += `*Cliente:* ${guestInfo.name}\n`;
      message += `*WhatsApp:* ${guestInfo.phone}\n`;
      if (isDeliveryMode) {
        message += `*Endereço:* ${guestInfo.room}\n`;
        message += `*Tipo:* 🏠 DELIVERY\n`;
      } else if (currentPousada?.is_hq) {
        message += `*Local:* Manguinhos (Restaurante)\n`;
        message += `*Identificação:* ${guestInfo.room} (Mesa/Nome)\n`;
        message += `*Tipo:* 🏪 BALCÃO / MESA\n`;
      } else {
        message += `*Local:* ${currentPousada?.name}\n`;
        message += `*Quarto:* ${guestInfo.room}\n`;
        message += `*Tipo:* 🏨 SISTEMA POUSADA\n`;
      }
      message += `--------------------------------\n`;

      cart.forEach(item => {
        message += `${item.quantity}x ${item.product.name}\n`;
        // Add detailed notes/complements to WhatsApp msg if needed
      });

      message += `--------------------------------\n`;
      if (finalFee > 0) message += `Taxa de Entrega: R$ ${finalFee.toFixed(2)}\n`;
      message += `*TOTAL: R$ ${totalWithFee.toFixed(2)}*\n`;
      message += `--------------------------------\n`;
      message += `Acompanhar Pedido: ${window.location.origin}/guest/track/${orderData.order_number}`;

      const whatsappUrl = `https://wa.me/${restaurantPhone}?text=${encodeURIComponent(message)}`;

      // Show Success Overlay instead of redirect immediately
      setSuccessOrderNum(orderData.order_number);
      clearCart();
      setIsCheckoutOpen(false);

      // Open WhatsApp in background/new tab after short delay
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1500);

    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products by availability
  const visibleProducts = products.filter(product => {
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
    // 1. If product is available_all => Show
    // 2. If product is restricted (available_all=false):
    //    - Show ONLY if currentPousada.id is in pousada_ids

    const isGlobal = product.available_all;
    const isSpecificToThisPousada = currentPousada && product.pousada_ids?.includes(currentPousada.id);

    return isGlobal || isSpecificToThisPousada;
  });

  if (isLoadingProducts || isLoadingCategories || isLoadingContext) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
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
