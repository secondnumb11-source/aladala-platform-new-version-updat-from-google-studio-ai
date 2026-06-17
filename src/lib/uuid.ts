/**
 * توليد UUID v4 متوافق مع Supabase و PostgreSQL
 * يستخدم crypto.randomUUID() إذا كان متاحاً (المتصفحات الحديثة)
 * أو fallback يدوي لضمان التوافق
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback لبيئات لا تدعم crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
