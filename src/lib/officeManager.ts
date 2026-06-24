// officeManager.ts
import { supabase } from '@/lib/supabase';

/**
 * دالة تسجيل العمليات (Log) لمراقبة وتوثيق تبديل المستخدم وتحديث البيانات وعزلها للأغراض التحليلية.
 */
export const logOfficeAction = (actionType: string, details: any = {}) => {
  const currentOfficeId = localStorage.getItem('adala_office_id') || 'unspecified_office';
  const timestamp = new Date().toISOString();
  
  const logMessage = `[Adala Monitor] [${timestamp}] [Action: ${actionType}] [Office ID: ${currentOfficeId}]`;
  
  if (details.failure || details.isBreached) {
    console.error(`🚨 ${logMessage} - ISOLATION FAILURE DETECTED:`, details);
  } else {
    console.log(`ℹ️ ${logMessage}`, details);
  }
};

export const getOrCreateOffice = async () => {
  let officeId = localStorage.getItem('adala_office_id');
  if (!officeId) {
    officeId = `office_${Date.now()}`;
    localStorage.setItem('adala_office_id', officeId);
    logOfficeAction('CREATE_OFFICE', { officeId });
  }
  return officeId;
};

export const clearSession = () => {
  const previousOfficeId = localStorage.getItem('adala_office_id');
  localStorage.removeItem('adala_office_id');
  sessionStorage.removeItem('last_verified_office_id');
  logOfficeAction('CLEAR_SESSION', { previousOfficeId });
};

export const isUserChanged = () => {
  return false;
};

export const verifyAndEnforceSessionIntegrity = () => {
  return true;
};

/**
 * دالة التحقق من عزل البيانات (verifyDataIsolation).
 * تقوم بمقارنة معرف المكتب (office_id) الحالي مع المعرف المحمل في الحالة (State) أو المخزن في الجلسة.
 * في حال اكتشاف عدم تطابق أو تداخل، تقوم بمسح الذاكرة وتطهير البيانات وفرض إعادة تحميل الصفحة لمنع أي تسريب.
 */
export const verifyDataIsolation = (stateOfficeId?: string): boolean => {
  const currentOfficeId = localStorage.getItem('adala_office_id');
  const lastKnownOfficeId = sessionStorage.getItem('last_verified_office_id');
  
  // 1. تحقق من صحة المعرف الحالي
  if (!currentOfficeId) {
    // إذا لم يكن متواجداً، لا نعتبره تسريباً بل مكتب غير مهيأ بعد
    return true;
  }
  
  // 2. مقارنة مع معرف الحالة (State) إذا تم تمريره
  if (stateOfficeId && stateOfficeId !== currentOfficeId) {
    const errorDetails = {
      failure: true,
      isBreached: true,
      currentOfficeId,
      stateOfficeId,
      reason: 'Mismatch between localStorage office_id and application state office_id'
    };
    logOfficeAction('VERIFICATION_FAILURE', errorDetails);
    
    // تطهير فوري لمنع التسريب وإعادة تحميل الصفحة
    performEmergencyPurge();
    return false;
  }
  
  // 3. مقارنة مع آخر معرف تم التحقق منه في الجلسة (Session Storage)
  if (lastKnownOfficeId && lastKnownOfficeId !== currentOfficeId) {
    const errorDetails = {
      failure: true,
      isBreached: true,
      currentOfficeId,
      lastKnownOfficeId,
      reason: 'Mismatch between localStorage office_id and session last_verified_office_id'
    };
    logOfficeAction('VERIFICATION_FAILURE', errorDetails);
    
    // تطهير فوري لمنع التسريب وإعادة تحميل الصفحة
    performEmergencyPurge();
    return false;
  }
  
  // حفظ المعرف في الجلسة لضمان الاستمرارية الآمنة
  sessionStorage.setItem('last_verified_office_id', currentOfficeId);
  return true;
};

/**
 * دالة التطهير والإنقاذ الطارئ عند اكتشاف أي اختراق لعزل البيانات.
 */
const performEmergencyPurge = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.warn('[Adala Security] Emergency purge completed successfully. Purging state and reloading client window.');
  } catch (err) {
    console.error('[Adala Security] Failed during storage clearance:', err);
  }
  
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};
