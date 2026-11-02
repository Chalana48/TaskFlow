import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';

export const ProjectTable = ({ projects = [], onEdit, onDelete, canManageProject }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
          <tr>
            <th scope="col" className="px-5 py-4">Project</th>
            <th scope="col" className="px-4 py-4">Status</th>
            <th scope="col" className="px-4 py-4">Priority</th>
            <th scope="col" className="px-4 py-4">Manager</th>
            <th scope="col" className="px-4 py-4">Start Date</th>
            <th scope="col" className="px-4 py-4">End Date</th>
            <th scope="col" className="px-4 py-4">Members</th>
            <th scope="col" className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {projects.map((project) => {
            const isManager = canManageProject ? canManageProject(project) : false;
            return (
              <tr
                key={project._id}
                className="hover:bg-slate-800/40 transition-colors group"
              >
                {/* Project Name & Description */}
                <td className="px-5 py-4">
                  <Link
                    to={`/projects/${project._id}`}
                    className="font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-1 text-sm"
                  >
                    {project.name}
                  </Link>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-xs">
                    {project.description || 'No description'}
                  </p>
                </td>

                {/* Status */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <StatusBadge status={project.status} />
                </td>

                {/* Priority */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <PriorityBadge priority={project.priority} />
                </td>

                {/* Manager */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-600/30 border border-primary-500/30 text-primary-300 font-bold flex items-center justify-center text-[10px]">
                      {project.manager?.name ? project.manager.name.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <span className="font-medium text-slate-300 text-xs">
                      {project.manager?.name || 'Unassigned'}
                    </span>
                  </div>
                </td>

                {/* Start Date */}
                <td className="px-4 py-4 whitespace-nowrap text-slate-400">
                  {formatDate(project.startDate)}
                </td>

                {/* End Date */}
                <td className="px-4 py-4 whitespace-nowrap text-slate-400">
                  {formatDate(project.endDate)}
                </td>

                {/* Members Count */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/50">
                    👥 {(project.members?.length || 0) + (project.manager ? 1 : 0)}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/projects/${project._id}`}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      View
                    </Link>

                    {isManager && (
                      <>
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(project)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs"
                            title="Edit"
                          >
                            ✏️
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(project)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-xs"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectTable;
