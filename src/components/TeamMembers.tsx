import React, { useState, useEffect } from "react";
import { Users2, Plus, ShieldCheck, Mail, Phone } from "lucide-react";

interface Member {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: string;
  attendanceToday: string;
  commissionRate: number;
}

interface TeamMembersProps {
  customRoles?: any;
}

export default function TeamMembers({ customRoles }: TeamMembersProps = {}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [role, setRole] = useState("lawyer");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [commissionRate, setCommissionRate] = useState("35");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/team/members");
      if (resp.ok) {
        const data = await resp.json();
        setMembers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;

    try {
      const resp = await fetch("/api/team/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          phone,
          email,
          commissionRate
        })
      });

      if (resp.ok) {
        setSuccessMsg("تم ترخيص وتقييد الموظف بنجاح للفريق!");
        setName("");
        setPhone("");
        setEmail("");
        setCommissionRate("35");
        fetchMembers();
        setTimeout(() => {
          setSuccessMsg("");
          setShowAddForm(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#c5a880] flex items-center gap-2">
            <Users2 className="w-5 h-5" />
            <span>تنظيم الهيكل الكادر للمكتب والتوزيع (Team Workspace)</span>
          </h2>
          <p className="text-xs text-slate-900  mt-1">تتبع الحضور التلقائي، عمولات العملاء والمحاميين والمستشاريين القانونيين المسجلين، وصلاحيات الترافع في ناجز.</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#c5a880] text-[#061224] text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>دعوة أو تقييد زميل جديد</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddMember} className="bg-[#0b1e33] border border-[#c5a880]/30 rounded-xl p-5 space-y-4 text-xs text-right">
          <h3 className="text-slate-200 font-bold border-b border-[#c5a880]/15 pb-2 text-sm">إدراج عضو أو مرافع للفريق</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
            <div className="space-y-1.5">
              <label className="block text-slate-900 ">الاسم الثلاثي أو الرباعي المعتمد:</label>
              <input
                type="text"
                required
                placeholder="أدخل اسم الزميل بكامل ضبطه"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">الدور والمنصب التنفيذي:</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              >
                <option value="owner">{customRoles?.admin || "شريك مؤسس / مديـر المكتب"}</option>
                <option value="lawyer">{customRoles?.lawyer || "مرافع مستشار / مترافع مرخص"}</option>
                <option value="researcher">{customRoles?.researcher || "باحث شرعي وقانوني"}</option>
                <option value="secretary">{customRoles?.secretary || "سكرتير / منسق عام ملفات"}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">معدل عمولة المحامي من الأتعاب القضائية %:</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                placeholder="%"
                value={commissionRate}
                onChange={e => setCommissionRate(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">رقم الجوال:</label>
              <input
                type="text"
                placeholder="+966 5xxxxxxxx"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 ">البريد الإلكتروني للزميل:</label>
              <input
                type="email"
                placeholder="name@aladalah-law.sa"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#11243f] border border-[#c5a880]/20 rounded p-2.5 text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#c5a880]/10">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-transparent border border-slate-700 text-slate-900  px-4 py-2 rounded font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-[#c5a880] text-[#061224] px-4 py-2 rounded font-bold"
            >
              تسجيل وترخيص الصلاحية
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-500 border border-emerald-500 text-emerald-400 p-2.5 rounded text-center font-bold">
              {successMsg}
            </div>
          )}
        </form>
      )}

      {/* Grid of Team Card Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
        {members.map(mb => (
          <div key={mb.id} className="bg-[#0b1e33] border border-[#c5a880]/15 rounded-xl p-5 space-y-4 text-right">
            
            <div className="flex justify-between items-start">
              <div>
                <strong className="text-[#c5a880] text-xs font-bold block bg-[#c5a880]/10 px-2 py-1 rounded inline-block">
                  {mb.role === "owner" ? (customRoles?.admin || "شريك مؤسس") : mb.role === "lawyer" ? (customRoles?.lawyer || "محامي مستشار") : mb.role === "researcher" ? (customRoles?.researcher || "باحث قانوني") : (customRoles?.secretary || "إداري")}
                </strong>
                <h4 className="text-sm font-bold text-slate-100 mt-2">{mb.name}</h4>
              </div>

              <span className="text-xs bg-emerald-500 text-emerald-400 px-2 py-0.5 rounded font-bold">
                نشط للعمل اليوم
              </span>
            </div>

            <div className="text-xs text-slate-900  space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-900 " />
                <span>البريد: <span className="font-mono text-slate-900">{mb.email || "-"}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-900 " />
                <span>رقم التواصل: <span className="text-slate-900">{mb.phone || "-"}</span></span>
              </div>
              <div className="flex items-center gap-2 text-amber-400">
                <span>المستحقات من قضايا الترافع:</span>
                <strong className="font-mono">% {mb.commissionRate || 0}</strong>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
