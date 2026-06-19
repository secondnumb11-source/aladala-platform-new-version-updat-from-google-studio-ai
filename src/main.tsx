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
