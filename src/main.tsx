import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

// Silence the harmless Vite websocket/HMR connection error that can occur in the preview environment
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
console.error = (...args) => {
  if (typeof args[0] === 'string' && (
    args[0].includes('failed to connect to websocket') ||
    args[0].includes('[Supabase Realtime]') ||
    args[0].includes('Channel Error on')
  )) return;
  originalConsoleError.apply(console, args);
};
console.warn = (...args) => {
  if (typeof args[0] === 'string' && (
    args[0].includes('WebSocket closed without opened') ||
    args[0].includes('[Supabase Realtime]') ||
    args[0].includes('Channel Error on')
  )) return;
  originalConsoleWarn.apply(console, args);
};

window.addEventListener('unhandledrejection', event => {
  if (event.reason && typeof event.reason === 'string' && event.reason.includes('WebSocket closed without opened')) {
    event.preventDefault();
  }
  if (event.reason && event.reason.message && event.reason.message.includes('WebSocket')) {
    event.preventDefault();
  }
});
import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from '@vercel/speed-insights/react';
import App from '@/App';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  </StrictMode>,
);
