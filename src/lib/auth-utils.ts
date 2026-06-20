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
    return {
      success: false,
      error: 'يرجى إدخال اسم المستخدم وكلمة المرور'
    };
  }

  console.log('[Client Auth] محاولة:', trimmedUser);

  // ===== المحاولة 1: عبر الخادم =====
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(), 8000
    );

    const response = await fetch('/api/client-portal/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: trimmedUser,
        password: trimmedPass
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('[Client Auth] ✅ نجح عبر الخادم');
        return {
          success: true,
          data: {
            id: result.client.id,
            name: result.client.name,
            email: result.client.email || '',
            phone: result.client.phone || '',
            permittedCases:
              result.client.permittedCases || [],
            portalUsername: trimmedUser,
            activePortal: true
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
  } catch (serverErr: any) {
    console.warn('[Client Auth] الخادم غير متاح');
  }

  // ===== المحاولة 2: Supabase مباشرة =====
  try {
    console.log('[Client Auth] محاولة Supabase...');

    const { data: allClients, error } = await supabase
      .from('clients')
      .select('*')
      .or(
        'status.eq.active,' +
        'status.eq.نشط,' +
        'status.eq.فعال,' +
        'active_portal.eq.true'
      );

    if (error) {
      console.error('[Client Auth] Supabase:', error.message);
      throw new Error('خطأ في قاعدة البيانات: ' + error.message);
    }

    const clients = allClients || [];
    console.log('[Client Auth] عدد العملاء:', clients.length);

    if (clients.length === 0) {
      // المحاولة 3: localStorage backup
      const backup = localStorage.getItem('clients_backup');
      if (backup) {
        const localClients = JSON.parse(backup);
        const localMatch = localClients.find((c: any) => {
          const user = (
            c.portalUsername ||
            c.portal_username || ''
          ).trim().toLowerCase();
          const natId = (
            c.nationalId ||
            c.national_id || ''
          ).trim();
          const email = (c.email || '').trim().toLowerCase();
          const phone = (c.phone || '').trim();
          const pass = (
            c.portalPassword ||
            c.portal_password || ''
          ).trim();

          const userMatch =
            user === trimmedUser.toLowerCase() ||
            natId === trimmedUser ||
            email === trimmedUser.toLowerCase() ||
            phone === trimmedUser;

          return userMatch && pass === trimmedPass;
        });

        if (localMatch) {
          return {
            success: true,
            data: {
              id: localMatch.id,
              name: localMatch.name,
              email: localMatch.email || '',
              phone: localMatch.phone || '',
              permittedCases:
                localMatch.permittedCases ||
                localMatch.permitted_cases || [],
              portalUsername:
                localMatch.portalUsername ||
                localMatch.portal_username,
              activePortal: true
            }
          };
        }
      }

      return {
        success: false,
        error: 'لا يوجد عملاء مسجلون في النظام'
      };
    }

    // البحث عن العميل
    const matched = clients.find(c => {
      const dbUser = (
        c.portal_username ||
        c.portalUsername || ''
      ).trim().toLowerCase();
      const dbNatId = (
        c.national_id ||
        c.nationalId ||
        c.id_number || ''
      ).trim();
      const dbEmail = (c.email || '').trim().toLowerCase();
      const dbPhone = (c.phone || '').trim();
      const dbPass = (
        c.portal_password ||
        c.portalPassword || ''
      ).trim();

      const isActiveStatus = [
        'active','نشط','نشيط','فعال','مفعّل','مفعل'
      ].includes(c.status || '');

      const userMatch =
        dbUser === trimmedUser.toLowerCase() ||
        dbNatId === trimmedUser ||
        dbEmail === trimmedUser.toLowerCase() ||
        dbPhone === trimmedUser;

      const passMatch = dbPass === trimmedPass;

      const portalActive =
        c.active_portal === true ||
        c.active_portal === 'true';

      if (userMatch) {
        console.log('[Client Auth] مطابقة:', c.name, {
          passMatch, portalActive, isActiveStatus
        });
      }

      return userMatch && passMatch &&
        (portalActive || isActiveStatus);
    });

    if (!matched) {
      console.warn('[Client Auth] لا مطابقة');
      return {
        success: false,
        error:
          'اسم المستخدم أو كلمة المرور غير صحيحة. ' +
          'تأكد من البيانات أو تواصل مع المكتب'
      };
    }

    console.log('[Client Auth] ✅ نجح:', matched.name);

    return {
      success: true,
      data: {
        id: matched.id,
        name: matched.name,
        email: matched.email || '',
        phone: matched.phone || '',
        nationalId:
          matched.national_id ||
          matched.id_number || '',
        permittedCases:
          matched.permitted_cases ||
          matched.permittedCases || [],
        portalUsername:
          matched.portal_username || trimmedUser,
        activePortal: true
      }
    };

  } catch (err: any) {
    console.error('[Client Auth Exception]', err);
    return {
      success: false,
      error: 'حدث خطأ: ' + err.message
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
    // اختبر الاتصال أولاً
    const { data: testData, error: testError } = await supabase
      .from('employees')
      .select('id')
      .limit(1);

    console.log('[Auth Test]', { testData, testError });

    // إذا فشل الاتصال
    if (testError) {
      console.error('[Auth] Supabase connection failed:', testError);
      
      // fallback لـ localStorage
      const backup = localStorage.getItem('employees_backup');
      if (backup) {
        try {
          const authBackup = JSON.parse(backup);
          const localMatch = authBackup.find((emp: any) => {
            const empUser = (emp.username || '').trim().toLowerCase();
            const empPass = (emp.password || '').trim();
            const empEmail = (emp.email || '').trim().toLowerCase();
            const empCode = (emp.employeeCode || emp.employee_code || '').trim();
            
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
                jobTitle: localMatch.jobTitle || localMatch.job_title || '',
                employeeCode: localMatch.employeeCode || localMatch.employee_code || '',
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
      }
    }

    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .or(
        'status.eq.active,' +
        'status.eq.نشط,' +
        'status.eq.نشيط,' +
        'status.eq.فعال,' +
        'status.eq.مفعل'
      );
    
    if (error) {
      console.error('[Employee Supabase Error]', error);
      
      // محاولة البحث في النسخ الاحتياطي المحلي حتى عند فشل جلب القائمة الكاملة
      try {
        const backup = JSON.parse(localStorage.getItem('employees_backup') || '[]');
        const localMatch = backup.find((emp: any) => {
          const empUser = (emp.username || '').trim().toLowerCase();
          const empPass = (emp.password || '').trim();
          const userMatch = 
            empUser === trimmedUser.toLowerCase() ||
            (emp.email || '').toLowerCase() === trimmedUser.toLowerCase() ||
            (emp.employeeCode || '').trim() === trimmedUser;
          
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
              permissions: localMatch.permissions || ['dashboard','cases','tasks','documents','ai'],
              sidebarConfig: localMatch.permissions || ['dashboard','cases','tasks','documents','ai']
            }
          };
        }
      } catch (e) {}

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

    const isActive = (status: string) => {
      const activeValues = [
        'active','نشط','نشيط','فعال','مفعّل','مفعل'
      ];
      return activeValues.includes(status?.trim() || '');
    };

    if (matched && !isActive(matched.status)) {
      return {
        success: false,
        error: 'هذا الحساب معطّل. تواصل مع المسؤول'
      };
    }
    
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
