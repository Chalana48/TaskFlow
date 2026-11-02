import React, { useState, useEffect } from 'react';
import projectService from '../../services/projectService';
import Alert from '../common/Alert';

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export const TaskFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  presetProjectId = null,
  projectMembers = [],
  title = 'Create Task',
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: presetProjectId || '',
    assignedTo: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
    estimatedHours: '',
    labels: '',
  });

  const [availableProjects, setAvailableProjects] = useState([]);
  const [availableMembers, setAvailableMembers] = useState(projectMembers || []);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Fetch projects if not provided presetProjectId
  useEffect(() => {
    if (isOpen && !presetProjectId) {
      projectService
        .getProjects({ limit: 50 })
        .then((res) => {
          const projs = res?.data?.projects || [];
          setAvailableProjects(projs);
          if (!formData.project && projs.length > 0) {
            setFormData((prev) => ({ ...prev, project: projs[0]._id }));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, presetProjectId]);

  // When selected project changes, update available members
  useEffect(() => {
    const activeProjId = formData.project || presetProjectId;
    if (activeProjId && (!projectMembers || projectMembers.length === 0)) {
      projectService
        .getProjectById(activeProjId)
        .then((res) => {
          const p = res?.data;
          if (p) {
            const list = [];
            if (p.manager) list.push(p.manager);
            if (Array.isArray(p.members)) list.push(...p.members);
            setAvailableMembers(list);
          }
        })
        .catch(() => {});
    } else if (projectMembers && projectMembers.length > 0) {
      setAvailableMembers(projectMembers);
    }
  }, [formData.project, presetProjectId, projectMembers]);

  // Populate data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        project:
          typeof initialData.project === 'object'
            ? initialData.project?._id
            : initialData.project || presetProjectId || '',
        assignedTo:
          typeof initialData.assignedTo === 'object'
            ? initialData.assignedTo?._id
            : initialData.assignedTo || '',
        status: initialData.status || 'TODO',
        priority: initialData.priority || 'MEDIUM',
        dueDate: initialData.dueDate ? initialData.dueDate.substring(0, 10) : '',
        estimatedHours:
          initialData.estimatedHours !== undefined && initialData.estimatedHours !== null
            ? String(initialData.estimatedHours)
            : '',
        labels: Array.isArray(initialData.labels) ? initialData.labels.join(', ') : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        project: presetProjectId || (availableProjects[0]?._id || ''),
        assignedTo: '',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: '',
        estimatedHours: '',
        labels: '',
      });
    }
    setErrors({});
    setServerError('');
  }, [initialData, isOpen, presetProjectId, availableProjects]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length > 150) {
      newErrors.title = 'Title cannot exceed 150 characters';
    }

    if (!formData.project) {
      newErrors.project = 'Project selection is required';
    }

    if (formData.estimatedHours !== '' && formData.estimatedHours !== null) {
      const num = Number(formData.estimatedHours);
      if (isNaN(num) || num < 0 || num > 1000) {
        newErrors.estimatedHours = 'Must be between 0 and 1000 hours';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        project: formData.project,
        assignedTo: formData.assignedTo || null,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || null,
        estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : 0,
        labels: formData.labels
          ? formData.labels
              .split(',')
              .map((l) => l.trim())
              .filter(Boolean)
          : [],
      };

      await onSubmit(payload);
    } catch (err) {
      setServerError(err.message || 'Failed to save task');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/50 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {initialData ? 'Update task requirements, priority, or assignee' : 'Create and assign a new deliverable'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {serverError && (
          <div className="mt-4">
            <Alert type="error" message={serverError} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Implement user authentication flow"
              className={`w-full px-4 py-2.5 bg-slate-800/80 border rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                errors.title ? 'border-rose-500/80 focus:ring-rose-500' : 'border-slate-700/80'
              }`}
            />
            {errors.title && <p className="text-[11px] text-rose-400 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Add details, criteria for completion, or reproduction steps..."
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>

          {/* Project & Assignee Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Project <span className="text-rose-400">*</span>
              </label>
              {presetProjectId ? (
                <input
                  type="text"
                  disabled
                  value="Current Project"
                  className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-400 text-xs cursor-not-allowed"
                />
              ) : (
                <select
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 bg-slate-800/80 border rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.project ? 'border-rose-500/80' : 'border-slate-700/80'
                  }`}
                >
                  <option value="">-- Choose Project --</option>
                  {availableProjects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.project && <p className="text-[11px] text-rose-400 mt-1">{errors.project}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Assignee
              </label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Unassigned</option>
                {availableMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} (@{m.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Estimated Hours Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Estimated Hours
              </label>
              <input
                type="number"
                name="estimatedHours"
                min="0"
                max="1000"
                step="0.5"
                placeholder="e.g. 4.5"
                value={formData.estimatedHours}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 bg-slate-800/80 border rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.estimatedHours ? 'border-rose-500/80' : 'border-slate-700/80'
                }`}
              />
              {errors.estimatedHours && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.estimatedHours}</p>
              )}
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Labels / Tags (comma separated)
            </label>
            <input
              type="text"
              name="labels"
              value={formData.labels}
              onChange={handleChange}
              placeholder="e.g. frontend, bug, api, high-impact"
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-lg shadow-primary-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              )}
              {initialData ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
