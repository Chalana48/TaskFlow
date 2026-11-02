import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';

export const CompletionTrendChart = ({
  data = [],
  period = 'weekly',
  onPeriodChange,
  loading = false,
  error = null,
}) => {
  const periods = [
    { id: 'daily', label: 'Daily (30D)' },
    { id: 'weekly', label: 'Weekly (12W)' },
    { id: 'monthly', label: 'Monthly (12M)' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-800 px-3 py-2 rounded-xl shadow-xl backdrop-blur-md text-xs">
          <p className="text-[11px] text-slate-400 font-medium mb-1 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-indigo-400" />
            Period: <span className="text-white font-mono">{label}</span>
          </p>
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            Completed: <span className="text-white">{payload[0].value} tasks</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalCompleted = data.reduce((acc, curr) => acc + (curr.completed || 0), 0);

  return (
    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col h-80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Task Completion Velocity</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {totalCompleted} Finished
            </span>
          </div>
          <p className="text-xs text-slate-400">Trend of tasks transitioned to DONE with completion timestamps</p>
        </div>

        {/* Period Selector Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-slate-950/80 border border-slate-800 self-start sm:self-auto">
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriodChange && onPeriodChange(p.id)}
              disabled={loading}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                period === p.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full relative">
        {loading ? (
          <div className="w-full h-full flex flex-col justify-end gap-2 p-2 animate-pulse">
            <div className="w-full h-3/4 bg-slate-800/40 rounded-xl"></div>
            <div className="flex justify-between">
              <div className="w-12 h-3 bg-slate-800 rounded"></div>
              <div className="w-12 h-3 bg-slate-800 rounded"></div>
              <div className="w-12 h-3 bg-slate-800 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
            <p className="text-sm text-slate-300 font-medium">Unable to load completion trend</p>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400 mb-2">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300">No Historical Completion Trends</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              When tasks are completed on the Kanban board or task detail views, their completion timeline will appear here automatically.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="period"
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
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#completionGradient)"
                activeDot={{ r: 6, fill: '#818cf8', stroke: '#0f172a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default CompletionTrendChart;
