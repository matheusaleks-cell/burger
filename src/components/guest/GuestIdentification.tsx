import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Store, Utensils, Home, Bike } from "lucide-react";
import { AddressSearch } from "./AddressSearch"; // keeping for latitude/longitude if needed later
import { Pousada } from "@/hooks/usePousadas";
import { Neighborhood } from "@/hooks/useNeighborhoods";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";

interface GuestInfo {
    name: string;
    room: string; // Used as "Address String" for delivery or "Room Number" for pousada
    phone: string;
    latitude: number | null;
    longitude: number | null;
    address_complement?: string;
    // Structured Address Fields (Optional, mostly for Delivery)
    street?: string;
    number?: string;
    neighborhood?: string;
    complement?: string;
    neighborhood_id?: string;
    reference?: string;
}

interface GuestIdentificationProps {
    guestInfo: GuestInfo;
    setGuestInfo: (info: GuestInfo) => void;
    onIdentify: (e: React.FormEvent, selectedPousadaId?: string, isDelivery?: boolean) => void;
    pousadas: Pousada[];
    neighborhoods?: Neighborhood[];
}

type OrderMode = 'delivery' | 'local' | 'pousada';

export function GuestIdentification({ guestInfo, setGuestInfo, onIdentify, pousadas, neighborhoods = [] }: GuestIdentificationProps) {
    const [mode, setMode] = useState<OrderMode | null>(null);
    const [selectedPousadaId, setSelectedPousadaId] = useState<string>("");

    // Find HQ for 'local' mode
    const hqPousada = pousadas.find(p => p.is_hq);
    const { t } = useLanguage();

    const updateAddressString = (newInfo: GuestInfo) => {
        if (mode === 'delivery') {
            const hood = neighborhoods.find(n => n.id === newInfo.neighborhood_id);
            const hoodName = hood ? hood.name : "";
            const fullAddress = `${newInfo.street || ""}, ${newInfo.number || ""} - ${hoodName} (${newInfo.reference || ""})`;
            return { ...newInfo, room: fullAddress };
        }
        return newInfo;
    };

    const handleFieldChange = (field: keyof GuestInfo, value: string) => {
        let finalValue = value;
        // Simple Phone Mask (XX) XXXXX-XXXX
        if (field === 'phone') {
            finalValue = value.replace(/\D/g, "")
                .replace(/^(\d{2})(\d)/g, "($1) $2")
                .replace(/(\d)(\d{4})$/, "$1-$2");
        }

        const updated = { ...guestInfo, [field]: finalValue };

        // If in delivery mode, auto-generate the 'room' string from address components
        if (selectedPousadaId === 'delivery' || (!selectedPousadaId && guestInfo.street)) {
            const addressParts = [
                updated.street,
                updated.number ? `Nº ${updated.number}` : '',
                updated.neighborhood,
                updated.complement ? `(${updated.complement})` : ''
            ].filter(Boolean);
            updated.room = addressParts.join(', ');
        }

        setGuestInfo(updated); // We don't need updateAddressString wrapper if we do it inline here especially since updateAddressString used old logic
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let targetPousadaId = selectedPousadaId;
        let isDelivery = false;

        if (mode === 'local') {
            targetPousadaId = hqPousada?.id || "";
        } else if (mode === 'delivery') {
            targetPousadaId = hqPousada?.id || ""; // Delivery usually managed by HQ
            isDelivery = true;
        }

        onIdentify(e, targetPousadaId, isDelivery);
    };

    // Render Mode Selection or Form
    if (!mode) {
        return (
            <div className="relative min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-10"
                    style={{ backgroundImage: "url('/hero_background.png')" }}
                />
                <Card className="z-10 w-full max-w-2xl bg-white/90 backdrop-blur shadow-xl border-gray-100 animate-slide-up">
                    <CardHeader className="text-center pb-8 border-b border-gray-100">
                        <CardTitle className="text-3xl font-black text-gray-900">{t.guest.identify}</CardTitle>
                        <CardDescription className="text-lg">{t.guest.identify_desc}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 grid gap-4 md:grid-cols-3">
                        <Button
                            variant="outline"
                            className="h-auto py-4 flex flex-col gap-3 hover:border-emerald-500 hover:bg-emerald-50 group border-2 border-dashed"
                            onClick={() => setMode('delivery')}
                        >
                            <div className="bg-emerald-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                                <Bike className="h-8 w-8 text-emerald-600" />
                            </div>
                            <div className="text-center">
                                <span className="block font-black text-lg text-gray-800">{t.guest.delivery}</span>
                                <span className="text-sm text-gray-500">{t.guest.delivery_desc}</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto py-4 flex flex-col gap-3 hover:border-primary hover:bg-orange-50 group border-2 border-dashed"
                            onClick={() => setMode('local')}
                        >
                            <div className="bg-orange-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                                <Utensils className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-center">
                                <span className="block font-black text-lg text-gray-800">{t.guest.local}</span>
                                <span className="text-sm text-gray-500">{t.guest.local_desc}</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto py-4 flex flex-col gap-3 hover:border-blue-500 hover:bg-blue-50 group border-2 border-dashed"
                            onClick={() => setMode('pousada')}
                        >
                            <div className="bg-blue-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                                <Home className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="text-center">
                                <span className="block font-black text-lg text-gray-800">{t.guest.pousada}</span>
                                <span className="text-sm text-gray-500">{t.guest.pousada_desc}</span>
                            </div>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // FORM RENDER
    const getThemeClasses = (m: OrderMode) => {
        switch (m) {
            case 'delivery':
                return {
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-100',
                    iconBg: 'bg-emerald-100',
                    iconColor: 'text-emerald-600',
                    button: 'bg-emerald-600 hover:bg-emerald-700',
                    ring: 'focus:ring-emerald-500'
                };
            case 'pousada':
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-100',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    button: 'bg-blue-600 hover:bg-blue-700',
                    ring: 'focus:ring-blue-500'
                };
            case 'local':
            default:
                return {
                    bg: 'bg-orange-50',
                    border: 'border-orange-100',
                    iconBg: 'bg-orange-100',
                    iconColor: 'text-orange-500',
                    button: 'bg-primary hover:bg-primary/90',
                    ring: 'focus:ring-primary'
                };
        }
    };

    const theme = getThemeClasses(mode!);
    const TitleIcon = mode === 'delivery' ? Bike : mode === 'pousada' ? Home : Store;

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: "url('/hero_background.png')" }}
            />

            <Card className="z-10 w-full max-w-md bg-white shadow-2xl animate-scale-in overflow-hidden border-none ring-1 ring-gray-100">
                <CardHeader className={`relative text-center border-b pb-8 pt-8 ${theme.bg}`}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-4 h-8 w-8 rounded-full bg-white/50 hover:bg-white text-gray-600 transition-colors"
                        onClick={() => setMode(null)}
                    >
                        <span className="sr-only">{t.guest.back}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </Button>

                    <div className={`mx-auto p-5 rounded-full ${theme.iconBg} mb-4 w-fit shadow-sm`}>
                        <TitleIcon className={`h-10 w-10 ${theme.iconColor}`} />
                    </div>
                    <CardTitle className="text-2xl font-black uppercase text-gray-900 tracking-tight">
                        {mode === 'delivery' ? t.guest.delivery : mode === 'local' ? t.guest.local : t.guest.pousada}
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-medium">
                        Preencha seus dados para continuar
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-8 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* NAME */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700">{t.guest.name_label}</Label>
                            <Input
                                placeholder={t.guest.name_placeholder}
                                value={guestInfo.name}
                                onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                required
                                className={`h-12 bg-gray-50 border-gray-200 transition-all ${theme.ring}`}
                            />
                        </div>

                        {/* PHONE */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700">{t.guest.phone_label}</Label>
                            <Input
                                placeholder={t.guest.phone_placeholder}
                                value={guestInfo.phone}
                                onChange={(e) => handleFieldChange("phone", e.target.value)}
                                maxLength={15}
                                required
                                className={`h-12 bg-gray-50 border-gray-200 transition-all ${theme.ring}`}
                            />
                        </div>

                        {/* MODE SPECIFIC FIELDS */}
                        {mode === 'delivery' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700">Selecione seu Bairro</Label>
                                    <Select
                                        value={guestInfo.neighborhood_id || ""}
                                        onValueChange={(val) => handleFieldChange('neighborhood_id', val)}
                                        required
                                    >
                                        <SelectTrigger className={`h-12 bg-gray-50 border-gray-200 ${theme.ring}`}>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {neighborhoods.map((hood) => (
                                                <SelectItem key={hood.id} value={hood.id}>
                                                    {hood.name} (R$ {Number(hood.fee).toFixed(2)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-[1fr,80px] gap-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Rua</Label>
                                        <Input
                                            value={guestInfo.street || ""}
                                            onChange={(e) => handleFieldChange('street', e.target.value)}
                                            required
                                            placeholder="Rua / Av"
                                            className={`bg-gray-50 border-gray-200 ${theme.ring}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Nº</Label>
                                        <Input
                                            value={guestInfo.number || ""}
                                            onChange={(e) => handleFieldChange('number', e.target.value)}
                                            required
                                            placeholder="123"
                                            className={`bg-gray-50 border-gray-200 ${theme.ring}`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700">Complemento / Ref.</Label>
                                    <Input
                                        value={guestInfo.complement || ""}
                                        onChange={(e) => handleFieldChange('complement', e.target.value)}
                                        placeholder="Ap 101 / Ao lado da escola..."
                                        className={`h-12 bg-gray-50 border-gray-200 ${theme.ring}`}
                                    />
                                </div>
                                {/* Hidden Neighborhood Field since we use Select now but store it in 'neighborhood' string? 
                                    Actually the original code didn't have a 'neighborhood' string field in UI separate from ID. 
                                    Let's rely on Select for ID and maybe auto-fill name if needed? 
                                    For now just ID + Street + Number + Complement is enough for Address String.
                                */}
                            </div>
                        )}

                        {mode === 'pousada' && (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700">{t.guest.pousada_label}</Label>
                                    <Select
                                        value={selectedPousadaId}
                                        onValueChange={setSelectedPousadaId}
                                        required
                                    >
                                        <SelectTrigger className={`h-12 bg-gray-50 border-gray-200 ${theme.ring}`}>
                                            <SelectValue placeholder={t.guest.pousada_placeholder} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pousadas.filter(p => !p.is_hq).map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700">{t.guest.room_label}</Label>
                                    <Input
                                        placeholder={t.guest.room_placeholder}
                                        value={guestInfo.room}
                                        onChange={(e) => setGuestInfo({ ...guestInfo, room: e.target.value })}
                                        required
                                        className={`h-12 bg-gray-50 border-gray-200 ${theme.ring}`}
                                    />
                                </div>
                            </>
                        )}

                        {mode === 'local' && (
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-gray-700">{t.guest.table_label}</Label>
                                <Input
                                    placeholder={t.guest.table_placeholder}
                                    value={guestInfo.room}
                                    onChange={(e) => setGuestInfo({ ...guestInfo, room: e.target.value })}
                                    required
                                    className={`h-12 bg-gray-50 border-gray-200 ${theme.ring}`}
                                />
                            </div>
                        )}

                        <Button
                            type="submit"
                            className={`w-full h-14 text-lg font-black uppercase tracking-wide mt-4 shadow-xl shadow-black/5 text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${theme.button}`}
                        >
                            {t.guest.confirm_btn}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
