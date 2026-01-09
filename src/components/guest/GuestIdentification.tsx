import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Store, Utensils, Home, Bike } from "lucide-react";
import { AddressSearch } from "./AddressSearch";
import { Pousada } from "@/hooks/usePousadas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface GuestInfo {
    name: string;
    room: string;
    phone: string;
    latitude: number | null;
    longitude: number | null;
    address_complement?: string; // New field
}

interface GuestIdentificationProps {
    guestInfo: GuestInfo;
    setGuestInfo: (info: GuestInfo) => void;
    onIdentify: (e: React.FormEvent, selectedPousadaId?: string, isDelivery?: boolean) => void;
    pousadas: Pousada[];
}

type OrderMode = 'delivery' | 'local' | 'pousada';

export function GuestIdentification({ guestInfo, setGuestInfo, onIdentify, pousadas }: GuestIdentificationProps) {
    const [mode, setMode] = useState<OrderMode | null>(null);
    const [selectedPousadaId, setSelectedPousadaId] = useState<string>("");

    // Find HQ for 'local' mode
    const hqPousada = pousadas.find(p => p.is_hq);

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

    const handleAddressSelect = (address: string, lat: number, lon: number) => {
        setGuestInfo({
            ...guestInfo,
            room: address, // In delivery mode, room acts as address string
            latitude: lat,
            longitude: lon
        });
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
                        <CardTitle className="text-3xl font-black text-gray-900">Como você quer pedir?</CardTitle>
                        <CardDescription className="text-lg">Escolha uma opção para continuar</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 grid gap-4 md:grid-cols-3">
                        <Button
                            variant="outline"
                            className="h-auto py-8 flex flex-col gap-4 hover:border-emerald-500 hover:bg-emerald-50 group border-2 border-dashed"
                            onClick={() => setMode('delivery')}
                        >
                            <div className="bg-emerald-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                                <Bike className="h-8 w-8 text-emerald-600" />
                            </div>
                            <div className="text-center">
                                <span className="block font-black text-lg text-gray-800">Delivery</span>
                                <span className="text-sm text-gray-500">Receber em casa</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto py-8 flex flex-col gap-4 hover:border-primary hover:bg-orange-50 group border-2 border-dashed"
                            onClick={() => setMode('local')}
                        >
                            <div className="bg-orange-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                                <Utensils className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-center">
                                <span className="block font-black text-lg text-gray-800">Comer no Local</span>
                                <span className="text-sm text-gray-500">Mesa ou Balcão</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto py-8 flex flex-col gap-4 hover:border-blue-500 hover:bg-blue-50 group border-2 border-dashed"
                            onClick={() => setMode('pousada')}
                        >
                            <div className="bg-blue-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                                <Home className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="text-center">
                                <span className="block font-black text-lg text-gray-800">Na Pousada</span>
                                <span className="text-sm text-gray-500">Sou hóspede</span>
                            </div>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // FORM RENDER
    const colorTheme = mode === 'delivery' ? 'emerald' : mode === 'pousada' ? 'blue' : 'orange';
    const TitleIcon = mode === 'delivery' ? Bike : mode === 'pousada' ? Home : Store;

    return (
        <div className={`relative min-h-screen flex items-center justify-center p-4 bg-${colorTheme}-50/30`}>
            <div
                className="absolute inset-0 z-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: "url('/hero_background.png')" }}
            />

            <Card className="z-10 w-full max-w-md bg-white shadow-2xl animate-scale-in">
                <CardHeader className={`text-center border-b pb-6 bg-${colorTheme}-50/50`}>
                    <Button
                        variant="ghost"
                        className="absolute left-4 top-4 text-gray-400 hover:text-gray-900"
                        onClick={() => setMode(null)}
                    >
                        ← Voltar
                    </Button>
                    <div className={`mx-auto p-4 rounded-full bg-${colorTheme}-100 mb-4 w-fit`}>
                        <TitleIcon className={`h-8 w-8 text-${colorTheme}-600`} />
                    </div>
                    <CardTitle className="text-2xl font-black uppercase text-gray-900">
                        {mode === 'delivery' ? 'Dados de Entrega' : mode === 'local' ? 'Identificação' : 'Dados da Pousada'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* NAME */}
                        <div className="space-y-2">
                            <Label>Seu Nome</Label>
                            <Input
                                placeholder="Como podemos te chamar?"
                                value={guestInfo.name}
                                onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                required
                                className="h-12 bg-gray-50 border-gray-200"
                            />
                        </div>

                        {/* PHONE */}
                        <div className="space-y-2">
                            <Label>WhatsApp</Label>
                            <Input
                                placeholder="(00) 00000-0000"
                                value={guestInfo.phone}
                                onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                                required
                                className="h-12 bg-gray-50 border-gray-200"
                            />
                        </div>

                        {/* MODE SPECIFIC FIELDS */}
                        {mode === 'delivery' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Endereço de Entrega</Label>
                                    <AddressSearch
                                        onSelect={handleAddressSelect}
                                        currentAddress={guestInfo.room}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Complemento / Ponto de Referência</Label>
                                    <Textarea
                                        placeholder="Ex: Apto 102, Próximo ao mercado..."
                                        value={guestInfo.address_complement || ""}
                                        onChange={(e) => setGuestInfo({ ...guestInfo, address_complement: e.target.value })}
                                        className="bg-gray-50 border-gray-200 resize-none"
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}

                        {mode === 'pousada' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Selecione sua Pousada</Label>
                                    <Select
                                        value={selectedPousadaId}
                                        onValueChange={setSelectedPousadaId}
                                        required
                                    >
                                        <SelectTrigger className="h-12 bg-gray-50 border-gray-200">
                                            <SelectValue placeholder="Escolha a pousada..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pousadas.filter(p => !p.is_hq).map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Número do Quarto</Label>
                                    <Input
                                        placeholder="Ex: 101"
                                        value={guestInfo.room}
                                        onChange={(e) => setGuestInfo({ ...guestInfo, room: e.target.value })}
                                        required
                                        className="h-12 bg-gray-50 border-gray-200"
                                    />
                                </div>
                            </>
                        )}

                        {mode === 'local' && (
                            <div className="space-y-2">
                                <Label>Mesa ou Identificação</Label>
                                <Input
                                    placeholder="Ex: Mesa 05 ou Balcão"
                                    value={guestInfo.room}
                                    onChange={(e) => setGuestInfo({ ...guestInfo, room: e.target.value })}
                                    required
                                    className="h-12 bg-gray-50 border-gray-200"
                                />
                            </div>
                        )}

                        <Button type="submit" className={`w-full h-14 text-lg font-bold mt-4 shadow-lg text-white bg-${colorTheme}-600 hover:bg-${colorTheme}-700`}>
                            CONFIRMAR E PEDIR
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
