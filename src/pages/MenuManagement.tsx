import { useState, useEffect } from "react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCategories, Category } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Save, ArrowLeft, Package, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

const SortableItem = ({ id, children, className }: SortableItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={className}>
            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm group hover:border-primary transition-colors">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-primary transition-colors"
                >
                    <GripVertical className="h-5 w-5" />
                </button>
                <div className="flex-1 min-w-0">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default function MenuManagement() {
    const navigate = useNavigate();
    const { products, updateProductsOrder, isLoading: loadingProducts } = useProducts();
    const { data: categories = [], updateCategoriesOrder, isLoading: loadingCategories } = useCategories();

    const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);
    const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (categories.length) {
            setOrderedCategories([...categories].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
        }
    }, [categories]);

    useEffect(() => {
        if (products.length) {
            setOrderedProducts([...products].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
        }
    }, [products]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleCategoryDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setOrderedCategories((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newArray = arrayMove(items, oldIndex, newIndex);
                setHasChanges(true);
                return newArray;
            });
        }
    };

    const handleProductDragEnd = (event: DragEndEvent, categoryId: string) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setOrderedProducts((items) => {
                const categoryItems = items.filter(p => p.category_id === categoryId);
                const otherItems = items.filter(p => p.category_id !== categoryId);

                const oldIndex = categoryItems.findIndex((i) => i.id === active.id);
                const newIndex = categoryItems.findIndex((i) => i.id === over.id);
                const reorderedCategoryItems = arrayMove(categoryItems, oldIndex, newIndex);

                setHasChanges(true);
                return [...otherItems, ...reorderedCategoryItems];
            });
        }
    };

    const handleSave = async () => {
        try {
            // Update categories
            const categoryUpdates = orderedCategories.map((cat, index) => ({
                id: cat.id,
                display_order: index,
            }));
            await updateCategoriesOrder.mutateAsync(categoryUpdates);

            // Update products (preserving relative order within categories)
            const productUpdates = orderedProducts.map((prod, index) => ({
                id: prod.id,
                display_order: index,
            }));
            await updateProductsOrder.mutateAsync(productUpdates);

            setHasChanges(false);
            toast.success("Cardápio organizado com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar a nova ordem");
        }
    };

    if (loadingProducts || loadingCategories) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-slate-900 leading-none">Organizar Cardápio</h1>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground italic ml-10">Arraste e solte para definir a ordem de exibição para os hóspedes</p>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || updateCategoriesOrder.isPending || updateProductsOrder.isPending}
                    className="gap-2 font-black uppercase text-xs tracking-widest px-8 shadow-lg shadow-primary/20"
                >
                    <Save className="h-4 w-4" />
                    {updateCategoriesOrder.isPending || updateProductsOrder.isPending ? "Salvando..." : "Salvar Ordem"}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Categories Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <LayoutGrid className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Categorias</h2>
                    </div>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleCategoryDragEnd}
                    >
                        <SortableContext
                            items={orderedCategories.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {orderedCategories.map((category) => (
                                    <SortableItem key={category.id} id={category.id}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-700">{category.name}</span>
                                            <Badge variant="outline" className="text-[10px] uppercase font-black">
                                                {orderedProducts.filter(p => p.category_id === category.id).length} itens
                                            </Badge>
                                        </div>
                                    </SortableItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                {/* Products Column */}
                <div className="lg:col-span-2 space-y-8">
                    {orderedCategories.map((category) => {
                        const categoryProducts = orderedProducts.filter(p => p.category_id === category.id);

                        return (
                            <div key={category.id} className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-700">{category.name}</h3>
                                </div>

                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={(e) => handleProductDragEnd(e, category.id)}
                                >
                                    <SortableContext
                                        items={categoryProducts.map(p => p.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {categoryProducts.map((product) => (
                                                <SortableItem key={product.id} id={product.id}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            {product.image_url ? (
                                                                <img src={product.image_url} className="h-10 w-10 rounded-md object-cover flex-shrink-0" />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                                    <Package className="h-5 w-5 text-slate-400" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-sm text-slate-800 truncate">{product.name}</p>
                                                                <p className="text-xs text-primary font-bold">
                                                                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {!product.is_active && (
                                                            <Badge variant="destructive" className="text-[8px] uppercase font-black px-1 h-4">Inativo</Badge>
                                                        )}
                                                    </div>
                                                </SortableItem>
                                            ))}
                                            {categoryProducts.length === 0 && (
                                                <div className="col-span-full py-8 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground text-sm font-medium italic">
                                                    Nenhum item nesta categoria
                                                </div>
                                            )}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        );
                    })}
                </div>
            </div>

            {hasChanges && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border-2 border-primary shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 animate-bounce-subtle z-50">
                    <p className="text-sm font-black uppercase tracking-tighter text-slate-900">Alterações não salvas!</p>
                    <Button size="sm" onClick={handleSave} className="font-black text-[10px] uppercase h-8">Salvar Agora</Button>
                </div>
            )}
        </div>
    );
}
