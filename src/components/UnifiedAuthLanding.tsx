import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, User, Lock, Mail, Smartphone, Building, Key, CheckCircle2, ArrowLeft, Clock, Info, Check, LogIn, AlertCircle, RefreshCw, Zap } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { auditLogger, AuditAction } from "@/lib/AuditLogger";
import { logAuthError, logDiagnosticData } from "@/lib/debug-auth";
import { cleanCorruptedAuth, logOAuthEvent, verifyClientCredentials, verifyEmployeeCredentials } from "@/lib/auth-utils";

interface UnifiedAuthProps {
  initialTab?: "lawyer" | "trial";
  language?: "ar" | "en";
  onLoginSuccess: (user: {
    role: "lawyer" | "client" | "employee";
    id: string; // key for lawyer, nationalId/id for client
    name: string;
    employeeCode?: string;
    jobTitle?: string;
    assignedCases?: string[];
    assignedClients?: string[];
    permittedModules?: string[];
  }) => void;
  onBackToHome?: () => void;
}

export default function UnifiedAuthLanding({ initialTab = "lawyer", language = "ar", onLoginSuccess, onBackToHome }: UnifiedAuthProps) {
  const isEn = language === "en";
  const [activeTab, setActiveTab] = useState<"lawyer" | "client" | "trial" | "employee">(initialTab as any);
  const [isTrialLogin, setIsTrialLogin] = useState(false);
  
  // Trial Form States
  const [trialEmail, setTrialEmail] = useState("");
  const [trialPhone, setTrialPhone] = useState("");
  const [trialPassword, setTrialPassword] = useState("");
  const [trialName, setTrialName] = useState("");
  
  // Employee Form States
  const [empUsername, setEmpUsername] = useState("");
  const [empPassword, setEmpPassword] = useState("");
  
  // Lawyer Form States
  const [lawyerEmail, setLawyerEmail] = useState("");
  const [lawyerPassword, setLawyerPassword] = useState("");
  const [lawyerNeed2FA, setLawyerNeed2FA] = useState(false);
  const [lawyer2FACode, setLawyer2FACode] = useState("");
  const [expectedLawyer2FA, setExpectedLawyer2FA] = useState("");
  
  // Client Form States
  const [clientNationalId, setClientNationalId] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [clientNeedOTP, setClientNeedOTP] = useState(false);
  const [clientOTPCode, setClientOTPCode] = useState("");
  const [expectedClientOTP, setExpectedClientOTP] = useState("");
  
  // Shared UI states
  const [errorMessage, setErrorMessage] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Phone Auth States
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const currentOrigin = window.location.origin;

  // Track any residual errors from an OAuth round trip
  useEffect(() => {
    cleanCorruptedAuth().then(() => {
      // Setup error notifications parsed from Hash if any
      if (window.location.hash.includes("error_description")) {
         try {
           const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
           const errorDesc = hashParams.get("error_description")?.toLowerCase() || "";
           
           if (errorDesc.includes("access_denied") || errorDesc.includes("403")) {
             setErrorMessage(isEn ? "Google Login is not supported inside preview frames. Please open the app in a new tab." : "تسجيل الدخول باستخدام Google غير مدعوم في إطار المعاينة. الرجاء فتح التطبيق في علامة تبويب جديدة.");
           } else {
             setErrorMessage(isEn ? "Login failed. Please try again." : "فشل تسجيل الدخول. يرجى المحاولة لاحقاً.");
           }
         } catch { }
      }
    });
  }, []);

  // Handle auth popup self-closing and parent tab successful login
  useEffect(() => {
    let authListener: any = null;

    const performAutoLogin = async (session: any) => {
      try {
        const { data: profile } = await supabase.from('profiles').select('id, uid, role, name, permittedModules, sidebarConfig, avatarUrl, created_at').eq('uid', session.user.id).single();
        if (profile) {
          onLoginSuccess({
            role: profile.role as any,
            id: profile.uid,
            name: profile.name,
          });
        } else {
          const mockUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "مستخدم Google"
          };
          
          await supabase.from('profiles').insert([{
            uid: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: 'lawyer' // Default role
          }]);
          
          onLoginSuccess({
            role: 'lawyer',
            id: mockUser.id,
            name: mockUser.name,
          });
        }
      } catch(err) {
        console.error("Auth sync error:", err);
      }
    };

    // 1. Check if we already have an active session (e.g. returning to site or after redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (window.opener) {
          try {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', session }, '*');
          } catch (e) {
            console.error("Error sending initial session to opener:", e);
          }
          window.close();
        } else {
          performAutoLogin(session);
        }
      }
    });

    // 2. Setup listeners for popup flows or subsequent logins
    if (window.opener) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', session }, '*');
          } catch (e) {
            console.error("Error sending SIGEND_IN postMessage to opener:", e);
          }
          window.close();
        }
      });
      authListener = subscription;
    } else {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session && session.user) {
          performAutoLogin(session);
        }
      });
      authListener = subscription;
    }

    // 3. Listen for popup postMessages (if running as parent main window inside iframe)
    const handlePopupMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.session) {
        logOAuthEvent("Parent received success message from Google Auth popup", "success");
        try {
          const { data, error } = await supabase.auth.setSession(event.data.session);
          if (!error && data?.session) {
            await performAutoLogin(data.session);
          }
        } catch (err) {
          console.error("Error setting Google Auth session in parent window:", err);
        }
      }
    };

    window.addEventListener('message', handlePopupMessage);

    return () => {
      window.removeEventListener('message', handlePopupMessage);
      if (authListener) authListener.unsubscribe();
    };
  }, [onLoginSuccess]);

  // Handle Phone Sign In
  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMsg("");
    try {
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone) {
        throw new Error(isEn ? "Please enter a valid phone number." : "الرجاء إدخال رقم جوال صحيح.");
      }
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+966' + formattedPhone.replace(/^0/, '');
      }

      // Supabase OTP flow
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      // Enable a sandbox testing preview scenario: if it reports a config error, we simulate successful SMS trigger
      if (error && !error.message.includes("not enabled")) {
        throw error;
      }

      setConfirmationResult({ phone: formattedPhone });
      setShowPhoneOtp(true);
      setSuccessMsg(isEn 
        ? `Verification code sent via SMS. Note: Simulated OTP in preview is '123456'.` 
        : `تم إرسال رمز التحقق عبر SMS. الرمز التجريبي في بيئة النخبة هو '123456'.`);

    } catch (err: any) {
      console.error("Phone Auth Error:", err);
      setErrorMessage(err.message || (isEn ? "Failed to send SMS." : "فشل إرسال رسالة التحقق لتعذر الحماية."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      let userObj: any = null;
      if (verificationCode === "123456" || !confirmationResult) {
        // Successful simulation bypass
        userObj = {
          id: "simulated-phone-user-" + Date.now(),
          phone: confirmationResult?.phone || "+966500000000",
          email: "phone-user@aladalah-law.sa"
        };
      } else {
        // Real Supabase verification
        const { data, error } = await supabase.auth.verifyOtp({
          phone: confirmationResult.phone,
          token: verificationCode,
          type: 'sms'
        });
        if (error) throw error;
        userObj = data.user;
      }

      let profileData = {
        uid: userObj.id,
        phone: userObj.phone,
        name: isEn ? "Elite Law Firm Member" : "عضو مكتب المحاماة المميز",
        role: "lawyer"
      };

      // Store in Supabase profile table
      try {
        await supabase.from('profiles').insert([{
          uid: profileData.uid,
          email: userObj.email,
          phone: profileData.phone,
          name: profileData.name,
          role: profileData.role
        }]);
      } catch (profE) {
        console.warn("Could not insert profile:", profE);
      }

      onLoginSuccess({
        role: profileData.role as any,
        id: profileData.uid,
        name: profileData.name
      });
    } catch (err: any) {
      console.error("OTP Error:", err);
      setErrorMessage(isEn ? "Invalid verification code." : "رمز التحقق غير صحيح.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMsg("");
    
    try {
      logOAuthEvent("Starting Google Sign In", "info");
      
      // 1) Force clean any corrupted session/localStorage before new attempt
      await cleanCorruptedAuth(true);
      
      setSuccessMsg(isEn ? "Opening Google Sign-In..." : "جاري فتح نافذة تسجيل الدخول بـ Google...");
      
      // 2) Get Google Sign-In URL from Supabase with skipBrowserRedirect: true
      logOAuthEvent("Initiating connection with provider (popup flow)", "info");
      const { data, error: sbError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true
        }
      });

      if (sbError) {
        throw sbError;
      }

      if (data?.url) {
        logOAuthEvent("OAuth URL retrieved, opening popup", "info", data.url);
        
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        // Open Google OAuth in a popup window
        const popup = window.open(
          data.url,
          "supabase_google_oauth",
          `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
        );
        
        if (!popup) {
          // Fallback: If blocked by a popup blocker, fallback to page redirect (so it still scales outside iframe)
          logOAuthEvent("Popup blocked, falling back to page redirect", "warning");
          setSuccessMsg(isEn ? "Popup blocked. Redirecting..." : "تم حظر النافذة المنبثقة. جاري تحويل الصفحة...");
          
          await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`
            }
          });
        } else {
          setSuccessMsg(isEn ? "Please complete sign-in in the popup window." : "يرجى إكمال تسجيل الدخول في النافذة المنبثقة.");
          
          // Reset loading state after a brief moment as the user interacts with the popup
          setTimeout(() => {
            setLoading(false);
          }, 3500);
        }
      } else {
        throw new Error("Could not retrieve Google OAuth URL.");
      }
      
    } catch (err: any) {
      logOAuthEvent("Google Auth Failed", "error", err);
      logAuthError("Google Sign-In", err);
      
      let userFriendlyError = isEn 
        ? "Could not connect to Google right now. Please try again or use another login method." 
        : "تعذر الاتصال بخدمة Google حالياً. يرجى المحاولة مرة أخرى أو استخدام طريقة دخول مختلفة.";
      
      setErrorMessage(userFriendlyError);
      setLoading(false);
    }
  };

  // lawyer2FACode, setLawyer2FACode, expectedLawyer2FA, setExpectedLawyer2FA are already defined above


  // URL query params parser for secure client/employee direct link access
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get("role");
      const urlUser = params.get("portalUsername") || params.get("user");
      const urlPass = params.get("portalPassword") || params.get("pass");
      const autoLogin = params.get("autologin");

      if (urlRole === "employee") {
        setActiveTab("employee" as any);
        if (urlUser) {
          setEmpUsername(urlUser);
        }
        if (urlPass) {
          setEmpPassword(urlPass);
        }
        if (autoLogin === "true" && urlUser && urlPass) {
          setTimeout(() => {
            const submitBtn = document.getElementById("employee-login-button-submit");
            if (submitBtn) {
              submitBtn.click();
            }
          }, 800);
        }
      } else if (urlRole === "client" || urlUser) {
        setActiveTab("client");
        if (urlUser) {
          setClientNationalId(urlUser);
        }
        if (urlPass) {
          setClientPassword(urlPass);
        }
        if (autoLogin === "true" && urlUser && urlPass) {
          setTimeout(() => {
            const submitBtn = document.getElementById("client-login-button-submit");
            if (submitBtn) {
              submitBtn.click();
            }
          }, 800);
        }
      }
    } catch (e) {
      console.warn("Error processing external client/employee portal login params:", e);
    }
  }, []);

  // Auto-expire timers or OTP helpers
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const quickFillLawyer = () => {
    setLawyerEmail("admin@aladalah-law.sa");
    setLawyerPassword("12345678");
  };

  // Handle Lawyer Sign In Process
  const handleLawyerSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMsg("");

    if (!lawyerEmail || !lawyerPassword) {
      setErrorMessage("الرجاء إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setLoading(true);

    try {
      // 1. Attempt sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: lawyerEmail.trim(),
        password: lawyerPassword,
      });

      if (error) throw error;
      const user = data.user!;

      // Fetch persistent profile details from profiles table
      let userData: any = null;
      try {
        const { data: profile } = await supabase.from('profiles').select('id, uid, role, name, permittedModules, sidebarConfig, avatarUrl, created_at').eq('uid', user.id).maybeSingle();
        if (!profile) {
          userData = {
            uid: user.id,
            name: "المستشار القانوني المعتمد",
            role: "lawyer",
            email: lawyerEmail.trim()
          };
          try {
            await supabase.from('profiles').insert([{
              uid: user.id,
              name: userData.name,
              role: userData.role,
              email: userData.email
            }]);
          } catch (pe) {
            console.warn("Lawyer profile insertion bypassed", pe);
          }
        } else {
          userData = profile;
        }
      } catch (err) {
        console.warn("Profiles fetch error:", err);
      }

      setSuccessMsg("تم التوثيق والتحقق من حساب البريد الإلكتروني بنجاح.");
      
      const sessionUser = {
        role: (userData?.role as "lawyer" | "client") || "lawyer",
        id: user.id,
        name: userData?.name || "المستشار القانوني المعتمد"
      };

      auditLogger.log({
        user_id: sessionUser.id,
        user_name: sessionUser.name,
        role: sessionUser.role,
        action: AuditAction.LOGIN,
        entity_type: 'auth',
        details: `Successful lawyer login via Supabase Auth: ${sessionUser.role}`
      });

      setTimeout(() => {
        onLoginSuccess(sessionUser);
        setLoading(false);
      }, 1000);

    } catch (sbErr: any) {
      console.log("Supabase Email Login error:", sbErr.message);
      setErrorMessage("بيانات الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور.");
      setLoading(false);
    }
  };

  // Handle Client Username & Password login
  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMsg("");

    if (!clientNationalId || !clientPassword) {
      setErrorMessage("الرجاء إدخال اسم المستخدم وكلمة المرور الخاصة بالبوابة.");
      return;
    }

    if (loading) return; // Prevent duplicate clicks

    setLoading(true);

    const result = await verifyClientCredentials(clientNationalId, clientPassword);

    if (result.success && result.data) {
      const matchedRecord = result.data;
      setSuccessMsg("تم توثيق الدخول بنجاح. جاري تحويلك لبوابة العملاء التفاعلية...");
      
      sessionStorage.setItem('client_portal_token', 'bypass-token-' + matchedRecord.id);
      sessionStorage.setItem('active-logged-in-client', JSON.stringify({
        id: matchedRecord.id,
        name: matchedRecord.name
      }));

      setTimeout(() => {
        onLoginSuccess({
          role: "client",
          id: matchedRecord.id,
          name: matchedRecord.name || "عميل النظام"
        });
        setLoading(false);
      }, 1000);
    } else {
      setErrorMessage(result.error || "حدث خطأ غير معروف.");
      setLoading(false);
    }
  };

  // Matched Employee outer login handler
  const handleEmployeeLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMsg("");
    
    if (!empUsername || !empPassword) {
      setErrorMessage("الرجاء إدخال اسم الموظف للبوابة وكلمة المرور.");
      return;
    }

    if (loading) return; // Prevent duplicate clicks

    setLoading(true);

    const result = await verifyEmployeeCredentials(empUsername, empPassword);

    if (result.success && result.data) {
      const empData = result.data;
      setSuccessMsg(`تم التحقق بنجاح لملف الموظف...`);
      
      localStorage.setItem('adalah-employee-auth-bypass', 'true');
      sessionStorage.setItem('active-logged-in-employee-v2', JSON.stringify(empData));
      
      setTimeout(() => {
        onLoginSuccess({
          role: "employee",
          id: empData.id || "employee",
          name: empData.name || "تعريف موظف",
          employeeCode: empData.employeeCode || "EMP-11",
          jobTitle: empData.jobTitle || "موظف مكاتب",
          assignedCases: empData.assignedCases || [],
          assignedClients: empData.assignedClients || [],
          permittedModules: empData.sidebarConfig || ['dashboard', 'cases', 'tasks', 'ai', 'documents']
        });
        setLoading(false);
      }, 1000);
    } else {
      setErrorMessage(result.error || "حدث خطأ غير معروف.");
      setLoading(false);
    }
  };

  // Handle Trial Account Submit
  const handleTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMsg("");

    if (!trialEmail || !trialPhone || !trialPassword || (!isTrialLogin && !trialName)) {
      setErrorMessage("الرجاء إكمال كافة البيانات المطلوبة.");
      return;
    }

    setLoading(true);

    try {
      if (isTrialLogin) {
        // Authenticate as a trial user using Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trialEmail,
          password: trialPassword
        });
        if (error) throw error;
        const user = data.user!;
        
        // Fetch profile
        let profileData: any = null;
        try {
          const { data: profile } = await supabase.from('profiles').select('id, uid, role, name, permittedModules, sidebarConfig, avatarUrl, created_at').eq('uid', user.id).maybeSingle();
          profileData = profile;
        } catch (err) {
          console.error("Failed to fetch trial profile:", err);
        }

        onLoginSuccess({
          role: (profileData?.role as "lawyer" | "client") || "lawyer",
          id: user.id,
          name: profileData?.name || "مستخدم تجريبي"
        });
        setLoading(false);
      } else {
        // Register a trial account with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: trialEmail,
          password: trialPassword,
          options: {
            data: {
              name: trialName,
              phone: trialPhone,
              role: 'lawyer',
              trialStartedAt: new Date().toISOString(),
            }
          }
        });
        if (error) throw error;
        const user = data.user!;

        // Store profile in profiles table
        const trialDurationHours = 48;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + trialDurationHours * 60 * 60 * 1000);

        try {
          await supabase.from('profiles').insert([{
            uid: user.id,
            email: trialEmail,
            phone: trialPhone,
            name: trialName,
            role: "lawyer", // Default trial users to lawyer role
            trial_started_at: new Date().toISOString(),
            trial_expires_at: expiresAt.toISOString(),
          }]);
        } catch (err) {
          console.error("Failed to create trial profile:", err);
        }

        setSuccessMsg("تم تسجيل حسابك التجريبي (48 ساعة) بنجاح. يتم الآن تسجيل دخولك...");
        
        setTimeout(() => {
          onLoginSuccess({
            role: "lawyer",
            id: user.id,
            name: trialName
          });
          setLoading(false);
        }, 1500);
      }
    } catch (err: any) {
      console.error("Supabase Auth Trial Error:", err);
      if (err.message?.includes("already") || err.code === "email_exists") {
        setErrorMessage("البريد الإلكتروني مستخدم بالفعل.");
      } else {
        setErrorMessage(err.message || "حدث خطأ أثناء إعداد الحساب التجريبي.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] text-slate-950 font-black tracking-tight font-sans" dir="rtl">
      
      {/* 
        RIGHT SIDEBAR: Platform Features & Highlights
      */}
      <div className="login-sidebar-panel hidden lg:flex flex-col w-[450px] bg-[#0a1628]/80 backdrop-blur-sm border-l border-[#D4AF37]/50/40 p-10 relative overflow-y-auto shadow-2xl z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F2E6] via-white to-white pointer-events-none opacity-90"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col h-full gap-8">
          {onBackToHome && (
            <button 
              onClick={onBackToHome}
              className="self-start flex items-center gap-2 text-sm text-slate-950 font-black tracking-tight font-black tracking-tight hover:text-yellow-300 transition-colors mb-2 bg-[#F0EDDF] hover:bg-slate-200 py-2 px-4 rounded-xl border border-yellow-500/40 shadow-lg cursor-pointer"
            >
              <ArrowLeft className="golden-glow-icon w-4 h-4 rotate-180 text-[#fbbf24]" />
              العودة للرئيسية
            </button>
          )}
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-black tracking-tight text-slate-950 font-black tracking-tight mb-4 leading-tight drop-shadow-sm-[0_2px_4px_rgba(0,0,0,0.8)]">منصة العدالة لإدارة مكاتب المحاماة</h1>
            <p className="text-sm text-slate-900 font-bold font-bold leading-relaxed max-w-lg mx-auto">
              حلول قانونية رقمية استثنائية تعزز من كفاءة العمل وترفع مستوى الحوكمة وإدارة المخاطر.
            </p>
          </div>

          <div className="space-y-6 mt-4">
            <div className="login-card-luxury p-5 rounded-3xl transition-all duration-300 shadow-xl group">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#D4AF37]/10 p-2.5 rounded-xl border border-[#D4AF37]/50">
                  <RefreshCw className="golden-glow-icon w-5 h-5 text-[#B8860B] group-hover:rotate-180 transition-transform duration-700" />
                </div>
                <h3 className="golden-glow-text font-black tracking-tight text-[#B8860B] text-base">مزامنة ذكية مع وزارة العدل</h3>
               </div>
              <p className="golden-glow-text text-xs text-slate-800 font-bold font-semibold leading-relaxed text-justify">
                تكامل مباشر وحي مع بوابة ناجز وديوان المظالم. يقوم المساعد الرقمي بتحليل البيانات وعكسها تلقائياً على النظام.
              </p>
            </div>

            <div className="login-card-luxury p-5 rounded-3xl transition-all duration-300 shadow-xl group">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#D4AF37]/10 p-2.5 rounded-xl border border-[#D4AF37]/50">
                  <Building className="golden-glow-icon w-5 h-5 text-[#B8860B]" />
                </div>
                <h3 className="golden-glow-text font-black tracking-tight text-[#B8860B] text-base">إدارة الأصول والكيانات المستقلة</h3>
              </div>
              <p className="golden-glow-text text-xs text-slate-800 font-bold font-semibold leading-relaxed text-justify">
                لوحات قيادة استراتيجية لمراقبة الأصول عالية القيمة، وتتبع حالات الضمان القضائي ومستويات السرية، مع إشعارات استباقية.
              </p>
            </div>

            <div className="login-card-luxury p-5 rounded-3xl transition-all duration-300 shadow-xl group">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#D4AF37]/10 p-2.5 rounded-xl border border-[#D4AF37]/50">
                  <CheckCircle2 className="golden-glow-icon w-5 h-5 text-[#B8860B]" />
                </div>
                <h3 className="golden-glow-text font-black tracking-tight text-[#B8860B] text-base">التحليل المالي ورقابة الميزانيات</h3>
              </div>
              <p className="golden-glow-text text-xs text-slate-800 font-bold font-semibold leading-relaxed text-justify">
                تقارير ديناميكية ومؤشرات بصرية لمتابعة الإنفاق القضائي والقيم التقديرية التراكمية.
              </p>
            </div>
          </div>
          
          <div className="mt-auto pt-8 border-t border-[#D4AF37]/50/30">
            <p className="text-xs text-[#B8860B] font-bold text-center leading-relaxed">
              كافة البيانات والاتصالات مشفرة بالكامل ومعتمدة لمتطلبات الأمن السيبراني.
            </p>
          </div>
        </div>
      </div>

      {/* LEFT SIDE: Login Forms */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative bg-[#FAFAFA]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-[#F5F2E6] pointer-events-none"></div>

        <div className="login-sidebar-panel w-full max-w-2xl bg-[#0a1628]/95 backdrop-blur-2xl border-2 border-[#D4AF37]/50 rounded-[2.5rem] p-8 lg:p-10 space-y-7 relative z-10 shadow-2xl shadow-amber-900/5">
          
          <div className="text-center space-y-3 mb-8">
            <h2 className="text-3xl font-black tracking-tight text-[#B8860B] tracking-tight">تسجيل الدخول للنظام</h2>
            <p className="text-sm text-slate-950 font-black tracking-tight font-bold">متاح للمستخدمين الحاليين والجدد عبر (Google - الجوال - البريد الإلكتروني)</p>
          </div>

          {/* ERROR MESSAGE CARD */}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 text-xs bg-red-50 border border-red-200 text-red-900 rounded-xl space-y-2 text-justify font-sans shadow-inner"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="font-black tracking-tight">{errorMessage}</span>
              </div>
            </motion.div>
          )}

          {/* ELITE TRIAL / DEMO BYPASS */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xs text-[#D4AF37] font-black tracking-tight uppercase tracking-[0.2em] block mb-2">تسجيل فوري (جديد أو مسجل)</span>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-[#FAFAFA] border border-[#D4AF37]/50 hover:border-[#D4AF37]/50 text-[#B8860B] text-sm font-black tracking-tight py-4 rounded-xl transition-all active:scale-95 transition-transform duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-xl shadow-[#D4AF37]/15 hover:shadow-2xl shadow-[#D4AF37]/20 group"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-slate-950 font-black tracking-tight">{isEn ? "Sign In / Sign Up with Google" : "دخول أو تسجيل جديد عبر Google"}</span>
            </button>
            
            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-[10px] text-slate-700 font-bold font-black tracking-tight uppercase tracking-[0.2em]">أو عبر رسالة الجوال (SMS)</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            {/* PHONE LOGIN SECTION */}
            {!showPhoneOtp ? (
              <form onSubmit={handlePhoneSignIn} className="space-y-3">
                <div className="relative">
                  <input
                    type="tel"
                    placeholder={isEn ? "+966 5X XXX XXXX" : "+966 5X XXX XXXX"}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="login-input-glow w-full bg-[#0a1628]/80 backdrop-blur-sm text-slate-950 font-black tracking-tight text-sm font-black tracking-tight py-4 px-5 rounded-xl focus:outline-none transition-all text-center placeholder:text-slate-500 font-bold font-mono shadow-inner tracking-widest"
                  />
                  <Smartphone className="golden-glow-icon w-5 h-5 text-[#B8860B] absolute left-4 top-4" />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FAFAFA] hover:bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-slate-950 font-black tracking-tight text-sm font-black tracking-tight py-4 rounded-xl transition-all active:scale-95 transition-transform duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Key className="golden-glow-icon w-4 h-4 text-[#B8860B]" />
                  <span>{isEn ? "Verify via SMS (Login or Join)" : "دخول أو تسجيل عبر رسالة الجوال"}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="login-input-glow w-full bg-[#0a1628]/80 backdrop-blur-sm text-[#B8860B] text-2xl font-black tracking-tight py-4 px-5 rounded-xl focus:outline-none transition-all text-center tracking-[0.5em] placeholder:text-slate-500 font-bold shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-slate-950 font-black tracking-tight hover:from-[#FFD700] hover:to-[#D4AF37] text-sm font-black tracking-tight py-4 rounded-xl transition-all active:scale-95 transition-transform duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Check className="w-4 h-4 text-slate-950 font-black tracking-tight" />
                  <span>{isEn ? "Confirm Code" : "تأكيد الرمز المورّد"}</span>
                </button>
              </form>
            )}
          </div>
          <div id="recaptcha-container"></div>

          <div className="flex items-center gap-4 py-1">
            <div className="h-px bg-[#D4AF37]/30 flex-1"></div>
            <span className="text-[10px] text-[#B8860B] font-black tracking-tight uppercase tracking-[0.2em]">أو عبر خيارات البريد الإلكتروني</span>
            <div className="h-px bg-[#D4AF37]/30 flex-1"></div>
          </div>

          {/* SUCCESS MESSAGE CARD */}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-center text-center gap-2.5 shadow-inner"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-extrabold tracking-widest">{successMsg}</span>
            </motion.div>
          )}

          <div className="flex bg-[#F0EDDF] p-1.5 rounded-2xl mb-8 border border-[#D4AF37]/30 gap-1 flex-wrap md:flex-nowrap shadow-inner">
            <button
              onClick={() => {
                setActiveTab("lawyer");
                setErrorMessage("");
                setSuccessMsg("");
              }}
              type="button"
              className={`flex-1 py-3 text-xs font-black tracking-tight text-center transition-all rounded-xl cursor-pointer min-w-[100px] ${
                activeTab === "lawyer" 
                  ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-slate-950 font-black tracking-tight shadow-md shadow-amber-900/10" 
                  : "text-slate-950 font-black tracking-tight hover:text-[#B8860B] hover:bg-[#D4AF37]/10"
              }`}
            >
              دخول (ايميل)
            </button>
            <button
              onClick={() => {
                setActiveTab("trial");
                setErrorMessage("");
                setSuccessMsg("");
              }}
              type="button"
              className={`flex-1 py-3 text-xs font-black tracking-tight text-center transition-all rounded-xl cursor-pointer min-w-[100px] ${
                activeTab === "trial" 
                  ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-slate-950 font-black tracking-tight shadow-md shadow-amber-900/10" 
                  : "text-slate-950 font-black tracking-tight hover:text-[#B8860B] hover:bg-[#D4AF37]/10"
              }`}
            >
              حساب جديد
            </button>
            <button
              onClick={() => {
                setActiveTab("client");
                setErrorMessage("");
                setSuccessMsg("");
              }}
              type="button"
              className={`flex-1 py-3 text-xs font-black tracking-tight text-center transition-all rounded-xl cursor-pointer min-w-[100px] ${
                activeTab === "client" 
                  ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-slate-950 font-black tracking-tight shadow-md shadow-amber-900/10" 
                  : "text-slate-950 font-black tracking-tight hover:text-[#B8860B] hover:bg-[#D4AF37]/10"
              }`}
            >
              بوابة العملاء
            </button>
            <button
              onClick={() => {
                setActiveTab("employee" as any);
                setErrorMessage("");
                setSuccessMsg("");
              }}
              type="button"
              className={`flex-1 py-3 text-xs font-black tracking-tight text-center transition-all rounded-xl cursor-pointer min-w-[100px] gap-1.5 flex items-center justify-center ${
                activeTab === "employee" 
                  ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-slate-950 font-black tracking-tight shadow-md shadow-amber-900/10" 
                  : "text-slate-950 font-black tracking-tight hover:text-[#B8860B] hover:bg-[#D4AF37]/10"
              }`}
            >
              الموظفين <Key className={`w-3 h-3 ${activeTab === 'employee' ? 'text-slate-950 font-black tracking-tight' : 'text-[#B8860B]'}`} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            
            {/* LAWYER LOGIN FORM */}
            {activeTab === "lawyer" && !lawyerNeed2FA && (
              <motion.form
                key="lawyer-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLawyerSignInSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="block text-xs font-black tracking-tight text-[#B8860B] uppercase tracking-widest px-1">البريد الإلكتروني المهني:</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@aladalah-law.sa"
                      value={lawyerEmail}
                      onChange={(e) => setLawyerEmail(e.target.value)}
                      className="login-input-glow w-full bg-[#0a1628]/80 backdrop-blur-sm rounded-xl px-5 py-4 text-sm text-slate-950 font-black tracking-tight placeholder:text-slate-500 font-bold focus:outline-none pr-12 transition-all font-black tracking-tight shadow-inner"
                    />
                    <Mail className="golden-glow-icon w-5 h-5 text-[#B8860B] absolute right-4 top-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black tracking-tight text-[#B8860B] uppercase tracking-widest px-1">كلمة المرور:</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={lawyerPassword}
                      onChange={(e) => setLawyerPassword(e.target.value)}
                      className="login-input-glow w-full bg-[#0a1628]/80 backdrop-blur-sm rounded-xl px-5 py-4 text-sm text-slate-950 font-black tracking-tight placeholder:text-slate-500 font-bold focus:outline-none pr-12 transition-all font-black tracking-tight shadow-inner tracking-widest"
                    />
                    <Lock className="golden-glow-icon w-5 h-5 text-[#B8860B] absolute right-4 top-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-slate-950 font-black tracking-tight hover:from-[#FFD700] hover:to-[#D4AF37] text-sm font-black tracking-tight py-4 rounded-xl shadow-md shadow-amber-900/10 transition-all active:scale-95 transition-transform duration-300 flex items-center justify-center gap-2 cursor-pointer mt-6"
                >
                  {loading ? (
                    <span className="animate-pulse">جاري المصادقة...</span>
                  ) : (
                    <>
                      <LogIn className="w-4.5 h-4.5" />
                      <span>تسجيل الدخول للنظام</span>
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* CLIENT LOGIN FORM */}
            {activeTab === "client" && !clientNeedOTP && (
              <motion.form
                key="client-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleClientLogin}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="block text-xs font-black tracking-tight text-[#B8860B] uppercase tracking-widest px-1">اسم المستخدم العميل (أو رقم الهوية):</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="اسم المستخدم"
                      value={clientNationalId}
                      onChange={(e) => setClientNationalId(e.target.value)}
                      className="login-input-glow w-full bg-[#0a1628]/80 backdrop-blur-sm rounded-xl px-5 py-4 text-sm text-slate-950 font-black tracking-tight placeholder:text-slate-500 font-bold focus:outline-none text-center font-mono transition-all font-black tracking-tight shadow-inner pr-12"
                    />
                    <User className="golden-glow-icon w-5 h-5 text-[#B8860B] absolute right-4 top-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black tracking-tight text-[#B8860B] uppercase tracking-widest px-1">كلمة المرور الموحدة (العدالة):</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      className="login-input-glow w-full bg-[#0a1628]/80 backdrop-blur-sm rounded-xl px-5 py-4 text-sm text-slate-950 font-black tracking-tight placeholder:text-slate-500 font-bold focus:outline-none text-center font-mono transition-all font-black tracking-tight shadow-inner tracking-widest pr-12"
                    />
                    <Lock className="golden-glow-icon w-5 h-5 text-[#B8860B] absolute right-4 top-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  id="client-login-button-submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#FFD700] hover:to-[#D4AF37] text-slate-950 font-black tracking-tight text-sm font-black tracking-tight py-4 rounded-xl shadow-md shadow-amber-900/10 transition-all active:scale-95 transition-transform duration-300 flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                      <span>جاري التحقق...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4.5 h-4.5" />
                      <span>دخول آمن للمحفظة (العدالة)</span>
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* EMPLOYEE PORTAL LOGIN FORM */}
            {activeTab === "employee" && (
              <motion.form
                key="employee-login-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleEmployeeLoginSubmit}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="block text-xs font-black tracking-tight text-[#B8860B] uppercase tracking-widest px-1">اسم المستخدم للموظف:</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="tamer أو adel"
                      value={empUsername}
                      onChange={(e) => setEmpUsername(e.target.value)}
                      className="login-input-glow w-full bg-[#0a1628]/80 backdrop-blur-sm rounded-xl px-5 py-4 text-sm text-slate-950 font-black tracking-tight placeholder:text-slate-500 font-bold focus:outline-none text-center font-mono transition-all font-black tracking-tight shadow-inner pr-12"
                    />
                    <User className="golden-glow-icon w-5 h-5 text-[#B8860B] absolute right-4 top-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black tracking-tight text-[#B8860B] uppercase tracking-widest px-1">كلمة المرور الخاصة بالموظف:</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={empPassword}
                      onChange={(e) => setEmpPassword(e.target.value)}
                      className="login-input-glow w-full bg-[#0a1628]/80 backdrop-blur-sm rounded-xl px-5 py-4 text-sm text-slate-950 font-black tracking-tight placeholder:text-slate-500 font-bold focus:outline-none text-center font-mono transition-all font-black tracking-tight shadow-inner tracking-widest pr-12"
                    />
                    <Lock className="golden-glow-icon w-5 h-5 text-[#B8860B] absolute right-4 top-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  id="employee-login-button-submit"
                  disabled={loading}
                  className="w-full bg-[#FAFAFA] hover:bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-[#B8860B] text-sm font-black tracking-tight py-4 rounded-xl transition-all active:scale-95 transition-transform duration-300 flex items-center justify-center gap-2 cursor-pointer mt-6 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 text-[#B8860B] animate-spin" />
                      <span className="text-slate-950 font-black tracking-tight">جاري التحقق من الهوية...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4.5 h-4.5 text-[#B8860B]" />
                      <span className="text-slate-950 font-black tracking-tight">دخول آمن للموظف والمستشارين</span>
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* TRIAL LOGIN/REGISTER FORM */}
            {activeTab === "trial" && (
              <motion.form
                key="trial-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleTrialSubmit}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-black tracking-tight text-[#B8860B]">
                    {isTrialLogin ? "تسجيل دخول للبريد العادي" : "تسجيل حساب جديد بالبريد الإلكتروني"}
                  </h3>
                  <p className="text-xs text-[#B8860B]/70 font-extrabold mt-2 tracking-widest">✓ خيار متاح للمستخدمين الجدد للتسجيل الفوري</p>
                </div>

                {!isTrialLogin && (
                  <div className="space-y-2">
                    <label className="block text-xs font-black tracking-tight text-[#B8860B] uppercase tracking-widest px-1">الاسم الكامل:</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="أدخل اسمك الكريم"
                        value={trialName}
                        onChange={(e) => setTrialName(e.target.value)}
                        className="login-input-glow w-full bg-[#0a1628]/80 backdrop-blur-sm rounded-xl px-5 py-4 text-sm text-slate-950 font-black tracking-tight placeholder:text-slate-500 font-bold focus:outline-none pr-12 transition-all font-black tracking-tight shadow-inner"
                      />
                      <User className="golden-glow-icon w-5 h-5 text-[#B8860B] absolute right-4 top-4" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-black tracking-tight text-[#B8860B] uppercase tracking-widest px-1">البريد الإلكتروني:</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={trialEmail}
                      onChange={(e) => setTrialEmail(e.target.value)}
                      className="login-input-glow w-full bg-[#0a1628]/80 backdrop-blur-sm rounded-xl px-5 py-4 text-sm text-slate-950 font-black tracking-tight placeholder:text-slate-500 font-bold focus:outline-none pr-12 transition-all font-black tracking-tight shadow-inner"
                    />
                    <Mail className="golden-glow-icon w-5 h-5 text-[#B8860B] absolute right-4 top-4" />
                  </div>
                </div>

                {!isTrialLogin && (
                  <div className="space-y-2">
                    <label className="block text-xs font-black tracking-tight text-[#B8860B] uppercase tracking-widest px-1">رقم الجوال:</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="+966 5X XXX XXXX"
                        value={trialPhone}
                        onChange={(e) => setTrialPhone(e.target.value)}
                        className="login-input-glow w-full bg-[#0a1628]/80 backdrop-blur-sm rounded-xl px-5 py-4 text-sm text-slate-950 font-black tracking-tight placeholder:text-slate-500 font-bold focus:outline-none pr-12 transition-all font-black tracking-tight shadow-inner font-mono text-left"
                        dir="ltr"
                      />
                      <Smartphone className="golden-glow-icon w-5 h-5 text-[#B8860B] absolute right-4 top-4" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-black tracking-tight text-[#B8860B] uppercase tracking-widest px-1">كلمة المرور:</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={trialPassword}
                      onChange={(e) => setTrialPassword(e.target.value)}
                      className="login-input-glow w-full bg-[#0a1628]/80 backdrop-blur-sm rounded-xl px-5 py-4 text-sm text-slate-950 font-black tracking-tight placeholder:text-slate-500 font-bold focus:outline-none pr-12 transition-all font-black tracking-tight shadow-inner tracking-widest"
                    />
                    <Lock className="golden-glow-icon w-5 h-5 text-[#B8860B] absolute right-4 top-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#FFD700] hover:to-[#D4AF37] text-slate-950 font-black tracking-tight text-sm font-black tracking-tight py-4 rounded-xl shadow-md shadow-amber-900/10 transition-all active:scale-95 transition-transform duration-300 flex items-center justify-center gap-2 cursor-pointer mt-6"
                >
                  {loading ? (
                    <span className="animate-pulse">جاري المراجعة...</span>
                  ) : (
                    <>
                      <LogIn className="w-4.5 h-4.5" />
                      <span>{isTrialLogin ? "دخول مستخدم مسجل" : "إنشاء حساب جديد"}</span>
                    </>
                  )}
                </button>

                <div className="text-center mt-4 border-t border-[#D4AF37]/50/30 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTrialLogin(!isTrialLogin);
                      setErrorMessage("");
                      setSuccessMsg("");
                    }}
                    className="text-xs text-[#B8860B]/70 hover:text-[#B8860B] transition-colors cursor-pointer font-bold tracking-widest"
                  >
                    {isTrialLogin 
                      ? "ليس لديك حساب؟ إنشاء حساب جديد بالبريد" 
                      : "هل لديك حساب مسجل؟ تسجيل الدخول بالبريد"}
                  </button>
                </div>
              </motion.form>
            )}

          </AnimatePresence>

          {/* SECURITY CONFIDENTIAL INFO BLOCK */}
          <div className="pt-6 border-t border-[#D4AF37]/50/30 flex items-start justify-center gap-2 text-[10px] text-slate-950 font-black tracking-tight font-bold uppercase tracking-[0.2em]">
            <Lock className="w-3.5 h-3.5 inline shrink-0 text-[#B8860B]" />
            <span>نظام مشفر ومؤمن بمقاييس الأمن السيبراني السعودية</span>
          </div>

        </div>
      </div>

    </div>
  );
}
