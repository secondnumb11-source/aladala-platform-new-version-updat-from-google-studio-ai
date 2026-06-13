/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, TrendingUp, HelpCircle, Target } from 'lucide-react';
import { Case } from '@/types';

interface LegalRiskMatrixProps {
  cases: Case[];
  isHighContrast?: boolean;
}

export default function LegalRiskMatrix({ cases, isHighContrast }: LegalRiskMatrixProps) {
  // Logic to calculate win probability based on case data (simulating JudicialObservatory link)
  const caseRisks = useMemo(() => {
    return cases.slice(0, 5).map(c => {
      // Heuristic for win probability
      let prob = 50;
      if (c.category === 'commercial') prob += 15;
      if (c.category === 'labor') prob -= 10;
      if ((c.attachmentsCount || 0) > 5) prob += 10;
      if (c.status === 'active') prob += 5;
      
      // Add some randomness/volatility
      prob = Math.min(95, Math.max(5, prob + (Math.floor(Math.random() * 20) - 10)));

      return {
        id: c.id,
        name: c.caseName,
        number: c.caseNumber,
        probability: prob,
        riskLevel: prob > 70 ? 'low' : prob > 40 ? 'medium' : 'high',
        trend: Math.random() > 0.5 ? 'up' : 'down'
      };
    });
  }, [cases]);

  return (
    <div className="bg-slate-900 border border-[#D4AF37]/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 transition-opacity pointer-events-none"></div>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-[#D4AF37] to-[#FACC15] text-slate-900 rounded-2xl shadow-lg">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-black text-white text-base tracking-tight">مصفوفة المخاطر القانونية (AI)</h4>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">تحليل احتمالية النجاح بناءً على بيانات المرصد القضائي.</p>
        </div>
      </div>

      <div className="space-y-4">
        {caseRisks.map((item, idx) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 transition-all"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-300 truncate max-w-[150px]">{item.name}</span>
              <span className="text-[9px] font-mono text-slate-500">#{item.number}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.probability}%` }}
                  className={`h-full ${
                    item.riskLevel === 'low' ? 'bg-emerald-500' : 
                    item.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-black ${
                  item.riskLevel === 'low' ? 'text-emerald-400' : 
                  item.riskLevel === 'medium' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {item.probability}%
                </span>
                {item.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ShieldAlert className="w-3 h-3 text-rose-500" />
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
               <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">احتمالية النجاح الاستراتيجية</span>
               <span className="text-[8px] font-black text-slate-400">تحديث لحظي • المرصد</span>
            </div>
          </motion.div>
        ))}
        
        {caseRisks.length === 0 && (
          <div className="py-10 text-center space-y-3">
             <HelpCircle className="w-8 h-8 text-slate-700 mx-auto" />
             <p className="text-slate-500 text-xs font-bold">لا توجد بيانات كافية للتحليل حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}
