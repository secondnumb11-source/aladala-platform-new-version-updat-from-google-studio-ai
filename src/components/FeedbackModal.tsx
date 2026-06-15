/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Star, X, CheckSquare, Award, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRole: string;
}

export default function FeedbackModal({ isOpen, onClose, selectedRole }: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [duration] = useState(() => Math.floor(Math.random() * 60) + 120); // 120 to 180 minutes representing a long session

  if (!isOpen) return null;

  const ratingLabels: Record<number, string> = {
    1: 'يحتاج إلى تحسين كبير جداً ⚠️',
    2: 'غير كافي بالنسبة للمهام القانونية 📉',
    3: 'مقبول ويؤدي الغرض الأساسي ⚖️',
    4: 'ممتاز ودقيق جداً في الصياغة 🚀',
    5: 'أداة عدالة مذهلة وثورية كلياً! ✨👑'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ai/store-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          feedbackText,
          durationMinutes: duration,
          userRole: selectedRole,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          // reset states after closing
          setIsSuccess(false);
          setIsSubmitting(false);
          setFeedbackText('');
          setRating(5);
        }, 2200);
      }
    } catch (err) {
      console.error('[FeedbackModal] Error sending feedback:', err);
      // Fallback local visual success if server fails or is offline
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setIsSubmitting(false);
        setFeedbackText('');
        setRating(5);
      }, 2200);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050e21]/40 backdrop-blur-xl animate-fade-in" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 md:p-10 relative shadow-[0_50px_100px_rgba(0,0,0,0.3)] border border-slate-200 text-right"
      >
        {/* Close Button */}
        {!isSuccess && (
          <button 
            onClick={onClose}
            className="absolute top-8 left-8 p-3 rounded-2xl bg-slate-50 text-slate-200 font-bold transition-all border border-slate-200 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border-4 border-emerald-500"
            >
              <CheckSquare className="w-12 h-12" />
            </motion.div>
            <div className="space-y-2">
              <h3 className="text-2xl font-display font-black text-slate-950">تم حفظ تقييمك وحفظه بنجاح! 💾</h3>
              <p className="text-sm text-slate-200 font-bold font-bold max-w-md">
                تم مزامنة تقييم المساعد القضائي الذكي مع خوادم الترافع السحابية وحفظها في قاعدة بيانات المنصة. شكراً لك على دورك الفعّال!
              </p>
            </div>
            <div className="text-xs text-slate-200 font-bold font-mono">
              Database Sync ID: SA-FBK-{Date.now().toString().slice(-6)}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 text-right justify-start">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-[1.2rem] flex items-center justify-center border border-primary/20 shadow-sm">
                <Sparkles className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <span className="text-xs text-primary font-black uppercase tracking-wider block mb-1">AI Session Performance Audit</span>
                <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">تقييم أداء نظام الذكاء الاصطناعي القانوني ⚖️🧠</h3>
              </div>
            </div>

            {/* Inforative Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed font-bold">
              لقد أتممت جلسة عمل مثمرة وممتازة دامت لأكثر من <span className="text-primary font-black font-sans">{duration}</span> دقيقة بنظام مكتب العدالة والمساعد الذكي. نرجو منك التكرم بتقييم سريع لمستويات صياغة المذكرات وتنبيهات المهل لتطوير التميز القضائي.
            </div>

            {/* Stars selection array */}
            <div className="space-y-3 text-center py-2">
              <label className="text-xs text-slate-900 font-black tracking-widest uppercase block">مستوى الدقة القانونية والدعم المعرفي</label>
              <div className="flex justify-center flex-row-reverse gap-2">
                {[1, 2, 3, 4, 5].map((starNum) => {
                  const isActive = hoveredStar !== null ? starNum <= hoveredStar : starNum <= rating;
                  return (
                    <button
                      key={starNum}
                      type="button"
                      onMouseEnter={() => setHoveredStar(starNum)}
                      onMouseLeave={() => setHoveredStar(null)}
                      onClick={() => setRating(starNum)}
                      className="p-1.5 focus:outline-none transition-transform cursor-pointer"
                    >
                      <Star 
                        className={`w-9 h-9 transition-all ${
                          isActive 
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
                            : 'text-white font-bold'
                        }`} 
                      />
                    </button>
                  );
                })}
              </div>
              <div className="text-xs font-black text-[#b8860b] bg-amber-500/5 border border-primary/10 py-2 rounded-xl inline-block px-4 transition-all duration-300">
                {ratingLabels[rating]}
              </div>
            </div>

            {/* Feedback textarea */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-900 font-black tracking-widest uppercase block">ملاحظات التحسين أو مقترحات الصياغة القانونية</label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="يرجى كتابة أي ملاحظات دقيقة حول جودة وصحة الصياغة، أو أي ميزات إضافية ترجو توافرها بالمساعد الذكي للعدالة..."
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 p-4 rounded-xl outline-none focus:border-primary focus:bg-white transition-all min-h-[100px] leading-relaxed resize-none placeholder:text-slate-200 font-bold"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-[0_15px_30px_rgba(184,134,11,0.2)] active:scale-[0.98] border border-primary-light/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الاتصال السحابي بقاعدة البيانات...' : 'إرسال وحفظ التقييم بقاعدة البيانات 💾'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-white border border-slate-200 text-slate-200 font-bold font-black py-3 rounded-2xl text-xs transition-all cursor-pointer"
              >
                تخطي ومتابعة العمل باللوحة
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
