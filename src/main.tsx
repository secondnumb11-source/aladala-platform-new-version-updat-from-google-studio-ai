import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from '@vercel/speed-insights/react';
import App from '@/App';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/index.css';

import { useState, useEffect } from 'react';

// مكون لعرض حالة الاتصال مع بيئة التطوير بنمط فاخر ورياضي يخدم المحامين
function DevConnectionBanner() {
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // 1. مراقبة أخطاء المتصفح والاتصال
    const handleError = (event: any) => {
      const msgStr = String(event.message || event.reason?.message || event.reason || '');
      if (
        msgStr.toLowerCase().includes('websocket') || 
        msgStr.toLowerCase().includes('vite') ||
        msgStr.toLowerCase().includes('failed to connect') ||
        msgStr.toLowerCase().includes('unreached')
      ) {
        setIsDisconnected(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    // 2. محرك الفحص النشط الصامت (Heartbeat) للتحقق من الاتصال الفعلي بالخادم
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        
        const response = await fetch('/api/health', { 
          method: 'GET',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          setIsDisconnected(false);
        } else {
          setIsDisconnected(true);
        }
      } catch (err) {
        setIsDisconnected(true);
      }
    };

    // تشغيل الفحص دورياً للتأكد من حالة الاتصال الحقيقية بالخادم
    const interval = setInterval(checkConnection, 6000);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
      clearInterval(interval);
    };
  }, []);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    try {
      const response = await fetch('/api/health', { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
      if (response.ok) {
        setIsDisconnected(false);
        setIsRetrying(false);
      } else {
        setTimeout(() => {
          setIsRetrying(false);
          window.location.reload();
        }, 1200);
      }
    } catch {
      setTimeout(() => {
        setIsRetrying(false);
        window.location.reload();
      }, 1200);
    }
  };

  if (!isDisconnected) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-[99999] bg-white border-2 border-amber-500/80 text-right p-5 rounded-2xl shadow-[0_20px_50px_rgba(245,158,11,0.25)] flex flex-col gap-3.5 backdrop-blur-md animate-fade-in text-slate-800 font-sans"
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200 shrink-0">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H18" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            <span>تنبيه تزامن الاتصال الفوري بالمنصة</span>
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
          </h4>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-semibold">
            تم فقدان الاتصال اللحظي بمخدم التطوير مؤقتاً. جاري محاولة إعادة الاتصال للتزامن مع التعديلات البرمجية لضمان تماسك الجلسة.
          </p>
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-1 border-t border-slate-100 pt-3">
        <button 
          onClick={handleManualRetry}
          disabled={isRetrying}
          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-[11px] font-black px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1"
        >
          {isRetrying ? 'جاري الفحص المباشر...' : 'فحص الاتصال وتحديث'}
        </button>
        <button 
          onClick={() => setIsDisconnected(false)}
          className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-[11px] font-black px-3.5 py-2 rounded-xl transition-all border border-slate-205 cursor-pointer"
        >
          تجاهل التنبيه مؤقتاً
        </button>
      </div>
    </div>
  );
}

// كتم وقمع الأخطاء والتحذيرات المتعلقة بـ WebSockets والـ HMR لمنع تلويث الـ Console
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    const errorStr = String(args[0] || '');
    if (
      errorStr.toLowerCase().includes('websocket') || 
      errorStr.toLowerCase().includes('vite') ||
      errorStr.toLowerCase().includes('connection failed') ||
      errorStr.toLowerCase().includes('hmr')
    ) {
      return; 
    }
    originalError(...args);
  };

  console.warn = (...args) => {
    const warnStr = String(args[0] || '');
    if (
      warnStr.toLowerCase().includes('websocket') || 
      warnStr.toLowerCase().includes('vite') ||
      warnStr.toLowerCase().includes('hmr')
    ) {
      return;
    }
    originalWarn(...args);
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
