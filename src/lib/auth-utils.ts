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

export const verifyClientCredentials = async (username: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data: clientRecords, error } = await supabase
      .from('clients')
      .select('id, name, portal_username, portal_password, active_portal')
      .eq('portal_username', username.trim());

    if (error) {
      console.error("Client lookup db error:", error);
      return { success: false, error: "حدث خطأ في الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً." };
    }

    if (clientRecords && clientRecords.length > 0) {
      const matchedRecord = clientRecords.find((c: any) => c.portal_password === password);
      
      if (matchedRecord) {
        if (matchedRecord.active_portal === false) {
          return { success: false, error: "حساب البوابة الخاص بك غير مفعل، يرجى التواصل مع الإدارة." };
        }

        return { success: true, data: matchedRecord };
      }
    }
    
    return { success: false, error: "بيانات الدخول غير صحيحة. يرجى التأكد من اسم المستخدم وكلمة المرور." };
  } catch (err: any) {
    console.error("Client authentication error:", err);
    return { success: false, error: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً." };
  }
};

export const verifyEmployeeCredentials = async (username: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data: employeeRecords, error } = await supabase
      .from('employees')
      .select('id, uid, role, name, permittedModules, sidebarConfig, avatarUrl, created_at, password, employeeCode, jobTitle, assignedCases, assignedClients')
      .eq('username', username.trim());
      
    if (error) {
       console.error("Employee lookup db error:", error);
       return { success: false, error: "حدث خطأ في الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً." };
    }

    if (employeeRecords && employeeRecords.length > 0) {
      const matchedRecord = employeeRecords.find((emp: any) => emp.password === password);
      
      if (matchedRecord) {
        return { success: true, data: matchedRecord };
      }
    }
    
    return { success: false, error: "بيانات الدخول غير صحيحة. يرجى التأكد من اسم المستخدم وكلمة المرور." };
  } catch (err: any) {
    console.error("Employee authentication error:", err);
    return { success: false, error: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً." };
  }
};
