import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from '@vercel/speed-insights/react';
import App from '@/App';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/index.css';

import { useState, useEffect } from 'react';

// مكون لعرض حالة الاتصال مع بيئة التطوير
function DevConnectionBanner() {
  const [isDisconnected, setIsDisconnected] = useState(false);

  useEffect(() => {
    const handleError = (event: any) => {
      const msgStr = String(event.message || event.reason?.message || '');
      if (
        msgStr.includes('WebSocket') || 
        msgStr.includes('vite') ||
        msgStr.includes('failed to connect to websocket') ||
        msgStr.includes('WebSocket closed')
      ) {
        setIsDisconnected(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (!isDisconnected) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] bg-red-600/90 text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce">
      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
      <span className="text-sm font-bold">فقد الاتصال ببيئة التطوير (HMR مُعطل)</span>
      <button 
        onClick={() => window.location.reload()}
        className="ml-2 bg-white/20 hover:bg-white/30 px-2 py-1 rounded-md text-[10px] font-bold transition-all active:scale-95"
      >
        إعادة تحميل
      </button>
    </div>
  );
}

// كتم وقمع الأخطاء في الـ console فقط لتقليل الضجيج
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.('WebSocket') || args[0]?.includes?.('vite')) return;
    originalError(...args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <DevConnectionBanner />
      <App />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  </StrictMode>,
);

// فحص وإصلاح التباين تلقائياً
function fixDarkCardTextContrast() {
  // الألوان الداكنة التي تحتاج نصوصاً فاتحة
  const darkBgPatterns = [
    '#050e21', '#0a1628', '#0c1a35', '#020813',
    '#071224', '#060f22', '#111827', '#1f2937',
    '#0f172a', '#1e293b'
  ];

  // تحقق من luminance اللون
  function getLuminance(r: number, g: number, b: number) {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  function parseColor(colorStr: string) {
    if (!colorStr || colorStr === 'transparent' ||
        colorStr === 'rgba(0, 0, 0, 0)') return null;

    const rgb = colorStr.match(/\d+/g);
    if (!rgb || rgb.length < 3) return null;

    return {
      r: parseInt(rgb[0]),
      g: parseInt(rgb[1]),
      b: parseInt(rgb[2])
    };
  }

  function isDarkBackground(element: Element) {
    const style = window.getComputedStyle(element);
    const bgColor = style.backgroundColor;
    const color = parseColor(bgColor);
    if (!color) return false;
    return getLuminance(color.r, color.g, color.b) < 0.35;
  }

  function isTextElementDark(element: Element) {
    const style = window.getComputedStyle(element);
    const textColor = style.color;
    const color = parseColor(textColor);
    if (!color) return false;
    return getLuminance(color.r, color.g, color.b) < 0.3;
  }

  function fixElement(el: Element) {
    if (!isDarkBackground(el)) return;

    // إصلاح النصوص المباشرة
    const textElements = el.querySelectorAll(
      'p, span, h1, h2, h3, h4, h5, h6, ' +
      'label, td, th, li, div > text, small, ' +
      '[class*="text-slate-7"], [class*="text-slate-8"], ' +
      '[class*="text-slate-9"], [class*="text-gray-7"], ' +
      '[class*="text-gray-8"], [class*="text-gray-9"], ' +
      '[class*="text-black"]'
    );

    textElements.forEach(textEl => {
      const htmlTextEl = textEl as HTMLElement;
      // تجاهل العناصر ذات الخلفية الخاصة
      const textBg = window.getComputedStyle(htmlTextEl).backgroundColor;
      const textBgColor = parseColor(textBg);
      if (textBgColor && getLuminance(
        textBgColor.r, textBgColor.g, textBgColor.b
      ) > 0.35) return;

      // تجاهل النصوص المضيئة بالفعل
      if (!isTextElementDark(htmlTextEl)) return;

      // تجاهل الأزرار والروابط
      if (htmlTextEl.tagName === 'BUTTON' ||
          htmlTextEl.tagName === 'A' ||
          htmlTextEl.closest('button') ||
          htmlTextEl.closest('a')) return;

      // تجاهل النصوص التي لها كلاس text- صريح
      const classes = htmlTextEl.className || '';
      const hasExplicitColor =
        classes.includes('text-amber') ||
        classes.includes('text-emerald') ||
        classes.includes('text-blue') ||
        classes.includes('text-red') ||
        classes.includes('text-green') ||
        classes.includes('text-purple') ||
        classes.includes('text-indigo') ||
        classes.includes('text-teal') ||
        classes.includes('text-white') ||
        classes.includes('text-slate-3') ||
        classes.includes('text-slate-4') ||
        classes.includes('text-slate-5') ||
        classes.includes('text-slate-6');

      if (hasExplicitColor) return;

      // إصلاح اللون
      htmlTextEl.style.color = '#e2e8f0';
    });
  }

  // تطبيق على جميع العناصر
  document.querySelectorAll('*').forEach(el => {
    try { fixElement(el); } catch(e) {}
  });
}

// تشغيل عند التحميل
if (document.readyState === 'complete') {
  setTimeout(fixDarkCardTextContrast, 500);
} else {
  window.addEventListener('load', () => {
    setTimeout(fixDarkCardTextContrast, 500);
  });
}

// تشغيل عند التغييرات
const contrastObserver = new MutationObserver(() => {
  clearTimeout((window as any)._contrastTimer);
  (window as any)._contrastTimer = setTimeout(fixDarkCardTextContrast, 300);
});

contrastObserver.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false
});
