import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";

interface GuestInfo {
    name: string;
    room: string;
}

interface GuestHeaderProps {
    guestInfo: GuestInfo;
    onChangeIdentity: () => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isDeliveryMode?: boolean;
    isHQ?: boolean;
}

export function GuestHeader({ guestInfo, onChangeIdentity, searchQuery, setSearchQuery, isDeliveryMode, isHQ }: GuestHeaderProps) {

    // Determine the label for the identity section
    let identityLabel = "Quarto";
    let identityValue = guestInfo.room;

    if (isDeliveryMode) {
        identityLabel = "Endereço de Entrega";
        identityValue = guestInfo.room; // In delivery mode 'room' holds the address
    } else if (isHQ) {
        identityLabel = "Mesa / Senha";
        identityValue = guestInfo.room;
    }

    return (
        <header className={`sticky top-0 z-40 shadow-sm transition-colors ${isDeliveryMode ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-white'}`}>
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isDeliveryMode ? 'bg-emerald-100' : 'bg-primary/10'}`}>
                            {isDeliveryMode ? <MapPin className="h-5 w-5 text-emerald-600" /> : <MapPin className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                            <p className={`text-[10px] uppercase tracking-wider font-bold ${isDeliveryMode ? 'text-emerald-600' : 'text-gray-400'}`}>{identityLabel}</p>
                            <h2 className={`text-sm font-bold flex items-center ${isDeliveryMode ? 'text-emerald-900' : 'text-gray-900'}`}>
                                <span className="truncate max-w-[150px] sm:max-w-md block leading-tight">
                                    {identityValue} - {guestInfo.name}
                                </span>
                            </h2>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`font-bold ${isDeliveryMode ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100' : 'text-primary'}`}
                        onClick={onChangeIdentity}
                    >
                        Alterar
                    </Button>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Buscar no cardápio..."
                        className="pl-10 h-12 bg-gray-100 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </header>
    );
}
