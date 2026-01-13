
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Utensils, Phone, Instagram, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GuestLinks() {
    const navigate = useNavigate();

    // TODO: Replace with real links from configuration or constants
    const whatsappLink = "https://wa.me/5511999999999";
    const instagramLink = "https://instagram.com/burguerpousada";

    const handleNavigation = (url: string, external = false) => {
        if (external) {
            window.open(url, "_blank");
        } else {
            navigate(url);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-none bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-col items-center space-y-4 pb-8 pt-8">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center p-1 border-2 border-primary/20">
                        {/* Placeholder for Logo */}
                        <img src="/logo.png" alt="Logo" className="h-full w-full object-contain rounded-full" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            Burguer & Pousada
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            O melhor sabor de Búzios
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-8">

                    <Button
                        className="w-full h-14 text-lg font-medium shadow-md hover:shadow-lg transition-all"
                        onClick={() => handleNavigation("/")}
                    >
                        <Utensils className="mr-3 h-5 w-5" />
                        Cardápio Digital / Pedidos
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full h-14 text-lg font-medium border-2 hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700"
                        onClick={() => handleNavigation(whatsappLink, true)}
                    >
                        <Phone className="mr-3 h-5 w-5 text-green-600" />
                        Fale no WhatsApp
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full h-14 text-lg font-medium border-2 hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700"
                        onClick={() => handleNavigation(instagramLink, true)}
                    >
                        <Instagram className="mr-3 h-5 w-5 text-pink-600" />
                        Siga no Instagram
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full h-12 text-muted-foreground hover:text-primary transition-all mt-4"
                        onClick={() => handleNavigation("https://maps.google.com/?q=Buzios", true)}
                    >
                        <MapPin className="mr-2 h-4 w-4" />
                        Como Chegar
                    </Button>

                </CardContent>

                <div className="text-center pb-6 text-xs text-gray-400">
                    © {new Date().getFullYear()} Burguer & Pousada
                </div>
            </Card>
        </div>
    );
}
