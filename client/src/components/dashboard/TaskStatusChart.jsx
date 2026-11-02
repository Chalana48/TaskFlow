import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  TODO: { label: 'To Do', color: '#94a3b8' }, // Slate 400
  IN_PROGRESS: { label: 'In Progress', color: '#38bdf8' }, // Sky 400
  IN_REVIEW: { label: 'In Review', color: '#fbbf24' }, // Amber 400
  DONE: { label: 'Done', color: '#34d399' }, // Emerald 400
};

export const TaskStatusChart = ({ data = {}, loading = false, error = null }) => {
  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 h-80 flex flex-col justify-between animate-pulse">
        <div className="w-32 h-5 bg-slate-800 rounded"></div>
        <div className="w-40 h-40 bg-slate-800/60 rounded-full mx-auto"></div>
        <div className="flex justify-center gap-4">
          <div className="w-16 h-3 bg-slate-800 rounded"></div>
          <div className="w-16 h-3 bg-slate-800 rounded"></div>
          <div className="w-16 h-3 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 h-80 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
        <p className="text-sm text-slate-300 font-medium">Unable to load task status distribution</p>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
      </div>
    );
  }

  const chartData = [
    { name: 'To Do', key: 'TODO', value: data.TODO || 0, color: STATUS_CONFIG.TODO.color },
    { name: 'In Progress', key: 'IN_PROGRESS', value: data.IN_PROGRESS || 0, color: STATUS_CONFIG.IN_PROGRESS.color },
    { name: 'In Review', key: 'IN_REVIEW', value: data.IN_REVIEW || 0, color: STATUS_CONFIG.IN_REVIEW.color },
    { name: 'Done', key: 'DONE', value: data.DONE || 0, color: STATUS_CONFIG.DONE.color },
  ];

  const totalTasks = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (totalTasks === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 h-80 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400 mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300">No Task Status Data</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Create or assign tasks to view live status distribution on this dashboard.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = totalTasks > 0 ? ((item.value / totalTasks) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-950/95 border border-slate-800 px-3 py-2 rounded-xl shadow-xl backdrop-blur-md text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color }} />
            {item.name}: <span className="text-white">{item.value}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{percentage}% of all tasks</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col h-80">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-white">Task Status Breakdown</h3>
          <p className="text-xs text-slate-400">Distribution across active workflow stages</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
          {totalTasks} Total
        </span>
      </div>

      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="#0f172a"
              strokeWidth={2}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.key}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => (
                <span className="text-xs text-slate-400 font-medium">
                  {value} ({entry.payload.value})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TaskStatusChart;
