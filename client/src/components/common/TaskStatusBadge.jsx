import React from 'react';

const TASK_STATUS_CONFIG = {
  TODO: {
    label: 'To Do',
    bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    dot: 'bg-slate-400',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400',
  },
  IN_REVIEW: {
    label: 'In Review',
    bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    dot: 'bg-purple-400',
  },
  DONE: {
    label: 'Done',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
};

export const TaskStatusBadge = ({ status = 'TODO', className = '' }) => {
  const config = TASK_STATUS_CONFIG[status] || TASK_STATUS_CONFIG.TODO;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default TaskStatusBadge;
