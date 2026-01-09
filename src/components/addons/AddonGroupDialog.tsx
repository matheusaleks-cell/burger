import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash, Plus, GripVertical } from "lucide-react";
import { ComplementGroup, useAddons } from "@/hooks/useAddons";

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

// Define SortableItem locally or import shared
const SortableItem = ({ id, children, className }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} className={className}>
            <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 touch-none shrink-0">
                <GripVertical className="h-4 w-4" />
            </button>
            {children}
        </div>
    );
};

interface AddonGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    group: ComplementGroup | null;
}

export const AddonGroupDialog = ({ open, onOpenChange, group }: AddonGroupDialogProps) => {
    const { createGroup, updateGroup } = useAddons();

    const [name, setName] = useState("");
    const [minQty, setMinQty] = useState(0);
    const [maxQty, setMaxQty] = useState<number | "">("");
    const [externalId, setExternalId] = useState("");

    useEffect(() => {
        if (open && group) {
            setName(group.name);
            setMinQty(group.min_quantity);
            setMaxQty(group.max_quantity ?? "");
            setExternalId(group.external_id || "");
        } else {
            setName("");
            setMinQty(0);
            setMaxQty("");
            setExternalId("");
        }
    }, [open, group]);

    const handleSaveGroup = async () => {
        if (!name) return;

        try {
            if (group) {
                await updateGroup.mutateAsync({
                    id: group.id,
                    name,
                    min_quantity: minQty,
                    max_quantity: maxQty === "" ? null : Number(maxQty),
                    external_id: externalId || null
                });
                onOpenChange(false);
            } else {
                await createGroup.mutateAsync({
                    name,
                    min_quantity: minQty,
                    max_quantity: maxQty === "" ? null : Number(maxQty),
                    external_id: externalId || null
                });
                onOpenChange(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{group ? "Editar Grupo de Complementos" : "Novo Grupo de Complementos"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nome do Grupo</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Escolha o Molho" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mínimo Obrigatório</Label>
                            <Input type="number" min="0" value={minQty} onChange={e => setMinQty(Number(e.target.value))} />
                            <p className="text-xs text-muted-foreground">0 = Opcional</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Máximo Permitido</Label>
                            <Input type="number" min="1" value={maxQty} onChange={e => setMaxQty(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Ilimitado se vazio" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>ID Externo (PDV)</Label>
                        <Input value={externalId} onChange={e => setExternalId(e.target.value)} />
                    </div>

                    {group && (
                        <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Opções do Grupo</h4>
                            </div>
                            <AddonItemsList groupId={group.id} items={group.items || []} />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleSaveGroup}>{group ? "Salvar Alterações" : "Criar Grupo"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const AddonItemsList = ({ groupId, items: initialItems }: { groupId: string, items: any[] }) => {
    const { createItem, updateItem, deleteItem, updateItemsOrder } = useAddons();
    const [newItemName, setNewItemName] = useState("");
    const [newItemPrice, setNewItemPrice] = useState("");

    // Local sortable state
    const [items, setItems] = useState(initialItems || []);

    useEffect(() => {
        setItems(initialItems || []);
    }, [initialItems]);

    const handleAdd = () => {
        if (!newItemName) return;
        createItem.mutate({
            group_id: groupId,
            name: newItemName,
            description: null,
            price: newItemPrice ? Number(newItemPrice) : 0,
            is_active: true,
            max_quantity: null,
            external_id: null,
            display_order: items.length // Append to end
        });
        setNewItemName("");
        setNewItemPrice("");
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            const newOrder = arrayMove(items, oldIndex, newIndex);
            setItems(newOrder);

            // Persist order
            const updates = newOrder.map((item, idx) => ({ id: item.id, display_order: idx }));
            updateItemsOrder.mutate(updates);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input placeholder="Nova opção (ex: Cebola extra)" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 border-primary/20 focus:border-primary" />
                <Input placeholder="+R$ 0,00" type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-24 border-primary/20" />
                <Button size="icon" onClick={handleAdd} className="shrink-0"><Plus className="h-4 w-4" /></Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {items?.map(item => (
                            <SortableItem key={item.id} id={item.id} className="bg-slate-50 border rounded-lg p-2 flex items-center gap-2 group hover:border-primary/50 transition-colors">
                                <div className="flex-1 flex gap-2">
                                    <Input
                                        defaultValue={item.name}
                                        onBlur={(e) => updateItem.mutate({ id: item.id, name: e.target.value })}
                                        className="flex-1 h-8 text-sm"
                                    />
                                    <div className="relative w-24">
                                        <span className="absolute left-2 top-2 text-[10px] text-muted-foreground font-bold">R$</span>
                                        <Input
                                            type="number"
                                            defaultValue={item.price}
                                            onBlur={(e) => updateItem.mutate({ id: item.id, price: Number(e.target.value) })}
                                            className="w-full h-8 pl-6 text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                <Switch checked={item.is_active} onCheckedChange={(c) => updateItem.mutate({ id: item.id, is_active: c })} className="scale-75" />

                                <Button variant="ghost" size="icon" onClick={() => deleteItem.mutate(item.id)} className="h-8 w-8 text-muted-foreground hover:text-red-500">
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </SortableItem>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    )
}
