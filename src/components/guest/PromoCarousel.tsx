import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";
import { useBanners } from "@/hooks/useBanners";
import { Skeleton } from "@/components/ui/skeleton";

const PROMOS = [
    {
        id: 1,
        title: "Entrega Grátis",
        desc: "Para pedidos acima de R$ 50",
        color: "bg-gradient-to-r from-orange-500 to-red-600",
        icon: "🛵"
    },
    {
        id: 2,
        title: "Combo Família",
        desc: "2 Burgers + 2 Refri por R$ 69,90",
        color: "bg-gradient-to-r from-blue-600 to-indigo-600",
        icon: "🍔"
    },
    {
        id: 3,
        title: "Quarta do Burger",
        desc: "30% OFF em todos os Smashs",
        color: "bg-gradient-to-r from-green-500 to-emerald-700",
        icon: "🔥"
    }
];

export function PromoCarousel() {
    const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
    const { banners, isLoading } = useBanners();

    const activeBanners = banners.filter(b => b.is_active);
    const hasBanners = activeBanners.length > 0;

    if (isLoading) {
        return <Skeleton className="h-36 w-full rounded-2xl my-4" />;
    }

    return (
        <div className="overflow-hidden rounded-2xl shadow-xl my-4 mx-0 sm:mx-4 border border-orange-100" ref={emblaRef}>
            <div className="flex">
                {hasBanners ? (
                    activeBanners.map((banner) => (
                        <div key={banner.id} className="flex-[0_0_100%] min-w-0 relative h-48 sm:h-56 md:h-72">
                            <img
                                src={banner.image_url}
                                alt={banner.title || "Banner"}
                                className="w-full h-full object-cover"
                            />
                            {/* Modern Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                                {banner.title && <h3 className="text-white text-2xl md:text-4xl font-black uppercase tracking-tight drop-shadow-lg">{banner.title}</h3>}
                            </div>
                        </div>
                    ))
                ) : (
                    PROMOS.map((promo) => (
                        <div key={promo.id} className="flex-[0_0_100%] min-w-0 relative h-40 sm:h-48">
                            <div className={`w-full h-full ${promo.color} p-6 flex flex-col justify-center relative overflow-hidden`}>
                                {/* Abstract Background Shapes */}
                                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-black/10 blur-xl"></div>

                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="max-w-[70%]">
                                        <h3 className="text-white text-2xl sm:text-3xl font-black italic uppercase tracking-tighter leading-none mb-2 drop-shadow-md">
                                            {promo.title}
                                        </h3>
                                        <p className="text-white/90 font-medium text-sm sm:text-base bg-black/20 backdrop-blur-sm inline-block px-3 py-1 rounded-full border border-white/10">
                                            {promo.desc}
                                        </p>
                                    </div>
                                    <div className="text-6xl sm:text-7xl filter drop-shadow-2xl opacity-100 transform rotate-12 transition-transform duration-700 hover:rotate-6 hover:scale-110">
                                        {promo.icon}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
