import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles, Smartphone, CheckCircle2, FileText, Send, Clock, Zap } from 'lucide-react';

interface FeaturesInteractiveSectionProps {
  isEn: boolean;
}

export default function FeaturesInteractiveSection({ isEn }: FeaturesInteractiveSectionProps) {
  const [activeFeature, setActiveFeature] = useState<'ai' | 'whatsapp'>('whatsapp');
  
  const bgClass = 'bg-[#f8fafc]';
  const textClass = 'text-slate-900';
  const mutedClass = 'text-slate-900';
  const borderClass = 'border-slate-800';

  return (
    <section className={`py-24 relative z-10 ${bgClass} border-t ${borderClass} overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans" dir={isEn ? "ltr" : "rtl"}>
        
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black mb-4 gap-2 items-center"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isEn ? "Interactive Integrations" : "تفاعل مع الميزات"}</span>
          </motion.div>
          <h2 className={`text-3xl sm:text-4xl font-display font-black ${textClass} mb-4`}>
            {isEn ? "Experience The Future of Legal Tech" : "تقنيات ذكية تعمل نيابة عنك"}
          </h2>
          <p className={`text-sm font-bold ${mutedClass} max-w-2xl mx-auto`}>
            {isEn 
              ? "Discover how our integrated WhatsApp automation and AI drafting engines work together to save you hundreds of hours."
              : "اكتشف كيف يساهم الذكاء الاصطناعي وتكامل الواتساب في توفير مئات الساعات لمكتبك وتحسين التواصل مع موكليك."
            }
          </p>
        </div>

        {/* Interactive Tabs */}
        <div className="flex justify-center mb-12">
          <div className="flex p-1.5 rounded-2xl bg-slate-200">
            <button
              onClick={() => setActiveFeature('whatsapp')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
                activeFeature === 'whatsapp' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : `text-slate-900 hover:${textClass}`
              }`}
            >
              <Smartphone className="w-4 h-4" />
              {isEn ? "WhatsApp Automation" : "أتمتة الواتساب"}
            </button>
            <button
              onClick={() => setActiveFeature('ai')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
                activeFeature === 'ai' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : `text-slate-900 hover:${textClass}`
              }`}
            >
              <Bot className="w-4 h-4" />
              {isEn ? "AI Drafting Engine" : "صياغة المذكرات بالذكاء"}
            </button>
          </div>
        </div>

        {/* Feature Display Area */}
        <div className="relative max-w-5xl mx-auto min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {activeFeature === 'whatsapp' && (
              <motion.div
                key="whatsapp-feature"
                initial={{ opacity: 0, x: isEn ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isEn ? 20 : -20 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
              >
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-emerald-500 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className={`text-2xl font-black ${textClass}`}>
                    {isEn ? "Instantly Alert Clients via WhatsApp" : "تنبيه العملاء فوراً عبر واتساب"}
                  </h3>
                  <p className={`text-sm ${mutedClass} leading-relaxed font-bold`}>
                    {isEn 
                      ? "When a hearing is approaching or an invoice is generated, our system automatically dispatches a branded WhatsApp message. Zero manual work required."
                      : "بمجرد اقتراب موعد جلسة أو صدور تحديث جديد في القضية، يقوم النظام آلياً بإرسال تفاصيل التحديث عبر رسالة احترافية لموكلك."}
                  </p>
                  <ul className="space-y-3 pt-4">
                    {['التنبيه التلقائي قبل الجلسة بـ 24 ساعة', 'إرسال الفواتير الإلكترونية وسندات القبض', 'إشعار العميل بصدور الأحكام وتحديث حالتها'].map((item, i) => (
                      <li key={i} className={`flex items-center gap-3 text-sm font-bold ${textClass}`}>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span>{isEn ? item.replace(/[\u0600-\u06FF]/g, 'Feature ' + (i+1)) : item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Visual Simulation of Phone */}
                <div className="relative mx-auto w-full max-w-[300px]">
                  <div className="absolute inset-0 bg-emerald-500 blur-3xl rounded-full" />
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="relative bg-white  border-8 border-slate-900 rounded-[2.5rem] h-[550px] shadow-2xl p-4 flex flex-col overflow-hidden"
                  >
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-sky-50 rounded-b-2xl z-20" />
                    
                    <div className="flex-1 overflow-y-auto mt-6 space-y-4 pb-4 no-scrollbar">
                      <div className="text-center text-[10px] text-slate-900 font-bold mb-4">اليوم 09:41 ص</div>
                      
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, originY: 1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                        className="bg-emerald-50  text-emerald-900  p-3 rounded-2xl rounded-tr-sm text-xs font-bold w-[85%] relative"
                        style={{ alignSelf: 'flex-start' }}
                      >
                        <p>مرحباً بك من موكل، نتمنى لك يوماً سعيداً.</p>
                        <p className="mt-2 text-[10px] opacity-70">09:41</p>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, originY: 1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 }}
                        className="bg-emerald-50  text-emerald-900  p-3 rounded-2xl rounded-tr-sm text-xs font-bold w-[90%] relative shadow-sm border border-emerald-100 "
                        style={{ alignSelf: 'flex-start' }}
                      >
                        <p className="font-black mb-1 border-b border-emerald-200  pb-1">تذكير بموعد جلسة مقبلة ⚖️</p>
                        <p className="mt-1">رقم القضية: ٤٥٨٢٩</p>
                        <p className="mt-1">الموعد: غداً الساعة ٠٩:٠٠ صباحاً</p>
                        <p className="mt-1">المحكمة: العمالية بالرياض</p>
                        <p className="mt-2 text-[10px] opacity-70">09:42</p>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeFeature === 'ai' && (
              <motion.div
                key="ai-feature"
                initial={{ opacity: 0, x: isEn ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isEn ? 20 : -20 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
              >
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-indigo-100 text-indigo-600">
                    <Bot className="w-6 h-6" />
                  </div>
                  <h3 className={`text-2xl font-black ${textClass}`}>
                    {isEn ? "AI-Powered Legal Drafting" : "صياغة اللوائح القانونية بالذكاء الاصطناعي"}
                  </h3>
                  <p className={`text-sm ${mutedClass} leading-relaxed font-bold`}>
                    {isEn 
                      ? "Formulate entire defense memorandums, customized contracts, and legal reviews in seconds using advanced legal AI models trained on Saudi regulations."
                      : "بناء مسودات اللوائح الاعتراضية وعقود العمل والمذكرات الجوابية في ثوانٍ، بناءً على المعطيات التي تزودها للنظام وتوافقها مع الأنظمة السعودية."}
                  </p>
                  <ul className="space-y-3 pt-4">
                    {['صياغة العقود التجارية والعمالية', 'تحليل ملفات القضية واستخراج الثغرات', 'كتابة مذكرات جوابية بناءً على النظام السعودي'].map((item, i) => (
                      <li key={i} className={`flex items-center gap-3 text-sm font-bold ${textClass}`}>
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-indigo-600" />
                        <span>{isEn ? item.replace(/[\u0600-\u06FF]/g, 'Feature ' + (i+1)) : item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Visual Simulation of AI Editor */}
                <div className="relative mx-auto w-full">
                  <div className="absolute inset-0 blur-3xl rounded-full bg-indigo-500" />
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="relative rounded-2xl overflow-hidden shadow-2xl border bg-white border-slate-800"
                  >
                    {/* Editor Header */}
                    <div className="px-4 py-3 border-b flex items-center justify-between bg-slate-50 border-slate-800">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                      </div>
                      <div className="text-xs font-bold flex items-center gap-2 text-indigo-600 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isEn ? "AI is generating..." : "الذكاء الاصطناعي يكتب..."}</span>
                      </div>
                    </div>
                    
                    {/* Editor Body */}
                    <div className="p-6 h-[300px] overflow-hidden">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: "100%" }}
                        transition={{ duration: 3, ease: "linear" }}
                        className="overflow-hidden"
                      >
                        <h4 className={`text-base font-black mb-4 ${textClass}`}>{isEn ? "Defense Memorandum" : "لائحة اعتراضية على حكم قضائي"}</h4>
                        <p className={`text-sm ${mutedClass} leading-loose font-bold mb-3`}>
                          {isEn ? "Based on Article 34 of the Labor Law..." : "استناداً إلى أحكام المادة الرابعة والثلاثين من نظام المرافعات الشرعية، نتقدم بهذ اللائحة... "}
                        </p>
                        <p className={`text-sm ${mutedClass} leading-loose font-bold mb-3`}>
                          {isEn ? "The defendant claims..." : "وحيث أن المدعي قد تأسس في دعواه على مطالبات مالية لم يُقدم ما يثبت أصل الحق فيها..."}
                        </p>
                        <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse mt-4"></div>
                        <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse mt-3"></div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
