const fs = require('fs');
const content = fs.readFileSync('src/components/CasesModule.tsx', 'utf8');

// Find SummaryCharts definition
const summaryChartsStart = content.indexOf('  const SummaryCharts = ({ cases, preferences, updatePreference }: { cases: Case[], preferences: any, updatePreference: any }) => {');
if (summaryChartsStart === -1) throw new Error('Could not find SummaryCharts start');

// Find the end of SummaryCharts
// We know it ends around line 1119 with '  };\n' right before '// Virtual scrolling'
const summaryChartsEndString = '  // Virtual scrolling / Infinite scroll loading state with skeletal loading indicator';
const summaryChartsEnd = content.indexOf(summaryChartsEndString);
if (summaryChartsEnd === -1) throw new Error('Could not find SummaryCharts end');

// The exact string to extract is from summaryChartsStart up to summaryChartsEndString
let summaryChartsCode = content.substring(summaryChartsStart, summaryChartsEnd);

// Find CasesModuleProps
const casesModulePropsStart = content.indexOf('interface CasesModuleProps {');

// Rewrite SummaryCharts to add themeTick
summaryChartsCode = summaryChartsCode.replace(
  'const SummaryCharts = ({ cases, preferences, updatePreference }: { cases: Case[], preferences: any, updatePreference: any }) => {',
  'const SummaryCharts = ({ cases, preferences, updatePreference, themeTick }: { cases: Case[], preferences: any, updatePreference: any, themeTick: number }) => {'
);

// Remove SummaryCharts from the body
let newContent = content.slice(0, summaryChartsStart) + content.slice(summaryChartsEnd);

// Insert SummaryCharts before CasesModuleProps
newContent = newContent.slice(0, casesModulePropsStart) + summaryChartsCode + '\n' + newContent.slice(casesModulePropsStart);

// Update usage
newContent = newContent.replace(
  '<SummaryCharts cases={cases} preferences={preferences} updatePreference={updatePreference} />',
  '<SummaryCharts cases={cases} preferences={preferences} updatePreference={updatePreference} themeTick={themeTick} />'
);

// Now for CaseProgressBar
const progressBarStart = newContent.indexOf('      // Case Stage Progress Bar Component');
const progressBarStartAlternative = newContent.indexOf('      {/* Case Stage Progress Bar Component */}');

let pbStart = progressBarStart !== -1 ? progressBarStart : progressBarStartAlternative;

if (pbStart !== -1) {
  // Find the end
  const pbEndString = '      const filterBarMarkup = (';
  const pbEnd = newContent.indexOf(pbEndString);
  
  if (pbEnd !== -1) {
    let pbCode = newContent.substring(pbStart, pbEnd);
    newContent = newContent.slice(0, pbStart) + newContent.slice(pbEnd);
    
    // Insert PB code at the top too
    newContent = newContent.slice(0, casesModulePropsStart) + pbCode + '\n' + newContent.slice(casesModulePropsStart);
  }
}

fs.writeFileSync('src/components/CasesModule.tsx', newContent, 'utf8');
console.log('Successfully refactored CasesModule.tsx !');
