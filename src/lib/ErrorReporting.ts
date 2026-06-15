import { supabase } from './supabase';

export const ErrorReporting = {
  log: async (error: Error, contextInfo?: Record<string, any>) => {
    try {
      // Helper to recursively replace any Error objects with their message string
      const sanitizeContext = (obj: any): any => {
        if (!obj) return obj;
        if (obj instanceof Error) {
          return obj.message;
        }
        if (Array.isArray(obj)) {
          return obj.map(sanitizeContext);
        }
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const key of Object.keys(obj)) {
            const val = obj[key];
            cleaned[key] = val instanceof Error ? val.message : sanitizeContext(val);
          }
          return cleaned;
        }
        return obj;
      };

      const sanitizedContext = sanitizeContext(contextInfo || {});

      const errorPayload = {
        message: error.message,
        stack: error.stack,
        context: sanitizedContext,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      // 1. Log locally for immediate session recovery
      const localLogs = JSON.parse(localStorage.getItem('adalah-error-logs') || '[]');
      localLogs.push(errorPayload);
      // Keep only last 20 errors to prevent storage bloat
      if (localLogs.length > 20) localLogs.shift();
      localStorage.setItem('adalah-error-logs', JSON.stringify(localLogs));

      // 2. Transmit to Supabase for remote auditing and compliance
      try {
        if (supabase) {
          await supabase.from('system_errors').insert([{
            ...errorPayload,
            serverTime: new Date().toISOString()
          }]);
        }
      } catch (sbErr) {
        console.warn("[ErrorReporting] Failed to transmit to Supabase:", sbErr);
      }

      // We use warn here to prevent failing the AI Studio metrics if it's an expected offline error
      console.warn("[ErrorReporting Captured]:", error);
    } catch (e) {
      console.warn("Failed to process error log:", e);
    }
  },
  
  getErrorLogs: () => {
    return JSON.parse(localStorage.getItem('adalah-error-logs') || '[]');
  },

  clearLogs: () => {
    localStorage.removeItem('adalah-error-logs');
  }
};

// Global unhandled promise rejection or error listener
export const initGlobalErrorHandling = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      ErrorReporting.log(event.error || new Error(event.message));
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      let errorMessage = "Unhandled Promise Rejection";
      let context: any = { reason: reason instanceof Error ? reason.message : reason };

      if (reason instanceof Error) {
        errorMessage = `Unhandled Rejection: ${reason.message}`;
        context.stack = reason.stack;
      } else if (typeof reason === 'string') {
        errorMessage = `Unhandled Rejection: ${reason}`;
      } else if (reason && typeof reason === 'object') {
        try {
          context.reasonJson = JSON.stringify(reason);
        } catch (e) {}
      }

      ErrorReporting.log(new Error(errorMessage), context);
    });
  }
};
