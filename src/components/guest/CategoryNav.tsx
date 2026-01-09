import { Package } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Category {
    id: string;
    name: string;
    display_order: number;
}

interface CategoryNavProps {
    categories: Category[];
    selectedCategory: string;
    setSelectedCategory: (id: string) => void;
    isDeliveryMode?: boolean;
}

export function CategoryNav({ categories, selectedCategory, setSelectedCategory, isDeliveryMode }: CategoryNavProps) {
    const { t } = useLanguage();

    return (
        <div className={`container mx-auto px-4 py-3 pb-4 border-b sticky top-[72px] z-30 ${isDeliveryMode ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-gray-50'}`}>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1">
                <button
                    onClick={() => setSelectedCategory("all")}
                    className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all font-bold text-sm shadow-sm
            ${selectedCategory === "all"
                            ? (isDeliveryMode ? "bg-emerald-600 text-white shadow-emerald-200" : "bg-primary text-white shadow-primary/25") + " shadow-lg scale-105"
                            : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 " + (isDeliveryMode ? "hover:border-emerald-200" : "hover:border-primary/50")}
          `}
                >
                    <Package className="h-4 w-4" />
                    <span>{t.guest.categories.all}</span>
                </button>

                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`
              items-center justify-center px-4 py-2.5 rounded-full whitespace-nowrap transition-all font-bold text-sm shadow-sm
              ${selectedCategory === category.id
                                ? (isDeliveryMode ? "bg-emerald-600 text-white shadow-emerald-200" : "bg-primary text-primary-foreground shadow-primary/25") + " shadow-lg scale-105"
                                : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 " + (isDeliveryMode ? "hover:border-emerald-200" : "hover:border-primary/50")}
            `}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
