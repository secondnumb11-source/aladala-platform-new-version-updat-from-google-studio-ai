/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';

const data = [
  { name: 'S', value: 40 },
  { name: 'M', value: 30 },
  { name: 'T', value: 65 },
  { name: 'W', value: 45 },
  { name: 'T', value: 90 },
  { name: 'F', value: 70 },
  { name: 'S', value: 85 },
];

export default function MiniChart({ color = '#b8860b' }: { color?: string }) {
  const [themeTick, setThemeTick] = React.useState(Date.now());

  React.useEffect(() => {
    const handleThemeEvent = () => setThemeTick(Date.now());
    window.addEventListener('adalah-advanced-config-updated', handleThemeEvent);
    return () => window.removeEventListener('adalah-advanced-config-updated', handleThemeEvent);
  }, []);

  return (
    <div style={{ width: '100%', height: 60 }}>
      <ResponsiveContainer width="100%" height="100%" key={themeTick}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="miniChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '10px',
              padding: '4px 8px',
              color: '#fff' 
            }}
            labelStyle={{ display: 'none' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            fillOpacity={1} 
            fill="url(#miniChartGradient)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
