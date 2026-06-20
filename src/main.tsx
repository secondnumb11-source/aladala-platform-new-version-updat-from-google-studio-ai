import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from '@vercel/speed-insights/react';
import App from '@/App';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/index.css';

// كتم وقمع أخطاء الـ WebSocket و Unhandled rejections المزعجة المنبعثة من بيئة التطوير أو الـ iframe
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
      String(event.reason.message || '').includes('WebSocket') || 
      String(event.reason.message || '').includes('vite') ||
      String(event.reason || '').includes('WebSocket') ||
      String(event.reason.stack || '').includes('WebSocket')
    )) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (
      String(event.message || '').includes('WebSocket') || 
      String(event.message || '').includes('vite')
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  </StrictMode>,
);

// تطبيق إصلاح التباين تلقائياً
const fixAllContrast = () => {
  const elements = document.querySelectorAll(
    '[class*="bg-"]:not([class*="hover\\:bg-"])'
  );

  elements.forEach(el => {
    const htmlEl = el as HTMLElement;
    const classes = htmlEl.className || '';
    const computed = window.getComputedStyle(htmlEl);
    const bgColor = computed.backgroundColor;

    if (!bgColor || bgColor === 'transparent' ||
        bgColor === 'rgba(0, 0, 0, 0)') return;

    const rgb = bgColor.match(/\d+/g);
    if (!rgb || rgb.length < 3) return;

    const [r, g, b] = rgb.map(Number);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // الحصول على جميع النصوص المباشرة
    const textChildren = Array.from(
      htmlEl.querySelectorAll(
        'p, span, h1, h2, h3, h4, h5, label, td, th, li'
      )
    );

    textChildren.forEach(child => {
      const childEl = child as HTMLElement;
      const childClasses = childEl.className || '';

      // تجاهل العناصر التي لها لون محدد
      if (childClasses.includes('text-')) return;

      const childBg = window.getComputedStyle(childEl).backgroundColor;
      if (childBg && childBg !== 'transparent' &&
          childBg !== 'rgba(0, 0, 0, 0)') return;

      if (luminance < 0.4) {
        childEl.style.color = '#e2e8f0';
      } else if (luminance > 0.75) {
        childEl.style.color = '#1e293b';
      }
    });
  });
};

// تشغيل عند كل تحديث
const observer = new MutationObserver(() => {
  setTimeout(fixAllContrast, 100);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

setTimeout(fixAllContrast, 500);
