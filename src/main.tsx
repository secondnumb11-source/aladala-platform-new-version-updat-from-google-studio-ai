import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from '@vercel/speed-insights/react';
import App from '@/App';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/index.css';

import { useState, useEffect } from 'react';

// مكون شريط متصل ذكي لعرض حالة الاتصال مع الخادم وحالة WebSocket
function ConnectionStatusBar() {
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date>(new Date());

  useEffect(() => {
    // 1. مراقبة أخطاء المتصفح والاتصال
    const handleError = (event: any) => {
      const msgStr = String(event.message || event.reason?.message || event.reason || '');
      if (
        msgStr.toLowerCase().includes('websocket') || 
        msgStr.toLowerCase().includes('vite') ||
        msgStr.toLowerCase().includes('failed to connect') ||
        msgStr.toLowerCase().includes('unreached') ||
        msgStr.toLowerCase().includes('networkerror')
      ) {
        setIsDisconnected(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    window.addEventListener('offline', () => setIsDisconnected(true));
    window.addEventListener('online', () => {
      setIsDisconnected(false);
      setLastOnline(new Date());
    });

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
          if (isDisconnected) setLastOnline(new Date());
          setIsDisconnected(false);
        } else {
          setIsDisconnected(true);
        }
      } catch (err) {
        setIsDisconnected(true);
      }
    };

    // تشغيل الفحص دورياً للتأكد من حالة الاتصال الحقيقية بالخادم
    const interval = setInterval(checkConnection, 5000);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
      window.removeEventListener('offline', () => setIsDisconnected(true));
      window.removeEventListener('online', () => setIsDisconnected(false));
      clearInterval(interval);
    };
  }, [isDisconnected]);

  const handleReconnect = async () => {
    setIsRetrying(true);
    try {
      const response = await fetch('/api/health', { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
      if (response.ok) {
        setIsDisconnected(false);
        setLastOnline(new Date());
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
      className="fixed bottom-0 left-0 right-0 z-[99999] bg-rose-600 shadow-[0_-5px_25px_rgba(225,29,72,0.3)] animate-slide-up text-white font-sans overflow-hidden"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-white/20 rounded-full shrink-0 flex items-center justify-center relative">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
          </div>
          <div className="flex-1 text-right">
            <h4 className="text-[13px] md:text-sm font-black flex flex-wrap items-center gap-2">
              <span>تم فقدان الاتصال بالخادم (Offline)</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">
                تمت المحاولة الأخيرة: {new Date().toLocaleTimeString('ar-SA')}
              </span>
            </h4>
            <p className="text-[11px] md:text-xs text-rose-100 mt-0.5 font-bold leading-tight">
              لا يمكن حفظ أحدث التعديلات أو جلب بيانات جديدة. تحقق من اتصال الإنترنت أو حالة الشبكة.
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-1 sm:mt-0 justify-end">
          <button 
            onClick={handleReconnect}
            disabled={isRetrying}
            className="bg-white hover:bg-rose-50 text-rose-700 active:scale-95 text-xs font-black px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            {isRetrying ? (
              <>
                <svg className="w-4 h-4 animate-spin text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H18" />
                </svg>
                <span>جاري محاولة الاتصال...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H18" />
                </svg>
                <span>إعادة الاتصال الآن</span>
              </>
            )}
          </button>
        </div>
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
      <ConnectionStatusBar />
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
