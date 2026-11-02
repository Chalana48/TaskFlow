import React from 'react';
import { Link } from 'react-router-dom';
import PriorityBadge from '../common/PriorityBadge';
import TaskStatusBadge from '../common/TaskStatusBadge';

export const TaskCard = ({
  task,
  onEdit,
  onDelete,
  canManage = false,
  showProject = false,
  isDraggable = false,
}) => {
  const {
    _id,
    title,
    description,
    project,
    assignedTo,
    status,
    priority,
    dueDate,
    estimatedHours,
    labels = [],
    comments = [],
  } = task;

  // Check if task is overdue (dueDate in the past and not completed)
  const isOverdue = Boolean(
    dueDate && new Date(dueDate) < new Date() && status !== 'DONE'
  );

  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`group relative bg-slate-900/90 border rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-slate-950/50 flex flex-col justify-between ${
        isOverdue
          ? 'border-rose-500/40 bg-rose-950/10 hover:border-rose-500/60'
          : 'border-slate-800/80 hover:border-slate-700/80'
      }`}
    >
      <div>
        {/* Header: Project label (if enabled), Status / Priority Badges, and Quick Actions */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={priority} />
            {showProject && project?.name && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60 truncate max-w-[120px]">
                {project.name}
              </span>
            )}
            {isOverdue && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                ⚠️ Overdue
              </span>
            )}
          </div>

          {/* Action buttons */}
          {canManage && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs"
                  title="Edit Task"
                >
                  ✏️
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(task);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-xs"
                  title="Delete Task"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <Link
          to={`/tasks/${_id}`}
          className="block font-semibold text-white text-sm tracking-tight group-hover:text-primary-400 transition-colors line-clamp-2"
        >
          {title}
        </Link>

        {/* Description snippet */}
        {description && (
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {description}
          </p>
        )}

        {/* Labels chips */}
        {labels && labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {labels.slice(0, 3).map((lbl, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50"
              >
                #{lbl}
              </span>
            ))}
            {labels.length > 3 && (
              <span className="text-[10px] text-slate-500 font-medium">
                +{labels.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Assignee, Due Date, Comments, Hours */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5 min-w-0">
          {assignedTo ? (
            <>
              <div
                className="w-5 h-5 rounded-full bg-primary-600/30 border border-primary-500/40 text-primary-300 font-bold flex items-center justify-center text-[9px] shrink-0"
                title={`Assigned to: ${assignedTo.name}`}
              >
                {assignedTo.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="truncate max-w-[80px] text-slate-300 text-[11px]">
                {assignedTo.name}
              </span>
            </>
          ) : (
            <span className="text-slate-500 italic text-[11px]">Unassigned</span>
          )}
        </div>

        {/* Metadata info: Comments & Due date */}
        <div className="flex items-center gap-2.5">
          {estimatedHours > 0 && (
            <span className="text-slate-400" title={`Estimated: ${estimatedHours}h`}>
              ⏱️ {estimatedHours}h
            </span>
          )}

          {comments?.length > 0 && (
            <span className="flex items-center gap-0.5 text-slate-400" title={`${comments.length} comments`}>
              💬 {comments.length}
            </span>
          )}

          {dueDate && (
            <span
              className={`flex items-center gap-1 font-medium ${
                isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'
              }`}
              title={`Due Date: ${formatDueDate(dueDate)}`}
            >
              📅 {formatDueDate(dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
