import React, { useState } from 'react';
import { BookOpen, Video, ChevronDown, ChevronUp, Link as LinkIcon, Cpu, CheckSquare } from 'lucide-react';

export default function PlatformDocumentation() {
  const [openSection, setOpenSection] = useState<string | null>('najiz');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const sections = [
    {
      id: 'najiz',
      title: 'دليل ربط نظام ناجز (وزارة العدل)',
      icon: <LinkIcon className="w-5 h-5" />,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&controls=0', // Placeholder video
      content: (
        <div className="space-y-4">
          <p className="font-bold text-sm text-slate-900 ">
            يتيح لك هذا النظام مزامنة وحفظ جميع الدعاوى والجلسات مباشرة من بوابة ناجز.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-900  font-semibold">
            <li>انتقل إلى قسم "مزامنة ناجز" من القائمة الجانبية.</li>
            <li>قم بإدخال بيانات اعتماد مكتب المستشارين والمحاميين والمستشاريين القانونيين أو رقم الترخيص الخاص بك للتحقق.</li>
            <li>سيتم إرسال رمز تحقق OTP إلى جوالك المسجل في أبشر.</li>
            <li>أدخل الرمز ليتم سحب وتشفير كافة الجلسات والدعاوى تلقائياً خلال دقائق.</li>
          </ol>
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl mt-4">
            <p className="text-xs text-primary font-black">
              ملاحظة هامة: تخضع جميع عمليات الربط لمعايير الأمن السيبراني الوطنية، وتتم معالجة البيانات وتشفيرها محلياً في خوادم سعودية.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'tasks',
      title: 'المهام وتوزيع الأعمال ومتابعة سير الدعاوى المعروضة',
      icon: <CheckSquare className="w-5 h-5" />,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&controls=0',
      content: (
        <div className="space-y-4">
          <p className="font-bold text-sm text-slate-900 ">
            المهام وتوزيع الأعمال اليومية لفريق العمل بالمكتب (عملاء شرعيون، باحثون ومستشارون).
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-900  font-semibold">
            <li>انقر على زر "إضافة مهمة جديدة" لإنشاء مهام مثل "صياغة لائحة" أو "حضور جلسة".</li>
            <li>قم بتعيين المهمة للموظف المختص وحدد الموعد النهائي لتجنب التأخير.</li>
            <li>يمكن ربط المهمة بدعوى محددة لتسهيل الفهرسة والرجوع إليها.</li>
            <li>عند اكتمال المهمة، يقوم الموظف بالنقر على مربع الاختيار لتحديث الحالة.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'ai',
      title: 'مساعد الذكاء الاصطناعي القانوني',
      icon: <Cpu className="w-5 h-5" />,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&controls=0',
      content: (
        <div className="space-y-4">
          <p className="font-bold text-sm text-slate-900 ">
            صياغة اللوائح، تلخيص المذكرات، واستخراج النصوص من الصور (OCR) بسرعة ودقة.
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-900  font-semibold">
            <li>من قسم الذكاء الاصطناعي، يمكنك طرح أي سؤال قانوني مبني على نظام المرافعات الشرعية أو النظم السعودية الأخرى.</li>
            <li>استخدم خاصية "صياغة المذكرات" لتوليد هيكل اللائحة الاعتراضية عبر إدخال معطيات الدعوى.</li>
            <li>في قسم "المستندات"، انقر على "قراءة OCR" بجوار أي مرفق لتحويله إلى نص قابل للبحث (عملي جداً مع الصكوك والقرارات المصورة).</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in" dir="rtl">
      
      {/* Header */}
      <div className="bg-sky-50 border border-slate-200 p-8 rounded-3xl relative overflow-hidden flex items-center justify-between shadow-sm">
        <div className="space-y-2 relative z-10 text-right">
          <h1 className="text-2xl md:text-3xl font-black text-slate-950">دليل الاستخدام</h1>
          <p className="text-sm font-bold text-slate-800">
            فيديوهات تعليمية وخطوات مبسطة لاحتراف جميع مميزات النظام
          </p>
        </div>
        <BookOpen className="w-16 h-16 text-primary opacity-20 relative z-10" />
      </div>

      {/* Accordion Sections */}
      <div className="space-y-4">
        {sections.map(section => (
          <div key={section.id} className="bg-white  border border-slate-800  rounded-2xl overflow-hidden shadow-sm transition-all text-right">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-5  transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${openSection === section.id ? 'bg-[#c5a880] text-slate-950' : 'bg-slate-200 text-slate-800'}`}>
                  {section.icon}
                </div>
                <h3 className="text-lg font-black text-slate-900 ">{section.title}</h3>
              </div>
              {openSection === section.id ? (
                <ChevronUp className="w-5 h-5 text-slate-900" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-900" />
              )}
            </button>
            
            {openSection === section.id && (
              <div className="p-5 pt-0 border-t border-slate-800  flex flex-col md:flex-row gap-6 mt-4">
                <div className="flex-1">
                  {section.content}
                </div>
                <div className="w-full md:w-1/3 shrink-0 rounded-2xl overflow-hidden border border-slate-800  bg-sky-50 aspect-video relative group">
                  <div className="absolute inset-0 flex items-center justify-center bg-black transition-all z-10 pointer-events-none">
                    <Video className="w-10 h-10 text-white" />
                  </div>
                  <iframe 
                    className="w-full h-full relative z-0" 
                    src={section.videoUrl} 
                    title={section.title}
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
    </div>
  );
}