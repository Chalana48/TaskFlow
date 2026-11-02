import React from 'react';

const STATUS_CONFIG = {
  PLANNING: {
    label: 'Planning',
    bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    dot: 'bg-slate-400',
  },
  ACTIVE: {
    label: 'Active',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  ON_HOLD: {
    label: 'On Hold',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    dot: 'bg-indigo-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    dot: 'bg-rose-400',
  },
};

export const StatusBadge = ({ status = 'PLANNING', className = '' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PLANNING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
