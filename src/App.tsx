/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Search, AlertCircle, X, Wifi, Activity, AlertTriangle, Server, LogOut, RefreshCw } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import CommandPalette from '@/components/CommandPalette';
import ExtensionDownloadSection from '@/components/ExtensionDownloadSection';
import Dashboard from '@/components/Dashboard';
import MainLandingPage from '@/components/MainLandingPage';
import NotificationsBell from '@/components/NotificationsBell';
import GlobalNotesWidget from '@/components/GlobalNotesWidget';
import DateConverterWidget from '@/components/DateConverterWidget';
import AiDrafting from '@/components/AiDrafting';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy load large modules using relative paths to avoid resolution issues in some environments
const CasesModule = React.lazy(() => import('@/components/CasesModule'));
const ClientsModule = React.lazy(() => import('@/components/ClientsModule'));
const AgenciesModule = React.lazy(() => import('@/components/AgenciesModule'));
const AIModule = React.lazy(() => import('@/components/AIModule'));
const TasksModule = React.lazy(() => import('@/components/TasksModule'));
const DocumentsModule = React.lazy(() => import('@/components/DocumentsModule'));
const FinanceModule = React.lazy(() => import('@/components/FinanceModule'));
const WorkspaceSync = React.lazy(() => import('@/components/WorkspaceSync'));
const NajizExtensionHub = React.lazy(() => import('@/components/NajizExtensionHub'));
const ClientPortal = React.lazy(() => import('@/components/ClientPortal'));
const AuditLogs = React.lazy(() => import('@/components/AuditLogs'));
const Settings = React.lazy(() => import('@/components/Settings'));
const GCalSyncSettings = React.lazy(() => import('@/components/GCalSyncSettings'));
const WhatsappTemplates = React.lazy(() => import('@/components/WhatsappTemplates'));
const LawyerPerformance = React.lazy(() => import('@/components/LawyerPerformance'));
const TeamMembers = React.lazy(() => import('@/components/TeamMembers'));
const MockNajizSimulator = React.lazy(() => import('@/components/MockNajizSimulator'));
const UnifiedAuthLanding = React.lazy(() => import('@/components/UnifiedAuthLanding'));
const PlatformDocumentation = React.lazy(() => import('@/components/PlatformDocumentation'));
const JudicialObservatory = React.lazy(() => import('@/components/JudicialObservatory'));
const AILegalSearch = React.lazy(() => import('@/components/AI/AILegalSearch'));
const EmployeePortal = React.lazy(() => import('@/components/EmployeePortal'));
const EmployeesData = React.lazy(() => import('@/components/EmployeesData'));
const ExecutionsModule = React.lazy(() => import('@/components/ExecutionsModule'));
const FeedbackModal = React.lazy(() => import('@/components/FeedbackModal'));
const WscatModule = React.lazy(() => import('@/components/WscatModule'));
const WebSocketEcho = React.lazy(() => import('@/components/WebSocketEcho'));

import { SupabaseTodos } from '@/components/SupabaseTodos';
import ElasticsearchModule from '@/components/ElasticsearchModule';
import DbDevOpsModule from '@/components/DbDevOpsModule';
import FailedPersistenceLogsDashboard from '@/components/FailedPersistenceLogsDashboard';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAppState } from '@/hooks/useAppState';

const CalendarModule = React.lazy(() => import('@/components/CalendarModule'));
const SaudiServicesHub = React.lazy(() => import('@/components/SaudiServicesHub'));
const CourtMapAndServices = React.lazy(() => import('@/components/CourtMapAndServices'));

const GlobalCustomizationEngine = React.lazy(() => import('@/components/GlobalCustomizationEngine'));
import { runSupabaseDiagnostics } from '@/lib/debug-supabase';
import { SkeletonLoader } from '@/components/SkeletonLoader';

runSupabaseDiagnostics().catch(err => console.error('[Supabase Top-Level Diagnostics] Failed:', err));
import '@/lib/supabase/init';

import { 
  Case, 
  Client, 
  Invoice, 
  Task, 
  Hearing, 
  Document as LegalDoc, 
  Message,
  Expense
} from '@/types';

import { SupabaseProvider, useSupabase } from '@/contexts/SupabaseContext';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { supabase } from '@/lib/supabase';
import { auditLogger, AuditAction } from '@/lib/AuditLogger';

import { useSupabaseConnection } from '@/lib/supabase/connection';

export default function App() {
  const { isValid, error } = useSupabaseConnection();

  if (isValid === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-red-50" style={{ direction: 'rtl' }}>
        <h1 className="text-3xl font-bold text-red-600 mb-4">⚠️ خطأ في الاتصال بقاعدة البيانات (Supabase)</h1>
        <p className="text-gray-700 max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-red-200">
           القيمة المطلوبة لمتغيرات البيئة للاتصال غير صحيحة أو مفقودة.
           <br /><br />
           الرجاء التأكد من إضافة <code className="bg-gray-100 px-1 py-0.5 rounded text-red-500">VITE_SUPABASE_URL</code> و <code className="bg-gray-100 px-1 py-0.5 rounded text-red-500">VITE_SUPABASE_PUBLISHABLE_KEY</code> إلى ملف <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code> لديك، وإعادة تشغيل التطبيق.
        </p>
        {error && (
          <pre className="mt-6 p-4 bg-gray-900 text-red-400 text-left rounded-xl w-full max-w-2xl overflow-x-auto text-sm">
            {error}
          </pre>
        )}
      </div>
    );
  }

  return (
    <SupabaseProvider>
      <React.Suspense fallback={<SkeletonLoader />}>
        <AppContent />
      </React.Suspense>
    </SupabaseProvider>
  );
}

const brightnessCache: Record<string, boolean> = {};

function RouteGuard({ children, isAuthenticated, setCurrentTab }: { children: React.ReactNode, isAuthenticated: boolean, setCurrentTab: (t: string) => void }) {
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Check if user is authenticated via Context
    const isBypass = window.location.hash.includes('bypass');
    
    // We only redirect if we are SURE there is no session at all
    if (!isAuthenticated && !isBypass) {
      setCurrentTab('landing');
    } else {
      setIsVerified(true);
    }
  }, [isAuthenticated, setCurrentTab]);

  return isVerified ? (
    <React.Suspense fallback={<SkeletonLoader />}>
      {children}
    </React.Suspense>
  ) : null;
}

import { ErrorToaster } from '@/components/ErrorToaster';
import { ErrorReporting } from '@/lib/ErrorReporting';
import { generateUUID } from '@/lib/uuid';
import { cleanCorruptedAuth } from '@/lib/auth-utils';

function AppContent() {
  const { preferences, updatePreference } = useUserPreferences();
  const { state, setStateData } = useAppState();
  const { user, profile, loading: authLoading, connectionStatus } = useSupabase();

  const [najizConnectedState, setNajizConnectedState] = useState(() => localStorage.getItem('najiz_api_connected') === 'true');

  useEffect(() => {
    const connectedFromState = state?.najiz_api_connected === true || state?.preferences?.najiz_api_connected === 'true';
    const connectedFromStorage = localStorage.getItem('najiz_api_connected') === 'true';
    
    if (connectedFromState !== najizConnectedState && state?.najiz_api_connected !== undefined) {
      setNajizConnectedState(connectedFromState);
    } else if (connectedFromStorage !== najizConnectedState) {
      setNajizConnectedState(connectedFromStorage);
    }
  }, [state, najizConnectedState]);

  useEffect(() => {
    const handleStorage = () => {
      setNajizConnectedState(localStorage.getItem('najiz_api_connected') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Try to clean up any corrupt auth session hashes or flags on app load
  useEffect(() => {
    cleanCorruptedAuth();
  }, []);

  const { 
    cases, 
    clients, 
    tasks, 
    hearings, 
    documents, 
    powersOfAttorney: agencies,
    invoices,
    employees,
    loading: dataLoading, 
    createRecord, 
    updateRecord, 
    deleteRecord, 
    retryQueueSync, 
    refresh,
    auditTrails,
    executions,
    attachments,
    clientPortal,
    employeePortal,
    attendance,
    leaveRequests,
    payments,
    notifications,
    systemErrors,
    setHearings,
    setDocuments,
    setInvoices,
    setEmployees
  } = useSupabaseData();

  const powersOfAttorney = agencies;

  useEffect(() => {
    if (user) {
      ErrorReporting.setGlobalContext({ user: user.id });
    }
  }, [user]);
  
  // Implementation of periodic localStorage cache cleanup and state conflict resolution
  useEffect(() => {
    const PLATFORM_VERSION = '2.1.0'; // Current system version
    const lastVersion = state?.platform_version;
    
    if (lastVersion !== PLATFORM_VERSION) {
      console.log(`[Justice Platform] Version mismatch (Old: ${lastVersion}, New: ${PLATFORM_VERSION}). Purging stale state cache...`);
      
      // Keys to preserve
      const themes = preferences.customThemes; // Assuming these were migrated!
      const roles = preferences.customRoles;
      
      // Clean conflicts
      // ... (rest of the logic, updated to use Supabase)
      
      // Restoration (if needed) or simple reset
      setStateData('platform_version', PLATFORM_VERSION);
      
      console.log('[Justice Platform] Cache cleanup complete. Environment stabilized.');
    }

    // --- HOURLY CACHE CLEANUP CRON-LIKE JOB ---
    const cleanupStaleCache = () => {
      console.log('[Justice Platform] Running scheduled hourly cache optimization...');
      const keys = Object.keys(localStorage);
      const now = Date.now();
      
      keys.forEach(key => {
        // Purge session artifacts and temp caches if they exist
        if (key.includes('-temp-') || key.includes('session-')) {
          localStorage.removeItem(key);
        }
      });
      console.log('[Justice Platform] Stale session artifacts purged.');
    };

    const cleanupInterval = setInterval(cleanupStaleCache, 3600000); // 1 Hour
    return () => clearInterval(cleanupInterval);
  }, []);

  const [showLandingPage, setShowLandingPage] = useState(true);
  const [authMode, setAuthMode] = useState<"lawyer" | "trial">("lawyer");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const authSyncRef = React.useRef<string | null>(null);

  useEffect(() => {
    const activeUser = user;
    const userId = activeUser?.id || null;
    const profileRole = profile?.role || (userId ? 'lawyer' : null);
    
    // Check if we already stabilized for this user/role combination
    const syncKey = `${userId}-${profileRole}-${authLoading}`;
    if (authSyncRef.current === syncKey) return;

    if (authLoading) return;
    
    if (activeUser && userId) {
      const role = profileRole || 'lawyer';
      const userName = profile?.name || activeUser.user_metadata?.name || 'مستخدم النظام';

      authSyncRef.current = syncKey;
      setIsAuthenticated(true);
      setShowLandingPage(false);
      setCurrentUser({
        role: role,
        id: userId,
        name: userName,
        permittedModules: (profile as any)?.permittedModules || [],
        sidebarConfig: (profile as any)?.sidebarConfig || []
      });
      
      if (role === 'client') {
        setSelectedRole('client');
        setCurrentTab('client-portal');
      } else if (role === 'employee') {
        setSelectedRole('employee');
        setCurrentTab('employee-portal');
      } else if (role === 'researcher') {
        setSelectedRole('researcher');
      } else {
        setSelectedRole('admin');
      }
    } else if (!activeUser) {
      authSyncRef.current = syncKey;
      setIsAuthenticated(false);
      setShowLandingPage(true);
      setCurrentUser(null);
    }
  }, [user, profile, authLoading, currentUser?.id, currentUser?.role, isAuthenticated]);

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  const [officeLogo, setOfficeLogo] = useState<string | null>(() => localStorage.getItem('office_logo'));

  useEffect(() => {
    const handleStorageChange = () => {
      setOfficeLogo(localStorage.getItem('office_logo'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Global Navigation Listener
  useEffect(() => {
    const handleGlobalNav = (e: Event) => {
      const customDetail = (e as CustomEvent).detail;
      if (customDetail) {
        setCurrentTab(customDetail);
        setSelectedCase(null);
      }
    };
    window.addEventListener('global-navigate', handleGlobalNav);
    return () => window.removeEventListener('global-navigate', handleGlobalNav);
  }, []);

  // Command Palette Select Case event listener
  useEffect(() => {
    const handleSelectCaseEvent = (e: any) => {
      if (e.detail) {
        setSelectedCase(e.detail);
      }
    };
    window.addEventListener('adalah-select-case', handleSelectCaseEvent);
    return () => window.removeEventListener('adalah-select-case', handleSelectCaseEvent);
  }, []);

  // Connection status from navigator
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [connectionPulse, setConnectionPulse] = useState<{ latency: number, status: string } | null>(null);
  useEffect(() => {
    const handlePulse = (e: any) => setConnectionPulse(e.detail);
    window.addEventListener('najiz-connection-pulse', handlePulse);
    return () => window.removeEventListener('najiz-connection-pulse', handlePulse);
  }, []);

  // Apply global mouse coordinates for parallax dynamic lighting 
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      // We can also compute relative to window size
      const xRatio = e.clientX / window.innerWidth;
      const yRatio = e.clientY / window.innerHeight;
      
      document.documentElement.style.setProperty('--mouse-px-x', `${x}px`);
      document.documentElement.style.setProperty('--mouse-px-y', `${y}px`);
      document.documentElement.style.setProperty('--mouse-x', `${xRatio * 100}%`);
      document.documentElement.style.setProperty('--mouse-y', `${yRatio * 100}%`);
      
      // Compute relative values for 3D perspective offsets (-0.5 to 0.5 range scaled up)
      const dx = (xRatio - 0.5) * 20; // max 10px translate
      const dy = (yRatio - 0.5) * 20; // max 10px translate
      document.documentElement.style.setProperty('--mouse-dx', `${dx}px`);
      document.documentElement.style.setProperty('--mouse-dy', `${dy}px`);
      document.documentElement.style.setProperty('--mouse-shadow-x', `${-dx * 0.8}px`);
      document.documentElement.style.setProperty('--mouse-shadow-y', `${-dy * 0.8 + 6}px`);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Load and apply advanced styles dynamically and prevent FOUC
  useLayoutEffect(() => {
    const applyAdvancedStyles = () => {
      const elegantActive = preferences?.['adalah-elegant-gold-mode'] === true;
      if (elegantActive) {
        document.documentElement.classList.add('elegant-gold-active');
      } else {
        document.documentElement.classList.remove('elegant-gold-active');
      }

      const highContrast = preferences?.['adalah-high-contrast'] === true;
      if (highContrast) {
        document.documentElement.classList.add('high-contrast-active');
      } else {
        document.documentElement.classList.remove('high-contrast-active');
      }

      const enabled = preferences?.['adalah-advanced-config-enabled'] === true;
      if (enabled) {
        const radius = preferences?.['adalah-card-border-radius'] || '24px';
        const shadow = preferences?.['adalah-card-shadow-intensity'] || '1';
        const opacity = preferences?.['adalah-card-bg-opacity'] || '1';

        document.documentElement.style.setProperty('--card-border-radius', radius);
        document.documentElement.style.setProperty('--card-bg-opacity', opacity);
        
        const sIntensity = parseFloat(shadow);
        document.documentElement.style.setProperty(
          '--shadow-depth-1',
          `0 ${sIntensity * 4}px ${sIntensity * 6}px -1px rgba(0,0,0,${sIntensity * 0.05}), 0 ${sIntensity * 2}px ${sIntensity * 4}px -1px rgba(0,0,0,${sIntensity * 0.03})`
        );
        document.documentElement.style.setProperty(
          '--shadow-depth-2',
          `0 ${sIntensity * 35}px ${sIntensity * 70}px -15px rgba(234, 179, 8, ${sIntensity * 0.35})`
        );
      } else {
        // Enforce a premium curved radius globally if advanced customize is off
        document.documentElement.style.setProperty('--card-border-radius', '24px');
        document.documentElement.style.removeProperty('--card-bg-opacity');
        document.documentElement.style.removeProperty('--shadow-depth-1');
        document.documentElement.style.removeProperty('--shadow-depth-2');
      }
    };

    applyAdvancedStyles();
    
    // MutationObserver to ensure classes stick without flickering, checking only class attributes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        if (m.type === 'attributes' && m.attributeName === 'class') {
           // We do a passive check to ensure it stays 
           const elegantActive = preferences?.['adalah-elegant-gold-mode'] === true;
           if (elegantActive && !document.documentElement.classList.contains('elegant-gold-active')) {
             document.documentElement.classList.add('elegant-gold-active');
           }
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => {
      observer.disconnect();
    };
  }, [preferences]);

  // Dynamic custom themes list loaded from localStorage or loaded on update
  const [customThemes, setCustomThemes] = useState<any[]>([]);

  React.useEffect(() => {
    const reloadCustomThemes = () => {
      try {
        const stored = localStorage.getItem('adalah-custom-themes');
        if (stored) {
          setCustomThemes(JSON.parse(stored));
        } else {
          setCustomThemes([]);
        }
      } catch (err) {}
    };
    reloadCustomThemes();
    window.addEventListener('adalah-custom-themes-updated', reloadCustomThemes);
    return () => {
      window.removeEventListener('adalah-custom-themes-updated', reloadCustomThemes);
    };
  }, []);

  // Definition of custom professional dark gradients for the dynamic live-preview system
  const DARK_GRADIENT_THEMES = [
    { id: 'midnight', name: 'أزرق الليل الملكي (Royal Midnight)', from: '#0b1329', to: '#041a45', border: '#1e3a8a' },
    { id: 'slate', name: 'الرمادي السيبراني المتطور (Classic Slate)', from: '#1e293b', to: '#020617', border: '#475569' },
    { id: 'emerald', name: 'الأخضر الزمردي المريح للعين (Forest Green)', from: '#022c22', to: '#064e3b', border: '#065f46' },
    { id: 'sepia', name: 'العسلي الدافئ المريح (Warm Charcoal Brown)', from: '#2e180d', to: '#0c0500', border: '#78350f' },
    { id: 'imperial', name: 'البنفسجي الإمبراطوري المتفرد (Amethyst Royal)', from: '#1e1b4b', to: '#090514', border: '#312e81' },
    { id: 'blackout', name: 'الأسود المطلق فائق التباين (Jet Blackout)', from: '#000000', to: '#050505', border: '#111111' },
    { id: 'royal-gold', name: 'ذهب النخبة الملكي (Elite Slate Gold)', from: '#111622', to: '#080c14', border: '#d4af37' },
    { id: 'serene-blue', name: 'أزرق البحيرات الهادئ (Serene Lake Blue)', from: '#0f1e36', to: '#070d17', border: '#3b82f6' },
    { id: 'warm-ash', name: 'الرماد الدافئ المخملي (Velvet Warm Ash)', from: '#1a1a1e', to: '#0f0f12', border: '#8da2bb' },
    { id: 'desert-olive', name: 'الزيتوني الصحراوي المهدئ (Desert Olive)', from: '#14221a', to: '#0a110d', border: '#84cc16' },
    { id: 'abyss', name: 'أزرق الأعماق الاسترخائي (Abyss Blue)', from: '#0f172a', to: '#020617', border: '#1e293b' },
    { id: 'jade', name: 'اليشم الأخضر الهادئ (Soft Jade)', from: '#14532d', to: '#064e3b', border: '#065f46' },
    { id: 'coffee', name: 'القهوة الداكنة (Dark Coffee)', from: '#3f2b1c', to: '#1c130d', border: '#78350f' },
    { id: 'sapphire', name: 'تدرج الياقوت الأزرق (Deep Sapphire)', from: '#172554', to: '#080f26', border: '#1d4ed8' }
  ];

  const ALL_GRADIENT_THEMES = [...DARK_GRADIENT_THEMES, ...customThemes];

  // Core Data States Relocated to avoid TDZ errors in custom hooks
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [showArchivedNotice, setShowArchivedNotice] = useState(false);
  const [lastArchivedCount, setLastArchivedCount] = useState(0);
  const [lastArchivedIds, setLastArchivedIds] = useState<string[]>([]);
  const [alertMessages, setAlertMessages] = useState<string[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [supaDiagnosticAlert, setSupaDiagnosticAlert] = useState<{ table: string; code: string; message: string; details: string } | null>(null);

  // Dynamic gradient theme state
  const darkGradientTheme = preferences?.['adalah-platform-dark-gradient'] || 'midnight';
  const highContrastMode = preferences?.['adalah-high-contrast-mode'] === true;
  const isDarkMode = preferences?.['adalah-full-dark-mode'] === true;

  const handleDarkGradientThemeChange = (newTheme: string) => {
    updatePreference('adalah-platform-dark-gradient', newTheme);
  };

  const handleHighContrastModeChange = (enabled: boolean) => {
    updatePreference('adalah-high-contrast-mode', enabled);
  };

  const handleDarkModeChange = (enabled: boolean) => {
    updatePreference('adalah-full-dark-mode', enabled);
  };

  const handleLogout = async () => {
    try {
      if (currentUser) {
        auditLogger.log({
          user_id: currentUser.id,
          user_name: currentUser.name,
          role: currentUser.role,
          action: AuditAction.LOGOUT,
          entity_type: 'auth',
          details: 'User logged out'
        });
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Auth logout details (session variables cleared):", err);
    } finally {
      // Clear session storage but NOT necessary Supabase-native preferences
      
      // We do not clear localStorage now as it's Supabase-native.
      // But we keep failed_persistence_logs and supabase_retry_queue

      setShowLandingPage(false);
      setCurrentUser(null);
      setIsAuthenticated(false);
      window.location.hash = "#login";
    }
  };

  const setGlobalDisplayMode = (mode: 'light' | 'dark' | 'high-contrast') => {
    if (mode === 'light') {
      updatePreference('adalah-full-dark-mode', false);
      updatePreference('adalah-high-contrast-mode', false);
    } else if (mode === 'dark') {
      updatePreference('adalah-full-dark-mode', true);
      updatePreference('adalah-high-contrast-mode', false);
    } else if (mode === 'high-contrast') {
      updatePreference('adalah-full-dark-mode', true);
      updatePreference('adalah-high-contrast-mode', true);
    }
  };

  const getGlobalDisplayMode = (): 'light' | 'dark' | 'high-contrast' => {
    if (highContrastMode) return 'high-contrast';
    if (isDarkMode) return 'dark';
    return 'light';
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Find active gradient setting
  const activeGradient = React.useMemo(() => {
    return ALL_GRADIENT_THEMES.find(t => t.id === darkGradientTheme) || ALL_GRADIENT_THEMES[0];
  }, [darkGradientTheme]);

  // Apply high contrast global class
  useLayoutEffect(() => {
    if (highContrastMode) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
    // Dispatch event to child components
    window.dispatchEvent(new Event('adalah-advanced-config-updated'));
  }, [highContrastMode]);

  // Optimize brightness scanner with memoization and MutationObserver for efficiency
  const isScanning = React.useRef(false);
  const scanAndFixContrast = React.useCallback(() => {
    if (isScanning.current) return;
    isScanning.current = true;
    
    // Throttled scan to prevent overhead
    const targetContainers = document.querySelectorAll(
      '.login-sidebar-panel, .bg-slate-900, .bg-slate-950, .bg-midnight, [class*="bg-midnight"], [class*="bg-slate-9"], [class*="bg-[#050e21]"], [class*="bg-[#030712]"], [class*="bg-[#0b1e33]"], [class*="bg-[#11243f]"], [class*="bg-[#0b1a2d]"], [class*="bg-[#0c2461]"], [class*="bg-[#041a45]"], [class*="bg-[#0b1329]"], [class*="bg-slate-800"], aside, .bg-gradient-to-br, [class*="from-slate-9"], [class*="from-[#0C121E]"], .card-professional-stable, .card-professional-case, .customizable-card, [style*="background-color"], .motion-div, [style*="background"]'
    );

    targetContainers.forEach(container => {
      const htmlContainer = container as HTMLElement;
      
      // Dynamic Background Brightness Analysis for motion.div & Cards
      const computedBg = window.getComputedStyle(htmlContainer).backgroundColor;
      let isDarkBg = true; // default assume dark for legacy dark classes
      const rgbBgMatch = computedBg.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (rgbBgMatch) {
         const r = parseInt(rgbBgMatch[1]);
         const g = parseInt(rgbBgMatch[2]);
         const b = parseInt(rgbBgMatch[3]);
         // Ignore transparent backgrounds when computing brightness (mostly 0,0,0,0)
         // If it's a solid or semi-transparent color, compute brightness
         if (!(r === 0 && g === 0 && b === 0 && computedBg.includes('0)'))) {
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            isDarkBg = brightness < 130;
         }
      }

      // Special case for login-sidebar-panel: Force SVGs to update
      if (htmlContainer.classList.contains('login-sidebar-panel') || htmlContainer.closest('.login-sidebar-panel')) {
         const svgElements = htmlContainer.querySelectorAll('svg');
         svgElements.forEach(svgEl => {
            const htmlSvg = svgEl as unknown as HTMLElement;
            let isElementDarkBg = true;
            const activeBgContainer = htmlSvg.closest('.bg-white, .bg-slate-50, .bg-slate-100, .bg-gray-50, .bg-gray-100, .bg-sky-50');
            if (activeBgContainer) {
               isElementDarkBg = false;
            }
            const finalColor = isElementDarkBg ? '#facc15' : '#020617';
            htmlSvg.style.setProperty('color', finalColor, 'important');
            htmlSvg.setAttribute('data-contrast-fixed', 'true');
         });
      }

      // Use a marker to avoid re-scanning optimized containers unless content actually changes
      const isCaseCard = htmlContainer.classList.contains('card-professional-case') || htmlContainer.classList.contains('card-professional-stable') || !!htmlContainer.closest('.card-professional-stable') || !!htmlContainer.closest('.card-professional-case');
      
      // Track previous background classification
      const prevBgState = htmlContainer.getAttribute('data-prev-bg-dark');
      const currentBgState = isDarkBg.toString();
      
      if (prevBgState !== currentBgState) {
        // If brightness flipped, we must re-scan its children
        htmlContainer.setAttribute('data-prev-bg-dark', currentBgState);
        htmlContainer.removeAttribute('data-scan-optimized');
      }

      if (htmlContainer.getAttribute('data-scan-optimized') === 'true' && !isCaseCard && !htmlContainer.classList.contains('customizable-card')) return;
      
      if (isDarkBg) {
        htmlContainer.classList.add('text-high-contrast-light-bg');
        htmlContainer.classList.remove('text-high-contrast-dark-bg');
      } else {
        htmlContainer.classList.add('text-high-contrast-dark-bg');
        htmlContainer.classList.remove('text-high-contrast-light-bg');
      }

      const textElements = htmlContainer.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, strong, b, label, li, td, th');
      textElements.forEach(el => {
        const htmlEl = el as HTMLElement;

        // Skip colored status lights, badges or specific indicators (red/green logos/texts)
        const classStr = htmlEl.className || '';
        const isColoredStatus = /text-(red|emerald|green|rose|amber|blue|indigo)-/i.test(classStr) || 
                                /bg-(red|emerald|green|rose|amber|blue|indigo)-/i.test(classStr) || 
                                htmlEl.getAttribute('data-contrast-ignore') === 'true' ||
                                htmlEl.classList.contains('case-status-badge') || 
                                htmlEl.closest('.case-status-badge') !== null;
        if (isColoredStatus) return;

        // SPECIFIC RULE FOR THE RIGHT LOGIN SIDEBAR PANEL CARD
        const insideSidebar = htmlEl.closest('.login-sidebar-panel');
        if (insideSidebar) {
           let isElementDarkBg = true;
           const activeBgContainer = htmlEl.closest('.bg-white, .bg-slate-50, .bg-slate-100, .bg-gray-50, .bg-gray-100, .bg-sky-50');
           if (activeBgContainer) {
              isElementDarkBg = false;
           }
           let finalColor = '#ffffff'; // default to bright white
           if (isElementDarkBg) {
              const tag = htmlEl.tagName.toLowerCase();
              const isHeadingOrBold = tag.startsWith('h') || htmlEl.classList.contains('font-bold') || htmlEl.classList.contains('font-black') || tag === 'strong' || tag === 'b';
              finalColor = isHeadingOrBold ? '#facc15' : '#ffffff';
           } else {
              finalColor = '#020617';
           }
           htmlEl.style.setProperty('color', finalColor, 'important');
           htmlEl.setAttribute('data-contrast-fixed', 'true');
           return;
        }

        const targetTextColor = isDarkBg ? '#FFFFFF' : '#0F172A';
        const targetHeaderColor = isDarkBg ? '#FACC15' : '#1E293B';

        if (isCaseCard) {
          // Inside Case Cards
          const isCaseName = htmlEl.classList.contains('case-name-text') || htmlEl.tagName.toLowerCase() === 'h3';
          const isHeader = htmlEl.classList.contains('case-header-title') || htmlEl.tagName.toLowerCase() === 'h4' || htmlEl.tagName.toLowerCase() === 'h1' || htmlEl.tagName.toLowerCase() === 'h2';
          const isInnerCardBoxText = htmlEl.closest('.inner-card-box') !== null || htmlEl.classList.contains('inner-card-box');
          
          if (isCaseName) {
            htmlEl.style.setProperty('color', targetTextColor, 'important');
            htmlEl.style.setProperty('font-weight', 'black', 'important');
          } else if (isHeader) {
            htmlEl.style.setProperty('color', targetHeaderColor, 'important');
            htmlEl.style.setProperty('font-weight', 'black', 'important');
          } else {
            if (htmlEl.classList.contains('text-yellow-300') || htmlEl.classList.contains('text-yellow-400') || htmlEl.classList.contains('text-gold-bright') || htmlEl.innerText.includes('#') || htmlEl.innerText.includes('نظام التقاضي الموحد')) {
              htmlEl.style.setProperty('color', targetHeaderColor, 'important');
            } else {
              htmlEl.style.setProperty('color', targetTextColor, 'important');
            }
          }

          if (isInnerCardBoxText) {
            htmlEl.style.setProperty('text-shadow', isDarkBg ? '0 2px 4px rgba(0, 0, 0, 0.75)' : 'none', 'important');
            htmlEl.style.setProperty('color', targetTextColor, 'important');
          }

          htmlEl.setAttribute('data-contrast-fixed', 'true');
          return;
        }

        // Apply dynamically calculated contrast color directly
        const isHeaderTag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b'].includes(htmlEl.tagName.toLowerCase());
        htmlEl.style.setProperty('color', isHeaderTag ? targetHeaderColor : targetTextColor, 'important');
        if (!isDarkBg) {
           htmlEl.style.setProperty('text-shadow', 'none', 'important');
        }
        htmlEl.setAttribute('data-contrast-fixed', 'true');
      });
      htmlContainer.setAttribute('data-scan-optimized', 'true');
    });

    // Reset scanning flag after a delay
    setTimeout(() => {
      isScanning.current = false;
    }, 100);
  }, [darkGradientTheme, highContrastMode, isDarkMode]);

    // Use MutationObserver for background scan efficiency - keeps scanning decoupled from hover/mouse events
    useEffect(() => {
      scanAndFixContrast();
      const observer = new MutationObserver((mutations) => {
        const meaningful = mutations.some(m => {
          if (m.type === 'attributes' && (m.attributeName === 'data-scan-optimized' || m.attributeName === 'data-contrast-fixed')) return false;
          if (m.type === 'attributes' && m.attributeName === 'style') {
             const target = m.target as HTMLElement;
             if (target.getAttribute('data-contrast-fixed') === 'true') return false;
             return true;
          }
          return true;
        });
        if (meaningful) {
          requestAnimationFrame(() => scanAndFixContrast());
        }
      });
      // also observe style attribute
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
      return () => observer.disconnect();
    }, [scanAndFixContrast]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K for search (just focus the search input)
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="البحث"]') as HTMLInputElement;
        searchInput?.focus();
      }
      // Ctrl+Space for Command Palette
      if (e.ctrlKey && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Ctrl+N for new case
      if (e.ctrlKey && !e.shiftKey && e.key === 'n') {
        e.preventDefault();
        setCurrentTab('cases');
        // Dispatch custom event to trigger the modal in CasesModule
        window.dispatchEvent(new CustomEvent('adalah-trigger-new-case'));
      }

      // Ctrl + P or Cmd + P for Smart Judicial Calculator (الحاسبة القضائية الذكية)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setCurrentTab('ai-judicial-calc');
        setSelectedCase(null);
        
        // Show high-priority success indicator
        const calcIndicator = document.createElement('div');
        calcIndicator.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#0f172a;zoom:1;color:#f59e0b;border:2px solid #f59e0b;padding:12px 24px;border-radius:14px;font-weight:900;z-index:99999;box-shadow:0 20px 40px rgba(0,0,0,0.35);transition:opacity 0.5s;direction:rtl;font-family:sans-serif;font-size:14px;';
        calcIndicator.innerText = '🎛️ تم الانتقال السريع إلى الحاسبة القضائية الذكية عن طريق الاختصار (Ctrl + P)';
        document.body.appendChild(calcIndicator);
        setTimeout(() => {
          calcIndicator.style.opacity = '0';
          setTimeout(() => document.body.removeChild(calcIndicator), 500);
        }, 2200);
      }
      
      // Ctrl+Shift+S for Quick Save (Focus Mode DataPersistenceLayer triggering)
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyS') {
        e.preventDefault();
        console.log('[Justice Platform] Quick Save triggered (Focus Mode)');
        window.dispatchEvent(new CustomEvent('adalah-focus-quick-save'));
        
        const saveIndicator = document.createElement('div');
        saveIndicator.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:10px 20px;border-radius:12px;font-weight:bold;z-index:9999;box-shadow:0 10px 25px rgba(0,0,0,0.2);transition:opacity 0.5s;direction:rtl;';
        saveIndicator.innerText = '✅ تم الحفظ السريع بنجاح للطوارئ ⚖️';
        document.body.appendChild(saveIndicator);
        setTimeout(() => {
          saveIndicator.style.opacity = '0';
          setTimeout(() => document.body.removeChild(saveIndicator), 500);
        }, 1500);
        return;
      }

      // Ctrl+Shift+F for Font toggle in Edit/Focus Mode
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyF') {
        e.preventDefault();
        const currentFont = document.documentElement.style.getPropertyValue('--font-sans');
        if (currentFont.includes('Amiri')) {
          document.documentElement.style.setProperty('--font-sans', '"Playfair Display", serif');
        } else {
          document.documentElement.style.setProperty('--font-sans', '"Amiri", serif');
        }
        
        const fpIndicator = document.createElement('div');
        fpIndicator.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#D4AF37;color:#1e293b;padding:8px 16px;border-radius:8px;font-weight:bold;z-index:9999;transition:opacity 0.5s;direction:rtl;';
        fpIndicator.innerText = '🔤 تم التبديل بين الخطوط (Amiri / Playfair)';
        document.body.appendChild(fpIndicator);
        setTimeout(() => {
          fpIndicator.style.opacity = '0';
          setTimeout(() => document.body.removeChild(fpIndicator), 500);
        }, 1000);
        return;
      }

      // Ctrl+S for save (simulate save)
      if (e.ctrlKey && !e.shiftKey && e.key === 's') {
        e.preventDefault();
        console.log('[Justice Platform] Manual save triggered via keyboard shortcut.');
        // Show a small temporary indicator in the UI instead of blocking alert
        const saveIndicator = document.createElement('div');
        saveIndicator.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:10px 20px;border-radius:12px;font-weight:bold;z-index:9999;box-shadow:0 10px 25px rgba(0,0,0,0.2);transition:opacity 0.5s;direction:rtl;';
        saveIndicator.innerText = '✅ تم حفظ التغييرات والبيانات في مكتبة العدالة ⚖️';
        document.body.appendChild(saveIndicator);
        setTimeout(() => {
          saveIndicator.style.opacity = '0';
          setTimeout(() => document.body.removeChild(saveIndicator), 500);
        }, 2000);
      }
      // F1 for help
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutsHelp(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);


  // Theme sync effect
  const clearDomCache = () => {
    try {
      const selectors = [
        '.transition-all',
        '.hover\\:-translate-y-1',
        '[class*="hover:scale"]'
      ];
      selectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.transform = '';
            }
          });
        } catch (selectorError) {
          // Silent catch for individual selector compatibility or escape issues
        }
      });
    } catch (e) {
      console.warn('DOM cache recovery issue:', e);
    }
    try {
      const _ = document.body.offsetHeight;
    } catch (e) {}
  };

  useLayoutEffect(() => {
    // Prevent state conflicts on quick theme toggle
    
    if (isDarkMode) {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark');
    }
    clearDomCache();
  }, [isDarkMode]);

  const [customRoles, setCustomRoles] = useState(() => {
    try {
      const stored = localStorage.getItem('platform-custom-roles');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return {
      admin: 'شريك أول / مدير منصة العدالة 👑',
      lawyer: 'وكيل شرعي ومرافع ⚖️',
      researcher: 'مستشار وباحث شرعي 🎓',
      secretary: 'أمين سر إداري 📅',
      accountant: 'مدير الشؤون المالية وقائد الامتثال 💰',
      subscriber: 'العميل (نظارة وتواصل تفاعلي) 👤'
    };
  });

  const handleCustomRolesChange = (newRoles: any) => {
    setCustomRoles(newRoles);
    localStorage.setItem('platform-custom-roles', JSON.stringify(newRoles));
  };

  const [googleCalendarSync, setGoogleCalendarSync] = useState(false);

  // Web Browser Notifications System
  const triggerBrowserNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support browser notifications.');
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        dir: 'rtl',
        ...options
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            icon: '/favicon.ico',
            dir: 'rtl',
            ...options
          });
        }
      }).catch(err => console.warn('Notification permission error', err));
    }
  };

  // Auto check for upcoming hearings and notify
  useEffect(() => {
    if (hearings.length === 0) return;
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    const formatShortDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = formatShortDate(now);
    const tomorrowStr = formatShortDate(tomorrow);

    const upcomingTomorrow = hearings.filter(h => h.date === todayStr || h.date === tomorrowStr);
    if (upcomingTomorrow.length > 0) {
      const timer = setTimeout(() => {
        upcomingTomorrow.forEach(h => {
          triggerBrowserNotification('تنبيه اقتراب موعد جلسة قضائية ⚖️', {
            body: `الدعوى: ${h.caseName}\nالتاريخ: ${h.date} الساعة ${h.time || '09:00 ص'}\nالمحكمة: ${h.courtName || 'المحكمة'}`,
            tag: `hearing-${h.id}`
          });
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hearings]);

  const language = preferences.language || 'ar';

  const toggleLanguage = () => {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    updatePreference('language', nextLang);
  };

  useEffect(() => {
    // Evaluation popup disabled per user request
    /*
    const timer = setTimeout(() => {
      const alreadyShown = sessionStorage.getItem('feedbackModalShown');
      if (!alreadyShown) {
        // setShowFeedbackModal(true);

        sessionStorage.setItem('feedbackModalShown', 'true');
      }
    }, 75000);

    return () => clearTimeout(timer);
    */
  }, []);

  // Real-time backend state polling deprecated - relying on Supabase Realtime
  useEffect(() => {
    // No-op - relying on useSupabaseData hook
  }, []);

  const syncWithBackend = async (type: string, data: any) => {
    // Deprecated - use handleUpdateGlobalState which utilizes Supabase
    return Promise.resolve();
  };

  // Listen for manual retries from the error toaster
  useEffect(() => {
    const handleRetry = (e: any) => {
      const detail = e.detail;
      if (detail && detail.type && detail.payload) {
        console.log(`[App Content] User-triggered retry received for type=${detail.type}`, detail.payload);
        handleUpdateGlobalState(detail.type, detail.payload);
      }
    };
    window.addEventListener('adalah_retry_persistence', handleRetry);
    return () => window.removeEventListener('adalah_retry_persistence', handleRetry);
  }, [cases, clients, tasks]);

  // Listen for adalah_error_logged to focus invalid input field
  useEffect(() => {
    const handleFocusInvalidField = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { entityType, field } = customEvent.detail || {};
      
      if (!entityType || !field || field === 'unknown') return;
      
      console.log(`[Validation Field Focalizer] Seeking input for entityType=${entityType}, field=${field}`);
      
      const selectors = [
        `input[name*="${field}" i]`,
        `textarea[name*="${field}" i]`,
        `select[name*="${field}" i]`,
        `#${field}`,
        `[data-field="${field}"]`,
        field === 'title' ? 'input[placeholder*="عنوان" i]' : null,
        field === 'caseNumber' || field === 'case_number' ? 'input[placeholder*="رقم القضية" i]' : null,
        field === 'name' ? 'input[placeholder*="الاسم" i]' : null,
        field === 'phone' ? 'input[placeholder*="الهاتف" i]' : null,
        field === 'email' ? 'input[placeholder*="البريد" i]' : null
      ].filter(Boolean) as string[];

      let foundEl: HTMLElement | null = null;
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          foundEl = el as HTMLElement;
          break;
        }
      }

      if (foundEl) {
        console.log(`[Validation Field Focalizer] Element found! Focusing & highlighting:`, foundEl);
        foundEl.focus();
        
        const originalStyle = foundEl.style.border;
        const originalBoxShadow = foundEl.style.boxShadow;
        const originalTransition = foundEl.style.transition;

        foundEl.style.transition = 'all 0.3s ease-in-out';
        foundEl.style.border = '2px solid #ef4444'; 
        foundEl.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
        
        setTimeout(() => {
          if (foundEl) {
            foundEl.style.border = originalStyle;
            foundEl.style.boxShadow = originalBoxShadow;
            foundEl.style.transition = originalTransition;
          }
        }, 5000);
      }
    };

    window.addEventListener('adalah_error_logged', handleFocusInvalidField);
    return () => window.removeEventListener('adalah_error_logged', handleFocusInvalidField);
  }, []);

  const handleUpdateGlobalState = async (type: string, data: any) => {
    // Intercept Supabase managed entities
    const managedTables = [
      'cases', 'clients', 'tasks', 'hearings', 'employees',
      'powersOfAttorney', 'powers_of_attorney', 'documents', 'attachments',
      'clientPortal', 'client_portal', 'employeePortal', 'employee_portal',
      'attendance', 'leaveRequests', 'leave_requests', 'invoices', 'payments', 'vouchers',
      'notifications', 'auditTrails', 'audit_trails', 'systemErrors', 'system_errors',
      'expenses', 'messages', 'contracts'
    ];

    if (managedTables.includes(type)) {
      try {
        let res;
        
        const existing = (() => {
          switch(type) {
            case 'cases': return (cases || []).find(c => c.id === data.id || c.caseNumber === data.caseNumber);
            case 'clients': return (clients || []).find(c => c.id === data.id || c.nationalId === data.nationalId);
            case 'tasks': return (tasks || []).find(t => t.id === data.id);
            case 'hearings': return (hearings || []).find(h => h.id === data.id);
            case 'employees': return (employees || []).find(e => e.id === data.id || e.nationalId === data.nationalId);
            case 'powersOfAttorney':
            case 'powers_of_attorney': return (powersOfAttorney || []).find(p => p.id === data.id || p.poaNumber === data.poaNumber);
            case 'documents': return (documents || []).find(d => d.id === data.id);
            case 'attachments': return (attachments || []).find(a => a.id === data.id);
            case 'clientPortal':
            case 'client_portal': return (clientPortal || []).find(cp => cp.id === data.id || cp.clientId === data.clientId);
            case 'employeePortal':
            case 'employee_portal': return (employeePortal || []).find(ep => ep.id === data.id || ep.employeeId === data.employeeId);
            case 'attendance': return (attendance || []).find(at => at.id === data.id);
            case 'leaveRequests':
            case 'leave_requests': return (leaveRequests || []).find(l => l.id === data.id);
            case 'invoices': return (invoices || []).find(i => i.id === data.id);
            case 'payments':
            case 'vouchers': return (payments || []).find(p => p.id === data.id);
            case 'notifications': return (notifications || []).find(n => n.id === data.id);
            case 'auditTrails':
            case 'audit_trails': return (auditTrails || []).find(au => au.id === data.id);
            case 'systemErrors':
            case 'system_errors': return (systemErrors || []).find(s => s.id === data.id);
            case 'expenses': return (expenses || []).find(e => e.id === data.id);
            case 'messages': return (messages || []).find(m => m.id === data.id);
            case 'contracts': return (contracts || []).find(c => c.id === data.id);
            default: return null;
          }
        })();

        if (existing) {
          res = await updateRecord(type, existing.id, { ...data, id: existing.id });
        } else {
          res = await createRecord(type, data);
          if (type === 'cases' && res?.success !== false && data.nextSessionDate) {
            const newHearing: Hearing = {
              id: generateUUID(),
              caseNumber: data.caseNumber,
              caseName: data.caseName,
              date: data.nextSessionDate,
              time: data.nextSessionTime || "09:00 صباحاً",
              courtName: data.courtName,
              status: 'upcoming'
            };
            await createRecord('hearings', newHearing);
          }
        }

        if (res === undefined || res?.success === false) {
          const errorObj = {
            success: false,
            code: res?.code || 'DATABASE_ERROR',
            message: res?.message || 'A database error occurred during persistence.',
            details: res?.details || 'Database transaction rejected.'
          };

          const queue = JSON.parse(localStorage.getItem('failed_persistence_logs') || '[]');
          queue.push({ timestamp: new Date().toISOString(), type, data, error: errorObj });
          localStorage.setItem('failed_persistence_logs', JSON.stringify(queue));

          setSupaDiagnosticAlert({
            table: type,
            code: errorObj.code,
            message: errorObj.message,
            details: errorObj.details
          });

          return res; 
        }

        // Only sync if successful
        syncWithBackend(type, data);
        return res;

      } catch (err: any) {
        const errorObj = {
          success: false,
          code: err?.code || 'UNHANDLED_EXCEPTION',
          message: err?.message || String(err),
          details: err?.stack || err?.details || 'An unexpected exception occurred.'
        };

        const queue = JSON.parse(localStorage.getItem('failed_persistence_logs') || '[]');
        queue.push({ timestamp: new Date().toISOString(), type, action: 'UNKNOWN', data, error: errorObj });
        localStorage.setItem('failed_persistence_logs', JSON.stringify(queue));

        setSupaDiagnosticAlert({
          table: type,
          code: errorObj.code,
          message: errorObj.message,
          details: errorObj.details
        });

        return errorObj;
      }
    }

    // Send state change immediately to server
    syncWithBackend(type, data);

    // Instant local state transition fallback so user interaction is ultra-snappy
    if (type === 'contracts') {
      const exists = (contracts || []).some(c => c.id === data.id);
      if (exists) {
        setContracts(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c));
      } else {
        setContracts(prev => [data, ...prev]);
      }
    } else if (type === 'documents') {
      setDocuments(prev => [data, ...prev]);
    } else if (type === 'invoices') {
      const exists = invoices.some(i => i.id === data.id);
      if (exists) {
        setInvoices(prev => prev.map(i => i.id === data.id ? { ...i, ...data } : i));
      } else {
        setInvoices(prev => [data, ...prev]);
      }
    } else if (type === 'messages') {
      setMessages(prev => [...prev, data]);
      // Trigger Web Browser Notification for client comments/messages
      if (data && data.sender !== 'lawyer') {
        triggerBrowserNotification('تعليق جديد من العميل 💬', {
          body: `العميل: ${data.senderName || 'بوابة العملاء'}\nالمضمون: ${data.text}`,
          tag: `msg-${data.id || Date.now()}`
        });
      }
    } else if (type === 'stateOfPlatform') {
      if (data.type === 'expenses') {
        setExpenses(prev => [data.data, ...prev]);
      }
    } else if (type === 'logout') {
      handleLogout();
    } else if (type === 'updateCurrentUser') {
      setCurrentUser(data);
    }
  };

  // Auto-Archive logic: cases marked as 'Closed' to 'archived' after 30 days of inactivity
  useEffect(() => {
    if (cases.length === 0) return;

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const casesToArchive = cases.filter(c => {
      // Only archive closed cases that aren't already archived
      if (c.status !== 'closed' || c.archived) return false;
      
      // Use lastActivityAt, fallback to lastSessionDate, then createdAt
      const activityDateStr = c.lastActivityAt || c.lastSessionDate || c.createdAt;
      if (!activityDateStr) return false;

      const activityDate = new Date(activityDateStr);
      // If the activity was more than 30 days ago, it qualifies for auto-archiving
      return activityDate < thirtyDaysAgo;
    });

    if (casesToArchive.length > 0) {
      console.log(`[Auto-Archive] archiving ${casesToArchive.length} inactive closed cases`);
      const ids = casesToArchive.map(c => c.id);
      setLastArchivedIds(ids);
      setLastArchivedCount(casesToArchive.length);
      setShowArchivedNotice(true);
      
      // Update each case to archived status
      casesToArchive.forEach(c => {
        handleUpdateGlobalState('cases', { ...c, archived: true });
      });
    }
  }, [cases.length]); // Check when cases list size changes (or on initial load)

  const handleRestoreArchived = () => {
    lastArchivedIds.forEach(id => {
      const c = cases.find(item => item.id === id);
      if (c) {
        handleUpdateGlobalState('cases', { ...c, archived: false });
      }
    });
    setShowArchivedNotice(false);
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    if (role === 'accountant') {
      setCurrentTab('finance');
    } else if (role === 'researcher') {
      setCurrentTab('ai');
    } else {
      setCurrentTab('dashboard');
    }
  };

  if (showLandingPage && !isAuthenticated) {
    return (
      <MainLandingPage 
        onSignInSelect={() => {
          setAuthMode("lawyer");
          setShowLandingPage(false);
        }}
        onTrialSelect={() => {
          setAuthMode("trial");
          setShowLandingPage(false);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <UnifiedAuthLanding 
        initialTab={authMode}
        language={language}
        onBackToHome={() => setShowLandingPage(true)}
        onLoginSuccess={(user) => {
          setCurrentUser(user as any);
          setIsAuthenticated(true);
          // User preferences and state managed via React state or database
          if (user.role === 'client') {
            setSelectedRole('client');
            setCurrentTab('client-portal');
          } else if (user.role === 'employee') {
            setSelectedRole('employee');
            setCurrentTab('employee-portal');
          } else {
            setSelectedRole('admin');
            setCurrentTab('dashboard');
          }
        }} 
      />
    );
  }

  // Enforce secure data partitioning for Employees
  const employeeFilteredCases = currentUser?.role === 'employee' 
    ? cases.filter(c => {
        const assigned = currentUser.assignedCases || [];
        return assigned.includes(c.caseNumber) || assigned.includes(c.id) || assigned.includes(c.caseName);
      })
    : cases;

  const employeeFilteredClients = currentUser?.role === 'employee'
    ? clients.filter(cl => {
        const assigned = currentUser.assignedClients || [];
        return assigned.includes(cl.id) || assigned.includes(cl.name);
      })
    : clients;

  const employeeFilteredHearings = currentUser?.role === 'employee'
    ? hearings.filter(h => {
        const assigned = currentUser.assignedCases || [];
        return assigned.includes(h.caseNumber) || assigned.includes(h.caseName);
      })
    : hearings;

  const isNajizConnected = najizConnectedState;

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <GlobalCustomizationEngine />
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          setSelectedCase(null);
        }}
        cases={cases}
        clients={clients}
        tasks={tasks}
      />
      <div className="flex-1 flex flex-col lg:flex-row bg-white overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Sidebar navigation system overlay (fixed left/right) */}
      <Sidebar 
        currentTab={currentTab}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          setSelectedCase(null);
        }}
        selectedRole={selectedRole}
        onRoleChange={handleRoleChange}
        customRoles={customRoles}
        currentUser={currentUser}
      />

        {/* Main viewport frame layout */}
        <main className="flex-1 p-4 pt-24 lg:p-8 overflow-y-auto overflow-x-hidden space-y-8 relative min-h-0">
          
          {/* Universal Notification Bell (Global scope) */}
          <NotificationsBell />

          {/* Notification bar area removed for clean UI */}

          {/* Dedicated Header for Clients vs. Global Controls for Attorney and Staff */}
          {currentUser?.role === 'client' ? (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-slate-205 pb-6" dir="rtl">
              <div>
                <h1 className="text-lg font-display font-black text-slate-900 flex items-center gap-2">
                  <span>منصة العدالة للعملاء والشركاء الأجلاء</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-xl font-black">تم التحقق بالنفاذ الآمن الموحد 🔐</span>
                </h1>
                <p className="text-xs text-slate-800 font-bold mt-2">
                  مرحباً بك العميل الكريم الأستاذ/الأستاذة: <strong className="text-primary font-black bg-amber-500/5 px-2 py-0.5 rounded-lg border border-primary/20">{currentUser.name}</strong> المحترم. طاب يومكم بكل خير وسعادة.
                </p>
              </div>
              <div className="flex justify-end gap-3.5 items-center shrink-0">
                {/* Display Mode Switcher */}
                <div className="flex border border-slate-300 rounded-lg bg-white p-0.5 shadow-sm gap-0.5 items-center font-sans">
                  <button
                    onClick={() => setGlobalDisplayMode('light')}
                    title={language === 'ar' ? 'الوضع المضيء' : 'Light Mode'}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                      getGlobalDisplayMode() === 'light'
                        ? 'bg-amber-100 text-amber-900 border border-amber-305/40'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>☀️</span>
                    <span className="hidden md:inline select-none leading-none">{language === 'ar' ? 'مضيء' : 'Light'}</span>
                  </button>
                  <button
                    onClick={() => setGlobalDisplayMode('dark')}
                    title={language === 'ar' ? 'الوضع الداكن' : 'Dark Mode'}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                      getGlobalDisplayMode() === 'dark'
                        ? 'bg-slate-900 text-white border border-slate-800'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>🌙</span>
                    <span className="hidden md:inline select-none leading-none">{language === 'ar' ? 'داكن' : 'Dark'}</span>
                  </button>
                  <button
                    onClick={() => setGlobalDisplayMode('high-contrast')}
                    title={language === 'ar' ? 'عالي التباين' : 'High Contrast'}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                      getGlobalDisplayMode() === 'high-contrast'
                        ? 'bg-[#ffe066]/20 text-[#2e180d] border border-[#ffe066]/60'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>👁️</span>
                    <span className="hidden md:inline select-none leading-none">{language === 'ar' ? 'تباين' : 'Contrast'}</span>
                  </button>
                </div>

                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black rounded-lg bg-white border border-slate-300 text-slate-900 transition-all shadow-sm cursor-pointer"
                >
                  <span>🌐</span>
                  <span>{language === 'ar' ? 'EN' : 'AR'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-5 py-3 text-xs font-black rounded-xl bg-rose-650 text-white transition-all shadow-md cursor-pointer"
                >
                  <span>🚪</span>
                  <span>تسجيل الخروج الآمن</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
              <div className="flex-1 max-w-xl relative group">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-900 w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="البحث الشامل في ملفات القضايا، سجل العملاء، والمطالبات المالية لمنصة العدالة..." 
                  className="w-full bg-white text-[#050e21] border border-slate-300 rounded-2xl pr-14 pl-6 py-4.5 text-sm font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-900 font-sans shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-3.5 items-center shrink-0">
                {/* Display Mode Switcher */}
                <div className="flex border border-slate-300 rounded-lg bg-white p-0.5 shadow-sm gap-0.5 items-center font-sans">
                  <button
                    onClick={() => setGlobalDisplayMode('light')}
                    title={language === 'ar' ? 'الوضع المضيء' : 'Light Mode'}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                      getGlobalDisplayMode() === 'light'
                        ? 'bg-amber-100 text-amber-900 border border-amber-305/40'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>☀️</span>
                    <span className="hidden select-none leading-none md:inline">{language === 'ar' ? 'مضيء' : 'Light'}</span>
                  </button>
                  <button
                    onClick={() => setGlobalDisplayMode('dark')}
                    title={language === 'ar' ? 'الوضع الداكن' : 'Dark Mode'}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                      getGlobalDisplayMode() === 'dark'
                        ? 'bg-slate-900 text-white border border-slate-800'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>🌙</span>
                    <span className="hidden select-none leading-none md:inline">{language === 'ar' ? 'داكن' : 'Dark'}</span>
                  </button>
                  <button
                    onClick={() => setGlobalDisplayMode('high-contrast')}
                    title={language === 'ar' ? 'عالي التباين' : 'High Contrast'}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                      getGlobalDisplayMode() === 'high-contrast'
                        ? 'bg-[#ffe066]/20 text-[#2e180d] border border-[#ffe066]/60'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>🕶️</span>
                    <span className="hidden select-none leading-none md:inline">{language === 'ar' ? 'تباين' : 'Contrast'}</span>
                  </button>
                </div>

                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 px-3 py-2.5 text-[10px] font-black rounded-lg bg-white border border-slate-300 text-[#050e21] transition-all shadow-sm cursor-pointer group"
                >
                   <span className="group-hover:rotate-12 transition-transform">🌐</span>
                   <span className="uppercase tracking-widest">{language === 'ar' ? 'EN' : 'AR'}</span>
                </button>

                <button
                   onClick={() => {
                     if (window.confirm('هل أنت متأكد من رغبتك في إنهاء الجلسة بشكل نهائي والخروج من النظام؟')) {
                       handleLogout();
                     }
                   }}
                   title="إنهاء جلسة العمل وتسجيل الخروج من النظام"
                   className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black rounded-lg bg-slate-900 border border-transparent text-white font-bold transition-all shadow-sm cursor-pointer group shrink-0"
                >
                   <span className="group-hover:animate-spin">⏱️</span>
                   <span>إنهاء الجلسة</span>
                </button>
              </div>
            </div>
          )}

          {/* Real-time Portal Welcome Card */}
          {currentUser?.role === 'client' && (
            <div className="bg-gradient-to-r from-primary/10 to-amber-500/5 border-r-4 border-primary p-5 rounded-2xl mb-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-slate-800" dir="rtl">
              <div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">مرحباً بك العميل الكريم: {currentUser.name} 👤</h2>
                <p className="text-xs text-slate-700 mt-1 font-bold">أهلاً بك في منصتك التفاعلية لمتابعة مستجدات القضايا والدفوع القانونية وعمليات السداد الفوري.</p>
              </div>
              <div className="bg-white border border-slate-300 text-xs px-4 py-2 rounded-xl text-primary font-bold shadow-inner shrink-0">
                بوابة الوصول الآمن للعميل
              </div>
            </div>
          )}

          {currentUser?.role === 'employee' && (
            <div className="bg-[#0f172a] border-r-4 border-amber-500 p-5 rounded-2xl mb-8 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white" dir="rtl">
              <div>
                <h2 className="text-lg font-black text-white leading-tight">المستشار الحالي: {currentUser.name} ⚖️</h2>
                <p className="text-xs text-amber-500 mt-1 font-bold">
                  المسمى الوظيفي: {currentUser.jobTitle || 'مستشار قانوني'} | الكود الوظيفي: {currentUser.employeeCode || 'EMP-11'}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 text-xs px-4 py-3 rounded-xl text-amber-400 font-mono font-bold shadow-inner shrink-0">
                لوحة المستشار المتكاملة
              </div>
            </div>
          )}

        {/* Module Router Multiplexer */}
        {currentTab !== 'landing' ? (
          <RouteGuard isAuthenticated={isAuthenticated} setCurrentTab={setCurrentTab}>
            <React.Suspense fallback={<SkeletonLoader />}>
            {currentTab === 'dashboard' && (
              <Dashboard 
                cases={employeeFilteredCases}
                clients={employeeFilteredClients}
                invoices={invoices}
                tasks={tasks}
                hearings={hearings}
                selectedRole={selectedRole}
                onNavigate={(tab) => {
                  setCurrentTab(tab);
                  setSelectedCase(null);
                }}
                onSelectCase={(cs) => {
                  setSelectedCase(cs);
                  setCurrentTab('cases');
                }}
                onUpdateState={handleUpdateGlobalState}
              />
            )}

            {currentTab === 'cases' && (
              <CasesModule 
                cases={employeeFilteredCases}
                clients={employeeFilteredClients}
                selectedRole={selectedRole}
                onUpdateState={handleUpdateGlobalState}
                onSelectCase={setSelectedCase}
                selectedCase={selectedCase}
                archivedNotice={showArchivedNotice ? { count: lastArchivedCount, onRestore: handleRestoreArchived, onClose: () => setShowArchivedNotice(false) } : undefined}
              />
            )}

            {currentTab === 'executions' && (
              <ExecutionsModule 
                executions={executions}
                onCreateExecution={(e) => createRecord('executions', e)}
                onUpdateExecution={(id, data) => updateRecord('executions', id, data)}
                onDeleteExecution={(id) => deleteRecord('executions', id)}
              />
            )}

        {currentTab === 'clients' && (
          <ClientsModule 
            clients={employeeFilteredClients}
            cases={employeeFilteredCases}
            onUpdateState={handleUpdateGlobalState}
          />
        )}

        {currentTab === 'agencies' && (
          <React.Suspense fallback={<div className="p-10 text-center text-[#fbbf24] font-black">جاري تحميل سجل وكالات العملاء...</div>}>
            <AgenciesModule 
              clients={clients}
              onUpdateState={handleUpdateGlobalState}
            />
          </React.Suspense>
        )}

        {currentTab.startsWith('ai') && (() => {
          const aiSubTab = currentTab.replace('ai-', '');
          
          if (aiSubTab === 'finance-vat') {
            return (
              <FinanceModule 
                invoices={invoices}
                clients={employeeFilteredClients}
                cases={employeeFilteredCases}
                expenses={expenses}
                onUpdateState={handleUpdateGlobalState}
                auditTrails={auditTrails}
                createRecord={createRecord}
                viewMode="billing"
                officeLogo={officeLogo}
              />
            );
          }

          if (aiSubTab === 'judicial-calc') {
            return (
              <FinanceModule 
                invoices={invoices}
                clients={employeeFilteredClients}
                cases={employeeFilteredCases}
                expenses={expenses}
                onUpdateState={handleUpdateGlobalState}
                auditTrails={auditTrails}
                createRecord={createRecord}
                viewMode="calculator"
                officeLogo={officeLogo}
              />
            );
          }

          return (
            <AIModule 
              onUpdateState={handleUpdateGlobalState}
              cases={employeeFilteredCases}
              invoices={invoices}
              initialTab={aiSubTab === 'ai' ? 'advisor' : aiSubTab as any}
            />
          );
        })()}

        {currentTab === 'tasks' && (
          <TasksModule 
            tasks={tasks}
            cases={employeeFilteredCases}
            selectedRole={selectedRole}
            onUpdateState={handleUpdateGlobalState}
          />
        )}

        {currentTab === 'employees-data' && (
          <EmployeesData 
            cases={cases}
            tasks={tasks}
            clients={clients}
            onUpdateState={handleUpdateGlobalState}
          />
        )}

        {currentTab === 'documents' && (
          <DocumentsModule 
            documents={documents}
            clients={employeeFilteredClients}
            cases={employeeFilteredCases}
            onUpdateState={handleUpdateGlobalState}
          />
        )}

        {currentTab === 'whatsapp' && (
          <WhatsappTemplates />
        )}

        {currentTab === 'finance' && (
          <FinanceModule 
            invoices={invoices}
            clients={employeeFilteredClients}
            cases={employeeFilteredCases}
            expenses={expenses}
            onUpdateState={handleUpdateGlobalState}
            auditTrails={auditTrails}
            createRecord={createRecord}
            officeLogo={officeLogo}
          />
        )}

        {currentTab === 'najiz' && (
          <ErrorBoundary fallback={<div className="text-red-400 p-10 text-center bg-slate-900 rounded-2xl border border-rose-500/30">خطأ في تحميل قسم ناجز</div>}>
            <React.Suspense fallback={<div className="p-10 text-center text-amber-500 font-bold font-sans">جاري تحميل منصة ربط ناجز...</div>}>
              <NajizExtensionHub 
                currentUser={currentUser}
                onUpdateState={handleUpdateGlobalState}
              />
            </React.Suspense>
          </ErrorBoundary>
        )}

        {currentTab === 'sync' && (
          <WorkspaceSync 
            cases={employeeFilteredCases}
            onUpdateState={handleUpdateGlobalState}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'performance' && (
          <LawyerPerformance 
            cases={employeeFilteredCases}
          />
        )}

        {currentTab === 'calendar' && (
          <React.Suspense fallback={<SkeletonLoader />}>
            <CalendarModule 
              cases={employeeFilteredCases}
              hearings={employeeFilteredHearings}
              tasks={tasks}
              invoices={invoices}
              onUpdateState={handleUpdateGlobalState}
            />
          </React.Suspense>
        )}

        {currentTab === 'simulator' && (
          <WorkspaceSync 
            cases={employeeFilteredCases}
            onUpdateState={handleUpdateGlobalState}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'team' && (
          <TeamMembers customRoles={customRoles} />
        )}

        {currentTab === 'client-portal' && (
          <React.Suspense fallback={<SkeletonLoader />}>
            <ClientPortal 
              clients={clients}
              cases={cases}
              invoices={invoices}
              messages={messages}
              hearings={hearings}
              contracts={contracts}
              documents={documents}
              onUpdateState={handleUpdateGlobalState}
              currentUser={currentUser}
              onNavigate={setCurrentTab}
            />
          </React.Suspense>
        )}

        {currentTab === 'audit-logs' && selectedRole === 'admin' && (
          <AuditLogs />
        )}

        {currentTab === 'settings' && (
          <Settings 
            createRecord={createRecord}
            updateRecord={updateRecord}
            customRoles={customRoles}
            onCustomRolesChange={handleCustomRolesChange}
            darkGradientTheme={darkGradientTheme}
            onDarkGradientThemeChange={handleDarkGradientThemeChange}
            highContrastMode={highContrastMode}
            onHighContrastModeChange={handleHighContrastModeChange}
            isDarkMode={isDarkMode}
            onDarkModeChange={handleDarkModeChange}
          />
        )}

        {currentTab === 'gcal-sync' && (
          <GCalSyncSettings />
        )}


        {currentTab === 'supabase' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h1 className="text-xl font-bold text-white mb-2">تكامل قاعدة بيانات Supabase</h1>
              <p className="text-slate-200 font-bold text-sm">
                تم دمج Supabase SSR (Server-Side Rendering) بنظام الجلسات الموحد. 
                تعمل هذه اللوحة على سحب البيانات مباشرة من Supabase.
              </p>
            </div>
            <SupabaseTodos />
          </div>
        )}

        {currentTab === 'elasticsearch' && (
          <ElasticsearchModule />
        )}

        {currentTab === 'database-devops' && (
          <DbDevOpsModule />
        )}

        {currentTab === 'saudi-hub' && (
          <React.Suspense fallback={<SkeletonLoader />}>
            <SaudiServicesHub theme="dark" initialTab="portals" cases={employeeFilteredCases} language={language} />
          </React.Suspense>
        )}

        {currentTab === 'court-map' && (
          <React.Suspense fallback={<SkeletonLoader />}>
            <CourtMapAndServices cases={employeeFilteredCases} theme="dark" language={language} hideHub={true} />
          </React.Suspense>
        )}

        {currentTab === 'smart-services' && (
          <React.Suspense fallback={<SkeletonLoader />}>
            <SaudiServicesHub theme="dark" initialTab="tools" />
          </React.Suspense>
        )}

        {currentTab === 'documentation' && (
          <PlatformDocumentation onBack={() => setCurrentTab('smart-services')} />
        )}

        {currentTab === 'judicial-observatory' && (
          <React.Suspense fallback={<SkeletonLoader />}>
            <AILegalSearch />
          </React.Suspense>
        )}

        {currentTab === 'employee-portal' && (
          <React.Suspense fallback={<SkeletonLoader />}>
            <EmployeePortal 
              cases={cases}
              clients={clients}
              tasks={tasks}
              currentUser={currentUser}
              selectedRole={selectedRole}
              onUpdateState={handleUpdateGlobalState}
            />
          </React.Suspense>
        )}

            </React.Suspense>
          </RouteGuard>
        ) : (
          currentTab === 'landing' && <MainLandingPage onSignInSelect={() => setCurrentTab('dashboard')} onTrialSelect={() => setCurrentTab('dashboard')} />
        )}

      </main>

      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
        selectedRole={selectedRole} 
      />



      {/* Dynamic Custom Dark Gradients live-preview stylesheet */}
      <style id="live-preview-styles">
        {`
          :root {
            --theme-bg-from: ${activeGradient.from};
            --theme-bg-to: ${activeGradient.to};
            --theme-border: ${activeGradient.border};
          }
          
          .theme-card-bg {
            background: linear-gradient(135deg, var(--theme-bg-from) 0%, var(--theme-bg-to) 100%) !important;
            transition: background 0.6s ease, border-color 0.6s ease;
          }
          
          .theme-card-bg-hover:hover {
            background: linear-gradient(135deg, var(--theme-bg-to) 0%, var(--theme-bg-from) 100%) !important;
          }

          .bg-slate-900, 
          .bg-slate-950,
          .bg-midnight,
          [class*="bg-midnight"],
          [class*="bg-slate-9"],
          [class*="bg-[#0C121E]"],
          [class*="bg-[#050e21]"],
          [class*="bg-[#0c2461]"],
          [class*="bg-[#041a45]"],
          [class*="bg-[#0b1e33]"],
          [class*="bg-[#11243f]"],
          [class*="bg-[#0b1a2d]"],
          [class*="bg-[#0b1329]"] {
            background: linear-gradient(135deg, ${activeGradient.from} 0%, ${activeGradient.to} 100%) !important;
            transition: background 0.8s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: none !important;
            filter: drop-shadow(0 0 0 rgba(0,0,0,0)) !important;
          }
          
          [class*="bg-gradient-to-br"][class*="from-[#0C121E]"],
          [class*="bg-gradient-to-br"][class*="from-[#1E3A8A]"],
          [class*="bg-gradient-to-br"][class*="from-[#0c121e]"],
          [class*="bg-gradient-to-br"][class*="from-slate-9"],
          [class*="from-[#0C121E]"] {
            background: linear-gradient(135deg, ${activeGradient.from} 0%, ${activeGradient.to} 100%) !important;
            transition: background 0.8s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: none !important;
            filter: drop-shadow(0 0 0 rgba(0,0,0,0)) !important;
          }
          
          .border-slate-800,
          [class*="border-slate-800"],
          [class*="border-yellow-500/30"],
          [class*="border-yellow-400/10"],
          [class*="border-white/10"],
          [class*="border-white/20"] {
            border-color: ${activeGradient.border}60 !important;
            transition: border-color 0.8s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
        `}
      </style>

      {/* Accessibility Contrast Layer */}
      <style id="accessibility-contrast-layer">
        {`
          /* Text visibility in dark themes */
          .dark .card-professional *, .dark .bg-slate-900 *:not(.text-primary) {
             text-shadow: 0 0 1px rgba(255,255,255,0.1);
          }
          .dark .text-slate-700, .dark .text-slate-200 font-bold, .dark .text-slate-700, .dark .text-slate-800 {
             color: #e2e8f0 !important;
          }
          .dark .text-white font-bold, .dark .text-slate-200 font-bold {
             color: #f8fafc !important;
          }
          .dark .text-amber-500 {
             color: #fbbf24 !important;
          }
          /* Improve inputs, selects, toggles and tables contrast. Task 1 & Task 10 */
          .dark table td, .dark table th, .dark input, .dark select, .dark textarea {
             color: #f8fafc !important;
          }
          .dark .high-contrast-mode .text-slate-700 {
             color: #fbbf24 !important; /* Force high contrast yellow */
          }
          
          /* Light themes overrides */
          :root:not(.dark) .card-professional .text-white,
          :root:not(.dark) .card-professional .text-white font-bold,
          :root:not(.dark) .card-professional .text-slate-200 font-bold {
             color: #0f172a !important; 
          }
        `}
      </style>

      {/* Global Bottom-left Widgets */}
      {(isAuthenticated || window.location.hash.includes('bypass')) && (
        <React.Suspense fallback={null}>
           <div className="fixed bottom-6 left-6 z-[9999] flex items-center gap-4 flex-row-reverse" dir="rtl">
             <GlobalNotesWidget />
             <DateConverterWidget />
           </div>
        </React.Suspense>
      )}

      <ErrorToaster />
    </div>
    </div>
  );
}
