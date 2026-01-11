import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
    logoUrl?: string;
}

export function GuestHeader({ guestInfo, onChangeIdentity, searchQuery, setSearchQuery, isDeliveryMode, isHQ, logoUrl }: GuestHeaderProps) {

    const { t, setLanguage, language } = useLanguage();

    // Determine the label for the identity section
    let identityLabel = t.guest.header.room;
    let identityValue = guestInfo.room;

    if (isDeliveryMode) {
        identityLabel = t.guest.header.address;
        identityValue = guestInfo.room; // In delivery mode 'room' holds the address
    } else if (isHQ) {
        identityLabel = t.guest.header.table;
        identityValue = guestInfo.room;
    }

    return (
        <header className={`sticky top-0 z-40 shadow-sm transition-colors ${isDeliveryMode ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-white'}`}>
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${isDeliveryMode ? 'bg-emerald-100' : 'bg-primary/10'}`}>
                            {isDeliveryMode ? <MapPin className="h-5 w-5 text-emerald-600" /> : <MapPin className="h-5 w-5 text-primary" />}
                        </div>
                        {logoUrl && (
                            <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain mr-3 rounded-md" />
                        )}
                        <div className="min-w-0">
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
                        className={`font-bold shrink-0 ${isDeliveryMode ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100' : 'text-primary'}`}
                        onClick={onChangeIdentity}
                    >
                        {t.guest.header.change}
                    </Button>
                </div>

                <div className="flex gap-2 mb-3">
                    <button onClick={() => setLanguage('pt')} className={`text-xl grayscale hover:grayscale-0 transition-all ${language === 'pt' ? 'grayscale-0 scale-110' : 'opacity-50'}`} title="Português">🇧🇷</button>
                    <button onClick={() => setLanguage('en')} className={`text-xl grayscale hover:grayscale-0 transition-all ${language === 'en' ? 'grayscale-0 scale-110' : 'opacity-50'}`} title="English">🇺🇸</button>
                    <button onClick={() => setLanguage('es')} className={`text-xl grayscale hover:grayscale-0 transition-all ${language === 'es' ? 'grayscale-0 scale-110' : 'opacity-50'}`} title="Español">🇪🇸</button>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder={t.guest.header.search}
                        className="pl-10 h-12 bg-gray-100 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </header>
    );
}
