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
import { FolderKanban, AlertCircle } from 'lucide-react';

const STATUS_COLORS = {
  Planning: '#a855f7', // Purple 500
  Active: '#3b82f6', // Blue 500
  'On Hold': '#f59e0b', // Amber 500
  Completed: '#10b981', // Emerald 500
  Cancelled: '#ef4444', // Red 500
};

export const ProjectStatusChart = ({ data = {}, loading = false, error = null }) => {
  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 h-80 flex flex-col justify-between animate-pulse">
        <div className="w-32 h-5 bg-slate-800 rounded"></div>
        <div className="space-y-3 my-auto">
          <div className="w-full h-6 bg-slate-800 rounded"></div>
          <div className="w-4/5 h-6 bg-slate-800 rounded"></div>
          <div className="w-3/5 h-6 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 h-80 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
        <p className="text-sm text-slate-300 font-medium">Unable to load project statistics</p>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
      </div>
    );
  }

  const rawByStatus = data.byStatus || {};

  const chartData = [
    { name: 'Planning', value: rawByStatus.PLANNING ?? data.planning ?? 0, color: STATUS_COLORS.Planning },
    { name: 'Active', value: rawByStatus.ACTIVE ?? data.active ?? 0, color: STATUS_COLORS.Active },
    { name: 'On Hold', value: rawByStatus.ON_HOLD ?? data.onHold ?? 0, color: STATUS_COLORS['On Hold'] },
    { name: 'Completed', value: rawByStatus.COMPLETED ?? data.completed ?? 0, color: STATUS_COLORS.Completed },
    { name: 'Cancelled', value: rawByStatus.CANCELLED ?? data.cancelled ?? 0, color: STATUS_COLORS.Cancelled },
  ];

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 h-80 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400 mb-3">
          <FolderKanban className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300">No Projects Found</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Create a project to see live status breakdown across all portfolio stages.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-slate-950/95 border border-slate-800 px-3 py-2 rounded-xl shadow-xl backdrop-blur-md text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color }} />
            {item.payload.name}: <span className="text-white">{item.value} project{item.value !== 1 ? 's' : ''}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col h-80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Project Pipeline</h3>
          <p className="text-xs text-slate-400">Distribution across lifecycle stages</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
          {total} Total
        </span>
      </div>

      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              allowDecimals={false}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={`bar-${entry.name}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProjectStatusChart;
