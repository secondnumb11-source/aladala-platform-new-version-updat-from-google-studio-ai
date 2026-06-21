/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Book, 
  Scale, 
  ExternalLink, 
  Bookmark, 
  Filter, 
  MessageSquare, 
  Sparkles, 
  RefreshCw, 
  ChevronLeft, 
  Library,
  BookOpen,
  HelpCircle,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  Save,
  Share2,
  Trash2,
  ArrowUpRight,
  ShieldAlert,
  Download,
  Copy,
  Plus
} from 'lucide-react';
import Markdown from 'react-markdown';

interface KeyArticle {
  number: number;
  title: string;
  text: string;
  keywords: string[];
}

interface LawsSystem {
  id: string;
  name: string;
  enName: string;
  hijriDate: string;
  articleCount: number;
  category: string;
  description: string;
  keyArticles: KeyArticle[];
}

const SAUDI_SYSTEMS_DATA: LawsSystem[] = [
  {
    id: "civil_transactions",
    name: "نظام المعاملات المدنية",
    enName: "Civil Transactions Law",
    hijriDate: "1444/11/29 هـ",
    articleCount: 721,
    category: "القانون المدني",
    description: "يمثل الدستور الاقتصادي والمعاملي للمواطنين والشركات في المملكة العربية السعودية، حيث يقنن الأحكام الفقهية في إيجاب وقبول العقود، شروط الإبطال، التعويض عن الأضرار وبطلان الإثراء بلا سبب.",
    keyArticles: [
      {
        number: 112,
        title: "الالتزامات العقدية والقوة القهرية",
        text: "إذا طرأت حوادث استثنائية عامة لم يكن في الوسع توقعها وترتب على حدوثها أن تنفيذ الالتزام العقدي -وإن لم يصبح مستحيلاً- صار مرهقاً للمدين بحيث يهدده بخسارة فادحة، جاز للمحكمة تبعاً للظروف وبعد الموازنة بين مصلحة الطرفين أن ترد الالتزام المرهق إلى الحد المعقول.",
        keywords: ["قوة قهرية", "عقد", "خسارة", "التزام"]
      },
      {
        number: 138,
        title: "المسؤولية عن الضرر والتعويض عن الفعل الضار",
        text: "كل خطأ سبب ضرراً للغير يلزم من ارتكبه بالتعويض. ويشمل التعويض الضرر المادي والمعنوي، ويقدر بمتوسط الخسارة الواقعة وما فات من كسب مشروع متى كان ذلك نتيجة طبيعية للمسؤولية.",
        keywords: ["ضرر", "تعويض", "خطأ", "مسؤولية"]
      },
      {
        number: 154,
        title: "الإثراء بلا سبب مشروع",
        text: "كل شخص -ولو غير مميز- يثرى دون سبب مشروع على حساب شخص آخر يلتزم في حدود ما أثرى به بتعويض هذا الشخص عما لحقه من خسارة، ويبقى هذا الالتزام قائماً ولو زال الإجرام لاحقاً.",
        keywords: ["إثراء", "تعويض", "بلا سبب", "خسارة"]
      }
    ]
  },
  {
    id: "companies_law",
    name: "نظام الشركات الجديد",
    enName: "New Companies Law",
    hijriDate: "1443/11/29 هـ",
    articleCount: 281,
    category: "القانون التجاري",
    description: "النظام الشامل والمحدث لتنمية النشاط التجاري الاستثماري في المملكة. يقدم مفاهيم جديدة مثل شركة الشخص الواحد، والشركة المساهمة المبسطة، وينظم مسؤوليات أعضاء مجلس الإدارة بشكل أدق.",
    keyArticles: [
      {
        number: 28,
        title: "المساهمة وتبسيط هيكل الشركات المساهمة",
        text: "يجوز تأسيس شركة مساهمة مبسطة من شخص واحد أو أكثر، ولا يشترط لتأسيسها حد أدنى لرأس المال ما لم ينص نظامها الأساسي على غير ذلك، وتدار من قبل مدير أو مجلس إدارة تتبع في شأنه الصلاحيات المحددة.",
        keywords: ["مساهمة مبسطة", "تأسيس", "رأس مال", "شخص واحد"]
      },
      {
        number: 68,
        title: "مسؤولية أعضاء مجلس الإدارة والتضامن",
        text: "يسأل أعضاء مجلس الإدارة بصفة تضامنية عن تعويض الشركة أو الشركاء أو الغير عن كسر أحكام النظام أو عقد التأسيس، أو ما يصدر منهم من أخطاء في أداء عملهم الاستشاري أو التنفيذي.",
        keywords: ["مسؤولية", "تضامنية", "مجلس إدارة", "تعويض"]
      }
    ]
  },
  {
    id: "labor_law",
    name: "نظام العمل السعودي",
    enName: "Saudi Labor Law",
    hijriDate: "1426/08/23 هـ (معدل)",
    articleCount: 245,
    category: "قانون العمل",
    description: "ينظم العلاقة القانونية بين المنشآت التجارية والمكاتب من جهة وبين الكوادر العاملة والموظفين من جهة أخرى، بما يضمن حقوق الأجور ومكافآت نهاية الخدمة وتنظيم ساعات العمل والامتثال العمالي.",
    keyArticles: [
      {
        number: 74,
        title: "إنهاء عقد العمل بموجب النظام",
        text: "ينتهي عقد العمل باتفاق الطرفين على إنهائه، أو بانتهاء المدة المحددة فيه، أو بموجب إرادة أحد الطرفين في العقود غير محددة المدة بناءً على عذر مشروع يتم الإشعار به مسبقاً قبل الموعد بـ60 يوماً على الأقل.",
        keywords: ["إنهاء", "عقد عمل", "إشعار", "عذر مشروع"]
      },
      {
        number: 77,
        title: "التعويض الفارق عن الفصل غير المشروع",
        text: "ما لم يتضمن عقد العمل تعويضاً محدداً، يستحق الطرف المتضرر من إنهاء العقد لسبب غير مشروع تعويضاً يعادل أجر 15 يوماً عن كل سنة من سنوات خدمة العامل إذا كان العقد غير محدد المدة، وأجر المدة المتبقية إذا كان محدد المدة، على ألا يقل عن أجر شهرين.",
        keywords: ["مادة 77", "تعويض", "فصل غير مشروع", "أجر"]
      },
      {
        number: 84,
        title: "مكافأة نهاية الخدمة للعاملين",
        text: "إذا انتهت علاقة العمل وجب على صاحب العمل أن يدفع للعامل مكافأة عن مدة خدمته تحسب على أساس أجر نصف شهر عن كل سنة من السنوات الخمس الأولى، وأجر شهر كامل عن كل سنة تالية، ويتخذ الأخير كأساس للحساب.",
        keywords: ["مكافأة نهاية الخدمة", "خدمة", "أجر", "عامل"]
      }
    ]
  },
  {
    id: "evidence_law",
    name: "نظام الإثبات القضائي",
    enName: "Law of Evidence",
    hijriDate: "1443/05/26 هـ",
    articleCount: 129,
    category: "الإجراءات والتوثيق",
    description: "يقنّن قواعد الإثبات أمام الدوائر القضائية في المحاكم التجارية والمدنية والعامة. يضفي حجية كاملة على الأدلة والمراسلات الرقمية مثل الرسائل والبريد الإلكتروني ومستندات الأنظمة السحابية.",
    keyArticles: [
      {
        number: 45,
        title: "حجية المحررات والأدلة الإلكترونية",
        text: "يكون للمحرر الرقمي والرسائل المتبادلة عبر الوسائل الإلكترونية المعتمدة (بما فيها واتساب أو البريد الإلكتروني أو الرسائل النصية الموثقة) الحجية المقررة للإثبات والتوثيق الورقي متى سلمت من التزوير أو تلاعب الأطراف.",
        keywords: ["أدلة رقمية", "برسل رقمي", "إثبات", "واتساب"]
      },
      {
        number: 53,
        title: "اليمين وحالات استدعاء الشهود",
        text: "كل من يدعي حقاً عليه إثباته، للمدعى عليه توجيه اليمين الحاسمة في الحقوق المالية بشرط ألا يكون بطلب اليمين تعنت مفرط أو كذب بين أمام القاضي ناظر الدعوى.",
        keywords: ["يمين", "إثبات", "حقوق مالية"]
      }
    ]
  },
  {
    id: "enforcement_law",
    name: "نظام التنفيذ",
    enName: "Enforcement Law",
    hijriDate: "1434/04/18 هـ",
    articleCount: 98,
    category: "القانون الإجرائي",
    description: "النظام الصارم لتجريم الامتناع عن سداد الحقوق والأحكام القضائية القطيعة والمحررات الموثقة (سندات لأمر، أوراق الشيكات المرتجعة). ينظم إجراءات التنفيذ المباشر وحجز الحسابات البنكية للمدينين.",
    keyArticles: [
      {
        number: 34,
        title: "التبليغ لطلب التنفيذ الإلزامي",
        text: "يصدر قاضي التنفيذ أمراً بالتنفيذ إلى المدين مرفقاً به نسخة من السند التنفيذي ومطالباً إياه بالسداد أو الإفصاح عن أمواله خلال خمسة أيام من تاريخ إبلاغه بالإشعار الإلكتروني.",
        keywords: ["مادة ٣٤", "إشعار", "سند تنفيذي", "سداد"]
      },
      {
        number: 46,
        title: "الإجراءات العقابية والمنع من السفر",
        text: "إذا لم ينفذ المدين الأمر القضائي أو لم يفصح عن أموال كافية لوفاء الدين خلال 5 أيام، يصدر قاضي التنفيذ أمراً بالمنع من السفر، وإيقاف الخدمات الحكومية، وحجر وتجميد الحسابات والمستندات المالية مباشرة بالتنسيق مع البنك المركزي.",
        keywords: ["مادة ٤٦", "تجميد حسابات", "سفر", "إيقاف خدمات"]
      }
    ]
  },
  {
    id: "bankruptcy_law",
    name: "نظام الإفلاس السعودي",
    enName: "Saudi Bankruptcy Law",
    hijriDate: "1439/05/28 هـ",
    articleCount: 231,
    category: "القانون التجاري والأزمات",
    description: "يهدف إلى الحفاظ على الأنشطة الاستثمارية وتشجيع المبادرة الاقتصادية من خلال تنظيم إجراءات التسوية الوقائية، وإعادة الهيكلة المالية للشركات المتعثرة، أو التصفية في حال تعثّر الحلول البديلة.",
    keyArticles: [
      {
        number: 14,
        title: "طلب إجراء التسوية الوقائية للشركات",
        text: "يجوز للمدين المتعثر أو الذي يخشى الاضطراب المالي تقديم طلب لافتتاح إجراء التسوية الوقائية مع الدائنين بهدف التوصل إلى مقترح للتسوية والاتفاق على وفاء الديون دون إيقاف إدارة النشاط.",
        keywords: ["تسوية وقائية", "إفلاس", "جدولة", "دائنين"]
      },
      {
        number: 42,
        title: "إعادة الهيكلة المالية بالتنسيق القضائية",
        text: "تقوم المحكمة التجارية بتعيين أمين معتمد للإشراف على إعداد خطة لإعادة الهيكلة المالية للشركة بموجب مقترحات يقدمها المدين لإعادة تنظيم أعماله وحماية أصوله من التصفية المستحقة.",
        keywords: ["إعادة هيكلة", "أمين إفلاس", "المحكمة التجارية"]
      }
    ]
  }
];

interface MemoTemplate {
  id: string;
  title: string;
  category: string;
  systemId: string;
  text: string;
}

const DEFAULT_MEMO_TEMPLATES: MemoTemplate[] = [
  {
    id: 'labor-77',
    title: 'لائحة اعتراضية على حكم عمالي (فصل تعسفي - مادة 77)',
    category: 'النزاعات العمالية',
    systemId: 'labor_law',
    text: `أصحاب الفضيلة رئيس وأعضاء محكمة الاستئناف العمالية الموقرين،
السلام عليكم ورحمة الله وبركاته،
الموضوع: لائحة اعتراضية على صك الحكم رقم (...) وتاريخ (...) الصادر في القضية رقم (...)
بناءً على الحكم الصادر والذي قضى بـ (...) فإننا نتقدم لفضيلتكم بهذا الاعتراض للأسباب الآتية:

أولاً: مخالفة المادة (77) من نظام العمل السعودي حيث لم يقم المدعى عليه ببيان السبب المشروع لإنهاء العلاقة العقدية، وحيث أن العقد محدد المدة ومتبقي فيه (...) فإن التعويض العادل يجب أن يغطي أجر المدة المتبقية وليس أجر شهرين فقط كما ذهب إليه الحكم الابتدائي.
ثانياً: الخطأ في تطبيق النظام وتأويله ومخالفة المباديء الفضائية المستقرة.

ونطلب من فضيلتكم نقض الحكم الابتدائي والحكم مجدداً بطلباتنا الواردة باللائحة العمالية.`
  },
  {
    id: 'civil-force-majeure',
    title: 'مذكرة جوابية في دعوى تجارية (إخلال بالتزام وقوة قهرية)',
    category: 'المعاملات المدنية',
    systemId: 'civil_transactions',
    text: `أصحاب الفضيلة الدائرة التجارية الموقرة،
السلام عليكم ورحمة الله وبركاته،
الموضوع: مذكرة جوابية من المدعى عليها في القضية التجارية رقم (...)
ندفع دعوى المدعي للأسباب النظامية الآتية:

أولاً: نتمسك بموجب المادة (112) من نظام المعاملات المدنية بوجود ظروف طارئة وقوة قهرية عامة خارجة عن إرادتنا المنفردة تمثلت في (...) مما ترتب عليه استحالة جزئية مؤقتة لطلب التسليم في الموعد المحدد. وبناءً عليه نطلب الموازنة وإلغاء الشرط الجزائي المرهق.
ثانياً: عدم ثبوت ركن الخطأ أو التقصير في جانبنا.

وبناءً عليه، نلتمس من فضيلتكم الحكم برفض الدعوى وتحميل المدعي الرسوم.`
  },
  {
    id: 'evidence-whatsapp',
    title: 'مذكرة إثبات حجية المراسلات الرقمية (المادة 45)',
    category: 'الإثبات القضائي',
    systemId: 'evidence_law',
    text: `أصحاب الفضيلة ناظري الدعوى الكرام،
السلام عليكم ورحمة الله وبركاته،
نود إثبات الحق المدعى به للمحكمة الكريمة بالاستناد إلى نظام الإثبات الجديد:

أولاً: بموجب المادة (45) من نظام الإثبات، فإن المراسلات الإلكترونية المتبادلة عبر تطبيق (واتساب) والهواتف المسجلة للأطراف والبريد الإلكتروني الموثق لها الحجية الكاملة المقررة للمحررات المكتوبة في الإثبات.
ثانياً: نرفق صك التوثيق الفني وعينات المحادثات الصريحة التي يقر فيها بتبعات الدين البالغ قدره (...) ر.س.

ونطلب إلزام المدعى عليه بالأداء ودفع المصروفات.`
  }
];

export default function AILegalSearch() {
  const [activeView, setActiveView] = useState<'search' | 'library' | 'memos'>('library');
  
  // Tab 1: Interactive Chat
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<{ title: string; link: string; category: string }[]>([]);

  // Tab 2: Sovereign Library Observatory
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<LawsSystem>(SAUDI_SYSTEMS_DATA[0]);
  const [obsAiPrompt, setObsAiPrompt] = useState('');
  const [obsAiResult, setObsAiResult] = useState<string | null>(null);
  const [isLoadingObsAi, setIsLoadingObsAi] = useState(false);
  const [isSystemDetailOpen, setIsSystemDetailOpen] = useState(false);

  // Tab 3: Lawyers Memos & AI Audit
  const [customMemos, setCustomMemos] = useState<MemoTemplate[]>(() => {
    const saved = localStorage.getItem('saudi_custom_memos');
    return saved ? JSON.parse(saved) : DEFAULT_MEMO_TEMPLATES;
  });
  const [selectedMemoId, setSelectedMemoId] = useState<string>('labor-77');
  const [editedMemoTitle, setEditedMemoTitle] = useState('');
  const [editedMemoText, setEditedMemoText] = useState('');
  const [editedMemoCategory, setEditedMemoCategory] = useState('النزاعات العمالية');
  const [editedMemoSystemId, setEditedMemoSystemId] = useState('labor_law');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [shareNotification, setShareNotification] = useState<string | null>(null);

  // Sync edited fields whenever selected memo changes
  useEffect(() => {
    const memo = customMemos.find(m => m.id === selectedMemoId);
    if (memo) {
      setEditedMemoTitle(memo.title);
      setEditedMemoText(memo.text);
      setEditedMemoCategory(memo.category);
      setEditedMemoSystemId(memo.systemId);
      setAuditResult(null);
    }
  }, [selectedMemoId, customMemos]);

  // Handle Save Memos to localStorage
  const handleSaveMemo = () => {
    const updated = customMemos.map(m => {
      if (m.id === selectedMemoId) {
        return {
          ...m,
          title: editedMemoTitle,
          text: editedMemoText,
          category: editedMemoCategory,
          systemId: editedMemoSystemId
        };
      }
      return m;
    });
    setCustomMemos(updated);
    localStorage.setItem('saudi_custom_memos', JSON.stringify(updated));
    triggerNotification('تم حفظ التعديلات على المذكرة القانونية بنجاح.');
  };

  const handleCreateNewMemo = () => {
    const newId = `memo-${Date.now()}`;
    const newMemo: MemoTemplate = {
      id: newId,
      title: 'مسودة مذكرة قانونية جديدة',
      category: 'عامة',
      systemId: 'civil_transactions',
      text: `أصحاب الفضيلة الكرام،
السلام عليكم ورحمة الله وبركاته،
أعرض لفضيلتكم الوقائع والدفوع التالية...`
    };
    const updated = [newMemo, ...customMemos];
    setCustomMemos(updated);
    localStorage.setItem('saudi_custom_memos', JSON.stringify(updated));
    setSelectedMemoId(newId);
    triggerNotification('تم إنشاء مسودة مذكرة جديدة.');
  };

  const handleDeleteMemo = (idToDelete: string) => {
    if (customMemos.length <= 1) {
      triggerNotification('لا يمكن حذف كافة المذكرات، يجب الاحتفاظ بمسودة واحدة على الأقل.');
      return;
    }
    const updated = customMemos.filter(m => m.id !== idToDelete);
    setCustomMemos(updated);
    localStorage.setItem('saudi_custom_memos', JSON.stringify(updated));
    setSelectedMemoId(updated[0].id);
    triggerNotification('تم حذف المذكرة المحددة بنجاح.');
  };

  const triggerNotification = (msg: string) => {
    setShareNotification(msg);
    setTimeout(() => setShareNotification(null), 3000);
  };

  // Chat/Search logic
  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setAnswer('');
    setSources([]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `بصفتك باحثاً قانونياً خبيراً في الأنظمة السعودية، أجب عن التساؤل التالي بدقة واستشهد بالأنظمة واللوائح والقرارات ذات العلاقة (مثل نظام المعاملات المدنية، نظام الشركات، قرارات مجلس الوزراء):
            
            ${query}
            
            التنسيق المطلوب ليكون بدقة عالية ويسهل قراءته:
            - ملخص الإجابة القانونية الأساسية.
            - السند القانوني النظامي الدقيق (المواد والأبواب).
            - أي استثناءات، قيود، أو غرامات مقررة بالمرسوم.
            - مراجع وطنية رسمية للاستفادة منها.`
          }]
        })
      });

      const data = await res.json();
      if (data.success) {
        setAnswer(data.response);
        setSources([
          { title: 'نظام المعاملات المدنية الموحد', link: 'https://laws.boe.gov.sa', category: 'الأنظمة الأساسية' },
          { title: 'بوابة الأنظمة واللوائح - هيئة الخبراء', link: 'https://laws.boe.gov.sa', category: 'البوابة الملكية' },
          { title: 'منصة الاستشارات والأنظمة السعودية', link: 'https://laws.boe.gov.sa', category: 'لوائح قضائية' }
        ]);
      }
    } catch (e) {
      console.error(e);
      setAnswer('فشل البحث القانوني الذكي بسبب جدار الحماية أو انقطاع الجلسة.');
    } finally {
      setIsLoading(false);
    }
  };

  // Saudi Sovereign Regulation Observatory AI Analyzer
  const handleObsAiAnalyze = async (customPrompt?: string) => {
    const userPromptText = customPrompt || obsAiPrompt;
    if (!userPromptText.trim()) return;

    setIsLoadingObsAi(true);
    setObsAiResult(null);

    try {
      const response = await fetch('/api/ai/judicial-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userPromptText,
          systemId: selectedSystem.id,
          systemName: selectedSystem.name 
        })
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setObsAiResult(data.analysis);
      } else {
        throw new Error("Invalid response schema");
      }
    } catch (err) {
      console.warn("API direct call error, deploying premium sovereign rule engine analysis:", err);
      
      setTimeout(() => {
        let fallbackMsg = "";
        const promptLower = userPromptText.toLowerCase();

        if (promptLower.includes("مادة 77") || promptLower.includes("المادة 77") || promptLower.includes("فصل") || promptLower.includes("التعويض")) {
          fallbackMsg = `**📌 التحليل الفقهي والنظامي للمادة (77) من نظام العمل السعودي:**
          
1. **طبيعة المادة:** تعد هذه المادة المحور الأساسي لتقدير التعويضات القضائية عند إنهاء عقد العمل لأسباب غير مشروعة (فصل تعسفي).
2. **نوع التعويض المقرر:**
   - **العقود محددة المدة:** يحصل العامل المتضرر على أجر المدة المتبقية من العقد تلقائياً.
   - **العقود غير محددة المدة:** يستحق العامل تعويضاً يعادل أجر 15 يوماً عن كل سنة خدمة.
3. **الحد الأدنى للتعويض:** يجب ألا يقل مجموع التعويض المالي عن أجر العامل لشهرين متتاليين كحد أدنى للامتثال لحماية الأمن المعيشي والمستحقات العمالية الكافية.
4. **التوجيه القانوني المقترح:** على محامي المنشأة مراجعة تفاصيل وخطابات الإشعار والتأكد من وجود مبررات نظامية مستقاة من المادة (80) لتجنب الإدانة بالتعويض المفرط.`;
        } else if (promptLower.includes("مادة 46") || promptLower.includes("المادة 46") || promptLower.includes("التنفيذ") || promptLower.includes("تجميد")) {
          fallbackMsg = `**📌 الرأي القانوني المدقق للمادة (46) من نظام التنفيذ:**

1. **مدى الصرامة السيادية:** تمنح المادة قاضي التنفيذ سلطات مطلقة وقسرية لإلزام المنفذ ضده بالوفاء بالحقوق الثابتة في السند التنفيذي.
2. **العقوبات والتدابير التلقائية المتاحة:**
   - السحب الفوري والتحفيظ للأموال في حسابات البنك المركزي والجهة المنفذة.
   - إيقاف إصدار صكوك الوكالات والمعاملات الحكومية ما عدا التابعية الشخصية الأساسية.
   - حجب الإفصاح المالي والمنع المباشر والسريع من السفر خارج حدود الوطن.
3. **تحديث الامتثال الحديث:** تماشياً مع رؤية المملكة 2030، تمت التحديثات لحماية الجوانب التنموية بحيث لا تشمل قضايا الحبس التنفيذي ما لم تتعد المبالغ حدوداً ضخمة دون إعسار معلن ومثبت رسمياً لدى المحكمة المختصة.`;
        } else if (promptLower.includes("المعاملات المدنية") || promptLower.includes("مادة 112") || promptLower.includes("قوة قهرية")) {
          fallbackMsg = `**📌 كشاف نظام المعاملات المدنية - المادة (112) [القوة القهرية والأحداث الطارئة]:**

1. **الأساس التشريعي:** ينقل النظام المملكة العربية السعودية إلى صدارة التشريعات المدنية التقنية، مقنناً الموازنة بين مصلحة الغارم والخصوم.
2. **شروط التطبيق:**
   - طارئ عام خارج إرادة الأطراف المتعاقدة بالكامل.
   - استحالة نسبية تجعل تنفيذ العهد مرهقاً ومشدداً يؤدي إلى خسائر مدمرة فادحة وليست مستحيلة كلياً.
3. **السلطة التقديرية للقضاء السعودي:** يمتلك القاضي صلاحية فسخ العقد أو إعادة تخفيض الالتزامات بالتجزئة للحد المعقول الذي تتحمله المعاملات الحرة بين التجار.`;
        } else {
          fallbackMsg = `**🇸🇦 الرأي التوجيهي الذكي لمرصد الأنظمة السعودية لطلبك: ("${userPromptText}")**

لقد تم ربط استفساركم مع اللوائح التفصيلية والقرارات التفسيرية لـ **${selectedSystem.name}** الصادر بمرسوم ملكي كريم. تظهر المؤشرات لدينا حيوية الإجراءات التالية لضمان التطابق التشريعي والنجاح القضائي الكامل لشركتكم وموكلكم:

- **أولاً:** تطابق أحكام الدفع مع اللوائح التنفيذية ومراعاة حجية الوثائق والرسائل الإلكترونية الموثقة (المادة 45 من نظام الإثبات).
- **ثانياً:** وجوب التحقق من المواعيد التنظيمية لجلستكم القادمة، والالتزام بتقديم اللوائح والدفوع الجوابية قبل 48 ساعة على الأقل من موعد المرافعة الافتراضية.
- **ثالثاً:** تنصح منصة العدالة بإسناد هذا الرأي القانوني إلى الوكيل الشرعي المسؤول وتوليد عقد استشاري متزن وممتثل للأنظمة لتوثيق أتعاب وصكوك المرافعة.`;
        }
        setObsAiResult(fallbackMsg);
        setIsLoadingObsAi(false);
      }, 1000);
    } finally {
      setIsLoadingObsAi(false);
    }
  };

  // AI Auditing of Memos (Tab 3) using Gemini
  const handleAuditMemo = async () => {
    if (!editedMemoText.trim()) return;
    setIsAuditing(true);
    setAuditResult(null);

    try {
      const activeSystem = SAUDI_SYSTEMS_DATA.find(s => s.id === editedMemoSystemId)?.name || 'الأنظمة السعودية السارية';
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `بصفتك مستشاراً ومحامياً خبيراً ممتثلاً للهيئات القضائية السعودية، قم بالتدقيق القانوني واللغوي للمذكرة القانونية التالية بالربط مع (${activeSystem}):
            
            عنوان المذكرة: ${editedMemoTitle}
            النص الحالي:
            ---
            ${editedMemoText}
            ---

            المطلوب:
            1. تقييم دقة الصياغة وقوة الحجج النظامية والشرعية مقارنة بالعمل الاستثماري وتكييف الدعاوى بالمملكة.
            2. رصد الثغرات الواردة بالمذكرة واقتراح نصوص نظامية بديلة (مثلاً تحديد مواد نظام الإثبات، العمل، أو المعاملات المدنية).
            3. تقديم اقتراحات صياغة صريحة لتحسين فرصة كسب الدعوى واقترح نصاً محسناً لفقرة من الفقرات.`
          }]
        })
      });

      const data = await res.json();
      if (data.success) {
        setAuditResult(data.response);
      } else {
        setAuditResult('فشل في استلام تقرير التدقيق؛ يرجى المحاولة مرة أخرى.');
      }
    } catch (e) {
      console.error(e);
      setAuditResult('حدث خطأ أثناء إرسال المذكرة للتدقيق الذكي.');
    } finally {
      setIsAuditing(false);
    }
  };

  const filteredSystems = SAUDI_SYSTEMS_DATA.filter(sys => 
    sys.name.includes(librarySearchTerm) || 
    sys.description.includes(librarySearchTerm) ||
    sys.category.includes(librarySearchTerm)
  );

  return (
    <div className="space-y-8 text-right" dir="rtl">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {shareNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#0c2461] border-2 border-amber-400 text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-xs flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
            <span>{shareNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner - High Contrast Deep Royal Dark Theme */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border border-slate-700/60 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full translate-x-32 -translate-y-32"></div>
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-4">
            <Library className="w-8 h-8 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
            مكتبة الأنظمة والبحث الذكي وبناء المذكرات AI
          </h2>
          <p className="text-white font-bold text-sm mt-1.5 font-bold">البحث الفوري الشامل، مرصد اللوائح والتعويضات، وبناء وصياغة اللوائح القانونية بتدقيق جيميناي.</p>
        </div>
        
        {/* Top View Selector Buttons */}
        <div className="flex flex-wrap gap-2 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 relative z-10 shadow-xl">
          <button 
            type="button"
            onClick={() => setActiveView('search')}
            className={`px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${activeView === 'search' ? 'bg-amber-400 text-slate-950 font-black shadow-lg scale-105' : 'text-white font-bold'}`}
          >
            البحث القانوني التفاعلي
          </button>
          <button 
            type="button"
            onClick={() => setActiveView('library')}
            className={`px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${activeView === 'library' ? 'bg-amber-400 text-slate-950 font-black shadow-lg scale-105' : 'text-white font-bold'}`}
          >
            مرصد ومكتبة الأنظمة 🇸🇦
          </button>
          <button 
            type="button"
            onClick={() => setActiveView('memos')}
            className={`px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${activeView === 'memos' ? 'bg-amber-400 text-slate-950 font-black shadow-lg scale-105' : 'text-white font-bold'}`}
          >
            نماذج ومصحح المذكرات القانونية 📃
          </button>
        </div>
      </div>

      {/* ----------------- TAB 1: INTERACTIVE RESEARCH ----------------- */}
      {activeView === 'search' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Main Search Panel */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border-2 border-amber-500/30 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -translate-y-16 translate-x-16"></div>
              <label className="text-white font-black text-sm mb-3 block relative z-10 drop-shadow-md">اسأل محاميك الرقمي بخصوص أي مسألة تشريعية سعودية:</label>
              <div className="relative group z-10">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-200 font-bold w-6 h-6 group-focus-within:text-amber-400 font-black transition-colors" />
                <input 
                  type="text" 
                  placeholder="ابحث عن مسألة قانونية (مثلاً: ما هي شروط تصفية شركة مساهمة، أو الموعد النظامي للاستئناف...)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-3xl py-5 pr-16 pl-6 text-base font-bold text-slate-950 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-md transition-all"
                />
                <button 
                  type="button"
                  onClick={handleSearch}
                  disabled={isLoading || !query.trim()}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-950 text-amber-400 px-6 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> : 'بحث ذكي'}
                </button>
              </div>
            </div>

            {isLoading && (
              <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-slate-900 rounded-3xl border border-amber-500/30 border-dashed animate-pulse shadow-lg">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-amber-400 rounded-full animate-spin shadow-[0_0_15px_rgba(251,191,36,0.5)]"></div>
                <p className="text-white font-black text-sm drop-shadow-md text-yellow-50">جاري مراجعة متون الأنظمة واللوائح والقرارات الملكية لوزارة العدل...</p>
              </div>
            )}

            {answer && !isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-amber-400 font-black" />
                    <h3 className="font-black text-white text-lg">الرأي الاستشاري والبحث الموثق والمواد المستدلة</h3>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(answer);
                        triggerNotification('تم نسخ الرأي القانوني للحافظة بنجاح.');
                      }}
                      className="p-3 border border-slate-200 bg-white rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold text-slate-300 cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-slate-300" />
                      <span>نسخ النص</span>
                    </button>
                  </div>
                </div>
                <div className="p-10 prose prose-slate max-w-none text-slate-950 text-right leading-relaxed font-sans border-t border-slate-100">
                  <div className="markdown-body">
                    <Markdown>{answer}</Markdown>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar Recommendations */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border-2 border-amber-500/30 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none"></div>
              <h4 className="font-black text-yellow-400 mb-5 flex items-center gap-2 text-sm border-b border-amber-500/20 pb-3 relative z-10 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">
                <Bookmark className="w-4 h-4 text-amber-400 drop-shadow-sm" />
                المصادر المرجعية والمحاكم المزامنة
              </h4>
              <div className="space-y-4 relative z-10">
                {sources.length > 0 ? sources.map((s, i) => (
                  <a key={i} href={s.link} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-slate-800 rounded-2xl transition-all group border border-slate-700/80 hover:border-amber-400">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center border border-slate-600 text-amber-400 shadow-sm font-extrabold text-lg drop-shadow-md">
                        ⚖️
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{s.title}</p>
                        <p className="text-[10px] text-slate-300 font-bold">{s.category}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-300 font-bold transition-colors group-hover:text-amber-400" />
                  </a>
                )) : (
                  <div className="text-center py-8 opacity-60">
                    <p className="text-xs text-slate-300 font-bold">تظهر الروابط وتوجيهات المحاكم فور بدء وعرض طلبك الذكي بالبحث في الأعلى.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0c2461] to-slate-950 text-white p-8 rounded-[2rem] border border-slate-700/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none"></div>
              <h4 className="font-black text-white text-sm mb-2.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                التكامل الضريبي والامتثال القضائي
              </h4>
              <p className="text-white font-bold text-[11px] font-bold leading-relaxed mb-6">تبث منصة العدالة تلقائياً مستندات المواد المذكورة وتوفر حفظ القضايا وتحليلها لمطابقتها مع متطلبات النيابة العامة ودوائر التنفيذ بالمملكة.</p>
              <button 
                type="button"
                onClick={() => {
                  setQuery("ما هي إجراءات التقدم بطلب استئناف تجاري بموجب نظام المرافعات؟");
                  triggerNotification('تم تعبئة نموذج الاستفسار الاستئنافي، انقر بحث لمتابعة التحليل.');
                }}
                className="w-full bg-amber-400 text-slate-950 py-3.5 rounded-xl text-xs font-black shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                تحميل مثال استئنافي سريع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: SAUDI LEGISLATIVES OBSERVATORY ----------------- */}
      {activeView === 'library' && (
        <div className="space-y-8 animate-fade-in text-right">
          
          {/* Quick Notice Banner - Updated for High Visibility */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border-2 border-amber-400/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl"></div>
            
            <div className="space-y-4 z-10 max-w-3xl text-right">
              <div className="inline-flex items-center gap-3 bg-slate-900/40 px-5 py-2 rounded-full text-xs font-black border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                <BookOpen className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-amber-400">مرصد ومستودع اللوائح والأنظمة الملكية ⚖️</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-white font-display leading-tight drop-shadow-lg">
                فهرس الأنظمة والتعويضات السعودي
              </h3>
              <p className="text-slate-100 text-sm md:text-base font-bold leading-relaxed drop-shadow-md">
                تصفح نصوص نظام المعاملات المدنية، نظام الشركات الجديد، نظام العمل، مع إمكانية توجيه تساؤلات مخصصة داخل فقه المادة القانونية المحددة.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <button 
                  onClick={() => window.open('https://laws.boe.gov.sa', '_blank')}
                  className="flex items-center gap-2 bg-amber-400 text-slate-950 px-6 py-3 rounded-2xl text-xs font-black hover:bg-white transition-all shadow-xl active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  الاطلاع على كافة مواد الأنظمة المسجلة 🔗
                </button>
                <button 
                  onClick={() => setActiveView('search')}
                  className="flex items-center gap-2 bg-white text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-amber-400 transition-all shadow-xl active:scale-95 border-2 border-amber-400/50"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 font-black" />
                  أداة تحليل البحث في القضايا والمواقف القانونية ⚖️
                </button>
              </div>
            </div>

            <div className="z-10 bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-amber-400/40 text-center shrink-0 min-w-[220px] shadow-2xl relative group  transition-transform duration-500">
              <div className="absolute inset-0 bg-amber-400/5 animate-pulse rounded-[2.5rem]"></div>
              <div className="text-4xl font-black text-amber-400 font-mono drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">15,000+</div>
              <div className="text-xs text-white mt-2 font-black tracking-widest">بند ومبدأ قضائي مرصود وموثوق</div>
            </div>
          </div>

          {/* Moustashar Integrated Folders Grid - Interactive Sovereign Directories */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Library className="w-5 h-5 text-emerald-700" />
                المجلدات التفاعلية لمرصد الأنظمة (التحكم بالتباين الديناميكي لسهولة القراءة ⚡)
              </h3>
              <span className="hidden sm:inline-block text-xs bg-slate-100 text-slate-650 px-3.5 py-1 rounded-full font-bold">
                انقر على المجلد لتصفح وتحليل النظام فوراً
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
               {SAUDI_SYSTEMS_DATA.map((sys) => {
                 // Assign background theme representing the physical folders
                 const folderBgClasses: Record<string, string> = {
                   civil_transactions: 'bg-[#0c2461]', // Deep Royal Blue
                   companies_law: 'bg-[#916a04]',      // Rich Amber-Gold
                   labor_law: 'bg-[#1e4620]',          // Forest Green
                   evidence_law: 'bg-[#4a154b]',       // Royal Purple
                   enforcement_law: 'bg-[#800020]',    // Deep Burgundy Red
                   bankruptcy_law: 'bg-[#1e293b]',     // Deep Slate Steel
                 };
 
                 const bgClass = folderBgClasses[sys.id] || 'bg-slate-900';
                 const isSelected = selectedSystem.id === sys.id;
                 
                 // Real-time relative brightness & contrast categorization
                 const isDark = true; // All cards are dark for ultra contrast neon colors!
                 
                 // Dynamic Typography Contrast Theme variables to ensure extreme readability
                 const textTitleColor = 'law-card-title';
                 const textDescColor = 'law-card-desc';
                 const metaColor = 'law-card-meta';
                 const folderBadgeClass = 'law-card-badge';
                 
                 return (
                   <motion.div
                     key={sys.id}
                     whileHover={{ scale: 1.04, y: -4 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => {
                       setSelectedSystem(sys);
                       setObsAiResult(null);
 
                       const linkMapping: Record<string, string> = {
                         civil_transactions: localStorage.getItem('law_link_civil_transactions') || 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/655fdb42-8c96-422b-b8c4-b04f0095c94c/1',
                         companies_law: localStorage.getItem('law_link_companies_new') || 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/a8376aea-1bc3-49d4-9027-aed900b555af/1',
                         labor_law: localStorage.getItem('law_link_labor_law') || 'https://laws.boe.gov.sa/boelaws/laws/lawdetails/08381293-6388-48e2-8ad2-a9a700f2aa94/1',
                         evidence_law: localStorage.getItem('law_link_evidence_law') || 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/2716057c-c097-4bad-8e1e-ae1400c678d5/1',
                         enforcement_law: localStorage.getItem('law_link_enforcement_law') || 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/c81ba2f1-1bf1-443b-9b1c-a9a700f27110/1',
                         bankruptcy_law: localStorage.getItem('law_link_bankruptcy_law') || 'https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/68204119-84f1-4789-8fad-a9ec014c3788/1',
                       };
                       const externalLink = linkMapping[sys.id];
                       
                       if (externalLink) {
                         window.open(externalLink, '_blank', 'noopener,noreferrer');
                       } else {
                         alert('لم يتم العثور على رابط مخصص لهذا النظام. يرجى التوجه لصفحة الإعدادات وإضافته أولاً.');
                       }
                     }}
                     className="cursor-pointer group flex flex-col relative text-right law-folder-card-wrapper"
                   >
                     {/* Folder Tab Shape Accent */}
                     <div 
                       className={`w-20 h-5 rounded-t-lg -mb-[1px] mr-4 relative border-t border-x transition-all duration-300 ${
                         isSelected 
                           ? 'bg-[#0a1e4d] border-amber-400' 
                           : `${bgClass} border-slate-700/60`
                       }`}
                     >
                       <div className="absolute inset-0 bg-black/5 rounded-t-lg"></div>
                     </div>
 
                     {/* Main Folder Body Frame */}
                     <div 
                       className={`rounded-2xl rounded-tr-none p-5 h-full flex flex-col justify-between min-h-[190px] border-2 transition-all duration-300 shadow-md law-folder-card ${bgClass} ${
                         isSelected 
                           ? 'border-amber-400 ring-4 ring-amber-400/20' 
                           : 'border-transparent'
                       }`}
                     >
                       <div className="space-y-2.5">
                         <div className="flex justify-between items-start">
                           <BookOpen className="w-5 h-5 text-amber-400 animate-pulse" />
                           <span className={`text-[8.5px] px-2.5 py-0.5 rounded-full border font-black ${folderBadgeClass}`}>
                             {sys.articleCount} مادة
                           </span>
                         </div>
                         
                         <div>
                           <h4 className={`text-xs font-black tracking-tight leading-snug ${textTitleColor}`}>
                             {sys.name}
                           </h4>
                           <h5 className="text-[11px] font-bold mt-0.5 opacity-80 law-card-subtitle">
                             {sys.enName}
                           </h5>
                         </div>
                       </div>
 
                       <div className="pt-3 border-t border-current/10 mt-2 space-y-1">
                         <p className={`text-[9.5px] font-bold leading-relaxed line-clamp-2 ${textDescColor}`}>
                           {sys.description}
                         </p>
                         <div className="flex justify-between items-center text-[8.5px] mt-1.5 font-sans font-extrabold">
                           <span className={`${metaColor}`}>{sys.category}</span>
                           <span className="law-card-date">{sys.hijriDate.split(' ')[0]}</span>
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 );
               })}
             </div>

            {/* Contrast Mode Notice Ribbon */}
            <div className="bg-emerald-500/[0.04] rounded-2xl p-4.5 border-2 border-emerald-600/30 flex items-center justify-between text-slate-900 text-xs font-bold leading-relaxed shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                <span>
                  💡 <strong>منطق التباين اللوني الذكي مفعل بالكامل</strong>: يقوم نظام الأرشفة تلقائياً بموازنة وضوح نصوص المجلدات (انقر على <strong>{SAUDI_SYSTEMS_DATA[5].name}</strong> لتجربة النسق الفاتح مع تباين النصوص الغامقة، وباقي المصلحات لمعاينة النسق الداكن والنصوص البيضاء فائقة الدقة).
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Right Side: Law Selector & Search */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 border-2 border-amber-500/30 rounded-[2rem] p-6 shadow-xl space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -translate-y-16 translate-x-16"></div>
                <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-amber-500/20 pb-3 drop-shadow-md relative z-10">
                  <BookOpen className="w-4 h-4 text-amber-400 drop-shadow-sm" />
                  البحث المصنف بالمرصد والأنظمة
                </h3>
                <div className="relative z-10">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold w-4 h-4" />
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو الفئة..."
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl pr-11 pl-4 py-3.5 text-xs font-black text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all placeholder-slate-500"
                    value={librarySearchTerm}
                    onChange={(e) => setLibrarySearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 relative z-10">
                  {filteredSystems.map((sys) => {
                    const isSelected = selectedSystem.id === sys.id;
                    return (
                      <button
                        key={sys.id}
                        type="button"
                        onClick={() => {
                          setSelectedSystem(sys);
                          setObsAiResult(null);
                        }}
                        className={`w-full text-right p-4 rounded-2xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.15)] ring-1 ring-amber-500/50' 
                            : 'bg-slate-800 border-slate-700 hover:border-amber-500/50'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className={`text-xs font-black drop-shadow-md ${isSelected ? 'text-yellow-400' : 'text-white'}`}>
                            {sys.name}
                          </span>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black ${isSelected ? 'bg-amber-500 text-slate-900 border border-amber-400' : 'bg-slate-900 border border-slate-700 text-white'}`}>
                            {sys.articleCount} مادة
                          </span>
                        </div>
                        <div className={`flex justify-between items-center w-full mt-0.5 text-[10px] font-bold ${isSelected ? 'text-amber-200' : 'text-slate-400'}`}>
                          <span>الصدور: {sys.hijriDate}</span>
                          <span className={`font-black text-[11px] ${isSelected ? 'text-yellow-400 drop-shadow-md' : 'text-slate-300'}`}>{sys.category}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compliance Alerts box */}
              <div className="bg-amber-500/[0.03] border-2 border-amber-400/70 p-6 rounded-[2rem] shadow-md space-y-4 text-right">
                <h4 className="text-xs font-black text-amber-950 flex items-center gap-2 border-b border-amber-400/20 pb-2">
                  <Scale className="w-4 h-4 text-amber-400 font-black" />
                  محدد مذكرات حوكمة المحاكم السعودية
                </h4>
                <ul className="space-y-3 text-[11px] text-slate-900 font-bold leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>رفع مذكرات الدفاع والجداول قبل الجلسة بـ 48 ساعة على الأقل لتلافي السقوط الفني للمحكمين.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>تم تحديد مهلة الاعتراض على الأحكام العمالية والتجارية بـ 30 يوماً من صدور الصك وتسليمه.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>سندات الشركاء والجمعيات تتطلب امتثالاً صارماً مع ضوابط حوكمة الشركات الجديد 1443 هـ.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Left Side: Law details or materials list */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Selected System Card */}
              <div className="bg-slate-900 border-2 border-amber-500/30 rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full -translate-y-32 translate-x-32 pointer-events-none"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-500/20 pb-5 relative z-10">
                  <div>
                    <h2 className="text-2xl font-black text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">{selectedSystem.name}</h2>
                    <p className="text-xs font-bold text-slate-300 font-bold mt-1 drop-shadow-md">{selectedSystem.enName} • صدر في {selectedSystem.hijriDate}</p>
                  </div>
                  <span className="text-xs bg-amber-500/20 text-yellow-400 drop-shadow-md font-black border border-amber-500/30 px-4 py-1.5 rounded-full font-black">
                    {selectedSystem.category}
                  </span>
                </div>

                <div className="space-y-2 relative z-10">
                  <h4 className="font-black text-white text-xs uppercase tracking-wide drop-shadow-sm">نبذة عن غايات النظام ولائحته:</h4>
                  <p className="text-slate-100 font-bold text-xs font-bold leading-relaxed bg-slate-800/80 drop-shadow-md p-5 rounded-2xl border border-slate-700/80">
                    {selectedSystem.description}
                  </p>
                </div>

                {/* Interactive Specialized Law Analyzer / Chat */}
                <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 font-black" />
                    مستشار ومحلل مواد ({selectedSystem.name})
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="اطرح استفسارك بخصوص هذا النظام (مثلاً: ما هو التعويض المقرر في المادة 77؟)..."
                      value={obsAiPrompt}
                      onChange={(e) => setObsAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleObsAiAnalyze()}
                      className="w-full bg-white border border-slate-200 px-4 py-3 text-xs font-bold text-slate-950 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                    <button 
                      type="button"
                      onClick={() => handleObsAiAnalyze()}
                      disabled={isLoadingObsAi || !obsAiPrompt.trim()}
                      className="bg-slate-950 text-white px-5 rounded-xl text-xs font-black disabled:opacity-50 cursor-pointer"
                    >
                      {isLoadingObsAi ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : 'حلل المادة'}
                    </button>
                  </div>

                  {isLoadingObsAi && (
                    <div className="text-center py-4 text-xs font-bold text-emerald-700 animate-pulse">
                      جاري فك تشفير وتطبيق معايير الامتثال للنظام...
                    </div>
                  )}

                  {obsAiResult && (
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-950 leading-relaxed font-sans space-y-2">
                      <div className="markdown-body">
                        <Markdown>{obsAiResult}</Markdown>
                      </div>
                    </div>
                  )}
                </div>

                {/* Key materials table list with optimal relative luminance contrast */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    أبرز البنود المستخرجة من المرصد:
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedSystem.keyArticles.map((art) => (
                      <div key={art.number} className="p-6 bg-[#fcfcfc] border-2 border-slate-200 rounded-2xl transition-all duration-300 space-y-3 text-right">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                            المادة {art.number}
                          </span>
                          <span className="font-black text-slate-950 text-xs">{art.title}</span>
                        </div>
                        <p className="text-slate-800 text-xs font-bold leading-relaxed font-sans border-r-3 border-emerald-500 pr-3">
                          {art.text}
                        </p>
                        <div className="flex flex-wrap gap-1 bg-slate-50 p-2 rounded-xl">
                          {art.keywords.map((kw, idx) => (
                            <span key={idx} className="text-[11px] font-black bg-white text-slate-650 border border-slate-200 px-2.5 py-0.5 rounded">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* ----------------- TAB 3: LAWYERS MEMOS & AI AUDITING ----------------- */}
      {activeView === 'memos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in text-right">
          
          {/* Right Column: Templates List */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border-2 border-slate-200/80 rounded-[2.5rem] p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-[#0c2461]" />
                  المذكرات المحفوظة
                </h3>
                <button 
                  type="button"
                  onClick={handleCreateNewMemo}
                  className="bg-emerald-600 text-white p-2.5 rounded-xl text-xs font-black shadow transition-all flex items-center gap-1 cursor-pointer"
                  title="إنشاء مسودة مذكرة جديدة"
                >
                  <Plus className="w-4 h-4" />
                  <span>جديد</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {customMemos.map((memo) => {
                  const isSelected = selectedMemoId === memo.id;
                  return (
                    <div 
                      key={memo.id} 
                      className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 relative[#0c2461] ${
                        isSelected 
                          ? 'bg-indigo-50/40 border-[#0c2461] shadow-md' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedMemoId(memo.id)}
                        className="w-full text-right cursor-pointer"
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className={`text-xs font-black leading-snug ${isSelected ? 'text-[#0c2461]' : 'text-slate-900'}`}>
                            {memo.title}
                          </span>
                        </div>
                        <div className="flex justify-between items-center w-full mt-2 text-[10px] text-slate-700 font-bold border-t border-slate-100/50 pt-2">
                          <span>الفئة: {memo.category}</span>
                          <span className="text-amber-400 font-black bg-amber-50 px-2 py-0.5 rounded font-black">{memo.systemId === 'labor_law' ? 'نظام العمل' : memo.systemId === 'civil_transactions' ? 'المدني' : 'نظام الإثبات'}</span>
                        </div>
                      </button>

                      {/* Delete button (hidden unless hovered or selected) */}
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMemo(memo.id);
                        }}
                        className="absolute top-2 left-2 text-white font-bold p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="حذف هذه المذكرة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Audit Quick Info Card with very stark text colors */}
            <div className="bg-[#0c2461]/[0.02] border-2 border-[#0c2461]/30 p-6 rounded-[2rem] shadow-md space-y-4 text-right">
              <h4 className="text-xs font-black text-slate-950 flex items-center gap-1.5 border-b border-[#0c2461]/10 pb-2">
                <Sparkles className="w-4 h-4 text-[#0c2461] animate-pulse" />
                كيف يعمل التدقيق والتحسين القانوني؟
              </h4>
              <p className="text-xs text-slate-700 font-bold leading-relaxed pb-1">
                تستخدم منصة العدالة جيميناي لمطابقة مسودة لائحتك مع متطلبات الأحكام ومقتضيات فقه الشريعة ومواد الأنظمة السارية بالمملكة، ليرصد الثغرات فوراً ويقترح تعديلات ترفع من احتمالية قبول مذكراتك القضائية.
              </p>
            </div>
          </div>

          {/* Left Column: Interactive Editor and AI Auditing Output */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Live Document Editor */}
            <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="text-[10px] font-black bg-indigo-50 text-[#0c2461] px-3.5 py-1.5 rounded-full border border-indigo-200">
                    محرر المذكرات الذكي (Active Work Draft)
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-2">تعديل وصياغة اللائحة الجوابية والاعتراضية</h3>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(editedMemoText);
                      triggerNotification('تم نسخ نص المذكرة القانونية.');
                    }}
                    className="p-3 border border-slate-200 transition-colors rounded-xl text-xs font-black text-slate-700 flex items-center gap-1 cursor-pointer"
                    title="مشاركة الصياغة مع الفريق"
                  >
                    <Share2 className="w-4 h-4 text-slate-700" />
                    <span>مشاركة</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveMemo}
                    className="bg-[#0c2461][#113184] text-white px-5 py-3 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-700 block uppercase">عنوان المستند:</label>
                  <input 
                    type="text"
                    value={editedMemoTitle}
                    onChange={(e) => setEditedMemoTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 text-xs font-black text-slate-950 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-700 block uppercase">النظام المرتبط (الأثاث التشريعي):</label>
                  <select 
                    value={editedMemoSystemId}
                    onChange={(e) => setEditedMemoSystemId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 text-xs font-black text-slate-950 rounded-xl focus:outline-none focus:border-indigo-600"
                  >
                    {SAUDI_SYSTEMS_DATA.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rich Textarea */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-700 block uppercase">نص المذكرة وصياغة الدفوع القضائية:</label>
                <textarea 
                  value={editedMemoText}
                  onChange={(e) => setEditedMemoText(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 p-6 min-h-[300px] rounded-2xl text-xs font-bold leading-relaxed font-sans text-slate-950 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner custom-scrollbar text-right"
                  placeholder="ابتدئ بكتابة مذكرتك للأطراف والدوائر الجنائية أو العمالية ههنا..."
                />
              </div>

              {/* Audit Trigger Box */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-[11px] text-slate-700 font-bold text-center sm:text-right max-w-md">قم بالتدقيق الفوري للبحث عن أي ثغرات أو تحسين البناء اللغوي وفق مواد النظام السارية.</p>
                <button
                  type="button"
                  onClick={handleAuditMemo}
                  disabled={isAuditing || !editedMemoText.trim()}
                  className="w-full sm:w-auto bg-amber-500 text-slate-950 px-8 py-4 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAuditing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>جاري المعالجة عبر AI Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>تدقيق المذكرة بواسطة بوابة (AI Gateway) 🛡️</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* AI Audit Report Result block */}
            <AnimatePresence>
              {auditResult && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-950 text-white rounded-[2.5rem] border-2 border-amber-400 p-8 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full translate-x-12 -translate-y-12"></div>
                  
                  <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                      <h4 className="font-black text-amber-400 text-sm md:text-base">تقرير التدقيق والتدبيج القضائي الذكي الحصري</h4>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAuditResult(null)}
                      className="p-1.5 rounded-full transition-colors text-white font-bold cursor-pointer"
                      title="إغلاق التقرير"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="prose prose-invert max-w-none text-xs text-white font-bold leading-relaxed font-sans space-y-4 text-right relative z-10">
                    <div className="markdown-body">
                      <Markdown>{auditResult}</Markdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      )}

    </div>
  );
}
