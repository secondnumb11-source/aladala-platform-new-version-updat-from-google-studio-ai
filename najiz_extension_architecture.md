# Enterprise Legal Data Synchronization Extension Architecture

## 1. Technical Architecture & Project Structure

This architecture defines a Manifest V3, React/TypeScript-based Chrome Extension that securely extracts, normalizes (via an AI layer), and synchronizes data to your Legal SaaS Platform without requiring manually inputted API keys (it uses the authorized session token passed securely).

### Core Stack
- **Framework:** React 18 + TypeScript + Vite
- **Extension API:** Chrome Manifest V3
- **State Management:** Zustand (for sync state tracking)
- **Styling:** Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL), Next.js App Router API

### Directory Structure
```text
/adalah-chrome-extension
├── manifest.json
├── package.json
├── vite.config.ts
├── /public
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── /src
│   ├── /background
│   │   └── service_worker.ts     # Handles background sync intervals & API pushes
│   ├── /content
│   │   ├── scraper.ts            # DOM Extraction logic
│   │   ├── observer.ts           # Intercepts Najiz dynamic rendering
│   │   └── injector.tsx          # Injects the floating "Sync" UI widget
│   ├── /popup
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── PopupApp.tsx          # Main React Dashboard for extension
│   ├── /services
│   │   ├── api.ts                # SaaS Platform REST API communication
│   │   └── syncEngine.ts         # Coordinates scraping and API pushing
│   ├── /ai
│   │   └── classification.ts     # AI Normalization & Deduplication logic
│   └── /types
│       └── index.ts              # Global Types & Interfaces
```

---

## 2. Configuration Files

### `manifest.json` (Manifest V3)
```json
{
  "manifest_version": 3,
  "name": "منصة العدالة - أداة المزامنة الذكية",
  "version": "1.0.0",
  "description": "مزامنة آمنة لبيانات المحامين من البوابات العدلية إلى منصة السحابة بدون الحاجة لمفاتيح API.",
  "permissions": [
    "activeTab",
    "storage",
    "scripting",
    "alarms"
  ],
  "host_permissions": [
    "*://*.najiz.sa/*",
    "*://*.moj.gov.sa/*",
    "https://api.your-saas-platform.com/*"
  ],
  "background": {
    "service_worker": "src/background/service_worker.js",
    "type": "module"
  },
  "action": {
    "default_popup": "src/popup/index.html",
    "default_title": "إعدادات المزامنة"
  },
  "content_scripts": [
    {
      "matches": ["*://*.najiz.sa/*"],
      "js": ["src/content/index.js"],
      "css": ["src/content/styles.css"],
      "run_at": "document_idle"
    }
  ]
}
```

---

## 3. Core React UI (Popup View)

### `src/popup/PopupApp.tsx`
```tsx
import React, { useState, useEffect } from 'react';
import { SyncService } from '../services/syncEngine';

export default function PopupApp() {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [progress, setProgress] = useState(0);

  const startSync = async (type: string) => {
    setSyncStatus('syncing');
    try {
      // Sends message to content script to execute scraping
      await chrome.runtime.sendMessage({ action: 'START_SYNC', payload: { type } });
      setSyncStatus('success');
    } catch (e) {
      setSyncStatus('error');
    }
  };

  return (
    <div className="w-[350px] min-h-[400px] p-4 bg-slate-900 text-white font-sans" dir="rtl">
      <div className="border-b border-slate-700 pb-3 mb-4 flex justify-between items-center">
        <h1 className="text-lg font-black text-[#D4AF37]">منصة العدالة للمحاماة</h1>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-emerald-400">متصل (جلسة نشطة)</span>
        </div>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => startSync('ALL')}
          className="w-full bg-[#D4AF37] hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-xl transition-all"
        >
          مزامنة كافة البيانات
        </button>
        
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={() => startSync('CASES')} className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-sm border border-slate-700 hover:border-[#D4AF37]">
            القضايا فقط
          </button>
          <button onClick={() => startSync('HEARINGS')} className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-sm border border-slate-700 hover:border-[#D4AF37]">
            الجلسات فقط
          </button>
          <button onClick={() => startSync('EXECUTIONS')} className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-sm border border-slate-700 hover:border-[#D4AF37]">
            التنفيذ فقط
          </button>
          <button onClick={() => startSync('AGENCIES')} className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-sm border border-slate-700 hover:border-[#D4AF37]">
            الوكالات فقط
          </button>
        </div>

        {syncStatus === 'syncing' && (
           <div className="mt-4 p-3 bg-blue-900/40 border border-blue-500/30 rounded-xl">
              <p className="text-xs text-blue-300">جارِ التحليل عبر الذكاء الاصطناعي والمزامنة...</p>
           </div>
        )}
      </div>
    </div>
  );
}
```

---

## 4. Content Script (DOM Extraction Logic)

### `src/content/scraper.ts`
```typescript
interface ExtractedCase {
   caseId: string;
   subject: string;
   status: string;
   court: string;
   date: string;
}

export class NajizScraper {
   static extractCases(): ExtractedCase[] {
      // Scrape strategy specific to the portal
      const cases: ExtractedCase[] = [];
      const rows = document.querySelectorAll('.table-row-case'); // Example selector
      
      rows.forEach(row => {
         cases.push({
            caseId: row.querySelector('.case-number')?.textContent?.trim() || '',
            subject: row.querySelector('.case-title')?.textContent?.trim() || '',
            status: row.querySelector('.case-status')?.textContent?.trim() || '',
            court: row.querySelector('.court-name')?.textContent?.trim() || '',
            date: row.querySelector('.case-date')?.textContent?.trim() || ''
         });
      });
      return cases;
   }
}
```

---

## 5. AI Classification & Normalization Layer

This runs either in the Service Worker prior to dispatch, or immediately upon API reception.

### `src/ai/classification.ts`
```typescript
export class AIClassificationEngine {
  /**
   * Normalizes raw scraped text into standardized ISO formats and identifies data categories.
   */
  static normalizeRecord(rawData: any) {
    return {
      ...rawData,
      normalizedStatus: this.mapStatus(rawData.status),
      detectedCategory: this.detectCategory(rawData),
      lastUpdateTimestamp: new Date().toISOString()
    };
  }

  private static mapStatus(rawStatus: string): string {
    const activeKeywords = ['مفتوحة', 'نشطة', 'قيد النظر', 'منظورة'];
    const closedKeywords = ['مغلقة', 'منتهية', 'تم الحكم', 'مشطوبة'];
    
    if (activeKeywords.some(k => rawStatus.includes(k))) return 'ACTIVE';
    if (closedKeywords.some(k => rawStatus.includes(k))) return 'CLOSED';
    return 'UNKNOWN';
  }

  private static detectCategory(data: any): string {
    if (data.caseId && data.court) return 'CASES';
    if (data.sessionTime && data.judge) return 'HEARINGS';
    if (data.principal && data.agent) return 'AGENCIES';
    return 'UNCLASSIFIED';
  }
}
```

---

## 6. Supabase Database Schema (PostgreSQL)

Run these queries in your Supabase SQL editor to support the synchronized objects.

```sql
-- 1. Cases Table
CREATE TABLE public.cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lawyer_id UUID REFERENCES auth.users(id) NOT NULL,
    najiz_case_number VARCHAR(50) UNIQUE NOT NULL,
    subject TEXT,
    normalized_status VARCHAR(50) DEFAULT 'ACTIVE',
    court_name VARCHAR(255),
    filing_date DATE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Hearings Table
CREATE TABLE public.hearings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    lawyer_id UUID REFERENCES auth.users(id) NOT NULL,
    hearing_date DATE NOT NULL,
    hearing_time TIME,
    circuit_name VARCHAR(255),
    outcome_notes TEXT,
    status VARCHAR(50) DEFAULT 'UPCOMING',
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sync Audit Logs
CREATE TABLE public.sync_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lawyer_id UUID REFERENCES auth.users(id),
    sync_type VARCHAR(50), -- 'FULL', 'CASES', 'HEARINGS'
    records_processed INT DEFAULT 0,
    errors_encountered INT DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) -- 'SUCCESS', 'FAILED', 'PARTIAL'
);
```

---

## 7. Actionable Deployment Guide

### For the Development Team (Compilation)
1. Initialize the project: `npm create vite@latest adalah-extension -- --template react-ts`
2. Install Chrome Types: `npm install -D @types/chrome`
3. Configure `vite.config.ts` to output without hash chunks (vital for Manifest V3 content scripts).
4. Build command: `npm run build`. The resulting `dist/` directory is your Chrome plugin.

### For the End User (The Lawyer)
1. Download the ZIP file generated by the platform.
2. Unzip it to a secure local folder.
3. Open Google Chrome.
4. Go to `chrome://extensions`.
5. Toggle **Developer mode** in the top right.
6. Click **Load unpacked** and select the unzipped folder.
7. Navigate to `https://najiz.sa`, login normally, and the Adalah Extension widget will safely wake up and detect the secure session. No API keys necessary!
