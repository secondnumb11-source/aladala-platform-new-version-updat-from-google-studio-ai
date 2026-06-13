import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X, MousePointer2, Move, Layout, RotateCcw, ChevronRight } from 'lucide-react';

interface InteractionGuideComponentProps {
  onResetLayout: () => void;
}

export default function InteractionGuideComponent({ onResetLayout }: InteractionGuideComponentProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "تخصيص لوحة التحكم",
      description: "يمكنك إعادة ترتيب الكروت بحرية تامة باستخدام السحب والإفلات (Drag & Drop) لتناسب سير عملك الخاص.",
      icon: <Move className="w-6 h-6 text-amber-500" />
    },
    {
      title: "الحيادية والاستجابة",
      description: "تتغير أحجام الرسوم البيانية والجداول تلقائياً عند تغيير حجم الكرت أو ترتيبه لضمان أفضل رؤية للملفات.",
      icon: <Layout className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "استعادة التخطيط",
      description: "في حال حدوث أي تداخل أو إذا رغبت في العودة للتنسيق الأصلي، استخدم زر 'إعادة تعيين' في أعلى الصفحة.",
      icon: <RotateCcw className="w-6 h-6 text-rose-500" />
    }
  ];

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)}
      className="fixed bottom-8 right-8 z-50 p-4 bg-slate-900 border-2 border-amber-500 text-white rounded-full shadow-2xl transition-all group"
      title="دليل المستخدم التفاعلي"
    >
      <Info className="w-6 h-6 transition-transform" />
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-10 right-10 z-[100] w-full max-w-sm bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden"
        dir="rtl"
      >
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <MousePointer2 className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-widest">تلميحات تفاعلية</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-4 bg-slate-50 rounded-3xl inline-block">
                {steps[step].icon}
              </div>
              <h3 className="text-lg font-black text-slate-900">{steps[step].title}</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">{steps[step].description}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-amber-500' : 'w-1.5 bg-slate-200'}`} />
              ))}
            </div>
            
            <div className="flex gap-2">
              {step < steps.length - 1 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black flex items-center gap-2 transition-all"
                >
                  التالي <ChevronRight className="w-3 h-3 rotate-180" />
                </button>
              ) : (
                <button 
                  onClick={() => setIsOpen(false)}
                  className="bg-emerald-500 text-slate-950 px-6 py-2.5 rounded-2xl text-[10px] font-black transition-all"
                >
                  فهمت ذلك
                </button>
              )}
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={onResetLayout}
              className="text-[10px] font-black text-rose-500 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-3 h-3" /> استعادة التخطيط الافتراضي الآن
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
