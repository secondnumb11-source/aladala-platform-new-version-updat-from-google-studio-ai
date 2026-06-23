import React, { useEffect } from 'react';

// Utility function to calculate brightness of a color string (rgb, rgba, hex)
export const getBrightness = (colorStr: string) => {
  let r = 255, g = 255, b = 255;
  if (!colorStr || colorStr === "transparent" || colorStr === "rgba(0, 0, 0, 0)") {
    return 255;
  }
  
  if (colorStr.startsWith('rgb')) {
    const vals = colorStr.replace(/[^\d,]/g, '').split(',');
    if (vals.length >= 3) {
      r = parseInt(vals[0], 10);
      g = parseInt(vals[1], 10);
      b = parseInt(vals[2], 10);
    }
  } else if (colorStr.startsWith('#')) {
    const hex = colorStr.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  }
  
  // Perceived brightness equation (YIQ)
  return (r * 299 + g * 587 + b * 114) / 1000;
};

// Global CSS appended dynamically to handle optimized classes securely without overriding core system
const injectGlobalStyles = () => {
  if (document.getElementById('auto-contrast-styles')) return;
  const style = document.createElement('style');
  style.id = 'auto-contrast-styles';
  style.innerHTML = `
    .text-dark-theme-optimized {
      color: #FFFFFF !important;
      text-shadow: none !important;
    }
    .text-dark-theme-optimized * {
      color: #FFFFFF !important;
      text-shadow: none !important;
    }
    .text-dark-theme-optimized-accent {
      color: #FACC15 !important;
    }
    .text-light-theme-optimized {
      color: #020617 !important;
      text-shadow: none !important;
    }
  `;
  document.head.appendChild(style);
};

export function setupContrastObserver() {
  injectGlobalStyles();
  
  const scanAndFixContrast = () => {
    // Scan all specific cards or broad card classes
    const elements = document.querySelectorAll(
      '.card-professional, .card-professional-item, .glass-panel, [class*="bg-slate-"], [class*="bg-sky-"], [class*="bg-gray-"], [data-contrast-target]'
    );
    
    elements.forEach((el) => {
      const computed = window.getComputedStyle(el);
      const bg = computed.backgroundColor;
      const brightness = getBrightness(bg);
      
      // Assume elements with transparent backgrounds inherit from their parent or the app body.
      if (bg === "transparent" || bg === "rgba(0, 0, 0, 0)") return;
      
      const isDark = brightness < 128; // Usually 128 is the threshold
      
      // Avoid mutating already stamped items unnecessarily
      if (isDark) {
        if (el.getAttribute('data-contrast-level') !== 'dark') {
          el.setAttribute('data-contrast-level', 'dark');
          el.classList.add('text-dark-theme-optimized');
          el.classList.remove('text-light-theme-optimized');
        }
      } else {
        if (el.getAttribute('data-contrast-level') !== 'light') {
          el.setAttribute('data-contrast-level', 'light');
          el.classList.add('text-light-theme-optimized');
          el.classList.remove('text-dark-theme-optimized');
        }
      }
    });
    
    // Also scan explicitly created tables for `.high-contrast-table-row`
    const tableRows = document.querySelectorAll('tbody tr');
    tableRows.forEach(row => {
        row.classList.add('high-contrast-table-row');
    });
  };

  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (let mutation of mutations) {
      if (mutation.type === 'childList' || (mutation.type === 'attributes' && mutation.attributeName === 'class')) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      // Debounce the scan slightly to prevent performance issues
      clearTimeout((window as any)._contrastScanTimer);
      (window as any)._contrastScanTimer = setTimeout(scanAndFixContrast, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });

  // Initial scan
  scanAndFixContrast();

  return () => observer.disconnect();
}

export default function AutoContrastFixer() {
  useEffect(() => {
    const cleanup = setupContrastObserver();
    return cleanup;
  }, []);

  return null;
}
