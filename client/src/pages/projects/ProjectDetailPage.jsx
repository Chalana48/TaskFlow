import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import ProjectFormModal from '../../components/projects/ProjectFormModal';
import TaskFormModal from '../../components/tasks/TaskFormModal';
import TaskCard from '../../components/tasks/TaskCard';
import AddMemberModal from '../../components/projects/AddMemberModal';
import ChangeManagerModal from '../../components/projects/ChangeManagerModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Alert from '../../components/common/Alert';
import RecentActivity from '../../components/dashboard/RecentActivity';
import dashboardService from '../../services/dashboardService';

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [isChangeManagerOpen, setIsChangeManagerOpen] = useState(false);
  const [isChangingManager, setIsChangingManager] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Project Activity Timeline State
  const [activities, setActivities] = useState([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);

  // Fetch Project & Tasks
  const fetchProjectAndTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      setIsActivitiesLoading(true);
      const [projRes, tasksRes, actRes] = await Promise.all([
        projectService.getProjectById(id),
        taskService.getTasks({ project: id, limit: 100 }),
        dashboardService.getRecentActivity(10, id).catch(() => ({ data: [] })),
      ]);
      if (projRes?.data) setProject(projRes.data);
      if (tasksRes?.data?.tasks) setTasks(tasksRes.data.tasks);
      if (actRes?.data) setActivities(actRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setIsLoading(false);
      setIsActivitiesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectAndTasks();
  }, [fetchProjectAndTasks]);

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

  // Date formatting
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Mock progress percentage based on status for structure
  const getProgressPercentage = (status) => {
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

  // Actions
  const handleEditSubmit = async (formData) => {
    setIsSavingEdit(true);
    try {
      const res = await projectService.updateProject(id, formData);
      setProject(res.data);
      setNotification({ type: 'success', message: 'Project settings updated successfully' });
      setIsEditModalOpen(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      await projectService.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete project' });
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const handleAddMember = async (userId) => {
    setIsAddingMember(true);
    try {
      const res = await projectService.addMember(id, userId);
      setProject(res.data);
      setNotification({ type: 'success', message: 'New member successfully added' });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemovingMember(true);
    try {
      const res = await projectService.removeMember(id, memberToRemove._id);
      setProject(res.data);
      setNotification({
        type: 'success',
        message: `Removed ${memberToRemove.name} from project`,
      });
      setMemberToRemove(null);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to remove member' });
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleChangeManager = async (newManagerId) => {
    setIsChangingManager(true);
    try {
      const res = await projectService.updateManager(id, newManagerId);
      setProject(res.data);
      setNotification({ type: 'success', message: 'Project manager updated successfully' });
    } finally {
      setIsChangingManager(false);
    }
  };

  // Task actions
  const handleTaskSubmit = async (formData) => {
    setIsSavingTask(true);
    try {
      if (editingTask) {
        const res = await taskService.updateTask(editingTask._id, formData);
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? res.data : t)));
        setNotification({ type: 'success', message: 'Task updated successfully' });
      } else {
        const res = await taskService.createTask({ ...formData, project: id });
        setTasks((prev) => [res.data, ...prev]);
        setNotification({ type: 'success', message: 'Task created successfully' });
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleDeleteTaskConfirm = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      await taskService.deleteTask(taskToDelete._id);
      setTasks((prev) => prev.filter((t) => t._id !== taskToDelete._id));
      setNotification({
        type: 'success',
        message: `Task "${taskToDelete.title}" deleted successfully`,
      });
      setTaskToDelete(null);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete task' });
    } finally {
      setIsDeletingTask(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-slate-800 rounded-lg mb-4" />
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
          <div className="h-8 w-1/3 bg-slate-800 rounded-xl" />
          <div className="h-4 w-2/3 bg-slate-800/60 rounded" />
          <div className="h-20 w-full bg-slate-800/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Project Not Found or Access Denied</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {error || "The project you are trying to view does not exist or you don't have authorization to view it."}
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

  const progress = getProgressPercentage(project.status);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Back Link */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <span>←</span>
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Notification Banner */}
      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Hero Header Card */}
      <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {project.image && (
          <div className="mb-6 rounded-2xl overflow-hidden max-h-56 w-full border border-slate-800">
            <img
              src={project.image}
              alt={project.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {project.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

          {/* Action buttons (Only for Manager / Admin) */}
          {canManage && (
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>✏️</span>
                <span>Edit Project</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Progress structure placeholder */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-medium">Overall Project Progress</span>
            <span className="text-white font-semibold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                project.status === 'COMPLETED'
                  ? 'bg-emerald-500'
                  : project.status === 'ACTIVE'
                  ? 'bg-primary-500'
                  : project.status === 'ON_HOLD'
                  ? 'bg-amber-500'
                  : 'bg-slate-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metadata Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Project Manager Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Project Manager
          </span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-600/20 border border-primary-500/30 text-primary-400 font-bold flex items-center justify-center text-sm shrink-0">
              {project.manager?.name ? project.manager.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {project.manager?.name || 'Unassigned'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {project.manager?.email || 'No email'}
              </p>
            </div>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setIsChangeManagerOpen(true)}
              className="mt-3 text-[11px] font-medium text-primary-400 hover:text-primary-300 block"
            >
              Transfer Management →
            </button>
          )}
        </div>

        {/* Start Date Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Start Date
          </span>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗓️</span>
            <div>
              <p className="text-xs font-bold text-white">{formatDate(project.startDate)}</p>
              <p className="text-[11px] text-slate-500">Kickoff date</p>
            </div>
          </div>
        </div>

        {/* End Date (Deadline) Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Target Deadline
          </span>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏁</span>
            <div>
              <p className="text-xs font-bold text-white">{formatDate(project.endDate)}</p>
              <p className="text-[11px] text-slate-500">Target completion</p>
            </div>
          </div>
        </div>

        {/* Total Collaborators */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Team Size
          </span>
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <p className="text-xs font-bold text-white">
                {(project.members?.length || 0) + (project.manager ? 1 : 0)} Members
              </p>
              <p className="text-[11px] text-slate-500">Active contributors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Team Members</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              People who have access to collaborate on this project
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => setIsAddMemberOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 border border-primary-500/30 text-xs font-semibold rounded-xl transition-all"
            >
              <span>+</span>
              <span>Add Member</span>
            </button>
          )}
        </div>

        {/* Member Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Manager Badge item */}
          {project.manager && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-primary-500/30 flex items-center justify-between relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600/30 border border-primary-500/40 text-primary-300 font-bold flex items-center justify-center text-xs shrink-0">
                  {project.manager.name?.charAt(0).toUpperCase() || 'M'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-white truncate">
                      {project.manager.name}
                    </p>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary-500/20 text-primary-400 border border-primary-500/30">
                      LEAD
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">@{project.manager.username}</p>
                </div>
              </div>
            </div>
          )}

          {/* Other Members */}
          {project.members && project.members.length > 0 ? (
            project.members.map((member) => (
              <div
                key={member._id}
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 hover:border-slate-700/80 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs shrink-0">
                    {member.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{member.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">@{member.username}</p>
                  </div>
                </div>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => setMemberToRemove(member)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-xs shrink-0"
                    title="Remove member"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          ) : (
            !project.manager && (
              <p className="text-xs text-slate-500 py-4 col-span-full">No team members assigned yet.</p>
            )
          )}
        </div>
      </div>

      {/* Live Tasks & Kanban Section */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Project Tasks</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700/60">
                {tasks.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Deliverables and sprint task breakdown
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/projects/${project._id}/board`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-xl transition-all"
            >
              <span>📊</span>
              <span>Open Kanban Board →</span>
            </Link>

            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-primary-600/25 transition-all"
              >
                <span>+</span>
                <span>Add Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Task Cards Grid */}
        {tasks.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl">
            <div className="text-2xl mb-1">📋</div>
            <p className="text-xs font-semibold text-slate-300">No tasks created yet for this project</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Create tasks to break down milestones and assign them to your team members.
            </p>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                + Create Task
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                canManage={canManage}
                onEdit={(t) => {
                  setEditingTask(t);
                  setIsTaskModalOpen(true);
                }}
                onDelete={(t) => setTaskToDelete(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project Activity Timeline Section */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        <RecentActivity
          activities={activities}
          loading={isActivitiesLoading}
          error={activitiesError}
        />
      </div>

      {/* Modals */}
      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={project}
        title="Edit Project Settings"
        isLoading={isSavingEdit}
      />

      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        initialData={editingTask}
        presetProjectId={project._id}
        projectMembers={[project.manager, ...(project.members || [])].filter(Boolean)}
        title={editingTask ? 'Edit Task' : 'Add Project Task'}
        isLoading={isSavingTask}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onAddMember={handleAddMember}
        currentMembers={project.members}
        currentManager={project.manager}
        isLoading={isAddingMember}
      />

      <ChangeManagerModal
        isOpen={isChangeManagerOpen}
        onClose={() => setIsChangeManagerOpen(false)}
        onChangeManager={handleChangeManager}
        currentManager={project.manager}
        candidates={project.members || []}
        isLoading={isChangingManager}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Project?"
        message={`Are you sure you want to permanently delete "${project.name}"? This action cannot be undone.`}
        confirmText="Delete Project"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteProject}
        onCancel={() => setIsDeleteOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!memberToRemove}
        title="Remove Member?"
        message={`Are you sure you want to remove ${memberToRemove?.name} from this project?`}
        confirmText="Remove Member"
        isDestructive={true}
        isLoading={isRemovingMember}
        onConfirm={handleRemoveMember}
        onCancel={() => setMemberToRemove(null)}
      />

      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete Task?"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        isDestructive={true}
        isLoading={isDeletingTask}
        onConfirm={handleDeleteTaskConfirm}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
};

export default ProjectDetailPage;
