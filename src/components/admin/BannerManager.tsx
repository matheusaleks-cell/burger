import { useState } from "react";
import { useBanners } from "@/hooks/useBanners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2, Upload, ImageIcon, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export function BannerManager() {
    const { banners, isLoading, uploadBanner, deleteBanner, toggleBannerStatus } = useBanners();
    const [uploading, setUploading] = useState(false);
    const [newBannerTitle, setNewBannerTitle] = useState("");
    const [newBannerLink, setNewBannerLink] = useState("");

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("O arquivo deve ter no máximo 5MB");
            return;
        }

        setUploading(true);
        try {
            await uploadBanner.mutateAsync({
                file,
                title: newBannerTitle,
                link: newBannerLink
            });
            setNewBannerTitle("");
            setNewBannerLink("");
            // Reset input if needed or just rely on state
        } catch (error) {
            // Error handled in hook
        } finally {
            setUploading(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" /> Adicionar Novo Banner
                    </CardTitle>
                    <CardDescription>
                        Envie uma imagem para exibir no topo do cardápio digital. Formato recomendado: 1200x400px (3:1).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="banner-title">Título (Opcional)</Label>
                            <Input
                                id="banner-title"
                                placeholder="Ex: Promoção de Verão"
                                value={newBannerTitle}
                                onChange={(e) => setNewBannerTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="banner-link">Link (Opcional)</Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="banner-link"
                                    placeholder="https://..."
                                    className="pl-9"
                                    value={newBannerLink}
                                    onChange={(e) => setNewBannerLink(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button disabled={uploading} asChild className="cursor-pointer">
                            <label>
                                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                {uploading ? "Enviando..." : "Selecionar Imagem"}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((banner) => (
                    <Card key={banner.id} className="overflow-hidden group relative">
                        <div className="aspect-[3/1] bg-gray-100 relative">
                            <img
                                src={banner.image_url}
                                alt={banner.title || "Banner"}
                                className={`w-full h-full object-cover transition-opacity ${banner.is_active ? 'opacity-100' : 'opacity-50 grayscale'}`}
                            />
                            {!banner.is_active && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                    <span className="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">Inativo</span>
                                </div>
                            )}
                        </div>

                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-bold text-sm">{banner.title || "Sem título"}</p>
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{banner.link || "Sem link"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 mr-2">
                                    <Switch
                                        checked={banner.is_active}
                                        onCheckedChange={(checked) => toggleBannerStatus.mutate({ id: banner.id, is_active: checked })}
                                    />
                                </div>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        if (confirm("Tem certeza que deseja remover este banner?")) {
                                            deleteBanner.mutate(banner.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {banners.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhum banner cadastrado</p>
                    </div>
                )}
            </div>
        </div>
    );
}
