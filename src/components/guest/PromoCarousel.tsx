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
        <div className="overflow-hidden rounded-2xl shadow-lg my-4 mx-4 border border-gray-100" ref={emblaRef}>
            <div className="flex">
                {hasBanners ? (
                    activeBanners.map((banner) => (
                        <div key={banner.id} className="flex-[0_0_100%] min-w-0 relative h-40 sm:h-48 md:h-64">
                            <img
                                src={banner.image_url}
                                alt={banner.title || "Banner"}
                                className="w-full h-full object-cover"
                            />
                            {/* Optional: Add gradient/text overlay if title exists */}
                            {banner.title && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                                    <h3 className="text-white text-xl md:text-3xl font-bold">{banner.title}</h3>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    PROMOS.map((promo) => (
                        <div key={promo.id} className="flex-[0_0_100%] min-w-0 relative">
                            <div className={`${promo.color} text-white p-6 h-36 flex flex-col justify-center`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-wider">{promo.title}</h3>
                                        <p className="opacity-90 font-medium mt-1">{promo.desc}</p>
                                    </div>
                                    <div className="text-4xl filter drop-shadow-md">
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
