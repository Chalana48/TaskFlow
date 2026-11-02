import React from 'react';

const PRIORITY_CONFIG = {
  LOW: {
    label: 'Low',
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icon: '↓',
  },
  MEDIUM: {
    label: 'Medium',
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: '→',
  },
  HIGH: {
    label: 'High',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: '↑',
  },
  CRITICAL: {
    label: 'Critical',
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse',
    icon: '⚡',
  },
};

export const PriorityBadge = ({ priority = 'MEDIUM', className = '' }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.bg} ${className}`}
    >
      <span className="text-[10px]">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default PriorityBadge;
