import React from 'react';
import { useSystemData } from '@/hooks/useSystemData';

interface Props {
  selectedCaseId?: string;
  selectedClientId?: string;
  onCaseSelect: (case_: any) => void;
  onClientSelect: (client: any) => void;
  showCase?: boolean;
  showClient?: boolean;
  label?: string;
}

export default function CaseClientSelector({
  selectedCaseId, selectedClientId,
  onCaseSelect, onClientSelect,
  showCase = true, showClient = true
}: Props) {
  const { cases, clients, isLoading } = useSystemData();

  if (isLoading) {
    return (
      <div className="animate-pulse bg-slate-800 rounded-xl h-10" />
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      {showCase && (
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            📁 اختر القضية
          </label>
          <select
            value={selectedCaseId || ''}
            onChange={e => {
              const c = cases.find(c => c.id === e.target.value);
              if (c) onCaseSelect(c);
            }}
            className="w-full bg-slate-800 border border-slate-700
              text-white rounded-xl px-4 py-2.5 text-sm
              focus:border-amber-500 focus:outline-none"
          >
            <option value="">— اختر قضية من النظام —</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>
                #{c.case_number} — {c.title || c.client_name}
                {c.status ? ` (${c.status})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {showClient && (
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            👤 اختر العميل
          </label>
          <select
            value={selectedClientId || ''}
            onChange={e => {
              const cl = clients.find(cl => cl.id === e.target.value);
              if (cl) onClientSelect(cl);
            }}
            className="w-full bg-slate-800 border border-slate-700
              text-white rounded-xl px-4 py-2.5 text-sm
              focus:border-amber-500 focus:outline-none"
          >
            <option value="">— اختر عميلاً من النظام —</option>
            {clients.map(cl => (
              <option key={cl.id} value={cl.id}>
                {cl.name}
                {cl.phone ? ` — ${cl.phone}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
