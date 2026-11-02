import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';

export const ProjectCard = ({ project, onEdit, onDelete, canManage = false }) => {
  const {
    _id,
    name,
    description,
    status,
    priority,
    manager,
    members = [],
    startDate,
    endDate,
    image,
  } = project;

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Mock progress percentage based on status for structure
  const getProgressPercentage = () => {
    switch (status) {
      case 'COMPLETED':
        return 100;
      case 'ACTIVE':
        return 45;
      case 'ON_HOLD':
        return 25;
      case 'PLANNING':
        return 10;
      case 'CANCELLED':
        return 0;
      default:
        return 0;
    }
  };

  const progress = getProgressPercentage();

  return (
    <div className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/5 flex flex-col justify-between">
      {/* Top Header: Badges & Actions */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={status} />
            <PriorityBadge priority={priority} />
          </div>

          {canManage && (
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(project);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs"
                  title="Edit Project"
                  aria-label="Edit Project"
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
                    onDelete(project);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-xs"
                  title="Delete Project"
                  aria-label="Delete Project"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>

        {/* Project Title & Link */}
        <Link to={`/projects/${_id}`} className="block group-hover:text-primary-400 transition-colors">
          <h3 className="text-lg font-bold text-white tracking-tight line-clamp-1 group-hover:text-primary-400">
            {name}
          </h3>
        </Link>

        {/* Description preview */}
        <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
          {description || 'No description provided.'}
        </p>

        {/* Progress structure placeholder */}
        <div className="mt-4 pt-3 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-slate-400 font-medium">Progress</span>
            <span className="text-white font-semibold">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                status === 'COMPLETED'
                  ? 'bg-emerald-500'
                  : status === 'ACTIVE'
                  ? 'bg-primary-500'
                  : status === 'ON_HOLD'
                  ? 'bg-amber-500'
                  : 'bg-slate-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info: Manager, Members, Dates */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-600/30 border border-primary-500/40 text-primary-300 font-bold flex items-center justify-center text-[10px]">
            {manager?.name ? manager.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <span className="truncate max-w-[100px] text-slate-300 font-medium text-[11px]">
            {manager?.name || 'Unassigned'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Member count */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium" title="Team Members">
            <span>👥</span>
            <span>{members.length + (manager ? 1 : 0)}</span>
          </div>

          {/* End date */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400" title={`Deadline: ${formatDate(endDate)}`}>
            <span>📅</span>
            <span>{formatDate(endDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
