import React from 'react';

/**
 * Reusable Metric Stat Card with Skeleton Loading
 */
export const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendPositive = true,
  colorScheme = 'indigo',
  loading = false,
  className = '',
}) => {
  const colorStyles = {
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'hover:border-indigo-500/40',
      glow: 'shadow-indigo-500/5',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'hover:border-emerald-500/40',
      glow: 'shadow-emerald-500/5',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'hover:border-amber-500/40',
      glow: 'shadow-amber-500/5',
    },
    rose: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'hover:border-rose-500/40',
      glow: 'shadow-rose-500/5',
    },
    sky: {
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'hover:border-sky-500/40',
      glow: 'shadow-sky-500/5',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'hover:border-purple-500/40',
      glow: 'shadow-purple-500/5',
    },
  };

  const currentTheme = colorStyles[colorScheme] || colorStyles.indigo;

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-20 h-4 bg-slate-800 rounded"></div>
          <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
        </div>
        <div className="w-16 h-8 bg-slate-800 rounded mb-2"></div>
        <div className="w-28 h-3 bg-slate-800/60 rounded"></div>
      </div>
    );
  }

  return (
    <div
      className={`p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg ${currentTheme.glow} ${currentTheme.border} transition duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${currentTheme.bg} ${currentTheme.text} flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value ?? 0}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          {description && <span className="text-slate-400 truncate">{description}</span>}
          {trend && (
            <span
              className={`shrink-0 font-medium px-2 py-0.5 rounded-full text-[11px] ${
                trendPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
