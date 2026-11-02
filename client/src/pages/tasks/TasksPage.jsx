import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import TaskCard from '../../components/tasks/TaskCard';
import TaskTable from '../../components/tasks/TaskTable';
import TaskFormModal from '../../components/tasks/TaskFormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Alert from '../../components/common/Alert';

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
];

const PRIORITY_FILTERS = [
  { value: '', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'dueDate:asc', label: 'Earliest Due Date' },
  { value: 'title:asc', label: 'Title (A to Z)' },
];

export const TasksPage = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [projectsList, setProjectsList] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [sortOption, setSortOption] = useState('createdAt:desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load projects for filter dropdown
  useEffect(() => {
    projectService
      .getProjects({ limit: 50 })
      .then((res) => {
        setProjectsList(res?.data?.projects || []);
      })
      .catch(() => {});
  }, []);

  // Search input debounce (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const [sortBy, sortOrder] = sortOption.split(':');
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch.trim() || undefined,
        project: projectFilter || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        assignedTo:
          assigneeFilter === 'me'
            ? user?._id
            : assigneeFilter === 'unassigned'
            ? 'unassigned'
            : undefined,
        sortBy,
        sortOrder,
      };

      const res = await taskService.getTasks(params);
      if (res?.data) {
        setTasks(res.data.tasks || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve tasks');
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    projectFilter,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    sortOption,
    user?._id,
  ]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Permissions helper
  const canManageTask = (t) => {
    if (!user || !t) return false;
    if (user.role === 'ADMIN') return true;
    const project = t.project;
    if (project) {
      const managerId = typeof project.manager === 'object' ? project.manager?._id : project.manager;
      if (managerId && managerId === user._id) return true;
    }
    return false;
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setProjectFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
    setSortOption('createdAt:desc');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (t) => {
    setEditingTask(t);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsSaving(true);
    try {
      if (editingTask) {
        await taskService.updateTask(editingTask._id, formData);
        setNotification({ type: 'success', message: 'Task updated successfully' });
      } else {
        await taskService.createTask(formData);
        setNotification({ type: 'success', message: 'Task created successfully' });
      }
      setIsFormModalOpen(false);
      setEditingTask(null);
      await fetchTasks();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await taskService.deleteTask(taskToDelete._id);
      setNotification({
        type: 'success',
        message: `Task "${taskToDelete.title}" deleted successfully`,
      });
      setTaskToDelete(null);
      await fetchTasks();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete task' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track individual work items, assignees, deadlines, and delivery milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-primary-600/25 transition-all transform active:scale-95"
          >
            <span className="text-base leading-none">+</span>
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="md:col-span-3 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search tasks, labels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Project Filter */}
          <div className="md:col-span-2">
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 truncate"
            >
              <option value="">All Projects</option>
              {projectsList.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="md:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PRIORITY_FILTERS.map((pr) => (
                <option key={pr.value} value={pr.value}>
                  {pr.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="md:col-span-1">
            <select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-2 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Assignee</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

          {/* Sort & Controls */}
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-2 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 truncate"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-slate-800/80 border border-slate-700/80 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                ☰
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                ▦
              </button>
            </div>
          </div>
        </div>

        {/* Clear Filters bar if any filter is active */}
        {(search || projectFilter || statusFilter || priorityFilter || assigneeFilter) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400">Filters applied</span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              Clear Filters ✕
            </button>
          </div>
        )}
      </div>

      {/* Main View Area */}
      {error ? (
        <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-3xl">
          <p className="text-sm font-semibold text-rose-400">{error}</p>
          <button
            type="button"
            onClick={fetchTasks}
            className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : isLoading ? (
        /* Loading Skeletons */
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 h-16 animate-pulse flex items-center justify-between"
            >
              <div className="w-1/3 h-5 bg-slate-800 rounded-lg" />
              <div className="w-20 h-5 bg-slate-800 rounded-full" />
              <div className="w-24 h-5 bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-3xl">
            📋
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {debouncedSearch || projectFilter || statusFilter || priorityFilter || assigneeFilter
              ? 'No matching tasks found'
              : 'No tasks yet'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {debouncedSearch || projectFilter || statusFilter || priorityFilter || assigneeFilter
              ? 'Try modifying your search criteria or clearing your filters.'
              : 'Create your first task to start organizing deliverables, sprints, and priorities.'}
          </p>
          <div className="mt-5">
            {debouncedSearch || projectFilter || statusFilter || priorityFilter || assigneeFilter ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Clear All Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-primary-600/25 transition-all"
              >
                + Create First Task
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <TaskTable
          tasks={tasks}
          canManageTask={canManageTask}
          onEdit={handleOpenEditModal}
          onDelete={(t) => setTaskToDelete(t)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              showProject={true}
              canManage={canManageTask(task)}
              onEdit={handleOpenEditModal}
              onDelete={(t) => setTaskToDelete(t)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
          <div>
            Showing{' '}
            <span className="font-semibold text-white">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-white">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold text-white">{pagination.total}</span> tasks
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-semibold">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Task Create / Edit Modal */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTask}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        isLoading={isSaving}
      />

      {/* Task Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete Task?"
        message={`Are you sure you want to permanently delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
};

export default TasksPage;
