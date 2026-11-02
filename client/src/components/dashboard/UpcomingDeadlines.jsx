import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import PriorityBadge from '../common/PriorityBadge';
import TaskStatusBadge from '../common/TaskStatusBadge';

export const UpcomingDeadlines = ({ tasks = [], loading = false, error = null }) => {
  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="w-36 h-5 bg-slate-800 rounded"></div>
          <div className="w-16 h-4 bg-slate-800 rounded"></div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 bg-slate-800/40 rounded-xl space-y-2">
            <div className="w-3/4 h-4 bg-slate-800 rounded"></div>
            <div className="w-1/2 h-3 bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col items-center justify-center text-center p-8">
        <AlertCircle className="w-7 h-7 text-rose-400 mb-2" />
        <p className="text-sm text-slate-300 font-medium">Unable to load upcoming deadlines</p>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
      </div>
    );
  }

  const formatDueDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Upcoming Deadlines</h3>
        </div>
        <Link
          to="/tasks"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
        >
          View All
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400 mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h4 className="text-sm font-semibold text-slate-300">No Upcoming Deadlines</h4>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            All active tasks are either on schedule or have no pending deadlines due soon.
          </p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
          {tasks.map((task) => (
            <Link
              key={task._id}
              to={`/tasks/${task._id}`}
              className="block p-3.5 rounded-xl bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition group"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition line-clamp-1">
                  {task.title}
                </h4>
                <PriorityBadge priority={task.priority} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-y-1.5 text-[11px] text-slate-400">
                <span className="font-medium text-slate-300 truncate max-w-[140px]">
                  {task.project || 'Unknown Project'}
                </span>

                <div className="flex items-center gap-2">
                  <TaskStatusBadge status={task.status} />

                  <span
                    className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded ${
                      task.isOverdue
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'text-slate-400'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    {task.isOverdue ? 'Overdue: ' : ''}
                    {formatDueDate(task.dueDate)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingDeadlines;
