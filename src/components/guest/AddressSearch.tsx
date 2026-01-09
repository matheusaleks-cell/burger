import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddressSearchResult {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    boundingbox: string[];
    lat: string;
    lon: string;
    display_name: string;
    class: string;
    type: string;
    importance: number;
}

interface AddressSearchProps {
    onSelect: (address: string, lat: number, lon: number) => void;
    currentAddress?: string;
}

export const AddressSearch = ({ onSelect, currentAddress }: AddressSearchProps) => {
    const [query, setQuery] = useState(currentAddress || "");
    const [results, setResults] = useState<AddressSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 3 && isOpen) {
                searchAddress(query);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [query, isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchAddress = async (q: string) => {
        setIsLoading(true);
        try {
            // Using Nominatim (OpenStreetMap)
            // Ideally restricting to a bounding box approx near the restaurant would be better, but global for now
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    q
                )}&addressdetails=1&limit=5&viewbox=-42.05,-22.85,-41.80,-22.70&bounded=1`,
                {
                    headers: {
                        "Accept-Language": "pt-BR", // Prefer Portuguese results
                    },
                }
            );

            if (!response.ok) throw new Error("Erro na busca");

            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error("Erro ao buscar endereço:", error);
            // Don't toast on type error, it's annoying
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (result: AddressSearchResult) => {
        const fullAddress = result.display_name;
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        setQuery(fullAddress);
        setIsOpen(false);
        onSelect(fullAddress, lat, lon);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    placeholder="Digite seu endereço e número..."
                    className="pl-9 pr-4"
                />
                {isLoading && (
                    <div className="absolute right-3 top-3">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {results.map((result) => (
                        <button
                            key={result.place_id}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-0 flex items-start gap-3 transition-colors"
                            onClick={() => handleSelect(result)}
                        >
                            <MapPin className="h-4 w-4 text-primary shrink-0 mt-1" />
                            <span className="text-sm text-slate-700 line-clamp-2">
                                {result.display_name}
                            </span>
                        </button>
                    ))}
                    <div className="px-2 py-1 bg-slate-50 text-[10px] text-right text-muted-foreground">
                        Busca por OpenStreetMap
                    </div>
                </div>
            )}
        </div>
    );
};
