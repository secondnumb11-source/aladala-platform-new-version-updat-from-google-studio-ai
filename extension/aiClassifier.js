var AIClassifier = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var aiClassifier_exports = {};
  __export(aiClassifier_exports, {
    classifyNajizData: () => classifyNajizData
  });
  function classifyNajizData(rawData) {
    const result = {
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
    rawData.forEach((item) => {
      const payload = item.payload || {};
      const strPayload = JSON.stringify(payload).toLowerCase();
      const typeLabel = (item.type || "").toLowerCase();
      const isCase = typeLabel === "cases" || patterns.case.test(strPayload) || !!payload.caseNumber;
      const isHearing = typeLabel === "sessions" || patterns.hearing.test(strPayload) || !!payload.hearingDate;
      const isAgency = typeLabel === "agencies" || patterns.agency.test(strPayload) || !!payload.agencyNumber;
      const isEnforcement = typeLabel === "executions" || patterns.enforcement.test(strPayload) || !!payload.executionNumber;
      const isDoc = typeLabel === "documents" || patterns.document.test(strPayload) || !!payload.documentId;
      if (isCase && !isHearing && !isEnforcement) {
        result.cases.push({
          id: payload.id || crypto.randomUUID(),
          caseNumber: payload.caseNumber || payload.number || "\u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631",
          status: payload.status || "\u0646\u0634\u0637",
          court: payload.court || payload.department || "\u0627\u0644\u0645\u062D\u0643\u0645\u0629 \u0627\u0644\u0639\u0627\u0645\u0629",
          category: payload.category || "other",
          scrapedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else if (isHearing) {
        result.hearings.push({
          id: payload.id || crypto.randomUUID(),
          sessionDate: payload.sessionDate || payload.hearingDate || payload.date || "",
          caseNumber: payload.caseNumber || "",
          courtName: payload.courtName || payload.court || "",
          status: payload.status || "scheduled",
          link: payload.link || "",
          scrapedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else if (isAgency) {
        result.agencies.push({
          id: payload.id || crypto.randomUUID(),
          agencyNumber: payload.agencyNumber || payload.number || "",
          status: payload.status || "\u0641\u0639\u0627\u0644",
          issueDate: payload.issueDate || "",
          expiryDate: payload.expiryDate || "",
          scrapedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else if (isEnforcement) {
        result.enforcement_requests.push({
          id: payload.id || crypto.randomUUID(),
          executionNumber: payload.executionNumber || payload.number || "",
          status: payload.status || "\u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630",
          amount: payload.amount || 0,
          applicant: payload.applicant || "",
          defendant: payload.defendant || "",
          scrapedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else if (isDoc) {
        result.documents.push({
          id: payload.documentId || crypto.randomUUID(),
          title: payload.title || payload.name || "\u0645\u0633\u062A\u0646\u062F",
          type: payload.type || "other",
          date: payload.date || (/* @__PURE__ */ new Date()).toISOString(),
          scrapedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    });
    return result;
  }
  return __toCommonJS(aiClassifier_exports);
})();
