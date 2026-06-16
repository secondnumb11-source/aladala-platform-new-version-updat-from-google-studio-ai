import { CourtCase, SyncStatus } from "@/types";
import { Gavel, FileText, Bell, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface DashboardStatsProps {
  cases: CourtCase[];
  lawyerName: string;
  licenseNumber: string;
  syncStatus: SyncStatus;
}

export default function DashboardStats({
  cases,
  lawyerName,
  licenseNumber,
  syncStatus,
}: DashboardStatsProps) {
  // Compute Stats
  const totalCases = cases.length;
  
  const upcomingHearings = cases.reduce((acc, c) => {
    const upcoming = c.hearings.filter(h => h.hearingStatus === "قادمة");
    return acc + upcoming.length;
  }, 0);

  const activePoas = cases.reduce((acc, c) => {
    const active = c.powersOfAttorney.filter(p => p.status === "سارية");
    return acc + active.length;
  }, 0);

  const totalExecutionValueStr = cases.reduce((acc, c) => {
    let subtotal = 0;
    c.executionRequests.forEach(req => {
      // Parse numerical amount from string like "15,400,000 ريال سعودي"
      const parsed = parseFloat(req.amount.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed)) {
        subtotal += parsed;
      }
    });
    return acc + subtotal;
  }, 0).toLocaleString("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Lawyer Header Banner */}
      <div className="card-professional relative overflow-hidden group border-none bg-sky-50 text-white">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <span className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
              المكتب الموحد للعملاء والعملاء والمحاميين والمستشاريين القانونيين والاستشارات القانونية والشرعية
            </span>
            <h2 className="text-3xl font-display font-semibold text-white tracking-tight mt-2">{lawyerName}</h2>
            <p className="text-white font-bold text-sm font-medium">رقم الترخيص المهني: <span className="text-indigo-400 font-mono font-bold tracking-widest">{licenseNumber}</span></p>
          </div>

          <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md border border-slate-200 px-5 py-4 rounded-2xl shadow-xl shadow-indigo-900/10">
            <div className={`w-3 h-3 rounded-full ${
              syncStatus.status === "stable" ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" 
              : syncStatus.status === "syncing" ? "bg-indigo-500 animate-spin"
              : syncStatus.status === "error" ? "bg-rose-500"
              : "bg-amber-500"
            }`}></div>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-slate-900 text-xs uppercase font-black tracking-wider">آخر مزامنة ناجز التلقائية</div>
                <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-black ${
                  syncStatus.status === "stable" ? "bg-emerald-100 text-emerald-800 border border-emerald-250"
                  : syncStatus.status === "syncing" ? "bg-indigo-100 text-indigo-800 border border-indigo-250"
                  : "bg-amber-100 text-amber-800 border border-amber-250"
                }`}>
                  {syncStatus.status === "stable" ? "مكتملة ومحدّثة" 
                   : syncStatus.status === "syncing" ? "جاري التحديث الآن" 
                   : "تم الاتصال بنجاح"}
                </span>
              </div>
              <div className="text-indigo-900 text-sm font-mono font-black mt-0.5" dir="ltr">
                {syncStatus.last_sync_at === "لا يوجد" || !syncStatus.last_sync_at ? "لم تتم بعد" : new Date(syncStatus.last_sync_at).toLocaleString("ar-SA")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Cases */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="card-professional group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-slate-950 text-sm font-black">إجمالي الدعاوى القضائية النشطة</span>
              <div className="text-4xl font-display font-semibold text-slate-900 tracking-tight">{totalCases}</div>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl transition-colors">
              <Gavel className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 text-sm text-slate-900 flex items-center gap-2 font-black">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>تسجيل فوري من بوابة ناجز الرقمية</span>
          </div>
        </motion.div>

        {/* Card 2: Upcoming Hearings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="card-professional group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-slate-900  text-sm font-medium">الجلسات القضائية القادمة</span>
              <div className="text-4xl font-display font-semibold text-slate-900  tracking-tight">{upcomingHearings}</div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-400 font-black rounded-xl transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 text-sm text-slate-900  flex items-center gap-2 font-medium">
            <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>محدثة مع جدول مواعيد المحاكم</span>
          </div>
        </motion.div>

        {/* Card 3: Active Powers of Attorney */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="card-professional group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-slate-900  text-sm font-medium">الوكالات القانونية النشطة</span>
              <div className="text-4xl font-display font-semibold text-slate-900  tracking-tight">{activePoas}</div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl transition-colors">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 text-sm text-slate-900  flex items-center gap-2 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>الوكالات سارية الصلاحية للتمثيل</span>
          </div>
        </motion.div>

        {/* Card 4: Execution Requests */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="card-professional group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <span className="text-slate-900  text-sm font-medium truncate block">إجمالي أموال طَلَبَات التنفيذ</span>
              <div className="text-xl font-display font-bold text-slate-900  tracking-tight mt-1" title={totalExecutionValueStr}>
                {totalExecutionValueStr}
              </div>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl transition-colors">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 text-sm text-slate-900  flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>الحقوق المالية والتعويضات المستحقة</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
