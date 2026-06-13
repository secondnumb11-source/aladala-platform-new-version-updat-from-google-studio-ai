import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const SortableWidgetWrapper = React.memo(function SortableWidgetWrapper({ id, widgetSize, onResize, isCustomizing, children, className }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: !isCustomizing });

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
    <div ref={setNodeRef} style={style} className={`${className} relative`}>
       {isCustomizing && onResize && (
         <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-1 bg-white p-1 rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.1)] border border-slate-200" dir="rtl">
           <button onClick={(e) => { e.stopPropagation(); onResize(id, 'qr'); }} className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${widgetSize === 'qr' ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>صغير</button>
           <button onClick={(e) => { e.stopPropagation(); onResize(id, 'half'); }} className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${widgetSize === 'half' ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>متوسط</button>
           <button onClick={(e) => { e.stopPropagation(); onResize(id, 'full'); }} className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${widgetSize === 'full' ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>عريض</button>
         </div>
       )}
       <div {...(isCustomizing ? attributes : {})} {...(isCustomizing ? listeners : {})} className="w-full h-full relative cursor-auto">
          {children}
       </div>
    </div>
  );
});
