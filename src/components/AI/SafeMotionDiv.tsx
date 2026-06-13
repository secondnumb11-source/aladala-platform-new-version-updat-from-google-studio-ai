import React, { useState, useEffect, useRef } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

/**
 * Utility to determine text color based on background color or appearance.
 * For this implementation, we use a simple observer or specific CSS logic.
 */
export function useContrast(ref: React.RefObject<HTMLElement>) {
  const [isBright, setIsBright] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const checkBrightness = () => {
      if (!ref.current) return;
      const style = window.getComputedStyle(ref.current);
      const bg = style.backgroundColor;
      
      // Simple RGB parser
      const rgb = bg.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);
        // HSP color model brightness formula
        const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
        setIsBright(hsp > 127.5);
      } else {
        // Fallback for transparent or non-rgb colors
        // Usually cards in this app are dark by default or light via theme
        setIsBright(document.documentElement.classList.contains('light'));
      }
    };

    checkBrightness();
    
    // Re-check on theme changes or resize
    window.addEventListener('theme-change', checkBrightness);
    window.addEventListener('resize', checkBrightness);
    
    const observer = new MutationObserver(checkBrightness);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });

    return () => {
      window.removeEventListener('theme-change', checkBrightness);
      window.removeEventListener('resize', checkBrightness);
      observer.disconnect();
    };
  }, [ref]);

  return isBright;
}

interface SafeMotionDivProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  ignoreContrast?: boolean;
}

export const SafeMotionDiv: React.FC<SafeMotionDivProps> = ({ children, className = '', ignoreContrast = false, ...props }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isBright = useContrast(ref);

  const contrastClass = ignoreContrast ? '' : (isBright ? 'text-slate-900' : 'text-white');

  return (
    <motion.div
      ref={ref}
      className={`${className} ${contrastClass} transition-colors duration-300`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default SafeMotionDiv;
