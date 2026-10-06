
import React from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Policy } from '../types';

interface ChartsProps {
  policies: Policy[];
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1'];

export const PremiumDistributionChart: React.FC<ChartsProps> = ({ policies }) => {
  const dataMap = new Map<string, number>();
  
  policies.forEach(p => {
    const current = dataMap.get(p.category) || 0;
    dataMap.set(p.category, current + p.premium);
  });

  const data = Array.from(dataMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[350px]">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">年度保费分布 (按险种)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, value }) => `${name}: ¥${value.toLocaleString()}`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `¥${value.toLocaleString()}`}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CoverageByPersonChart: React.FC<ChartsProps> = ({ policies }) => {
  const dataMap = new Map<string, number>();
  
  // Group by person name roughly
  policies.forEach(p => {
    // Simplified logic to extract Name (taking first part before space or parenthesis)
    // Also handle Chinese parenthesis
    const namePart = p.insuredPerson.split(' ')[0].split('(')[0].split('（')[0]; 
    const current = dataMap.get(namePart) || 0;
    dataMap.set(namePart, current + p.coverageAmount);
  });

  const data = Array.from(dataMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[350px]">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">家庭成员总保额分布</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 60, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
          <Tooltip 
             formatter={(value: number) => `¥${(value / 10000).toFixed(0)}万`}
             cursor={{fill: '#f8fafc'}}
             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar 
            dataKey="value" 
            fill="#3b82f6" 
            radius={[0, 4, 4, 0]} 
            barSize={24}
            label={{ 
              position: 'right', 
              formatter: (value: number) => `¥${(value / 10000).toFixed(0)}万`,
              fill: '#475569',
              fontSize: 12,
              fontWeight: 500
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
