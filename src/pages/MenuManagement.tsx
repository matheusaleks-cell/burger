import { useState, useEffect } from "react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCategories, Category } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
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
import { GripVertical, Save, ArrowLeft, Package, LayoutGrid, Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

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
    const {
        data: categories = [],
        updateCategoriesOrder,
        createCategory,
        updateCategory,
        deleteCategory,
        isLoading: loadingCategories
    } = useCategories();

    const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);
    const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // CRUD State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        is_active: true,
        is_featured: false
    });

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

    const handleSaveOrder = async () => {
        try {
            const categoryUpdates = orderedCategories.map((cat, index) => ({
                id: cat.id,
                display_order: index,
            }));
            await updateCategoriesOrder.mutateAsync(categoryUpdates);

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

    // CRUD Handlers
    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || "",
                is_active: category.is_active,
                is_featured: category.is_featured || false
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: "",
                description: "",
                is_active: true,
                is_featured: false
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingCategory) {
                await updateCategory.mutateAsync({
                    id: editingCategory.id,
                    ...formData
                });
            } else {
                await createCategory.mutateAsync({
                    ...formData,
                    display_order: orderedCategories.length // Put at end
                });
            }
            setIsDialogOpen(false);
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza? Isso pode afetar produtos vinculados a esta categoria.")) {
            await deleteCategory.mutateAsync(id);
        }
    }

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
                        <h1 className="text-3xl font-display font-black tracking-tighter text-slate-900 leading-none">Gerenciar Categorias</h1>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground italic ml-10">Gerencie as categorias e a ordem de exibição</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={handleSaveOrder}
                        disabled={!hasChanges || updateCategoriesOrder.isPending || updateProductsOrder.isPending}
                        className="gap-2 font-black uppercase text-xs tracking-widest px-6 shadow-lg shadow-primary/20"
                    >
                        <Save className="h-4 w-4" />
                        {updateCategoriesOrder.isPending ? "Salvando..." : "Salvar Ordem"}
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenDialog()} variant="outline" className="gap-2 font-bold border-dashed border-2">
                                <Plus className="h-4 w-4" />
                                Nova Categoria
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nome</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Hambúrgueres"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Descrição (Opcional)</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Ex: Nossos deliciosos burgers artesanais"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={formData.is_active}
                                        onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                                    />
                                    <Label>Categoria Ativa</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={formData.is_featured}
                                        onCheckedChange={checked => setFormData({ ...formData, is_featured: checked })}
                                    />
                                    <Label className="flex items-center gap-1">
                                        Em Destaque
                                        <Badge variant="outline" className="text-[10px] h-4 bg-yellow-50 text-yellow-700 border-yellow-200">
                                            Estrela
                                        </Badge>
                                    </Label>
                                </div>
                                <Button type="submit" className="w-full mt-4">
                                    {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
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
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={category.is_active ? "font-bold text-slate-700" : "font-bold text-slate-400 line-through"}>
                                                        {category.name}
                                                    </span>
                                                    {category.is_featured && <span className="text-yellow-500 text-xs">★</span>}
                                                    {!category.is_active && <Badge variant="secondary" className="text-[9px] px-1 h-4">Inativo</Badge>}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">{orderedProducts.filter(p => p.category_id === category.id).length} itens</span>
                                            </div>

                                            <div className="flex gap-1" onPointerDown={e => e.stopPropagation()}>
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpenDialog(category)}>
                                                    <Pencil className="h-3 w-3 text-slate-400 hover:text-blue-500" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(category.id)}>
                                                    <Trash2 className="h-3 w-3 text-slate-300 hover:text-red-500" />
                                                </Button>
                                            </div>
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
                        if (!category.is_active) return null; // Hide inactive categories from product preview
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
                    <Button size="sm" onClick={handleSaveOrder} className="font-black text-[10px] uppercase h-8">Salvar Agora</Button>
                </div>
            )}
        </div>
    );
}
