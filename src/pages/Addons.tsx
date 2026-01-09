import { useState, useEffect } from "react";
import { Plus, Edit, Trash, GripVertical, AlertCircle, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddonGroupDialog } from "@/components/addons/AddonGroupDialog";
import { useAddons, ComplementGroup, ComplementItem } from "@/hooks/useAddons";

// DnD Imports
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
import { toast } from "sonner";

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    className?: string;
    handle?: boolean;
}

const SortableItem = ({ id, children, className, handle = true }: SortableItemProps) => {
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
        position: 'relative' as 'relative', // Proper typing
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={className}>
            {/* If handle is true, we wrap only the handle with listeners, otherwise the whole element */}
            <div className={`flex items-center gap-3 ${isDragging ? "shadow-lg scale-[1.02]" : ""}`}>
                {handle && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-black/5 rounded text-gray-400 hover:text-primary transition-colors touch-none"
                    >
                        <GripVertical className="h-5 w-5" />
                    </button>
                )}
                {/* Visual Content */}
                <div className="flex-1 min-w-0">
                    {children}
                </div>
            </div>
        </div>
    );
};


const Addons = () => {
    const { addonGroups, isLoading, deleteGroup, updateGroupsOrder, updateItemsOrder } = useAddons();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<ComplementGroup | null>(null);
    const [itemsOrderMap, setItemsOrderMap] = useState<Record<string, ComplementItem[]>>({});

    // Internal state for optimistic updates
    const [orderedGroups, setOrderedGroups] = useState<ComplementGroup[]>([]);

    // Sync state with data
    useEffect(() => {
        if (addonGroups) {
            setOrderedGroups(addonGroups);
            // Also sync items map
            const itemsMap: any = {};
            addonGroups.forEach(g => {
                itemsMap[g.id] = g.items || [];
            });
            setItemsOrderMap(itemsMap);
        }
    }, [addonGroups]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEndGroup = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = orderedGroups.findIndex((i) => i.id === active.id);
            const newIndex = orderedGroups.findIndex((i) => i.id === over.id);
            const newOrder = arrayMove(orderedGroups, oldIndex, newIndex);
            setOrderedGroups(newOrder);

            // Persist
            // We map index to display_order
            const updates = newOrder.map((group, idx) => ({ id: group.id, display_order: idx }));
            updateGroupsOrder.mutate(updates);
        }
    };

    const handleCreate = () => {
        setSelectedGroup(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (group: ComplementGroup) => {
        setSelectedGroup(group);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir este grupo?")) {
            await deleteGroup.mutateAsync(id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-display font-black tracking-tight text-slate-900">Complementos</h1>
                    <p className="text-muted-foreground font-medium">
                        Gerencie opções adicionais seguindo o padrão iFood (Obrigatórios/Opcionais).
                    </p>
                </div>
                <Button onClick={handleCreate} className="shadow-lg shadow-primary/20 font-bold uppercase tracking-wide">
                    <Plus className="mr-2 h-4 w-4" /> Novo Grupo
                </Button>
            </div>

            {orderedGroups.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed rounded-xl bg-slate-50">
                    <p className="text-muted-foreground font-medium">Nenhum grupo de complementos criado.</p>
                    <Button variant="link" onClick={handleCreate}>Criar o primeiro</Button>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEndGroup}
                >
                    <SortableContext
                        items={orderedGroups.map(g => g.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="grid gap-4 max-w-4xl mx-auto">
                            {orderedGroups.map((group) => (
                                <SortableItem key={group.id} id={group.id} className="bg-white border rounded-xl p-4 shadow-sm hover:border-primary/50 transition-colors">
                                    {/* Card Content with Drag Handle Implicit */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg text-slate-800">{group.name}</h3>
                                                {group.min_quantity > 0 ? (
                                                    <Badge className="bg-slate-900 text-[10px] uppercase font-bold">Obrigatório</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-[10px] uppercase font-bold text-slate-500">Opcional</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                {group.min_quantity > 0 ? `Mínimo: ${group.min_quantity}` : "Sem mínimo"} •
                                                {group.max_quantity ? ` Máximo: ${group.max_quantity}` : " Ilimitado"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(group)} className="text-slate-500 hover:text-primary font-bold text-xs h-8">
                                                Editar Itens
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)} className="text-slate-400 hover:text-red-500 h-8 w-8">
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Preview of Items (Not sortable here, only inside Edit) */}
                                    <div className="mt-4 pt-4 border-t border-dashed flex flex-wrap gap-2">
                                        {group.items?.length === 0 ? (
                                            <span className="text-xs text-muted-foreground italic">Nenhum item neste grupo.</span>
                                        ) : (
                                            group.items?.slice(0, 5).map(item => (
                                                <Badge key={item.id} variant="outline" className={`text-[10px] font-medium border-slate-200 ${!item.is_active && 'opacity-50 line-through'}`}>
                                                    {item.name}
                                                    {item.price > 0 && <span className="text-slate-400 ml-1"> (+R$ {item.price})</span>}
                                                </Badge>
                                            ))
                                        )}
                                        {(group.items?.length || 0) > 5 && (
                                            <span className="text-[10px] text-muted-foreground self-center">+ {(group.items?.length || 0) - 5} outros</span>
                                        )}
                                    </div>
                                </SortableItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            <AddonGroupDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                group={selectedGroup}
            />
        </div>
    );
};

export default Addons;
