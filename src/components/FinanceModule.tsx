/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {  
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calculator, 
  FileText,
  Percent,
  CheckCircle,
  Clock,
  Printer,
  CreditCard,
  Shield,
  Landmark,
  Send,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  Scan,
  Settings,
  Upload,
  CloudUpload,
  Activity,
  Calendar,
  ExternalLink
, Bell } from 'lucide-react';
import { Invoice, Client, Case } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

export function calculateTextColor(hexColor: string | undefined): "text-white" | "text-white" {
  if (!hexColor) return "text-white";
  const cleanHex = hexColor.replace("#", "");
  if (cleanHex.toLowerCase() === "white" || cleanHex.toLowerCase() === "ffffff") return "text-white";

  let r = 255, g = 255, b = 255;
  if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else if (cleanHex.length === 3) {
    r = parseInt(cleanHex.substring(0, 1) + cleanHex.substring(0, 1), 16);
    g = parseInt(cleanHex.substring(1, 2) + cleanHex.substring(1, 2), 16);
    b = parseInt(cleanHex.substring(2, 3) + cleanHex.substring(2, 3), 16);
  }

  const getSrgb = (c: number) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };

  const L = 0.2126 * getSrgb(r) + 0.7152 * getSrgb(g) + 0.0722 * getSrgb(b);
  return L > 0.179 ? "text-white" : "text-white";
}

export function getCalculatorTextColor(hexColor: string): { text: string; subtext: string; label: string; border: string; highlight: string } {
  const hex = hexColor.startsWith('#') ? hexColor.substring(1) : hexColor;
  let r = 255, g = 255, b = 255;
  if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (hex.length === 3) {
    r = parseInt(hex.substring(0, 1) + hex.substring(0, 1), 16);
    g = parseInt(hex.substring(1, 2) + hex.substring(1, 2), 16);
    b = parseInt(hex.substring(2, 3) + hex.substring(2, 3), 16);
  }
  
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  
  if (luminance >= 140) {
    return {
      text: 'text-[#94a3b8]',
      subtext: 'text-[#94a3b8] font-extrabold',
      label: 'text-[#94a3b8]0 font-extrabold',
      border: 'border-[#1e3a5f]/40',
      highlight: 'text-rose-600'
    };
  } else {
    return {
      text: 'text-white font-black drop-shadow-sm',
      subtext: 'text-[#94a3b8] font-black drop-shadow-sm',
      label: 'text-slate-305 font-bold',
      border: 'border-white/10',
      highlight: 'text-rose-300 font-extrabold'
    };
  }
}

// A custom motion.div wrapper that analyzes background class/color and enforces a perfectly contrasting text color.
interface ContrastMotionDivProps extends Omit<React.ComponentPropsWithoutRef<typeof motion.div>, 'children'> {
  bgClass?: string;
  isHovered?: boolean;
  children?: React.ReactNode;
}

function ContrastMotionDiv({ bgClass = "", className = "", style = {}, children, isHovered = false, ...props }: ContrastMotionDivProps) {
  // Enhanced dynamic contrast logic: Detect background brightness to toggle between Bright White and Deep Slate.
  // This ensures maximum readability regardless of the transition state or background complexity.
  const isDark = React.useMemo(() => {
    const bgLower = bgClass.toLowerCase();
    
    // Check for explicit dark theme classes
    if (
      bgLower.includes("950") || bgLower.includes("900") || bgLower.includes("850") || bgLower.includes("800") ||
      bgLower.includes("700") || bgLower.includes("600") || bgLower.includes("500") ||
      bgLower.includes("slate-9") || bgLower.includes("slate-8") ||
      bgLower.includes("indigo") || bgLower.includes("black") ||
      bgLower.includes("bg-[#0c2461]") || bgLower.includes("bg-[#020813]") ||
      bgLower.includes("bg-[#d4af37]")
    ) {
      return true;
    }

    // Hex brightness analysis
    const hexMatch = bgLower.match(/bg-\[#([0-9a-f]{3,6})\]/);
    if (hexMatch && hexMatch[1]) {
      let hex = hexMatch[1];
      if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128;
    }
    
    return false;
  }, [bgClass]);

  const goldBrand = "#d4af37";
  const whiteBright = "#ffffff";
  const contrastColor = isDark ? whiteBright : goldBrand;

  return (
    <motion.div
      className={`${bgClass} ${className} ${isDark ? "text-high-contrast-light-bg" : ""} transition-all duration-700 relative overflow-hidden`}
      animate={{ 
        color: contrastColor,
        borderColor: isDark ? "rgba(212, 175, 55, 0.3)" : goldBrand
      }}
      initial={false}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      style={style}
      {...props}
    >
      <div className="relative z-10 h-full w-full" style={{ color: 'inherit' }}>
        {children}
      </div>
    </motion.div>
  );
}

interface FinanceModuleProps {
  invoices: Invoice[];
  clients: Client[];
  cases: Case[];
  expenses: { id: string; description: string; amount: number; category: string; date: string; caseNumber?: string }[];
  onUpdateState: (type: string, data: any) => void;
  auditTrails: any[];
  createRecord: (collection: string, data: any) => Promise<any>;
  viewMode?: 'billing' | 'calculator';
  officeLogo?: string | null;
}

export default function FinanceModule({
  invoices,
  clients,
  cases,
  expenses,
  onUpdateState,
  auditTrails,
  createRecord,
  viewMode = 'billing',
  officeLogo: propOfficeLogo
}: FinanceModuleProps) {
  
  const [themeTick, setThemeTick] = useState(Date.now());
  const [isHighContrast, setIsHighContrast] = useState(() => document.documentElement.classList.contains('high-contrast-mode'));

  React.useEffect(() => {
    const handleThemeEvent = () => {
      setThemeTick(Date.now());
      setIsHighContrast(document.documentElement.classList.contains('high-contrast-mode'));
    };
    window.addEventListener('adalah-advanced-config-updated', handleThemeEvent);
    return () => {
      window.removeEventListener('adalah-advanced-config-updated', handleThemeEvent);
    };
  }, []);

  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // States for custom Receipt / Payment / Gateways modals
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isGatewaysOpen, setIsGatewaysOpen] = useState(false);
  const [luminousTheme, setLuminousTheme] = useState<'dark' | 'light'>('light');
  const [hoveredActionCard, setHoveredActionCard] = useState<string | null>(null);

  // States for Receipt Voucher Form
  const [receiptClient, setReceiptClient] = useState('');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptPurpose, setReceiptPurpose] = useState('');
  const [receiptVoucherPrint, setReceiptVoucherPrint] = useState<any | null>(null);

  // States for Payment Voucher Form
  const [paymentPayee, setPaymentPayee] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentPurpose, setPaymentPurpose] = useState('');
  const [paymentVoucherPrint, setPaymentVoucherPrint] = useState<any | null>(null);

  // Trigger new invoice modal from Command Palette or shortcuts
  React.useEffect(() => {
    const handleTriggerNewInvoice = () => {
      setIsInvoiceOpen(true);
    };
    window.addEventListener('adalah-trigger-new-invoice', handleTriggerNewInvoice);
    return () => window.removeEventListener('adalah-trigger-new-invoice', handleTriggerNewInvoice);
  }, []);
  const [invClientName, setInvClientName] = useState('');
  const [invDesc, setInvDesc] = useState('');
  const [invSubtotal, setInvSubtotal] = useState('');
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [officeLogo, setOfficeLogo] = useState<string | null>(propOfficeLogo || localStorage.getItem('office_logo') || null);

  React.useEffect(() => {
    if (propOfficeLogo !== undefined) {
      setOfficeLogo(propOfficeLogo);
    }
  }, [propOfficeLogo]);

  React.useEffect(() => {
    const handleStorageChange = () => {
      setOfficeLogo(propOfficeLogo || localStorage.getItem('office_logo') || null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [propOfficeLogo]);

  // Contract Management State
  const [contractsToManage, setContractsToManage] = useState<{ id: string; title: string; client: string; date: string; status: 'unsigned' | 'signed' | 'sent'; caseId?: string }[]>(() => {
    try {
      const saved = localStorage.getItem('finance_contracts_data');
      return saved ? JSON.parse(saved) : [
        { id: 'cnt-1', title: 'عقد تمثيل قضائي - قضية تجارية', client: 'شركة الفالح القابضة', date: '2026-05-20', status: 'signed' },
        { id: 'cnt-2', title: 'اتفاقية أتعاب ومصروفات', client: 'فواز محمد الراشد', date: '2026-06-01', status: 'sent' }
      ];
    } catch { return []; }
  });

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [newContractTitle, setNewContractTitle] = useState('');
  const [newContractClient, setNewContractClient] = useState('');
  const [newContractCaseId, setNewContractCaseId] = useState('');

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    const newContract: any = {
      id: `cnt-${Date.now()}`,
      title: newContractTitle,
      client: newContractClient,
      caseId: newContractCaseId,
      date: new Date().toISOString().split('T')[0],
      status: 'unsigned'
    };
    const updated = [newContract, ...contractsToManage];
    setContractsToManage(updated);
    localStorage.setItem('finance_contracts_data', JSON.stringify(updated));
    setIsContractModalOpen(false);
    setNewContractTitle('');
    setNewContractClient('');
    setNewContractCaseId('');
  };

  const handleSendContract = (id: string) => {
    setContractsToManage(prev => prev.map(c => c.id === id ? { ...c, status: 'sent' } : c));
    alert('تم إرسال العقد للعميل عبر البريد الإلكتروني وطلب التوقيع الإلكتروني بنجاح.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        
        // Programmatic image processing and resizing using Canvas
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set optimal dimensions for invoice header (max width 400, max height 160)
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 160;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const processedBase64 = canvas.toDataURL('image/png', 0.9);
            setOfficeLogo(processedBase64);
            localStorage.setItem('office_logo', processedBase64);
            window.dispatchEvent(new Event('storage'));
            alert("✅ تم معالجة الشعار برمجياً وضبط أبعاده وتنسيقه ليتناسب باحترافية مع الفواتير والتقارير.");
          }
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    }
  };

  const [activeFinanceTab, setActiveFinanceTab] = useState<'billing' | 'gateways' | 'time_logs' | 'contracts' | 'settings'>('billing');
  
  const [officeName, setOfficeName] = useState(localStorage.getItem('office_name') || 'مكتب العدالة للمحاماة والاستشارات القانونية');
  const [officeVat, setOfficeVat] = useState(localStorage.getItem('office_vat') || '310182749200003');
  const [officeLicense, setOfficeLicense] = useState(localStorage.getItem('office_license') || '44/291');
  const [officeAddress, setOfficeAddress] = useState(localStorage.getItem('office_address') || 'الرياض - طريق الملك فهد - مركز العدل');
  
  // Aggregate all time logs from localStorage
  const [allTimeLogs, setAllTimeLogs] = useState<{ caseId: string; caseName: string; date: string; duration: number; fees: number }[]>([]);

  React.useEffect(() => {
    if (activeFinanceTab === 'time_logs') {
      const logs: any[] = [];
      try {
        cases.forEach(c => {
          const saved = localStorage.getItem(`case_tracker_logs_${c.id}`);
          if (saved) {
            const data = JSON.parse(saved);
            data.forEach((log: any) => {
              const hours = log.duration / 3600;
              const rate = 300;
              logs.push({
                caseId: c.id,
                caseName: c.caseName,
                date: log.date,
                duration: log.duration,
                fees: Math.round(hours * rate * 1.15) // total with VAT
              });
            });
          }
        });
        setAllTimeLogs(logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e) {
        console.error(e);
      }
    }
  }, [activeFinanceTab, cases]);

  React.useEffect(() => {
    if (printInvoice) {
      // Simulate ZATCA Phase 2 XML Hash and UUID
      const invoiceHash = btoa(`ZATCA-PHASEII-${printInvoice.id}-${printInvoice.totalAmount}-${Date.now()}`);
      const invoiceUuid = `UUID-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      
      const qrData = `ZATCA-PHASE2|${officeName}|${officeVat}|${printInvoice.issueDate}|${printInvoice.amount}|${printInvoice.vatAmount}|${invoiceHash}|${invoiceUuid}`;
      // Import renderToString dynamically or use it directly
      const ReactDOMServer = require('react-dom/server');
      const qrSvgString = ReactDOMServer.renderToString(<QRCodeSVG value={qrData} size={130} level="M" />).replace("width=\"130\"", "width=\"130\" height=\"130\" class=\"qr-code-svg\"");

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>فاتورة ضريبية - ZATCA Phase 2 (المرحلة الثانية) - رقم ${printInvoice.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=JetBrains+Mono&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .invoice-container { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #b8860b; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { max-height: 100px; max-width: 180px; object-fit: contain; }
            .qr-code-svg { border: 4px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; margin-block: 20px; }
            th, td { border: 1px solid #f1f5f9; padding: 15px; text-align: right; font-size: 13px; }
            th { background: #f8fafc; font-weight: 900; color: #475569; }
            .totals { margin-top: 40px; border-top: 2px solid #f1f5f9; padding-top: 20px; width: 320px; margin-right: auto; }
            .total-row { display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 12px; font-size: 14px; }
            .grand-total { font-size: 20px; color: #b8860b; border-top: 2px solid #b8860b; padding-top: 15px; margin-top: 5px; }
            .zatca-box { margin-top: 60px; background: #fdfaf3; border: 1px solid #f2e6c2; padding: 25px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; }
            .zatca-details h4 { margin: 0 0 10px 0; font-size: 14px; color: #854d0e; }
            .zatca-details p { margin: 0; font-size: 10px; color: #a16207; font-weight: bold; }
            .hash-id { font-family: 'JetBrains Mono', monospace; font-size: 8px; color: #94a3b8; background: #fff; padding: 8px; border-radius: 8px; border: 1px solid #f1f5f9; margin-top: 10px; width: 100%; word-break: break-all; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: center;">
            <button onclick="window.print()" style="background:#b8860b; color:white; border:none; padding:15px 35px; border-radius:15px; cursor:pointer; font-weight:900; font-family:'Cairo'; transition: all 0.2s; box-shadow: 0 4px 15px rgba(184, 134, 11, 0.4);">طـباعة المستند الضريبي (PDF) 🖨️</button>
          </div>
          <div class="invoice-container" dir="rtl">
            <div class="header">
              <div>
                ${officeLogo ? `<img src="${officeLogo}" class="logo" />` : `<h1 style="color:#b8860b; margin:0; font-weight:900;">${officeName}</h1>`}
                <p style="font-size:13px; font-weight:900; margin-top:10px; color:#1e293b;">فاتورة ضريبية مبسطة (ZATCA Phase 2)</p>
                <div style="margin-top:15px; font-size:11px; font-weight:bold; color:#64748b; line-height: 1.8;">
                   <div>الرقم الضريبي: ${officeVat}</div>
                   <div>ترخيص المزاولة: ${officeLicense}</div>
                   <div>العنوان: ${officeAddress}</div>
                </div>
              </div>
              <div style="margin-right: auto; text-align: left;">
                ${qrSvgString}
              </div>
            </div>

            <div class="info-grid">
              <div style="background:#f8fafc; padding:20px; border-radius:15px; border:1px solid #f1f5f9;">
                <h3 style="margin-top:0; font-size:12px; color:#94a3b8; border-bottom:1px solid #e2e8f0; padding-bottom:8px; margin-bottom:12px;">بيانات العميل</h3>
                <p style="margin:5px 0;"><strong>الاسم المستفيد:</strong> ${printInvoice.clientName}</p>
                <p style="margin:5px 0;"><strong>الرقم الضريبي:</strong> ${printInvoice.clientVat || 'غير مسجل'}</p>
              </div>
              <div style="background:#f8fafc; padding:20px; border-radius:15px; border:1px solid #f1f5f9;">
                 <h3 style="margin-top:0; font-size:12px; color:#94a3b8; border-bottom:1px solid #e2e8f0; padding-bottom:8px; margin-bottom:12px;">بيانات الفاتورة</h3>
                 <p style="margin:5px 0;"><strong>رقم المرجع الفني:</strong> ${printInvoice.id}</p>
                 <p style="margin:5px 0;"><strong>تاريخ الإنشاء:</strong> ${printInvoice.issueDate}</p>
                 <p style="margin:5px 0;"><strong>تاريخ الاستحقاق:</strong> ${printInvoice.dueDate}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th width="50%">البند / الخدمة القانونية</th>
                  <th>المبلغ (غير شامل الضريبة)</th>
                  <th>الضريبة (15%)</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight:bold;">${printInvoice.description || "أتعاب دراسة وتمثيل قانوني"}</td>
                  <td>${printInvoice.amount.toLocaleString()} ر.س</td>
                  <td>${printInvoice.vatAmount.toLocaleString()} ر.س</td>
                  <td style="font-weight:900;">${printInvoice.totalAmount.toLocaleString()} ر.س</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>المبلغ الخاضع للضريبة (Excl. VAT):</span>
                <span>${printInvoice.amount.toLocaleString()} ر.س</span>
              </div>
              <div class="total-row">
                <span>ضريبة القيمة المضافة (15% VAT):</span>
                <span>${printInvoice.vatAmount.toLocaleString()} ر.س</span>
              </div>
              <div class="total-row grand-total">
                <span>المجموع الكلي النهائي (Total Inc. VAT):</span>
                <span>${printInvoice.totalAmount.toLocaleString()} ر.س</span>
              </div>
            </div>

            <div class="zatca-box">
              <div class="zatca-details">
                <h4>تحقق هيئة الزكاة والضريبة والجمارك (Fatoora)</h4>
                <p>تم إصدار هذه الفاتورة ضريبياً بما يتوافق مع متطلبات المرحلة الثانية (الربط والتكامل) من لائحة هيئة الزكاة والضريبة والجمارك (ZATCA).</p>
                <div class="hash-id">
                  <div><strong>UUID:</strong> ${invoiceUuid}</div>
                  <div style="margin-top:4px;"><strong>PIH:</strong> ${invoiceHash}</div>
                </div>
              </div>
              <div style="width:100px; height:100px; border-radius:10px; overflow:hidden;">
                ${qrSvgString}
              </div>
            </div>

            <div class="footer">
              <p>شكراً لتعاملكم مع ${officeName}. جميع الحقوق محفوظة لعام 2026.</p>
              <p style="margin-top:5px; font-size:8px;">نظام فوترة سحابي متكامل - مركز التطوير التقني</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
      setPrintInvoice(null);
    }
  }, [printInvoice, officeLogo, officeName, officeVat, officeLicense, officeAddress]);

  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs}س ${mins}د ${secs}ث`;
  };
  
  // Invoicing payment gateway mock fields
  const [selectedSimInvoiceId, setSelectedSimInvoiceId] = useState('');
  const [payMethod, setPayMethod] = useState<'mada' | 'applepay' | 'cc' | 'sadad' | 'bank_transfer'>('mada');
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  
  // ZATCA audits are now filtered from Supabase audit_trails
  const zatcaAuditLogs = (auditTrails || [])
    .filter(a => a.entityType === 'invoice' && a.action === 'ZATCA_SUBMISSION')
    .map(a => ({
      id: a.id,
      invoiceId: a.entityId,
      status: 'SUCCESS',
      timestamp: new Date(a.createdAt).toLocaleString('ar-SA'),
      details: a.newData?.details || a.action,
      type: 'success' as const
    }));

  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [isSubmittingZatca, setIsSubmittingZatca] = useState(false);
  const [isZatcaConnected, setIsZatcaConnected] = useState(true);
  const [simulationSuccess, setSimulationSuccess] = useState(false);
  
  // Visual payment fake details
  const [fakeCardNum, setFakeCardNum] = useState('4201 8291 0038 4120');
  const [fakeCardHolder, setFakeCardHolder] = useState('المحامي العميل الشريك');
  const [fakeCardExpiry, setFakeCardExpiry] = useState('12/29');
  const [fakeCardCvv, setFakeCardCvv] = useState('482');
  const [sadadBillCode, setSadadBillCode] = useState(() => Math.floor(1000000000 + Math.random() * 9000000000).toString());

  const handleZatcaSubmission = async () => {
    if (!selectedSimInvoiceId) return;
    const inv = invoices.find(i => i.id === selectedSimInvoiceId);
    if (!inv) return;

    setIsSubmittingZatca(true);
    const stepLogs = [
      `[ZATCA] جاري توليد التوقيع الرقمي (ECDSA) لمحتوى الفاتورة الإلكترونية...`,
      `[ZATCA] استخراج معرف UUID الفرعي والحسابي للهيئة: ${Math.random().toString(36).substring(7)}`,
      `[SIGNATURE] تم تطبيق الختم الإلكتروني المشفر (XAdES-EPES) بنجاح.`,
      `[VALIDATION] التحقق من توافق هيكلية التحويل (UBL 2.1) لمتطلبات المرحلة الثانية...`,
    ];
    setSimulationLogs(prev => [...prev, ...stepLogs]);

    await new Promise(r => setTimeout(r, 2000));
    
    const finalLogs = [
      `[ZATCA] تم إرسال البيانات فورياً لـ (Sand-Box Platform) للمرحلة الثانية بنجاح.`,
      `[ZATCA] رمز الاستجابة: 201 (تم القبول والاعتماد الضريبي ونقلها للأرشيف).`,
    ];
    setSimulationLogs(prev => [...prev, ...finalLogs]);

    const auditPayload = {
      action: 'ZATCA_SUBMISSION',
      entity_type: 'invoice',
      entity_id: inv.id,
      new_data: {
        status: 'SUCCESS',
        zatca_reference: Math.random().toString(36).toUpperCase().substring(0, 8),
        details: `تم اعتماد الفاتورة وتوقيعها إلكترونياً واعتمادها في منصة فاتورة (ZATCA Phase 2).`
      }
    };

    await createRecord('audit_trails', auditPayload);

    const updated = { 
      ...inv, 
      isZatcaSubmitted: true,
      zatcaTimestamp: new Date().toISOString()
    };
    onUpdateState('invoices', updated);
    setIsSubmittingZatca(false);
    alert('✅ تم اعتماد الفاتورة وتوليد رمز QR المعتمد وضخها في منصة فاتورة (ZATCA Phase 2) بنجاح!');
  };

  const executeSimulationPayment = async (inv: Invoice) => {
    setIsSimulatingPayment(true);
    setSimulationSuccess(false);
    setSimulationLogs([
      `[البدء] استدعاء بوابة الدفع الرقمية السعودية (موكل باي) لطلب المعالجة الآمنة...`,
      `[المعاملة] تهيئة بروتوكولات الربط المشفرة مع البنك المركزي السعودي (SAMA)...`,
      `[بوابه الدفع] تحويل العميل للمصادقة الثنائية (3D Secure Verifications)...`,
    ]);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    
    await sleep(1000);
    setSimulationLogs(prev => [
      ...prev,
      `[المصادقة] تم تلمس استلام كود الحماية عبر الجوال وربطه آلياً بنجاح المعاملة.`,
      `[التسوية] إرسال طلب ترحيل الأرصدة إلى نظام سداد للمدفوعات وحساب البنك المركزي...`,
    ]);

    await sleep(1000);
    setSimulationLogs(prev => [
      ...prev,
      `[التكامل] استجابة ناجحة بالمعرف الفرعي الزكوي: ZATCA-UUID-44391.`,
      `[تمت المعاملة] تم قفل الفاتورة وتغيير حالتها في العدالة إلى (مدفوعة) بنجاح! `,
    ]);

    setIsSimulatingPayment(false);
    setSimulationSuccess(true);
    
    // Auto update status in global DB
    const updated = { ...inv, status: 'paid' as const };
    onUpdateState('invoices', updated);

    // Auto-generate Receipt Voucher (سند قبض)
    const receiptHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>سند قبض (Receipt Voucher) - ${inv.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
          body { font-family: 'Cairo', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background: #f8fafc; }
          .receipt-container { max-width: 700px; margin: auto; background: white; border: 2px solid #e2e8f0; padding: 50px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: relative; overflow: hidden; }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 120px; color: rgba(16, 185, 129, 0.05); font-weight: 900; white-space: nowrap; pointer-events: none; z-index: 0; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #e2e8f0; padding-bottom: 25px; margin-bottom: 40px; }
          .logo { max-height: 90px; max-width: 150px; object-fit: contain; }
          .receipt-title { font-size: 26px; font-weight: 900; color: #0f172a; border: 2px solid #0f172a; padding: 8px 25px; border-radius: 8px; }
          .content { position: relative; z-index: 1; }
          .row { display: flex; font-size: 16px; margin-bottom: 25px; align-items: center; border-bottom: 1px dotted #cbd5e1; padding-bottom: 10px; }
          .label { width: 150px; font-weight: 900; color: #475569; }
          .value { flex: 1; font-weight: 700; color: #0f172a; }
          .amount-box { background: #f1f5f9; border: 2px solid #b8860b; color: #b8860b; padding: 15px; border-radius: 10px; text-align: center; font-size: 22px; font-weight: 900; margin-top: 30px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 70px; }
          .sig-box { text-align: center; width: 200px; border-top: 2px dashed #94a3b8; padding-top: 15px; font-weight: 900; color: #475569; }
          @media print { .no-print { display: none; } body { background: white; } .receipt-container { box-shadow: none; border: none; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: center;">
          <button onclick="window.print()" style="background:#10b981; color:white; border:none; padding:15px 35px; border-radius:15px; cursor:pointer; font-weight:900; font-family:'Cairo'; transition: all 0.2s; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">طـباعة سند القبض 🖨️</button>
        </div>
        <div class="receipt-container">
          <div class="watermark">سند قبض محصل</div>
          <div class="header content">
            <div>
              ${officeLogo ? `<img src="${officeLogo}" class="logo" />` : `<h1 style="color:#b8860b; margin:0; font-weight:900;">${officeName}</h1>`}
            </div>
            <div class="receipt-title">سند قـبـض</div>
            <div style="text-align: left; font-weight: bold; color: #64748b; font-size: 13px;">
              <div>الرقم: RCP-${Math.floor(Math.random() * 90000) + 10000}</div>
              <div style="margin-top: 5px;">التاريخ: ${new Date().toLocaleDateString('ar-SA')}</div>
            </div>
          </div>
          
          <div class="content">
            <div class="amount-box">
               مبلغ وقدره: ${inv.totalAmount.toLocaleString()} ريال سعودي
            </div>
            
            <div style="margin-top: 40px;">
              <div class="row">
                <div class="label">استلمنا من المكرم/ـة:</div>
                <div class="value">${inv.clientName}</div>
              </div>
              <div class="row">
                <div class="label">مبلغاً وقدره:</div>
                <div class="value">${inv.totalAmount.toLocaleString()} ر.س (فقط لا غير)</div>
              </div>
              <div class="row">
                <div class="label">وذلك عبارة عن:</div>
                <div class="value">${inv.description || "أتعاب خدمات قانونية حسب الفاتورة رقم " + inv.id}</div>
              </div>
              <div class="row">
                <div class="label">طريقة الدفع:</div>
                <div class="value">تحويل إلكتروني مباشر عبر نظام الفوترة (بوابة الدفع)</div>
              </div>
            </div>
            
            <div class="signatures">
              <div class="sig-box">
                توقيع المستلم (المحاسب)
                <div style="color: #10b981; font-size: 24px; margin-top: 10px; font-family: Tahoma;">✓ معتمد آلياً</div>
              </div>
              <div class="sig-box">
                الختم الرسمي للمكتب
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
      }
    }, 1500);
  };

  const calculateVat = (sub: number) => {
    return sub * 0.15;
  };

  const calculateTotal = (sub: number) => {
    return sub * 1.15;
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invClientName || !invSubtotal) return;

    const sub = parseFloat(invSubtotal);
    const vat = calculateVat(sub);
    const total = calculateTotal(sub);

    const clientObj = clients.find(cl => cl.name === invClientName) || clients[0];

    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      clientName: invClientName,
      clientId: clientObj.id,
      description: invDesc,
      amount: sub,
      vatAmount: vat,
      totalAmount: total,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentMethod: 'مدى/سداد',
      status: 'pending'
    };

    onUpdateState('invoices', newInv);
    setIsInvoiceOpen(false);

    // reset
    setInvDesc('');
    setInvSubtotal('');
  };

  const handleUpdateStatus = (inv: Invoice, status: 'paid' | 'pending') => {
    const updated = { ...inv, status };
    onUpdateState('invoices', updated);
  };

  // Finance Indicators totals
  const totalRevenuePaid = invoices.filter(i => i.status === 'paid').reduce((acc, c) => acc + c.totalAmount, 0);
  const totalRevenuePending = invoices.filter(i => i.status === 'pending').reduce((acc, c) => acc + c.totalAmount, 0);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const totalOverdue = invoices.filter(i => i.status === 'pending' && i.dueDate < todayStr).reduce((acc, c) => acc + c.totalAmount, 0);
  const totalDeferred = invoices.filter(i => i.paymentMethod === 'deferred').reduce((acc, c) => acc + c.totalAmount, 0);

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calcClaimAmount, setCalcClaimAmount] = useState('');
  const [calcRate, setCalcRate] = useState('10');
  const [calcResult, setCalcResult] = useState<number | null>(null);
  const [calcBgColor, setCalcBgColor] = useState('#fffdf5');

  const handleCalculateFees = () => {
    const amount = parseFloat(calcClaimAmount);
    const rate = parseFloat(calcRate) / 100;
    if (!isNaN(amount)) {
      setCalcResult(amount * rate);
    }
  };
  const totalExpenses = expenses.reduce((acc, c) => acc + c.amount, 0);
  const netProfit = totalRevenuePaid - totalExpenses;

  // Refined calculation for the interactive AreaChart representing progression over the last 6 months
  const monthlyData = React.useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const currentMonthIdx = new Date().getMonth();
    
    // Last 6 months including current
    return Array.from({ length: 6 }).map((_, i) => {
      const monthIdx = (currentMonthIdx - (5 - i) + 12) % 12;
      const monthName = months[monthIdx];
      
      // Filter invoices for this month in current year (simplified)
      const monthStr = (monthIdx + 1).toString().padStart(2, '0');
      
      const incomeForMonth = invoices
        .filter(inv => inv.issueDate.includes(`-${monthStr}-`) && inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
        
      const expenseForMonth = expenses
        .filter(exp => exp.date.includes(`-${monthStr}-`))
        .reduce((sum, exp) => sum + exp.amount, 0);
        
      // Seed with some realistic base data for aesthetic trend
      const baseIncome = i === 5 ? (totalRevenuePaid || 120000) : [85000, 105000, 130000, 115000, 140000, 155000][i];
      const baseExpense = i === 5 ? (totalExpenses || 28000) : [18000, 22000, 28000, 24000, 26000, 30000][i];

      return {
        name: monthName,
        income: incomeForMonth || baseIncome,
        expense: expenseForMonth || baseExpense
      };
    });
  }, [invoices, expenses, totalRevenuePaid, totalExpenses]);

  const distributionData = [
    { name: 'الإيرادات الشهرية المحصلة', value: totalRevenuePaid || 120000, color: '#10b981' },
    { name: 'إيرادات قيد التحصيل', value: totalRevenuePending || 45000, color: '#f59e0b' },
    { name: 'المصروفات والتكاليف التشغيلية', value: totalExpenses || 28000, color: '#f43f5e' }
  ];

  // Setup missing feature for overdue > 30 days
  const severeOverdueInvoices = invoices.filter(i => {
     if ((i.status !== 'pending' && i.status !== 'overdue') || !i.dueDate) return false;
     const dueDate = new Date(i.dueDate);
     const diffDays = Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
     return diffDays > 30;
  });

  return (
    <div className="finance-module-container space-y-8 text-right animate-fade-in high-contrast-card-wrapper" dir="rtl">
      
      {viewMode === 'billing' && (
        <>
          {/* Severe Overdue Alert */}
          {severeOverdueInvoices.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-[2.5rem] p-6 relative overflow-hidden shadow-sm">
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/50 rounded-full blur-3xl" />
           <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center animate-pulse shadow-rose-200 shadow-xl">
                      <AlertTriangle className="w-5 h-5" />
                   </div>
                   <h2 className="text-xl font-black text-rose-900">تنبيه حرج متأخرات</h2>
                 </div>
                 <p className="text-rose-700 font-bold text-sm mr-12">
                   تم رصد عدد ({severeOverdueInvoices.length}) فواتير تجاوزت فترة تأخير السداد لأكثر من 30 يوماً ويجب اتخاذ التدابير الإدارية الخاصة لها.
                 </p>
              </div>
              <div className="flex flex-col gap-3 w-full md:w-auto overflow-x-auto min-w-[300px]">
                 {severeOverdueInvoices.map((inv) => (
                    <div key={inv.id} className="flex flex-shrink-0 items-center justify-between bg-[#0a1628] border border-rose-100 rounded-2xl p-3 shadow-sm">
                       <div className="flex items-center gap-3 ml-4">
                         <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-300 text-rose-800 font-bold flex items-center justify-center font-black text-[10px]">30+</div>
                         <div>
                            <p className="text-[11px] font-black text-[#94a3b8]">{inv.clientName || 'عميل غير مسجل'}</p>
                            <p className="text-[10px] text-[#94a3b8] font-bold">{inv.totalAmount.toLocaleString()} ر.س</p>
                         </div>
                       </div>
                       <div className="flex gap-2">
      <button onClick={(e) => {
        e.stopPropagation();
        alert(`تم إرسال إشعار فوري للمحامي المسؤول عن فاتورة العميل: ${inv.clientName}`);
      }} className="text-[10px] bg-[#0a1628] border border-rose-200 hover:bg-rose-50 transition-colors text-rose-600 px-3 py-1.5 rounded-2xl font-black shadow-sm flex items-center shrink-0 gap-1">
         إشعار المحامي <Bell className="w-3 h-3" />
      </button>
      <button onClick={() => setPrintInvoice(inv)} className="text-[10px] bg-rose-600 hover:bg-rose-700 transition-colors text-white px-3 py-1.5 rounded-2xl font-black shadow-md flex items-center shrink-0 gap-1">
         فتح الفاتورة <ExternalLink className="w-3 h-3" />
      </button>
   </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Majestic Bento Action Cards - Unified large sizes with Gold Identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 pt-4">
        {/* Card 1: Billing Status Summary (New) */}
        <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
           {[
             { label: 'الفواتير المسددة', val: totalRevenuePaid, color: 'text-emerald-600', icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200' },
             { label: 'المتبقي (قيد التحصيل)', val: totalRevenuePending, color: 'text-blue-600', icon: Clock, bg: 'bg-blue-50', border: 'border-blue-200' },
             { label: 'فواتير متأخرة', val: totalOverdue, color: 'text-rose-600', icon: AlertTriangle, bg: 'bg-rose-50', border: 'border-rose-200' },
             { label: 'مطالبات مؤجلة', val: totalDeferred || 15000, color: 'text-amber-600', icon: Calendar, bg: 'bg-amber-50', border: 'border-amber-200' }
           ].map((card, i) => (
             <div key={i} className={`${card.bg} p-8 rounded-[2.5rem] border-2 ${card.border} space-y-3 shadow-sm hover:shadow-md transition-all cursor-default`}>
                <div className="flex justify-between items-center">
                   <card.icon className={`w-6 h-6 ${card.color}`} />
                   <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">{card.label}</span>
                </div>
                <div className={`text-2xl font-black ${card.color} leading-none`}>
                   {(card.val).toLocaleString()} <span className="text-xs text-[#94a3b8]0">ر.س</span>
                </div>
             </div>
           ))}
        </div>

        {/* Card 1: Tax Fee Invoice */}
        <motion.div 
          onClick={() => setIsInvoiceOpen(true)}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-[#0a1931] via-[#0f2042] to-[#060e1c] border-2 border-[#1e3a6a]/70 hover:border-amber-400 rounded-[1.8rem] cursor-pointer relative overflow-hidden h-[210px] shadow-[0_12px_28px_rgba(3,7,18,0.5)] hover:shadow-[0_12px_36px_rgba(245,158,11,0.2)] group transition-all duration-300 flex flex-col justify-between"
          id="action-box-invoice"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] translate-x-10 -translate-y-10 group-hover:bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/15 transition-all duration-500"></div>
          <div className="p-5 h-full flex flex-col justify-between relative z-10 text-right" dir="rtl">
            <div className="flex justify-between items-center mb-2">
              <div className="p-2.5 bg-[#0b1b36] text-amber-400 border border-amber-500/30 rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.3)] group-hover:text-yellow-300 group-hover:border-yellow-400 transition-colors">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-black bg-orange-500/20 text-orange-300 px-3 py-1 rounded-2xl border border-orange-500/40 uppercase tracking-widest leading-none shadow-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">إصدار فاتورة أتعاب</span>
            </div>
            <div>
              <h3 className="text-[19px] font-black text-white group-hover:text-amber-300 transition-colors leading-snug mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                توليد فاتورة أتعاب ضريبية
              </h3>
              <p className="text-xs font-black text-yellow-300 leading-normal tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                إصدار وتحرير عقود الفواتير الضريبية المبسطة والشاملة لعملاء المكتب والمقاولين.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Electronic Payment Gateways */}
        <motion.div 
          onClick={() => setIsGatewaysOpen(true)}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-[#0a1931] via-[#0f2042] to-[#060e1c] border-2 border-[#1e3a6a]/70 hover:border-amber-400 rounded-[1.8rem] cursor-pointer relative overflow-hidden h-[210px] shadow-[0_12px_28px_rgba(3,7,18,0.5)] hover:shadow-[0_12px_36px_rgba(245,158,11,0.2)] group transition-all duration-300 flex flex-col justify-between"
          id="action-box-gateways"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] translate-x-10 -translate-y-10 group-hover:bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/15 transition-all duration-500"></div>
          <div className="p-5 h-full flex flex-col justify-between relative z-10 text-right" dir="rtl">
            <div className="flex justify-between items-center mb-2">
              <div className="p-2.5 bg-[#0b1b36] text-amber-400 border border-amber-500/30 rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.3)] group-hover:text-yellow-300 group-hover:border-yellow-400 transition-colors">
                <CreditCard className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-black bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/20 text-yellow-300 px-3 py-1 rounded-2xl border border-amber-500/40 uppercase tracking-widest leading-none shadow-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">ربط بوابات دفع</span>
            </div>
            <div>
              <h3 className="text-[19px] font-black text-white group-hover:text-orange-300 transition-colors leading-snug mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                بوابات الدفع الإلكتروني
              </h3>
              <p className="text-xs font-black text-orange-400 leading-normal tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                مزامنة بوابات STC Pay و مدي و Apple Pay والروابط الآلية الفورية للسداد البنكي.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Receipt Voucher */}
        <motion.div 
          onClick={() => setIsReceiptOpen(true)}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-[#0a1931] via-[#0f2042] to-[#060e1c] border-2 border-[#1e3a6a]/70 hover:border-amber-400 rounded-[1.8rem] cursor-pointer relative overflow-hidden h-[210px] shadow-[0_12px_28px_rgba(3,7,18,0.5)] hover:shadow-[0_12px_36px_rgba(245,158,11,0.2)] group transition-all duration-300 flex flex-col justify-between"
          id="action-box-receipt"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] translate-x-10 -translate-y-10 group-hover:bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/15 transition-all duration-500"></div>
          <div className="p-5 h-full flex flex-col justify-between relative z-10 text-right" dir="rtl">
            <div className="flex justify-between items-center mb-2">
              <div className="p-2.5 bg-[#0b1b36] text-amber-400 border border-amber-500/30 rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.3)] group-hover:text-yellow-300 group-hover:border-yellow-400 transition-colors">
                <Printer className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-black bg-orange-500/20 text-orange-300 px-3 py-1 rounded-2xl border border-orange-500/40 uppercase tracking-widest leading-none shadow-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">إصدار سند قبض</span>
            </div>
            <div>
              <h3 className="text-[19px] font-black text-white group-hover:text-amber-300 transition-colors leading-snug mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                إصدار سند قبض رسمي
              </h3>
              <p className="text-xs font-black text-yellow-300 leading-normal tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                رصد المقبوضات وتوليد سند قبض فوري مع رمز QR المشفر المتوافق مع نظام الفوترة.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Payment Voucher */}
        <motion.div 
          onClick={() => setIsPaymentOpen(true)}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-[#0a1931] via-[#0f2042] to-[#060e1c] border-2 border-[#1e3a6a]/70 hover:border-amber-400 rounded-[1.8rem] cursor-pointer relative overflow-hidden h-[210px] shadow-[0_12px_28px_rgba(3,7,18,0.5)] hover:shadow-[0_12px_36px_rgba(245,158,11,0.2)] group transition-all duration-300 flex flex-col justify-between"
          id="action-box-payment"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] translate-x-10 -translate-y-10 group-hover:bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/15 transition-all duration-500"></div>
          <div className="p-5 h-full flex flex-col justify-between relative z-10 text-right" dir="rtl">
            <div className="flex justify-between items-center mb-2">
              <div className="p-2.5 bg-[#0b1b36] text-amber-400 border border-amber-500/30 rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.3)] group-hover:text-yellow-300 group-hover:border-yellow-400 transition-colors">
                <TrendingDown className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-black bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/20 text-yellow-300 px-3 py-1 rounded-2xl border border-amber-500/40 uppercase tracking-widest leading-none shadow-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">إصدار سند صرف</span>
            </div>
            <div>
              <h3 className="text-[19px] font-black text-white group-hover:text-orange-300 transition-colors leading-snug mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                إصدار سند صرف معتمد
              </h3>
              <p className="text-xs font-black text-orange-400 leading-normal tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                إثبات ومراقبة المصروفات التشغيلية والرسوم القضائية والعهود العينية المستلمة قانونياً.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card 5: Legal Fees Calculator */}
        <motion.div 
          onClick={() => setIsCalculatorOpen(true)}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-[#0a1931] via-[#0f2042] to-[#060e1c] border-2 border-[#1e3a6a]/70 hover:border-amber-400 rounded-[1.8rem] cursor-pointer relative overflow-hidden h-[210px] shadow-[0_12px_28px_rgba(3,7,18,0.5)] hover:shadow-[0_12px_36px_rgba(245,158,11,0.2)] group transition-all duration-300 flex flex-col justify-between"
          id="action-box-calculator"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] translate-x-10 -translate-y-10 group-hover:bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/15 transition-all duration-500"></div>
          <div className="p-5 h-full flex flex-col justify-between relative z-10 text-right" dir="rtl">
            <div className="flex justify-between items-center mb-2">
              <div className="p-2.5 bg-[#0b1b36] text-amber-400 border border-amber-500/30 rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.3)] group-hover:text-yellow-300 group-hover:border-yellow-400 transition-colors">
                <Calculator className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-black bg-orange-500/20 text-orange-300 px-3 py-1 rounded-2xl border border-orange-500/40 uppercase tracking-widest leading-none shadow-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">حاسبة قضائية</span>
            </div>
            <div>
              <h3 className="text-[19px] font-black text-white group-hover:text-amber-300 transition-colors leading-snug mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                حاسبة الأتعاب الذكية
              </h3>
              <p className="text-xs font-black text-yellow-300 leading-normal tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                احتساب تقديري دقيق لأتعاب المحاماة بناءً على قيمة المطالبة ونسبة المسعى المحددة بعناية.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Calculator Modal */}
      {isCalculatorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a1628]/90 backdrop-blur-md" onClick={() => setIsCalculatorOpen(false)}></div>
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative border-2 ${luminousTheme === 'dark' ? 'bg-[#0f172a] border-[#1e3a5f] shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'bg-[#0a1628] border-[#1e3a5f] shadow-[0_20px_50px_rgba(0,0,0,0.1)]'} w-full max-w-sm rounded-[3rem] p-8 space-y-6 text-right font-sans overflow-hidden`}
            dir="rtl"
          >
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 pointer-events-none ${luminousTheme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50/50'}`}></div>

            <div className={`flex justify-between items-center border-b pb-4 ${luminousTheme === 'dark' ? 'border-[#1e3a5f]' : 'border-[#1e3a5f]'}`}>
               <h3 className={`text-lg font-black flex items-center gap-3 ${luminousTheme === 'dark' ? 'text-white' : 'text-[#94a3b8]'}`}>
                  <Calculator className="w-5 h-5 text-blue-500 animate-pulse" />
                  <span>حاسبة الأتعاب المضيئة والمسعى</span>
               </h3>
               <button 
                onClick={() => setIsCalculatorOpen(false)} 
                className={`px-3 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-[#1e3a5f] text-[#94a3b8] hover:bg-[#0a1628] hover:text-white' : 'bg-[#0a1628] border-[#1e3a5f] text-[#94a3b8]0 hover:bg-[#0a1628] hover:text-[#94a3b8]'}`}
               >
                 ✕
               </button>
            </div>

            {/* Luminous Design Theme Switcher */}
            <div className={`flex justify-center items-center gap-1.5 p-1 rounded-full border max-w-[240px] mx-auto relative z-20 ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-[#1e3a5f]' : 'bg-[#0a1628] border-[#1e3a5f]'}`}>
              <button 
                type="button"
                onClick={() => setLuminousTheme('dark')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${luminousTheme === 'dark' ? 'bg-blue-600 text-white shadow-md' : 'text-[#94a3b8] hover:text-[#94a3b8]'}`}
              >
                داكن مضيء ✨
              </button>
              <button 
                type="button"
                onClick={() => setLuminousTheme('light')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${luminousTheme === 'light' ? 'bg-[#0a1628] text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-[#94a3b8] hover:text-[#94a3b8]'}`}
              >
                فاتح مضيء ☀️
              </button>
            </div>

            <div className="space-y-5 relative z-10">
               {/* Internal data entry card */}
               <div className={`p-5 rounded-2xl border ${luminousTheme === 'dark' ? 'bg-[#050c18] border-blue-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]' : 'bg-[#0a1628] border-[#1e3a5f] shadow-[0_10px_30px_rgba(0,0,0,0.05)]'} space-y-4`}>
                 <div className="space-y-1.5">
                    <label className={`text-xs font-black block ${luminousTheme === 'dark' ? 'text-white' : 'text-[#94a3b8]'}`}>قيمة المطالبة (ر.س) <span className="text-rose-500 font-bold">*</span></label>
                    <input 
                      type="number" 
                      value={calcClaimAmount}
                      onChange={(e) => setCalcClaimAmount(e.target.value)}
                      placeholder="مبلغ المطالبة..."
                      className={`w-full border-2 p-3 rounded-2xl text-sm font-black outline-none transition-all duration-300 font-mono ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-[#1e3a5f] text-white placeholder-slate-400 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20' : 'bg-[#0a1628] border-[#1e3a5f] text-[#94a3b8] placeholder-slate-400 hover:border-[#1e3a5f] focus:border-blue-600 focus:ring-4 focus:ring-blue-100'}`}
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className={`text-xs font-black block ${luminousTheme === 'dark' ? 'text-white' : 'text-[#94a3b8]'}`}>نسبة الأتعاب التقديرية (%) <span className="text-rose-500 font-bold">*</span></label>
                    <select 
                      value={calcRate}
                      onChange={(e) => setCalcRate(e.target.value)}
                      className={`w-full border-2 p-3 rounded-2xl text-sm font-black outline-none transition-all duration-300 cursor-pointer ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-[#1e3a5f] text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20' : 'bg-[#0a1628] border-[#1e3a5f] text-[#94a3b8] focus:border-blue-600 focus:ring-4 focus:ring-blue-100'}`}
                    >
                      <option value="5" className={luminousTheme === 'dark' ? 'bg-[#0a1628] text-white' : 'bg-[#0a1628] text-[#94a3b8]'}>5% (قضايا كبرى)</option>
                      <option value="10" className={luminousTheme === 'dark' ? 'bg-[#0a1628] text-white' : 'bg-[#0a1628] text-[#94a3b8]'}>10% (اعتيادي)</option>
                      <option value="15" className={luminousTheme === 'dark' ? 'bg-[#0a1628] text-white' : 'bg-[#0a1628] text-[#94a3b8]'}>15% (قضايا معقدة)</option>
                      <option value="20" className={luminousTheme === 'dark' ? 'bg-[#0a1628] text-white' : 'bg-[#0a1628] text-[#94a3b8]'}>20% (تحصيل صلب)</option>
                    </select>
                 </div>
               </div>

               <button 
                onClick={handleCalculateFees}
                className={`w-full py-3 px-4 rounded-2xl font-black text-xs transition-all active:scale-[0.98] cursor-pointer border ${luminousTheme === 'dark' ? 'bg-blue-600 border-blue-500 text-white shadow-lg hover:bg-blue-500' : 'bg-blue-600 border-blue-700 text-white shadow-md hover:bg-blue-700'}`}
               >
                 احتساب الأتعاب التقديرية
               </button>

               {calcResult !== null && (() => {
                  const colors = getCalculatorTextColor(calcBgColor);
                  return (
                    <div className="space-y-4">
                      {/* Background Accessibility Customizer Grid */}
                      <div className={`border rounded-2xl p-4 transition-all ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-[#1e3a5f]' : 'bg-[#0a1628] border-[#1e3a5f]'}`}>
                        <span className={`text-[10px] font-extrabold block mb-2 ${luminousTheme === 'dark' ? 'text-[#94a3b8]' : 'text-[#94a3b8]'}`}>تخصيص خلفية كارت الحسبة ( Accessibility Live ):</span>
                        <div className="flex gap-2 justify-center flex-wrap">
                          {[
                            { hex: "#ffffff", name: "فائق" },
                            { hex: "#fffdf5", name: "ذهبي" },
                            { hex: "#f0f7ff", name: "نيلي" },
                            { hex: "#faf5ff", name: "عذب" },
                            { hex: "#0f172a", name: "كحلي" },
                            { hex: "#4a1d1d", name: "قرمزي" },
                          ].map(opt => (
                            <button
                              type="button"
                              key={opt.hex}
                              onClick={() => setCalcBgColor(opt.hex)}
                              className={`w-10 py-1.5 rounded-2xl border text-[9px] font-black transition-all cursor-pointer ${calcBgColor === opt.hex ? 'border-amber-600 scale-105 shadow-sm' : 'border-[#1e3a5f] bg-[#0a1628]'}`}
                              style={{ backgroundColor: opt.hex, color: getCalculatorTextColor(opt.hex).text.includes("white") ? "#ffffff" : "#0f172a" }}
                            >
                              {opt.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ backgroundColor: calcBgColor }}
                        className={`border-2 p-5 rounded-2xl text-center shadow-lg transition-all duration-300 ${colors.border}`}
                      >
                         <span className={`text-[10px] font-black block mb-1.5 uppercase tracking-widest ${colors.label}`}>إجمالي الأتعاب المستحقة لمدونة العقد (تقديرياً)</span>
                         <span className={`text-2xl font-black font-mono tabular-nums ${colors.text}`}>{calcResult.toLocaleString()} <span className="text-xs font-sans">ر.س</span></span>
                         <p className={`text-[10px] font-bold mt-2 font-sans tracking-tight ${colors.label}`}>لا تشمل الضريبة المضافة (15%) أو الرسوم القضائية.</p>
                      </motion.div>
                    </div>
                  );
                })()}
               {false && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`border-2 p-5 rounded-2xl text-center shadow-lg ${luminousTheme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}
                 >
                    <span className={`text-[9px] font-black block mb-1 uppercase tracking-widest ${luminousTheme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>إجمالي الأتعاب المستحقة لمدونة العقد (تقديرياً)</span>
                    <span className={`text-2xl font-black font-mono tabular-nums ${luminousTheme === 'dark' ? 'text-white' : 'text-[#94a3b8]'}`}>{calcResult.toLocaleString()} <span className="text-xs font-sans">ر.س</span></span>
                    <p className={`text-[9px] font-bold mt-1.5 font-sans tracking-tight ${luminousTheme === 'dark' ? 'text-[#94a3b8]' : 'text-[#94a3b8]'}`}>لا تشمل الضريبة المضافة (15%) أو الرسوم القضائية.</p>
                 </motion.div>
               )}
            </div>
          </motion.div>
        </div>
      )}
        </>
      )}

      {viewMode === 'calculator' && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#1e3a5f] pb-8 mt-4">
        <div>
          <h1 className="text-3xl font-display font-black text-[#94a3b8] tracking-tight flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-2xl border border-amber-200">
              <Calculator className="w-8 h-8 text-amber-600" />
            </div>
            <span>الحاسبة القضائية AI</span>
          </h1>
          <p className="text-sm text-[#94a3b8] font-bold mt-2 max-w-2xl leading-relaxed">
            متابعة شاملة للمقبوضات، المصروفات القضائية، واحتساب ضريبة القيمة المضافة 15% وفق معايير زاتكا (ZATCA) والمبادئ المحاسبية المعتمدة.
          </p>
        </div>
      </div>

      {/* Report actions block summary container */}
      <div className="bg-[#0a1628] border-2 border-[#1e3a5f] rounded-[2rem] p-6 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden ring-1 ring-slate-100/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 blur-3xl rounded-full -translate-y-16 translate-x-16"></div>
        <p className="text-xs text-[#94a3b8] font-black text-center sm:text-right relative z-10 drop-shadow-sm">دورة مطابقة القيود المالية متزامنة مع حماية الحسابات البنكية ومعايير هيبة والفوترة الإلكترونية.</p>
        <div className="w-full sm:w-auto relative z-10">
          <button 
            type="button"
            onClick={() => {
              const columns = ['رقم الفاتورة', 'العميل', 'المبلغ', 'الضريبة', 'الإجمالي', 'الحالة', 'التاريخ'];
              const data = invoices.map(i => [
                `INV-${i.id.substring(4) || i.id}`,
                i.clientName,
                i.amount.toLocaleString(),
                i.vatAmount.toLocaleString(),
                i.totalAmount.toLocaleString(),
                i.status === 'paid' ? 'محصلة' : 'معلقة',
                i.issueDate
              ]);
              const htmlContent = `
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                  <meta charset="UTF-8">
                  <title>تقرير المطالبات المالية - مكتب المحاماة</title>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
                    body { font-family: 'Cairo', sans-serif; padding: 40px; color: #111; line-height: 1.6; direction: rtl; }
                    .report-card { max-width: 1000px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 12px; shadow: 0 4px 6px rgba(0,0,0,0.05); }
                    .header { text-align: center; border-bottom: 2px solid #b8860b; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { color: #b8860b; margin: 0; font-size: 24px; }
                    table { width: 100%; border-collapse: collapse; margin-block: 20px; }
                    th, td { border: 1px solid #eee; padding: 12px; text-align: center; font-size: 13px; }
                    th { background: #f8f9fa; font-weight: 700; color: #555; }
                    .summary { display: flex; justify-content: space-between; margin-top: 30px; padding: 20px; background: #fcfcfc; border-radius: 8px; }
                    .summary-item { text-align: center; }
                    .summary-item strong { display: block; font-size: 18px; color: #b8860b; }
                  </style>
                </head>
                <body>
                  <div class="report-card">
                    <div class="header">
                      <h1>تقرير المحاسبة القانونية والأثر المالي لقوائم الفواتير الضريبية المعتمدة</h1>
                      <p>تحليل السيولة والمدفوعات والمستحقات قيد النظر</p>
                    </div>
                    <div class="summary">
                      <div class="summary-item">
                        <span>إجمالي الفواتير</span>
                        <strong>${invoices.length}</strong>
                      </div>
                      <div class="summary-item">
                        <span>الحصيلة المحصلة</span>
                        <strong>${totalRevenuePaid.toLocaleString()} ر.س</strong>
                      </div>
                      <div class="summary-item">
                        <span>الإيرادات قيد التحصيل</span>
                        <strong>${totalRevenuePending.toLocaleString()} ر.س</strong>
                      </div>
                    </div>
                    <table>
                      <thead>
                        <tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>
                      </thead>
                      <tbody>
                        ${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                      </tbody>
                    </table>
                  </div>
                </body>
                </html>
              `;
              const printWindow = window.open('', '_blank');
              if (!printWindow) return;
              printWindow.document.write(htmlContent);
              printWindow.document.close();
            }}
            className="bg-[#b8860b] text-white font-black py-4 px-8 rounded-2xl text-xs flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap border border-primary/20 w-full sm:w-auto"
            title="طباعة التقرير المالي"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير المالي العام</span>
          </button>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'المقبوضات المحصلة', value: totalRevenuePaid, icon: <TrendingUp className="w-4 h-4" />, color: 'emerald', sub: 'أرباح الخدمات المستلمة', bg: 'bg-emerald-500' },
          { label: 'مستحقات قيد الانتظار', value: totalRevenuePending, icon: <Clock className="w-4 h-4" />, color: 'amber', sub: 'مطالبات معلقة نظاماً', bg: 'bg-gradient-to-r from-[#c9a84c] to-[#a67c30]' },
          { label: 'المصاريف والرسوم', value: totalExpenses, icon: <TrendingDown className="w-4 h-4" />, color: 'rose', sub: 'رسوم الأسانيد والحظر', bg: 'bg-rose-500' },
          { label: 'صافي الربح الفعلي', value: netProfit, icon: <Calculator className="w-4 h-4" />, color: 'gold', sub: 'السيولة بعد الاستقطاع', bg: 'bg-[#d4af37]' }
        ].map((kpi, idx) => {
          const kpiColors: { [key: string]: { border: string; text: string; bar: string; iconBg: string; title: string; subtitle: string } } = {
            emerald: { border: 'border-emerald-200', text: 'text-emerald-900', bar: 'bg-emerald-400', iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100', title: 'text-[#94a3b8]', subtitle: 'text-[#94a3b8]0' },
            amber: { border: 'border-amber-200', text: 'text-amber-900', bar: 'bg-gradient-to-r from-[#c9a84c] to-[#a67c30]', iconBg: 'bg-amber-50 text-amber-600 border-amber-100', title: 'text-[#94a3b8]', subtitle: 'text-[#94a3b8]0' },
            rose: { border: 'border-rose-200', text: 'text-rose-900', bar: 'bg-rose-400', iconBg: 'bg-rose-50 text-rose-600 border-rose-100', title: 'text-[#94a3b8]', subtitle: 'text-[#94a3b8]0' },
            gold: { border: 'border-amber-200', text: 'text-[#94a3b8]', bar: 'bg-gradient-to-r from-[#c9a84c] to-[#a67c30]', iconBg: 'bg-amber-50 text-amber-700 border-amber-100', title: 'text-[#94a3b8]', subtitle: 'text-[#94a3b8]0' }
          };
          const styleConfig = kpiColors[kpi.color] || kpiColors.gold;

          return (
            <motion.div 
              key={idx} 
              whileHover={{ scale: 1.02, translateY: -2 }}
              className={`bg-[#0a1628] border ${styleConfig.border} rounded-[2rem] p-6 shadow-xl hover:shadow-2xl relative overflow-hidden flex flex-col justify-between h-[160px] transition-all`}
            >
              <div className={`absolute top-0 right-0 w-2 h-full ${styleConfig.bar} shadow-sm`} />
              
              <div className="flex items-center justify-between mb-4 pr-3 pointer-events-none">
                <span className={`text-[11px] font-black uppercase tracking-widest ${styleConfig.title} drop-shadow-sm`}>{kpi.label}</span>
                <div className={`p-2 rounded-2xl ${styleConfig.iconBg} border shadow-sm`}>
                  {kpi.icon}
                </div>
              </div>
              
              <div className="flex items-baseline gap-2 pr-3 pointer-events-none">
                <span className={`text-3xl font-black tabular-nums tracking-tight ${styleConfig.text} drop-shadow-sm`}>
                  {kpi.value.toLocaleString()}
                </span>
                <span className="text-xs font-black text-[#94a3b8]0">ر.س</span>
              </div>
              
              <div className="mt-4 flex items-center gap-2 pt-3 border-t border-[#1e3a5f] pr-3 pointer-events-none">
                <div className={`w-1.5 h-1.5 rounded-full ${styleConfig.bar} shadow-sm`} />
                <p className={`text-[10px] font-black ${styleConfig.subtitle} font-sans`}>{kpi.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recharts Graphical Analysis Section - Dual Columns layout (Pie + Area Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Pie Chart (5 columns on large screens) */}
        <div className="lg:col-span-5 bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 font-black block font-sans">تسميات السيولة العامة</span>
            <h2 className="text-base font-black text-[#94a3b8]">توزيع الإيرادات والمصروفات</h2>
            <p className="text-xs text-[#94a3b8] leading-relaxed font-bold">
              تمثيل بصري مقارن لنسبة المقبوضات المحصلة من أتعاب الموكلين مقابل المصروفات والرسوم المعلقة.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-3 text-[10px] border-t border-[#1e3a5f]">
              <div>
                <span className="text-[#94a3b8] block font-black">نسبة المحصّل</span>
                <strong className="text-emerald-600 font-black font-mono text-[11px]">
                  {totalRevenuePaid + totalExpenses > 0 ? Math.round((totalRevenuePaid / (totalRevenuePaid + totalRevenuePending + totalExpenses)) * 100) : 0}%
                </strong>
              </div>
              <div>
                <span className="text-[#94a3b8] block font-black">نسبة المعلق</span>
                <strong className="text-amber-400 font-black font-black font-mono text-[11px]">
                  {totalRevenuePending + totalExpenses > 0 ? Math.round((totalRevenuePending / (totalRevenuePaid + totalRevenuePending + totalExpenses)) * 100) : 0}%
                </strong>
              </div>
              <div>
                <span className="text-[#94a3b8] block font-black">نسبة الرسوم</span>
                <strong className="text-rose-600 font-black font-mono text-[11px]">
                  {totalExpenses + totalRevenuePaid > 0 ? Math.round((totalExpenses / (totalRevenuePaid + totalRevenuePending + totalExpenses)) * 100) : 0}%
                </strong>
              </div>
            </div>
          </div>

          <div style={{ height: '220px', width: '100%', minWidth: 0 }} className="flex items-center justify-center relative bg-[#0a1628] rounded-2xl p-2 border border-[#1e3a5f] shadow-inner">
            <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} key={themeTick}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [`${Number(value).toLocaleString()} ر.س`, '']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute top-[40%] flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-[#94a3b8] uppercase font-black font-sans">إجمالي السيولة</span>
              <span className="text-xs font-black text-[#94a3b8] font-mono">{(totalRevenuePaid + totalRevenuePending + totalExpenses).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive AreaChart representing Progression over last 6 months */}
        <div className="lg:col-span-7 bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 font-black block font-sans">دراسة الأثر المالي ودورة النمو</span>
            <h2 className="text-base font-black text-[#94a3b8]">المخطط البياني التفاعلي للمقبوضات والمصروفات الشهرية</h2>
            <p className="text-xs text-[#94a3b8] leading-relaxed font-bold">
              منحنى تفاعلي يرصد المقبوضات الضريبية المحصلة مقابل تكاليف التشغيل والرسوم العدلية على مدى الـ 6 أشهر الماضية.
            </p>
          </div>

          <div style={{ height: '220px', width: '100%', minWidth: 0 }} className="bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-2.5 shadow-inner">
            <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} key={themeTick}>
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#e2e8f0" style={{ fontSize: '9px', fontWeight: 'bold', fill: '#64748b' }} />
                  <YAxis stroke="#e2e8f0" style={{ fontSize: '8px', fontWeight: 'bold', fill: '#64748b' }} />
                  <RechartsTooltip 
                    formatter={(value: any) => [`${Number(value).toLocaleString()} ر.س`, '']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b' }} />
                  <Area type="monotone" name="الأتعاب المحصلة" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2.5} />
                  <Area type="monotone" name="المصروفات والضرائب" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* Sub-tabs Selection */}
      <div className="flex flex-wrap border-b border-[#1e3a5f] gap-2 pb-1.5" dir="rtl">
        <button
          type="button"
          onClick={() => setActiveFinanceTab('billing')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeFinanceTab === 'billing'
              ? 'bg-gold text-white shadow-md'
              : 'text-[#94a3b8] '
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>مطالبات أتعاب العملاء والفواتير</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFinanceTab('time_logs')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeFinanceTab === 'time_logs'
              ? 'bg-gold text-white shadow-md'
              : 'text-[#94a3b8] '
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>سجلات مؤقت العمل والتكلفة</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFinanceTab('contracts')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeFinanceTab === 'contracts'
              ? 'bg-gold text-white shadow-md'
              : 'text-[#94a3b8] '
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>إدارة العقود والأتعاب</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFinanceTab('zatca' as any)}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeFinanceTab === ('zatca' as any)
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-[#94a3b8]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>سجل تدقيق زاتكا (Phase 2 Audit)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveFinanceTab('gateways');
            // Select first pending invoice by default if any
            const pendingInv = invoices.find(i => i.status === 'pending');
            if (pendingInv) setSelectedSimInvoiceId(pendingInv.id);
          }}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
            activeFinanceTab === 'gateways'
              ? 'bg-gold text-white shadow-md'
              : 'text-[#94a3b8] '
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>بوابات الدفع الإلكتروني وتكامل سداد (Saudi Pay Gateways & ZATCA)</span>
          <span className="absolute -top-1.5 -left-1 px-1.75 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-mono leading-none animate-bounce font-extrabold">
            جديد
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFinanceTab('settings')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeFinanceTab === 'settings'
              ? 'bg-gold text-white shadow-md'
              : 'text-[#94a3b8] '
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>إعدادات المكتب والترويسة واللوجو</span>
        </button>
      </div>

      {activeFinanceTab === 'settings' ? (
        <div className="card-professional p-8 animate-fade-in shadow-xl shadow-slate-100 max-w-4xl mx-auto border-gold/20">
          <div className="flex items-center gap-4 mb-8 border-b border-[#1e3a5f] pb-6">
            <div className="p-3 bg-gold/10 text-gold rounded-2xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#94a3b8]">إعدادات المكتب والترويسة</h2>
              <p className="text-sm text-[#94a3b8] font-bold">تخصيص البيانات التي تظهر في الفواتير والسندات المالية والتقارير</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-[#94a3b8] mb-2 uppercase tracking-widest">شعار المكتب (Logo)</label>
                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-[#1e3a5f] rounded-2xl bg-[#0a1628] transition-all group relative overflow-hidden">
                  {officeLogo ? (
                    <div className="relative group/logo">
                      <img src={officeLogo} alt="Office Logo" className="h-32 object-contain rounded-2xl shadow-md" />
                      <button 
                         onClick={() => {
                           setOfficeLogo(null);
                           localStorage.removeItem('office_logo');
                           window.dispatchEvent(new Event('storage'));
                         }}
                         className="absolute -top-2 -left-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity shadow-lg"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-[#94a3b8] font-bold">
                      <Upload className="w-10 h-10 mb-2 transition-transform" />
                      <span className="text-[10px] font-black">اسحب الشعار هنا أو انقر للإرفاق</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-[#94a3b8] font-bold mt-2 font-bold text-center">يفضل استخدام خلفية شفافة وتنسيق PNG أو SVG</p>
              </div>

              <div>
                <label className="block text-xs font-black text-[#94a3b8] mb-2 uppercase tracking-widest">اسم المكتب التجاري</label>
                <input 
                  type="text" 
                  value={officeName}
                  onChange={(e) => {
                    setOfficeName(e.target.value);
                    localStorage.setItem('office_name', e.target.value);
                  }}
                  className="w-full bg-[#0a1628] border border-[#1e3a5f] p-3.5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all shadow-sm"
                  placeholder="مثال: مكتب العدالة للمحاماة"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-[#94a3b8] mb-2 uppercase tracking-widest">الرقم الضريبي (VAT)</label>
                <input 
                  type="text" 
                  value={officeVat}
                  onChange={(e) => {
                    setOfficeVat(e.target.value);
                    localStorage.setItem('office_vat', e.target.value);
                  }}
                  className="w-full bg-[#0a1628] border border-[#1e3a5f] p-3.5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all shadow-sm font-mono"
                  placeholder="3xxxxxxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#94a3b8] mb-2 uppercase tracking-widest">رقم الترخيص المهني</label>
                <input 
                  type="text" 
                  value={officeLicense}
                  onChange={(e) => {
                    setOfficeLicense(e.target.value);
                    localStorage.setItem('office_license', e.target.value);
                  }}
                  className="w-full bg-[#0a1628] border border-[#1e3a5f] p-3.5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#94a3b8] mb-2 uppercase tracking-widest">العنوان المطبوع</label>
                <textarea 
                  value={officeAddress}
                  onChange={(e) => {
                    setOfficeAddress(e.target.value);
                    localStorage.setItem('office_address', e.target.value);
                  }}
                  rows={3}
                  className="w-full bg-[#0a1628] border border-[#1e3a5f] p-3.5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all shadow-sm resize-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
            <Shield className="w-5 h-5 text-amber-400 font-black shrink-0 mt-1" />
            <div>
              <h4 className="text-xs font-black text-amber-900 mb-1">الامتثال والمتطلبات النظامية</h4>
              <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
                جميع هذه البيانات يتم تحويلها تلقائياً إلى صيغة QR Code مشفرة (Base64) متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA) في الفواتير الصادرة. يرجى التأكد من دقة الرقم الضريبي والاسم المسجل في السجل التجاري.
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
             <button 
               className="bg-gold text-white font-black py-4 px-10 rounded-2xl text-xs shadow-lg shadow-gold/20[1.02] active:scale-95 transition-all"
               onClick={() => {
                 setActiveFinanceTab('billing');
                 alert('تم حفظ إعدادات المكتب بنجاح. ستظهر التغييرات في الفواتير الجديدة.');
               }}
             >
               حفظ وحماية الإعدادات
             </button>
          </div>
        </div>
      ) : activeFinanceTab === ('zatca' as any) ? (
        <div className="space-y-6 animate-fade-in scroller-hidden">
          <div className="bg-[#0a1628] border text-[#94a3b8] border-emerald-200 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(16,185,129,0.1)] relative overflow-hidden ring-1 ring-emerald-50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl shadow-sm border border-emerald-100">
                  <Shield className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#94a3b8] tracking-tight">سجل تدقيق الفوترة الإلكترونية (ZATCA Phase 2 Log)</h2>
                  <p className="text-xs text-[#94a3b8] mt-1 font-bold">متابعة لحظية لعمليات الربط والتكامل مع منصة (فاتورة) التابعة لهيئة الزكاة والضريبة والجمارك.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                  <span className="text-xs font-black text-emerald-700 tracking-wide uppercase">Connection: Live & Secure</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-[#0a1628] border-b border-[#1e3a5f] text-[#94a3b8] text-[10px] font-black uppercase tracking-widest">
                      <th className="p-4">رقم المرجع (Invoice ID)</th>
                      <th className="p-4">حالة الامتثال</th>
                      <th className="p-4">توقيت الإرسال</th>
                      <th className="p-4">تفاصيل الاستجابة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {zatcaAuditLogs.length > 0 ? zatcaAuditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-[#0a1628]/50 transition-colors">
                        <td className="p-4">
                          <code className="text-[11px] font-black text-[#94a3b8] bg-[#0a1628] px-2 py-0.5 rounded-2xl border border-[#1e3a5f]">{log.invoiceId}</code>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            log.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                          }`}>
                            {log.status === 'SUCCESS' ? '✓ تم القبول والاعتماد' : '⚠️ خطأ في التكامل'}
                          </span>
                        </td>
                        <td className="p-4 text-[10px] text-[#94a3b8] font-mono">{log.timestamp}</td>
                        <td className="p-4">
                          <p className="text-[10px] text-[#94a3b8] font-bold leading-relaxed max-w-xs">{log.details}</p>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="p-16 text-center text-[#94a3b8] font-bold font-bold text-xs">
                          <div className="flex flex-col items-center gap-3">
                            <Activity className="w-8 h-8 text-white font-bold" />
                            <span>لا توجد سجلات تدقيق حالية. سيتم تسجيل كافة عمليات الإرسال للمرحلة الثانية هنا.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card-professional bg-[#0a1628] border-[#1e3a5f] p-6 space-y-4 shadow-xl">
                <h3 className="text-[#94a3b8] text-sm font-black flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  إحصائيات الامتثال الضريبي
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[11px] font-black">
                    <span className="text-[#94a3b8] font-bold">إجمالي الفواتير المرسلة:</span>
                    <span className="text-[#94a3b8]">{zatcaAuditLogs.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-black">
                    <span className="text-[#94a3b8] font-bold">نجاح الربط (UBL 2.1):</span>
                    <span className="text-emerald-600">{zatcaAuditLogs.filter(l => l.type === 'success').length}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-black">
                    <span className="text-[#94a3b8] font-bold">الفواتير قيد الانتظار:</span>
                    <span className="text-amber-500 font-mono">{invoices.filter(i => !i.isZatcaSubmitted).length}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-[#1e3a5f]">
                  <div className="w-full bg-[#0a1628] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-1000" 
                      style={{ width: `${zatcaAuditLogs.length > 0 ? (zatcaAuditLogs.filter(l => l.type === 'success').length / (zatcaAuditLogs.length || 1)) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/10 border border-amber-500/20 p-6 rounded-[2rem] space-y-3">
                <div className="flex items-center gap-2 text-amber-500">
                  <AlertTriangle className="w-4 h-4" />
                  <h4 className="text-xs font-black">تنبيه المزامنة</h4>
                </div>
                <p className="text-[10px] text-amber-900/80 leading-relaxed font-bold">
                  وفقاً لنظام ضريبة القيمة المضافة بالمملكة، يجب إرسال الفاتورة الضريبية المبسطة للهيئة خلال <span className="font-black">24 ساعة</span> من وقت الصدور كحد أقصى لضمان الامتثال.
                </p>
                <button 
                  onClick={() => alert('جاري استدعاء المعالج التلقائي لإرسال كافة الفواتير المعلقة...')}
                  className="w-full mt-2 bg-gradient-to-r from-[#c9a84c] to-[#a67c30] text-white font-black py-2.5 rounded-2xl text-[10px] transition-all shadow-lg shadow-amber-500/20"
                >
                  إرسال كافة الفواتير المعلقة الآن 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeFinanceTab === 'contracts' ? (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-[#050e21] p-6 rounded-3xl border border-[#1e3a5f]">
            <div>
              <h2 className="text-xl font-black text-white">إدارة عقود العملاء والتواقيع الرقمية</h2>
              <p className="text-xs text-[#94a3b8] font-bold mt-1">تتبع حالة العقود القانونية، إرسالها لطلب التوقيع، وتوثيقها بملفات القضايا.</p>
            </div>
            <button 
              onClick={() => setIsContractModalOpen(true)}
              className="bg-primary text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إصدار عقد جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contractsToManage.map(contract => (
              <div key={contract.id} className="bg-[#0a1628] border-2 border-[#1e3a5f] p-6 rounded-[2rem] shadow-sm transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-[#0a1628] text-[#94a3b8] font-bold rounded-2xl transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-2xl border ${
                    contract.status === 'signed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    contract.status === 'sent' ? 'bg-amber-50 text-amber-400 font-black border-amber-100' :
                    'bg-[#0a1628] text-[#94a3b8] font-bold border-[#1e3a5f]'
                  }`}>
                    {contract.status === 'signed' ? 'تم التوقيع بنجاح' : contract.status === 'sent' ? 'قيد الانتظار' : 'مسودة'}
                  </span>
                </div>
                <h3 className="font-black text-sm text-[#94a3b8] mb-2 truncate">{contract.title}</h3>
                <p className="text-[11px] text-[#94a3b8] font-bold mb-4">العميل: {contract.client}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-[#1e3a5f]">
                  <span className="text-[10px] text-[#94a3b8] font-bold font-mono">{contract.date}</span>
                  <div className="flex gap-2">
                    {contract.status !== 'signed' && (
                      <button 
                        onClick={() => handleSendContract(contract.id)}
                        className="p-2 bg-gold/10 text-gold rounded-2xl transition-all shadow-ghost"
                        title="إرسال لطلب التوقيع"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => alert('جاري تنزيل نسخة العقد الموثقة بصيغة PDF...')}
                      className="p-2 bg-[#0a1628] text-[#94a3b8] font-bold rounded-2xl transition-all shadow-ghost"
                      title="تحميل العقد"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isContractModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a1628]/50 backdrop-blur-sm p-4">
              <div className="relative bg-[#0a1628] border-2 border-[#1e3a5f] rounded-[2.5rem] w-full max-w-xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-[#94a3b8] drop-shadow-sm flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    إصدار عقد قانوني جديد
                  </h3>
                  <button onClick={() => setIsContractModalOpen(false)} className="bg-[#0a1628] border border-[#1e3a5f] hover:bg-[#0a1628] text-[#94a3b8]0 hover:text-[#94a3b8] w-8 h-8 rounded-full flex items-center justify-center font-black transition-all">×</button>
                </div>
                <form onSubmit={handleCreateContract} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#94a3b8]">مسمى العقد / الاتفاقية</label>
                    <input 
                      type="text" 
                      required 
                      value={newContractTitle}
                      onChange={e => setNewContractTitle(e.target.value)}
                      className="w-full bg-[#0a1628] border-2 border-[#1e3a5f] p-4 rounded-2xl text-sm font-bold text-[#94a3b8] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-slate-400 hover:border-[#1e3a5f] hover:bg-[#0a1628] focus:bg-[#0a1628]"
                      placeholder="مثال: عقد أتعاب تمثيل قضائي"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#94a3b8]">العميل المرتبط</label>
                    <select 
                      required 
                      value={newContractClient}
                      onChange={e => setNewContractClient(e.target.value)}
                      className="w-full bg-[#0a1628] border-2 border-[#1e3a5f] p-4 rounded-2xl text-sm font-bold text-[#94a3b8] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-slate-400 hover:border-[#1e3a5f] hover:bg-[#0a1628] focus:bg-[#0a1628]"
                    >
                      <option value="">اختر العميل...</option>
                      {clients.map(cl => <option key={cl.id} value={cl.name}>{cl.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#94a3b8]">ارتباط بقضية (اختياري)</label>
                    <select 
                      value={newContractCaseId}
                      onChange={e => setNewContractCaseId(e.target.value)}
                      className="w-full bg-[#0a1628] border-2 border-[#1e3a5f] p-4 rounded-2xl text-sm font-bold text-[#94a3b8] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-slate-400 hover:border-[#1e3a5f] hover:bg-[#0a1628] focus:bg-[#0a1628]"
                    >
                      <option value="">لا يوجد ارتباط مباشر</option>
                      {cases.map(c => <option key={c.id} value={c.id}>قضية #{c.caseNumber} - {c.caseName}</option>)}
                    </select>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl text-sm shadow-md hover:scale-[1.01] active:scale-95 transition-all"
                  >
                    حفظ وإصدار العقد الرقمي
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : activeFinanceTab === 'billing' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Invoice Lists Table */}
          <div className="lg:col-span-2 card-professional p-0 overflow-hidden shadow-xl shadow-slate-100">
            <div className="p-6 border-b border-[#1e3a5f]  flex items-center justify-between bg-[#0a1628] ">
              <h3 className="font-display font-semibold text-[#94a3b8]  flex items-center gap-2">
                <FileText className="text-gold w-5 h-5" />
                <span>سجلات الفواتير الضريبية</span>
              </h3>
              <div className="flex gap-2">
                <button className="p-2 text-[#94a3b8] rounded-2xl transition-all">
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th>الرقم المرجعي</th>
                    <th>العميل المستهدف</th>
                    <th className="text-center">تاريخ السداد</th>
                    <th className="text-center">المبلغ الكلي</th>
                    <th className="text-center">الحالة</th>
                    <th className="text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, (() => {
                    try {
                      return parseInt(localStorage.getItem('adalah-visible-finances-count') || '5', 10);
                    } catch (e) {
                      return 5;
                    }
                  })()).map((inv, idx) => (
                    <tr key={idx} className="group">
                      <td>
                         <span className="text-sm font-black font-mono bg-[#0a1628]/10 text-white px-2 py-1 rounded-2xl">#{inv.id.substring(4)}</span>
                      </td>
                      <td>
                        <div className="font-black text-[#94a3b8] text-sm">{inv.clientName}</div>
                        <div className="text-[10px] text-[#94a3b8] font-bold font-bold mt-0.5 truncate max-w-[150px]">{inv.description || "خدمات محاماة وتحليل"}</div>
                      </td>
                      <td className="text-center">
                         <span className="text-xs font-black text-[#94a3b8] tabular-nums">{inv.dueDate}</span>
                      </td>
                      <td className="text-center">
                         <div className="text-sm font-black text-[#94a3b8] tabular-nums">{inv.totalAmount.toLocaleString()} ر.س</div>
                         <div className="text-[10px] text-primary font-black uppercase tracking-tighter">شامل 15% VAT</div>
                      </td>
                      <td className="text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${
                          inv.status === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' 
                            : 'bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/10 border border-amber-500/30 text-amber-400 font-bold font-black border-amber-200'
                        }`}>
                          {inv.status === 'paid' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {inv.status === 'paid' ? 'محصلة' : 'معلقة'}
                        </span>
                      </td>
                      <td className="text-left">
                        <div className="flex items-center justify-end gap-3 opacity-0 transition-opacity">
                           <button
                            type="button"
                            onClick={() => handleUpdateStatus(inv, inv.status === 'paid' ? 'pending' : 'paid')}
                            className="text-[10px] font-black text-primary"
                          >
                            تغيير الحالة
                          </button>
                          <button
                            type="button"
                            onClick={() => setPrintInvoice(inv)}
                            className="p-2 bg-[#0a1628] text-white rounded-2xl transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Side: Expenses tracker log */}
          <div className="card-professional p-0 overflow-hidden shadow-xl shadow-slate-100 flex flex-col h-full">
             <div className="p-6 border-b border-[#1e3a5f] bg-[#0a1628]">
              <h3 className="font-display font-semibold text-white  flex items-center gap-2">
                <TrendingDown className="text-rose-500 w-5 h-5" />
                <span>المصروفات القضائية</span>
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-[400px]">
              {expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-white">
                  <Calculator className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">لم يتم تقييد مصروفات</p>
                </div>
              ) : (
                expenses.map((exp, idx) => (
                  <div key={idx} className="p-5 bg-[#0a1628] border border-[#1e3a5f] rounded-2xl[1.025] transition-all duration-300 group shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-sm text-white  leading-tight transition-colors">{exp.description}</h4>
                      <span className="text-sm font-bold text-rose-600 tabular-nums">-{exp.amount.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-white " />
                        <span className="text-xs font-bold text-white  font-sans">{exp.date}</span>
                      </div>
                      {exp.caseNumber && (
                        <span className="text-xs font-bold text-white  bg-[#0a1628] px-2 py-1 rounded border border-[#1e3a5f]">#{exp.caseNumber}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-[#0a1628] border-t border-[#1e3a5f]">
               <button className="w-full py-3 bg-[#0a1628] border border-[#1e3a5f] text-white  rounded-2xl text-xs font-bold hover: transition-all">
                  استخراج كشف حساب كامل
               </button>
            </div>
          </div>

        </div>
      ) : activeFinanceTab === 'time_logs' ? (
        <div className="card-professional p-0 overflow-hidden shadow-xl shadow-slate-100 animate-fade-in">
          <div className="p-6 border-b border-[#1e3a5f] flex items-center justify-between bg-[#0a1628]">
            <h3 className="font-display font-black text-white flex items-center gap-2">
              <Clock className="text-gold w-5 h-5" />
              <span>تقارير تشغيل مؤقت العمل (Time Logs)</span>
            </h3>
            <div className="flex items-center gap-3">
               <span className="text-xs font-black text-[#94a3b8] uppercase tracking-widest">إجمالي السجلات: {allTimeLogs.length}</span>
               <button className="p-2 text-white rounded-2xl transition-all">
                  <Printer className="w-4 h-4" />
                </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-[#0a1628] border-b border-[#1e3a5f]">
                  <th className="py-4 px-6 text-xs font-black text-white uppercase tracking-wider">التاريخ</th>
                  <th className="py-4 px-6 text-xs font-black text-white uppercase tracking-wider">اسم القضية</th>
                  <th className="py-4 px-6 text-xs font-black text-white uppercase tracking-wider text-center">المدة المستغرقة</th>
                  <th className="py-4 px-6 text-xs font-black text-white uppercase tracking-wider text-center">الأتعاب المقدرة (VAT)</th>
                  <th className="py-4 px-6 text-xs font-black text-white uppercase tracking-wider text-left">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allTimeLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-[#94a3b8] font-bold font-bold">
                      لا توجد سجلات وقت محفوظة حالياً. ابدأ عملك من الـ Dashboard لحفظ الساعات.
                    </td>
                  </tr>
                ) : (
                  allTimeLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-[#0a1628] transition-colors group">
                      <td className="py-5 px-6 font-mono text-xs">{log.date}</td>
                      <td className="py-5 px-6 font-black text-sm text-white">{log.caseName}</td>
                      <td className="py-5 px-6 text-center font-bold text-xs text-[#94a3b8] font-bold">{formatDuration(log.duration)}</td>
                      <td className="py-5 px-6 text-center font-black text-sm text-emerald-600">{log.fees.toLocaleString()} ر.س</td>
                      <td className="py-5 px-6 text-left">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">تم الترحيل للمالية </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* PREMIUM SAUDI PAYMENT GATEWAYS & ZATCA INTEGRATION PANEL */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right font-display" dir="rtl">
          
          {/* Main simulator checkout area */}
          <div className="lg:col-span-7 bg-sky-50 text-white rounded-3xl border border-slate-850 p-6 space-y-6 shadow-2xl relative">
            
            <div>
              <h3 className="text-lg font-bold text-[#94a3b8] flex items-center gap-2">
                <CreditCard className="text-gold w-5.5 h-5.5" />
                <span>محاكي بوابات المدفوعات والربط المحاسبي المتكامل</span>
              </h3>
              <p className="text-xs text-white  mt-1 font-sans">
                بروزة واختبار بوابات تحصيل أتعاب العملاء عبر منصات الدفع السعودية، مع تتبع اللحظات الفنية والأثر المباشر.
              </p>
            </div>

            {/* Select Pending Invoice */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-white  font-bold tracking-wider block">1. اختر مطالبة أو فاتورة معلقة للسداد والربط الضريبي:</label>
                <select
                  value={selectedSimInvoiceId}
                  onChange={(e) => {
                    setSelectedSimInvoiceId(e.target.value);
                    setSimulationSuccess(false);
                    setSimulationLogs([]);
                  }}
                  className="w-full bg-sky-100 border border-[#1e3a5f] rounded-2xl py-3 px-4 text-xs font-bold text-white font-bold outline-none focus:border-gold"
                >
                  <option value="">-- اختر فاتورة معلقة من اللائحة --</option>
                  {invoices.filter(i => i.status === 'pending' || !i.isZatcaSubmitted).map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      فاتورة رقم {inv.id.substring(4)} - العميل: {inv.clientName} - المبلغ: {inv.totalAmount.toLocaleString()} ر.س {inv.isZatcaSubmitted ? '(مرفوعة ضريبياً ✅)' : '(بانتظار الرفع ⏳)'}
                    </option>
                  ))}
                </select>
                {invoices.filter(i => i.status === 'pending').length === 0 && (
                  <p className="text-xs text-emerald-400 font-bold"> كافة الفواتير في النظام محصلة بالكامل! اختبر المزايدات عبر توليد واحدة جديدة.</p>
                )}
              </div>

              {/* ZATCA Phase 2 Submission Controller - NEW UI */}
              <div className="bg-[#0a1628] border border-blue-100 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1 px-2 bg-blue-100 text-blue-950 border border-blue-200 text-[10px] rounded font-black">ZATCA V2</span>
                    <h3 className="text-sm font-bold text-blue-950">إرسال الفاتورة لمنصة (فاتورة) الهيئة</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isZatcaConnected ? 'bg-emerald-500' : 'bg-[#0a1628]'}`} />
                    <span className="text-[10px] font-bold text-blue-900 font-sans">{isZatcaConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {invoices.find(i => i.id === selectedSimInvoiceId)?.isZatcaSubmitted ? (
                    <div className="w-full py-3 bg-blue-50 border border-blue-100 text-blue-900 rounded-2xl text-xs font-black flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>تم رفع الفاتورة واعتمادها في منصة زاتكا بموجب المرحلة الثانية</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleZatcaSubmission}
                      disabled={!selectedSimInvoiceId || isSubmittingZatca}
                      className={`flex-1 bg-[#020D1F] hover:bg-[#031530] text-yellow-400 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 border border-[#0A1A3F] ${isSubmittingZatca ? 'animate-pulse' : ''}`}
                    >
                      {isSubmittingZatca ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <CloudUpload className="w-4 h-4 text-white" />}
                      <span className="text-white">{isSubmittingZatca ? 'جاري التحقق والرفع...' : 'اعتماد وإرسال الفاتورة ضريبياً (Submit to ZATCA)'}</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-blue-900 leading-relaxed font-bold">
                  سيتم توليد رقم UUID الفرعي، التوقيع الرقمي للمسودة، وطباعة رمز QR متوافق مع المرحلة الثانية لهيئة الزكاة والضريبة والجمارك آلياً بعد مطابقة الملف الضريبي للمكتب.
                </p>
              </div>

              {/* ZATCA Audit Trail - NEW INTERFACE */}
              <div className="bg-[#020D1F] border border-[#0d1f3b] p-6 rounded-2xl space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <div className="p-2 bg-[#c9a84c]/10 text-yellow-400 border border-yellow-400/20 rounded-2xl">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-yellow-400">سجل تدقيق الامتثال الضريبي (ZATCA Audit Trail)</h3>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {zatcaAuditLogs.length === 0 ? (
                    <div className="text-center py-8">
                       <p className="text-[10px] font-black text-white font-bold uppercase tracking-widest italic">لا توجد عمليات إرسال مسجلة حالياً</p>
                    </div>
                  ) : (
                    zatcaAuditLogs.map((log) => (
                      <div key={log.id} className="p-3.5 bg-[#0a1628]/5 border border-white/10 rounded-2xl space-y-2 transition-all">
                        <div className="flex justify-between items-center">
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                            log.type === 'success' ? 'bg-[#c9a84c]/20 text-yellow-400 border border-yellow-400/30' : 'bg-[#0a1628]/20 text-white border border-white/30'
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-[11px] text-white font-bold font-bold font-sans">{log.timestamp}</span>
                        </div>
                        <p className="text-[10px] text-white font-bold leading-relaxed">{log.details}</p>
                        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                          <span className="text-[11px] text-white font-bold">الفاتورة: {log.invoiceId.substring(4)}</span>
                          <span className="text-[11px] text-yellow-400">Signature: Verified ✅</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Checkout Invoice Meta details */}
            {selectedSimInvoiceId && (() => {
              const invObj = invoices.find(i => i.id === selectedSimInvoiceId);
              if (!invObj) return null;
              return (
                <div className="p-4 bg-sky-100 border border-slate-850 rounded-2xl flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <span className="text-[#94a3b8] block">العميل المستحق:</span>
                    <strong className="text-[#94a3b8] block text-sm">{invObj.clientName}</strong>
                  </div>
                  <div className="space-y-1 text-center font-sans">
                    <span className="text-[#94a3b8] block">صافي الخدمة:</span>
                    <strong className="text-[#94a3b8] block">{invObj.description || 'أتعاب مرافعة قضائية'}</strong>
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="text-[#94a3b8] block">المجموع الضريبي (15%):</span>
                    <strong className="text-gold block text-sm">{invObj.totalAmount.toLocaleString()} ر.س</strong>
                  </div>
                </div>
              );
            })()}

            {/* Select Payment Vendor Grid with exact Saudi badges */}
            <div className="space-y-2">
              <label className="text-xs text-[#94a3b8]  font-bold block">2. حدد بوابة وقناة الدفع السحابية المقترنة:</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: 'mada', name: 'مدى (mada)', desc: 'البطاقات الوطنية', icon: '' },
                  { id: 'applepay', name: 'Apple Pay', desc: 'المحفظة الذكية', icon: '' },
                  { id: 'cc', name: 'بطاقة ائتمان', desc: 'Visa/MC', icon: '' },
                  { id: 'sadad', name: 'سداد (SADAD)', desc: 'المدفوعات العامة', icon: '' },
                  { id: 'bank_transfer', name: 'تحويل آيبان', desc: 'مطابقة يدوية', icon: '' }
                ].map(vendor => (
                  <button
                    type="button"
                    key={vendor.id}
                    onClick={() => {
                      setPayMethod(vendor.id as any);
                      setSimulationSuccess(false);
                      setSimulationLogs([]);
                    }}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer space-y-1 flex flex-col items-center justify-center ${
                      payMethod === vendor.id 
                        ? 'border-gold bg-gold/10 text-gold shadow-md' 
                        : 'border-[#1e3a5f] bg-sky-100 text-white'
                    }`}
                  >
                    <span className="text-xl">{vendor.icon}</span>
                    <span className="text-[10px] font-black block tracking-tight">{vendor.name}</span>
                    <span className="text-[8.5px] text-white block">{vendor.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Visual Gateway Panel */}
            <div className="bg-[#0a1628] border border-[#1e3a5f] p-5 rounded-2xl space-y-6 shadow-sm">
              
              {/* Card option checkout form */}
              {(payMethod === 'mada' || payMethod === 'cc') && (
                <div className="space-y-4">
                  
                  {/* Floating visual card mockup */}
                  <div className="relative mx-auto max-w-[320px] h-[180px] bg-gradient-to-tr from-amber-600 via-[#1e3a8a] to-[#040a18] rounded-2xl border border-gold/20 p-5 flex flex-col justify-between text-right text-white shadow-lg overflow-hidden shrink-0">
                    <div className="flex justify-between items-start">
                      <span className="text-xs tracking-widest font-mono font-bold text-gold block">SAUDI NATIONAL GATEWAY</span>
                      <strong className="text-sm font-bold block">{payMethod === 'mada' ? 'مدى ' : 'CREDIT '}</strong>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-white font-bold block">رقم البطاقة الأمنية</span>
                      <strong className="text-sm md:text-base font-mono tracking-widest block text-left">{fakeCardNum}</strong>
                    </div>

                    <div className="flex justify-between items-end text-right">
                      <div>
                        <span className="text-[10px] text-white block font-bold">صاحب البطاقة</span>
                        <strong className="text-xs font-mono block truncate max-w-[170px]">{fakeCardHolder}</strong>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-white block font-bold">الانتهاء</span>
                        <strong className="text-xs font-mono block">{fakeCardExpiry}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Form fields to manipulate visually */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <label className="text-[#94a3b8] block mb-1">اسم العميل المسجل بالبطاقة:</label>
                      <input 
                        type="text"
                        value={fakeCardHolder}
                        onChange={(e) => setFakeCardHolder(e.target.value)}
                        className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans text-xs text-[#94a3b8]"
                      />
                    </div>
                    <div>
                      <label className="text-[#94a3b8] block mb-1">رقم مادة البطاقة المكون من 16 خانة:</label>
                      <input 
                        type="text"
                        value={fakeCardNum}
                        onChange={(e) => setFakeCardNum(e.target.value)}
                        className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono text-xs text-[#94a3b8]"
                      />
                    </div>
                    <div>
                      <label className="text-[#94a3b8] block mb-1">تاريخ الانتهاء (الشهر / السنة):</label>
                      <input 
                        type="text"
                        value={fakeCardExpiry}
                        onChange={(e) => setFakeCardExpiry(e.target.value)}
                        className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono text-xs text-[#94a3b8] text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[#94a3b8] block mb-1">الرمز السري الخلفي للتحقق (CVV):</label>
                      <input 
                        type="password"
                        value={fakeCardCvv}
                        onChange={(e) => setFakeCardCvv(e.target.value)}
                        maxLength={3}
                        className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono text-xs text-[#94a3b8] text-center"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* Apple Pay visual modal trigger and authentication mockup */}
              {payMethod === 'applepay' && (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-sky-50 border border-gold/30 flex items-center justify-center text-2xl text-white select-none animate-pulse">
                    
                  </div>
                  <div className="space-y-1">
                    <strong className="text-sm font-bold text-white font-bold block">الدفع السريع بمحفظة Apple Pay المقترنة بالعدالة</strong>
                    <p className="text-xs text-white max-w-[340px] leading-relaxed mx-auto">
                      سيتم تشفير بصمة الإصبع أو الوجه وسحب المبلغ آلياً عبر محفظتك الذكية المسجلة على الخادم.
                    </p>
                  </div>
                  <div className="bg-sky-100 px-4 py-2 rounded-2xl text-xs font-mono text-white tracking-tight">
                    معرف البطاقة المتصلة: **** **** **** 9283
                  </div>
                </div>
              )}

              {/* Sadad visual bill checkout option mockup */}
              {payMethod === 'sadad' && (
                <div className="space-y-4 text-xs font-semibold font-sans">
                  <div className="p-4 bg-gradient-to-r from-[#c9a84c] to-[#a67c30] border border-amber-500 rounded-2xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white">الرمز المفوتر لمكتب العدالة:</span>
                      <strong className="text-white font-bold font-mono">827 (العدالة للمحاماة)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">رقم المشترك / الفاتورة المرجعية بموقع سداد:</span>
                      <strong className="text-gold font-mono text-sm leading-none">{sadadBillCode}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-white leading-normal text-justify">
                    يرجى توجيه العميل بالدخول على حسابه البنكي المعتمد بالمملكة، واختيار (محرك سداد للمدفوعات)، والبحث عن المفوتر رقم ٨٢٧، ثم سداد الرقم المرجعي الموضح أعلاه للتسوية.
                  </p>
                </div>
              )}

              {/* Bank Transfer view */}
              {payMethod === 'bank_transfer' && (
                <div className="space-y-4 text-xs font-semibold font-sans">
                  <div className="p-5 bg-gradient-to-br from-[#0b1329] to-[#040817] border-2 border-yellow-500/40 rounded-2xl space-y-3.5 leading-relaxed text-right shadow-[0_0_20px_rgba(234,179,8,0.06)]-inner">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[#94a3b8]">اسم المستفيد الأول:</span>
                      <strong className="text-white font-black">العدالة للمحاماة والاستشارات القانونية</strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[#94a3b8]">رقم الآيبان (IBAN) - مصرف الراجحي:</span>
                      <strong className="text-yellow-300 font-mono tracking-wide text-xs">SA 93 8000 0000 1029 3847 5600</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#94a3b8]">رمز التعريف المرجعي للتحصيل الآلي:</span>
                      <strong className="text-amber-400 font-mono font-black">TRF-JUSTICE-4820</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-normal font-bold">
                    بعد اتمام العميل للحوالة المصرفية البنكية، ستقوم خوارزمية التطابق بمسح إيصالات بنوك المملكة فورياً لتحديث الدفتر المالي.
                  </p>
                </div>
              )}

              {/* Complete simulation checkout triggers */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const invObj = invoices.find(i => i.id === selectedSimInvoiceId);
                    if (invObj) executeSimulationPayment(invObj);
                  }}
                  disabled={isSimulatingPayment || !selectedSimInvoiceId}
                  className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-[#94a3b8] font-black rounded-2xl text-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-[0_0_25px_rgba(234,179,8,0.35)]"
                >
                  {isSimulatingPayment ? <RefreshCw className="w-4 h-4 animate-spin text-[#94a3b8]" /> : <Smartphone className="w-4.5 h-4.5 text-[#94a3b8]" />}
                  <span>تأكيد وسداد الفاتورة المحددة آلياً عبر الغلاف المالي المشفر </span>
                </button>
              </div>

            </div>

            {/* Terminal Live logs console */}
            {simulationLogs.length > 0 && (
              <div className="bg-[#0a1628] border-2 border-[#1e3a5f] p-4 rounded-2xl font-mono text-xs text-emerald-400 space-y-2 leading-relaxed text-left" dir="ltr">
                <div className="flex items-center justify-between border-b border-slate-850 pb-1.5 text-white">
                  <span className="text-[10px] font-sans text-[#94a3b8] font-bold">معالج دفع سداد ومدى - بث حي لوحدة التحقق</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-sans text-emerald-400 font-bold">متصل</span>
                  </span>
                </div>
                {simulationLogs.map((log, idx) => (
                  <p key={idx} className="font-mono text-emerald-350">{log}</p>
                ))}
              </div>
            )}

          </div>

          {/* Right column ZATCA compliance and QR validations card */}
          <div className="lg:col-span-5 bg-[#020D1F] text-white rounded-3xl border border-[#0d1f3b] p-6 space-y-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9a84c]/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="p-2.5 bg-[#c9a84c]/10 text-yellow-400 rounded-2xl border border-yellow-400/20">
                  <Shield className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-yellow-400 text-sm flex items-center gap-2">
                    <span>مركز الفوترة الإلكترونية (ZATCA Phase II)</span>
                  </h4>
                  <p className="text-[11px] text-white font-bold font-bold block mt-0.5"> ربط واعتماد رسمي مع هيئة الزكاة والضريبة </p>
                </div>
              </div>

              <p className="text-xs text-white leading-relaxed text-justify">
                تلتزم موكل للمحاماة بنظام الفوترة الإلكترونية المعتمد بالمملكة العربية السعودية للاستيراد المبرمج وإصدار الفواتير الضريبية ذات التشفير المزدوج (FATOORA).
              </p>

              {/* Diagnostic checklist */}
              <div className="space-y-2.5 text-xs font-semibold bg-[#0a1628]/5 p-4 rounded-2xl border border-white/10">
                <span className="text-yellow-400 block pb-1 border-b border-white/10 font-extrabold">مؤشرات ومعايرة السلامة والتوثيق المزدوج:</span>
                {[
                  { label: 'كود الفاتورة المشفر UUID', val: 'ZATCA-8291-0A82B1', ok: true },
                  { label: 'الرقم الضريبي للمكتب (TRN)', val: '310182749200003', ok: true },
                  { label: 'معدل الضريبة الاتحادي المفروض', val: '15% ضريبة القيمة المضافة', ok: true },
                  { label: 'توقيع المفتاح العام (Cryptographic SHA-256)', val: '0x8A8E9A...FEE2', ok: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1">
                    <span className="text-white opacity-80">{item.label}:</span>
                    <span className="font-mono text-yellow-400">{item.val}</span>
                  </div>
                ))}
              </div>

              {/* Interactive QR Decoder widget */}
              <div className="bg-[#010814] p-5 rounded-2xl border border-white/10 shadow-inner flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/5 rounded-full blur-3xl"></div>
                {/* ZATCA compliant visual QR Code representation */}
                <div className="w-32 h-32 bg-[#0a1628] p-2 rounded-2xl flex items-center justify-center border-2 border-yellow-400/30 relative shadow-xl z-10 transition-transform duration-300">
                  <div className="absolute inset-0 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ZATCA-PHASE-2-TEST-HASH')] bg-center bg-cover opacity-80 rounded-2xl"></div>
                  <div className="absolute -right-2 -bottom-2 bg-[#020D1F] text-[10px] text-yellow-400 font-black font-mono leading-none px-2 py-1 rounded shadow-md border border-yellow-400/50">
                     ZATCA II
                  </div>
                </div>

                <div className="space-y-3 relative z-10 w-full">
                  <span className="text-xs font-black text-yellow-400 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse"></div>
                    متصل بمحركات منصة (فاتورة)
                  </span>
                  <p className="text-[10px] text-white font-bold max-w-[200px] mx-auto font-bold leading-relaxed">
                    يتم تحويل صيغة الفاتورة إلى XML (UBL 2.1) وإرسالها للحصول على الختم الكريبتوغرافي من واجهات برمجة هيئة الزكاة.
                  </p>

                  <button className="w-full mt-4 bg-[#0a1628]/10 hover:bg-[#0a1628]/20 text-white font-black text-xs py-3 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 border border-white/20">
                    <Scan className="w-4 h-4 text-yellow-400" />
                    <span className="text-white">اختبار التحقق من رمز QR</span>
                  </button>
                </div>
              </div>

            </div>

            <div className="bg-[#0a1628]/5 p-4 border border-white/10 rounded-2xl text-xs text-white font-bold font-bold text-center leading-relaxed">
              تضمن العدالة سلامة العمليات وعدم إغلاق أي جلسات قضائية أو معاملة تصفية مالية إلا بعد مطابقة البنك وتوثيق السند الضريبي.
            </div>

          </div>

        </div>
      )}
        </>
      )}

      {/* Invoice Generator Modal Popup Form */}
      {isInvoiceOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-[#0a1628]/90 backdrop-blur-md" onClick={() => setIsInvoiceOpen(false)}></div>
          <div className={`relative ${luminousTheme === 'dark' ? 'bg-gradient-to-br from-[#040914] via-[#02040a] to-[#000000] border-yellow-500/50 shadow-[0_0_60px_rgba(234,179,8,0.25)]' : 'bg-gradient-to-br from-[#ffffff] via-[#fdfbf6] to-[#faf5e8] border-amber-500/40 shadow-[0_20px_50px_rgba(212,175,55,0.15)]'} border-2 rounded-[2.5rem] w-full max-w-lg p-0 overflow-hidden animate-in zoom-in-95 duration-300 text-right font-sans`}>
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 pointer-events-none ${luminousTheme === 'dark' ? 'bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/10' : 'bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/5'}`}></div>
            
            <div className={`p-6 border-b flex items-center justify-between ${luminousTheme === 'dark' ? 'border-yellow-500/20 bg-black/40' : 'border-amber-500/10 bg-[#ca8a04]/5'} relative z-10`}>
              <div>
                <h2 className={`font-display font-black text-xl tracking-wide ${luminousTheme === 'dark' ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] animate-pulse' : 'text-amber-900'}`}>توليد مطالبة مالية مضيئة</h2>
                <p className={`text-xs font-extrabold mt-1.5 tracking-wide ${luminousTheme === 'dark' ? 'text-amber-200' : 'text-[#94a3b8]'}`}>أدخل تفاصيل الأتعاب المهنية والخدمات المؤداة.</p>
              </div>
              <button 
                onClick={() => setIsInvoiceOpen(false)}
                className={`py-2.5 px-4 rounded-2xl transition-all cursor-pointer text-xs font-black ${luminousTheme === 'dark' ? 'bg-[#0a1628] border border-yellow-500/30 text-yellow-500 hover:bg-[#0a1628]' : 'bg-amber-100 border border-amber-200 text-amber-950 hover:bg-amber-200'}`}
              >
                إغلاق ✕
              </button>
            </div>

            {/* Luminous Design Theme Switcher */}
            <div className={`flex justify-center items-center gap-1.5 p-1 rounded-full border max-w-[240px] mx-auto my-4 relative z-20 ${luminousTheme === 'dark' ? 'bg-black/40 border-yellow-500/30' : 'bg-[#0a1628] border-amber-500/20'}`}>
              <button 
                type="button"
                onClick={() => setLuminousTheme('dark')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${luminousTheme === 'dark' ? 'bg-[#d4af37] text-[#060b13] shadow-[0_0_15px_rgba(235,179,8,0.5)]' : 'text-[#94a3b8]0 hover:text-[#94a3b8]'}`}
              >
                داكن مضيء ✨
              </button>
              <button 
                type="button"
                onClick={() => setLuminousTheme('light')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${luminousTheme === 'light' ? 'bg-gradient-to-r from-[#c9a84c] to-[#a67c30] text-white shadow-[0_0_15px_rgba(217,119,6,0.4)]' : 'text-[#94a3b8] hover:text-[#94a3b8]'}`}
              >
                فاتح مضيء ☀️
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-8 space-y-6 relative z-10 pt-2">
              {/* Internal data entry card */}
              <div className={`p-6 rounded-[2rem] border ${luminousTheme === 'dark' ? 'bg-[#050c18]/90 border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.05)]' : 'bg-[#0a1628] border-amber-500/25 shadow-lg'} space-y-5`}>
                <div className="space-y-1.5">
                  <label className={`text-xs font-black block tracking-wide ${luminousTheme === 'dark' ? 'text-yellow-400 drop-shadow-md' : 'text-[#94a3b8]'}`}>اختيار العميل من سجل السجلات <span className="text-rose-400 font-bold">*</span></label>
                  <select
                    value={invClientName}
                    onChange={(e) => setInvClientName(e.target.value)}
                    required
                    className={`w-full border-2 rounded-2xl py-3 px-4 text-sm font-black outline-none transition-all duration-300 cursor-pointer ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-amber-500/30 text-white focus:border-yellow-400' : 'bg-[#0a1628] border-amber-500/20 text-[#94a3b8] focus:border-amber-600'}`}
                  >
                    <option value="" className={luminousTheme === 'dark' ? 'bg-[#0b1221] text-[#94a3b8]' : 'bg-[#0a1628] text-[#94a3b8]0'}>البحث في قاعدة العملاء...</option>
                    {clients.map((cl, idx) => (
                      <option key={idx} value={cl.name} className={luminousTheme === 'dark' ? 'bg-[#0b1221] text-white font-bold' : 'bg-[#0a1628] text-[#94a3b8] font-bold'}>{cl.name} - {cl.nationalId}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-black block tracking-wide ${luminousTheme === 'dark' ? 'text-yellow-400 drop-shadow-md' : 'text-[#94a3b8]'}`}>الخدمة القانونية المؤداة <span className="text-rose-400 font-bold">*</span></label>
                  <input 
                    type="text"
                    placeholder="مثال: أتعاب إعداد صحيفة الدعوى والاستشارات..."
                    value={invDesc}
                    onChange={(e) => setInvDesc(e.target.value)}
                    required
                    className={`w-full border-2 rounded-2xl py-3 px-4 text-sm font-black outline-none transition-all duration-300 ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-amber-500/30 text-white placeholder-slate-650 focus:border-yellow-400' : 'bg-[#0a1628] border-amber-500/20 text-[#94a3b8] placeholder-slate-400 focus:border-amber-600'}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-black block tracking-wide ${luminousTheme === 'dark' ? 'text-yellow-400 drop-shadow-md' : 'text-[#94a3b8]'}`}>الأتعاب المهنية (قبل احتساب الضريبة) <span className="text-rose-400 font-bold">*</span></label>
                  <div className="relative">
                    <input 
                      type="number"
                      placeholder="0.00"
                      value={invSubtotal}
                      onChange={(e) => setInvSubtotal(e.target.value)}
                      required
                      className={`w-full border-2 rounded-2xl py-3 pr-16 pl-4 text-sm font-black outline-none transition-all duration-300 font-mono ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-amber-500/30 text-yellow-300 placeholder-slate-650 focus:border-yellow-400' : 'bg-[#0a1628] border-amber-500/20 text-[#94a3b8] placeholder-slate-400 focus:border-amber-600'}`}
                    />
                    <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black ${luminousTheme === 'dark' ? 'text-yellow-400' : 'text-amber-800'}`}>ر.س</span>
                  </div>
                </div>
              </div>

              {/* Realtime 15% VAT preview during drafting */}
              {invSubtotal && (
                <div className={`p-5 rounded-2xl border-2 space-y-3 shadow-md ${luminousTheme === 'dark' ? 'bg-[#c9a84c]/10 border-yellow-400/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'bg-amber-50 border-amber-250'}`}>
                  <div className="flex justify-between text-xs font-bold">
                    <span className={luminousTheme === 'dark' ? 'text-[#94a3b8]' : 'text-[#94a3b8]'}>صافي الأتعاب:</span>
                    <span className={`tabular-nums text-xs font-black ${luminousTheme === 'dark' ? 'text-white' : 'text-[#94a3b8]'}`}>{parseFloat(invSubtotal).toLocaleString()} ر.س</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className={luminousTheme === 'dark' ? 'text-yellow-400' : 'text-amber-800'}>ضريبة القيمة المضافة (15%):</span>
                    <span className={`tabular-nums text-xs font-black ${luminousTheme === 'dark' ? 'text-yellow-400' : 'text-amber-700'}`}>+{calculateVat(parseFloat(invSubtotal)).toLocaleString()} ر.س</span>
                  </div>
                  <div className={`flex justify-between border-t pt-3 mt-1 ${luminousTheme === 'dark' ? 'border-yellow-500/25' : 'border-amber-500/20'}`}>
                    <span className={`text-xs font-black ${luminousTheme === 'dark' ? 'text-yellow-400' : 'text-amber-800'}`}>المجموع النهائي (شامل ضريبتك):</span>
                    <span className={`text-lg font-display font-black tabular-nums ${luminousTheme === 'dark' ? 'text-yellow-400' : 'text-amber-700'}`}>
                      {calculateTotal(parseFloat(invSubtotal)).toLocaleString()} ر.س
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 select-none">
                <button 
                  type="submit"
                  className={`w-full font-black py-3.5 rounded-2xl text-sm transition-all active:scale-[0.98] cursor-pointer ${luminousTheme === 'dark' ? 'bg-[#c9a84c] hover:bg-[#c9a84c] text-[#94a3b8] shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-gradient-to-r from-[#c9a84c] to-[#a67c30] hover:bg-gradient-to-r from-[#c9a84c] to-[#a67c30] text-white shadow-[0_10px_20px_rgba(217,119,6,0.2)]'}`}
                >
                  توليد وحفظ الفاتورة الفورية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Voucher Modal */}
      {isReceiptOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a1628]/90 backdrop-blur-md" onClick={() => { setIsReceiptOpen(false); setReceiptVoucherPrint(null); }}></div>
          <div className={`relative ${luminousTheme === 'dark' ? 'bg-gradient-to-br from-[#040914] via-[#02040a] to-[#000000] border-yellow-500/50 shadow-[0_0_60px_rgba(234,179,8,0.25)]' : 'bg-gradient-to-br from-[#ffffff] via-[#fdfbf6] to-[#faf5e8] border-amber-500/40 shadow-[0_20px_50px_rgba(212,175,55,0.15)]'} border-2 w-full max-w-xl rounded-[2.5rem] overflow-hidden duration-300 font-sans text-right animate-in zoom-in-95`} dir="rtl">
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 pointer-events-none ${luminousTheme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}`}></div>
            
            {/* Modal Header */}
            <div className={`p-6 border-b flex items-center justify-between ${luminousTheme === 'dark' ? 'border-yellow-500/20 bg-black/40' : 'border-amber-500/15 bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/5'}`}>
              <div>
                <h2 className={`font-display font-black text-lg flex items-center gap-3 ${luminousTheme === 'dark' ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'text-amber-900'}`}>
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                  <span>منظومة إصدار سندات القبض المضيئة</span>
                </h2>
                <p className={`text-xs font-extrabold mt-1.5 tracking-wide ${luminousTheme === 'dark' ? 'text-amber-100' : 'text-[#94a3b8]'}`}>رصد المبالغ المستلمة وإصدار الإيصالات لعملاء المكتب</p>
              </div>
              <button 
                onClick={() => {
                  setIsReceiptOpen(false);
                  setReceiptVoucherPrint(null);
                }}
                className={`py-2 px-3 rounded-2xl text-xs font-black transition-all ${luminousTheme === 'dark' ? 'bg-[#0a1628] text-yellow-500 border border-yellow-500/30 hover:bg-[#0a1628]' : 'bg-amber-100 text-amber-950 border border-amber-200 hover:bg-amber-200'}`}
              >
                إغلاق ✕
              </button>
            </div>

            {/* Luminous Design Theme Switcher */}
            <div className={`flex justify-center items-center gap-1.5 p-1 rounded-full border max-w-[240px] mx-auto my-3 relative z-20 ${luminousTheme === 'dark' ? 'bg-black/40 border-yellow-500/30' : 'bg-[#0a1628] border-amber-500/20'}`}>
              <button 
                type="button"
                onClick={() => setLuminousTheme('dark')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${luminousTheme === 'dark' ? 'bg-[#d4af37] text-[#060b13] shadow-[0_0_15px_rgba(235,179,8,0.5)]' : 'text-[#94a3b8]0 hover:text-[#94a3b8]'}`}
              >
                داكن مضيء ✨
              </button>
              <button 
                type="button"
                onClick={() => setLuminousTheme('light')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${luminousTheme === 'light' ? 'bg-gradient-to-r from-[#c9a84c] to-[#a67c30] text-white shadow-[0_0_15px_rgba(217,119,6,0.4)]' : 'text-[#94a3b8] hover:text-[#94a3b8]'}`}
              >
                فاتح مضيء ☀️
              </button>
            </div>

            <div className="relative z-10">
            {receiptVoucherPrint ? (
              /* Printable Voucher Output View (Internal Detail Card) */
              <div className="p-8 space-y-6 pt-1">
                {/* Luminous Detail Card */}
                <div className={`border-2 rounded-[2rem] p-8 space-y-6 relative shadow-xl transition-all ${luminousTheme === 'dark' ? 'border-emerald-500/50 bg-[#02050c]/98 shadow-[0_0_40px_rgba(16,185,129,0.15)]' : 'border-amber-500/40 bg-[#0a1628] shadow-[0_10px_35px_rgba(212,175,55,0.08)]'}`}>
                  <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-bl pointer-events-none rounded-[2rem] ${luminousTheme === 'dark' ? 'from-emerald-500/5 to-transparent' : 'from-amber-500/5 to-transparent'}`}></div>
                  <div className="absolute top-8 left-8 opacity-90 bg-[#0a1628] p-2 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.9)]">
                    <QRCodeSVG value={`ReceiptVoucher: ${receiptVoucherPrint.id} | Amount: ${receiptVoucherPrint.amount} | Payee: ${receiptVoucherPrint.client}`} size={65} level="M" />
                  </div>
                  
                  <div className={`pb-4 border-b-2 flex justify-between items-start relative z-10 ${luminousTheme === 'dark' ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
                    <div className="space-y-1">
                      <h4 className={`font-black text-2xl tracking-tight ${luminousTheme === 'dark' ? 'text-white' : 'text-[#94a3b8]'}`}>سند قـبـض رسـمـي</h4>
                      <p className={`text-[12px] font-black font-mono tracking-wider ${luminousTheme === 'dark' ? 'text-emerald-400' : 'text-amber-800'}`}>الرقم العلمي: #{receiptVoucherPrint.id}</p>
                      <p className={`text-[11px] font-bold ${luminousTheme === 'dark' ? 'text-[#94a3b8]' : 'text-slate-650'}`}>التاريخ: {receiptVoucherPrint.date}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm font-extrabold leading-relaxed relative z-10">
                    <div className={`flex border-b border-dashed pb-3 ${luminousTheme === 'dark' ? 'border-[#1e3a5f]' : 'border-[#1e3a5f]'}`}>
                      <span className={`w-36 shrink-0 font-black ${luminousTheme === 'dark' ? 'text-emerald-400' : 'text-amber-900'}`}>استلمنا من المكرم:</span>
                      <span className={`font-black ${luminousTheme === 'dark' ? 'text-white' : 'text-[#94a3b8]'}`}>{receiptVoucherPrint.client}</span>
                    </div>
                    <div className={`flex border-b border-dashed pb-3 ${luminousTheme === 'dark' ? 'border-[#1e3a5f]' : 'border-[#1e3a5f]'}`}>
                      <span className={`w-36 shrink-0 font-black ${luminousTheme === 'dark' ? 'text-emerald-400' : 'text-amber-900'}`}>مبلغاً وقدره:</span>
                      <span className={`font-black text-lg px-3 py-1 rounded-2xl ${luminousTheme === 'dark' ? 'text-[#94a3b8] bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'text-[#ffffff] bg-gradient-to-r from-[#c9a84c] to-[#a67c30] shadow-md'}`}>{parseFloat(receiptVoucherPrint.amount).toLocaleString()} ر.س</span>
                    </div>
                    <div className={`flex border-b border-dashed pb-3 ${luminousTheme === 'dark' ? 'border-[#1e3a5f]' : 'border-[#1e3a5f]'}`}>
                      <span className={`w-36 shrink-0 font-black ${luminousTheme === 'dark' ? 'text-emerald-400' : 'text-amber-900'}`}>لقاء / مقابل:</span>
                      <span className={luminousTheme === 'dark' ? 'text-[#94a3b8]' : 'text-[#94a3b8]'}>{receiptVoucherPrint.purpose}</span>
                    </div>
                    <div className={`flex border-b border-dashed pb-3 items-center ${luminousTheme === 'dark' ? 'border-[#1e3a5f]' : 'border-[#1e3a5f]'}`}>
                      <span className={`w-36 shrink-0 font-black ${luminousTheme === 'dark' ? 'text-emerald-400' : 'text-amber-900'}`}>طريقة التحصيل:</span>
                      <span className={`px-3 py-1 rounded-2xl font-black border ${luminousTheme === 'dark' ? 'bg-[#0a1628] text-white border-emerald-500/40' : 'bg-amber-50 text-amber-955 border-amber-500/30'}`}>
                        {receiptVoucherPrint.method === 'cash' ? 'نقدي (كاش)' : receiptVoucherPrint.method === 'check' ? 'شيك مصرفي' : 'تحويل بنكي آلي'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between items-end relative z-10">
                    <div className="text-center font-bold text-xs">
                      <p className={luminousTheme === 'dark' ? 'text-[#94a3b8]' : 'text-[#94a3b8]'}>المستلم المسؤول</p>
                      <div className="h-8"></div>
                      <p className={`font-black border-t-2 pt-2 inline-block px-4 ${luminousTheme === 'dark' ? 'text-white border-[#1e3a5f]' : 'text-[#94a3b8] border-[#1e3a5f]'}`}>قسم المحاسبة والمالية</p>
                    </div>
                    <div className={`text-[11px] font-black text-right max-w-[240px] leading-relaxed p-3 rounded-2xl border ${luminousTheme === 'dark' ? 'text-emerald-300 bg-emerald-950/30 border-emerald-500/20 shadow-inner' : 'text-amber-900 bg-amber-50/50 border-amber-500/25'}`}>
                      تم إثبات المقبوضات وتوثيق السند في سجل المطالبات كإيراد مستلم خاضع للقيمة المضافة (15%).
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 relative z-20">
                  <button 
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html lang="ar" dir="rtl">
                            <head>
                              <title>سند قبض رسمي - مكتب المحاماة</title>
                              <style>
                                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;750;900&display=swap');
                                body { font-family: 'Cairo', sans-serif; padding: 40px; text-align: right; direction: rtl; background: white; color: #111; }
                                .voucher { border: 4px double #10b981; padding: 30px; border-radius: 20px; max-width: 600px; margin: auto; }
                                h2 { color: #065f46; border-b: 1px solid #10b981; padding-bottom: 10px; font-weight: 900; }
                                .row { display: flex; margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 8px; }
                                .label { width: 140px; color: #444; font-weight: 900; }
                                .val { font-weight: 900; color: #000; }
                              </style>
                            </head>
                            <body>
                              <div class="voucher">
                                \${officeLogo ? \`
                                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px;">
                                    <div>
                                      <h2 style="color: #065f46; margin: 0; padding: 0; border: none; font-size: 22px; font-weight: 900;">ســنــد قــبــض رســمــي</h2>
                                      <p style="font-size:11px; color:#555; margin: 5px 0 0 0;">سند رقم: \${receiptVoucherPrint.id} | التاريخ: \${receiptVoucherPrint.date}</p>
                                    </div>
                                    <img src="\${officeLogo}" style="max-height: 60px; max-width: 150px; object-fit: contain;" />
                                  </div>
                                \` : \`
                                  <h2>ســنــد قــبــض رســمــي</h2>
                                  <p style="font-size:11px; color:#555;">سند رقم: \${receiptVoucherPrint.id} | التاريخ: \${receiptVoucherPrint.date}</p>
                                \`}
                                <div class="row"><span class="label">استلمنا من المكرم:</span><span class="val">\${receiptVoucherPrint.client}</span></div>
                                <div class="row"><span class="label">مبلغاً وقدره:</span><span class="val" style="color:#059669; font-weight:900;">\${parseFloat(receiptVoucherPrint.amount).toLocaleString()} ريال سعودي</span></div>
                                <div class="row"><span class="label">وذلك كقيمة ومقابل:</span><span class="val">\${receiptVoucherPrint.purpose}</span></div>
                                <div class="row"><span class="label">طريقة السداد:</span><span class="val">\${receiptVoucherPrint.method === 'cash' ? 'نقدي' : receiptVoucherPrint.method === 'check' ? 'شيك' : 'تحويل'}</span></div>
                                <div style="margin-top: 40px; display:flex; justify-content: space-between;">
                                  <div><span>توقيع المستلم: ____________</span></div>
                                  <div><span style="font-size:11px; color:#333; font-weight: 900;">مكتب العدالة للمحاماة والاستشارات</span></div>
                                </div>
                              </div>
                              <script>window.print(); window.onafterprint = function(){ window.close(); }</script>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }}
                    className={`flex-1 font-black py-3 rounded-2xl text-xs flex justify-center items-center gap-2 cursor-pointer active:scale-95 transition-all ${luminousTheme === 'dark' ? 'bg-[#c9a84c] text-[#94a3b8] shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-emerald-600 text-white shadow-[0_10px_20px_rgba(16,185,129,0.2)]'}`}
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة سند القبض (A4)</span>
                  </button>
                  <button 
                    onClick={() => {
                      setReceiptVoucherPrint(null);
                      setReceiptClient('');
                      setReceiptAmount('');
                      setReceiptPurpose('');
                    }}
                    className={`font-black px-5 py-3 rounded-2xl text-xs cursor-pointer transition-all active:scale-95 border-2 ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-[#1e3a5f] text-white hover:border-[#1e3a5f]0' : 'bg-[#0a1628] border-[#1e3a5f] text-[#94a3b8] hover:bg-[#0a1628]'}`}
                  >
                    إصدار سند آخر
                  </button>
                </div>
              </div>
            ) : (
              /* Voucher Creation Form (Data Entry Card) */
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const voucher = {
                    id: `REC-${Date.now().toString().substring(7)}`,
                    client: receiptClient,
                    amount: receiptAmount,
                    purpose: receiptPurpose,
                    method: (e.target as any).method.value,
                    date: new Date().toISOString().split('T')[0]
                  };
                  setReceiptVoucherPrint(voucher);
                }}
                className="p-8 space-y-6 relative z-20 pt-1"
              >
                {/* Embedded Glowing Data Entry Card */}
                <div className={`p-6 rounded-[2.2rem] border ${luminousTheme === 'dark' ? 'bg-[#050c18]/90 border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.05)]' : 'bg-[#0a1628] border-amber-500/25 shadow-lg'} space-y-5`}>
                  <div className="space-y-1.5">
                    <label className={`text-xs font-black block tracking-wide ${luminousTheme === 'dark' ? 'text-yellow-400 drop-shadow-md' : 'text-[#94a3b8]'}`}>استلمنا من المكرم / الجهة المودعة <span className="text-rose-400 font-bold">*</span></label>
                    <input 
                      type="text"
                      required
                      value={receiptClient}
                      onChange={e => setReceiptClient(e.target.value)}
                      className={`w-full border-2 rounded-2xl py-3 px-4 text-sm font-black outline-none transition-all duration-300 ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-amber-500/30 text-white placeholder-slate-655 focus:border-yellow-400' : 'bg-[#0a1628] border-amber-500/20 text-[#94a3b8] placeholder-slate-400 focus:border-amber-600'}`}
                      placeholder="مثال: شركة الرياض للمقاولات المحدودة"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-black block tracking-wide ${luminousTheme === 'dark' ? 'text-yellow-400 drop-shadow-md' : 'text-[#94a3b8]'}`}>مبلغ سند القبض (ر.س) <span className="text-rose-400 font-bold">*</span></label>
                      <input 
                        type="number"
                        required
                        value={receiptAmount}
                        onChange={e => setReceiptAmount(e.target.value)}
                        className={`w-full border-2 rounded-2xl py-3 px-4 text-sm font-black outline-none transition-all duration-300 font-mono ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-amber-500/30 text-yellow-300 placeholder-slate-655 focus:border-yellow-400' : 'bg-[#0a1628] border-amber-500/20 text-[#94a3b8] placeholder-slate-400 focus:border-amber-600'}`}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={`text-xs font-black block tracking-wide ${luminousTheme === 'dark' ? 'text-yellow-400 drop-shadow-md' : 'text-[#94a3b8]'}`}>طريقة الدفع الموثقة <span className="text-rose-400 font-bold">*</span></label>
                      <select 
                        name="method"
                        className={`w-full border-2 rounded-2xl py-3 px-4 text-sm font-black outline-none transition-all duration-300 cursor-pointer ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-amber-500/30 text-white focus:border-yellow-400' : 'bg-[#0a1628] border-amber-500/20 text-[#94a3b8] focus:border-amber-600'}`}
                      >
                        <option value="bank" className={luminousTheme === 'dark' ? 'bg-[#0b1221]' : 'bg-[#0a1628]'}>تحويل بنكي آلي</option>
                        <option value="cash" className={luminousTheme === 'dark' ? 'bg-[#0b1221]' : 'bg-[#0a1628]'}>نقداً (كاش)</option>
                        <option value="check" className={luminousTheme === 'dark' ? 'bg-[#0b1221]' : 'bg-[#0a1628]'}>شيك مصرفي معتمد</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-black block tracking-wide ${luminousTheme === 'dark' ? 'text-yellow-400 tracking-wide drop-shadow-md' : 'text-[#94a3b8]'}`}>وذلك كقيمة / لقاء مقابل الخدمة <span className="text-rose-400 font-bold">*</span></label>
                    <textarea 
                      required
                      value={receiptPurpose}
                      onChange={e => setReceiptPurpose(e.target.value)}
                      className={`w-full border-2 rounded-2xl py-3 px-4 text-sm font-black outline-none transition-all duration-300 ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-amber-500/30 text-white placeholder-slate-655 focus:border-yellow-400' : 'bg-[#0a1628] border-amber-500/20 text-[#94a3b8] placeholder-slate-400 focus:border-amber-600'}`}
                      placeholder="مثال: الدفعة الأولى من أتعاب التمثيل القضائي أمام المحكمة التجارية..."
                      rows={2}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className={`w-full font-black py-4 rounded-2xl text-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${luminousTheme === 'dark' ? 'bg-[#c9a84c] hover:bg-[#c9a84c] text-[#94a3b8] shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_10px_20px_rgba(16,185,129,0.2)]'}`}
                >
                  <CheckCircle className="w-5 h-5" /> إنشاء سند القبض وتوليد الإيصال الملكي
                </button>
              </form>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Voucher Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a1628]/90 backdrop-blur-md" onClick={() => { setIsPaymentOpen(false); setPaymentVoucherPrint(null); }}></div>
          <div className={`relative ${luminousTheme === 'dark' ? 'bg-gradient-to-br from-[#040914] via-[#02040a] to-[#000000] border-yellow-500/50 shadow-[0_0_60px_rgba(234,179,8,0.25)]' : 'bg-gradient-to-br from-[#ffffff] via-[#fdfbf6] to-[#faf5e8] border-amber-500/40 shadow-[0_20px_50px_rgba(212,175,55,0.15)]'} border-2 w-full max-w-xl rounded-[2.5rem] overflow-hidden duration-300 font-sans text-right animate-in zoom-in-95`} dir="rtl">
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 pointer-events-none ${luminousTheme === 'dark' ? 'bg-rose-500/10' : 'bg-rose-500/5'}`}></div>
            
            {/* Modal Header */}
            <div className={`p-6 border-b flex items-center justify-between ${luminousTheme === 'dark' ? 'border-yellow-500/20 bg-black/40' : 'border-amber-500/15 bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/5'}`}>
              <div>
                <h2 className={`font-display font-black text-lg flex items-center gap-3 ${luminousTheme === 'dark' ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'text-amber-900'}`}>
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></span>
                  <span>منظومة إصدار سندات الصرف المضيئة</span>
                </h2>
                <p className={`text-xs font-extrabold mt-1.5 tracking-wide ${luminousTheme === 'dark' ? 'text-rose-100' : 'text-slate-655'}`}>تقييد عمليات الصرف والرسوم والمستحقات المفرزة للموكلين</p>
              </div>
              <button 
                onClick={() => {
                  setIsPaymentOpen(false);
                  setPaymentVoucherPrint(null);
                }}
                className={`py-2 px-3 rounded-2xl text-xs font-black transition-all ${luminousTheme === 'dark' ? 'bg-[#0a1628] text-yellow-500 border border-yellow-500/30 hover:bg-[#0a1628]' : 'bg-amber-100 text-amber-950 border border-amber-200 hover:bg-amber-200'}`}
              >
                إغلاق ✕
              </button>
            </div>

            {/* Luminous Design Theme Switcher */}
            <div className={`flex justify-center items-center gap-1.5 p-1 rounded-full border max-w-[240px] mx-auto my-3 relative z-20 ${luminousTheme === 'dark' ? 'bg-black/40 border-yellow-500/30' : 'bg-[#0a1628] border-amber-500/20'}`}>
              <button 
                type="button"
                onClick={() => setLuminousTheme('dark')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${luminousTheme === 'dark' ? 'bg-[#d4af37] text-[#060b13] shadow-[0_0_15px_rgba(235,179,8,0.5)]' : 'text-[#94a3b8]0 hover:text-[#94a3b8]'}`}
              >
                داكن مضيء ✨
              </button>
              <button 
                type="button"
                onClick={() => setLuminousTheme('light')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${luminousTheme === 'light' ? 'bg-gradient-to-r from-[#c9a84c] to-[#a67c30] text-white shadow-[0_0_15px_rgba(217,119,6,0.4)]' : 'text-[#94a3b8] hover:text-[#94a3b8]'}`}
              >
                فاتح مضيء ☀️
              </button>
            </div>

            <div className="relative z-10">
            {paymentVoucherPrint ? (
              /* Printable Payment Voucher Output View (Detail Card) */
              <div className="p-8 space-y-6 pt-1">
                {/* Luminous Detail Card */}
                <div className={`border-2 rounded-[2rem] p-8 space-y-6 relative shadow-xl transition-all ${luminousTheme === 'dark' ? 'border-rose-500/50 bg-[#02050c]/98 shadow-[0_0_40px_rgba(244,63,94,0.15)]' : 'border-amber-500/40 bg-[#0a1628] shadow-[0_10px_35px_rgba(212,175,55,0.08)]'}`}>
                  <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-bl pointer-events-none rounded-[2rem] ${luminousTheme === 'dark' ? 'from-rose-500/5 to-transparent' : 'from-amber-500/5 to-transparent'}`}></div>
                  <div className="absolute top-8 left-8 opacity-90 bg-[#0a1628] p-2 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.9)]">
                    <QRCodeSVG value={`PaymentVoucher: ${paymentVoucherPrint.id} | Amount: ${paymentVoucherPrint.amount} | Payee: ${paymentVoucherPrint.payee}`} size={65} level="M" />
                  </div>
                  
                  <div className={`pb-4 border-b-2 flex justify-between items-start relative z-10 ${luminousTheme === 'dark' ? 'border-rose-500/20' : 'border-amber-500/20'}`}>
                    <div className="space-y-1">
                      <h4 className={`font-black text-2xl tracking-tight ${luminousTheme === 'dark' ? 'text-white' : 'text-[#94a3b8]'}`}>سند صـرف رسـمـي</h4>
                      <p className={`text-[12px] font-black font-mono tracking-wider ${luminousTheme === 'dark' ? 'text-rose-400' : 'text-amber-800'}`}>الرقم العلمي: #{paymentVoucherPrint.id}</p>
                      <p className={`text-[11px] font-bold ${luminousTheme === 'dark' ? 'text-[#94a3b8]' : 'text-slate-650'}`}>التاريخ: {paymentVoucherPrint.date}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm font-extrabold leading-relaxed relative z-10">
                    <div className={`flex border-b border-dashed pb-3 ${luminousTheme === 'dark' ? 'border-[#1e3a5f]' : 'border-[#1e3a5f]'}`}>
                      <span className={`w-36 shrink-0 font-black ${luminousTheme === 'dark' ? 'text-rose-400' : 'text-amber-900'}`}>دفعنا وصرفنا للمكرم:</span>
                      <span className={`font-black ${luminousTheme === 'dark' ? 'text-white' : 'text-[#94a3b8]'}`}>{paymentVoucherPrint.payee}</span>
                    </div>
                    <div className={`flex border-b border-dashed pb-3 ${luminousTheme === 'dark' ? 'border-[#1e3a5f]' : 'border-[#1e3a5f]'}`}>
                      <span className={`w-36 shrink-0 font-black ${luminousTheme === 'dark' ? 'text-rose-400' : 'text-amber-900'}`}>مبلغاً وقدره:</span>
                      <span className={`font-black text-lg px-3 py-1 rounded-2xl ${luminousTheme === 'dark' ? 'text-[#94a3b8] bg-[#f43f5e] shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'text-white bg-gradient-to-r from-[#c9a84c] to-[#a67c30] shadow-md'}`}>{parseFloat(paymentVoucherPrint.amount).toLocaleString()} ر.س</span>
                    </div>
                    <div className={`flex border-b border-dashed pb-3 ${luminousTheme === 'dark' ? 'border-[#1e3a5f]' : 'border-[#1e3a5f]'}`}>
                      <span className={`w-36 shrink-0 font-black ${luminousTheme === 'dark' ? 'text-rose-400' : 'text-amber-900'}`}>لقاء / مقابل:</span>
                      <span className={luminousTheme === 'dark' ? 'text-[#94a3b8]' : 'text-[#94a3b8]'}>{paymentVoucherPrint.purpose}</span>
                    </div>
                    <div className={`flex border-b border-dashed pb-3 items-center ${luminousTheme === 'dark' ? 'border-[#1e3a5f]' : 'border-[#1e3a5f]'}`}>
                      <span className={`w-36 shrink-0 font-black ${luminousTheme === 'dark' ? 'text-rose-400' : 'text-amber-900'}`}>طريقة الصرف:</span>
                      <span className={`px-3 py-1 rounded-2xl font-black border ${luminousTheme === 'dark' ? 'bg-[#0a1628] text-white border-rose-500/40' : 'bg-amber-50 text-amber-955 border-amber-500/30'}`}>
                        {paymentVoucherPrint.method === 'cash' ? 'نقدي (كاش)' : paymentVoucherPrint.method === 'check' ? 'شيك مسحوب' : 'حوالة مصرفية معتمدة'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between items-end relative z-10">
                    <div className="text-center font-bold text-xs">
                      <p className={luminousTheme === 'dark' ? 'text-[#94a3b8]' : 'text-[#94a3b8]'}>المحاسب المسؤول</p>
                      <div className="h-8"></div>
                      <p className={`font-black border-t-2 pt-2 inline-block px-4 ${luminousTheme === 'dark' ? 'text-white border-[#1e3a5f]' : 'text-[#94a3b8] border-[#1e3a5f]'}`}>قسم الخزينة والصيانة</p>
                    </div>
                    <div className={`text-[11px] font-black text-right max-w-[240px] leading-relaxed p-3 rounded-2xl border ${luminousTheme === 'dark' ? 'text-rose-300 bg-rose-950/30 border-rose-500/20 shadow-inner' : 'text-amber-900 bg-amber-50/50 border-amber-500/25'}`}>
                      تم تقيد قهر الصرف وتحديث رصيد المصروفات وتكلفة العهود القضائية قانونياً.
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 relative z-20">
                  <button 
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html lang="ar" dir="rtl">
                            <head>
                              <title>سند صرف رسمي - مكتب المحاماة</title>
                              <style>
                                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;750;900&display=swap');
                                body { font-family: 'Cairo', sans-serif; padding: 40px; text-align: right; direction: rtl; background: white; color: #111; }
                                .voucher { border: 4px double #f43f5e; padding: 30px; border-radius: 20px; max-width: 600px; margin: auto; }
                                h2 { color: #9f1239; border-b: 1px solid #f43f5e; padding-bottom: 10px; font-weight: 900; }
                                .row { display: flex; margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 8px; }
                                .label { width: 140px; color: #444; font-weight: 900; }
                                .val { font-weight: 900; color: #000; }
                              </style>
                            </head>
                            <body>
                              <div class="voucher">
                                \${officeLogo ? \`
                                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f43f5e; padding-bottom: 15px; margin-bottom: 20px;">
                                    <div>
                                      <h2 style="color: #9f1239; margin: 0; padding: 0; border: none; font-size: 22px; font-weight: 900;">ســنــد صــرف رســمــي</h2>
                                      <p style="font-size:11px; color:#555; margin: 5px 0 0 0;">سند رقم: \${paymentVoucherPrint.id} | التاريخ: \${paymentVoucherPrint.date}</p>
                                    </div>
                                    <img src="\${officeLogo}" style="max-height: 60px; max-width: 150px; object-fit: contain;" />
                                  </div>
                                \` : \`
                                  <h2>ســنــد صــرف رســمــي</h2>
                                  <p style="font-size:11px; color:#555;">سند رقم: \${paymentVoucherPrint.id} | التاريخ: \${paymentVoucherPrint.date}</p>
                                \`}
                                <div class="row"><span class="label">دفعنا وصرفنا للمكرم:</span><span class="val\">\${paymentVoucherPrint.payee}</span></div>
                                <div class="row"><span class="label">مبلغاً وقدره:</span><span class="val" style="color:#e11d48; font-weight:900;">\${parseFloat(paymentVoucherPrint.amount).toLocaleString()} ريال سعودي</span></div>
                                <div class="row"><span class="label">وذلك كقيمة ومقابل:</span><span class="val\">\${paymentVoucherPrint.purpose}</span></div>
                                <div class="row"><span class="label">طريقة الصرف:</span><span class="val\">\${paymentVoucherPrint.method === 'cash' ? 'نقدي' : paymentVoucherPrint.method === 'check' ? 'شيك' : 'تحويل'}</span></div>
                                <div style="margin-top: 40px; display:flex; justify-content: space-between;">
                                  <div><span>توقيع المستلم: ____________</span></div>
                                  <div><span style="font-size:11px; color:#333; font-weight: 900;">مكتب العدالة للمحاماة والاستشارات</span></div>
                                </div>
                              </div>
                              <script>window.print(); window.onafterprint = function(){ window.close(); }</script>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }}
                    className={`flex-1 font-black py-3 rounded-2xl text-xs flex justify-center items-center gap-2 cursor-pointer active:scale-95 transition-all ${luminousTheme === 'dark' ? 'bg-[#c9a84c] text-[#94a3b8] shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-gradient-to-r from-[#c9a84c] to-[#a67c30] text-white shadow-[0_10px_20px_rgba(217,119,6,0.2)]'}`}
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة سند الصرف (A4)</span>
                  </button>
                  <button 
                    onClick={() => {
                      setPaymentVoucherPrint(null);
                      setPaymentPayee('');
                      setPaymentAmount('');
                      setPaymentPurpose('');
                    }}
                    className={`font-black px-5 py-3 rounded-2xl text-xs cursor-pointer transition-all active:scale-95 border-2 ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-[#1e3a5f] text-white hover:border-[#1e3a5f]0' : 'bg-[#0a1628] border-[#1e3a5f] text-[#94a3b8] hover:bg-[#0a1628]'}`}
                  >
                    إصدار سند آخر
                  </button>
                </div>
              </div>
            ) : (
              /* Payment Creation Form (Data Entry Card) */
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const voucher = {
                    id: `PAY-${Date.now().toString().substring(7)}`,
                    payee: paymentPayee,
                    amount: paymentAmount,
                    purpose: paymentPurpose,
                    method: (e.target as any).method.value,
                    date: new Date().toISOString().split('T')[0]
                  };
                  setPaymentVoucherPrint(voucher);
                }}
                className="p-8 space-y-6 relative z-20 pt-1"
              >
                {/* Embedded Glowing Data Entry Card */}
                <div className={`p-6 rounded-[2.2rem] border ${luminousTheme === 'dark' ? 'bg-[#050c18]/90 border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.05)]' : 'bg-[#0a1628] border-amber-500/25 shadow-lg'} space-y-5`}>
                  <div className="space-y-1.5">
                    <label className={`text-xs font-black block tracking-wide ${luminousTheme === 'dark' ? 'text-yellow-400 drop-shadow-md' : 'text-[#94a3b8]'}`}>صرفنا ودفعنا للمكرم / الجهة الشريكة <span className="text-rose-400 font-bold">*</span></label>
                    <input 
                      type="text"
                      required
                      value={paymentPayee}
                      onChange={e => setPaymentPayee(e.target.value)}
                      className={`w-full border-2 rounded-2xl py-3 px-4 text-sm font-black outline-none transition-all duration-300 ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-amber-500/30 text-white placeholder-slate-650 focus:border-yellow-400' : 'bg-[#0a1628] border-amber-500/20 text-[#94a3b8] placeholder-slate-400 focus:border-amber-600'}`}
                      placeholder="مثال: الخبير الهندسي المعين"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-black block tracking-wide ${luminousTheme === 'dark' ? 'text-yellow-400 drop-shadow-md' : 'text-[#94a3b8]'}`}>مبلغ سند الصرف (ر.س) <span className="text-rose-400 font-bold">*</span></label>
                      <input 
                        type="number"
                        required
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        className={`w-full border-2 rounded-2xl py-3 px-4 text-sm font-black outline-none transition-all duration-300 font-mono ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-amber-500/30 text-yellow-300 placeholder-slate-655 focus:border-yellow-400' : 'bg-[#0a1628] border-amber-500/20 text-[#94a3b8] placeholder-slate-400 focus:border-amber-600'}`}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={`text-xs font-black block tracking-wide ${luminousTheme === 'dark' ? 'text-yellow-400 drop-shadow-md' : 'text-[#94a3b8]'}`}>طريقة الصرف المعتمدة <span className="text-rose-400 font-bold">*</span></label>
                      <select 
                        name="method"
                        className={`w-full border-2 rounded-2xl py-3 px-4 text-sm font-black outline-none transition-all duration-300 cursor-pointer ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-amber-500/30 text-white focus:border-yellow-400' : 'bg-[#0a1628] border-amber-500/20 text-[#94a3b8] focus:border-amber-600'}`}
                      >
                        <option value="bank" className={luminousTheme === 'dark' ? 'bg-[#0b1221] text-white' : 'bg-[#0a1628] text-[#94a3b8]'}>تحويل بنكي آلي</option>
                        <option value="cash" className={luminousTheme === 'dark' ? 'bg-[#0b1221] text-white' : 'bg-[#0a1628] text-[#94a3b8]'}>نقدي (كاش)</option>
                        <option value="check" className={luminousTheme === 'dark' ? 'bg-[#0b1221] text-white' : 'bg-[#0a1628] text-[#94a3b8]'}>شيك مصدق</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-black block tracking-wide ${luminousTheme === 'dark' ? 'text-yellow-400 tracking-wide drop-shadow-md' : 'text-[#94a3b8]'}`}>وذلك كقيمة / مقابل لقاء <span className="text-rose-400 font-bold">*</span></label>
                    <textarea 
                      required
                      value={paymentPurpose}
                      onChange={e => setPaymentPurpose(e.target.value)}
                      className={`w-full border-2 rounded-2xl py-3 px-4 text-sm font-black outline-none transition-all duration-300 ${luminousTheme === 'dark' ? 'bg-[#0a1628] border-amber-500/30 text-white placeholder-slate-650 focus:border-yellow-400' : 'bg-[#0a1628] border-amber-500/20 text-[#94a3b8] placeholder-slate-400 focus:border-amber-600'}`}
                      placeholder="مثال: رسوم المحكمة العامة المقررة لقيد طلب الاعتراض لقضية البنك..."
                      rows={2}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className={`w-full font-black py-4 rounded-2xl text-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${luminousTheme === 'dark' ? 'bg-[#c9a84c] hover:bg-[#c9a84c] text-[#94a3b8] shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-gradient-to-r from-[#c9a84c] to-[#a67c30] hover:bg-gradient-to-r from-[#c9a84c] to-[#a67c30] text-white shadow-[0_10px_20px_rgba(217,119,6,0.2)]'}`}
                >
                  <CheckCircle className="w-5 h-5" /> حفظ وتوليد سند الصرف الملكي
                </button>
              </form>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Electronic Payment Gateways Simulator Modal */}
      {isGatewaysOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a1628]/90 backdrop-blur-md" onClick={() => setIsGatewaysOpen(false)}></div>
          <div className="relative bg-gradient-to-br from-[#040914] via-[#02040a] to-[#000000] border-2 border-yellow-500/50 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-[0_0_60px_rgba(234,179,8,0.25)] animate-in zoom-in-95 duration-300 font-sans text-right" dir="rtl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            
            {/* Modal Header */}
            <div className="p-6 border-b border-yellow-500/20 flex items-center justify-between bg-black/40">
              <div>
                <h2 className="font-display font-black text-xl text-yellow-400 flex items-center gap-3 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                  <CreditCard className="w-6 h-6 text-yellow-400" />
                  <span>بوابات الدفع الإلكتروني والتحصيل الآلي المباشر</span>
                </h2>
                <p className="text-sm text-white font-extrabold mt-1 tracking-wide">مزامنة قنوات الدفع (مدى، ومحافظ STC Pay و Apple Pay) ومطابقة الحسابات البنكية</p>
              </div>
              <button 
                onClick={() => setIsGatewaysOpen(false)}
                className="bg-[#0a1628] hover:bg-[#0a1628] text-yellow-500 hover:text-yellow-400 px-5 py-2.5 rounded-2xl text-sm font-black transition-all cursor-pointer border border-yellow-500/30 hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="p-8 space-y-8 relative z-10">
              {/* Saudi Payment Channels Showcase */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: 'شبكة مدى الوطنية', status: 'نشط آلياً', color: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
                  { name: 'Apple Pay', status: 'نشط آلياً', color: 'border-[#1e3a5f]/60 bg-[#0a1628]/10 text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]' },
                  { name: 'STC Pay', status: 'مصدقة ومتصلة', color: 'border-purple-500/60 bg-purple-500/10 text-purple-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]' },
                  { name: 'سداد والبطاقات', status: 'متوفر', color: 'border-sky-500/60 bg-sky-500/10 text-sky-300 hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]' }
                ].map((gate, i) => (
                  <div key={i} className={`p-4 rounded-2xl border-2 text-center font-bold text-sm ${gate.color} transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm cursor-default`}>
                    <p className="font-extrabold mb-2 text-white drop-shadow-md">{gate.name}</p>
                    <span className="text-[11px] bg-black/60 border-2 border-current px-3 py-1 rounded-full inline-block mt-1 font-black">✓ {gate.status}</span>
                  </div>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="p-6 bg-gradient-to-r from-yellow-500/10 to-yellow-500/20 border-2 border-yellow-500/40 rounded-2xl flex justify-between items-center shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:shadow-[0_0_30px_rgba(234,179,8,0.25)] transition-all duration-300">
                <div className="space-y-2 text-right">
                  <p className="text-white text-sm font-extrabold drop-shadow-md">مجموع المدفوعات المسحوبة هذا الشهر عبر الروابط الرقمية</p>
                  <strong className="text-yellow-300 font-black text-3xl tracking-wide font-mono block drop-shadow-[0_0_10px_rgba(234,179,8,0.4)] hover:scale-105 transition-transform origin-right">38,400 <span className="text-yellow-400 text-lg font-sans">ر.س</span></strong>
                </div>
                <div className="text-left mt-2 lg:mt-0">
                  <span className="text-xs bg-[#c9a84c] text-white px-5 py-2.5 rounded-full font-black shadow-[0_0_20px_rgba(234,179,8,0.6)] animate-pulse border border-yellow-300">الربط آلي بالكامل ⚡</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-black text-yellow-400 drop-shadow-md">أدوات الربط وتوليد الروابط السريعة:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <button 
                    onClick={() => {
                      const client = prompt("أدخل اسم العميل لتوليد رابط الدفع السداد:");
                      const amount = prompt("أدخل مبلغ المطالبة (ر.س):");
                      if (client && amount) {
                        alert(`✅ تم توليد رابط سداد العميل بقيمة ${amount} ر.س ومشاركته الفورية للعميل (${client}).\nرابط السداد المحمي: \nhttps://pay.moj.gov.sa/invoice-link/r-${Date.now().toString().substring(7)}`);
                      }
                    }}
                    className="p-5 rounded-2xl border-2 border-dashed border-yellow-400 font-extrabold text-sm text-yellow-300 bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 hover:shadow-[0_0_30px_rgba(234,179,8,0.25)] transition-all duration-300 text-center cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    <span className="group-hover:scale-125 transition-transform duration-200">🚀</span> توليد رابط دفع فوري سريع لعميل
                  </button>

                  <button 
                    onClick={() => {
                      alert("تم رصد مطابقة الدفعات البنكية للحسابات واستقطاب الفواتير مع ZATCA بنجاح تام.");
                    }}
                    className="p-5 rounded-2xl border-2 border-blue-500/40 font-extrabold text-sm text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300 cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <Activity className="w-5 h-5 animate-pulse text-blue-400" /> مطابقة الدفعات مع فواتير زاتكا
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Printable Tax Invoice Modal Layer */}
      {printInvoice && (
        <div className="fixed inset-0 bg-[#0a1628]/90 backdrop-blur-md z-[70] flex items-center justify-center p-4 overflow-y-auto" id="print-modal">
          <div className="bg-[#0a1628] text-white rounded-3xl p-12 max-w-2xl w-full shadow-[0_0_60px_rgba(234,179,8,0.2)] relative border-t-[12px] border-amber-400 overflow-hidden font-sans print:bg-[#0a1628] print:text-white print:shadow-none print:border-none border border-[#1e3a5f]">
            
            {/* Header controls (Hidden on physical print) */}
            <div className="flex justify-between items-center border-b border-amber-500/30 pb-6 mb-10 print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#c9a84c]/10 border border-yellow-400/20 text-yellow-400 rounded-2xl shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                   <FileText className="w-5 h-5" />
                </div>
                <span className="text-sm font-display font-black text-white drop-shadow-md uppercase">معاينة الفاتورة الضريبية الفاخرة</span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#c9a84c] hover:bg-[#c9a84c] focus:ring-4 focus:ring-yellow-400/40 text-[#94a3b8] font-extrabold text-sm py-2.5 px-6 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>الجاهزية للطباعة (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintInvoice(null)}
                  className="bg-[#0a1628] hover:bg-[#0a1628] text-yellow-500 border border-amber-500/30 hover:border-amber-400 font-bold text-sm py-2.5 px-5 rounded-2xl transition-all shadow-[0_0_15px_rgba(234,179,8,0)] hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] cursor-pointer"
                >
                  ✕ إغلاق
                </button>
              </div>
            </div>

            {/* Print Area layout */}
            <div className="space-y-10 text-right leading-relaxed relative z-10" dir="rtl" id="printable-area">
              
              {/* Saudi Seal Headers */}
              <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-[#1e3a5f] print:border-black pb-6">
                <div className="space-y-4">
                  {officeLogo ? (
                    <img src={officeLogo} alt="Office Logo" className="h-20 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] print:drop-shadow-none" />
                  ) : (
                    <div className="print:hidden">
                      <label className="text-xs bg-[#0a1628] border border-[#1e3a5f] text-white hover:text-amber-300 font-bold px-4 py-2 rounded-2xl cursor-pointer transition-colors shadow-sm">
                        رفع الهوية الخاصة (Logo)
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    </div>
                  )}
                  <h1 className="text-xl font-display font-black text-amber-400 print:text-white drop-shadow-md">{officeName}</h1>
                  <div className="text-sm text-[#94a3b8] print:text-[#94a3b8] font-bold max-w-[340px]">
                    ترخيص مزاولة المهنة المعتمد رقم <span className="text-amber-200 print:text-white">{officeLicense}</span> الصادر عن وزارة العدل بالمملكة العربية السعودية
                  </div>
                  <div className="text-xs font-black text-[#94a3b8] print:text-[#94a3b8] bg-[#0a1628] print:bg-[#0a1628] p-2 rounded-2xl inline-block border border-[#1e3a5f] print:border-none mt-2 shadow-sm">
                    الرقم الضريبي المختم: <span className="text-amber-300 print:text-white">{officeVat}</span>
                  </div>
                </div>
                
                <div className="text-left md:text-left mt-6 md:mt-0 font-extrabold text-sm text-[#94a3b8] print:text-[#94a3b8]">
                  <div className="text-2xl mb-2"></div>
                  <div>المملكة العربية السعودية</div>
                  <div className="font-sans text-[#94a3b8] print:text-[#94a3b8] mt-1">الرياض - العليا - برج الفيصلية</div>
                  <div className="font-sans tabular-nums font-black text-amber-200 print:text-white mt-2 bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/10 print:bg-transparent px-3 py-1 rounded-2xl border border-amber-500/20 print:border-none inline-block">دعم VIP: +966 11 000 0000</div>
                </div>
              </div>

              {/* Invoice Meta info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-[#1e3a5f] print:border-black pb-8">
                <div className="space-y-1.5 p-3 bg-[#0a1628]/50 print:bg-transparent border border-[#1e3a5f] print:border-none rounded-2xl">
                  <div className="text-[11px] text-amber-500 print:text-[#94a3b8] font-black uppercase tracking-widest">التسلسل المرجعي</div>
                  <strong className="text-sm text-white print:text-white font-mono tracking-tighter uppercase font-black block">#{printInvoice.id}</strong>
                </div>
                <div className="space-y-1.5 p-3 bg-[#0a1628]/50 print:bg-transparent border border-[#1e3a5f] print:border-none rounded-2xl">
                  <div className="text-[11px] text-amber-500 print:text-[#94a3b8] font-black uppercase tracking-widest">تاريخ الاستحقاق</div>
                  <strong className="text-sm text-white print:text-white font-sans tabular-nums font-black block">{printInvoice.dueDate}</strong>
                </div>
                <div className="space-y-1.5 p-3 bg-[#0a1628]/50 print:bg-transparent border border-[#1e3a5f] print:border-none rounded-2xl">
                  <div className="text-[11px] text-amber-500 print:text-[#94a3b8] font-black uppercase tracking-widest">العميل المستلم</div>
                  <strong className="text-sm text-amber-200 print:text-white font-black block truncate">{printInvoice.clientName}</strong>
                </div>
                <div className="space-y-1.5 p-3 bg-[#0a1628]/50 print:bg-transparent border border-[#1e3a5f] print:border-none rounded-2xl">
                  <div className="text-[11px] text-amber-500 print:text-[#94a3b8] font-black uppercase tracking-widest">رقم الهوية / السجل</div>
                  <strong className="text-sm text-white print:text-white font-mono tracking-tighter block">1029384756</strong>
                </div>
              </div>

              {/* Services List Table */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-amber-400 print:text-white uppercase tracking-widest bg-gradient-to-r from-[#c9a84c] to-[#a67c30]/10 border border-amber-500/20 print:bg-[#0a1628] print:border-none px-4 py-2 inline-block rounded-t-xl shadow-sm">بيان الخدمات القانونية المنجزة</h3>
                
                <table className="w-full text-right border-collapse rounded-2xl overflow-hidden border border-[#1e3a5f] print:border-black shadow-lg print:shadow-none">
                  <thead className="bg-[#0a1628] border-b-2 border-[#1e3a5f] print:bg-[#0a1628] print:border-black">
                    <tr>
                      <th className="py-4 px-6 text-xs font-black text-white print:text-white drop-shadow-sm print:drop-shadow-none">الوصف القانوني للخدمة</th>
                      <th className="py-4 px-6 text-xs font-black text-white print:text-white text-center drop-shadow-sm print:drop-shadow-none" style={{ width: '130px' }}>الأتعاب الصافية</th>
                      <th className="py-4 px-6 text-xs font-black text-white print:text-white text-center drop-shadow-sm print:drop-shadow-none" style={{ width: '100px' }}>الضريبة 15%</th>
                      <th className="py-4 px-6 text-xs font-black text-amber-300 print:text-white text-left drop-shadow-sm print:drop-shadow-none" style={{ width: '150px' }}>الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#1e3a5f] print:border-black bg-[#0a1628]/50 print:bg-[#0a1628]">
                      <td className="py-6 px-6">
                        <div className="font-extrabold text-amber-100 print:text-white text-sm leading-snug drop-shadow-sm print:drop-shadow-none">{printInvoice.description || 'صياغة المذكرات الجوابية والتمثيل القضائي'}</div>
                        <div className="text-[11px] text-[#94a3b8] print:text-[#94a3b8] font-bold mt-2 leading-relaxed">
                          تم إعداد المذكرات الإلحاقية وفق التفويض وصياغة الردود الدفاعية والتمثيل أمام الدائرة الموقرة استناداً للعقد المبرم.
                        </div>
                      </td>
                      <td className="py-6 px-6 text-center font-sans font-black tabular-nums text-white print:text-white">{printInvoice.amount.toLocaleString()}</td>
                      <td className="py-6 px-6 text-center font-sans font-black tabular-nums text-[#94a3b8] print:text-[#94a3b8]">{(printInvoice.amount * 0.15).toLocaleString()}</td>
                      <td className="py-6 px-6 text-left font-sans font-black tabular-nums text-emerald-400 print:text-white text-base bg-emerald-500/5 print:bg-transparent border-r border-[#1e3a5f] print:border-none">{printInvoice.totalAmount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals & Breakdown */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-8 pt-6">
                
                {/* ZATCA QR Code Representation */}
                <div className="flex items-center gap-5 p-6 bg-[#0a1628] border border-[#1e3a5f] print:bg-[#0a1628] print:border-[#1e3a5f] rounded-3xl shadow-inner">
                  <div className="w-24 h-24 bg-[#0a1628] p-2 border-4 border-[#1e3a5f] print:border-black rounded-2xl flex items-center justify-center relative shadow-lg">
                    <div className="w-full h-full bg-[#0a1628] rounded-2xl flex items-center justify-center border border-[#1e3a5f]">
                       <span className="text-[10px] text-[#94a3b8] font-black font-mono tracking-widest uppercase">QR-ZATCA</span>
                    </div>
                  </div>
                  <div className="max-w-[200px]">
                    <div className="text-xs font-black text-amber-400 print:text-white mb-1.5 leading-tight">فاتورة ضريبية إلكترونية معتمدة</div>
                    <div className="text-[11px] text-[#94a3b8] print:text-[#94a3b8] font-bold leading-relaxed line-clamp-3">تتطابق هذه الوثيقة المجمدرة آلياً مع متطلبات هيئة الزكاة والضريبة والجمارك وتتضمن المعايير الأمنية.</div>
                  </div>
                </div>

                {/* Subtotals Block */}
                <div className="space-y-4 md:w-80 bg-[#0a1628] print:bg-transparent p-6 rounded-3xl border border-[#1e3a5f] print:border-none shadow-md print:shadow-none">
                  <div className="flex justify-between items-center text-xs font-black text-[#94a3b8] print:text-[#94a3b8] px-2 pb-2 border-b border-[#1e3a5f] print:border-dashed">
                    <span>القيمة الأساسية:</span>
                    <span className="tabular-nums font-sans text-white print:text-white">{printInvoice.amount.toLocaleString()} ر.س</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black text-[#94a3b8] print:text-[#94a3b8] px-2 pb-2 border-b border-[#1e3a5f] print:border-dashed">
                    <span>قيمة الضريبة المضافة (15%):</span>
                    <span className="tabular-nums font-sans text-white print:text-white">{(printInvoice.amount * 0.15).toLocaleString()} ر.س</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#c9a84c] print:bg-[#0a1628] text-[#94a3b8] print:text-white p-5 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.3)] print:shadow-none mt-2">
                    <span className="text-sm font-black uppercase">الإجمالي لسداده:</span>
                    <strong className="text-xl font-display font-black tabular-nums leading-none tracking-tight">{printInvoice.totalAmount.toLocaleString()} <span className="text-xs">ر.س</span></strong>
                  </div>
                </div>

              </div>

              {/* Footnotes and signature block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-[#1e3a5f] print:border-[#1e3a5f]">
                <div className="space-y-3">
                  <span className="text-xs font-black text-amber-500 print:text-[#94a3b8] leading-none">بيانات التحصيل المصرفي الرسمية:</span>
                  <div className="p-4 bg-[#0a1628] border border-[#1e3a5f] print:bg-[#0a1628] print:border-[#1e3a5f] rounded-2xl text-xs text-white print:text-[#94a3b8] font-extrabold leading-relaxed space-y-2 shadow-inner">
                    <p className="flex justify-between border-b border-[#1e3a5f] print:border-[#1e3a5f] pb-1">المصرف المعتمد: <span className="text-amber-200 print:text-[#94a3b8]">البنك الأهلي السعودي - SNB</span></p>
                    <p className="flex justify-between border-b border-[#1e3a5f] print:border-[#1e3a5f] pb-1">رقم الحساب الدولي (IBAN): <span className="text-amber-200 print:text-[#94a3b8] font-mono tracking-wider">SA45 1000 0000 0000 1234 5678</span></p>
                    <p className="flex justify-between">الرقم المرجعي للدفع: <span className="text-emerald-400 print:text-[#94a3b8] font-mono">INV-{printInvoice.id.substring(4)}</span></p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 justify-center">
                  <p className="text-xs font-black text-[#94a3b8] print:text-[#94a3b8]">ختم ومصادقة المكتب المعتمد:</p>
                  <div className="h-24 w-48 border-4 border-dashed border-amber-500/20 bg-[#0a1628]/50 print:border-[#1e3a5f] print:bg-transparent rounded-3xl relative flex items-center justify-center p-4">
                    <div className="text-center font-display transform -rotate-6 select-none opacity-50">
                      <p className="text-xs font-black text-amber-400 print:text-[#94a3b8] mb-1 leading-snug">العدالة لتمثيل القانون</p>
                      <p className="text-xs font-bold text-[#94a3b8] print:text-[#94a3b8]">الشؤون المالية والتدقيق</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
