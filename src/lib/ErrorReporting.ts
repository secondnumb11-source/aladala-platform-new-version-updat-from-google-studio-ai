import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const ErrorReporting = {
  log: async (error: Error, contextInfo?: Record<string, any>) => {
    try {
      const errorPayload = {
        message: error.message,
        stack: error.stack,
        context: contextInfo || {},
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

      // 2. Transmit to Firebase for remote debugging
      try {
        const errorLogsRef = collection(db, "system_errors");
        await addDoc(errorLogsRef, {
          ...errorPayload,
          serverTime: serverTimestamp()
        });
      } catch (fbErr) {
        console.warn("[ErrorReporting] Failed to transmit to Firebase:", fbErr);
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
      let context: any = { reason };

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
