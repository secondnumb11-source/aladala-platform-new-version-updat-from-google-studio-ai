import React from 'react';

export default function DashboardCardSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700/50 rounded-xl"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-1/3"></div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700/30 rounded w-1/4"></div>
        </div>
      </div>
      <div className="h-8 bg-slate-200 dark:bg-slate-700/50 rounded w-1/2"></div>
      <div className="h-32 bg-slate-100 dark:bg-slate-700/30 rounded-2xl w-full"></div>
    </div>
  );
}
