import { useEffect } from 'react';

// Utility to calculate brightness of hex/rgb and apply WCAG 7:1 contrasting colors
function getBrightness(r, g, b) {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function useDynamicContrastUtility() {
  useEffect(() => {
    const observer = new MutationObserver(() => {
      document.querySelectorAll('.needs-contrast').forEach(el => {
        const bg = window.getComputedStyle(el).backgroundColor;
        const rgb = bg.match(/\d+/g);
        if (rgb) {
          const brightness = getBrightness(Number(rgb[0]), Number(rgb[1]), Number(rgb[2]));
          if (brightness > 125) {
            el.classList.add('text-light-theme-optimized');
            el.classList.remove('text-dark-theme-optimized');
          } else {
            el.classList.add('text-dark-theme-optimized');
            el.classList.remove('text-light-theme-optimized');
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    
    return () => observer.disconnect();
  }, []);
}
