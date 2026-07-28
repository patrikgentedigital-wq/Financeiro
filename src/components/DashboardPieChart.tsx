import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryBreakdownItem } from '../utils/calculations';
import { formatCurrencyBRL } from '../data/categories';

interface DashboardPieChartProps {
  categoryChartData: CategoryBreakdownItem[];
}

export const DashboardPieChart: React.FC<DashboardPieChartProps> = ({ categoryChartData }) => {
  return (
    <div className="space-y-4">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryChartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {categoryChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#120f24" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val?: any) => formatCurrencyBRL(Number(val || 0))}
              contentStyle={{
                backgroundColor: '#1c1833',
                borderColor: '#8b5cf6',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend List */}
      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
        {categoryChartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-gray-300 truncate">{item.emoji} {item.name}</span>
            <span className="text-white font-bold ml-auto">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
