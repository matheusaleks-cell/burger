import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { usePousadas, Pousada } from "@/hooks/usePousadas";
import { toast } from "sonner";

interface PousadaContextType {
    currentPousada: Pousada | null;
    isLoading: boolean;
    setPousada: (pousada: Pousada | null) => void;
    isDeliveryMode: boolean;
    resetMode: () => void;
}

const PousadaContext = createContext<PousadaContextType | undefined>(undefined);

const POUSADA_STORAGE_KEY = "guest_pousada";

export function PousadaProvider({ children }: { children: ReactNode }) {
    const [currentPousada, setCurrentPousada] = useState<Pousada | null>(null);
    const [isDeliveryMode, setIsDeliveryMode] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const { pousadas, isLoading: isLoadingPousadas } = usePousadas();
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        if (isLoadingPousadas) return;

        const urlPousadaId = searchParams.get("pousada_id");
        const storedPousadaJson = localStorage.getItem(POUSADA_STORAGE_KEY);
        const storedDeliveryMode = localStorage.getItem("guest_delivery_mode");

        // 1. Priority: URL Param
        if (urlPousadaId) {
            const found = pousadas.find(p => p.id === urlPousadaId);
            if (found) {
                // If switching to a new pousada, force update
                setCurrentPousada(found);
                setIsDeliveryMode(false);
                // Persist only the current choice
                localStorage.setItem(POUSADA_STORAGE_KEY, JSON.stringify(found));
                localStorage.removeItem("guest_delivery_mode");
            } else {
                toast.error("Pousada não encontrada no link.");
            }
        }
        else if (searchParams.get("delivery") === "true") {
            setIsDeliveryMode(true);
            setCurrentPousada(null);
            localStorage.removeItem(POUSADA_STORAGE_KEY);
            localStorage.setItem("guest_delivery_mode", "true");
        }
        else if (storedDeliveryMode === "true") {
            setIsDeliveryMode(true);
            setCurrentPousada(null);
        }
        // 3. Fallback: Local Storage Pousada
        else if (storedPousadaJson) {
            try {
                const stored = JSON.parse(storedPousadaJson) as Pousada;
                setCurrentPousada(stored);
                setIsDeliveryMode(false);
            } catch (e) {
                console.error("Error parsing stored pousada", e);
                localStorage.removeItem(POUSADA_STORAGE_KEY);
            }
        }

        setIsInitializing(false);
    }, [searchParams, pousadas, isLoadingPousadas]);

    const handleSetPousada = (pousada: Pousada | null) => {
        console.log("handleSetPousada called with:", pousada);
        if (pousada) {
            console.log("Setting Pousada Mode");
            setCurrentPousada(pousada);
            setIsDeliveryMode(false);
            localStorage.setItem(POUSADA_STORAGE_KEY, JSON.stringify(pousada));
            localStorage.removeItem("guest_delivery_mode");
            setSearchParams({ pousada_id: pousada.id });
        } else {
            console.log("Setting Delivery Mode");
            // Setting Delivery Mode (null pousada)
            setCurrentPousada(null);
            setIsDeliveryMode(true);
            localStorage.removeItem(POUSADA_STORAGE_KEY);
            localStorage.setItem("guest_delivery_mode", "true");
            setSearchParams({ delivery: "true" });
        }
    };

    const resetMode = () => {
        console.log("Resetting Mode");
        setCurrentPousada(null);
        setIsDeliveryMode(false);
        localStorage.removeItem(POUSADA_STORAGE_KEY);
        localStorage.removeItem("guest_delivery_mode");
        setSearchParams({});
    };

    return (
        <PousadaContext.Provider value={{
            currentPousada,
            isDeliveryMode,
            isLoading: isLoadingPousadas || isInitializing,
            setPousada: handleSetPousada,
            resetMode
        }}>
            {children}
        </PousadaContext.Provider>
    );
}

export function usePousadaContext() {
    const context = useContext(PousadaContext);
    if (context === undefined) {
        throw new Error("usePousadaContext must be used within a PousadaProvider");
    }
    return context;
}
