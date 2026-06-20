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

export const verifyClientCredentials = async (
  username: string,
  password: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  
  const trimmedUser = username.trim();
  const trimmedPass = password.trim();
  
  if (!trimmedUser || !trimmedPass) {
    return { success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
  }
  
  try {
    // المحاولة الأولى: عبر الخادم
    const response = await fetch('/api/client-portal/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: trimmedUser, password: trimmedPass }),
      signal: AbortSignal.timeout(8000)
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return {
          success: true,
          data: {
            id: result.client.id,
            name: result.client.name,
            email: result.client.email,
            phone: result.client.phone,
            permittedCases: result.client.permittedCases || []
          }
        };
      }
      if (response.status === 401) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
      }
    }
  } catch (serverErr) {
    console.warn('[Client Auth] Server unavailable, trying Supabase directly...');
  }
  
  // المحاولة الثانية: مباشرة من Supabase
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('active_portal', true);
    
    if (error) {
      console.error('[Supabase Auth Error]', error);
      return { success: false, error: 'تعذر الاتصال بقاعدة البيانات' };
    }
    
    if (!clients || clients.length === 0) {
      return { success: false, error: 'لا يوجد عملاء مسجلون في النظام' };
    }
    
    // البحث عن العميل بكل الحقول الممكنة
    const matched = clients.find(c => {
      const dbUser = (
        c.portal_username || 
        c.portalUsername || 
        ''
      ).trim().toLowerCase();
      
      const dbPass = (
        c.portal_password || 
        c.portalPassword || 
        ''
      ).trim();
      
      const dbNationalId = (c.national_id || c.nationalId || '').trim();
      const dbEmail = (c.email || '').trim().toLowerCase();
      const dbPhone = (c.phone || '').trim();
      
      const usernameMatch = 
        dbUser === trimmedUser.toLowerCase() ||
        dbNationalId === trimmedUser ||
        dbEmail === trimmedUser.toLowerCase() ||
        dbPhone === trimmedUser;
      
      const passwordMatch = dbPass === trimmedPass;
      
      return usernameMatch && passwordMatch;
    });
    
    if (!matched) {
      return { 
        success: false, 
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات' 
      };
    }
    
    if (matched.active_portal === false) {
      return { 
        success: false, 
        error: 'حساب البوابة غير مفعّل. تواصل مع المكتب' 
      };
    }
    
    return {
      success: true,
      data: {
        id: matched.id,
        name: matched.name,
        email: matched.email || '',
        phone: matched.phone || '',
        portalUsername: matched.portal_username || matched.portalUsername,
        activePortal: true,
        permittedCases: matched.permitted_cases || matched.permittedCases || []
      }
    };
    
  } catch (err: any) {
    console.error('[Auth Exception]', err);
    return { 
      success: false, 
      error: 'حدث خطأ في الاتصال. تأكد من اتصالك بالإنترنت وحاول مجدداً' 
    };
  }
};

export const verifyEmployeeCredentials = async (
  username: string,
  password: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  
  const trimmedUser = username.trim();
  const trimmedPass = password.trim();
  
  if (!trimmedUser || !trimmedPass) {
    return { 
      success: false, 
      error: 'يرجى إدخال اسم المستخدم وكلمة المرور' 
    };
  }
  
  // المحاولة الأولى: عبر الخادم
  try {
    const response = await fetch('/api/employee-portal/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: trimmedUser, 
        password: trimmedPass 
      }),
      signal: AbortSignal.timeout(8000)
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return {
          success: true,
          data: {
            id: result.employee.id,
            name: result.employee.name,
            role: result.employee.role || 'employee',
            jobTitle: result.employee.jobTitle || result.employee.job_title,
            employeeCode: result.employee.employeeCode,
            permissions: result.employee.permissions || [],
            sidebarConfig: result.employee.permissions || [
              'dashboard','cases','tasks','documents','ai'
            ]
          }
        };
      }
      if (response.status === 401) {
        return { 
          success: false, 
          error: 'اسم المستخدم أو كلمة المرور غير صحيحة' 
        };
      }
    }
  } catch (serverErr) {
    console.warn('[Employee Auth] Server unavailable, trying Supabase...');
  }
  
  // المحاولة الثانية: مباشرة من Supabase
  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'active');
    
    if (error) {
      console.error('[Employee Supabase Error]', error);
      return { 
        success: false, 
        error: 'تعذر الاتصال بقاعدة البيانات' 
      };
    }
    
    if (!employees || employees.length === 0) {
      return { 
        success: false, 
        error: 'لا يوجد موظفون مسجلون في النظام' 
      };
    }
    
    const matched = employees.find(emp => {
      const dbUser = (
        emp.username || ''
      ).trim().toLowerCase();
      
      const dbEmail = (emp.email || '').trim().toLowerCase();
      const dbCode = (emp.employee_code || emp.employeeCode || '').trim();
      const dbPhone = (emp.phone || '').trim();
      const dbNationalId = (emp.national_id || emp.nationalId || '').trim();
      const dbPass = (emp.password || '').trim();
      
      const usernameMatch = 
        dbUser === trimmedUser.toLowerCase() ||
        dbEmail === trimmedUser.toLowerCase() ||
        dbCode === trimmedUser ||
        dbPhone === trimmedUser ||
        dbNationalId === trimmedUser;
      
      const passwordMatch = dbPass === trimmedPass;
      
      return usernameMatch && passwordMatch;
    });
    
    if (!matched) {
      // محاولة ثالثة: من localStorage backup
      try {
        const backup = JSON.parse(
          localStorage.getItem('employees_backup') || '[]'
        );
        const localMatch = backup.find((emp: any) => {
          const empUser = (emp.username || '').trim().toLowerCase();
          const empPass = (emp.password || '').trim();
          const empEmail = (emp.email || '').trim().toLowerCase();
          const empCode = (emp.employeeCode || '').trim();
          
          const userMatch = 
            empUser === trimmedUser.toLowerCase() ||
            empEmail === trimmedUser.toLowerCase() ||
            empCode === trimmedUser;
          
          return userMatch && empPass === trimmedPass;
        });
        
        if (localMatch) {
          return {
            success: true,
            data: {
              id: localMatch.id,
              name: localMatch.name,
              role: localMatch.role || 'employee',
              jobTitle: localMatch.jobTitle || '',
              employeeCode: localMatch.employeeCode || '',
              permissions: localMatch.permissions || [
                'dashboard','cases','tasks','documents','ai'
              ],
              sidebarConfig: localMatch.permissions || [
                'dashboard','cases','tasks','documents','ai'
              ]
            }
          };
        }
      } catch (e) {}
      
      return { 
        success: false, 
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة' 
      };
    }
    
    return {
      success: true,
      data: {
        id: matched.id,
        name: matched.name,
        role: matched.role || 'employee',
        jobTitle: matched.job_title || matched.jobTitle || '',
        employeeCode: matched.employee_code || matched.employeeCode || '',
        permissions: matched.permissions || [
          'dashboard','cases','tasks','documents','ai'
        ],
        sidebarConfig: matched.sidebar_config || matched.permissions || [
          'dashboard','cases','tasks','documents','ai'
        ]
      }
    };
    
  } catch (err: any) {
    console.error('[Employee Auth Exception]', err);
    return { 
      success: false, 
      error: 'حدث خطأ في الاتصال. تأكد من اتصالك بالإنترنت' 
    };
  }
};
