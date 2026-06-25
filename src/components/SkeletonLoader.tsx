import React from 'react';
import { motion } from 'motion/react';

export const SkeletonLoader = () => {
  return (
    <div className="w-full h-full min-h-[400px] p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-3">
          <motion.div 
            initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
            className="w-48 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"
          />
          <motion.div 
            initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, duration: 1, repeatType: "reverse", delay: 0.2 }}
            className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded-md"
          />
        </div>
        <motion.div 
          initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, duration: 1, repeatType: "reverse", delay: 0.1 }}
          className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full"
        />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, duration: 1, repeatType: "reverse", delay: i * 0.1 }}
            className="p-5 rounded-2xl bg-[#0a1628] dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="w-16 h-6 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="space-y-2">
              <div className="w-1/2 h-6 rounded-md bg-slate-200 dark:bg-slate-700" />
              <div className="w-3/4 h-4 rounded-md bg-slate-100 dark:bg-slate-800" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
          className="lg:col-span-2 rounded-2xl bg-[#0a1628] dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 min-h-[300px] space-y-4"
        >
          <div className="w-1/3 h-6 bg-slate-200 dark:bg-slate-800 rounded-md mb-6" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="w-2/3 h-3 bg-slate-50 dark:bg-slate-800/50 rounded" />
              </div>
            </div>
          ))}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse", delay: 0.3 }}
          className="rounded-2xl bg-[#0a1628] dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 min-h-[300px] space-y-4"
        >
          <div className="w-1/2 h-6 bg-slate-200 dark:bg-slate-800 rounded-md mb-6" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ))}
        </motion.div>
      </div>
    </div>
  );
};
