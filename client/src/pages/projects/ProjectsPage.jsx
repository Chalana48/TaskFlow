import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import projectService from '../../services/projectService';
import ProjectCard from '../../components/projects/ProjectCard';
import ProjectTable from '../../components/projects/ProjectTable';
import ProjectFormModal from '../../components/projects/ProjectFormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Alert from '../../components/common/Alert';

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
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
  { value: 'name:asc', label: 'Name (A to Z)' },
  { value: 'name:desc', label: 'Name (Z to A)' },
];

export const ProjectsPage = () => {
  const { user } = useAuth();

  // State for data
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
  });

  // State for filters & controls
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortOption, setSortOption] = useState('createdAt:desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search input debounce (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch projects from server
  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const [sortBy, sortOrder] = sortOption.split(':');
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        sortBy,
        sortOrder,
      };

      const res = await projectService.getProjects(params);
      if (res?.data) {
        setProjects(res.data.projects || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve projects. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter, priorityFilter, sortOption]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Check if current user has permission to manage a specific project
  const canManageProject = (proj) => {
    if (!user || !proj) return false;
    if (user.role === 'ADMIN') return true;
    const managerId = typeof proj.manager === 'object' ? proj.manager?._id : proj.manager;
    return managerId === user._id;
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setSortOption('createdAt:desc');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handlers for Create / Edit
  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (proj) => {
    setEditingProject(proj);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsSaving(true);
    try {
      if (editingProject) {
        await projectService.updateProject(editingProject._id, formData);
        setNotification({ type: 'success', message: 'Project updated successfully' });
      } else {
        await projectService.createProject(formData);
        setNotification({ type: 'success', message: 'Project created successfully' });
      }
      setIsFormModalOpen(false);
      setEditingProject(null);
      await fetchProjects();
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers for Deletion
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await projectService.deleteProject(projectToDelete._id);
      setNotification({ type: 'success', message: `Project "${projectToDelete.name}" deleted successfully` });
      setProjectToDelete(null);
      await fetchProjects();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete project' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your organization's workspaces, collaborative teams, and roadmap deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-primary-600/25 transition-all transform active:scale-95"
          >
            <span className="text-base leading-none">+</span>
            <span>New Project</span>
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

      {/* Search, Filters & Controls Bar */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search projects by name or description..."
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

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
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
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PRIORITY_FILTERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="md:col-span-2">
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Controls: Reset & View Switcher */}
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            {(search || statusFilter || priorityFilter || sortOption !== 'createdAt:desc') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
                title="Reset Filters"
              >
                Reset
              </button>
            )}

            <div className="flex items-center bg-slate-800/80 border border-slate-700/80 p-0.5 rounded-xl">
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-3xl">
          <p className="text-sm font-semibold text-rose-400">{error}</p>
          <button
            type="button"
            onClick={fetchProjects}
            className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : isLoading ? (
        /* Loading Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 h-64 animate-pulse flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-2 mb-4">
                  <div className="w-16 h-5 bg-slate-800 rounded-full" />
                  <div className="w-14 h-5 bg-slate-800 rounded-full" />
                </div>
                <div className="w-3/4 h-6 bg-slate-800 rounded-xl mb-3" />
                <div className="w-full h-4 bg-slate-800/60 rounded mb-2" />
                <div className="w-2/3 h-4 bg-slate-800/60 rounded" />
              </div>
              <div className="pt-4 border-t border-slate-800/60 flex justify-between">
                <div className="w-24 h-4 bg-slate-800 rounded" />
                <div className="w-16 h-4 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-3xl">
            📁
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {debouncedSearch || statusFilter || priorityFilter
              ? 'No matching projects found'
              : 'No projects yet'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {debouncedSearch || statusFilter || priorityFilter
              ? 'Try modifying your search query or removing some active filters.'
              : 'Create your first project to organize tasks, assign collaborators, and track milestones.'}
          </p>
          <div className="mt-5">
            {debouncedSearch || statusFilter || priorityFilter ? (
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
                + Create First Project
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <ProjectCard
              key={proj._id}
              project={proj}
              canManage={canManageProject(proj)}
              onEdit={handleOpenEditModal}
              onDelete={(p) => setProjectToDelete(p)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <ProjectTable
          projects={projects}
          canManageProject={canManageProject}
          onEdit={handleOpenEditModal}
          onDelete={(p) => setProjectToDelete(p)}
        />
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
            of <span className="font-semibold text-white">{pagination.total}</span> projects
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

      {/* Project Create / Edit Modal */}
      <ProjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingProject}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        isLoading={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!projectToDelete}
        title="Delete Project?"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? All project settings, memberships, and related data will be permanently removed. This action cannot be undone.`}
        confirmText="Delete Project"
        cancelText="Keep Project"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
};

export default ProjectsPage;
