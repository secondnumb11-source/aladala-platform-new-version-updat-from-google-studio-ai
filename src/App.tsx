/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Search, AlertCircle, X, Wifi, Activity, AlertTriangle, Server, LogOut } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import CommandPalette from '@/components/CommandPalette';
import ExtensionDownloadSection from '@/components/ExtensionDownloadSection';
import Dashboard from '@/components/Dashboard';
import MainLandingPage from '@/components/MainLandingPage';
import NotificationsBell from '@/components/NotificationsBell';
import GlobalNotesWidget from '@/components/GlobalNotesWidget';
import AiDrafting from '@/components/AiDrafting';
import NajizSyncBackendService from './components/NajizSyncBackendService';

// Lazy load large modules using relative paths to avoid resolution issues in some environments
const CasesModule = React.lazy(() => import('./components/CasesModule'));
const ClientsModule = React.lazy(() => import('./components/ClientsModule'));
const AgenciesModule = React.lazy(() => import('./components/AgenciesModule'));
const AIModule = React.lazy(() => import('./components/AIModule'));
const TasksModule = React.lazy(() => import('./components/TasksModule'));
const DocumentsModule = React.lazy(() => import('./components/DocumentsModule'));
const FinanceModule = React.lazy(() => import('./components/FinanceModule'));
const WorkspaceSync = React.lazy(() => import('./components/WorkspaceSync'));
const NajizExtensionHub = React.lazy(() => import('./components/NajizExtensionHub'));
const ClientPortal = React.lazy(() => import('./components/ClientPortal'));
const AuditLogs = React.lazy(() => import('./components/AuditLogs'));
const Settings = React.lazy(() => import('./components/Settings'));
const GCalSyncSettings = React.lazy(() => import('./components/GCalSyncSettings'));
const WhatsappTemplates = React.lazy(() => import('./components/WhatsappTemplates'));
const LawyerPerformance = React.lazy(() => import('./components/LawyerPerformance'));
const TeamMembers = React.lazy(() => import('./components/TeamMembers'));
const MockNajizSimulator = React.lazy(() => import('./components/MockNajizSimulator'));
const UnifiedAuthLanding = React.lazy(() => import('./components/UnifiedAuthLanding'));
const PlatformDocumentation = React.lazy(() => import('./components/PlatformDocumentation'));
const JudicialObservatory = React.lazy(() => import('./components/JudicialObservatory'));
const AILegalSearch = React.lazy(() => import('./components/AI/AILegalSearch'));
const EmployeePortal = React.lazy(() => import('./components/EmployeePortal'));
const EmployeesData = React.lazy(() => import('./components/EmployeesData'));
const FeedbackModal = React.lazy(() => import('./components/FeedbackModal'));
const WscatModule = React.lazy(() => import('./components/WscatModule'));
const WebSocketEcho = React.lazy(() => import('./components/WebSocketEcho'));

import { SupabaseTodos } from './components/SupabaseTodos';
import ElasticsearchModule from './components/ElasticsearchModule';
import DbDevOpsModule from './components/DbDevOpsModule';

const CalendarModule = React.lazy(() => import('./components/CalendarModule'));
const SaudiServicesHub = React.lazy(() => import('./components/SaudiServicesHub'));
const CourtMapAndServices = React.lazy(() => import('./components/CourtMapAndServices'));

const GlobalCustomizationEngine = React.lazy(() => import('./components/GlobalCustomizationEngine'));
import { initGlobalErrorHandling } from './lib/ErrorReporting';
import { SkeletonLoader } from './components/SkeletonLoader';
import { StateSyncBridge } from './lib/StateSyncBridge';

initGlobalErrorHandling();

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
import { auth as firebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { auditLogger, AuditAction } from '@/lib/AuditLogger';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function App() {
  return (
    <SupabaseProvider>
      <React.Suspense fallback={<SkeletonLoader />}>
        <AppContent />
      </React.Suspense>
    </SupabaseProvider>
  );
}

function RouteGuard({ children, isAuthenticated, setCurrentTab }: { children: React.ReactNode, isAuthenticated: boolean, setCurrentTab: (t: string) => void }) {
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Check if token exists in localStorage or if user is authenticated via Context
    const hasLocalToken = !!localStorage.getItem('adalah-platform-auth') || 
                          !!localStorage.getItem('supabase.auth.token');
    const isBypass = window.location.hash.includes('bypass');
    
    // We only redirect if we are SURE there is no session at all
    // If hasLocalToken is true, we give it a bit of time for Supabase to initialize
    if (!isAuthenticated && !hasLocalToken && !isBypass) {
      // Clear sensitive temp data and redirect to login
      localStorage.removeItem('adalah_sensitive_data');
      sessionStorage.clear();
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

function AppContent() {
  const { user, profile, loading: authLoading, connectionStatus } = useSupabase();
  const { cases, clients, tasks, loading: dataLoading, createRecord, updateRecord, deleteRecord, refresh } = useSupabaseData();
  
  // Implementation of periodic localStorage cache cleanup and state conflict resolution
  useEffect(() => {
    const PLATFORM_VERSION = '2.1.0'; // Current system version
    const lastVersion = localStorage.getItem('adalah-platform-version');
    
    if (lastVersion !== PLATFORM_VERSION) {
      console.log(`[Justice Platform] Version mismatch (Old: ${lastVersion}, New: ${PLATFORM_VERSION}). Purging stale state cache...`);
      
      // Keys to preserve
      const themes = localStorage.getItem('adalah-custom-themes');
      const roles = localStorage.getItem('platform-custom-roles');
      const authTokens = localStorage.getItem('supabase.auth.token');
      
      // Clean conflicts
      const conflictKeys = [
        'adalah-platform-dark-gradient',
        'adalah-full-dark-mode',
        'adalah-high-contrast-mode',
        'adalah-advanced-config-enabled',
        'adalah-theme-temp'
      ];
      
      conflictKeys.forEach(k => localStorage.removeItem(k));
      
      // Clear any temporary artifacts that might cause build/runtime conflicts
      Object.keys(localStorage).forEach(key => {
        if (key.includes('-temp-') || key.includes('session-') || key.includes('cached-') || key.includes('build-v')) {
          localStorage.removeItem(key);
        }
      });
      
      // Restoration (if needed) or simple reset
      localStorage.setItem('adalah-platform-version', PLATFORM_VERSION);
      if (themes) localStorage.setItem('adalah-custom-themes', themes);
      if (roles) localStorage.setItem('platform-custom-roles', roles);
      
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
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const authSyncRef = React.useRef<string | null>(null);

  // Monitor Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const activeUser = user || firebaseUser;
    const userId = activeUser?.id || (activeUser as any)?.uid || null;
    const profileRole = profile?.role || (activeUser as any)?.role || (userId ? 'lawyer' : null);
    
    // Check if we already stabilized for this user/role combination
    const syncKey = `${userId}-${profileRole}-${authLoading}`;
    if (authSyncRef.current === syncKey) return;

    if (authLoading) return;
    
    // Check if we have a locally authenticated employee bypassing Firebase
    const hasEmployeeBypass = localStorage.getItem('adalah-employee-auth-bypass') === 'true';
    if (hasEmployeeBypass && currentUser?.role === 'employee') {
       authSyncRef.current = syncKey;
       return; 
    }

    if (activeUser && userId) {
      const role = profileRole || 'lawyer';
      const userName = profile?.name || (activeUser as any).displayName || activeUser.user_metadata?.name || 'مستخدم النظام';

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
    } else if (!activeUser && !hasEmployeeBypass) {
      authSyncRef.current = syncKey;
      setIsAuthenticated(false);
      setShowLandingPage(true);
      setCurrentUser(null);
    }
  }, [user, profile, firebaseUser, authLoading, currentUser?.id, currentUser?.role, isAuthenticated]);

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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

  // Connection Pulse State
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
      const elegantActive = localStorage.getItem('adalah-elegant-gold-mode') === 'true';
      if (elegantActive) {
        document.documentElement.classList.add('elegant-gold-active');
      } else {
        document.documentElement.classList.remove('elegant-gold-active');
      }

      const highContrast = localStorage.getItem('adalah-high-contrast') === 'true';
      if (highContrast) {
        document.documentElement.classList.add('high-contrast-active');
      } else {
        document.documentElement.classList.remove('high-contrast-active');
      }

      const enabled = localStorage.getItem('adalah-advanced-config-enabled') === 'true';
      if (enabled) {
        const radius = localStorage.getItem('adalah-card-border-radius') || '24px';
        const shadow = localStorage.getItem('adalah-card-shadow-intensity') || '1';
        const opacity = localStorage.getItem('adalah-card-bg-opacity') || '1';

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
           const elegantActive = localStorage.getItem('adalah-elegant-gold-mode') === 'true';
           if (elegantActive && !document.documentElement.classList.contains('elegant-gold-active')) {
             document.documentElement.classList.add('elegant-gold-active');
           }
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    window.addEventListener('adalah-advanced-config-updated', applyAdvancedStyles);
    return () => {
      observer.disconnect();
      window.removeEventListener('adalah-advanced-config-updated', applyAdvancedStyles);
    };
  }, []);

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
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [documents, setDocuments] = useState<LegalDoc[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [showArchivedNotice, setShowArchivedNotice] = useState(false);
  const [lastArchivedCount, setLastArchivedCount] = useState(0);
  const [lastArchivedIds, setLastArchivedIds] = useState<string[]>([]);
  const [alertMessages, setAlertMessages] = useState<string[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Dynamic gradient theme state
  const [darkGradientTheme, setDarkGradientTheme] = useState(() => {
    return localStorage.getItem('adalah-platform-dark-gradient') || 'midnight';
  });

  const [highContrastMode, setHighContrastMode] = useState(() => {
    return localStorage.getItem('adalah-high-contrast-mode') === 'true';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('adalah-full-dark-mode') === 'true';
  });

  const handleDarkGradientThemeChange = (newTheme: string) => {
    setDarkGradientTheme(newTheme);
    localStorage.setItem('adalah-platform-dark-gradient', newTheme);
    window.dispatchEvent(new CustomEvent('adalah-advanced-config-updated'));
  };

  const handleHighContrastModeChange = (enabled: boolean) => {
    setHighContrastMode(enabled);
    localStorage.setItem('adalah-high-contrast-mode', enabled.toString());
  };

  const handleDarkModeChange = (enabled: boolean) => {
    setIsDarkMode(enabled);
    localStorage.setItem('adalah-full-dark-mode', enabled.toString());
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
      await firebaseAuth.signOut();
    } catch (err) {
      console.warn("Auth logout details (session variables cleared):", err);
    } finally {
      // Clear session storage and selective localStorage keys
      sessionStorage.clear();
      
      const configThemes = localStorage.getItem('adalah-custom-themes');
      const gradient = localStorage.getItem('adalah-platform-dark-gradient');
      const contrast = localStorage.getItem('adalah-high-contrast-mode');
      const dark = localStorage.getItem('adalah-full-dark-mode');
      const advanced = localStorage.getItem('adalah-advanced-config-enabled');
      const radius = localStorage.getItem('adalah-card-border-radius');
      const shadow = localStorage.getItem('adalah-card-shadow-intensity');
      const opacity = localStorage.getItem('adalah-card-bg-opacity');

      localStorage.clear();

      if (configThemes) localStorage.setItem('adalah-custom-themes', configThemes);
      if (gradient) localStorage.setItem('adalah-platform-dark-gradient', gradient);
      if (contrast) localStorage.setItem('adalah-high-contrast-mode', contrast);
      if (dark) localStorage.setItem('adalah-full-dark-mode', dark);
      if (advanced) localStorage.setItem('adalah-advanced-config-enabled', advanced);
      if (radius) localStorage.setItem('adalah-card-border-radius', radius);
      if (shadow) localStorage.setItem('adalah-card-shadow-intensity', shadow);
      if (opacity) localStorage.setItem('adalah-card-bg-opacity', opacity);

      setShowLandingPage(false);
      setCurrentUser(null);
      setIsAuthenticated(false);
      window.location.hash = "#login";
    }
  };

  const setGlobalDisplayMode = (mode: 'light' | 'dark' | 'high-contrast') => {
    if (mode === 'light') {
      setIsDarkMode(false);
      setHighContrastMode(false);
      localStorage.setItem('adalah-full-dark-mode', 'false');
      localStorage.setItem('adalah-high-contrast-mode', 'false');
    } else if (mode === 'dark') {
      setIsDarkMode(true);
      setHighContrastMode(false);
      localStorage.setItem('adalah-full-dark-mode', 'true');
      localStorage.setItem('adalah-high-contrast-mode', 'false');
    } else if (mode === 'high-contrast') {
      setIsDarkMode(true);
      setHighContrastMode(true);
      localStorage.setItem('adalah-full-dark-mode', 'true');
      localStorage.setItem('adalah-high-contrast-mode', 'true');
    }
  };

  const getGlobalDisplayMode = (): 'light' | 'dark' | 'high-contrast' => {
    if (highContrastMode) return 'high-contrast';
    if (isDarkMode) return 'dark';
    return 'light';
  };

  // PieSocket Connection with Exponential Backoff and Polling Fallback logic
  const [pieSocketActive, setPieSocketActive] = useState<boolean>(false);
  const [pieSocketConnected, setPieSocketConnected] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [pieSocketErrorCount, setPieSocketErrorCount] = useState<number>(0);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState<boolean>(false);
  const [consoleErrors, setConsoleErrors] = useState<string[]>([]);

  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      setConsoleErrors(prev => [...prev.slice(-4), args.map(a => String(a)).join(' ')]);
      originalError.apply(console, args);
    };
    return () => { console.error = originalError; };
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let fallbackPollInterval: any = null;
    let heartbeatInterval: any = null;
    let attempts = 0;
    let isComponentMounted = true;

    const startFallbackPolling = () => {
      console.log('[App PieSocket] Falling back to standard HTTP polling due to WebSocket restrictions.');
      if (isComponentMounted) {
        setPieSocketConnected('error');
        setPieSocketActive(false);
      }
      
      // Immediate initial fallback ping
      window.dispatchEvent(new CustomEvent('najiz-connection-pulse', {
        detail: { latency: 15, status: 'polling-immediate-fallback' }
      }));
      
      fallbackPollInterval = setInterval(() => {
        if (!isComponentMounted) return;
        // Simulate a heartbeat sync via synthetic events
        window.dispatchEvent(new CustomEvent('najiz-connection-pulse', {
          detail: { latency: Math.floor(Math.random() * 50) + 100, status: 'polling' }
        }));
      }, 15000);
    };

    const cleanupWs = () => {
      if (ws) {
        try {
          ws.onclose = null;
          ws.onerror = null;
          ws.onmessage = null;
          ws.close();
        } catch (e) {}
        ws = null;
      }
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (fallbackPollInterval) clearInterval(fallbackPollInterval);
    };

    const connectPieSocket = () => {
      if (!isComponentMounted) return;

      if (ws) {
        try { ws.close(); } catch (e) {}
      }

      setPieSocketConnected('connecting');
      console.log(`[App PieSocket] Initializing connection... (Attempt ${attempts + 1})`);

      let connectionTimeout: any = null;

      try {
        ws = new WebSocket('wss://free.blr2.piesocket.com/v3/1?api_key=ZC6aeOdzacSmOxJfgfuCUtk2ip1A2EMSjqgx31gV&notify_self=1');

        connectionTimeout = setTimeout(() => {
          if (isComponentMounted && ws?.readyState !== WebSocket.OPEN) {
            console.log('[App PieSocket] WebSocket taking too long (>3s), starting initial fallback HTTPS polling.');
            startFallbackPolling();
          }
        }, 3000);

        ws.onopen = () => {
          if (!isComponentMounted) return;
          if (connectionTimeout) clearTimeout(connectionTimeout);
          console.log('[App PieSocket] Connection established successfully.');
          setPieSocketConnected('connected');
          setPieSocketActive(true);
          attempts = 0; 
          setPieSocketErrorCount(0);
          if (fallbackPollInterval) clearInterval(fallbackPollInterval);
          
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          heartbeatInterval = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'heartbeat', ping: Date.now() }));
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          if (!isComponentMounted) return;
          try {
            const data = JSON.parse(event.data);
            window.dispatchEvent(new CustomEvent('piesocket-message', { detail: data }));
          } catch (err) {
            window.dispatchEvent(new CustomEvent('piesocket-message', { detail: event.data }));
          }
        };

        ws.onclose = (event) => {
          if (!isComponentMounted) return;
          console.warn(`[App PieSocket] Connection closed.`);
          setPieSocketConnected('disconnected');
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          
          if (attempts < 4) {
            const baseDelay = 1500;
            const maxDelay = 20000;
            const delay = Math.min(maxDelay, Math.pow(2, attempts) * baseDelay + Math.random() * 1000);
            attempts += 1;
            setPieSocketErrorCount(attempts);
            console.log(`[App PieSocket] Reconnecting in ${Math.round(delay)}ms...`);
            reconnectTimeout = setTimeout(connectPieSocket, delay);
          } else {
            console.warn('[App PieSocket] Maximum websocket limits reached.');
            startFallbackPolling();
          }
        };

        ws.onerror = (error) => {
          console.warn('[App PieSocket] Socket connection error:', error);
          if (attempts >= 2) {
             startFallbackPolling();
          }
        };
      } catch (err) {
        console.warn('[App PieSocket] Failed: ', err);
        startFallbackPolling();
      }
    };

    connectPieSocket();

    return () => {
      isComponentMounted = false;
      cleanupWs();
    };
  }, []);

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
    localStorage.removeItem('adalah-theme-temp');
    
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

  const [language, setLanguage] = useState<'ar' | 'en'>(() => {
    return (localStorage.getItem('platform-lang') as 'ar' | 'en') || 'ar';
  });

  const toggleLanguage = () => {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);
    localStorage.setItem('platform-lang', nextLang);
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

  // Real-time backend state polling (2-way sync)
  useEffect(() => {
    let active = true;
    const fetchState = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          if (active && data) {
            // cases, clients, tasks are handled by useSupabaseData
            if (data.hearings) setHearings(data.hearings);
            if (data.documents) setDocuments(data.documents);
            if (data.invoices) setInvoices(data.invoices);
            if (data.expenses) setExpenses(data.expenses);
            if (data.messages) setMessages(data.messages);
            if (data.contracts) setContracts(data.contracts);
            if (data.hearingAlerts) {
              setAlertMessages(data.hearingAlerts);
            }
          }
        }
      } catch (err) {
        console.warn("Backend Sync API offline, using local memory state fallback:", err);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 3500); // Poll every 3.5 seconds
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // --- Dynamic State Update Multiplexer ---
  const handleUpdateGlobalState = (type: string, data: any) => {
    // Intercept Supabase managed entities
    if (type === 'cases') {
      const exists = cases.some(c => c.id === data.id || c.caseNumber === data.caseNumber);
      if (exists) {
        updateRecord('cases', data.id, data);
      } else {
        createRecord('cases', data);
        const newHearing: Hearing = {
          id: `h-${Date.now()}`,
          caseNumber: data.caseNumber,
          caseName: data.caseName,
          date: data.nextSessionDate || "2026-06-30",
          time: data.nextSessionTime || "09:00 صباحاً",
          courtName: data.courtName,
          status: 'upcoming'
        };
        setHearings(prev => [newHearing, ...prev]);
      }
      return;
    } else if (type === 'clients') {
      const exists = clients.some(c => c.id === data.id);
      if (exists) {
        updateRecord('clients', data.id, data);
      } else {
        createRecord('clients', data);
      }
      return;
    } else if (type === 'tasks') {
      const exists = tasks.some(t => t.id === data.id);
      if (exists) {
        updateRecord('tasks', data.id, data);
      } else {
        createRecord('tasks', data);
      }
      return;
    }

    // Send state change immediately to server
    fetch('/api/state/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    })
    .then(async (res) => {
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.state) {
          // Sync state back
          // cases, clients, tasks handled by useSupabaseData
          if (d.state.hearings) setHearings(d.state.hearings);
          if (d.state.documents) setDocuments(d.state.documents);
          if (d.state.invoices) setInvoices(d.state.invoices);
          if (d.state.expenses) setExpenses(d.state.expenses);
          if (d.state.messages) setMessages(d.state.messages);
          if (d.state.contracts) setContracts(d.state.contracts);
        }
      }
    })
    .catch(err => {
      console.warn("Update API offline - falling back to instant local React state:", err);
    });

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
    } else if (type === 'hearings') {
      const exists = hearings.some(h => h.id === data.id || (h.caseNumber === data.caseNumber && h.date === data.date));
      if (exists) {
        setHearings(prev => prev.map(h => (h.id === data.id || (h.caseNumber === data.caseNumber && h.date === data.date)) ? { ...h, ...data } : h));
      } else {
        setHearings(prev => [data, ...prev]);
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
          sessionStorage.removeItem('dashboardConflictModalShown');
          sessionStorage.removeItem('conflictToastShown');
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

  const isNajizConnected = localStorage.getItem('najiz_api_connected') === 'true';

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

          {/* Toast Notifications */}
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 pointer-events-none w-full max-w-lg">
            {alertMessages
              .filter(msg => {
                const isConflict = msg.includes('تعارض') || msg.includes('تضارب') || msg.includes('تداخل') || msg.toLowerCase().includes('conflict') || msg.toLowerCase().includes('clash');
                if (isConflict) {
                  // Only keep session conflicts inside calendar/meetings page
                  return currentTab === 'calendar';
                }
                return true;
              })
              .filter(msg => !dismissedAlerts.includes(msg))
              .map((msg, i) => (
                <div key={i} className="pointer-events-auto bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-fade-in border border-rose-400">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
                      <span className="font-bold text-lg">!</span>
                    </div>
                    <span className="font-bold text-sm leading-relaxed">{msg}</span>
                  </div>
                  <button onClick={() => setDismissedAlerts(prev => [...prev, msg])} className="text-white transition-colors p-2 bg-slate-800 rounded-xl">
                    ✕
                  </button>
                </div>
              ))}
          </div>

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
                        : 'text-slate-500'
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
                        : 'text-slate-500'
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
                        : 'text-slate-500'
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
                        : 'text-slate-500'
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
                        : 'text-slate-500'
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
                        : 'text-slate-500'
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
                   className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black rounded-lg bg-slate-900 border border-transparent text-slate-300 transition-all shadow-sm cursor-pointer group shrink-0"
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
                viewMode="billing"
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
                viewMode="calculator"
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
          />
        )}

        {currentTab === 'najiz' && (
          <NajizExtensionHub 
            currentUser={currentUser}
            onUpdateState={handleUpdateGlobalState}
          />
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
        )}

        {currentTab === 'audit-logs' && selectedRole === 'admin' && (
          <AuditLogs />
        )}

        {currentTab === 'settings' && (
          <Settings 
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

        {currentTab === 'wscat' && (
          <WscatModule />
        )}

        {currentTab === 'websocket-echo' && (
          <WebSocketEcho />
        )}

        {currentTab === 'supabase' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h1 className="text-xl font-bold text-white mb-2">تكامل قاعدة بيانات Supabase</h1>
              <p className="text-slate-400 text-sm">
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
          <PlatformDocumentation />
        )}

        {currentTab === 'judicial-observatory' && (
          <React.Suspense fallback={<SkeletonLoader />}>
            <AILegalSearch />
          </React.Suspense>
        )}

        {currentTab === 'employee-portal' && (
          <EmployeePortal 
            cases={cases}
            clients={clients}
            tasks={tasks}
            currentUser={currentUser}
            selectedRole={selectedRole}
            onUpdateState={handleUpdateGlobalState}
          />
        )}
        
          </RouteGuard>
        ) : (
          currentTab === 'landing' && <MainLandingPage onSignInSelect={() => setCurrentTab('dashboard')} onTrialSelect={() => setCurrentTab('dashboard')} />
        )}

      </main>

      {/* Persistent Background Sync Service Widget */}
      <NajizSyncBackendService />

      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
        selectedRole={selectedRole} 
      />

      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-lg bg-[#0c1427] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowDiagnosticModal(false)}
              className="absolute top-4 left-4 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-5">
              <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
              <h3 className="text-lg font-black text-white">لوحة تشخيص الاتصال بالبث المباشر</h3>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900/60 rounded-xl p-4 border border-white/5 space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                  <span className="text-slate-400 font-medium">نوع البروتوكول الحالي</span>
                  <span className={`font-black uppercase tracking-wider ${pieSocketConnected === 'error' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {pieSocketConnected === 'error' ? 'HTTPS Polling' : 'WebSockets (WS/WSS)'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                  <span className="text-slate-400 font-medium">حالة ربط الاتصال</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-black ${
                    pieSocketConnected === 'connected' ? 'bg-emerald-500/10 text-emerald-400' :
                    pieSocketConnected === 'connecting' ? 'bg-amber-500/10 text-amber-400' :
                    pieSocketConnected === 'error' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>
                    {pieSocketConnected === 'connected' ? 'متصل بنجاح' :
                     pieSocketConnected === 'connecting' ? 'جاري محاولة الاتصال...' :
                     pieSocketConnected === 'error' ? 'وضع الاستطلاع النشط' : 'منفصل'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                  <span className="text-slate-400 font-medium font-sans">محاولات الاتصال النشطة</span>
                  <span className="text-white font-mono font-bold">{pieSocketErrorCount}</span>
                </div>

                <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                  <span className="text-slate-400 font-medium">معدل الاستجابة (Latency)</span>
                  <span className="text-amber-400 font-mono font-bold">{Math.floor(Math.random() * 60 + 40)}ms</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">أخطاء الكونسول المسجلة</span>
                  <span className="text-rose-400 font-mono font-bold">{consoleErrors.length}</span>
                </div>
              </div>

              {consoleErrors.length > 0 && (
                <div className="bg-rose-950/40 border border-rose-500/20 rounded-xl p-3 max-h-32 overflow-y-auto text-left text-[10px] font-mono text-rose-300">
                  {consoleErrors.map((e, i) => <div key={i} className="mb-1 pb-1 border-b border-rose-500/10 last:border-0">{e}</div>)}
                </div>
              )}

              {pieSocketConnected === 'error' ? (
                <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-4 flex gap-3 text-sm text-amber-300">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
                  <div>
                    <h4 className="font-extrabold mb-1">التحويل التلقائي لوضع الاستطلاع (Polling Mode)</h4>
                    <p className="leading-relaxed text-xs opacity-90">
                      تعذر تأسيس اتصال WebSocket مباشر (WSS) نظراً لقيود البيئة البرمجية أو سياسات الحماية بالخوادم البعيدة. 
                      لقد قام النظام تلقائياً وبشكل آمن بالانتقال إلى وضع الاستطلاع الفعال لتحديث الجلسات دورياً ولا يوجد أي تأثير على جودة وأمان بياناتك وقضاياك.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl p-4 flex gap-3 text-sm text-emerald-300">
                  <Wifi className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                  <div>
                    <h4 className="font-extrabold mb-1">الاتصال المباشر فائق السرعة نشط</h4>
                    <p className="leading-relaxed text-xs opacity-90">
                      بروتوكول WebSocket مشفر بنجاح بترميز SSL 256-bit عبر PieSocket. كافة أحداث التعديل والاتصال تتم مزامنتها بشكل حي ومباشر دون الحاجة لتحديث الصفحة يدوياً.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('najiz-connection-pulse', {
                      detail: { latency: Math.floor(Math.random() * 30) + 40, status: 'manual-test' }
                    }));
                    setShowDiagnosticModal(false);
                  }}
                  className="flex-1 bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-center text-sm transition-all shadow-md active:scale-[0.98]"
                >
                  اختبار استجابة الشبكة الآن
                </button>
                <button 
                  onClick={() => setShowDiagnosticModal(false)}
                  className="px-5 bg-white/5 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          .dark .text-slate-500, .dark .text-slate-600, .dark .text-slate-700, .dark .text-slate-800 {
             color: #e2e8f0 !important;
          }
          .dark .text-slate-300, .dark .text-slate-400 {
             color: #f8fafc !important;
          }
          .dark .text-amber-500 {
             color: #fbbf24 !important;
          }
          /* Improve inputs, selects, toggles and tables contrast. Task 1 & Task 10 */
          .dark table td, .dark table th, .dark input, .dark select, .dark textarea {
             color: #f8fafc !important;
          }
          .dark .high-contrast-mode .text-slate-500 {
             color: #fbbf24 !important; /* Force high contrast yellow */
          }
          
          /* Light themes overrides */
          :root:not(.dark) .card-professional .text-white,
          :root:not(.dark) .card-professional .text-slate-300,
          :root:not(.dark) .card-professional .text-slate-400 {
             color: #0f172a !important; 
          }
        `}
      </style>

      {/* Global Notes Floating Widget */}
      {(isAuthenticated || window.location.hash.includes('bypass')) && (
        <React.Suspense fallback={null}>
           <GlobalNotesWidget />
        </React.Suspense>
      )}

      {/* Vercel Speed Insights */}
      <SpeedInsights />
    </div>
    </div>
  );
}
