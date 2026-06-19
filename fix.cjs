const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const startIdx = code.indexOf('app.post(\'/api/ai/draft\', async (req, res) => {', 80000); // 2nd occurrence
if (startIdx === -1) {
    console.log("Could not find bad text fragment.");
    process.exit(1);
}

const endIdx = code.indexOf('يم خدمات استشارية وتمثيل قانوني";', startIdx);
if (endIdx === -1) {
    console.log("Could not find end index");
    process.exit(1);
}

const badPart = code.substring(startIdx, endIdx);
console.log("Bad part length:", badPart.length);

const replacement = `ائح.\`;
      
      let priority = 'high';
      const daysUntil = h.date ? Math.ceil((new Date(h.date).getTime() - Date.now()) / (1000 * 3600 * 24)) : 10;
      if (daysUntil < 7) priority = 'critical';

      let milestones = [];
      if (h.decision?.includes('استئناف') || h.decision?.includes('اعتراض')) {
        milestones.push({ daysBefore: 15, title: 'إعداد لائحة الاعتراض المكتوبة', action: 'تحليل الحكم الابتدائي وصياغة الاعتراض وفق المادة كذا', status: 'pending' });
      } else {
        milestones.push({ daysBefore: 3, title: 'تجهيز المذكرة الجوابية وإيداعها', action: 'صياغة المذكرة والردود الشرعية', status: 'pending' });
        milestones.push({ daysBefore: 1, title: 'جلسة تحضيرية مع الموكل', action: 'مناقشة سير الجلسة وضبط الأقوال المستهدفة', status: 'pending' });
      }

      return {
        hearingId: h.id,
        caseNumber: h.case_number,
        caseName: h.case_name || h.case_number,
        analysis: analysisText,
        priority,
        milestones
      };
    });
  }

  res.json({ success: true, analysis: responseData });
});

app.post('/api/ai/visualize-contract', async (req, res) => {
  const { contractType, clientName, opponentName, details } = req.body;
  console.log(\`Visualizing contract for client \${clientName} of type \${contractType}\`);

  let title = "عقد تأسيس شراكة استراتيجية";
  let arabicContractType = "عقد شراكة";
  if (contractType === 'commercial') {
    title = "عقد توريد تجاري وتقديم خدمات";
    arabicContractType = "عقد توريد تجاري";
  } else if (contractType === 'consulting') {
    title = "عقد تقد`;

code = code.replace(badPart, replacement);

// fix the weird chars just in case by blanket replacing `اللو`
code = code.replace(/اللو/g, 'اللو');

fs.writeFileSync('server.ts', code);
console.log("Fixed!");
