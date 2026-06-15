import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Hearing, Task } from '@/types';
import { motion } from 'motion/react';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface TimelineD3Props {
  hearings: Hearing[];
  tasks: Task[];
}

export default function TimelineD3({ hearings, tasks }: TimelineD3Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Data preparation
    interface TimelineEvent {
      id: string;
      date: Date;
      title: string;
      type: 'hearing' | 'task';
      status: string;
      caseNumber: string;
    }

    const events: TimelineEvent[] = [
      ...hearings.map(h => ({
        id: `h-${h.id}`,
        date: new Date(h.date),
        title: `جلسة: ${h.caseName}`,
        type: 'hearing' as const,
        status: h.status,
        caseNumber: h.caseNumber
      })),
      ...tasks.filter(t => t.dueDate).map(t => ({
        id: `t-${t.id}`,
        date: new Date(t.dueDate),
        title: `موعد نهائي: ${t.title}`,
        type: 'task' as const,
        status: t.status,
        caseNumber: t.caseNumber
      }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    if (events.length === 0) return;

    // Clear previous SVG content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = 180;
    const margin = { top: 20, right: 30, bottom: 40, left: 30 };

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleTime()
      .domain([
        d3.min(events, d => d.date) || new Date(),
        d3.max(events, d => d.date) || new Date()
      ])
      .range([0, width - margin.left - margin.right]);

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 20])
      .extent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        const newX = event.transform.rescaleX(x);
        g.select<SVGGElement>('.x-axis').call(d3.axisBottom(newX));
        g.selectAll<SVGCircleElement, TimelineEvent>('.event-node')
          .attr('cx', d => newX(d.date));
        g.selectAll<SVGTextElement, TimelineEvent>('.event-label')
          .attr('x', d => newX(d.date));
      });

    svg.call(zoom);

    // Axes
    const xAxis = d3.axisBottom(x);
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-family', 'Inter, sans-serif')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', '#64748b');

    // Grid lines (vertical)
    g.append('path')
      .attr('class', 'timeline-line')
      .attr('d', d3.line()([[0, (height - margin.top - margin.bottom) / 2], [width - margin.left - margin.right, (height - margin.top - margin.bottom) / 2]]))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 2);

    // Tooltip
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .attr('class', 'absolute hidden bg-white border border-slate-200 p-3 rounded-xl shadow-xl z-50 text-right pointer-events-none')
      .style('font-family', 'Cairo, sans-serif');

    // Event nodes
    const nodes = g.selectAll('.event-node')
      .data(events)
      .enter()
      .append('circle')
      .attr('class', 'event-node cursor-pointer transition-all duration-300')
      .attr('cx', d => x(d.date))
      .attr('cy', (height - margin.top - margin.bottom) / 2)
      .attr('r', 6)
      .attr('fill', d => d.type === 'hearing' ? '#f59e0b' : '#3b82f6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('r', 10).attr('stroke', d.type === 'hearing' ? '#fbbf24' : '#60a5fa');
        tooltip
          .style('left', `${event.pageX - containerRef.current!.getBoundingClientRect().left + 10}px`)
          .style('top', `${event.pageY - containerRef.current!.getBoundingClientRect().top - 40}px`)
          .classed('hidden', false)
          .html(`
            <div class="space-y-1">
              <p class="text-[10px] font-black text-[#826217] uppercase tracking-widest">${d.type === 'hearing' ? 'جلسة' : 'موعد نهائي'}</p>
              <p class="text-xs font-black text-[#0B2545]">${d.title}</p>
              <p class="text-[10px] font-bold text-slate-800">${d.date.toLocaleDateString('ar-SA')}</p>
              <p class="text-[10px] font-mono text-[#826217] font-black">#${d.caseNumber}</p>
            </div>
          `);
      })
      .on('mouseout', (event, d) => {
        d3.select(event.currentTarget).attr('r', 6).attr('stroke', '#fff');
        tooltip.classed('hidden', true);
      });

    // Labels
    g.selectAll('.event-label')
      .data(events)
      .enter()
      .append('text')
      .attr('class', 'event-label text-[10px] font-black fill-[#0B2545] font-sans pointer-events-none')
      .attr('x', d => x(d.date))
      .attr('y', (height - margin.top - margin.bottom) / 2 - 14)
      .attr('text-anchor', 'middle')
      .text(d => d.date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }));

  }, [hearings, tasks]);

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity);
  };

  return (
    <div className="bg-white border-4 border-[#D4AF37] rounded-[2rem] p-5 shadow-sm space-y-4 relative group" ref={containerRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 text-[#0B2545] rounded-xl">
            <Maximize2 className="w-5 h-5" style={{ color: '#0B2545' }} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm tracking-tight" style={{ color: '#0B2545', textShadow: 'none' }}>التسلسل الزمني الإستراتيجي</h3>
            <p className="font-bold text-[10px]" style={{ color: '#826217', textShadow: 'none' }}>مخطط تفاعلي لرصد المواعيد القضائية والجلسات.</p>
          </div>
        </div>

        <div className="flex gap-2">
           <button 
             onClick={handleResetZoom}
             className="p-2 bg-slate-50 border border-slate-200 rounded-lg transition-all font-black text-[11px] flex items-center gap-1.5 hover:bg-slate-100"
             style={{ color: '#0B2545', borderColor: '#0B254530' }}
             title="إعادة ضبط العرض"
           >
             <RotateCcw className="w-3 h-3 text-[#0B2545]" />
             إعادة الضبط
           </button>
           <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 text-[11px] font-black" style={{ color: '#0B2545' }}>
             <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> جلسات
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1.5"></div> مهام
           </div>
        </div>
      </div>

      <div className="w-full h-[180px] overflow-hidden relative border border-slate-100 rounded-2xl bg-slate-50/50">
        <svg 
          ref={svgRef} 
          className="w-full h-full cursor-move"
          viewBox="0 0 1000 180"
          preserveAspectRatio="xMidYMid meet"
        />
        
        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 transition-opacity">
           <button className="p-2 bg-white border border-slate-200 rounded-lg shadow-md transition-colors">
              <ZoomIn className="w-4 h-4 text-slate-200 font-bold" />
           </button>
           <button className="p-2 bg-white border border-slate-200 rounded-lg shadow-md transition-colors">
              <ZoomOut className="w-4 h-4 text-slate-200 font-bold" />
           </button>
        </div>
      </div>
    </div>
  );
}
