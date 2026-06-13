import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Server, 
  Play, 
  Square, 
  Terminal as TerminalIcon, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Search, 
  BookOpen, 
  Cpu, 
  Layers, 
  Lock, 
  ShieldAlert,
  ChevronDown,
  Activity,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Predefined SQL Templates for Platform Admins and Lawyers
const SQL_PRESETS = [
  {
    title: 'موجز القضايا وحالاتها الجارية',
    sql: 'SELECT status, COUNT(*) as "عدد القضايا" FROM cases GROUP BY status;',
    description: 'تحليل توزيع ومؤشرات الدعاوى لتوزيع أعباء العمل.'
  },
  {
    title: 'سجل العملاء النشطين والمعتمدين',
    sql: 'SELECT id, name, phone, email, type FROM clients ORDER BY id DESC LIMIT 5;',
    description: 'عرض أحدث العملاء المنضمين للمنصة لإنشاء تقارير الامتثال.'
  },
  {
    title: 'المهام المعلقة ذات الأولوية العالية',
    sql: "SELECT id, title, due_date, status, priority FROM tasks WHERE priority = 'high' AND status != 'completed';",
    description: 'حساب أعداد وفهرسة التكليفات القضائية العاجلة.'
  },
  {
    title: 'إجمالي المطالبات والفواتير المستحقة',
    sql: "SELECT status, SUM(amount) as \"إجمالي المبالغ\" FROM invoices GROUP BY status;",
    description: 'استخراج ملخص الوضع المالي للمستحقات والقيم الضريبية.'
  }
];

export default function DbDevOpsModule() {
  // Tabs: compose_gen, container_sim, connection_tester, sql_console, cloudbeaver_guide
  const [activeSubTab, setActiveSubTab] = useState<'compose_gen' | 'container_sim' | 'connection_tester' | 'sql_console' | 'cloudbeaver_guide'>('compose_gen');

  // Interactive docker-compose parameters
  const [dbUser, setDbUser] = useState('aladalah_admin');
  const [dbPassword, setDbPassword] = useState('AlAdalahSecurePass2026!');
  const [dbName, setDbName] = useState('aladalah_prod');
  const [dbPort, setDbPort] = useState('5432');
  const [cbPort, setCbPort] = useState('8978');
  const [dockerVolume, setDockerVolume] = useState('aladalah_postgres_data');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Connection parameters
  const [useConnString, setUseConnString] = useState(false);
  const [connString, setConnString] = useState('');
  const [testHost, setTestHost] = useState('127.0.0.1');
  const [testPort, setTestPort] = useState('5432');
  const [testUser, setTestUser] = useState('aladalah_admin');
  const [testPass, setTestPass] = useState('AlAdalahSecurePass2026!');
  const [testDb, setTestDb] = useState('aladalah_prod');
  
  // Connection state outputs
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    version?: string;
    hint?: string;
    serverTime?: string;
    database?: string;
  }>({ status: null, message: '' });

  // SQL Console states
  const [sqlQuery, setSqlQuery] = useState('SELECT status, COUNT(*) as "عدد القضايا" FROM cases GROUP BY status;');
  const [executingQuery, setExecutingQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<{
    status: string;
    rows?: any[];
    fields?: string[];
    rowCount?: number;
    simulated?: boolean;
    message?: string;
  } | null>(null);

  // Simulated Container details
  const [containerStates, setContainerStates] = useState({
    postgres: 'running' as 'running' | 'stopped' | 'starting' | 'stopping',
    cloudbeaver: 'running' as 'running' | 'stopped' | 'starting' | 'stopping',
    webPlatform: 'running' as 'running' | 'stopped' | 'starting' | 'stopping'
  });
  const [liveLogs, setLiveLogs] = useState<string[]>([
    '[system] Docker Daemon successfully initialized target bridge network "aladalah-network".',
    '[postgres-db] LOG: database system is ready to accept connections on port 5432',
    '[postgres-db] LOG: database system was shut down at 2026-06-09 16:15:22 UTC',
    '[postgres-db] LOG: Multi-user database server active',
    '[cloudbeaver] INFO: Starting CloudBeaver SQL Web Client Community Edition...',
    '[cloudbeaver] INFO: CloudBeaver Listening on http://localhost:8978/',
    '[web-platform] INFO: Al-Adalah Platform connected to PG container successfully.'
  ]);
  const [simulatingAction, setSimulatingAction] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveLogs]);

  // Copy utility
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Test dynamic connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult({ status: null, message: '' });

    try {
      const payload = useConnString 
        ? { connectionString: connString }
        : { host: testHost, port: testPort, user: testUser, password: testPass, database: testDb };

      const res = await fetch('/api/db/test-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setConnectionResult({
          status: 'success',
          message: data.message,
          version: data.version,
          database: data.database,
          serverTime: data.serverTime
        });
      } else {
        setConnectionResult({
          status: 'error',
          message: data.message || 'خطأ غير معروف في اختبار الاتصال.',
          hint: data.hint
        });
      }
    } catch (e: any) {
      setConnectionResult({
        status: 'error',
        message: `تعذر الوصول لخادم الويب الفرعي: ${e.message}`,
        hint: 'يرجى التحقق من تشغيل بيئة النود وتحديث الاتصال بشكل كامل.'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Execute custom query
  const handleExecuteQuery = async () => {
    setExecutingQuery(true);
    try {
      const activeConn = useConnString ? connString : '';
      const res = await fetch('/api/db/run-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: sqlQuery,
          connectionString: activeConn
        })
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (e: any) {
      setQueryResult({
        status: 'query_error',
        message: `فشل الاتصال بخادم الاستعلامات: ${e.message}`
      });
    } finally {
      setExecutingQuery(false);
    }
  };

  // Simulate starting/stopping container controls
  const handleContainerAction = (containerKey: 'postgres' | 'cloudbeaver' | 'webPlatform', action: 'start' | 'stop') => {
    setSimulatingAction(`${containerKey}_${action}`);
    
    setContainerStates(prev => ({
      ...prev,
      [containerKey]: action === 'start' ? 'starting' : 'stopping'
    }));

    // Generate step logs
    const timestamp = new Date().toLocaleTimeString('ar-SA');
    const logsToAdd: string[] = [];

    setTimeout(() => {
      if (action === 'start') {
        setContainerStates(prev => ({ ...prev, [containerKey]: 'running' }));
        if (containerKey === 'postgres') {
          logsToAdd.push(
            `[${timestamp}] [postgres-db] LOG: received smart start command.`,
            `[${timestamp}] [postgres-db] LOG: database system is ready to accept connections on port ${dbPort}.`,
            `[${timestamp}] [postgres-db] LOG: max logical replication slots set to 10.`
          );
        } else if (containerKey === 'cloudbeaver') {
          logsToAdd.push(
            `[${timestamp}] [cloudbeaver] INFO: Loaded visual web drivers for Postgres, MySQL, Oracle.`,
            `[${timestamp}] [cloudbeaver] INFO: Listening on http://localhost:${cbPort}/`
          );
        } else {
          logsToAdd.push(`[${timestamp}] [web-platform] INFO: Front-end container hotloaded with development server on port 3000.`);
        }
      } else {
        setContainerStates(prev => ({ ...prev, [containerKey]: 'stopped' }));
        if (containerKey === 'postgres') {
          logsToAdd.push(
            `[${timestamp}] [postgres-db] LOG: received smart stop command.`,
            `[${timestamp}] [postgres-db] LOG: database system is closed.`
          );
        } else if (containerKey === 'cloudbeaver') {
          logsToAdd.push(`[${timestamp}] [cloudbeaver] INFO: Server stopped listening on port ${cbPort}.`);
        } else {
          logsToAdd.push(`[${timestamp}] [web-platform] WARNING: Platform client decoupled from core services.`);
        }
      }

      setLiveLogs(prev => [...prev, ...logsToAdd]);
      setSimulatingAction(null);
    }, 1500);
  };

  // Dynamic values
  const dockerComposeYaml = `version: '3.8'

services:
  # 🏛️ PostgreSQL database engine container
  aladalah-postgres-db:
    image: postgres:16-alpine
    container_name: aladalah-postgres-db
    restart: always
    environment:
      POSTGRES_USER: \${POSTGRES_USER:-${dbUser}}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-${dbPassword}}
      POSTGRES_DB: \${POSTGRES_DB:-${dbName}}
    ports:
      - "${dbPort}:5432"
    volumes:
      - ${dockerVolume}:/var/lib/postgresql/data
    networks:
      - aladalah-network

  # 🦫 CloudBeaver - Advanced Web-based Universal Database Manager
  aladalah-cloudbeaver:
    image: dbeaver/cloudbeaver:latest
    container_name: aladalah-cloudbeaver
    restart: always
    ports:
      - "${cbPort}:8978"
    volumes:
      - cloudbeaver-data:/opt/cloudbeaver/workspace
    networks:
      - aladalah-network
    depends_on:
      - aladalah-postgres-db

  # ⚖️ Al-Adalah Enterprise Main Web Platform Container
  aladalah-web-platform:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: aladalah-web-platform
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
      POSTGRES_URL: "postgresql://${dbUser}:${dbPassword}@aladalah-postgres-db:5432/${dbName}"
    ports:
      - "3000:3000"
    networks:
      - aladalah-network
    depends_on:
      - aladalah-postgres-db

volumes:
  ${dockerVolume}:
  cloudbeaver-data:

networks:
  aladalah-network:
    driver: bridge`;

  const dotEnvFile = `# Al-Adalah Platform Environment Variables (PostgreSQL Stack Setup)
POSTGRES_USER=${dbUser}
POSTGRES_PASSWORD=${dbPassword}
POSTGRES_DB=${dbName}
POSTGRES_URL=postgresql://${dbUser}:${dbPassword}@localhost:${dbPort}/${dbName}
CLOUDBEAVER_PORT=${cbPort}
DOCKER_VOLUME_NAME=${dockerVolume}`;

  const initSqlSchema = `-- ⚖️ Al-Adalah Client platform - PostgreSQL Initial Setup Schema
-- Created to execute directly in CloudBeaver SQL editor or pgAdmin.

-- 1. Table schema for Clients
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    type VARCHAR(50) DEFAULT 'individual', -- individual or corporate
    id_number VARCHAR(50),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table schema for Cases
CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    case_number VARCHAR(100) UNIQUE NOT NULL,
    client_id INT REFERENCES clients(id) ON DELETE SET NULL,
    court VARCHAR(255),
    status VARCHAR(50) DEFAULT 'open', -- open, closed, appealing
    category VARCHAR(100), -- commercial, labor, criminal, civil
    last_session_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed some sandbox initial data for Al-Adalah Database testing
INSERT INTO clients (name, phone, email, type, id_number) VALUES
('مجموعة الراجحي الاستثمارية', '920000001', 'info@alrajhi.com', 'corporate', '700123561'),
('فيصل بن فهد العتيبي', '0555123456', 'faysal@domain.sa', 'individual', '1098765432')
ON CONFLICT DO NOTHING;`;

  return (
    <div className="w-full min-h-[85vh] bg-slate-950 text-slate-100 rounded-3xl p-6 md:p-8 space-y-8 border border-slate-800 relative z-10 font-sans" dir="rtl">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-[10px] uppercase font-black bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20 tracking-wider">
              بيئة التشغيل وقواعد البيانات
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-400">DevOps Workspace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-orange-400" />
            منظومة PostgreSQL + Docker + CloudBeaver
          </h1>
          <p className="text-slate-400 text-sm max-w-3xl font-medium leading-relaxed">
            المركز الإداري لتهيئة قنوات الربط، وإدارة قاعدة البيانات العلائقية المعتمدة، وإنشاء سيناريوهات النشر وتوليد ملفات الحاويات لدمج منصة العدالة مع أداة الإدارة السحابية CloudBeaver.
          </p>
        </div>
        
        {/* Status Hub Widget */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 shrink-0 min-w-full sm:min-w-[320px] shadow-lg">
          <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">الحالة العامة للمحاكي</div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Postgres Core Engine:</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${containerStates.postgres === 'running' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {containerStates.postgres === 'running' ? 'نشط 🟢' : 'متوقف 🔴'}
              </span>
            </div>
            <div className="text-[9px] text-slate-500 font-sans">Active Sandbox: Al-Adalah Relational Model</div>
          </div>
        </div>
      </div>

      {/* Tabs list to route DevOps sections */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('compose_gen')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
            activeSubTab === 'compose_gen'
              ? 'bg-gradient-to-l from-orange-600 to-amber-600 text-white shadow-md'
              : 'text-slate-300'
          }`}
        >
          <Settings className="w-4 h-4" />
          مولد ملف Docker Compose
        </button>

        <button
          onClick={() => setActiveSubTab('container_sim')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 relative ${
            activeSubTab === 'container_sim'
              ? 'bg-gradient-to-l from-orange-600 to-amber-600 text-white shadow-md'
              : 'text-slate-300'
          }`}
        >
          <Cpu className="w-4 h-4" />
          مراقب الحاويات واللوقز
          <span className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
        </button>

        <button
          onClick={() => setActiveSubTab('connection_tester')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
            activeSubTab === 'connection_tester'
              ? 'bg-gradient-to-l from-orange-600 to-amber-600 text-white shadow-md'
              : 'text-slate-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          مختبر اتصال PostgreSQL
        </button>

        <button
          onClick={() => setActiveSubTab('sql_console')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
            activeSubTab === 'sql_console'
              ? 'bg-gradient-to-l from-orange-600 to-amber-600 text-white shadow-md'
              : 'text-slate-300'
          }`}
        >
          <Database className="w-4 h-4" />
          منصة الاستعلامات SQL Console
        </button>

        <button
          onClick={() => setActiveSubTab('cloudbeaver_guide')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
            activeSubTab === 'cloudbeaver_guide'
              ? 'bg-gradient-to-l from-orange-600 to-amber-600 text-white shadow-md'
              : 'text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          دليل الربط مع CloudBeaver
        </button>
      </div>

      {/* SUB-TABS VIEWS */}
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: DOCKER COMPOSE CONFIGURATION BUILDER */}
        {activeSubTab === 'compose_gen' && (
          <motion.div
            key="compose_gen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Properties Panel (Col: 5) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">تخصيص متغيرات Docker البيئية</h3>
                  <p className="text-slate-400 text-xs">قم بتهيئة معاملات الحاويات والشبكة لتوليد ملفات تشغيل مطابقة لمعايير الأمن.</p>
                </div>

                <div className="space-y-4">
                  {/* Database User */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300 font-bold">اسم مستخدم قاعدة البيانات</label>
                    <input 
                      type="text" 
                      value={dbUser} 
                      onChange={(e) => setDbUser(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>

                  {/* Database Password */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-300 font-bold">كلمة المرور المشفرة</label>
                      <span className="text-[10px] text-orange-400 font-sans flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Secure Stack
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={dbPassword} 
                      onChange={(e) => setDbPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono focus:border-orange-400 outline-none"
                    />
                  </div>

                  {/* Database Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300 font-bold">اسم قاعدة البيانات الافتراضية</label>
                    <input 
                      type="text" 
                      value={dbName} 
                      onChange={(e) => setDbName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-orange-500 outline-none"
                    />
                  </div>

                  {/* Ports Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 font-bold">منفذ PostgreSQL</label>
                      <input 
                        type="text" 
                        value={dbPort} 
                        onChange={(e) => setDbPort(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 font-bold">منفذ CloudBeaver UI</label>
                      <input 
                        type="text" 
                        value={cbPort} 
                        onChange={(e) => setCbPort(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono focus:border-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Docker Volume Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300 font-bold">اسم وحدة تخزين Docker (Persistent Volume)</label>
                    <input 
                      type="text" 
                      value={dockerVolume} 
                      onChange={(e) => setDockerVolume(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Informative Security Warning */}
              <div className="bg-slate-950 border border-amber-500/20 p-5 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-400">توصية أمن الشبكات الموحدة</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    منفذ <b>5432</b> يستخدم محلياً. عند الرفع للإنتاج، ننصح بحجب المنفذ الخارجي لـ PostgreSQL وفك الارتباط بالتفويض المباشر، وتفعيل مستكشف <b>CloudBeaver</b> محمي برمز مستخدم وسري خلف جدار النفاذ الآمن (VPN).
                  </p>
                </div>
              </div>
            </div>

            {/* Generated Code Display (Col: 7) */}
            <div className="lg:col-span-7 space-y-6">
              {/* docker-compose block */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="px-5 py-3.5 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    <span className="text-xs text-slate-300 font-bold font-mono mr-2">docker-compose.yml</span>
                  </div>
                  <button
                    onClick={() => handleCopy(dockerComposeYaml, 'compose')}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5"
                  >
                    {copiedText === 'compose' ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> تم النسخ!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> نسخ الملف
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 bg-slate-950 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto h-96 select-text text-left dark-scrollbar" style={{ direction: 'ltr' }}>
                  <pre>{dockerComposeYaml}</pre>
                </div>
              </div>

              {/* Auxiliary config files (dotenv, init.sql) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dotenv block */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-800/30 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-300 font-mono">.env</span>
                    <button
                      onClick={() => handleCopy(dotEnvFile, 'dotenv')}
                      className="text-[10px] text-orange-400 flex items-center gap-1"
                    >
                      {copiedText === 'dotenv' ? 'تم النسخ!' : 'نسخ المتغيرات'}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-950 font-mono text-[10px] leading-relaxed text-slate-400 overflow-x-auto h-40 select-text text-left" style={{ direction: 'ltr' }}>
                    <pre>{dotEnvFile}</pre>
                  </div>
                </div>

                {/* DB Init Script */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-800/30 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-300 font-mono">init-schema.sql</span>
                    <button
                      onClick={() => handleCopy(initSqlSchema, 'initsql')}
                      className="text-[10px] text-orange-400 flex items-center gap-1"
                    >
                      {copiedText === 'initsql' ? 'تم النسخ!' : 'نسخ الاسكيمو'}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-950 font-mono text-[10px] leading-relaxed text-slate-400 overflow-x-auto h-40 select-text text-left" style={{ direction: 'ltr' }}>
                    <pre>{initSqlSchema}</pre>
                  </div>
                </div>
              </div>

              {/* Action CLI block */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">كيف تبدأ التشغيل الفعلي بالحاويات؟</h4>
                  <p className="text-slate-400 text-xs">انسخ الملفات الثلاثة أعلاه في نفس المجلد ثم شغل منفذ القيادة بالمرتبة التالية:</p>
                </div>
                <div className="bg-slate-950 p-2.5 px-4 rounded-xl text-xs font-mono text-orange-400 border border-slate-800 font-bold select-all flex items-center gap-2">
                  <span>docker-compose up -d</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: DOCKER CONTAINER AND LOGS SIMULATOR */}
        {activeSubTab === 'container_sim' && (
          <motion.div
            key="container_sim"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Containers Network Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PostgreSQL container */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 font-bold">CONTAINER: aladalah-postgres-db</div>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <Database className="w-5 h-5 text-blue-400" />
                        محرك قاعدة البيانات
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg ${
                      containerStates.postgres === 'running' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : containerStates.postgres === 'stopped'
                        ? 'bg-rose-500/10 text-rose-450'
                        : 'bg-yellow-500/10 text-yellow-550 animate-pulse'
                    }`}>
                      {containerStates.postgres === 'running' ? 'Active ●' : containerStates.postgres === 'stopped' ? 'Stopped' : 'Transitioning...'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/60 font-mono text-left" style={{ direction: 'ltr' }}>
                    <div className="truncate">Image: postgres:16-alpine</div>
                    <div>Port: {dbPort} {"➔"} 5432</div>
                    <div className="truncate">Vol: {dockerVolume}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6 border-t border-slate-800 pt-4">
                  {containerStates.postgres === 'stopped' ? (
                    <button
                      onClick={() => handleContainerAction('postgres', 'start')}
                      disabled={simulatingAction !== null}
                      className="flex-1 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" /> تشغيل
                    </button>
                  ) : (
                    <button
                      onClick={() => handleContainerAction('postgres', 'stop')}
                      disabled={simulatingAction !== null}
                      className="flex-1 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5" /> إيقاف
                    </button>
                  )}
                </div>
              </div>

              {/* CloudBeaver container */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 font-bold">CONTAINER: aladalah-cloudbeaver</div>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <Layers className="w-5 h-5 text-orange-400" />
                        واجهة الإدارة والبيانات
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg ${
                      containerStates.cloudbeaver === 'running' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : containerStates.cloudbeaver === 'stopped'
                        ? 'bg-rose-500/10 text-rose-450'
                        : 'bg-yellow-500/10 text-yellow-550 animate-pulse'
                    }`}>
                      {containerStates.cloudbeaver === 'running' ? 'Active ●' : containerStates.cloudbeaver === 'stopped' ? 'Stopped' : 'Transitioning...'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/60 font-mono text-left" style={{ direction: 'ltr' }}>
                    <div className="truncate">Image: cloudbeaver:latest</div>
                    <div>Port: {cbPort} {"➔"} 8978</div>
                    <div className="truncate">Network: aladalah-network</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6 border-t border-slate-800 pt-4">
                  {containerStates.cloudbeaver === 'stopped' ? (
                    <button
                      onClick={() => handleContainerAction('cloudbeaver', 'start')}
                      disabled={simulatingAction !== null}
                      className="flex-1 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" /> تشغيل
                    </button>
                  ) : (
                    <button
                      onClick={() => handleContainerAction('cloudbeaver', 'stop')}
                      disabled={simulatingAction !== null}
                      className="flex-1 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5" /> إيقاف
                    </button>
                  )}
                </div>
              </div>

              {/* Al-Adalah main server container */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 font-bold">CONTAINER: aladalah-web-platform</div>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <Server className="w-5 h-5 text-emerald-400" />
                        منصة التطبيق والويب
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg ${
                      containerStates.webPlatform === 'running' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : containerStates.webPlatform === 'stopped'
                        ? 'bg-rose-500/10 text-rose-450'
                        : 'bg-yellow-500/10 text-yellow-550 animate-pulse'
                    }`}>
                      {containerStates.webPlatform === 'running' ? 'Active ●' : containerStates.webPlatform === 'stopped' ? 'Stopped' : 'Transitioning...'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/60 font-mono text-left" style={{ direction: 'ltr' }}>
                    <div className="truncate">Context: Dockerfile build</div>
                    <div>Port: 3000 {"➔"} 3000</div>
                    <div className="truncate text-yellow-450">Driver: Node/Express v4</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6 border-t border-slate-800 pt-4">
                  {containerStates.webPlatform === 'stopped' ? (
                    <button
                      onClick={() => handleContainerAction('webPlatform', 'start')}
                      disabled={simulatingAction !== null}
                      className="flex-1 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" /> تشغيل
                    </button>
                  ) : (
                    <button
                      onClick={() => handleContainerAction('webPlatform', 'stop')}
                      disabled={simulatingAction !== null}
                      className="flex-1 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5" /> إيقاف
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Simulated Live Terminal Output Logs */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4.5 h-4.5 text-orange-400" />
                  <span className="text-xs font-bold text-white">منصة المراقبة ومحاكي الأوامر (Stdout Logger)</span>
                </div>
                <button
                  onClick={() => {
                    setLiveLogs([`[${new Date().toLocaleTimeString('ar-SA')}] [system] Terminal logs cleared.`]);
                  }}
                  className="px-2.5 py-1 text-[10px] text-slate-400 rounded transition font-bold"
                >
                  مسح السجل
                </button>
              </div>
              
              <div className="p-5 bg-slate-950 font-mono text-xs text-emerald-400 h-64 overflow-y-auto leading-relaxed select-text space-y-1.5 text-left" style={{ direction: 'ltr' }}>
                {liveLogs.map((log, index) => {
                  let colorClass = 'text-slate-300';
                  if (log.includes('ready to accept') || log.includes('successfully') || log.includes('Active')) {
                    colorClass = 'text-emerald-400';
                  } else if (log.includes('WARNING') || log.includes('closed') || log.includes('shut down') || log.includes('stop')) {
                    colorClass = 'text-amber-500';
                  } else if (log.includes('[system]')) {
                    colorClass = 'text-blue-400';
                  }
                  return (
                    <div key={index} className={colorClass}>
                      {log}
                    </div>
                  );
                })}
                <div ref={logsEndRef} />
              </div>
              <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>تحديث تلقائي للمنصة كلما طرأت تغييرات بالمنظومة القضائية.</span>
                <span className="font-mono">Logs: {liveLogs.length} entries</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: DYNAMIC CONNECTION TESTER */}
        {activeSubTab === 'connection_tester' && (
          <motion.div
            key="connection_tester"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Form Parameters column (Col: 5) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">بيانات خادم PostgreSQL المستهدف</h3>
                  <p className="text-slate-405 text-xs text-slate-400 leading-relaxed">
                    اختبر إمكانية اتصال الخادم السحابي أو الحزمة الخاصة بك بـ Postgres مباشرة. يدعم الاتصال برمز مخصص للتجربة السريعة.
                  </p>
                </div>

                {/* Connection switch */}
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-xs font-bold text-slate-300">طريقة الاتصال</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUseConnString(false)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${!useConnString ? 'bg-orange-500 text-white' : 'text-slate-400'}`}
                    >
                      تفصيل المعاملات
                    </button>
                    <button
                      onClick={() => setUseConnString(true)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${useConnString ? 'bg-orange-500 text-white' : 'text-slate-400'}`}
                    >
                      رابط اتصال URL
                    </button>
                  </div>
                </div>

                {!useConnString ? (
                  <div className="space-y-4">
                    {/* Host & Port */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">عنوان الخادم (Host)</label>
                        <input
                          type="text"
                          value={testHost}
                          onChange={(e) => setTestHost(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                          placeholder="e.g. localhost"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">المنفذ</label>
                        <input
                          type="text"
                          value={testPort}
                          onChange={(e) => setTestPort(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                        />
                      </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">اسم المستخدم (User)</label>
                      <input
                        type="text"
                        value={testUser}
                        onChange={(e) => setTestUser(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">كلمة المرور</label>
                      <input
                        type="password"
                        value={testPass}
                        onChange={(e) => setTestPass(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white text-left font-mono"
                        style={{ direction: 'ltr' }}
                      />
                    </div>

                    {/* DB Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">قاعدة البيانات المفضلة</label>
                      <input
                        type="text"
                        value={testDb}
                        onChange={(e) => setTestDb(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400">سلسلة الاتصال الكاملة (POSTGRES_URL)</label>
                    <textarea
                      value={connString}
                      onChange={(e) => setConnString(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white text-left"
                      style={{ direction: 'ltr' }}
                      placeholder="postgresql://username:password@hostname:5432/dbname"
                    />
                  </div>
                )}

                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="w-full py-3 bg-gradient-to-l from-orange-600 to-amber-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition duration-300 flex items-center justify-center gap-2 shadow-md shadow-orange-950/20"
                >
                  {testingConnection ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> جاري فحص الاتصال وقراءة السيرفر...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> فحص واختبار الاتصال الفعلي
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Column (Col: 7) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-full flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">نتائج الفحص والتشخيص الفني</h3>
                    <p className="text-slate-400 text-xs text-slate-400">مخرجات الاتصال بالوقت الحقيقي مع تشخيص لمسببات الأخطاء والاحترازات الوقائية.</p>
                  </div>

                  {connectionResult.status === null ? (
                    <div className="bg-slate-950/40 border border-slate-800 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 py-16">
                      <Database className="w-12 h-12 text-slate-600 animate-pulse" />
                      <div className="text-slate-400 text-xs font-bold">بانتظار تهيئة واختبار المعاملات أعلاه...</div>
                      <p className="text-slate-500 text-[11px] max-w-sm">
                        سيقوم المضيف بمحاولة فتح مأخذ اتصال TCP آمن وفحص صلاحيات الهوية وبث الرد السريع.
                      </p>
                    </div>
                  ) : connectionResult.status === 'success' ? (
                    <div className="space-y-4">
                      {/* Success Alert */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                        <div>
                          <h4 className="text-sm font-bold text-emerald-400">عملية الاتصال تمت بنجاح!</h4>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{connectionResult.message}</p>
                        </div>
                      </div>

                      {/* Diagnostic details */}
                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-3 font-sans">
                        <div className="text-xs text-slate-400 font-bold border-b border-slate-800/80 pb-2">تفاصيل نظام PostgreSQL المتصل:</div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500">اسم قاعدة البيانات المتصل بها:</span>
                            <div className="font-bold text-white mt-1 font-mono">{connectionResult.database || 'aladalah_prod'}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">توقيت مجمع الخادم المضيف:</span>
                            <div className="font-bold text-white mt-1 font-mono">{connectionResult.serverTime || new Date().toISOString()}</div>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-slate-500">إصدار PostgreSQL:</span>
                            <div className="font-bold text-emerald-400 mt-1 font-mono leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800/80 text-[10px] select-all">
                              {connectionResult.version}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Failure Alert */}
                      <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
                        <div>
                          <h4 className="text-sm font-bold text-rose-450 text-rose-400">فشل في تأسيس الاتصال الفعلي</h4>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{connectionResult.message}</p>
                        </div>
                      </div>

                      {/* Hint section */}
                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-3">
                        <div className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4" />
                          <span>توصيات الفحص الاستباقي للخلل (DevOps Hint):</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {connectionResult.hint || 'الرابط الافتراضي مغلق أو المنفذ مشغول. إذا كنت تشغل بيئة Docker محلياً، تأكد من تشغيل الحاوية باستخدام الأمر "docker ps".'}
                        </p>
                        
                        <div className="mt-4 pt-3 border-t border-slate-800/80">
                          <span className="text-[10px] text-slate-500">بديل محلي سريع:</span>
                          <p className="text-[10px] text-orange-400 mt-1 leading-relaxed">
                            تعمل منصة الاستعلامات بسلاسة وبشكل ذكي ومستقر عبر سحب البيانات النشطة في المنصة تلقائياً فور غياب المتغير POSTGRES_URL.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-550 border-t border-slate-800/60 pt-4 text-slate-500 leading-normal">
                  ملاحظة: المتصفح لا يستطيع فتح اتصالات TCP مباشرة نظراً للقيود الأمنية، لذا يمر طلبك بقنوات المعالجة الخلفية الآمنة لـ Al-Adalah API للتنفيذ بكفاءة.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 4: INTERACTIVE SQL CONSOLE & SCHEMA TREE */}
        {activeSubTab === 'sql_console' && (
          <motion.div
            key="sql_console"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column: SQL Editor and table results (Col: 9) */}
            <div className="lg:col-span-9 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {/* Editor Header */}
                <div className="px-5 py-3.5 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4.5 h-4.5 text-orange-400" />
                    <span className="text-xs font-bold text-white">منفذ الاستدعالات البرمجي (PostgreSQL Terminal Editor)</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExecuteQuery}
                      disabled={executingQuery}
                      className="px-4 py-2 bg-gradient-to-l from-orange-600 to-amber-600 disabled:opacity-50 text-white text-xs font-black rounded-lg transition duration-300 flex items-center gap-1.5"
                    >
                      {executingQuery ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> جاري التنفيذ...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> تشغيل الاستعلام
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Text Area SQL input */}
                <div className="relative">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-950 p-5 font-mono text-sm leading-relaxed text-slate-350 text-slate-200 outline-none select-text text-left border-b border-slate-800 font-bold focus:bg-slate-950/80 transition-all"
                    style={{ direction: 'ltr' }}
                    placeholder="SELECT * FROM cases LIMIT 10;"
                  />
                  <div className="absolute bottom-3 left-4 text-[9px] text-slate-500 font-mono select-none">
                    Ctrl + Enter executes
                  </div>
                </div>

                {/* Predefined templates block */}
                <div className="p-4 bg-slate-900/50 border-t border-slate-800/40">
                  <span className="text-[10px] text-slate-400 font-black tracking-wide uppercase mb-2 block">الحزم الاستعلامية الجاهزة (SQL Quick Presets)</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SQL_PRESETS.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => setSqlQuery(preset.sql)}
                        className="bg-slate-950/80 text-right p-3 rounded-xl border border-slate-800 transition duration-200 group text-xs flex flex-col justify-between gap-1"
                      >
                        <div className="font-bold text-white transition-colors flex items-center justify-between w-full">
                          <span>{preset.title}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 transform -rotate-180" />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1 text-left w-full truncate" style={{ direction: 'ltr' }}>
                          {preset.sql}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table / Query Results Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="px-5 py-3.5 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">جدول مخرجات الاستعلام الفعلي</span>
                  {queryResult && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-orange-400">
                      Found: {queryResult.rowCount !== undefined ? queryResult.rowCount : 0} rows
                    </span>
                  )}
                </div>

                <div className="p-1 max-h-[420px] overflow-auto select-text dark-scrollbar">
                  {!queryResult ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-2 text-slate-500 py-16">
                      <TerminalIcon className="w-10 h-10 animate-pulse text-slate-600" />
                      <div className="text-slate-400 text-xs font-bold">بانتظار تنفيذ استعلام SQL...</div>
                      <p className="text-slate-500 text-[10px] max-w-sm">
                        اكتب استعلامك بالأعلى أو اضغط على أحد الضوابط السريعة المجهزة ليقوم النظام بتعديل التقرير وقراءة الجداول المحدثة فوراً.
                      </p>
                    </div>
                  ) : queryResult.status === 'query_error' ? (
                    <div className="p-6 bg-slate-950 space-y-3">
                      <div className="bg-rose-500/15 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5.5 h-5.5 text-rose-450 text-rose-400 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-rose-400">خطأ في بناء الجملة أو تنفيذ الطلب:</h4>
                          <p className="text-[11px] text-slate-355 text-slate-300 font-mono mt-1 leading-relaxed text-left" style={{ direction: 'ltr' }}>{queryResult.message}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Notice of simulated state or success */}
                      {queryResult.simulated && (
                        <div className="px-4 py-2 mx-4 mt-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg flex items-center gap-1.5 justify-center">
                          <Activity className="w-3.5 h-3.5 animate-pulse" />
                          <span>وضع المحاكاة الآمن نشط: يتم العرض محلياً بالارتباط مع سجلات منصة العدالة مباشرة (دون الحاجة لاتصال خارجي).</span>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-black">
                              {queryResult.fields && queryResult.fields.map((field) => (
                                <th key={field} className="px-4 py-3 font-mono text-right">{field}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.rows && queryResult.rows.length > 0 ? (
                              queryResult.rows.map((row, index) => (
                                <tr key={index} className="border-b border-slate-800/60 transition duration-150">
                                  {queryResult.fields && queryResult.fields.map((field) => (
                                    <td key={field} className="px-4 py-3 text-slate-300 font-mono select-all">
                                      {row[field] !== null && row[field] !== undefined ? String(row[field]) : <span className="text-slate-600">null</span>}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={queryResult.fields ? queryResult.fields.length : 1} className="text-center py-8 text-slate-500 font-bold">
                                  الاستعلام نجح دون إرجاع أي صفوف.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Schema Explorer (Col: 3) */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-md">
                <div>
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">مستكشف الفهارس والجداول</h3>
                  <p className="text-[10px] text-slate-405 text-slate-400">مخطط الشجرة التفاعلي لقاعدة بيانات Al-Adalah</p>
                </div>

                <div className="space-y-3.5 font-sans">
                  {/* Table Object Cases */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-blue-400" />
                        <span>cases (قضايا)</span>
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase font-bold font-sans">Relational</span>
                    </div>
                    <div className="pl-3.5 border-r border-slate-800/80 pr-2 space-y-1 font-mono text-[10px] text-slate-400">
                      <div>id <span className="text-slate-600 text-[9px]">SERIAL PK</span></div>
                      <div>title <span className="text-slate-650 text-[9px] text-slate-600">VARCHAR</span></div>
                      <div>case_number <span className="text-slate-600 text-[9px]">VARCHAR</span></div>
                      <div>status <span className="text-slate-600 text-[9px]">VARCHAR</span></div>
                      <div>court <span className="text-slate-600 text-[9px]">VARCHAR</span></div>
                    </div>
                  </div>

                  {/* Table Object Clients */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-orange-400" />
                        <span>clients (عملاء)</span>
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase font-bold font-sans">Relational</span>
                    </div>
                    <div className="pl-3.5 border-r border-slate-800/80 pr-2 space-y-1 font-mono text-[10px] text-slate-400">
                      <div>id <span className="text-slate-600 text-[9px]">SERIAL PK</span></div>
                      <div>name <span className="text-slate-600 text-[9px]">VARCHAR</span></div>
                      <div>phone <span className="text-slate-600 text-[9px]">VARCHAR</span></div>
                      <div>email <span className="text-slate-600 text-[9px]">VARCHAR</span></div>
                      <div>type <span className="text-slate-600 text-[9px]">VARCHAR</span></div>
                    </div>
                  </div>

                  {/* Table Object Tasks */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-emerald-400" />
                        <span>tasks (مهام)</span>
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Relational</span>
                    </div>
                    <div className="pl-3.5 border-r border-slate-800/80 pr-2 space-y-1 font-mono text-[10px] text-slate-400">
                      <div>id <span className="text-slate-600 text-[9px]">SERIAL PK</span></div>
                      <div>title <span className="text-slate-600 text-[9px]">VARCHAR</span></div>
                      <div>priority <span className="text-slate-600 text-[9px]">VARCHAR</span></div>
                      <div>status <span className="text-slate-600 text-[9px]">VARCHAR</span></div>
                      <div>due_date <span className="text-slate-600 text-[9px]">DATE</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed font-medium">
                  💡 تتيح لك شجرة الاسكيما استعراض الجداول وبناء جمل استعلامية مطابقة لأسماء الأعمدة المجهزة بنطاقات المنصة.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 5: CLOUDBEAVER INTEGRATION GUIDE & VISUAL WIZARD */}
        {activeSubTab === 'cloudbeaver_guide' && (
          <motion.div
            key="cloudbeaver_guide"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 max-w-4xl mx-auto"
          >
            {/* Step 1 banner */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-black">1</span>
                الدخول لواجهة CloudBeaver الرسومية
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed leading-relaxed">
                بعد تشغيل حاويات Docker بنجاح، ستكون واجهة <b>CloudBeaver</b> الرسومية متاحة على متصفحك عبر تشغيل المنفذ المخصص بالأمر التالي:
              </p>
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-orange-400">
                <span className="font-bold">http://localhost:{cbPort}/</span>
                <a
                  href={`http://localhost:${cbPort}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-450 text-[10px] font-sans font-bold rounded-lg transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> فتح واجهة الإدارة
                </a>
              </div>
            </div>

            {/* Config Tutorial Sequence */}
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-350 tracking-wider">خطوات تكوين الاتصال بقاعدة بيانات PostgreSQL داخل الواجهة</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                
                {/* Step Card 1 */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-black max-w-max block">الخطوة الأولى</span>
                    <h4 className="text-xs font-bold text-white">اختيار برنامج تشغيل البيانات</h4>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      في لوحة التحكم الرئيسية لـ CloudBeaver، اضغط على زر <b>"Create Connection"</b> ثم اختر أيقونة <b>PostgreSQL</b> من قائمة برامج التشغيل المدعومة.
                    </p>
                  </div>
                  <div className="pt-2 text-[10px] text-orange-400 font-bold font-sans">Driver: PostgreSQL (Standard)</div>
                </div>

                {/* Step Card 2 */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded font-black max-w-max block">الخطوة الثانية</span>
                    <h4 className="text-xs font-bold text-white">إدخال إعدادات الاتصال الآمن</h4>
                    <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
                      أدخل الإعدادات التالية بدقة:
                      <br />• <b>Host:</b> aladalah-postgres-db (اسم الخدمة في شبكة الحاوية)
                      <br />• <b>Database:</b> {dbName}
                      <br />• <b>Port:</b> 5432
                    </p>
                  </div>
                  <div className="pt-2 text-[10px] text-blue-400 font-bold font-mono">Routing: Docker Bridge Network</div>
                </div>

                {/* Step Card 3 */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black max-w-max block">الخطوة الثالثة</span>
                    <h4 className="text-xs font-bold text-white">إدخال بيانات المستخدم والربط</h4>
                    <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
                      أدخل تفاصيل الهوية لتوزيع الصلاحيات:
                      <br />• <b>Username:</b> {dbUser}
                      <br />• <b>Password:</b> {dbPassword}
                    </p>
                  </div>
                  <div className="pt-2 text-[10px] text-emerald-400 font-bold font-sans">معتمد ومؤمن بالكامل 🔐</div>
                </div>
              </div>
            </div>

            {/* CloudBeaver Extra Info and features */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-400 animate-pulse" />
                مزايا استخدام CloudBeaver لمكاتب المحاماة
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                تعد واجهة <b>CloudBeaver</b> واحدة من أقوى برمجيات استعراض قواعد البيانات لكونها خفيفة الوزن ومبنية على متصفح الويب. تتيح للمستشارين القانونيين وفريق DevOps مراجعة المخططات البيانية (Database ER Diagrams) وإدارة الأرشفة والتقارير المالية دون كتابة أوامر معقدة، وتعمل خلف جدران حماية معيارية لتأمين سرية عقود الموكلين وقضاياهم.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
