import React, { useState, useEffect } from "react";
import { 
  Users2, 
  Plus, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Trash2, 
  Pencil, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface EmployeeRow {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  salary: number; // Used for commission rate
  department?: string;
  join_date?: string;
}

interface TeamMembersProps {
  customRoles?: {
    admin?: string;
    lawyer?: string;
    researcher?: string;
    secretary?: string;
  };
}

export default function TeamMembers({ customRoles }: TeamMembersProps = {}) {
  const [members, setMembers] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [role, setRole] = useState("lawyer");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [commissionRate, setCommissionRate] = useState("35");
  const [status, setStatus] = useState("active");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchEmployees = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      if (data) {
        setMembers(data as EmployeeRow[]);
      }
    } catch (err: any) {
      console.error("[TeamMembers] Fetch Exception:", err);
      setErrorMsg("حدث خطأ أثناء تحميل الكادر الوظيفي من قاعدة البيانات.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();

    // Establish realtime channel directly bonded to the employees table
    const channel = supabase
      .channel("employees-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        () => {
          fetchEmployees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;

    setErrorMsg("");
    setSuccessMsg("");

    const commissionNum = commissionRate ? parseFloat(commissionRate) : 0;
    const payload = {
      name,
      role,
      phone,
      email,
      status,
      salary: commissionNum,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingId) {
        // SQL UPDATE Operation
        const { error } = await supabase
          .from("employees")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        setSuccessMsg("تم تعديث سجل الموظف وصلاحياته بنجاح!");
      } else {
        // SQL INSERT Operation
        const { error } = await supabase
          .from("employees")
          .insert([
            {
              ...payload,
              join_date: new Date().toISOString().split("T")[0]
            }
          ]);
        if (error) throw error;
        setSuccessMsg("تم ترخيص وتقييد الموظف بنجاح للفريق الميداني!");
      }

      // Reset Form State
      setName("");
      setPhone("");
      setEmail("");
      setCommissionRate("35");
      setStatus("active");
      setEditingId(null);
      setShowAddForm(false);
      fetchEmployees();

      setTimeout(() => {
        setSuccessMsg("");
      }, 3000);
    } catch (err: any) {
      console.error("[TeamMembers] Save Exception:", err);
      setErrorMsg(err.message || "فشلت عملية المزامنة مع خادم قاعدة البيانات.");
    }
  };

  const handleEdit = (mb: EmployeeRow) => {
    setEditingId(mb.id);
    setName(mb.name || "");
    setRole(mb.role || "lawyer");
    setPhone(mb.phone || "");
    setEmail(mb.email || "");
    setCommissionRate(mb.salary ? mb.salary.toString() : "0");
    setStatus(mb.status || "active");
    setShowAddForm(true);
    // Smooth scroll to top of component or viewport
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, memberName: string) => {
    const isConfirmed = window.confirm(
      `هل أنت متأكد من حذف الزميل (${memberName}) وإلغاء صلاحية الترافع له نهائياً؟`
    );
    if (!isConfirmed) return;

    setErrorMsg("");
    setSuccessMsg("");
    try {
      // SQL DELETE Operation
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setSuccessMsg(`تم حذف الزميل (${memberName}) نهائياً من النظام.`);
      fetchEmployees();

      setTimeout(() => {
        setSuccessMsg("");
      }, 3000);
    } catch (err: any) {
      console.error("[TeamMembers] Delete Exception:", err);
      setErrorMsg(err.message || "تعذر حذف الموظف لوجود قضايا مرتبطة به.");
    }
  };

  const handleCancelAndReset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setCommissionRate("35");
    setStatus("active");
    setEditingId(null);
    setShowAddForm(false);
    setErrorMsg("");
  };

  const getRoleLabel = (roleKey: string) => {
    switch (roleKey) {
      case "owner":
        return customRoles?.admin || "شريك مؤسس / مديـر المكتب";
      case "lawyer":
        return customRoles?.lawyer || "مرافع مستشار / مترافع مرخص";
      case "researcher":
        return customRoles?.researcher || "باحث شرعي وقانوني";
      case "secretary":
        return customRoles?.secretary || "سكرتير / منسق عام ملفات";
      default:
        return roleKey;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#c5a880] flex items-center gap-2">
            <Users2 className="w-5 h-5" />
            <span>تنظيم الهيكل الكادر للمكتب والتوزيع (Team Workspace)</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            سجل وتتبع الحضور التلقائي، عمولات العملاء والمحاميين والمستشاريين القانونيين المرخصين، وصلاحيات الترافع في ناجز بمزامنة حية ومباشرة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="p-2 border border-[#c5a880]/15 rounded-lg text-slate-300 hover:bg-[#c5a880]/10 transition-colors cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#c5a880]" : ""}`} />
          </button>
          <button
            onClick={() => {
              if (showAddForm) {
                handleCancelAndReset();
              } else {
                setShowAddForm(true);
              }
            }}
            className="bg-[#c5a880] hover:bg-[#b0936b] text-[#061224] text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? "إلغاء التعديل" : "دعوة أو تقييد زميل جديد"}</span>
          </button>
        </div>
      </div>

      {/* Notifications block */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg flex items-center gap-2 text-xs font-bold transition-all animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg flex items-center gap-2 text-xs font-bold transition-all animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Add / Edit Form Drawer */}
      {showAddForm && (
        <form 
          onSubmit={handleSubmit} 
          className="bg-[#0b1e33] border border-[#c5a880]/30 rounded-xl p-5 space-y-4 text-xs text-right animate-fadeIn"
        >
          <div className="flex justify-between items-center border-b border-[#c5a880]/15 pb-2">
            <h3 className="text-white font-bold text-sm">
              {editingId ? "تعديل صلاحيات وبيانات الزميل" : "إدراج عضو أو مرافع للفريق الميداني"}
            </h3>
            {editingId && (
              <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono text-[10px]">
                ID: {editingId.slice(0, 8)}...
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
            <div className="space-y-1.5 animate-fadeIn">
              <label className="block text-slate-300 font-medium">الاسم الثلاثي أو الرباعي المعتمد:</label>
              <input
                type="text"
                required
                placeholder="أدخل اسم الزميل بكامل ضبطه"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100 focus:outline-none focus:border-[#c5a880] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">الدور والمنصب التنفيذي:</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100 focus:outline-none focus:border-[#c5a880] transition-colors cursor-pointer"
              >
                <option value="owner">{customRoles?.admin || "شريك مؤسس / مديـر المكتب"}</option>
                <option value="lawyer">{customRoles?.lawyer || "مرافع مستشار / مترافع مرخص"}</option>
                <option value="researcher">{customRoles?.researcher || "باحث شرعي وقانوني"}</option>
                <option value="secretary">{customRoles?.secretary || "سكرتير / منسق عام ملفات"}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">المستحقات وعمولات الترافع القضائي (%) :</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                placeholder="%"
                value={commissionRate}
                onChange={e => setCommissionRate(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100 font-mono focus:outline-none focus:border-[#c5a880] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">رقم الجوال:</label>
              <input
                type="text"
                placeholder="+966 5xxxxxxxx"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100 focus:outline-none focus:border-[#c5a880] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">البريد الإلكتروني للزميل:</label>
              <input
                type="email"
                placeholder="name@aladalah-law.sa"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100 focus:outline-none focus:border-[#c5a880] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">حالة النشاط والعمل:</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100 focus:outline-none focus:border-[#c5a880] transition-colors cursor-pointer"
              >
                <option value="active">نشط ومتاح للعمل</option>
                <option value="idle">غير نشط مؤقتاً</option>
                <option value="on_leave">في إجازة رسمية</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#c5a880]/10">
            <button
              type="button"
              onClick={handleCancelAndReset}
              className="bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              إلغاء التعديل
            </button>
            <button
              type="submit"
              className="bg-[#c5a880] hover:bg-[#b0936b] text-[#061224] px-4 py-2 rounded-lg font-bold transition-all cursor-pointer"
            >
              {editingId ? "تحديث التعديل والحفظ" : "تسجيل وترخيص الصلاحية"}
            </button>
          </div>
        </form>
      )}

      {/* Grid of Team Card Items (SELECT / READ) */}
      {loading && members.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-12 space-y-3">
          <RefreshCw className="w-8 h-8 text-[#c5a880] animate-spin" />
          <p className="text-xs text-slate-400">جاري تحميل كادر مكتب العدالة...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          {members.map(mb => (
            <div 
              key={mb.id} 
              className="bg-[#0b1e33] border border-[#c5a880]/15 rounded-xl p-5 space-y-4 text-right hover:border-[#c5a880]/45 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-[#c5a880] text-xs font-bold block bg-[#c5a880]/10 px-2.5 py-1 rounded-md inline-block">
                      {getRoleLabel(mb.role)}
                    </strong>
                    <h4 className="text-sm font-bold text-slate-100 mt-2.5 line-clamp-1">{mb.name}</h4>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {mb.status === "active" ? (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        نشط للعمل
                      </span>
                    ) : mb.status === "on_leave" ? (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-500/20">
                        <Clock className="w-3 h-3 text-amber-400" />
                        في إجازة
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-slate-500/20">
                        غير نشط
                      </span>
                    )}

                    {mb.join_date && (
                      <span className="text-[9px] text-slate-500 font-mono">
                        تاريخ الانضمام: {mb.join_date}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-2 pt-3 mt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#c5a880]/70" />
                    <span className="line-clamp-1">البريد: <span className="font-mono text-slate-300 text-[11px]">{mb.email || "غير مدرج"}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#c5a880]/70" />
                    <span>رقم الجوال: <span className="text-slate-300 text-[11px] font-mono">{mb.phone || "غير مدرج"}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>معدل نسبة العمولات:</span>
                    <span className="font-mono text-[13px] bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/15">% {mb.salary || 0}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: UPDATE & DELETE */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/60 mt-2">
                <button
                  type="button"
                  onClick={() => handleEdit(mb)}
                  className="p-1.5 text-slate-300 hover:text-[#c5a880] bg-[#11243f] hover:bg-[#c5a880]/10 rounded border border-slate-800/80 hover:border-[#c5a880]/20 transition-all cursor-pointer"
                  title="تعديل صلاحيات الموظف"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(mb.id, mb.name)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 bg-[#11243f] hover:bg-rose-500/10 rounded border border-slate-800/80 hover:border-rose-500/20 transition-all cursor-pointer"
                  title="إلغاء الترخيص والرمز"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {members.length === 0 && !loading && (
        <div className="bg-[#0b1e33] border border-dashed border-[#c5a880]/25 rounded-xl p-8 text-center text-slate-400">
          <Users2 className="w-8 h-8 mx-auto text-slate-500 mb-2" />
          <p className="text-xs">لا يوجد أعضاء بالفريق حالياً في قاعدة البيانات.</p>
        </div>
      )}
    </div>
  );
}