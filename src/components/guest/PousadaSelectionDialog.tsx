import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Store, MapPin } from "lucide-react";
import { Pousada } from "@/hooks/usePousadas";

interface PousadaSelectionDialogProps {
    open: boolean;
    pousadas: Pousada[];
    onSelect: (pousada: Pousada) => void;
}

export function PousadaSelectionDialog({ open, pousadas, onSelect }: PousadaSelectionDialogProps) {
    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-xl [&>button]:hidden bg-gray-50/95 backdrop-blur-md">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-center text-3xl font-black text-gray-900">Como deseja pedir?</DialogTitle>
                    <DialogDescription className="text-center text-lg">
                        Selecione uma opção para ver o cardápio
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* OPTION 1: DELIVERY */}
                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full h-auto py-8 flex flex-col items-center justify-center gap-4 bg-white hover:bg-emerald-50 hover:border-emerald-500 border-2 border-dashed border-gray-200 shadow-sm group transition-all rounded-2xl"
                            onClick={() => onSelect(null as any)}
                        >
                            <div className="bg-emerald-100 p-4 rounded-full group-hover:scale-110 transition-transform shadow-inner">
                                <Store className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div className="text-center">
                                <span className="font-black text-xl text-gray-900 group-hover:text-emerald-700 block">DELIVERY</span>
                                <span className="text-gray-500 text-sm font-medium group-hover:text-emerald-600">Receber em casa</span>
                            </div>
                        </Button>
                        <div className="text-center text-xs text-gray-400 font-medium px-4">
                            Ideal para quem está em casa e quer receber nosso lanche no conforto do lar.
                        </div>
                    </div>

                    {/* OPTION 2: POUSADA LIST */}
                    <div className="space-y-3">
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm h-full max-h-[400px] flex flex-col">
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                                <MapPin className="w-5 h-5 text-primary" />
                                <span className="font-bold text-gray-700">Escolha a Pousada</span>
                            </div>

                            <ScrollArea className="flex-1 pr-4">
                                <div className="grid gap-2">
                                    {pousadas.map((pousada) => (
                                        <Button
                                            key={pousada.id}
                                            variant="ghost"
                                            className="w-full justify-start h-auto py-3 px-3 hover:bg-primary/5 hover:text-primary text-left"
                                            onClick={() => onSelect(pousada)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold truncate">{pousada.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">{pousada.address}</div>
                                            </div>
                                            {pousada.is_hq && (
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold ml-2">
                                                    HQ
                                                </span>
                                            )}
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                        <div className="text-center text-xs text-gray-400 font-medium px-4">
                            Para hóspedes das pousadas parceiras.
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
