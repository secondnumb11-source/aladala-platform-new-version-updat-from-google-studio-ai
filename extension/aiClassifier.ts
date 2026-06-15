export interface RawNajizData {
  type: string;
  payload: any;
}

export interface ClassifiedData {
  cases: any[];
  hearings: any[];
  agencies: any[];
  enforcement_requests: any[];
  documents: any[];
}

/**
 * AI Data Classifier
 * Analyzes raw JSON objects extracted from Najiz and automatically maps them
 * into internal schema buckets (cases, hearings, agencies, enforcement_requests, documents).
 */
export function classifyNajizData(rawData: RawNajizData[]): ClassifiedData {
  const result: ClassifiedData = {
    cases: [],
    hearings: [],
    agencies: [],
    enforcement_requests: [],
    documents: []
  };

  if (!Array.isArray(rawData)) return result;

  const patterns = {
    case: /قضية|دعوى|حكم/i,
    hearing: /جلسة|موعد|تبليغ/i,
    agency: /وكالة|توكيل/i,
    enforcement: /تنفيذ|طالب التنفيذ|منفذ ضده/i,
    document: /مستند|مرفق|محضر/i
  };

  rawData.forEach(item => {
    const payload = item.payload || {};
    const strPayload = JSON.stringify(payload).toLowerCase();
    const typeLabel = (item.type || '').toLowerCase();

    const isCase = typeLabel === 'cases' || patterns.case.test(strPayload) || !!payload.caseNumber;
    const isHearing = typeLabel === 'sessions' || patterns.hearing.test(strPayload) || !!payload.hearingDate;
    const isAgency = typeLabel === 'agencies' || patterns.agency.test(strPayload) || !!payload.agencyNumber;
    const isEnforcement = typeLabel === 'executions' || patterns.enforcement.test(strPayload) || !!payload.executionNumber;
    const isDoc = typeLabel === 'documents' || patterns.document.test(strPayload) || !!payload.documentId;

    if (isCase && !isHearing && !isEnforcement) {
      result.cases.push({
        id: payload.id || crypto.randomUUID(),
        caseNumber: payload.caseNumber || payload.number || 'غير متوفر',
        status: payload.status || 'نشط',
        court: payload.court || payload.department || 'المحكمة العامة',
        category: payload.category || 'other',
        scrapedAt: new Date().toISOString()
      });
    } else if (isHearing) {
      result.hearings.push({
        id: payload.id || crypto.randomUUID(),
        sessionDate: payload.sessionDate || payload.hearingDate || payload.date || '',
        caseNumber: payload.caseNumber || '',
        courtName: payload.courtName || payload.court || '',
        status: payload.status || 'scheduled',
        link: payload.link || '',
        scrapedAt: new Date().toISOString()
      });
    } else if (isAgency) {
      result.agencies.push({
        id: payload.id || crypto.randomUUID(),
        agencyNumber: payload.agencyNumber || payload.number || '',
        status: payload.status || 'فعال',
        issueDate: payload.issueDate || '',
        expiryDate: payload.expiryDate || '',
        scrapedAt: new Date().toISOString()
      });
    } else if (isEnforcement) {
      result.enforcement_requests.push({
        id: payload.id || crypto.randomUUID(),
        executionNumber: payload.executionNumber || payload.number || '',
        status: payload.status || 'قيد التنفيذ',
        amount: payload.amount || 0,
        applicant: payload.applicant || '',
        defendant: payload.defendant || '',
        scrapedAt: new Date().toISOString()
      });
    } else if (isDoc) {
      result.documents.push({
        id: payload.documentId || crypto.randomUUID(),
        title: payload.title || payload.name || 'مستند',
        type: payload.type || 'other',
        date: payload.date || new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      });
    }
  });

  return result;
}
