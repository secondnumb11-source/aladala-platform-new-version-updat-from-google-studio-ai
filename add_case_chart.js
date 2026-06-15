import fs from 'fs';
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// Add stats calculating code near typeDistributionData
if (!content.includes('caseStatusDistributionDataData')) {
  const injectionDataStr = `
  const caseStatusDistributionDataData = React.useMemo(() => {
    let open = 0, closed = 0, reviewing = 0;
    cases.forEach(c => {
      const s = String(c.status).toLowerCase();
      if (s.includes('مغلق') || s.includes('منتهي') || s.includes('closed')) closed++;
      else if (s.includes('مراجعة') || s.includes('تدقيق') || s.includes('review')) reviewing++;
      else open++;
    });
    return [
      { name: 'مفتوحة', value: open, color: '#10b981' },
      { name: 'مغلقة', value: closed, color: '#f43f5e' },
      { name: 'قيد المراجعة', value: reviewing, color: '#fbbf24' }
    ];
  }, [cases]);
  `;
  content = content.replace('const typeDistributionData = React.useMemo(() => {', injectionDataStr + '\n  const typeDistributionData = React.useMemo(() => {');
}

// Add the widget ID to widget array
if (!content.includes("{ id: 'casesStatusDist'")) {
  content = content.replace(
    "{ id: 'partnerAnalytics', visible: true, order: 20, size: 'half' },",
    "{ id: 'partnerAnalytics', visible: true, order: 20, size: 'half' },\n      { id: 'casesStatusDist', visible: true, order: 20.5, size: 'half' },"
  );
}
// Add the widget initial config
if (content.match(/\{ id: 'partnerAnalytics', visible: true, order: 20, size: 'half' \},/g)?.length > 0 && !content.includes("{ id: 'casesStatusDist', visible: true, order: 20.5, size: 'half' }")) {
  // Try to find the second place if it exists (like state init)
  // Usually the above covers defaultWidgets. Let's ensure State is updated using regex or just replace in general.
}

// Add JSX Rendering Block
if (!content.includes('id === \'casesStatusDist\'')) {
  const jsxBlockStr = `
              if (widget.id === 'casesStatusDist') return (
                <EnhancedSortableWidgetWrapper widgetColor={widget.color} onChangeColor={handleUpdateWidgetColor} className={getWidgetClassName(widget.size)} key="casesStatusDist" id="casesStatusDist" isCustomizing={isCustomizing} widgetSize={widget.size} onResize={handleUpdateWidgetSize}>
                  <div className={"bg-[#0b1329] border border-[#D4AF37]/30 rounded-[2.5rem] p-6 shadow-2xl h-full flex flex-col relative " + (isCustomizing ? 'ring-2 ring-amber-400 opacity-80' : '')}>
                    <h3 className="font-black text-[#FFFFFF] text-lg mb-4 flex items-center gap-2">توزيع حالات القضايا</h3>
                    <div className="flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={caseStatusDistributionDataData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {caseStatusDistributionDataData.map((e, index) => <Cell key={"cell-"+index} fill={e.color} stroke="none" />)}
                           </Pie>
                           <RechartsTooltip contentStyle={{ backgroundColor: '#090f20', borderRadius: '12px', border: '1px solid #D4AF37', color: '#fff' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} />
                           <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#fff', fontWeight: 'bold', paddingTop: '10px' }}/>
                         </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </EnhancedSortableWidgetWrapper>
              );
`;
  content = content.replace("if (widget.id === 'partnerAnalytics') return (", jsxBlockStr + "\n              if (widget.id === 'partnerAnalytics') return (");
}

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf-8');
