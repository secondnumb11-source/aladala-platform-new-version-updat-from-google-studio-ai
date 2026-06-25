import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send, User, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';

interface ContactSectionProps {
  isEn: boolean;
}

export default function ContactSection({ isEn }: ContactSectionProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Send Trial Request
      await fetch('/api/trial-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      setSuccess(true);
      setFormData({ name: '', phone: '', email: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(isEn ? "Failed to send message. Please try again." : "فشل إرسال الرسالة، يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 relative z-10 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-right font-sans" dir={isEn ? "ltr" : "rtl"}>
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-2xl mb-4"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.div>
          <h2 className="text-3xl font-display font-black text-slate-900  mb-4">
            {isEn ? "Request a Demo & Contact Us" : "تواصل معنا لطلب تجربة النظام"}
          </h2>
          <p className="text-sm font-bold text-slate-900  max-w-2xl mx-auto">
            {isEn 
              ? "Leave your details below and our technical advisory team will contact you to arrange a full demo of the platform tailored to your firm."
              : "يسعدنا تواصلكم لتقديم عرض شامل يتناسب مع إدارة مكتباتكم القانونية ومناقشة تكامل نظامنا مع عملياتكم."
            }
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 rounded-3xl border shadow-xl bg-[#0a1628] border-slate-800"
        >
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500 text-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 ">
                {isEn ? "Message Sent Successfully!" : "تم إرسال طلبكم بنجاح!"}
              </h3>
              <p className="text-slate-900  font-bold text-sm">
                {isEn ? "We will get back to you shortly." : "سيقوم فريقنا بالتواصل معكم في أقرب وقت لتنسيق موعد التجربة."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900 ">
                    {isEn ? "Full Name" : "الاسم الكامل"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 border-slate-800 text-slate-900`}
                      placeholder={isEn ? "Office / Name" : "اسم المحامي أو المكتب"}
                    />
                    <User className={`absolute top-3.5 w-4 h-4 text-slate-900 ${isEn ? 'left-4' : 'right-4'}`} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900 ">
                    {isEn ? "Phone Number" : "رقم الجوال"}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 border-slate-800 text-slate-900`}
                      placeholder={isEn ? "+966 5..." : "05xxxxxxxx"}
                      dir="ltr"
                    />
                    <Phone className={`absolute top-3.5 w-4 h-4 text-slate-900 ${isEn ? 'left-4' : 'right-4'}`} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900 ">
                  {isEn ? "Email Address" : "البريد الإلكتروني"}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 border-slate-800 text-slate-900`}
                    placeholder="email@lawfirm.com"
                    dir="ltr"
                  />
                  <Mail className={`absolute top-3.5 w-4 h-4 text-slate-900 ${isEn ? 'left-4' : 'right-4'}`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900 ">
                  {isEn ? "Message / Inquiry Details" : "تفاصيل الاستفسار"}
                </label>
                <div className="relative">
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none bg-slate-50 border-slate-800 text-slate-900`}
                    placeholder={isEn ? "How can we help you?" : "اكتب استفسارك هنا، أو اذكر عدد العملاء والمحاميين والمستشاريين القانونيين في المكتب..."}
                  />
                  <FileText className={`absolute top-3.5 w-4 h-4 text-slate-900 ${isEn ? 'left-4' : 'right-4'}`} />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500 border border-red-500 text-red-500 rounded-xl text-xs font-bold text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-light[1.02] active:scale-95 transition-all text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
              >
                {loading ? (
                  <span className="animate-pulse">{isEn ? "Sending..." : "جاري الإرسال..."}</span>
                ) : (
                  <>
                    <Send className={`w-5 h-5 ${isEn ? 'rotate-0' : '-rotate-180'}`} />
                    <span>{isEn ? "Send Request" : "إرسال الطلب"}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
