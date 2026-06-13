import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, User, Lock, Mail, Smartphone, Building, Key, 
  CheckCircle2, ArrowLeft, Clock, Info, Check, LogIn, AlertCircle, RefreshCw, Zap
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

import { auth, db } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "@/lib/firestore-utils";

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

  // Handle Phone Sign In
  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

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

      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);

      setConfirmationResult(result);
      setShowPhoneOtp(true);
      setSuccessMsg(isEn 
        ? `Verification code sent via SMS.` 
        : `تم إرسال رمز التحقق عبر SMS.`);

    } catch (err: any) {
      console.error("Phone Auth Error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setErrorMessage(isEn 
          ? "Phone Number authentication is not enabled in your Firebase project. Please go to Firebase Console > Authentication > Settings > Sign-in method and enable 'Phone'."
          : "خيار الدخول برقم الجوال غير مفعّل في مشروع Firebase الخاص بك. يرجى الذهاب إلى كونسول Firebase > أداة Authentication > الإعدادات (Settings) > طرق تسجيل الدخول (Sign-in method) وتفعيل 'رقم الهاتف' (Phone).");
      } else {
        setErrorMessage(err.message || (isEn ? "Failed to send SMS." : "فشل إرسال رسالة التحقق لتعذر الحماية."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await confirmationResult.confirm(verificationCode);
      const user = result.user;
      
      const userDocRef = doc(db, "users", user.uid);
      let profile: any = null;
      try {
        const uDoc = await getDoc(userDocRef);
        if (!uDoc.exists()) {
          profile = {
            uid: user.uid,
            phone: user.phoneNumber,
            name: isEn ? "Elite Law Firm Member" : "عضو مكتب المحاماة المميز",
            role: "lawyer",
            createdAt: serverTimestamp()
          };
          await setDoc(userDocRef, profile);
        } else {
          profile = uDoc.data();
        }
      } catch (fsE) {
        profile = {
            uid: user.uid,
            phone: user.phoneNumber,
            name: "عضو مكتب المحاماة المميز",
            role: "lawyer"
        };
      }

      onLoginSuccess({
        role: profile.role,
        id: user.uid,
        name: profile.name
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
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Ensure user document exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      let userData: any = null;
      try {
        const userDocSec = await getDoc(userDocRef);
        if (!userDocSec.exists()) {
          const resolvedRole = activeTab === "client" ? "client" : activeTab === "employee" ? "employee" : "lawyer";
          userData = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || "مستخدم النخبة المعتمد",
            role: resolvedRole,
            createdAt: serverTimestamp()
          };
          await setDoc(userDocRef, userData);
        } else {
          userData = userDocSec.data();
        }
      } catch (firestoreErr) {
        console.warn("Firestore access error:", firestoreErr);
      }

      setSuccessMsg(isEn 
        ? "Google Login successful! Synchronizing tokens..." 
        : "تم تسجيل الدخول عبر Google بنجاح! جاري مزامنة الرموز الموثقة...");
      
      // Debounce window to prevent token race conditions
      await new Promise(r => setTimeout(r, 800));

      try {
        if (auth.currentUser) {
           await auth.currentUser.getIdTokenResult(true);
        } else {
           throw new Error("No user found after successful sign-in");
        }
      } catch (tokenErr: any) {
        if (tokenErr.code === 'auth/network-request-failed') {
          console.warn("Network error during token refresh, continuing with cached token");
        } else {
          console.error("Token sync error:", tokenErr);
          setErrorMessage(isEn ? "Failed to verify session tokens." : "حدث خطأ أثناء مزامنة المصادقة.");
          setLoading(false);
          return;
        }
      }

      setTimeout(() => {
        const fallbackRole = activeTab === "client" ? "client" : activeTab === "employee" ? "employee" : "lawyer";
        onLoginSuccess({
          role: (userData?.role as "lawyer" | "client" | "employee") || fallbackRole,
          id: user.uid,
          name: userData?.name || user.displayName || "مستخدم النخبة المعتمد"
        });
        setLoading(false);
      }, 500);

    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage(isEn ? "Sign-in cancelled." : "تم إلغاء عملية الدخول.");
      } else if (err.code === 'auth/unauthorized-domain') {
        const currentHost = window.location.hostname;
        setErrorMessage(isEn 
          ? `Authorization Domain Error: The current hosting domain (${currentHost}) is not authorized in your Firebase console. To fix this, go to Firebase Console > Authentication > Settings > Authorized domains, click 'Add domain' and paste: ${currentHost}`
          : `خطأ في نطاق مصادقة Google (Unauthorized Domain): النطاق الحالي للتشغيل (${currentHost}) غير معتمد في مشروع Firebase الخاص بك. لحل هذه المشكلة، اذهب إلى كونسول Firebase > أداة Authentication > الإعدادات (Settings) > النطاقات المعتمدة (Authorized domains) ثم اضغط 'إضافة نطاق' وأدخل: ${currentHost}`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMessage(isEn 
          ? "Google sign-in is not enabled in your Firebase project. Please go to Firebase Console > Authentication > Settings > Sign-in method and enable 'Google'."
          : "خيار الدخول عبر Google غير مفعّل في مشروع Firebase الخاص بك. يرجى الذهاب إلى كونسول Firebase > أداة Authentication > الإعدادات (Settings) > طرق تسجيل الدخول (Sign-in method) وتفعيل 'Google'.");
      } else {
        setErrorMessage(isEn ? "Google login failed. Please try again." : "فشل تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.");
      }
      setLoading(false);
    }
  };

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
      // 1. Attempt traditional sign in with Firebase Auth email/password normal method
      const userCredential = await signInWithEmailAndPassword(auth, lawyerEmail.trim(), lawyerPassword);
      const user = userCredential.user;

      // Fetch persistent profile details from Firestore
      const userDocRef = doc(db, "users", user.uid);
      let userData: any = null;
      try {
        const profileDoc = await getDoc(userDocRef);
        if (!profileDoc.exists()) {
          userData = {
            uid: user.uid,
            name: user.displayName || "المستشار القانوني المعتمد",
            role: "lawyer",
            email: lawyerEmail.trim()
          };
          await setDoc(userDocRef, userData);
        } else {
          userData = profileDoc.data();
        }
      } catch (err) {
        console.warn("Firestore profile fetch error:", err);
      }

      setSuccessMsg("تم التوثيق والتحقق من حساب البريد الإلكتروني بنجاح.");
      setTimeout(() => {
        onLoginSuccess({
          role: (userData?.role as "lawyer" | "client") || "lawyer",
          id: user.uid,
          name: userData?.name || "المستشار القانوني المعتمد"
        });
        setLoading(false);
      }, 1000);

    } catch (firebaseErr: any) {
      console.log("Firebase Email Login error:", firebaseErr.code);
      if (firebaseErr.code === "auth/user-not-found" || firebaseErr.code === "auth/invalid-credential" || firebaseErr.code === "auth/wrong-password") {
        setErrorMessage("بيانات الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور.");
      } else if (firebaseErr.code === "auth/operation-not-allowed") {
        setErrorMessage("خيار الدخول بالبريد الإلكتروني غير مفعّل بـ Firebase. الرجاء تفعيله بـ Authentication.");
      } else {
        setErrorMessage("بيانات الدخول غير صحيحة أو غير مسجلة حالياً بالطريقة العادية.");
      }
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

    setLoading(true);

    try {
      const loginEmail = clientNationalId.includes('@') ? clientNationalId : `${clientNationalId}@client.aladalah-law.sa`;
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, clientPassword);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      let userData: any = null;
      try {
        const profileDoc = await getDoc(userDocRef);
        if (!profileDoc.exists()) {
          userData = {
            uid: user.uid,
            name: user.displayName || "عميل النظام",
            role: "client",
            email: loginEmail
          };
          await setDoc(userDocRef, userData);
        } else {
          userData = profileDoc.data();
        }
      } catch (err) {
        console.warn("Firestore profile fetch error:", err);
      }

      setSuccessMsg("تم توثيق الدخول بنجاح. جاري تحويلك لبوابة العملاء التفاعلية...");
      
      setTimeout(() => {
        onLoginSuccess({
          role: "client",
          id: user.uid,
          name: userData?.name || user.displayName || "عميل النظام"
        });
        setLoading(false);
      }, 1000);
      
    } catch (firebaseErr: any) {
      console.log("Firebase Client Login error:", firebaseErr.code);
      if (firebaseErr.code === "auth/user-not-found" || firebaseErr.code === "auth/invalid-credential" || firebaseErr.code === "auth/wrong-password") {
        setErrorMessage("بيانات الدخول غير صحيحة. يرجى التأكد من اسم المستخدم وكلمة المرور.");
      } else if (firebaseErr.code === "auth/operation-not-allowed") {
        setErrorMessage(isEn 
          ? "Email/Password authentication is not enabled in your Firebase project. Please go to Firebase Console > Authentication > Settings > Sign-in method and enable 'Email/Password'."
          : "خيار الدخول بالبريد الإلكتروني وكلمة المرور غير مفعّل في مشروع Firebase الخاص بك. يرجى الذهاب إلى كونسول Firebase > أداة Authentication > الإعدادات (Settings) > طرق تسجيل الدخول (Sign-in method) وتفعيل 'البريد الإلكتروني/كلمة المرور' (Email/Password).");
      } else {
        setErrorMessage("فشل تسجيل الدخول للعميل. الحساب غير موجود.");
      }
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

    setLoading(true);

    try {
      const loginEmail = empUsername.includes('@') ? empUsername : `${empUsername}@aladalah-law.sa`;
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, empPassword);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      let userData: any = null;
      try {
        const profileDoc = await getDoc(userDocRef);
        if (!profileDoc.exists()) {
          userData = {
            uid: user.uid,
            name: user.displayName || "موظف النظام",
            role: "employee",
            email: loginEmail
          };
          await setDoc(userDocRef, userData);
        } else {
          userData = profileDoc.data();
        }
      } catch (err) {
        console.warn("Firestore profile fetch error:", err);
      }

      setSuccessMsg(`تم التحقق بنجاح لملف الموظف...`);
      
      setTimeout(() => {
        onLoginSuccess({
          role: "employee",
          id: user.uid,
          name: userData?.name || user.displayName || "تسجيل موظف جديد",
          employeeCode: userData?.employeeCode || "EMP-11",
          jobTitle: userData?.jobTitle || "مستشار قانوني",
          assignedCases: userData?.assignedCases || [],
          assignedClients: userData?.assignedClients || [],
          permittedModules: userData?.permittedModules || ['dashboard', 'cases', 'calendar', 'tasks', 'ai', 'documents', 'court-map', 'saudi-hub']
        });
        setLoading(false);
      }, 1000);

    } catch (firebaseErr: any) {
      console.log("Firebase Employee Login error:", firebaseErr.code);
      if (firebaseErr.code === "auth/user-not-found" || firebaseErr.code === "auth/invalid-credential" || firebaseErr.code === "auth/wrong-password") {
        setErrorMessage("بيانات الدخول غير صحيحة. يرجى التأكد من اسم المستخدم وكلمة المرور.");
      } else if (firebaseErr.code === "auth/operation-not-allowed") {
        setErrorMessage(isEn 
          ? "Email/Password authentication is not enabled in your Firebase project. Please go to Firebase Console > Authentication > Settings > Sign-in method and enable 'Email/Password'."
          : "خيار الدخول بالبريد الإلكتروني وكلمة المرور غير مفعّل في مشروع Firebase الخاص بك. يرجى الذهاب إلى كونسول Firebase > أداة Authentication > الإعدادات (Settings) > طرق تسجيل الدخول (Sign-in method) وتفعيل 'البريد الإلكتروني/كلمة المرور' (Email/Password).");
      } else {
        setErrorMessage("فشل دخول الموظف. الحساب غير موجود في سجل Firebase.");
      }
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
        // Authenticate as a trial user
        const userCredential = await signInWithEmailAndPassword(auth, trialEmail, trialPassword);
        const user = userCredential.user;
        
        // Fetch profile
        let profileData: any = null;
        try {
          const profileDoc = await getDoc(doc(db, "users", user.uid));
          profileData = profileDoc.exists() ? profileDoc.data() : null;
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        }

        onLoginSuccess({
          role: (profileData?.role as "lawyer" | "client") || "lawyer",
          id: user.uid,
          name: profileData?.name || "مستخدم تجريبي"
        });
        setLoading(false);
      } else {
        // Register a trial account
        const userCredential = await createUserWithEmailAndPassword(auth, trialEmail, trialPassword);
        const user = userCredential.user;

        // Store profile in Firestore
        const trialDurationHours = 48;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + trialDurationHours * 60 * 60 * 1000);

        try {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: trialEmail,
            phone: trialPhone,
            name: trialName,
            role: "lawyer", // Default trial users to lawyer role
            trialStartedAt: serverTimestamp(),
            trialExpiresAt: expiresAt.toISOString(),
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        }

        setSuccessMsg("تم تسجيل حسابك التجريبي (48 ساعة) بنجاح. يتم الآن تسجيل دخولك...");
        
        setTimeout(() => {
          onLoginSuccess({
            role: "lawyer",
            id: user.uid,
            name: trialName
          });
          setLoading(false);
        }, 1500);
      }
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMessage("البريد الإلكتروني مستخدم بالفعل.");
      } else if (err.code === "auth/operation-not-allowed") {
        setErrorMessage(isEn 
          ? "Email/Password authentication is not enabled in your Firebase project. Please go to Firebase Console > Authentication > Settings > Sign-in method and enable 'Email/Password'."
          : "خيار الدخول بالبريد الإلكتروني وكلمة المرور غير مفعّل في مشروع Firebase الخاص بك. يرجى الذهاب إلى كونسول Firebase > أداة Authentication > الإعدادات (Settings) > طرق تسجيل الدخول (Sign-in method) وتفعيل 'البريد الإلكتروني/كلمة المرور' (Email/Password).");
      } else {
        setErrorMessage("حدث خطأ أثناء إعداد الحساب التجريبي.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans" dir="rtl">
      
      {/* 
        RIGHT SIDEBAR: Platform Features & Highlights
      */}
      <div className="hidden lg:flex flex-col w-[450px] bg-white border-l border-slate-800 p-10 relative overflow-y-auto shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-[#f8fafc]/50 to-white pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col h-full gap-8">
          {onBackToHome && (
            <button 
              onClick={onBackToHome}
              className="self-start flex items-center gap-2 text-sm text-slate-900 transition-colors mb-2 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-800"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
              العودة للرئيسية
            </button>
          )}
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-black text-slate-900 mb-4 leading-tight">منصة العدالة لإدارة مكاتب المحاماة</h1>
            <p className="text-base text-slate-900 font-bold leading-relaxed max-w-lg mx-auto">
              حلول قانونية رقمية استثنائية تعزز من كفاءة العمل وترفع مستوى الحوكمة وإدارة المخاطر.
            </p>
          </div>

          <div className="space-y-6 mt-4">
            <div className="bg-slate-50 border border-slate-800 p-5 rounded-2xl transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary/20 p-2 rounded-xl">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">مزامنة ذكية مع وزارة العدل</h3>
               </div>
              <p className="text-xs text-slate-900 font-bold leading-relaxed text-justify">
                تكامل مباشر وحي مع بوابة ناجز، ديوان المظالم، وتراضي. يقوم المساعد الرقمي بتحليل البيانات الواردة وعكسها تلقائياً على سجلات القضايا وجداول الجلسات الخاصة بك.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-800 p-5 rounded-2xl transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary/20 p-2 rounded-xl">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">إدارة الأصول والكيانات المستقلة</h3>
              </div>
              <p className="text-xs text-slate-900 font-bold leading-relaxed text-justify">
                لوحات قيادة استراتيجية لمراقبة الأصول عالية القيمة، وتتبع حالات الضمان القضائي ومستويات السرية، مع إشعارات استباقية لانقضاء صلاحية التراخيص والتعميلات.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-800 p-5 rounded-2xl transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary/20 p-2 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">التحليل المالي ورقابة الميزانيات</h3>
              </div>
              <p className="text-xs text-slate-900 font-bold leading-relaxed text-justify">
                تقارير ديناميكية ومؤشرات بصرية لمتابعة الإنفاق القضائي، القيم التقديرية التراكمية، ومؤشرات الأداء المهني للطاقم القانوني بضغطة زر.
              </p>
            </div>
          </div>
          
          <div className="mt-auto pt-8 border-t border-slate-800">
            <p className="text-xs text-slate-900 font-bold text-center">
              كافة البيانات والاتصالات بمكتب المحاماة مشفرة بالكامل ومعتمدة لمتطلبات الأمن السيبراني والسيادة الوطنية السعودية.
            </p>
          </div>
        </div>
      </div>
      {/* LEFT SIDE: Login Forms */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative bg-[#f8fafc]">
        <div className="absolute inset-0 bg-white pointer-events-none"></div>

        <div className="w-full max-w-4xl bg-white border border-slate-800 rounded-3xl p-8 lg:p-10 space-y-7 relative z-10 shadow-xl">
          
          <div className="text-center space-y-1 mb-8">
            <h2 className="text-2xl font-black text-slate-900">تسجيل الدخول والنظام</h2>
            <p className="text-xs text-slate-900 font-bold">متاح للمستخدمين الحاليين والجدد عبر (Google - الجوال - البريد الإلكتروني)</p>
          </div>

          {/* MOCK/DB CONNECTION NOTIFIER CHIP */}
          <div className="p-3 bg-slate-50 border border-slate-800 rounded-xl text-center flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" : "bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]"}`}></div>
            <span className="text-xs text-slate-900 font-black uppercase tracking-widest">
              {isSupabaseConfigured 
                ? "الاتصال السحابي مفعل" 
                : "وضع المحاكاة المعتمد"}
            </span>
          </div>

          {/* ERROR MESSAGE CARD */}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl space-y-2 text-justify font-sans"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-bold">{errorMessage}</span>
              </div>
            </motion.div>
          )}

          {/* ELITE TRIAL / DEMO BYPASS */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em]">تسجيل فوري (جديد أو مسجل)</span>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white border border-slate-800 text-slate-900 text-xs font-black py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" alt="Google" className="w-4 h-4" />
              <span>{isEn ? "Sign In / Sign Up with Google" : "دخول أو تسجيل جديد عبر Google"}</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="h-px bg-slate-100 flex-1"></div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em]">أو عبر رسالة الجوال (SMS)</span>
              <div className="h-px bg-slate-100 flex-1"></div>
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
                    className="w-full bg-slate-50 border border-slate-800 text-slate-900 text-xs font-black py-3.5 px-4 rounded-xl focus:outline-none focus:border-primary transition-all text-center placeholder:text-slate-900"
                  />
                  <Smartphone className="w-4 h-4 text-slate-900 absolute left-3.5 top-3.5" />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0c2461] text-white text-xs font-black py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#0c2461]/10"
                >
                  <Key className="w-3.5 h-3.5" />
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
                    className="w-full bg-slate-50 border border-slate-800 text-slate-900 text-lg font-black py-3 px-4 rounded-xl focus:outline-none focus:border-primary transition-all text-center tracking-[0.5em]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white text-xs font-black py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEn ? "Confirm Code" : "تأكيد الرمز المورّد"}</span>
                </button>
              </form>
            )}
          </div>
          <div id="recaptcha-container"></div>

          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-100 flex-1"></div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em]">أو عبر خيارات البريد الإلكتروني</span>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>

          {/* SUCCESS MESSAGE CARD */}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 text-xs bg-emerald-950 border border-emerald-900 text-white rounded-xl flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-800 gap-1 flex-wrap md:flex-nowrap">
            <button
              onClick={() => {
                setActiveTab("lawyer");
                setErrorMessage("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-3 text-xs font-bold text-center transition-all rounded-lg cursor-pointer min-w-[100px] ${
                activeTab === "lawyer" 
                  ? "bg-primary text-white shadow-lg" 
                  : "text-slate-900"
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
              className={`flex-1 py-3 text-xs font-bold text-center transition-all rounded-lg cursor-pointer min-w-[100px] ${
                activeTab === "trial" 
                  ? "bg-primary text-white shadow-lg" 
                  : "text-slate-900"
              }`}
            >
              حساب جديد (ايميل)
            </button>
            <button
              onClick={() => {
                setActiveTab("client");
                setErrorMessage("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-3 text-xs font-bold text-center transition-all rounded-lg cursor-pointer min-w-[100px] ${
                activeTab === "client" 
                  ? "bg-primary text-white shadow-lg" 
                  : "text-slate-900"
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
              className={`flex-1 py-3 text-xs font-bold text-center transition-all rounded-lg cursor-pointer min-w-[100px] ${
                activeTab === "employee" 
                  ? "bg-primary text-white shadow-lg" 
                  : "text-slate-900"
              }`}
            >
              الموظفين 🔑
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
                  <label className="block text-sm font-bold text-slate-900">البريد الإلكتروني المهني:</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@aladalah-law.sa"
                      value={lawyerEmail}
                      onChange={(e) => setLawyerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 pl-11 transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-900 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900">كلمة المرور:</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={lawyerPassword}
                      onChange={(e) => setLawyerPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 pl-11 transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-900 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-[#aa8c2c] text-white text-sm font-black py-3.5 rounded-xl[0_0_20px_rgba(212,175,55,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {loading ? (
                    <span className="animate-pulse">جاري المصادقة...</span>
                  ) : (
                    <>
                      <LogIn className="w-4.5 h-4.5" />
                      <span>تسجيل الدخول</span>
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
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900">اسم المستخدم العميل (أو رقم الهوية):</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="اسم المستخدم"
                      value={clientNationalId}
                      onChange={(e) => setClientNationalId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-center font-mono transition-all font-bold"
                    />
                    <User className="w-4 h-4 text-slate-900 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900">كلمة المرور الموحدة (العدالة):</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="كلمة المرور"
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-center font-mono transition-all font-bold"
                    />
                    <Lock className="w-4 h-4 text-slate-900 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  id="client-login-button-submit"
                  disabled={loading}
                  className="w-full bg-primary text-white text-sm font-black py-3.5 rounded-xl[0_0_20px_rgba(212,175,55,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <LogIn className="w-4.5 h-4.5" />
                  <span>دخول آمن للمحفظة (العدالة)</span>
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
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900">اسم المستخدم للموظف:</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="tamer أو adel"
                      value={empUsername}
                      onChange={(e) => setEmpUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-center font-mono transition-all font-bold"
                    />
                    <User className="w-4 h-4 text-slate-900 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900">كلمة المرور الخاصة بالموظف:</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="رمز المرور (123)"
                      value={empPassword}
                      onChange={(e) => setEmpPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-center font-mono transition-all font-bold"
                    />
                    <Lock className="w-4 h-4 text-slate-900 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  id="employee-login-button-submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white text-sm font-black py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <LogIn className="w-4.5 h-4.5 text-primary" />
                  <span>دخول آمن للموظف والمستشارين</span>
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
                <div className="text-center mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    {isTrialLogin ? "تسجيل دخول للبريد العادي" : "تسجيل حساب جديد بالبريد الإلكتروني"}
                  </h3>
                  <p className="text-xs text-emerald-600 font-bold mt-1">✓ خيار متاح للمستخدمين الجدد للتسجيل الفوري</p>
                </div>

                {!isTrialLogin && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-900">الاسم الكامل:</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="أدخل اسمك الكريم"
                        value={trialName}
                        onChange={(e) => setTrialName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 pl-11 transition-all"
                      />
                      <User className="w-4 h-4 text-slate-900 absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900">البريد الإلكتروني:</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={trialEmail}
                      onChange={(e) => setTrialEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 pl-11 transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-900 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {!isTrialLogin && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-900">رقم الجوال:</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="+966 5X XXX XXXX"
                        value={trialPhone}
                        onChange={(e) => setTrialPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 pl-11 transition-all"
                      />
                      <Smartphone className="w-4 h-4 text-slate-900 absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-900">كلمة المرور:</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={trialPassword}
                      onChange={(e) => setTrialPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 pl-11 transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-900 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-[#aa8c2c] text-white text-sm font-black py-3.5 rounded-xl[0_0_20px_rgba(212,175,55,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
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

                <div className="text-center mt-3 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTrialLogin(!isTrialLogin);
                      setErrorMessage("");
                      setSuccessMsg("");
                    }}
                    className="text-xs text-primary transition-colors cursor-pointer font-extrabold"
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
          <div className="pt-6 border-t border-slate-100 flex items-start justify-center gap-2 text-xs text-slate-500 font-medium">
            <Lock className="w-3.5 h-3.5 inline shrink-0 text-slate-400" />
            <span>نظام مشفر ومؤمن بمقاييس الأمن السيبراني السعودية</span>
          </div>

        </div>
      </div>

    </div>
  );
}
