import { supabase } from './supabase';

const OFFICE_KEY = 'adala_office_id';
const USER_KEY = 'adala_user_id';
const EMAIL_KEY = 'adala_user_email';

// الحصول على office_id للمستخدم الحالي أو إنشاؤه
export async function getOrCreateOffice(
  userId: string,
  email: string
): Promise<string | null> {
  try {
    // البحث عن مكتب موجود
    const { data: existing } = await supabase
      .from('offices')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing?.id) {
      saveLocally(existing.id, userId, email);
      return existing.id;
    }

    // إنشاء مكتب جديد
    const { data: newOffice, error } = await supabase
      .from('offices')
      .insert({
        user_id: userId,
        email: email,
        office_name: 'مكتبي'
      })
      .select('id')
      .single();

    if (error || !newOffice) {
      console.error('[Office] Create error:', error?.message);
      return null;
    }

    saveLocally(newOffice.id, userId, email);
    return newOffice.id;

  } catch(err: any) {
    console.error('[Office]', err.message);
    return null;
  }
}

// حفظ محلي
function saveLocally(officeId: string, userId: string, email: string) {
  localStorage.setItem(OFFICE_KEY, officeId);
  localStorage.setItem(USER_KEY, userId);
  localStorage.setItem(EMAIL_KEY, email);
}

// الحصول على office_id المحفوظ
export function getCurrentOfficeId(): string | null {
  return localStorage.getItem(OFFICE_KEY);
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function getCurrentEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

// مسح بيانات الجلسة عند تسجيل الخروج
export function clearSession() {
  localStorage.removeItem(OFFICE_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EMAIL_KEY);
  // مسح الـ cache
  const cacheKeys = Object.keys(localStorage).filter(k =>
    k.startsWith('adala_') ||
    k.includes('_local') ||
    k.includes('_cache')
  );
  cacheKeys.forEach(k => localStorage.removeItem(k));
}

// التحقق من تغيير المستخدم
export function isUserChanged(newUserId: string): boolean {
  const stored = getCurrentUserId();
  return stored !== null && stored !== newUserId;
}

// أداة تسجيل والتحقق من سلامة الجلسة لمنع تداخل البيانات
export function verifyAndEnforceSessionIntegrity(expectedUserId: string, expectedOfficeId: string) {
  const storedUserId = getCurrentUserId();
  const storedOfficeId = getCurrentOfficeId();

  console.log('🛡️ [Security] Running Session Integrity Check:');
  console.log(`  -> Expected: User(${expectedUserId}) | Office(${expectedOfficeId})`);
  console.log(`  -> Stored:   User(${storedUserId}) | Office(${storedOfficeId})`);

  let hasLeakageRisk = false;

  if (storedUserId && storedUserId !== expectedUserId) {
    console.error('🚨 [SECURITY ALERT] User ID mismatch detected! Possible cross-account data leakage.');
    hasLeakageRisk = true;
  }

  if (storedOfficeId && storedOfficeId !== expectedOfficeId) {
    console.error('🚨 [SECURITY ALERT] Office ID mismatch detected! Possible cross-account data leakage.');
    hasLeakageRisk = true;
  }

  if (hasLeakageRisk) {
    console.warn('🔄 [Security] Forcing session clear and hard page reload to protect data.');
    clearSession();
    window.location.replace('/');
  }
}

// دالة اختبار للتحقق من عزل البيانات ومطابقتها للمكتب الحالي
export function verifyDataIsolation(itemsOrOfficeId: any, currentOfficeId?: string | null): boolean {
  const storedOfficeId = localStorage.getItem(OFFICE_KEY);
  
  // إذا تم تمرير معرف مكتب منفرد يمثل الحالة الحالية، نقارنه مباشرة بالمعرف المخزن في localStorage
  if (typeof itemsOrOfficeId === 'string') {
    if (!storedOfficeId) return true;
    return storedOfficeId === itemsOrOfficeId;
  }
  
  const activeOfficeId = currentOfficeId || storedOfficeId;
  if (!activeOfficeId) {
    return true;
  }
  
  const items = Array.isArray(itemsOrOfficeId) ? itemsOrOfficeId : [];
  const mismatchedItem = items.find(item => item && item.officeId && item.officeId !== activeOfficeId);
  const mismatchedItemSnake = items.find(item => item && item.office_id && item.office_id !== activeOfficeId);
  
  if (mismatchedItem || mismatchedItemSnake) {
    const badId = mismatchedItem?.officeId || mismatchedItemSnake?.office_id;
    console.warn(`🚨 [Data Isolation Mismatch] Detected item with office_id: ${badId} instead of active office_id: ${activeOfficeId}`);
    return false;
  }
  
  return true;
}


