import React from 'react';
import { Link } from 'react-router-dom';
import PriorityBadge from '../common/PriorityBadge';
import TaskStatusBadge from '../common/TaskStatusBadge';

export const TaskTable = ({
  tasks = [],
  onEdit,
  onDelete,
  canManageTask,
  showProject = true,
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="w-full overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
          <tr>
            <th scope="col" className="px-5 py-4">Task</th>
            {showProject && <th scope="col" className="px-4 py-4">Project</th>}
            <th scope="col" className="px-4 py-4">Status</th>
            <th scope="col" className="px-4 py-4">Priority</th>
            <th scope="col" className="px-4 py-4">Assignee</th>
            <th scope="col" className="px-4 py-4">Due Date</th>
            <th scope="col" className="px-4 py-4">Labels</th>
            <th scope="col" className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {tasks.map((task) => {
            const isOverdue =
              task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
            const canManage = canManageTask ? canManageTask(task) : false;

            return (
              <tr
                key={task._id}
                className="hover:bg-slate-800/40 transition-colors group"
              >
                {/* Task Title & Description preview */}
                <td className="px-5 py-4">
                  <Link
                    to={`/tasks/${task._id}`}
                    className="font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-1 text-sm"
                  >
                    {task.title}
                  </Link>
                  {task.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-xs">
                      {task.description}
                    </p>
                  )}
                </td>

                {/* Project Name */}
                {showProject && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    {task.project?.name ? (
                      <Link
                        to={`/projects/${task.project._id || task.project}`}
                        className="text-slate-300 hover:text-white font-medium truncate max-w-[140px] block"
                      >
                        📁 {task.project.name}
                      </Link>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                )}

                {/* Status Badge */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <TaskStatusBadge status={task.status} />
                </td>

                {/* Priority Badge */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <PriorityBadge priority={task.priority} />
                </td>

                {/* Assignee */}
                <td className="px-4 py-4 whitespace-nowrap">
                  {task.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-600/30 border border-primary-500/30 text-primary-300 font-bold flex items-center justify-center text-[10px]">
                        {task.assignedTo.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="font-medium text-slate-300 text-xs">
                        {task.assignedTo.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic text-xs">Unassigned</span>
                  )}
                </td>

                {/* Due Date */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`${
                      isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {isOverdue && '⚠️ '}
                    {formatDate(task.dueDate)}
                  </span>
                </td>

                {/* Labels */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 flex-wrap max-w-xs">
                    {task.labels && task.labels.length > 0 ? (
                      task.labels.slice(0, 2).map((l, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 border border-slate-700/60"
                        >
                          #{l}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/tasks/${task._id}`}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      View
                    </Link>

                    {canManage && (
                      <>
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(task)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs"
                            title="Edit"
                          >
                            ✏️
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(task)}
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

export default TaskTable;
