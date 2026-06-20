/**
 * أدوات تباين النصوص — منصة العدالة
 */

// تحديد لون النص المناسب بناءً على خلفية
export const getContrastText = (bgClass: string): string => {
  // خلفيات داكنة جداً → نص أبيض
  const veryDark = [
    '#050e21', '#0a1628', '#020813',
    'slate-900', 'slate-800', 'slate-700',
    'gray-900', 'gray-800', 'zinc-900',
    'neutral-900', 'black', 'dark',
    'indigo-900', 'blue-900', 'purple-900',
    'green-900', 'red-900', 'teal-900'
  ];

  // خلفيات فاتحة → نص داكن
  const light = [
    'white', 'slate-50', 'slate-100', 'slate-200',
    'gray-50', 'gray-100', 'gray-200',
    'amber-50', 'amber-100', 'yellow-50', 'yellow-100',
    'green-50', 'green-100', 'emerald-50', 'emerald-100',
    'blue-50', 'blue-100', 'indigo-50', 'indigo-100',
    'red-50', 'red-100', 'rose-50', 'rose-100',
    'orange-50', 'orange-100', 'purple-50', 'purple-100'
  ];

  // خلفيات متوسطة → نص أبيض عريض
  const medium = [
    'blue-500', 'blue-600', 'green-500', 'green-600',
    'red-500', 'red-600', 'purple-500', 'purple-600',
    'indigo-500', 'indigo-600', 'teal-500', 'teal-600',
    'emerald-500', 'emerald-600', 'slate-500', 'slate-600'
  ];

  // خلفيات ذهبية → نص أسود
  const golden = [
    'amber-500', 'amber-600', 'yellow-500', 'yellow-600'
  ];

  const bg = bgClass.toLowerCase();

  if (veryDark.some(d => bg.includes(d))) {
    return 'text-white';
  }
  if (light.some(l => bg.includes(l))) {
    return 'text-slate-900';
  }
  if (golden.some(g => bg.includes(g))) {
    return 'text-black font-bold';
  }
  if (medium.some(m => bg.includes(m))) {
    return 'text-white';
  }

  // افتراضي
  return 'text-white';
};

/**
 * دالة تجلب اللون الديناميكي بناءً على كلاس الخلفية لضمان التباين وامتثال WCAG
 */
export const getDynamicTextColor = (bgClass: string): string => {
  return getContrastText(bgClass);
};

// ألوان نص محددة للعناصر الرئيسية
export const TEXT_COLORS = {
  // النصوص الأساسية على الخلفية الداكنة
  primary: 'text-white',
  secondary: 'text-slate-300',
  muted: 'text-slate-400',
  hint: 'text-slate-500',

  // النصوص الملونة على الخلفية الداكنة
  gold: 'text-amber-400',
  goldBright: 'text-amber-300',
  success: 'text-emerald-400',
  danger: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',

  // النصوص على الخلفية الفاتحة
  onLight: 'text-slate-900',
  onLightSecondary: 'text-slate-700',
  onLightMuted: 'text-slate-500',

  // النصوص على الخلفية الذهبية
  onGold: 'text-black font-bold',
  onGoldDark: 'text-amber-950 font-bold',
} as const;

// تطبيق التباين التلقائي
export const applyContrastFix = (
  element: HTMLElement,
  bgColor?: string
): void => {
  const bg = bgColor ||
    window.getComputedStyle(element).backgroundColor;

  // تحويل rgb إلى hex
  const rgb = bg.match(/\d+/g);
  if (!rgb || rgb.length < 3) return;

  const [r, g, b] = rgb.map(Number);

  // حساب اللمعان (luminance)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // إذا الخلفية داكنة (luminance < 0.5) → نص أبيض
  if (luminance < 0.5) {
    element.style.color = '#ffffff';
  }
  // إذا الخلفية فاتحة → نص داكن
  else if (luminance > 0.7) {
    element.style.color = '#1e293b';
  }
  // متوسطة → نص أبيض
  else {
    element.style.color = '#ffffff';
  }
};
