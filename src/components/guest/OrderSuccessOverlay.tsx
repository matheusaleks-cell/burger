import { motion, AnimatePresence } from "framer-motion";
import { Check, Truck, Store } from "lucide-react";
import { useEffect } from "react";
import confetti from "canvas-confetti";

interface OrderSuccessOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    orderNumber: number;
}

export function OrderSuccessOverlay({ isOpen, onClose, orderNumber }: OrderSuccessOverlayProps) {
    useEffect(() => {
        if (isOpen) {
            // Confetti burst
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#ff8c00', '#ffffff', '#000000']
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#ff8c00', '#ffffff', '#000000']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            frame();
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-primary flex flex-col items-center justify-center p-4 text-white text-center"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="bg-white text-primary rounded-full p-6 w-24 h-24 mb-6 flex items-center justify-center shadow-xl"
                    >
                        <Check className="w-12 h-12 stroke-[4]" />
                    </motion.div>

                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-black mb-2"
                    >
                        Pedido Enviado!
                    </motion.h2>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg font-medium opacity-90 max-w-xs mx-auto mb-8"
                    >
                        Seu pedido #{orderNumber} foi recebido e já vai começar a ser preparado.
                    </motion.p>

                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        onClick={onClose}
                        className="bg-white text-primary px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-50 active:scale-95 transition-transform"
                    >
                        Acompanhar Pedido
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
