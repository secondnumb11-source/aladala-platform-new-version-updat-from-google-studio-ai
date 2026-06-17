import { supabase } from './supabase';

let globalAppContext: Record<string, any> = {};

export const ErrorReporting = {
  setGlobalContext: (context: Record<string, any>) => {
    globalAppContext = { ...globalAppContext, ...context };
  },

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

      const sanitizedContext = sanitizeContext({ ...globalAppContext, ...(contextInfo || {}) });

      const errorPayload = {
        message: error.message,
        stack: error.stack,
        context: sanitizedContext,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('adalah_error_logged', { detail: errorPayload }));
      }

      // Transmit to Supabase for remote auditing and compliance
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
  
  getErrorLogs: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('system_errors')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);
    if (error) {
      console.error("[ErrorReporting] Failed to fetch logs:", error);
      return [];
    }
    return data || [];
  },

  clearLogs: async () => {
    if (!supabase) return;
    await supabase.from('system_errors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
};

// Global unhandled promise rejection or error listener
export const initGlobalErrorHandling = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      const msg = (event.message || "").toLowerCase();
      if (
        msg.includes('websocket') || 
        msg.includes('piesocket') || 
        msg.includes('wss://') || 
        msg.includes('ws://') || 
        msg.includes('socket') || 
        msg.includes('failed to connect') ||
        msg.includes('networkerror') ||
        msg.includes('connection')
      ) {
        return; // Ignore benign websocket closed/reconnecting alerts
      }
      ErrorReporting.log(event.error || new Error(event.message));
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      let errorMessage = "Unhandled Promise Rejection";
      let context: any = { reason: reason instanceof Error ? reason.message : reason };

      const rStr = String(reason || "").toLowerCase();
      if (
        rStr.includes('websocket') || 
        rStr.includes('piesocket') || 
        rStr.includes('wss://') || 
        rStr.includes('ws://') || 
        rStr.includes('socket') || 
        rStr.includes('failed to connect') ||
        rStr.includes('connection')
      ) {
        return; // Ignore benign web service client errors representing connection timeouts in development / sandboxes
      }

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
