'use client';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash2, GripVertical } from 'lucide-react';

interface CategoryItem {
  _id: string;
  name: string;
  key: string;
  layout: string;
  order: number;
}

interface SortableCategoryListProps {
  categories: CategoryItem[];
  onEdit: (cat: any) => void;
  onDelete: (id: string) => void;
  onReorder: (newCategories: CategoryItem[]) => void;
  featuredId: string;
}

export default function SortableCategoryList({ categories, onEdit, onDelete, onReorder, featuredId }: SortableCategoryListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c._id === active.id);
    const newIndex = categories.findIndex((c) => c._id === over.id);
    const newOrder = arrayMove(categories, oldIndex, newIndex);
    onReorder(newOrder);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={categories.map(c => c._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {categories.map((cat) => (
            <SortableCategoryRow
              key={cat._id}
              category={cat}
              onEdit={onEdit}
              onDelete={onDelete}
              isFeatured={cat.key === featuredId}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCategoryRow({ category, onEdit, onDelete, isFeatured }: { category: CategoryItem; onEdit: (cat: any) => void; onDelete: (id: string) => void; isFeatured: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-4 p-3 rounded-lg border ${isDragging ? 'bg-primary/10' : 'bg-card'}`}>
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical size={18} />
      </button>
      <div className="flex-1 flex items-center gap-4">
        <span className="font-medium">{category.name}</span>
        <span className="text-xs text-muted-foreground">{category.key}</span>
        {!isFeatured && <span className="text-xs bg-muted px-2 py-0.5 rounded">{category.layout}</span>}
      </div>
      {!isFeatured && (
        <div className="flex gap-1">
          <button onClick={() => onEdit(category)} className="p-1 hover:bg-muted rounded">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(category._id)} className="p-1 hover:bg-muted rounded">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}