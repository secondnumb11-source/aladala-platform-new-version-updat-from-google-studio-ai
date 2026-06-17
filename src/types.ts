/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CaseStage = 'litigation' | 'appeals' | 'execution' | 'administrative' | 'archived';
export type CaseCategory = 'commercial' | 'labor' | 'civil' | 'criminal' | 'personal_status' | 'administrative' | 'execution' | 'other';
export type CaseStatus = 'under_review' | 'struck_off' | 'appeal' | 'execution' | 'primary_judgment' | 'final_judgment' | 'postponed' | 'under_study' | 'active' | 'closed' | 'pending' | 'new' | 'pending_session' | 'judgment_issued';

export interface CaseHistoryEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  type: 'status_change' | 'deadline_change' | 'ai_update' | 'other';
  field: string;
  oldValue: string;
  newValue: string;
  isAiAssisted: boolean;
  notes?: string;
}

export interface Execution {
  id: string;
  execution_number: string;
  case_number?: string;
  requester_name?: string;
  opponent_name?: string;
  status?: string;
  amount?: number;
  court_name?: string;
  issue_date?: string;
  last_update?: string;
  details?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  court_case_number?: string;
  najiz_case_id?: string;
  caseName: string;
  title?: string;
  subject?: string;
  category: CaseCategory;
  case_classification?: string;
  caseClassification?: string;
  stage: CaseStage;
  status: CaseStatus;
  caseStatus?: CaseStatus;
  clientName: string;
  clientId: string;
  opponentName: string;
  opponentId?: string;
  opponentNationalId?: string;
  courtName: string;
  circuitNumber?: string;
  powerOfAttorneyNumber?: string;
  lastSessionDate: string;
  nextSessionDate: string;
  nextSessionTime: string;
  summary: string;
  details: string;
  isNajizSync: boolean;
  priority: 'low' | 'medium' | 'high';
  isConfidential?: boolean;
  confidentiality?: 'standard' | 'confidential' | 'highly_confidential';
  archived?: boolean;
  lastActivityAt?: string;
  createdAt: string;
  startDate?: string;
  lead_lawyer_id?: string;
  assigned_lawyers?: string[];
  judge_name?: string;
  judgeName?: string;
  judgment_summary?: string;
  judgment_date?: string;
  appeal_deadline?: string;
  execution_number?: string;
  execution_status?: string;
  execution_amount?: number;
  agreed_fees?: number;
  collected_fees?: number;
  expenses?: number;
  attachments_count: number;
  attachments?: Attachment[];
  archivedDocuments?: ArchiveItem[];
  financialRecords?: FinancialRecord[];
  hearings?: Hearing[];
  judgments?: Judgment[];
  tasks?: Task[];
  notes?: Note[];
  relatedParties?: RelatedParty[];
  powersOfAttorney?: PowerOfAttorney[];
  executionRequests?: ExecutionRequest[];
  communicationHistory?: CommunicationLog[];
  communicationLog?: CommunicationLog[];
  timeline?: TimelineEvent[];
  history?: CaseHistoryEntry[];
}

export type CourtCase = Case;
export interface SyncStatus {
  status: 'stable' | 'syncing' | 'error' | 'disconnected';
  last_sync_at: string;
}

export interface Client {
  id: string;
  name: string;
  isCompany: boolean;
  nationalId: string;
  phone: string;
  email: string;
  portalToken: string;
  portalLink: string;
  portalUsername?: string;
  portalPassword?: string;
  permittedCases?: string[];
  permittedCasePermissions?: Record<string, 'view' | 'edit'>;
}

export interface Hearing {
  id: string;
  caseNumber: string;
  caseName: string;
  date: string;
  time: string;
  courtName: string;
  status: 'upcoming' | 'completed' | 'canceled';
  judgeName?: string;
  notes?: string;
  hearingStatus?: string;
  hallNumber?: string;
  decision?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  dueDate: string;
  caseNumber?: string;
  timerActive?: boolean;
  timerDuration?: number; // in minutes
  targetCompletionTime?: string; // ISO string
}

export interface Employee {
  id: string;
  name: string;
  nationality: string;
  nationalId: string;
  nationalIdExpiry?: string;
  phone: string;
  jobTitle: string;
  manager: string;
  qualification: string;
  startDate: string;
  endDate?: string;
  email: string;
  branch: string;
  notes: string;
  birthDate?: string;
  username?: string;
  password?: string;
  najizApiKey?: string;
  baseSalary?: number;
  allowances?: number;
  deductions?: number;
  assignedCases?: string[];
  assignedClients?: string[];
  permissions?: string[];
  featureAccess?: string[];
  sidebarConfig?: string[];
  portalLink?: string;
  customLoginToken?: string;
  status?: string;
  avatarUrl?: string;
  employeeCode?: string;
  role?: string;
  department?: string;
  salary?: number;
}

export interface DocumentVersion {
  id: string;
  version: number;
  name: string;
  size: string;
  uploadedAt: string;
  content_text?: string;
  changesSummary: string;
}

export interface Document {
  id: string;
  name: string;
  category: string;
  uploadedAt: string;
  size: string;
  content_text?: string;
  tags: string[];
  versions?: DocumentVersion[];
  currentVersion?: number;
  colorCode?: string;
  aiClassification?: {
    confidence: number;
    detectedAt: string;
    type: string;
  };
}

export interface Invoice {
  id: string;
  clientName: string;
  clientId: string;
  amount: number;
  vatAmount: number; // 15% Saudi VAT
  totalAmount: number;
  status: 'paid' | 'pending' | 'overdue';
  issueDate: string;
  dueDate: string;
  paymentMethod: string;
  description: string;
  clientVat?: string;
  isZatcaSubmitted?: boolean;
  zatcaTimestamp?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'court_fees' | 'travel' | 'marketing' | 'office' | 'other';
  date: string;
  caseNumber?: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  recordsCount: number;
  status: 'success' | 'failed';
  source: string;
  logs: string;
  apiKeyUsed: string;
}

export interface Lawyer {
  id: string;
  name: string;
  role: 'partner' | 'consultant' | 'associate' | 'trainee' | 'accountant' | 'secretary';
  email: string;
  phone: string;
  active: boolean;
  joinedAt: string;
}

export interface Message {
  id: string;
  sender: 'client' | 'lawyer';
  senderName: string;
  text: string;
  timestamp: string;
  caseNumber?: string;
}

export interface ArchiveItem {
  id: string;
  caseId: string;
  type: 'pleading' | 'document' | 'judgment' | 'execution_decision' | 'other';
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface TimeLog {
  id: string;
  lawyerId: string;
  caseId?: string;
  clientId: string;
  duration: number; // in minutes
  description: string;
  date: string;
  hourlyRate?: number;
  isBilled: boolean;
  invoiceId?: string;
}

export interface ZatcaInvoice extends Invoice {
  zatcaPhase: 1 | 2;
  qrCodeData?: string;
  taxNumber?: string;
  officeLogo?: string;
  customerVatId?: string;
  bankAccount?: string;
  vouchers?: Voucher[];
}

export interface Voucher {
  id: string;
  invoiceId?: string;
  caseId?: string;
  clientId: string;
  amount: number;
  type: 'receipt' | 'payment'; // سند قبض أو سند صرف
  date: string;
  description: string;
  paymentMethod: 'cash' | 'transfer' | 'mada' | 'visa' | 'apple_pay';
  transactionId?: string;
  officeLogo?: string;
}

export interface PaymentLink {
  id: string;
  caseId: string;
  clientId: string;
  amount: number;
  description: string;
  status: 'active' | 'expired' | 'paid';
  link: string;
  createdAt: string;
}

export interface LegalLibraryItem {
  id: string;
  title: string;
  category: string;
  content: string; // Markdown
  tags: string[];
  lastUpdated: string;
  sourceUrl?: string;
}

export interface TemplateMarketplaceItem {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  price: number; // 0 for free
  description: string;
  previewContent: string;
  fileUrl: string;
  downloads: number;
  rating: number;
}

export interface UserPermissions {
  role: 'partner' | 'consultant' | 'associate' | 'trainee' | 'accountant' | 'secretary';
  canAccessFinance: boolean;
  canManageLawyers: boolean;
  canViewAllCases: boolean;
  canEditCases: boolean;
  canAccessSettings: boolean;
}

export interface Contract {
  id: string;
  clientName: string;
  clientId: string;
  title: string;
  content: string;
  status: 'pending' | 'signed';
  otpCode?: string;
  otpStatus?: 'unsent' | 'sent' | 'verified';
  signedAt?: string;
  signerName?: string;
  phone?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  category: string;
}

export interface Judgment {
  id: string;
  judgmentNumber: string;
  issueDate: string;
  judgmentText: string;
  status: string; 
}

export interface ExecutionRequest {
  id: string;
  requestNumber: string;
  requestDate: string;
  amount: string;
  status: string;
  courtName?: string;
  enforcementData?: string;
}

export interface PowerOfAttorney {
  id: string;
  poaNumber: string;
  issueDate: string;
  expiryDate: string;
  lawyerName: string;
  clientName: string;
  status: string; 
  clientId?: string;
  scope?: string;
  clauses?: string[];
  parties?: { name: string; role: string; identity?: string }[];
  isNajizSync?: boolean;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  category: "status" | "hearing" | "judgment" | "document" | "other";
  description: string;
}

export interface Note {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface FinancialRecord {
  id: string;
  date: string;
  amount: string;
  type: "income" | "expense";
  description: string;
}

export interface CommunicationLog {
  id: string;
  type: "email" | "whatsapp" | "phone" | "meeting";
  contactPerson: string;
  direction: "inbound" | "outbound";
  summary: string;
  date: string;
}

export interface RelatedParty {
  id: string;
  name: string;
  relationType: "Plaintiff" | "Defendant" | "Witness" | "Expert"; 
  nationalId?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'vacation' | 'sick' | 'emergency' | 'unpaid';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comment?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  location?: { lat: number; lng: number; address?: string };
  method: 'qr' | 'location' | 'manual';
  status: 'present' | 'late' | 'absent';
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  netSalary: number;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface AuditTrail {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
