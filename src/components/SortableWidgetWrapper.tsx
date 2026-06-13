import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const SortableWidgetWrapper = React.memo(function SortableWidgetWrapper({ id, isCustomizing, children, className }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: !isCustomizing });

  // Restore dimensions from localStorage if they exist
  const savedDimensions = React.useMemo(() => {
    try {
      const allDimensions = JSON.parse(localStorage.getItem('dragged_card_dimensions_map') || '{}');
      return allDimensions[id] || null;
    } catch (e) {
      return null;
    }
  }, [id]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
    width: savedDimensions?.width ? `${savedDimensions.width}px` : undefined,
    height: savedDimensions?.height ? `${savedDimensions.height}px` : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
       {/* Separate drag handle if needed or wrap everything. 
           We'll use standard drag on the container so we just spread listeners internally */}
       <div {...(isCustomizing ? attributes : {})} {...(isCustomizing ? listeners : {})} className="w-full h-full">
          {children}
       </div>
    </div>
  );
});
