import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Product } from "@/hooks/useProducts";
import { toast } from "sonner";

export interface SelectedComplement {
    groupId: string;
    itemId: string;
    name: string;
    price: number;
    quantity: number;
}

export interface CartItem {
    id: string;
    product: Product;
    quantity: number;
    notes: string;
    selectedComplements: SelectedComplement[];
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product, quantity: number, complements: SelectedComplement[], notes: string) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, delta: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "burgerpousada_cart";

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (error) {
                console.error("Error parsing cart from localStorage:", error);
            }
        }
        setIsInitialized(true);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        }
    }, [cart, isInitialized]);

    const addToCart = (product: Product, quantity: number, complements: SelectedComplement[], notes: string) => {
        setCart((prev) => {
            const newItemId = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
            return [...prev, {
                id: newItemId,
                product,
                quantity,
                notes,
                selectedComplements: complements
            }];
        });
        toast.success(`${product.name} adicionado ao carrinho`);
    };

    const removeFromCart = (itemId: string) => {
        setCart((prev) => prev.filter((item) => item.id !== itemId));
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart((prev) => {
            return prev
                .map((item) => {
                    if (item.id === itemId) {
                        const newQty = item.quantity + delta;
                        return newQty > 0 ? { ...item, quantity: newQty } : item;
                    }
                    return item;
                })
                .filter((item) => item.quantity > 0);
        });
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartTotal = cart.reduce((total, item) => {
        const complementsPrice = item.selectedComplements.reduce((acc, comp) => acc + comp.price, 0);
        return total + (item.product.price + complementsPrice) * item.quantity;
    }, 0);

    const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartItemsCount,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
