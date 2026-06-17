import { supabase } from "./supabase";

export const logOAuthEvent = (step: string, status: "info" | "warning" | "error" | "success", details: any = {}) => {
  const logPrefix = "[OAuth Tracer]";
  const message = `${logPrefix} [${status.toUpperCase()}] ${step}`;
  
  if (status === "error") {
    console.error(message, details);
  } else if (status === "warning") {
    console.warn(message, details);
  } else {
    console.log(message, details);
  }
};

export const cleanCorruptedAuth = async (force: boolean = false) => {
    try {
      // Check if there is an error in URL (Google OAuth failure redirect)
      const hashString = window.location.hash || "";
      const searchString = window.location.search || "";
      const hasUrlError = hashString.includes("error=") || hashString.includes("error_description=") || searchString.includes("error=");
      
      if (force || hasUrlError) {
          logOAuthEvent("Cleaning Session corruptions", "info", { force, hasUrlError, hashString });
          
          await supabase.auth.signOut().catch(() => {});
          
          // Force remove all auth keys related to supabase tracking
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('sb-') || key.includes('supabase.auth'))) {
                  keysToRemove.push(key);
              }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
          
          // Clear hash/search error params to avoid redirect loops
          if (hasUrlError) {
             window.history.replaceState(null, document.title, window.location.pathname);
          }
          logOAuthEvent("Session Cleaned", "success");
      }
    } catch (e) {
      logOAuthEvent("Cleanup Failure", "error", e);
    }
};
