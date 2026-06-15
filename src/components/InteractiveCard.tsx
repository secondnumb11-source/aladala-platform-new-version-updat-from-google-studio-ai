import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  themeColor?: string; // Optional indicator of dominant color style
  hasGoldBorder?: boolean;
  id?: string;
}

// Module level memoization cache wrapper to prevent redundant mathematics calculations on mouse/scroll actions
const luminanceCache: Record<string, { textColor: string; accentColor: string }> = {};

function calculateMemoizedContrast(activeBgTo: string, providedLuminance?: number) {
  if (luminanceCache[activeBgTo]) {
    return luminanceCache[activeBgTo];
  }
  
  let luminance = providedLuminance;

  if (luminance === undefined) {
    let hex = activeBgTo.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    
    luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  
  let result;
  // Threshold to determine light/dark contrasting (Strict WCAG compliance alignment)
  if (luminance < 0.4) {
    result = {
      // Deep dark background -> High-fidelity pure white for maximum readability
      textColor: '#FFFFFF',
      accentColor: '#FBBF24' 
    };
  } else {
    result = {
      // Light background -> Deepest Indigo Slate for sharp definition
      textColor: '#020617',
      accentColor: '#B45309' 
    };
  }
  
  luminanceCache[activeBgTo] = result;
  return result;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  className = '',
  themeColor = 'default',
  hasGoldBorder = true,
  id,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Background and text contrast dynamic control system
  const [textColor, setTextColor] = useState('#ffffff');
  const [accentColor, setAccentColor] = useState('#ffd700'); 

  useEffect(() => {
    const analyzeBackgroundBrightness = () => {
      if (!cardRef.current) return;
      
      const style = window.getComputedStyle(cardRef.current);
      const bg = style.backgroundColor; 
      
      const goldBrand = "#d4af37";
      const whiteBright = "#ffffff";

      if (bg && bg.startsWith('rgb')) {
        const rgbValues = bg.match(/\d+/g);
        if (rgbValues && rgbValues.length >= 3) {
          const r = parseInt(rgbValues[0]);
          const g = parseInt(rgbValues[1]);
          const b = parseInt(rgbValues[2]);
          
          const cacheKey = `${r},${g},${b}`;
          if (luminanceCache[cacheKey]) {
            const cachedResult = luminanceCache[cacheKey];
            setTextColor(cachedResult.textColor);
            setAccentColor(cachedResult.accentColor);
            return;
          }
          
          const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          
          // Force toggle between bright white and gold based on luminance
          // Dark background -> White text
          // Semi-light/Brand background -> Gold text or high-contrast alternative
          const isDark = luminance < 0.5;
          const finalColor = isDark ? whiteBright : goldBrand;
          const finalAccent = isDark ? goldBrand : "#B45309";

          luminanceCache[cacheKey] = { textColor: finalColor, accentColor: finalAccent };
          setTextColor(finalColor);
          setAccentColor(finalAccent);
          return;
        }
      }
      
      // Fallback
      setTextColor(whiteBright);
      setAccentColor(goldBrand);
    };

    analyzeBackgroundBrightness();
    window.addEventListener('adalah-advanced-config-updated', analyzeBackgroundBrightness);
    window.addEventListener('adalah-custom-themes-updated', analyzeBackgroundBrightness);
    
    const timer = setTimeout(analyzeBackgroundBrightness, 150);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('adalah-advanced-config-updated', analyzeBackgroundBrightness);
      window.removeEventListener('adalah-custom-themes-updated', analyzeBackgroundBrightness);
    };
  }, [themeColor, className]);

  return (
    <motion.div
      ref={cardRef}
      id={id}
      {...(props as any)}
      animate={{
        color: textColor,
        // Remove hover effects (scale/transform) as requested globally (handled here by NOT having whileHover)
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        transformStyle: 'preserve-3d',
        color: textColor,
        '--card-text': textColor,
        '--card-accent': accentColor
      } as any}
      className={`card-professional ${
        hasGoldBorder ? 'card-professional-gold-bordered' : ''
      } transition-[border-image,border-color,background-color] duration-300 relative select-none cursor-default ${className}`}
    >
      <span className="hidden text-amber-400 text-yellow-400 font-black text-amber-500 font-sans" style={{ color: accentColor }} />
      <div className="relative z-10 w-full h-full" style={{ color: 'inherit' }}>
        {children}
      </div>
    </motion.div>
  );
};
