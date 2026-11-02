import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import TaskFormModal from '../../components/tasks/TaskFormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Alert from '../../components/common/Alert';

export const KanbanPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  // Search & filter state inside board
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState('TODO');
  const [editingTask, setEditingTask] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load project & tasks
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const [projRes, tasksRes] = await Promise.all([
        projectService.getProjectById(projectId),
        taskService.getTasks({ project: projectId, limit: 100 }),
      ]);

      if (projRes?.data) setProject(projRes.data);
      if (tasksRes?.data?.tasks) setTasks(tasksRes.data.tasks);
    } catch (err) {
      setError(err.message || 'Failed to load project Kanban board');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Authorization check
  const canManage = Boolean(
    user &&
      project &&
      (user.role === 'ADMIN' ||
        (project.manager &&
          (typeof project.manager === 'object'
            ? project.manager._id === user._id
            : project.manager === user._id)))
  );

  // Filter tasks locally for rapid Kanban responsiveness
  const filteredTasks = tasks.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchLabel = t.labels?.some((l) => l.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchLabel) return false;
    }

    if (priorityFilter && t.priority !== priorityFilter) return false;

    if (assigneeFilter) {
      if (assigneeFilter === 'me') {
        const aId = typeof t.assignedTo === 'object' ? t.assignedTo?._id : t.assignedTo;
        if (aId !== user?._id) return false;
      } else if (assigneeFilter === 'unassigned') {
        if (t.assignedTo) return false;
      }
    }

    return true;
  });

  // Modal Triggers
  const handleOpenAddTask = (status = 'TODO') => {
    setEditingTask(null);
    setModalDefaultStatus(status);
    setIsFormModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setIsFormModalOpen(true);
  };

  // Form submit (create or update)
  const handleFormSubmit = async (formData) => {
    setIsSaving(true);
    try {
      if (editingTask) {
        const res = await taskService.updateTask(editingTask._id, formData);
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? res.data : t)));
        setNotification({ type: 'success', message: 'Task updated successfully' });
      } else {
        const res = await taskService.createTask({
          ...formData,
          status: formData.status || modalDefaultStatus,
        });
        setTasks((prev) => [res.data, ...prev]);
        setNotification({ type: 'success', message: 'Task created on board' });
      }
      setIsFormModalOpen(false);
      setEditingTask(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete task
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await taskService.deleteTask(taskToDelete._id);
      setTasks((prev) => prev.filter((t) => t._id !== taskToDelete._id));
      setNotification({
        type: 'success',
        message: `Task "${taskToDelete.title}" deleted from board`,
      });
      setTaskToDelete(null);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete task' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Extract all team candidates for TaskFormModal
  const projectMembers = project
    ? [project.manager, ...(project.members || [])].filter(Boolean)
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-96">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Project Not Found or Access Denied</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {error || 'Unable to access Kanban board for this project.'}
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <Link to="/projects" className="hover:text-white transition-colors">
              Projects
            </Link>
            <span>/</span>
            <Link to={`/projects/${project._id}`} className="hover:text-white transition-colors">
              {project.name}
            </Link>
            <span>/</span>
            <span className="text-white">Kanban Board</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {project.name}
            </h1>
            <StatusBadge status={project.status} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            to={`/projects/${project._id}`}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-colors"
          >
            ← Project Details
          </Link>

          <button
            type="button"
            onClick={() => handleOpenAddTask('TODO')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-primary-600/25 transition-all transform active:scale-95"
          >
            <span className="text-base leading-none">+</span>
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Global Notification */}
      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Kanban Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Quick Search */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search board cards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          {/* Assignee quick filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Assignees</option>
            <option value="me">Assigned to Me</option>
            <option value="unassigned">Unassigned</option>
          </select>

          {(search || priorityFilter || assigneeFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPriorityFilter('');
                setAssigneeFilter('');
              }}
              className="text-xs text-primary-400 hover:text-primary-300 font-medium"
            >
              Reset Filters ✕
            </button>
          )}
        </div>

        {/* Task Counter */}
        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-white font-bold">{filteredTasks.length}</span> of {tasks.length} tasks
        </div>
      </div>

      {/* The Drag & Drop Kanban Board */}
      <KanbanBoard
        tasks={filteredTasks}
        onTasksChange={(newTasks) => setTasks(newTasks)}
        onAddTask={handleOpenAddTask}
        onEditTask={handleOpenEditTask}
        onDeleteTask={(t) => setTaskToDelete(t)}
        canManage={canManage}
      />

      {/* Task Create / Edit Modal */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={
          editingTask || {
            status: modalDefaultStatus,
            project: project._id,
          }
        }
        presetProjectId={project._id}
        projectMembers={projectMembers}
        title={editingTask ? 'Edit Task' : `New Task (${modalDefaultStatus})`}
        isLoading={isSaving}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete Task from Board?"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
};

export default KanbanPage;
