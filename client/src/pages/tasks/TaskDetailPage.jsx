import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import taskService from '../../services/taskService';
import PriorityBadge from '../../components/common/PriorityBadge';
import TaskStatusBadge from '../../components/common/TaskStatusBadge';
import TaskFormModal from '../../components/tasks/TaskFormModal';
import TaskCommentSection from '../../components/tasks/TaskCommentSection';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Alert from '../../components/common/Alert';

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
];

export const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Task
  const fetchTask = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await taskService.getTaskById(id);
      if (res?.data) {
        setTask(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // Check authorization to edit/delete metadata
  const canManage = Boolean(
    user &&
      task &&
      (user.role === 'ADMIN' ||
        (task.project &&
          (typeof task.project.manager === 'object'
            ? task.project.manager._id === user._id
            : task.project.manager === user._id)))
  );

  const isOverdue = Boolean(
    task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Status quick change
  const handleStatusChange = async (newStatus) => {
    try {
      const res = await taskService.updateTaskStatus(id, newStatus);
      setTask((prev) => ({ ...prev, status: newStatus }));
      setNotification({ type: 'success', message: `Status updated to ${newStatus}` });
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to update status' });
    }
  };

  // Form edit submission
  const handleEditSubmit = async (formData) => {
    setIsSavingEdit(true);
    try {
      const res = await taskService.updateTask(id, formData);
      setTask(res.data);
      setNotification({ type: 'success', message: 'Task updated successfully' });
      setIsEditModalOpen(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    setIsDeleting(true);
    try {
      await taskService.deleteTask(id);
      navigate('/tasks');
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete task' });
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  // Comments
  const handleAddComment = async (message) => {
    const res = await taskService.addComment(id, message);
    if (res?.data) {
      setTask(res.data);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const res = await taskService.deleteComment(id, commentId);
    if (res?.data) {
      setTask(res.data);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-slate-800 rounded-lg mb-4" />
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
          <div className="h-8 w-2/3 bg-slate-800 rounded-xl" />
          <div className="h-24 w-full bg-slate-800/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Task Not Found or Access Denied</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {error || 'The task you are looking for does not exist or you lack permission to view it.'}
        </p>
        <Link
          to="/tasks"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          ← Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link to="/tasks" className="hover:text-white transition-colors">
          Tasks
        </Link>
        <span>/</span>
        {task.project && (
          <>
            <Link
              to={`/projects/${task.project._id || task.project}`}
              className="hover:text-white transition-colors"
            >
              {task.project.name || 'Project'}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-white truncate max-w-xs">{task.title}</span>
      </div>

      {/* Global Notification */}
      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Task Header Card */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={task.priority} />
              <TaskStatusBadge status={task.status} />
              {isOverdue && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                  ⚠️ Overdue
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {task.title}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Status Select */}
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Status: {opt.label}
                </option>
              ))}
            </select>

            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-colors flex items-center gap-1"
                >
                  <span>✏️</span>
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 rounded-xl transition-colors flex items-center gap-1"
                >
                  <span>🗑️</span>
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="pt-4 border-t border-slate-800/80">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Description
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {task.description || 'No description provided for this task.'}
          </p>
        </div>

        {/* Labels chips */}
        {task.labels && task.labels.length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Labels
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {task.labels.map((l, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full bg-slate-800 text-xs text-slate-300 border border-slate-700/50"
                >
                  #{l}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assignee Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Assignee
          </span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-600/20 border border-primary-500/30 text-primary-400 font-bold flex items-center justify-center text-sm shrink-0">
              {task.assignedTo?.name ? task.assignedTo.name.charAt(0).toUpperCase() : '—'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {task.assignedTo?.name || 'Unassigned'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {task.assignedTo?.email || 'No assignee'}
              </p>
            </div>
          </div>
        </div>

        {/* Due Date Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Target Due Date
          </span>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p
                className={`text-xs font-bold ${
                  isOverdue ? 'text-rose-400 font-extrabold' : 'text-white'
                }`}
              >
                {formatDate(task.dueDate)}
              </p>
              <p className="text-[11px] text-slate-500">
                {isOverdue ? 'Deadline passed' : 'Target delivery'}
              </p>
            </div>
          </div>
        </div>

        {/* Estimated Hours Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Estimated Effort
          </span>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏱️</span>
            <div>
              <p className="text-xs font-bold text-white">
                {task.estimatedHours ? `${task.estimatedHours} Hours` : 'Not specified'}
              </p>
              <p className="text-[11px] text-slate-500">Time estimate</p>
            </div>
          </div>
        </div>

        {/* Project Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Project
          </span>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📁</span>
            <div className="min-w-0 flex-1">
              <Link
                to={`/projects/${task.project?._id || task.project}`}
                className="text-xs font-bold text-white hover:text-primary-400 truncate block transition-colors"
              >
                {task.project?.name || 'Project Overview'}
              </Link>
              <Link
                to={`/projects/${task.project?._id || task.project}/board`}
                className="text-[11px] text-primary-400 hover:text-primary-300 block"
              >
                Open Kanban →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Comments & Activity Section */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        <TaskCommentSection
          comments={task.comments || []}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          canManage={canManage}
        />
      </div>

      {/* Edit Modal */}
      <TaskFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={task}
        presetProjectId={task.project?._id || task.project}
        title="Edit Task Details"
        isLoading={isSavingEdit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Task?"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteTask}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};

export default TaskDetailPage;
