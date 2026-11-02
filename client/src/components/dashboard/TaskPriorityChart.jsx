import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AlertTriangle, AlertCircle } from 'lucide-react';

const PRIORITY_COLORS = {
  LOW: '#10b981', // Emerald
  MEDIUM: '#38bdf8', // Sky
  HIGH: '#f59e0b', // Amber
  CRITICAL: '#ef4444', // Red
};

export const TaskPriorityChart = ({ data = {}, loading = false, error = null }) => {
  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 h-80 flex flex-col justify-between animate-pulse">
        <div className="w-32 h-5 bg-slate-800 rounded"></div>
        <div className="space-y-3 my-auto">
          <div className="w-full h-5 bg-slate-800 rounded"></div>
          <div className="w-3/4 h-5 bg-slate-800 rounded"></div>
          <div className="w-1/2 h-5 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 h-80 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
        <p className="text-sm text-slate-300 font-medium">Unable to load task priority distribution</p>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
      </div>
    );
  }

  const chartData = [
    { name: 'Low', key: 'LOW', value: data.LOW || 0, color: PRIORITY_COLORS.LOW },
    { name: 'Medium', key: 'MEDIUM', value: data.MEDIUM || 0, color: PRIORITY_COLORS.MEDIUM },
    { name: 'High', key: 'HIGH', value: data.HIGH || 0, color: PRIORITY_COLORS.HIGH },
    { name: 'Critical', key: 'CRITICAL', value: data.CRITICAL || 0, color: PRIORITY_COLORS.CRITICAL },
  ];

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 h-80 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400 mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300">No Priority Data</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Assign priorities to your tasks to see work urgency breakdown.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-950/95 border border-slate-800 px-3 py-2 rounded-xl shadow-xl backdrop-blur-md text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color }} />
            {item.payload.name}: <span className="text-white">{item.value} tasks</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{percent}% of workload</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col h-80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Task Priority Distribution</h3>
          <p className="text-xs text-slate-400">Workload urgency and risk level</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
          {total} Tasks
        </span>
      </div>

      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={11}
              allowDecimals={false}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {chartData.map((entry) => (
                <Cell key={`bar-pri-${entry.name}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TaskPriorityChart;
