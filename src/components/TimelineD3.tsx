import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Case, Hearing, Task } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Maximize2, 
  RotateCcw, 
  Scale, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  ChevronRight, 
  ChevronLeft, 
  TrendingUp,
  Inbox,
  Filter
} from 'lucide-react';

interface TimelineD3Props {
  hearings: Hearing[];
  tasks: Task[];
  cases?: Case[];
}

export default function TimelineD3({ hearings, tasks, cases = [] }: TimelineD3Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [filterType, setFilterType] = useState<'all' | 'hearings' | 'tasks'>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Parse and sort all events chronologically
  const allEvents = React.useMemo(() => {
    const list: any[] = [];
    
    // Helper function to detect fake/mock data
    const isMockData = (item: any) => {
      const textToSearch = [
        item.title || '',
        item.caseName || '',
        item.caseNumber || '',
        item.description || '',
        item.courtName || '',
        item.notes || ''
      ].join(' ').toLowerCase();

      return !item.caseNumber ||
             textToSearch.includes('test') || 
             textToSearch.includes('dummy') || 
             textToSearch.includes('تجربة') || 
             textToSearch.includes('تجريبي') ||
             textToSearch.includes('وهمي') || 
             textToSearch.includes('1234') ||
             textToSearch.includes('0000');
    };

    // Convert hearings to timeline events
    hearings.forEach(h => {
      if (isMockData(h)) return;

      list.push({
        id: `hearing-${h.id}`,
        date: new Date(h.date),
        rawDate: h.date,
        time: h.time || 'غير محدد',
        title: h.caseName || 'جلسة قضائية بمحكمة الاستئناف',
        type: 'hearing',
        caseNumber: h.caseNumber,
        courtName: h.courtName || 'المحكمة العامة',
        hallNumber: h.hallNumber || 'غير محدد',
        status: h.status || 'upcoming',
        notes: h.notes || ''
      });
    });

    // Convert cases to timeline events
    if (cases && Array.isArray(cases)) {
      cases.forEach(c => {
        if (isMockData(c)) return;

        // 1. Creation date milestone
        if (c.createdAt) {
          list.push({
            id: `case-create-${c.id}`,
            date: new Date(c.createdAt),
            rawDate: c.createdAt,
            time: '08:00 ص',
            title: `تأسيس ملف الدعوى: ${c.caseName || c.title || 'ملف دعوى'}`,
            type: 'case-creation',
            caseNumber: c.caseNumber,
            courtName: c.courtName || 'مكتب المحاماة',
            hallNumber: `تأسيس وحوسبة الملف القضائي رقم ${c.caseNumber}`,
            status: 'completed',
            notes: c.details || ''
          });
        }
        
        // 2. Appeal Deadline milestone
        if (c.appeal_deadline) {
          list.push({
            id: `case-appeal-${c.id}`,
            date: new Date(c.appeal_deadline),
            rawDate: c.appeal_deadline,
            time: '23:59 م',
            title: `انتهاء مهلة الاستئناف للدعوى (${c.caseNumber})`,
            type: 'deadline',
            caseNumber: c.caseNumber,
            courtName: 'مهلة نظامية',
            hallNumber: `آخر موعد لتقديم لائحة الاعتراض والاستئناف`,
            status: 'warning',
            notes: `حسب المدد المنصوص عليها نظاماً`
          });
        }
        
        // 3. Next Session milestone
        if (c.nextSessionDate) {
          const sessionDateTimeStr = `${c.nextSessionDate}T${c.nextSessionTime || '09:00'}`;
          list.push({
            id: `case-session-${c.id}`,
            date: new Date(sessionDateTimeStr),
            rawDate: sessionDateTimeStr,
            time: c.nextSessionTime || '09:00 ص',
            title: `جلسة قضائية قادمة: ${c.caseName || c.title || 'قضية'}`,
            type: 'hearing',
            caseNumber: c.caseNumber,
            courtName: c.courtName || 'المحكمة المختصة',
            hallNumber: `جلسة قضائية للقضية رقم ${c.caseNumber}`,
            status: 'upcoming',
            notes: c.summary || ''
          });
        }
      });
    }

    // Convert tasks to timeline events
    tasks.forEach(t => {
      if (isMockData(t)) return;

      if (t.dueDate) {
        list.push({
          id: `task-${t.id}`,
          date: new Date(t.dueDate),
          rawDate: t.dueDate,
          time: t.targetCompletionTime ? new Date(t.targetCompletionTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'طوال اليوم',
          title: t.title,
          type: 'task',
          caseNumber: t.caseNumber || 'غير مرتبط',
          courtName: t.priority === 'high' ? 'أولوية قصوى' : t.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية عادية',
          hallNumber: t.description || 'لا يوجد وصف تفصيلي',
          status: t.status || 'pending',
          priority: t.priority || 'medium'
        });
      }
    });

    // Sort chronologically ascending
    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [hearings, tasks, cases]);

  // Filtered list of events
  const filteredEvents = React.useMemo(() => {
    return allEvents.filter(ev => {
      if (filterType === 'hearings') return ev.type === 'hearing';
      if (filterType === 'tasks') return ev.type === 'task';
      return true;
    });
  }, [allEvents, filterType]);

  // Set default selected event
  useEffect(() => {
    if (filteredEvents.length > 0 && !selectedEventId) {
      // Find the first upcoming event if possible
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = filteredEvents.find(ev => ev.date >= today);
      setSelectedEventId(upcoming ? upcoming.id : filteredEvents[0].id);
    }
  }, [filteredEvents, selectedEventId]);

  // D3 Implementation for Visual Sparkline/Timeline Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || filteredEvents.length === 0) return;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth - 30;
    const height = 65;
    const margin = { top: 10, right: 30, bottom: 25, left: 30 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define X Scale
    const x = d3.scaleTime()
      .domain([
        d3.min(filteredEvents, d => d.date) || new Date(),
        d3.max(filteredEvents, d => d.date) || new Date()
      ])
      .range([0, chartWidth]);

    // Zoom behavior for interactive timeline mapping
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .extent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        const newX = event.transform.rescaleX(x);
        g.select<SVGGElement>('.x-axis').call(d3.axisBottom(newX).ticks(5).tickFormat((d: any) => {
          return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
        }));
        
        g.selectAll<SVGCircleElement, any>('.event-dot')
          .attr('cx', d => newX(d.date));
          
        g.selectAll<SVGLineElement, any>('.ver-line')
          .attr('x1', d => newX(d.date))
          .attr('x2', d => newX(d.date));
      });

    svg.call(zoom);

    // Draw central timeline timeline line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', chartHeight / 2)
      .attr('x2', chartWidth)
      .attr('y2', chartHeight / 2)
      .attr('stroke', '#E2E8F0')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '4 4');

    // Create D3 Axes
    const xAxis = d3.axisBottom(x)
      .ticks(Math.min(filteredEvents.length, 5))
      .tickFormat((d: any) => {
        return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
      });

    const axisG = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis);

    axisG.selectAll('text')
      .style('font-family', 'Inter, sans-serif')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', '#0B2545');

    axisG.select('.domain').attr('stroke', '#CBD5E1');
    axisG.selectAll('.tick line').attr('stroke', '#CBD5E1');

    // Add visual vertical drop line for each point
    g.selectAll('.ver-line')
      .data(filteredEvents)
      .enter()
      .append('line')
      .attr('class', 'ver-line')
      .attr('x1', d => x(d.date))
      .attr('y1', chartHeight / 2)
      .attr('x2', d => x(d.date))
      .attr('y2', chartHeight)
      .attr('stroke', '#0B2545')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.2)
      .attr('stroke-dasharray', '2 2');

    // Plot event dots
    g.selectAll('.event-dot')
      .data(filteredEvents)
      .enter()
      .append('circle')
      .attr('class', 'event-dot cursor-pointer transition-all duration-300')
      .attr('cx', d => x(d.date))
      .attr('cy', chartHeight / 2)
      .attr('r', d => d.id === selectedEventId ? 9 : 6)
      .attr('fill', d => {
        if (d.type === 'case-creation') return '#8B5CF6'; // Violet for creation
        if (d.type === 'deadline') return '#EF4444';      // Red for critical warnings
        if (d.type === 'hearing') {
          return d.status === 'completed' ? '#10B981' : '#F59E0B';
        }
        return d.status === 'done' || d.status === 'completed' ? '#10B981' : '#2563EB';
      })
      .attr('stroke', d => d.id === selectedEventId ? '#0B2545' : '#FFFFFF')
      .attr('stroke-width', d => d.id === selectedEventId ? 3 : 2)
      .on('click', (event, d) => {
        setSelectedEventId(d.id);
        const cardElem = document.getElementById(`timeline-card-${d.id}`);
        if (cardElem) {
          cardElem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      })
      .append('title')
      .text(d => `${d.title} (${d.rawDate})`);

  }, [filteredEvents, selectedEventId]);

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity);
  };

  const scrollAmount = (direction: 'right' | 'left') => {
    if (scrollContainerRef.current) {
      const scrollVal = direction === 'right' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollVal, behavior: 'smooth' });
    }
  };

  const selectedEvent = filteredEvents.find(ev => ev.id === selectedEventId);

  return (
    <div 
      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-5 relative overflow-hidden font-sans" 
      ref={containerRef}
      dir="rtl"
    >
      {/* Main Header of Timeline Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Scale className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-black text-base lg:text-lg text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
               التسلسل الزمني للمقاضاة
            </h3>
            <p className="font-bold text-xs text-slate-500 mt-1">
               متابعة الجلسات والمواعيد والمهام المرتبطة بالقضايا المسجلة.
            </p>
          </div>
        </div>

        {/* Filter Controls & Micro HUD */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Quick Stats Summary */}
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>جلسات ({filteredEvents.filter(e => e.type === 'hearing').length})</span>
            </div>
            <div className="w-px h-3 bg-slate-200"></div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>مهام ومهل ({filteredEvents.filter(e => e.type === 'task' || e.type === 'deadline').length})</span>
            </div>
          </div>

          {/* Action Filters Selection */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => { setFilterType('all'); setSelectedEventId(null); }}
              className={`px-2 py-1 text-[11px] font-black rounded-md transition-all ${filterType === 'all' ? 'bg-[#0B2545] text-white shadow-sm' : 'text-slate-200 hover:text-white'}`}
            >
              الكل
            </button>
            <button
              onClick={() => { setFilterType('hearings'); setSelectedEventId(null); }}
              className={`px-2 py-1 text-[11px] font-black rounded-md transition-all ${filterType === 'hearings' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-800 hover:text-slate-900'}`}
            >
              الجلسات
            </button>
            <button
              onClick={() => { setFilterType('tasks'); setSelectedEventId(null); }}
              className={`px-2 py-1 text-[11px] font-black rounded-md transition-all ${filterType === 'tasks' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-800 hover:text-slate-900'}`}
            >
              المهام
            </button>
          </div>
        </div>
      </div>

      {/* Empty State Handler */}
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-4">
          <div className="p-4 bg-white rounded-full shadow-md text-slate-400">
            <Inbox className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#0B2545]">لا يوجد تسلسل زمني حقيقي حالياً</h4>
            <p className="text-xs text-slate-500 mt-1">لا تتوفر أي جلسات قضائية أو مهام مسجلة معينة بتواريخ استحقاق نشطة.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Main Horizontal Timeline Ribbon Scroll Area */}
          <div className="relative">
            {/* Scroll Navigation Buttons left/right */}
            <div className="absolute top-1/2 -translate-y-1/2 right-0 -mr-3 z-30">
              <button 
                onClick={() => scrollAmount('right')}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 text-[#0B2545] hover:bg-slate-50 transition-all flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 left-0 -ml-3 z-30">
              <button 
                onClick={() => scrollAmount('left')}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 text-[#0B2545] hover:bg-slate-50 transition-all flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Horizontal Track List Container */}
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-4 py-4 px-6 scrollbar-hide scroll-smooth relative"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {/* Central connection line passing underneath the cards */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-100 via-slate-300 to-slate-100 -translate-y-1/2 z-0 pointer-events-none"></div>

              {filteredEvents.map((ev, index) => {
                const isSelected = ev.id === selectedEventId;
                const isHearing = ev.type === 'hearing';
                
                // Beautiful date display computation
                const eventDay = ev.date.toLocaleDateString('ar-EG', { day: 'numeric' });
                const eventMonthYear = ev.date.toLocaleDateString('ar-EG', { month: 'short' });
                const dayOfWeek = ev.date.toLocaleDateString('ar-EG', { weekday: 'short' });

                return (
                  <div
                    key={ev.id}
                    id={`timeline-card-${ev.id}`}
                    onClick={() => setSelectedEventId(ev.id)}
                    className={`flex-shrink-0 w-[205px] rounded-2xl p-4 border transition-all duration-300 transform cursor-pointer relative z-10 select-none ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02] -translate-y-1' 
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                    }`}
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    {/* Header: Date Badge & Type */}
                    <div className="flex justify-between items-start mb-3">
                      {/* Event Type Indicator Icon */}
                      <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                        isSelected 
                          ? isHearing ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                          : isHearing ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isHearing ? 'جلسة' : 'مهمة'}
                      </span>

                      {/* Timeline Dot visual connection flag */}
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold font-mono ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>#{index + 1}</span>
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          isSelected ? 'bg-amber-500' : isHearing ? 'bg-amber-500' : 'bg-blue-600'
                        }`}></div>
                      </div>
                    </div>

                    {/* Milestone Huge Date Visual */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className={`text-3xl font-black tracking-tight tabular-nums ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {eventDay}
                      </span>
                      <div className="flex flex-col">
                        <span className={`text-xs font-black leading-none ${isSelected ? 'text-amber-400' : 'text-amber-600'}`}>
                          {eventMonthYear}
                        </span>
                        <span className={`text-[10px] font-bold mt-1 leading-none ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{dayOfWeek}</span>
                      </div>
                    </div>

                    {/* Main Event Title and Body text */}
                    <div className="space-y-1.5 min-h-[40px]">
                      <h4 className={`text-xs font-black leading-snug line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {ev.title}
                      </h4>
                      <p className={`text-[10px] font-bold font-mono tracking-tight flex items-center gap-1 ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        <span>قضية: {ev.caseNumber}</span>
                      </p>
                    </div>

                    {/* Micro location/Time footer */}
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-dashed" style={{ borderColor: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`} />
                        <span className={`${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>{ev.time}</span>
                      </div>
                      
                      {isHearing ? (
                        <span className={`text-[10px] font-black ${isSelected ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {ev.courtName.substring(0, 14)}...
                        </span>
                      ) : (
                        <span className={`text-[10px] font-black uppercase ${
                          ev.priority === 'high' ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded' : (isSelected ? 'text-slate-300' : 'text-slate-500')
                        }`}>
                          {ev.courtName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        {/* Connected Dynamic Detail Box of the Selected Event */}
        <AnimatePresence mode="wait">
          {selectedEvent && (
            <motion.div
              key={selectedEvent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative"
            >
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    selectedEvent.type === 'case-creation' ? 'bg-violet-500' :
                    selectedEvent.type === 'deadline' ? 'bg-red-500' :
                    selectedEvent.type === 'hearing' ? 'bg-amber-500' : 'bg-blue-600'
                  }`}></span>
                  <h4 className="text-base font-black text-slate-900 leading-tight">{selectedEvent.title}</h4>
                </div>

                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-2xl bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  {selectedEvent.notes || selectedEvent.hallNumber || 'لا توجد تفاصيل وملاحظات مدونة لهذا الإجراء حتى الآن.'}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">رقم الدعوى المعنية</span>
                    <span className="text-sm font-black text-slate-900 font-mono tracking-tight">{selectedEvent.caseNumber}</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">وقت الاستحقاق</span>
                    <span className="text-sm font-black text-amber-600">
                      {selectedEvent.date.toLocaleDateString('ar-SA')} | {selectedEvent.time}
                    </span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm col-span-2 md:col-span-1">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">المكان / المرجع</span>
                    <span className="text-sm font-black text-slate-900">{selectedEvent.courtName}</span>
                  </div>
                </div>
              </div>

              {/* Right side graphical focus HUD */}
              <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col justify-between relative overflow-hidden shadow-lg border border-slate-800">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="space-y-1 z-10">
                  <span className="text-[10px] font-bold text-slate-400 block mb-2">تصنيف الإجراء</span>
                  <h3 className="text-lg font-black text-white">
                    {selectedEvent.type === 'case-creation' ? 'تأسيس ملف الدعوى' : 
                     selectedEvent.type === 'deadline' ? 'مهلة استئناف نظامية' :
                     selectedEvent.type === 'hearing' ? 'جلسة مقاضاة مرئية' : 'مستند قضائي هام'}
                  </h3>
                </div>

                <div className="flex items-end justify-between mt-6 z-10 w-full">
                  <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/50 flex-1 ml-3">
                    <span className="text-[10px] block text-slate-400 font-bold mb-1">الحالة</span>
                    <span className={`text-xs font-black ${
                      selectedEvent.status === 'completed' || selectedEvent.status === 'done'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}>
                      {selectedEvent.status === 'completed' || selectedEvent.status === 'done' ? 'مكتمل ✓' : 'قيد الانتظار'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

          {/* D3 Interactive Graph Section for advanced charting view */}
          <div className="space-y-2 border-t border-slate-100 pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="text-xs font-black text-[#0B2545]">مخطط المسافات والإسقاط الإحصائي لتواريخ المواعيد (D3 Interactive Grid)</h4>
              </div>
              <button 
                onClick={handleResetZoom}
                className="text-[11px] font-black text-[#0B2545] hover:text-[#826217] flex items-center gap-1.5 transition-colors cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط مخطط D3</span>
              </button>
            </div>

            <div className="w-full h-[65px] bg-slate-50/50 border border-slate-100 rounded-xl relative overflow-hidden">
              <svg 
                ref={svgRef} 
                className="w-full h-full cursor-move z-10"
                viewBox={`0 0 1000 65`}
                preserveAspectRatio="xMinYMid meet"
              />
            </div>
            
            <p className="text-[10px] text-slate-400 text-center font-bold">
              * يمكنك استخدام بكرة الفأرة للتكبير والتصغير (Zoom) أو السحب للتحرك يميناً ويساراً على طول مسار D3 المتقدم.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
