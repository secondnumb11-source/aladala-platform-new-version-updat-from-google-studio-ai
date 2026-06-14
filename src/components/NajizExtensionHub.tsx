import React, { useState } from 'react';
import { Download, Link as LinkIcon, Zap, CheckCircle2, Copy, Chrome, ShieldAlert, Cpu, Bot, Rocket, BookOpen, Key, Link2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface NajizExtensionHubProps {
  currentUser: any;
  onUpdateState: (type: string, data: any) => void;
}

export default function NajizExtensionHub({ currentUser, onUpdateState }: NajizExtensionHubProps) {
  const [downloading, setDownloading] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();

      // Fetch files from public folder
      const filesUrl = [
        '/najiz-extension/manifest.json',
        '/najiz-extension/popup.html',
        '/najiz-extension/popup.js',
        '/najiz-extension/content.js',
        '/najiz-extension/background.js',
        '/najiz-extension/README-AR.md'
      ];

      for (const url of filesUrl) {
        const response = await fetch(url);
        const text = await response.blob();
        const fileName = url.split('/').pop()!;
        zip.file(fileName, text);
      }

      // Add logo placeholder if icon.png is needed, or just let Chrome use default
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'najiz-extension-justice-platform.zip');

    } catch (e) {
      console.error("Error generating zip: ", e);
      alert('حدث خطأ أثناء تجميع ملف الإضافة للتحميل');
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const currentApiUrl = `https://${window.location.hostname}/api/v1/najiz-sync`;
  const currentApiKey = currentUser?.najizApiKey || currentUser?.id ? `sk_live_${currentUser?.id || 'emp_0'}_${Date.now().toString().slice(0, 5)}` : 'انتظر... تسجيل الدخول مطلوب';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      
      <div className="bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-[#1e40af]/30">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-tight leading-loose">
                 منصة العدالة لإدارة مكاتب المحاماة
              </h1>
              <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-black border border-amber-500/30 flex items-center gap-2">
                 <Bot className="w-3.5 h-3.5" />
                 مدعوم بالذكاء الاصطناعي
              </span>
            </div>
            <p className="text-blue-100/80 text-lg max-w-2xl leading-relaxed">
              قم بتركيب أداة متصفح كروم (Google Chrome Extension) الذكية لجلب مزامنة قضاياك وتحديث جلساتك وأطراف الدعوى من ناجز آلياً.
            </p>
          </div>
          <button 
            onClick={handleDownload}
            disabled={downloading}
            className="shrink-0 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#0f172a] font-black text-lg px-8 py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 disabled:opacity-70 disabled:cursor-wait"
          >
            {downloading ? (
               <span className="flex items-center gap-2 text-base">جارِ التحزيم... ⏳</span>
            ) : (
               <>
                 <Download className="w-6 h-6" />
                 تحميل الأداة (Chrome Extension)
               </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Keys & Connections */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                 <Key className="w-5 h-5 text-amber-500" />
                 مفاتيح الربط الخاصة بك
               </h3>
             </div>
             
             <div className="space-y-4">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <div className="flex justify-between items-center mb-2">
                   <label className="text-xs font-bold text-slate-500">رابط الربط (API URL)</label>
                   <button onClick={() => copyToClipboard(currentApiUrl, 'url')} className="text-blue-600 text-[10px] font-bold flex items-center gap-1 hover:text-blue-700">
                     {copiedKey === 'url' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                     {copiedKey === 'url' ? 'تم النسخ' : 'نسخ'}
                   </button>
                 </div>
                 <input 
                   readOnly
                   value={currentApiUrl}
                   className="w-full bg-transparent text-sm font-mono text-slate-800 outline-none text-left" dir="ltr"
                 />
                 <div className="mt-2 text-[10px] bg-blue-50 text-blue-700 p-2 rounded-xl flex items-center gap-2">
                   <Link2 className="w-3 h-3" />
                   الأداة مصممة لتتوافق مع أي نظام SaaS عبر إدخال هذا الرابط.
                 </div>
               </div>

               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <div className="flex justify-between items-center mb-2">
                   <label className="text-xs font-bold text-slate-500">مفتاح الربط السري (API Key)</label>
                   <button onClick={() => copyToClipboard(currentApiKey, 'key')} className="text-blue-600 text-[10px] font-bold flex items-center gap-1 hover:text-blue-700">
                     {copiedKey === 'key' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                     {copiedKey === 'key' ? 'تم النسخ' : 'نسخ'}
                   </button>
                 </div>
                 <input 
                   type="password"
                   readOnly
                   value={currentApiKey}
                   className="w-full bg-transparent text-sm font-mono text-slate-800 outline-none text-left" dir="ltr"
                 />
                 <p className="text-[10px] text-slate-400 mt-2">انسخ هذا المفتاح وضعه في لوحة تحكم إضافة المتصفح الخاصة بشريط الأدوات.</p>
               </div>
             </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-6 text-blue-900">
             <h4 className="font-black flex items-center gap-2 mb-3">
               <ShieldAlert className="w-5 h-5 text-blue-600" />
               معلومات الخصوصية والأمان
             </h4>
             <ul className="text-xs font-bold space-y-3 opacity-90 leading-relaxed">
               <li className="flex items-start gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                 الأداة تعمل كجسر كشط ذكي بداخل متصفحك ولا تخزن بيانات دخول منصة ناجز.
               </li>
               <li className="flex items-start gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                 يتم توجيه البيانات المسحوبة حصرياً عبر Webhook/API مشفر إلى منصتك.
               </li>
               <li className="flex items-start gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                 تتوافق الأداة مع سياسات المتصفح الحديث للملحقات (Manifest V3).
               </li>
             </ul>
          </div>
        </div>

        {/* Documentation & Steps */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
             <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
               <BookOpen className="w-6 h-6 text-indigo-600" />
               كيفية التثبيت والربط الذكي؟ 
             </h2>
             
             <div className="space-y-6 relative before:absolute before:inset-y-0 before:right-[15px] before:w-[2px] before:bg-slate-100">
                <div className="relative flex items-start gap-6">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm ring-1 ring-slate-100 text-sm">1</div>
                   <div className="pt-1.5">
                     <h3 className="font-black text-slate-900 text-base mb-1">حمّل وقم بفك الحزمة</h3>
                     <p className="text-slate-500 text-sm font-medium">قم بالضغط على زر "تحميل الأداة" بالأعلى. سيتم حفظ ملف بصيغة (ZIP)، قم بفك الضغط عنه في مجلد محفوظ.</p>
                   </div>
                </div>

                <div className="relative flex items-start gap-6">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm ring-1 ring-slate-100 text-sm">2</div>
                   <div className="pt-1.5">
                     <h3 className="font-black text-slate-900 text-base mb-1">ثبّت كوضع مطور في جوجل كروم</h3>
                     <p className="text-slate-500 text-sm font-medium">افتح صفحة الإضافات <span className="bg-slate-100 text-slate-800 px-1 font-mono rounded inline-block" dir="ltr">chrome://extensions/</span> ثم فعّل "وضع المطور". اضغط "تحميل إضافة غير محسومة / Load unpacked" واختر المجلد.</p>
                   </div>
                </div>

                <div className="relative flex items-start gap-6">
                   <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-black flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm ring-1 ring-slate-100 text-sm">3</div>
                   <div className="pt-1.5">
                     <h3 className="font-black text-slate-900 text-base mb-1">أدخل مفاتيح الربط في الأداة</h3>
                     <p className="text-slate-500 text-sm font-medium">انقر على أيقونة الإضافة وافتحها في الشريط العلوي للمتصفح، أدخل رابط الربط ومفتاح الربط (الموجودة في الجدول الجانبي)، واضغط "حفظ".</p>
                   </div>
                </div>

                <div className="relative flex items-start gap-6">
                   <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-black flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm ring-1 ring-slate-100 text-sm">4</div>
                   <div className="pt-1.5">
                     <h3 className="font-black text-slate-900 text-base mb-1">ادخل لـ (ناجز) واضغط السحب الذكي</h3>
                     <p className="text-slate-500 text-sm font-medium">بعد تسجيلك للدخول لحساب ناجز والوصول للصفحة المقصودة، انقر على خيار (مزامنة كافة البيانات). سيقوم كود الذكاء الاصطناعي الخاص بالمنصة بتوزيع الأسماء بملف العملاء والجلسات بمقاعدها تلقائياً.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* AI Features Highlight */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full" />
            <div className="relative z-10">
              <h3 className="text-xl font-black text-amber-400 mb-6 flex items-center gap-2">
                <Cpu className="w-6 h-6" />
                توزيع البيانات بالذكاء الاصطناعي (AI Routing)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                   <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-3">
                     <LinkIcon className="w-5 h-5" />
                   </div>
                   <h4 className="font-black mb-1">توجيه الجلسات</h4>
                   <p className="text-xs text-slate-400 font-medium">يتم سحب التواريخ وتحويلها لصيغة تقويم وربطها بقسم (مواعيد الجلسات) تلقائياً.</p>
                 </div>

                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                   <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                     <Zap className="w-5 h-5" />
                   </div>
                   <h4 className="font-black mb-1">فلترة أطراف الدعوى</h4>
                   <p className="text-xs text-slate-400 font-medium">تُسحب الأسماء وتصنف (موكل، خصم) ثم تدمج مباشرة في قسم (إدارة إدارة العملاء).</p>
                 </div>

                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                   <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-3">
                     <Rocket className="w-5 h-5" />
                   </div>
                   <h4 className="font-black mb-1">إضافة القضايا للمكتب</h4>
                   <p className="text-xs text-slate-400 font-medium">يتم توليد ملف القضية وإدراج الأطراف والمحكمة في قسم (إدارة القضايا) الشامل.</p>
                 </div>

                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                   <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-3">
                     <ShieldAlert className="w-5 h-5" />
                   </div>
                   <h4 className="font-black mb-1">بيانات خالية من التكرار</h4>
                   <p className="text-xs text-slate-400 font-medium">الذكاء الاصطناعي يبحث بالنظام، إذا كانت القضية مسجلة لا يكررها بل يُحدث مسارها.</p>
                 </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
