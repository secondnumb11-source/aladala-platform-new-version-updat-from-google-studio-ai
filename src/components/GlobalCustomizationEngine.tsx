import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Palette, Move, Maximize2, LayoutGrid, Check, Undo2 } from 'lucide-react';

export default function GlobalCustomizationEngine() {
  const [isActive, setIsActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });

  const customStylesRef = useRef<{ [key: string]: any }>(() => {
    try {
      return JSON.parse(localStorage.getItem('adalah-global-custom-styles') || '{}');
    } catch {
      return {};
    }
  });

  const generateElementId = (el: HTMLElement) => {
    if (el.id) return el.id;
    // Generate a unique path-based ID if no ID exists
    let path = '';
    let current: HTMLElement | null = el;
    while (current && current !== document.body) {
      let index = 0;
      let sibling = current.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === current.tagName) index++;
        sibling = sibling.previousElementSibling;
      }
      path = `${current.tagName}-${index}_${path}`;
      current = current.parentElement;
    }
    el.id = `dyn-id-${path.replace(/[^a-zA-Z0-9]/g, '')}`;
    return el.id;
  };

  useEffect(() => {
    // contrastOptimizer: Real-time scan and correction of dark text on dark backgrounds
    const optimizeContrast = () => {
      const elements = document.querySelectorAll(
        '.card-professional, .card-professional-item, .glass-panel, [class*="bg-slate-"], [class*="bg-sky-"], [class*="bg-gray-"], [data-contrast-target]'
      );
      
      elements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const bg = computed.backgroundColor;
        
        let r = 255, g = 255, b = 255;
        if (bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
          if (bg.startsWith('rgb')) {
            const vals = bg.replace(/[^\d,]/g, '').split(',');
            if (vals.length >= 3) {
              r = parseInt(vals[0], 10);
              g = parseInt(vals[1], 10);
              b = parseInt(vals[2], 10);
            }
          }
        }
        
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        const isDark = brightness < 128;
        
        if (bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
          if (isDark) {
            if (el.getAttribute('data-contrast-level') !== 'dark') {
              el.setAttribute('data-contrast-level', 'dark');
              el.classList.add('text-high-contrast-light-bg');
            }
          } else {
            if (el.getAttribute('data-contrast-level') !== 'light') {
              el.setAttribute('data-contrast-level', 'light');
              el.classList.remove('text-high-contrast-light-bg');
            }
          }
        }
      });
      
      // Force table stripes readability
      const tableRows = document.querySelectorAll('tbody tr');
      tableRows.forEach(row => {
          row.classList.add('high-contrast-table-row');
      });
    };

    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (let mutation of mutations) {
        if (mutation.type === 'childList') {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) {
        optimizeContrast();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    optimizeContrast();

    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    // Apply saved styles on load and when active
    const applySavedStyles = () => {
      const styles = JSON.parse(localStorage.getItem('adalah-global-custom-styles') || '{}');
      Object.keys(styles).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          if (styles[id].backgroundColor) el.style.backgroundColor = styles[id].backgroundColor;
          if (styles[id].color) el.style.color = styles[id].color;
          if (styles[id].width) el.style.width = styles[id].width;
          if (styles[id].height) el.style.height = styles[id].height;
          if (styles[id].order) el.style.order = styles[id].order;
          if (styles[id].borderColor) el.style.borderColor = styles[id].borderColor;
        }
      });
    };
    applySavedStyles();

    // Removed the periodic re-apply to optimize performance and prevent re-rendering/flicker
    const handleReapply = () => applySavedStyles();
    window.addEventListener('adalah-advanced-config-updated', handleReapply);
    return () => window.removeEventListener('adalah-advanced-config-updated', handleReapply);
  }, []);

  useEffect(() => {
    if (!isActive) {
      document.body.classList.remove('global-customization-active');
      document.querySelectorAll('.customizable-card').forEach(el => {
        (el as HTMLElement).style.resize = 'none';
        (el as HTMLElement).style.overflow = '';
        (el as HTMLElement).draggable = false;
        el.classList.remove('ring-4', 'ring-primary', 'cursor-move');
        (el as HTMLElement).removeEventListener('contextmenu', handleContextMenu);
        (el as HTMLElement).removeEventListener('dragstart', handleDragStart);
        (el as HTMLElement).removeEventListener('dragover', handleDragOver);
        (el as HTMLElement).removeEventListener('drop', handleDrop);
        (el as HTMLElement).removeEventListener('mouseup', handleResizeEnd);
      });
      return;
    }

    document.body.classList.add('global-customization-active');

    // Find all cards and boxes
    const scanAndAttach = () => {
      const targets = document.querySelectorAll(
        '.card-professional, .bg-white, .bg-slate-900, .inner-card-box, .bg-slate-50, section, [class*="rounded-xl"], [class*="rounded-2xl"], [class*="grid-cols-"] > div'
      );

      targets.forEach(el => {
        const hEl = el as HTMLElement;
        // Ignore tiny elements, buttons, or the engine itself
        if (hEl.tagName === 'BUTTON' || hEl.closest('.global-customization-engine-ui') || hEl.clientWidth < 50 || hEl.clientHeight < 50) return;
        
        hEl.classList.add('customizable-card');
        hEl.style.resize = 'both';
        hEl.style.overflow = 'auto'; // needed for resize
        hEl.draggable = true;
        
        generateElementId(hEl);

        hEl.removeEventListener('contextmenu', handleContextMenu);
        hEl.addEventListener('contextmenu', handleContextMenu);
        
        hEl.removeEventListener('dragstart', handleDragStart);
        hEl.addEventListener('dragstart', handleDragStart);
        
        hEl.removeEventListener('dragover', handleDragOver);
        hEl.addEventListener('dragover', handleDragOver);
        
        hEl.removeEventListener('drop', handleDrop);
        hEl.addEventListener('drop', handleDrop);

        hEl.removeEventListener('mouseup', handleResizeEnd);
        hEl.addEventListener('mouseup', handleResizeEnd);
      });
    };

    scanAndAttach();
    const observer = new MutationObserver((mutations) => {
      if (isActive) scanAndAttach();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [isActive]);


  // Drag and Drop Logic (Vanilla HTML5)
  let draggedEl: HTMLElement | null = null;

  const handleDragStart = (e: DragEvent) => {
    e.stopPropagation();
    draggedEl = e.currentTarget as HTMLElement;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', draggedEl.innerHTML);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    return false;
  };

  const handleDrop = (e: DragEvent) => {
    e.stopPropagation();
    const targetEl = e.currentTarget as HTMLElement;
    if (draggedEl && draggedEl !== targetEl && draggedEl.parentElement === targetEl.parentElement) {
      // Reordering via CSS Order property for flexibility
      const parent = targetEl.parentElement;
      if (parent) {
        Array.from(parent.children).forEach((child, index) => {
           (child as HTMLElement).style.order = `${index + 1}`;
        });
        
        const draggedOrder = getComputedStyle(draggedEl).order;
        const targetOrder = getComputedStyle(targetEl).order;
        
        draggedEl.style.order = targetOrder;
        targetEl.style.order = draggedOrder;

        saveStyle(draggedEl.id, { order: draggedEl.style.order });
        saveStyle(targetEl.id, { order: targetEl.style.order });
      }
    }
    return false;
  };

  const handleResizeEnd = (e: MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target && target.classList.contains('customizable-card')) {
      const w = target.style.width;
      const h = target.style.height;
      if (w || h) {
        saveStyle(target.id, { width: w, height: h });
      }
    }
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    
    document.querySelectorAll('.customizable-card').forEach(el => el.classList.remove('ring-4', 'ring-primary'));
    target.classList.add('ring-4', 'ring-primary');
    
    setSelectedElement(target);
    setShowColorPicker(true);
    setPickerPosition({ x: e.clientX, y: e.clientY });
  };

  const saveStyle = (id: string, newStyles: any) => {
    try {
      const existing = JSON.parse(localStorage.getItem('adalah-global-custom-styles') || '{}');
      existing[id] = { ...existing[id], ...newStyles };
      localStorage.setItem('adalah-global-custom-styles', JSON.stringify(existing));
    } catch {}
  };

  const COLORS = [
    '#ffffff', '#041a45', '#1e293b', '#022c22', '#1e1b4b', '#050505', 
    '#f8fafc', '#f1f5f9', '#fffbeb', '#f0fdf4', '#d4af37', '#facc15', '#b45309'
  ];

  const applyColor = (bg: string, text: string) => {
    if (selectedElement) {
      selectedElement.style.backgroundColor = bg;
      selectedElement.style.color = text;
      selectedElement.style.setProperty('--card-text', text);
      saveStyle(selectedElement.id, { backgroundColor: bg, color: text });
      
      // Attempt to change inner texts automatically for contrast
      const textNodes = selectedElement.querySelectorAll('h1, h2, h3, h4, p, span');
      textNodes.forEach(node => {
        (node as HTMLElement).style.color = text;
      });
    }
  };

  const resetAllStyles = () => {
    if (window.confirm('هل أنت متأكد من مسح جميع التخصيصات (الألوان، الأحجام، الترتيب) والعودة للوضع الافتراضي؟')) {
      localStorage.removeItem('adalah-global-custom-styles');
      window.location.reload();
    }
  };

  return (
    <>
      <style>{`
        .global-customization-active .customizable-card {
           transition: box-shadow 0.2s, border 0.2s;
           cursor: move;
        }
        .global-customization-active .customizable-card:hover {
           outline: 2px dashed #d4af37;
           outline-offset: -2px;
        }
        .global-customization-active * {
           user-select: none !important;
        }
        /* Custom scrollbars for resizable boxes */
        .customizable-card::-webkit-resizer {
          background-color: #d4af37;
          border-radius: 50%;
        }
      `}</style>

      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsActive(!isActive)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`global-customization-engine-ui fixed bottom-24 left-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-colors border-2 ${
          isActive ? 'bg-[#D4AF37] text-[#0b1329] font-black border-white' : 'bg-slate-900 border-[#D4AF37]/50 text-[#FACC15] font-black'
        }`}
        title="تخصيص الواجهات الشامل (تغيير الألوان، الأحجام، ترتيب الكروت)"
      >
        {isActive ? <Check className="w-6 h-6" /> : <LayoutGrid className="w-6 h-6" />}
      </motion.button>

      {/* Context Menu / Color Picker */}
      <AnimatePresence>
        {isActive && showColorPicker && selectedElement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="global-customization-engine-ui fixed z-[10000] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 w-72"
            style={{ 
              top: Math.min(pickerPosition.y, window.innerHeight - 250), 
              left: Math.min(pickerPosition.x, window.innerWidth - 300) 
            }}
            onMouseLeave={() => {
               setShowColorPicker(false);
               selectedElement.classList.remove('ring-4', 'ring-primary');
            }}
          >
            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Palette className="w-4 h-4 text-[#FACC15] font-black" />
              <h4 className="text-sm font-black text-slate-800 dark:text-white">تخصيص هوية المربع</h4>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">لون الخلفية (مع التباين الآلي)</p>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        // basic contrast logic
                        const isLight = ['#ffffff', '#f8fafc', '#f1f5f9', '#fffbeb', '#f0fdf4', '#facc15'].includes(color.toLowerCase());
                        applyColor(color, isLight ? '#0f172a' : '#ffffff');
                      }}
                      className="w-6 h-6 rounded-full border border-slate-300 shadow-sm focus:ring-2 focus:ring-[#D4AF37]"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">الحدود والإطار</p>
                <div className="flex gap-2">
                   <button onClick={() => { selectedElement.style.border = '2px solid #D4AF37'; saveStyle(selectedElement.id, { border: '2px solid #D4AF37' }); }} className="flex-1 py-1 text-xs font-bold border border-[#D4AF37] text-[#FACC15] font-black rounded-lg">إطار ذهبي</button>
                   <button onClick={() => { selectedElement.style.border = '1px solid #334155'; saveStyle(selectedElement.id, { border: '1px solid #334155' }); }} className="flex-1 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg">إطار داكن</button>
                   <button onClick={() => { selectedElement.style.border = 'none'; saveStyle(selectedElement.id, { border: 'none' }); }} className="flex-1 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg">بدون</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Panel Header when active */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="global-customization-engine-ui fixed top-0 left-0 right-0 h-14 bg-[#1E293B] border-b border-[#D4AF37]/30 z-[9998] flex items-center justify-between px-6 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-[#FACC15] font-black animate-spin-slow" />
              <span className="font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FACC15]">
                وضع التخصيص الحر مفعل (اسحب لإعادة الترتيب، كبر/صغر من الزوايا، كليك يمين لتغيير اللون)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={resetAllStyles}
                className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold rounded-lg text-xs font-bold transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                استعادة الافتراضي
              </button>
              <button 
                onClick={() => setIsActive(false)}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37] text-slate-900 rounded-lg text-xs font-black transition-colors shadow-[0_0_15px_rgba(212,175,55,0.4)]"
              >
                <Check className="w-4 h-4" />
                حفظ وإنهاء
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
