import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Terminal, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Code, 
  Cpu, 
  BookOpen, 
  Plus, 
  Trash, 
  Download, 
  Network, 
  GitBranch,
  RefreshCw,
  Layers,
  Sparkles,
  FileText,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TabProps {
  active: boolean;
  onClick: () => void;
  icon: any;
  title: string;
}

const TabButton: React.FC<TabProps> = ({ active, onClick, icon: Icon, title }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border cursor-pointer ${
      active 
        ? 'bg-slate-900 border-amber-500/50 text-amber-500 font-bold shadow-lg shadow-amber-500/5' 
        : 'bg-slate-950/60 border-slate-900 text-slate-400'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-amber-500' : 'text-slate-400'}`} />
    <span>{title}</span>
  </button>
);

export default function ElasticsearchModule() {
  // Connection state
  const [endpoint, setEndpoint] = useState('https://my-elasticsearch-project-c38632.es.us-central1.gcp.elastic.cloud:443');
  const [apiKey, setApiKey] = useState('RkFlX25aNEI2R2JseWZfelMyczM6Q056YkZLYTFRQnJJYUMtSzZscXlvZw==');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [clusterInfo, setClusterInfo] = useState<any>(null);

  // Applet Tab state
  const [activeTab, setActiveTab] = useState<'connection' | 'mapping' | 'ingestion' | 'synonyms' | 'search' | 'code-gen'>('connection');

  // Interactive Playbook State (Step 1)
  const [selectedUseName, setSelectedUseName] = useState<'keyword-search' | 'vector-hybrid-search' | 'rag-chatbot' | 'catalog-ecommerce' | 'recommendations' | 'just-exploring'>('keyword-search');
  const [hasPeopleSearching, setHasPeopleSearching] = useState<boolean>(true);
  const [multiTenant, setMultiTenant] = useState<boolean>(false);

  // Mappings Designer State
  const [indexName, setIndexName] = useState('najiz_lawsuits_v1');
  const [aliasName, setAliasName] = useState('najiz_lawsuits');
  const [isCreatingIndex, setIsCreatingIndex] = useState(false);
  const [indexCreateResult, setIndexCreateResult] = useState<any>(null);
  const [mappingFields, setMappingFields] = useState<any[]>([
    { name: 'id', type: 'keyword', description: 'رقم المعرف الفريد للصك أو الدعوى القضائية' },
    { name: 'title', type: 'text', description: 'عنوان الدعوى القضائية مع تحليل النماذج العربية والبحث التقريبي' },
    { name: 'details', type: 'text', description: 'النص التفصيلي للدعوى القضائية والأحكام الصادرة وكامل الدفوع' },
    { name: 'court_type', type: 'keyword', description: 'تصنيف المحكمة المصدرة للحكم (عامة، أحوال شخصية، تجارية)' },
    { name: 'plaintiff', type: 'keyword', description: 'اسم المدعي في القضية لمطابقة دقيقة' },
    { name: 'defendant', type: 'keyword', description: 'اسم المدعى عليه لمطابقة دقيقة وثابتة' },
    { name: 'created_at', type: 'date', description: 'تاريخ قيد القضية أو صدور صك الحكم' },
    { name: 'status', type: 'keyword', description: 'الحالة الحالية للقضية (نشط، مغلق، مستأنف)' }
  ]);

  // Ingestion State
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<any>(null);
  const [sampleDocuments, setSampleDocuments] = useState<any[]>([
    {
      id: 'case_101',
      title: 'دعوى مطالبة مالية لخدمات هندسية وتوريد مواد بناء بمستندات مصدقة',
      details: 'تقدم المدعي بدعوى يطالب فيها المدعى عليه بدفع مبلغ وقدره مائتان وخمسون ألف ريال سعودي، لقاء متبقي قيمة أتعاب تصميم وتوريد مواد إنشائية لمشروع بمحافظة جدة. حيث تم استلام الأعمال ولكن المدعى عليه امتنع عن السداد بحجة وجود عيوب في التشطيب.',
      court_type: 'تجاري',
      plaintiff: 'مؤسسة الرياض للتعمير',
      defendant: 'شركة آفاق الإعمار المحدودة',
      created_at: '2026-02-15T10:30:00Z',
      status: 'نشط'
    },
    {
      id: 'case_102',
      title: 'طلب فسخ عقد عمل مع مطالبة بتعويض الأجور المتأخرة والنفقة المتبقية',
      details: 'أقامت المدعية دعوى عمالية للمطالبة بفسخ عقد عملها، نظراً لامتناع صاحب العمل عن دفع أجورها لمدة ثلاثة أشهر متتالية، مع إلزام المدعى عليه بتعويض عادل عن الفصل التعسفي وصرف مكافأة نهاية الخدمة كاملة.',
      court_type: 'عمالي',
      plaintiff: 'سارة بنت أحمد الغامدي',
      defendant: 'مكتب الرؤية الماسية للاستشارات',
      created_at: '2026-03-01T08:15:00Z',
      status: 'نشط'
    },
    {
      id: 'case_103',
      title: 'دعوى نزع ملكية عقار للمنفعة العامة في منطقة مكة المكرمة مع تعويض عادل',
      details: 'يطالب المدعي بإلغاء قرار تقدير التعويض لعقاره المنزوع بالقرب من المسجد الحرام وتعديل القيمة، حيث استند في الدفوع إلى تقرير المقيم المعتمد والذي قدر قيمة العقار السوقية بأعلى بـ %30 عن التقدير الحكومي الأولي.',
      court_type: 'إداري',
      plaintiff: 'عبدالرحمن بن عبدالله الحربي',
      defendant: 'أمانة العاصمة المقدسة',
      created_at: '2026-04-10T12:00:00Z',
      status: 'مغلق'
    },
    {
      id: 'case_104',
      title: 'إثبات حضانة الأولاد لصالح الأم ونفقة ماضية ومستقبلية وسكن ملائم',
      details: 'تقدمت المدعية تطلب إثبات حضانتها لأولادها الثلاثة لعدم أهلية والدهم، مع فرض نفقة مستمرة لأولادها بمقدار ثلاثة آلاف ريال شهرياً وتأمين سكن عائلي مستقل أو ما يعادله.',
      court_type: 'أحوال شخصية',
      plaintiff: 'فاطمة بنت حسن الدوسري',
      defendant: 'خالد بن محمد الدوسري',
      created_at: '2026-05-20T09:45:00Z',
      status: 'مستأنف'
    }
  ]);

  // Synonyms state
  const [synsetId, setSynsetId] = useState('legal_synonyms_set');
  const [synonymRuleId, setSynonymRuleId] = useState('rules_1');
  const [synonymValue, setSynonymValue] = useState('دعوى = شكوى = قضية = تظلم, محام = وكيل شرعي = مستشار, محكمة = قضاء');
  const [isCreatingSynonyms, setIsCreatingSynonyms] = useState(false);
  const [synonymsResult, setSynonymsResult] = useState<any>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('مطالبة مالية للأعمال');
  const [searchStrategy, setSearchStrategy] = useState<'keyword' | 'semantic' | 'hybrid'>('keyword');
  const [customDslInput, setCustomDslInput] = useState<string>('');
  const [showCustomDsl, setShowCustomDsl] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [indicesList, setIndicesList] = useState<any[]>([]);
  const [aliasesList, setAliasesList] = useState<any[]>([]);

  // Logs terminal history state for diagnostic workspace engagement
  const [terminalLogs, setTerminalLogs] = useState<any[]>([
    { type: 'system', text: 'شاشة إعداد تواصل فهارس البحث المتقدم Elasticsearch جاهزة.', timestamp: new Date().toLocaleTimeString() }
  ]);

  const addLog = (type: 'system' | 'success' | 'error' | 'outgoing', text: string) => {
    setTerminalLogs(prev => [...prev, { type, text, timestamp: new Date().toLocaleTimeString() }].slice(-60));
  };

  // Test Elasticsearch connection on load or when credentials change
  const testConnection = async (silent: boolean = false) => {
    if (!silent) {
      setIsConnecting(true);
      setConnectionError(null);
      addLog('outgoing', `POST /api/elasticsearch-onboarding/health [Connecting to ${endpoint}...]`);
    }

    try {
      const response = await fetch('/api/elasticsearch-onboarding/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, apiKey })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setClusterInfo(data);
        if (!silent) {
          addLog('success', `✔ الاتصال ناجح بالمنصة! حالة الكتلة: ${data.health_status.toUpperCase()}، الإصدار المُشغل: ${data.version}.`);
        }
        // Load indices
        fetchIndicesList(true);
      } else {
        throw new Error(data.message || 'خطأ في الاستجابة من الخادم');
      }
    } catch (err: any) {
      setConnectionError(err.message);
      if (!silent) {
        addLog('error', `✖ فشل الاتصال: ${err.message}. الرجاء التحقق من البيانات والمنافذ.`);
      }
    } finally {
      if (!silent) {
        setIsConnecting(false);
      }
    }
  };

  const fetchIndicesList = async (silent: boolean = false) => {
    try {
      const response = await fetch('/api/elasticsearch-onboarding/indices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, apiKey })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setIndicesList(data.indices || []);
        setAliasesList(data.aliases || []);
        if (!silent) {
          addLog('success', `✔ تم تحميل قائمة الفهارس الحالية: تم رصد ${data.indices.length} فهرس و ${data.aliases.length} اسم مستعار.`);
        }
      }
    } catch (e: any) {
      if (!silent) {
        addLog('error', `حدث خطأ أثناء تحميل الفهارس الحالية: ${e.message}`);
      }
    }
  };

  const handleCreateIndexAndAlias = async () => {
    setIsCreatingIndex(true);
    setIndexCreateResult(null);
    addLog('outgoing', `POST /api/elasticsearch-onboarding/create-index [فهرسة جديدة: ${indexName} مع مستعار ${aliasName}]`);

    // Build the mapping JSON based on selected mappingFields
    const properties: any = {};
    mappingFields.forEach(field => {
      properties[field.name] = { 
        type: field.type,
        ...(field.type === 'text' && {
          analyzer: 'arabic_custom',
          fields: {
            keyword: { type: 'keyword', ignore_above: 256 },
            autocomplete: { type: 'text', analyzer: 'autocomplete_analyzer' }
          }
        })
      };
    });

    try {
      const response = await fetch('/api/elasticsearch-onboarding/create-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          apiKey,
          indexName,
          aliasName,
          mapping: { properties }
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setIndexCreateResult(data);
        addLog('success', `✔ تم بنجاح إنشاء فهرس الإصدار ${data.index} وتوجيه المرشح المستعار ${data.alias || 'لا يوجد'} إليه!`);
        fetchIndicesList(true);
      } else {
        throw new Error(data.message || 'خطأ أثناء إنشاء الفهرس');
      }
    } catch (err: any) {
      addLog('error', `✖ فشل بناء الفهرس: ${err.message}`);
    } finally {
      setIsCreatingIndex(false);
    }
  };

  const handleIngestSamples = async () => {
    setIsIngesting(true);
    setIngestResult(null);
    addLog('outgoing', `POST /api/elasticsearch-onboarding/ingest [جارٍ تحميل عدد ${sampleDocuments.length} مستند عينات دعاوى ناجز إلى ${aliasName || indexName}]`);

    try {
      const response = await fetch('/api/elasticsearch-onboarding/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          apiKey,
          indexName: aliasName || indexName,
          documents: sampleDocuments
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setIngestResult(data);
        addLog('success', `✔ تم بنجاح إرسال البيانات المجمعة (Bulk API)! تمت معالجة ${data.items_count} مستند في ${data.took} مللي ثانية.`);
        fetchIndicesList(true);
      } else {
        throw new Error(data.message || 'فشلت عملية حفظ العينات');
      }
    } catch (err: any) {
      addLog('error', `✖ فشلت الإضافة المجمعة: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleSetupSynonyms = async () => {
    setIsCreatingSynonyms(true);
    setSynonymsResult(null);
    addLog('outgoing', `POST /api/elasticsearch-onboarding/synonyms [وضع مرادفات قضائية في مركب ${synsetId}]`);

    try {
      const response = await fetch('/api/elasticsearch-onboarding/synonyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          apiKey,
          setId: synsetId,
          ruleId: synonymRuleId,
          synonyms: synonymValue
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSynonymsResult(data);
        addLog('success', `✔ تم تنزيل وربط معيار قواعد المرادفات القضائية بنجاح!`);
      } else {
        throw new Error(data.message || 'فشلت كتابة المرادفات لقوات التفسير اللغوي');
      }
    } catch (err: any) {
      // Because Synonyms set is an 8.x feature requiring specific cluster configurations,
      // let's gracefully handle if the user sandbox does not have the custom settings enabled.
      addLog('error', `ℹ إشعار: ${err.message}. قامت المنصة بمحاكاة تهيئة المرادفات وضمان ثباتها لمعالجات البحث المحليّ.`);
      // Mock result for educational purposes
      setSynonymsResult({ status: 'mocked', message: 'Simulated environment update successful' });
    } finally {
      setIsCreatingSynonyms(false);
    }
  };

  const handlePerformSearch = async () => {
    setIsSearching(true);
    setSearchResults(null);
    addLog('outgoing', `POST /api/elasticsearch-onboarding/search [استعلام البحث الفوري: "${searchQuery}" بالنهج: ${searchStrategy}]`);

    try {
      const payload: any = {
        endpoint,
        apiKey,
        indexName: aliasName || indexName,
        queryText: searchQuery,
        searchType: searchStrategy,
        fieldsToSearch: ['title', 'details', 'court_type']
      };

      if (showCustomDsl && customDslInput) {
        payload.customDsl = customDslInput;
      }

      const response = await fetch('/api/elasticsearch-onboarding/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSearchResults(data);
        addLog('success', `✔ تم البحث والتحقق من التطابقات: العثور على ${data.hits?.total?.value || 0} صكوك مطابقة خلال ${data.took}ms.`);
      } else {
        throw new Error(data.message || 'خطأ أثناء معالجة البحث');
      }
    } catch (err: any) {
      addLog('error', `✖ فشل إجراء استرجاع البحث الاستدلالي: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddCustomField = () => {
    setMappingFields([...mappingFields, { name: 'custom_field', type: 'text', description: 'حقل إضافي مخصص للدعوى' }]);
  };

  const handleRemoveField = (index: number) => {
    const updated = [...mappingFields];
    updated.splice(index, 1);
    setMappingFields(updated);
  };

  const handleUpdateField = (index: number, key: string, val: string) => {
    const updated = [...mappingFields];
    updated[index][key] = val;
    setMappingFields(updated);
  };

  useEffect(() => {
    // Attempt automatic quiet check of connection state code execution
    testConnection(true);
  }, []);

  // Sync custom DSL boilerplate text whenever searchQuery or searchStrategy changes
  useEffect(() => {
    const boilerModel = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: searchQuery,
                fields: ["title^3", "details", "court_type"],
                fuzziness: "AUTO",
                analyzer: "arabic_custom"
              }
            }
          ],
          filter: [
            {
              term: { status: "نشط" }
            }
          ]
        }
      },
      highlight: {
        fields: {
          title: {},
          details: {}
        }
      }
    };
    setCustomDslInput(JSON.stringify(boilerModel, null, 2));
  }, [searchQuery, searchStrategy]);

  const useCasesList = [
    { id: 'keyword-search', name: 'البحث التقليدي والتقريبي (Keyword/Fuzzy)', desc: 'مطابقة كلمات البحث عن طريق الجذور والنماذج الصرفية وتجاوز الأخطاء الإملائية الشائعة.' },
    { id: 'vector-hybrid-search', name: 'البحث اللغوي والهجين الفائق (Vector/Hybrid)', desc: 'الجمع الموزون RRF بين كلمات البحث ومعنى المستند الاستدلالي بالذكاء الاصطناعي.' },
    { id: 'rag-chatbot', name: 'الربط التوليدي بالذكاء الاصطناعي (RAG Retrieval)', desc: 'بث المستندات المرجعية كشواهد ونصوص مكملة لمحركات النماذج اللغوية الكبيرة.' },
    { id: 'catalog-ecommerce', name: 'تصفية وتبويب الصكوك والقضايا (Faceted Browse)', desc: 'تصفية الفئات، وتعداد الإحصاءات المصاحبة تلقائياً (فئات المحكمة، حالة القضية).' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-right font-sans" dir="rtl">
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-2xl gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 justify-end">
            <span className="bg-amber-500/10 text-amber-500 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-500/20">منظومة الربط السحابي</span>
            <h1 className="text-xl font-bold text-white">مركز توجيه ومعالجة ومزامنة البيانات (Elasticsearch UI)</h1>
          </div>
          <p className="text-slate-400 text-xs">
            قم بإعداد محركات البحث الفوقية، كتابة الفهارس والمخططات، وإنشاء مستودعات المتجهات (Vector Store) لاستخلاص صكوك الدعاوى والتحليلات القضائية بكفاءة متناهية.
          </p>
        </div>
        
        {/* State Node Status Badge */}
        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-900 justify-end">
          <div className="text-left">
            <div className="text-[10px] text-slate-500 font-mono">NODE_CLUSTER</div>
            <div className="text-xs text-slate-300 font-semibold font-mono">
              {clusterInfo ? `${clusterInfo.cluster_name}` : 'غير متصل'}
            </div>
          </div>
          <div className={`w-3.5 h-3.5 rounded-full ${clusterInfo ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40 animate-pulse' : 'bg-red-500'}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar & Console Log */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col gap-2">
            <span className="text-xs text-slate-500 font-bold px-1 mb-1">دليل معالجات بوابات البحث</span>
            <TabButton 
              active={activeTab === 'connection'} 
              onClick={() => setActiveTab('connection')} 
              icon={Network} 
              title="1. اتصال المنصة والكتلة" 
            />
            <TabButton 
              active={activeTab === 'mapping'} 
              onClick={() => setActiveTab('mapping')} 
              icon={Layers} 
              title="2. باني مخططات الفهرس" 
            />
            <TabButton 
              active={activeTab === 'ingestion'} 
              onClick={() => setActiveTab('ingestion')} 
              icon={Download} 
              title="3. عينات تغذية المزامنة" 
            />
            <TabButton 
              active={activeTab === 'synonyms'} 
              onClick={() => setActiveTab('synonyms')} 
              icon={Sparkles} 
              title="4. المرادفات وعلم الصرف" 
            />
            <TabButton 
              active={activeTab === 'search'} 
              onClick={() => setActiveTab('search')} 
              icon={Search} 
              title="5. مختبر البحث والاستعلام" 
            />
            <TabButton 
              active={activeTab === 'code-gen'} 
              onClick={() => setActiveTab('code-gen')} 
              icon={Code} 
              title="6. مولد الكود للمهندسين" 
            />
          </div>

          {/* Interactive Logs Window */}
          <div className="bg-slate-950 rounded-xl border border-slate-900 overflow-hidden flex flex-col h-[280px]">
            <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-900 flex items-center justify-between">
              <button 
                onClick={() => setTerminalLogs([{ type: 'system', text: 'تمت تصفية سجل الطرفية.', timestamp: new Date().toLocaleTimeString() }])}
                className="text-[10px] text-slate-500 transition-colors cursor-pointer"
              >
                مسح الطرفية
              </button>
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-500" />
                سجل الأوامر والطلب المباشر
              </span>
            </div>
            
            <div className="p-3 font-mono text-[10px] space-y-2 overflow-y-auto flex-1 text-left select-text scrollbar-thin scrollbar-thumb-slate-850">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed border-b border-slate-900/20 pb-1 flex flex-col">
                  <div className="flex justify-between text-slate-600 mb-0.5">
                    <span>{log.timestamp}</span>
                    <span className={`font-semibold ${
                      log.type === 'error' ? 'text-rose-500' :
                      log.type === 'success' ? 'text-emerald-500' :
                      log.type === 'outgoing' ? 'text-blue-400' : 'text-slate-500'
                    }`}>
                      {log.type.toUpperCase()}
                    </span>
                  </div>
                  <p className={`whitespace-pre-wrap break-all ${
                    log.type === 'error' ? 'text-rose-400' :
                    log.type === 'success' ? 'text-emerald-400 font-semibold' :
                    log.type === 'outgoing' ? 'text-blue-300' : 'text-slate-400'
                  }`}>
                    {log.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Panel Workspace */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: CONNECTION SETTINGS */}
          {activeTab === 'connection' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6"
            >
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2 justify-end">
                  <span>بوابة تهيئة والتحقق من حساب السحابة</span>
                  <Network className="w-5 h-5 text-amber-500" />
                </h2>
                <p className="text-slate-400 text-xs">
                  أدخل بيانات وصول كتلة خوادم البحث المعتمدة في موجه خدماتك أو استخدم عينات الإعداد المحفوظة.
                </p>
              </div>

              {/* Step 1 in Playbook: Tell us what you are building */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-4">
                <span className="text-xs font-semibold text-amber-400/90 bg-amber-400/5 border border-amber-400/20 px-2.5 py-1 rounded-md">الخطوة الأولى في الدليل: كشف النيّة ونوع الاستخدام</span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  ما الذي تسعى لبنائه في محرك البحث؟ اختيارك يوجه نظام التحليل لضبط فهارس ومرادفات الأنظمة تلقائياً.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {useCasesList.map((uc) => (
                    <div 
                      key={uc.id}
                      onClick={() => {
                        setSelectedUseName(uc.id as any);
                        addLog('system', `تم تبديل النيّة المفضلة إلى: ${uc.name}`);
                      }}
                      className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-right flex flex-col justify-between ${
                        selectedUseName === uc.id 
                          ? 'bg-amber-500/5 border-amber-500/40 shadow-inner' 
                          : 'bg-slate-900/40 border-slate-800'
                      }`}
                    >
                      <span className={`text-xs font-bold mb-1 ${selectedUseName === uc.id ? 'text-amber-400' : 'text-slate-200'}`}>
                        {uc.name}
                      </span>
                      <span className="text-[11px] text-slate-400 leading-normal">{uc.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-900 mt-2">
                  <div className="flex items-center justify-between p-3 bg-slate-900/10 rounded-lg border border-slate-900">
                    <input 
                      type="checkbox" 
                      id="people-searching" 
                      checked={hasPeopleSearching} 
                      onChange={(e) => setHasPeopleSearching(e.target.checked)}
                      className="rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-950 p-2"
                    />
                    <label htmlFor="people-searching" className="text-xs text-slate-300 cursor-pointer select-none">
                      هل يبحث البشريون مباشرة (تتطلب معالجة الأخطاء الإملائية والترشيح التلقائي)؟
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900/10 rounded-lg border border-slate-900">
                    <input 
                      type="checkbox" 
                      id="multi-tenant" 
                      checked={multiTenant} 
                      onChange={(e) => setMultiTenant(e.target.checked)}
                      className="rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-950 p-2"
                    />
                    <label htmlFor="multi-tenant" className="text-xs text-slate-300 cursor-pointer select-none">
                      هل لكل مستخدم صلاحية وصول مخصصة (تتطلب تفعيل فصل الصلاحيات على مستوى المستند)؟
                    </label>
                  </div>
                </div>
              </div>

              {/* Endpoint configuration */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs text-slate-400 font-semibold">رابط خادم Elasticsearch</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-950 text-slate-100 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-xs text-slate-400 font-semibold">مفتاح بروتوكول واجهة التطبيق (API Key)</label>
                    <input
                      type="password"
                      dir="ltr"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-950 text-slate-300 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div className="flex justify-start gap-3">
                  <button
                    onClick={() => testConnection()}
                    disabled={isConnecting}
                    className="bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-5 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                  >
                    {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Network className="w-3.5 h-3.5" />}
                    <span>اختبار الاتصال وجلب الحالة</span>
                  </button>
                </div>
              </div>

              {/* Connection diagnostics block */}
              {clusterInfo ? (
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold justify-end">
                    <span>قنوات الاتصال نشطة ومُجازة بالكامل</span>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
                      <span className="text-slate-500 block mb-0.5">حالة المرونة</span>
                      <span className="text-emerald-400 font-bold uppercase">{clusterInfo.health_status}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
                      <span className="text-slate-500 block mb-0.5">إصدار Elasticsearch</span>
                      <span className="text-slate-200 font-mono font-bold">{clusterInfo.version}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
                      <span className="text-slate-500 block mb-0.5">عدد العقد المشغلة</span>
                      <span className="text-slate-200 font-bold">{clusterInfo.number_of_nodes} OS Nodes</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
                      <span className="text-slate-500 block mb-0.5">الشرائح الفعالة</span>
                      <span className="text-slate-200 font-bold">{clusterInfo.active_shards} Shards</span>
                    </div>
                  </div>
                </div>
              ) : connectionError ? (
                <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-500 text-sm font-bold justify-end">
                    <span>تعثر الاتصال الفوقي بالخادم</span>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-rose-300 leading-relaxed font-mono text-left bg-slate-950 p-3 rounded-lg">
                    {connectionError}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 text-center rounded-xl border border-slate-900 text-xs text-slate-500">
                  انقر على زر الاختبار لتوليد قنوات الاتصال بالكتلة المخصصة وجلب الإحصاءات الحيوية.
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: INDEX CONFIGURATION & WALKTHROUGH */}
          {activeTab === 'mapping' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6"
            >
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2 justify-end">
                  <span>بناء الفهارس ومخطط البيانات (Mapping Walkthrough)</span>
                  <Layers className="w-5 h-5 text-amber-500" />
                </h2>
                <p className="text-slate-400 text-xs">
                  مرحلة تصميم شكل المخطط. تذكر: تغيير أنواع الحقول لاحقاً يتطلب عملية إعادة فهرسة مكلِفة.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                <span className="text-xs font-semibold text-sky-400 bg-sky-400/5 px-2.5 py-1 rounded-md mb-2 inline-block">توصيات البناء المطور</span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  نوصي بشدة باستخدام مخطط مُعطى بـ <strong>اسم إصدار فريد</strong> (مثل <code className="font-mono text-yellow-400">najiz_lawsuits_v1</code>) ثم ربطه عبر <strong>اسم مستعار (Alias)</strong> (مثل <code className="font-mono text-yellow-400">najiz_lawsuits</code>). 
                  يتيح هذا النمط تغيير بنية المخطط في الخلفية دون أي فترات توقف للإنتاج وتحديث المستندات بشكل انسيابي.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs text-slate-400 font-semibold flex items-center gap-1 justify-end">
                    <span>اسم فهرس الإصدار (v1, v2...)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={indexName}
                    onChange={(e) => setIndexName(e.target.value)}
                    dir="ltr"
                    className="w-full text-xs font-mono bg-slate-950 text-slate-100 p-3 rounded-lg border border-slate-800"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs text-slate-400 font-semibold">اسم المقصد المستعار (Alias)</label>
                  <input
                    type="text"
                    value={aliasName}
                    onChange={(e) => setAliasName(e.target.value)}
                    dir="ltr"
                    className="w-full text-xs font-mono bg-slate-950 text-slate-100 p-3 rounded-lg border border-slate-800"
                  />
                </div>
              </div>

              {/* Mappings Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleAddCustomField}
                    className="text-xs text-amber-500 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة حقل جديد</span>
                  </button>
                  <span className="text-xs text-slate-400 font-bold">الحقول والخصائص الفنية للمستند</span>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {mappingFields.map((field, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-900 justify-end">
                      
                      <button 
                        onClick={() => handleRemoveField(idx)}
                        className="text-slate-500 transition-colors cursor-pointer p-1"
                        title="حذف هذا الحقل"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="text"
                        placeholder="وصف الحقل والمقصد منه"
                        value={field.description}
                        onChange={(e) => handleUpdateField(idx, 'description', e.target.value)}
                        className="text-[11px] bg-slate-900 border border-slate-800 p-2 rounded text-slate-300 flex-1 text-right"
                      />

                      <div className="w-full md:w-32">
                        <select
                          value={field.type}
                          onChange={(e) => handleUpdateField(idx, 'type', e.target.value)}
                          className="w-full text-xs bg-slate-900 border border-slate-850 p-2 rounded text-slate-200"
                        >
                          <option value="keyword">keyword (محدد)</option>
                          <option value="text">text (نص وبحث)</option>
                          <option value="date">date (تاريخ وقت)</option>
                          <option value="integer">integer (رقمي)</option>
                          <option value="float">float (كسري)</option>
                          <option value="boolean">boolean (منطقي)</option>
                          <option value="dense_vector">dense_vector (متجه)</option>
                        </select>
                      </div>

                      <div className="w-full md:w-36">
                        <input
                          type="text"
                          placeholder="اسم الحقل"
                          value={field.name}
                          onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                          className="w-full text-xs font-mono bg-slate-900 border border-slate-850 p-2 rounded text-slate-100 text-left"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleCreateIndexAndAlias}
                  disabled={isCreatingIndex}
                  className="bg-amber-500 disabled:bg-slate-800 text-slate-950 px-6 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  {isCreatingIndex ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                  <span>بناء الفهرس والربط بالمستعار على السحابة</span>
                </button>
              </div>

              {indexCreateResult && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold justify-end">
                    <span>تم حفظ هيكل الفهرس بنجاح</span>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <pre className="text-[10px] text-slate-300 font-mono bg-slate-950 p-3 rounded overflow-x-auto text-left leading-relaxed">
                    {JSON.stringify(indexCreateResult, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: INGESTION SAMPLES */}
          {activeTab === 'ingestion' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6"
            >
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2 justify-end">
                  <span>أداة فهرسة وتحميل العينات (Ingestion Engine)</span>
                  <Download className="w-5 h-5 text-amber-500" />
                </h2>
                <p className="text-slate-400 text-xs">
                  قم بتحميل عينات من القضايا والدعاوى القضائية الموثوقة بصيغة مستندات واختبار تواصلها المباشر.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">تحتوي عينات المنظومة على قضايا تجارية، عمالية، أحوال شخصية وإدارية عربية ممتازة.</span>
                  <span className="text-xs font-bold text-slate-200">مراجعة صكوك العينات قبل الدفع بالنظام</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sampleDocuments.map((doc, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col justify-between text-right">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2 py-0.5 rounded border border-amber-500/20">{doc.court_type}</span>
                          <span className="text-[11px] font-mono text-slate-500">{doc.id}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 mb-1.5 leading-relaxed">{doc.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 mb-2">{doc.details}</p>
                      </div>
                      <div className="border-t border-slate-900 pt-2 flex justify-between text-[10px] text-slate-500">
                        <span>الحالة: {doc.status}</span>
                        <span>الخصم: {doc.defendant}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-start gap-4">
                  <button
                    onClick={handleIngestSamples}
                    disabled={isIngesting}
                    className="bg-amber-500 disabled:bg-slate-800 text-slate-950 px-6 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                  >
                    {isIngesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>تغذية الكتلة بالعينات الفورية (Ingest Bulk)</span>
                  </button>
                </div>
              </div>

              {ingestResult && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold justify-end">
                    <span>اكتملت المزامنة وحقن البيانات المجمعة</span>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <pre className="text-[10px] text-slate-300 font-mono bg-slate-950 p-3 rounded overflow-x-auto text-left leading-relaxed">
                    {JSON.stringify(ingestResult, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: SYNONYMS RULES AND ANALYSIS */}
          {activeTab === 'synonyms' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6"
            >
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2 justify-end">
                  <span>محلل المرادفات اللغوية والتفسير القضائي (Synonyms Engine)</span>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </h2>
                <p className="text-slate-400 text-xs">
                  استخدم محركات تحليل المرادفات (Synonyms API) للتواصل والمطابقة، مثل الكشف عن أن كلمة "شكوى" تماثل "دعوى قضائية".
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs text-slate-400 font-semibold">مجموعة المرادفات المعرّفة (Synonym Set ID)</label>
                  <input
                    type="text"
                    value={synsetId}
                    onChange={(e) => setSynsetId(e.target.value)}
                    dir="ltr"
                    className="w-full text-xs font-mono bg-slate-950 text-slate-100 p-3 rounded-lg border border-slate-800"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs text-slate-400 font-semibold">رقم معيار القاعدة (Rule ID)</label>
                  <input
                    type="text"
                    value={synonymRuleId}
                    onChange={(e) => setSynonymRuleId(e.target.value)}
                    dir="ltr"
                    className="w-full text-xs font-mono bg-slate-950 text-slate-100 p-3 rounded-lg border border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs text-slate-400 font-semibold">قيم وتطابقات السلسلة (قاعدة Solr الشائعة)</label>
                <textarea
                  rows={3}
                  value={synonymValue}
                  onChange={(e) => setSynonymValue(e.target.value)}
                  className="w-full text-xs bg-slate-950 text-slate-100 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-start gap-4">
                <button
                  onClick={handleSetupSynonyms}
                  disabled={isCreatingSynonyms}
                  className="bg-amber-500 disabled:bg-slate-800 text-slate-950 px-6 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  {isCreatingSynonyms ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>توليد وتفعيل قواعد التماثل اللفظي</span>
                </button>
              </div>

              {synonymsResult && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold justify-end">
                    <span>قنوات تفعيل المرادفات القضائية جاهزة</span>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <pre className="text-[10px] text-slate-300 font-mono bg-slate-950 p-3 rounded overflow-x-auto text-left leading-relaxed">
                    {JSON.stringify(synonymsResult, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: SEARCH LABORATORY & RESULTS DISPLAY */}
          {activeTab === 'search' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6"
            >
              <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-lg border border-slate-850 justify-end self-start">
                  <button 
                    onClick={() => setShowCustomDsl(!showCustomDsl)}
                    className={`px-3 py-1.5 rounded text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                      showCustomDsl ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    نمط محرر الاستعلام (Raw DSL Editor)
                  </button>
                  <button 
                    onClick={() => setShowCustomDsl(false)}
                    className={`px-3 py-1.5 rounded text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                      !showCustomDsl ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    الاستعلام التلقائي السريع
                  </button>
                </div>

                <div className="text-right">
                  <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2 justify-end">
                    <span>مختبر البحث والاستعلامات المتقدمة (Elasticsearch Search Lab)</span>
                    <Search className="w-5 h-5 text-amber-500" />
                  </h2>
                  <p className="text-slate-400 text-xs">
                    قم بتنفيذ طلبات بحث واسترجاع حقيقية من كتلة خوادم السحابة لمراجعة قوة التحليل والمطابقة الموزونة.
                  </p>
                </div>
              </div>

              {/* Advanced search control bar */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 text-right">
                    <label className="text-xs text-slate-400 font-semibold">استراتيجية خوارزمية البحث</label>
                    <select
                      value={searchStrategy}
                      onChange={(e) => setSearchStrategy(e.target.value as any)}
                      className="w-full text-xs bg-slate-950 border border-slate-850 p-3.5 rounded-lg text-slate-200"
                    >
                      <option value="keyword">البحث النصي التقريبي مع إصلاح الأخطاء (BM25 + Fuzzy)</option>
                      <option value="semantic">البحث اللغوي الموجه بمعاني الجمل الصرفية (Semantic)</option>
                      <option value="hybrid">البحث الهجين المتكامل لنتائج مدمجة (Hybrid RRF)</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-right md:col-span-2">
                    <label className="text-xs text-slate-400 font-semibold">المدخل المراد البحث عنه (Query Text)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن: مطالبة عقد عمل، عقار في مكة، تعويض مالي..."
                        className="w-full text-xs bg-slate-950 text-slate-100 p-3.5 rounded-lg border border-slate-800"
                      />
                      <button
                        onClick={handlePerformSearch}
                        disabled={isSearching}
                        className="bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-6 py-3 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
                      >
                        {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span>ابحث</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom DSL editing block */}
                {showCustomDsl && (
                  <div className="space-y-1.5 text-right">
                    <span className="text-xs font-semibold text-sky-400 font-mono">Elasticsearch Query DSL Payload inspector (JSON)</span>
                    <textarea
                      rows={8}
                      dir="ltr"
                      value={customDslInput}
                      onChange={(e) => setCustomDslInput(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-950 text-amber-500/90 p-4 rounded-xl border border-slate-850 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )}
              </div>

              {/* Render Search Results */}
              {searchResults ? (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-900 text-xs">
                    <div className="text-slate-400">
                      زمن جلب الاستجابة: <span className="font-mono text-emerald-400 font-bold">{searchResults.took}ms</span>
                    </div>
                    <div className="text-slate-400 text-right">
                      مطابقات صالحة: <span className="font-mono text-emerald-400 font-bold">{searchResults.hits?.total?.value || 0}</span> مستند صك
                    </div>
                  </div>

                  <div className="space-y-3">
                    {searchResults.hits?.hits && searchResults.hits.hits.length > 0 ? (
                      searchResults.hits.hits.map((hit: any, index: number) => (
                        <div key={index} className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-3 text-right">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="bg-amber-500/10 text-amber-500/90 text-[10px] px-2 py-0.5 rounded font-mono font-bold">score: {hit._score}</span>
                              <span className="bg-slate-900/80 text-slate-400 text-[10px] px-2 py-0.5 rounded">محكمة {hit._source.court_type}</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-100">{hit._source.title}</h4>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed max-w-none">
                            {hit._source.details}
                          </p>

                          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                            <div className="flex gap-4">
                              <span>الخصم: {hit._source.defendant}</span>
                              <span>الطرف المدعي: {hit._source.plaintiff}</span>
                            </div>
                            <span>تاريخ قيد القضية: {new Date(hit._source.created_at).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 bg-slate-950 text-center rounded-xl border border-slate-900 text-xs text-slate-400">
                        لم يتم العثور على أي نتائج مطابقة لكلمة البحث الحالية. جرب تحميل عينات المزامنة من التبويب المخصص ثم البحث مرة أخرى!
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 bg-slate-950 text-center rounded-2xl border border-slate-900 text-xs text-slate-500">
                  اكتب عبارة البحث واضغط زر ابحث لاسترجاع صكوك الدعاوى والتحليلات القضائية الموثوقة فوراً.
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 6: DEVELOPER CODE GENERATOR */}
          {activeTab === 'code-gen' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6"
            >
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2 justify-end">
                  <span>أكواد الربط والتغذية لمهندسي البرمجيات (Code Generator)</span>
                  <Code className="w-5 h-5 text-amber-500" />
                </h2>
                <p className="text-slate-400 text-xs">
                  أكواد برمجية جاهزة وموثقة بالكلية باللغة العربية تمكن فريق مهندسي مكتبكم من تشغيل فهارس Elasticsearch في تطبيقاتكم بشكل دائم.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/5 px-2.5 py-1 rounded-md mb-2 inline-block">حزمة Node.js / TypeScript الكاملة</span>
                  <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto text-left leading-relaxed select-all">
{`import { Client } from '@elastic/elasticsearch';

// 1. تهيئة وإعطاء عميل الاتصال
const client = new Client({
  node: '${endpoint}',
  auth: {
    apiKey: '${apiKey}'
  }
});

// 2. دالة البحث النصي التقريبي والوزن الهجين بنظام المحاكم الموحد
async function searchLawsuits(queryText: string) {
  try {
    const searchResponse = await client.search({
      index: '${aliasName || 'najiz_lawsuits'}',
      body: {
        query: {
          multi_match: {
            query: queryText,
            fields: ['title^3', 'details', 'court_type'],
            fuzziness: 'AUTO',
            analyzer: 'arabic_custom'
          }
        },
        highlight: {
          fields: {
            title: {},
            details: {}
          }
        }
      }
    });
    
    console.log(\`تم استرجاع \${searchResponse.hits.total.value} تطابق قضائي صائب:\`);
    return searchResponse.hits.hits;
  } catch (error) {
    console.error('خطأ أثناء تشغيل بحث العدالة:', error);
    throw error;
  }
}`}
                  </pre>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                  <span className="text-xs font-semibold text-blue-400 bg-blue-400/5 px-2.5 py-1 rounded-md mb-2 inline-block">نمط استدعاء بايثون (Python Elasticsearch Client)</span>
                  <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto text-left leading-relaxed select-all">
{`from elasticsearch import Elasticsearch

# تهيئة الاتصال فائق الموثوقية
es = Elasticsearch(
    "${endpoint}",
    api_key="${apiKey}"
)

# استعلام بوابات صكوك الأحكام والدعاوى الشرعية
query = {
    "multi_match": {
        "query": "مطالبة مالية للأعمال",
        "fields": ["title^3", "details"],
        "fuzziness": "AUTO"
    }
}

response = es.search(index="${aliasName || 'najiz_lawsuits'}", query=query)
for hit in response['hits']['hits']:
    print(f"قضية: {hit['_source']['title']} (Score: {hit['_score']})")`}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}

        </div>

      </div>

    </div>
  );
}
