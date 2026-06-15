import React, { useState } from "react";
import { 
  Gavel, 
  MapPin, 
  Scale, 
  FileText, 
  Landmark, 
  Calculator, 
  Mail, 
  Handshake, 
  ShieldAlert, 
  CircleDot, 
  ChevronLeft,
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CourtCase } from "@/types";
import SaudiServicesHub from "@/components/SaudiServicesHub";

interface CourtMapAndServicesProps {
  cases: CourtCase[];
  theme?: "light" | "dark";
  language?: "ar" | "en";
  hideHub?: boolean;
}

export default function CourtMapAndServices({
  cases = [],
  theme = "dark",
  language = "ar",
  hideHub = false
}: CourtMapAndServicesProps) {
  const isEn = language === "en";
  const [activeCity, setActiveCity] = useState<string | null>(null);

  // Saudi Cities with courts and coordinates for accurate SVG map plotting
  const saudiCourts = [
    { city: "الرياض", name: "محكمة الرياض التجارية والعامة", x: 260, y: 160, casesCount: 0, casesList: [] as CourtCase[] },
    { city: "جدة", name: "المحكمة العامة والتجارية بجدة", x: 120, y: 220, casesCount: 0, casesList: [] as CourtCase[] },
    { city: "مكة المكرمة", name: "المحكمة الإدارية بمكة (ديوان المظالم)", x: 140, y: 240, casesCount: 0, casesList: [] as CourtCase[] },
    { city: "الدمام", name: "المحكمة العمالية والتجارية بالدمام", x: 340, y: 120, casesCount: 0, casesList: [] as CourtCase[] },
    { city: "المدينة المنورة", name: "المحكمة العامة بالمدينة المنورة", x: 160, y: 150, casesCount: 0, casesList: [] as CourtCase[] },
    { city: "أبها", name: "محكمة أبها العامة والجزائية", x: 180, y: 320, casesCount: 0, casesList: [] as CourtCase[] }
  ];

  // Distribute real cases into courts based on city keywords
  cases.forEach(c => {
    const courtText = c.courtName || "";
    let matched = false;
    saudiCourts.forEach(court => {
      if (courtText.includes(court.city)) {
        court.casesCount += 1;
        court.casesList.push(c);
        matched = true;
      }
    });

    // Default to Riyadh if no match to make it interactive and populated
    if (!matched && saudiCourts[0]) {
      saudiCourts[0].casesCount += 1;
      saudiCourts[0].casesList.push(c);
    }
  });

  const t = {
    title: isEn ? "Court Distribution Map" : "الخارطة التفاعلية لتوزيع المحاكم والدوائر القانونية",
    sub: isEn 
      ? "Interactive GIS visual plotter mapping active cases to corporate Saudi judicial circuits & courts."
      : "محاكاة جغرافية بصرية لتوزيع ملفات القضايا والدفوع الحالية بمقار المحاكم والدوائر القضائية بالمملكة العربية السعودية.",
    rightHeader: isEn ? "Saudi Judicial Portal Services" : "بوابة الخدمات العدلية المساندة (ناجز)",
    rightSub: isEn 
      ? "Direct access to official judicial and additional legal tools."
      : "الوصول السريع لصحائف الدعاوى، تحديث الصكوك، وحاسبة المواريث الشرعية.",
    hoverHint: isEn 
      ? "Click any court pin to review linked lawsuits."
      : "اضغط على أي مؤشر جيو-قضائي على الخارطة لعرض القضايا التابعة لتلك الدائرة.",
    selectedTitle: isEn ? "Active Cases in Court" : "القضايا المربوطة بهذه الدائرة القضائية",
    noCases: isEn ? "No active lawsuits inside this jurisdiction." : "لا يوجد دعاوى تجارية أو عمالية مفتوحة في هذه الدائرة حالياً.",
    courtCasesCount: isEn ? "linked cases" : "قضايا نشطة",
  };

  const selectedCourtDetails = saudiCourts.find(c => c.city === activeCity);

  return (
    <div className={`${hideHub ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 xl:grid-cols-3 gap-6"} ${theme === "light" ? "text-slate-900 " : "text-slate-100"} `}>
      
      {/* LEFT: SVG Map Plotter Container */}
      <div className={`${hideHub ? "w-full space-y-4" : "xl:col-span-2 space-y-4"}`}>
        <div className={`border rounded-2xl p-5 shadow-sm space-y-4 relative ${
          theme === "light" 
            ? "bg-white border-slate-300 text-slate-900" 
            : "bg-gradient-to-br from-[#9A7D2C]/90 via-[#0C1425] to-[#0284C7]/85 border-2 border-[#9A7D2C] text-white shadow-2xl dark"
        }`}>
          <div>
            <span className="text-xs bg-amber-600 text-white px-2.5 py-0.5 rounded-full font-black uppercase">بصرية GIS</span>
            <h3 className={`text-sm font-black flex items-center gap-1.5 mt-1 ${theme === "light" ? "text-slate-900" : "text-white"}`}>
              <MapPin className="text-yellow-300 w-4 h-4 animate-bounce" />
              <span>{t.title}</span>
            </h3>
            <p className={`text-xs mt-0.5 ${theme === "light" ? "text-slate-200 font-bold" : "text-yellow-100 font-bold"}`}>{t.sub}</p>
          </div>

          <div className={`text-center py-1.5 text-xs font-sans font-bold border rounded-lg ${
            theme === "light" 
              ? "bg-slate-50 border-slate-300 text-slate-900" 
              : "text-yellow-300 bg-slate-950/60 border-yellow-400/30"
          }`}>
            🔊 {t.hoverHint}
          </div>

          {/* SVG Map Graphics Grid Layout */}
          <div className="relative bg-[#020A14]/70 border border-white/10 rounded-xl overflow-hidden flex justify-center items-center py-6 min-h-[360px]">
            {/* Outline of Saudi Arabia inside responsive SVG container */}
            <svg 
              viewBox="0 0 500 400" 
              className="w-full max-w-[480px] h-auto pointer-events-auto"
              style={{ filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.4))" }}
            >
              {/* Simplified premium vector representation of Saudi Arabia boundaries block */}
              <path 
                d="M 120,105 L 170,95 Q 210,80 250,90 Q 280,100 320,80 L 370,110 L 390,135 Q 430,130 420,165 L 380,240 L 310,340 L 260,370 L 230,380 L 210,340 I L 180,310 L 150,290 L 130,285 L 122,230 L 110,180 Z" 
                fill="#152f52" 
                stroke="#c5a880" 
                strokeWidth="1.5" 
                strokeOpacity="0.4"
                className="transition-all[#1a3861]" 
              />
              
              {/* Regional Grid Latitudes decoration lines to bypass empty look */}
              <line x1="50" y1="100" x2="450" y2="100" stroke="#c5a880" strokeWidth="0.5" strokeOpacity="0.08" strokeDasharray="3 3" />
              <line x1="50" y1="200" x2="450" y2="200" stroke="#c5a880" strokeWidth="0.5" strokeOpacity="0.08" strokeDasharray="3 3" />
              <line x1="50" y1="300" x2="450" y2="300" stroke="#c5a880" strokeWidth="0.5" strokeOpacity="0.08" strokeDasharray="3 3" />
              
              <line x1="150" y1="50" x2="150" y2="350" stroke="#c5a880" strokeWidth="0.5" strokeOpacity="0.08" strokeDasharray="3 3" />
              <line x1="300" y1="50" x2="300" y2="350" stroke="#c5a880" strokeWidth="0.5" strokeOpacity="0.08" strokeDasharray="3 3" />

              {/* Render Judicial Pins */}
              {saudiCourts.map((court) => {
                const isSelected = activeCity === court.city;
                return (
                  <g 
                    key={court.city} 
                    className="cursor-pointer group"
                    onClick={() => setActiveCity(isSelected ? null : court.city)}
                  >
                    {/* Ring glow */}
                    <circle 
                      cx={court.x} 
                      cy={court.y} 
                      r={isSelected ? 14 : 7} 
                      className={`transition-all duration-300 ${isSelected ? "fill-[#c5a880]/30 stroke-[#c5a880]" : "fill-[#c5a880]/10 stroke-[#c5a880]/40"}`}
                      strokeWidth="1.5"
                    />
                    
                    {/* Inner core pin point */}
                    <circle 
                      cx={court.x} 
                      cy={court.y} 
                      r="4" 
                      className={`transition-all duration-300 ${isSelected ? "fill-amber-400" : "fill-[#c5a880]"}`} 
                    />

                    {/* Badge counts indicator if cases exists */}
                    {court.casesCount > 0 && (
                      <g>
                        <rect 
                          x={court.x + 8} 
                          y={court.y - 18} 
                          width="14" 
                          height="12" 
                          rx="3" 
                          fill="#d97706" 
                        />
                        <text 
                          x={court.x + 15} 
                          y={court.y - 10} 
                          fontSize="7" 
                          fill="#ffffff" 
                          fontWeight="bold" 
                          textAnchor="middle"
                        >
                          {court.casesCount}
                        </text>
                      </g>
                    )}

                    {/* City text labeller */}
                    <text 
                      x={court.x} 
                      y={court.y + 18} 
                      fontSize="9" 
                      fontFamily="sans-serif"
                      fill={isSelected ? "#f59e0b" : "#cbd5e1"} 
                      fontWeight={isSelected ? "bold" : "normal"}
                      textAnchor="middle"
                      className="transition-colors select-none"
                    >
                      {court.city}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active city sub panel detailing related cases */}
          <AnimatePresence mode="wait">
            {activeCity && selectedCourtDetails && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`border rounded-xl p-4 space-y-3 ${
                  theme === "light" 
                    ? "bg-slate-50 border-slate-300 text-slate-900 shadow-sm" 
                    : "bg-[#1E3A8A]/95 border-2 border-yellow-400 text-white"
                }`}
              >
                <div className={`flex justify-between items-center border-b pb-2 ${
                  theme === "light" ? "border-slate-300" : "border-white/20"
                }`}>
                  <span className={`text-xs font-black flex items-center gap-1 ${
                    theme === "light" ? "text-amber-800" : "text-yellow-300 animate-pulse"
                  }`}>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedCourtDetails.name}</span>
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-black ${
                    theme === "light" ? "bg-amber-100 text-amber-950" : "bg-yellow-500 text-slate-950"
                  }`}>
                    {selectedCourtDetails.casesCount} {t.courtCasesCount}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedCourtDetails.casesList.length === 0 ? (
                    <div className={`text-center py-2 font-bold text-xs ${
                      theme === "light" ? "text-slate-800" : "text-yellow-300"
                    }`}>
                      {t.noCases}
                    </div>
                  ) : (
                    selectedCourtDetails.casesList.map((c, idx) => (
                      <div 
                        key={idx} 
                        className={`p-2.5 rounded-lg flex justify-between items-center text-xs border ${
                          theme === "light" 
                            ? "bg-white border-slate-300 text-slate-950 shadow-sm" 
                            : "bg-slate-950/60 border-white/10 text-white"
                        }`}
                      >
                        <div>
                          <strong className={`block font-black ${
                            theme === "light" ? "text-slate-950" : "text-yellow-300"
                          }`}>رقم الدعوى: {c.caseNumber}</strong>
                          <span className={`text-xs font-bold block mt-0.5 ${
                            theme === "light" ? "text-slate-800" : "text-yellow-100"
                          }`}>العميل: {c.clientName}</span>
                        </div>
                        <div className="text-left">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold block ${
                            c.caseStatus === "under_review" 
                              ? "bg-amber-500/20 text-yellow-300 border border-yellow-400/30" 
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                          }`}>
                            {c.caseStatus === "under_review" ? "قيد النظر" : "منتهية/نشطة"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT: Saudi Portal Services arranged separately */}
      {!hideHub && (
        <div className="space-y-4 text-right">
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 relative ${
            theme === "light" 
              ? "bg-white border-slate-300 text-slate-900" 
              : "bg-gradient-to-br from-[#9A7D2C]/90 via-[#0C121E] to-[#1E3A8A]/90 border-2 border-[#9A7D2C] text-white shadow-2xl dark"
          }`}>
            <div>
              <span className="text-xs bg-amber-600 text-white px-2.5 py-0.5 rounded-full font-black uppercase">بوابة الخدمات</span>
              <h3 className={`text-sm font-black flex items-center gap-1.5 mt-1.5 ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                <Gavel className="w-4 h-4 text-yellow-300 animate-pulse" />
                <span>{t.rightHeader}</span>
              </h3>
              <p className={`text-xs mt-0.5 ${theme === "light" ? "text-slate-100" : "text-yellow-100 font-bold"}`}>{t.rightSub}</p>
            </div>

            {/* Render embedded SaudiServicesHub list */}
            <div className="max-h-[480px] overflow-y-auto pr-1">
              <SaudiServicesHub theme={theme} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
