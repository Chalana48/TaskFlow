import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  X,
  User,
  Shield,
  Calendar,
  Mail,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  CheckSquare,
  Activity as ActivityIcon,
} from 'lucide-react';

export const UserDetailsModal = ({ userId, isOpen, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    adminService
      .getUserById(userId)
      .then((res) => {
        if (isMounted) {
          setDetails(res.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Failed to load user details');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const roleColors = {
    ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    PROJECT_MANAGER: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    USER: 'bg-slate-700/50 text-slate-300 border-slate-600',
  };

  const statusColors = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    SUSPENDED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  const taskStatusColors = {
    TODO: 'bg-slate-800 text-slate-300 border-slate-700',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    IN_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    DONE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">User Intelligence Profile</h2>
              <p className="text-xs text-slate-400">Inspecting account details, access permissions & activity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner message="Retrieving user telemetry & associated records..." />
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          ) : details ? (
            <div className="space-y-6">
              {/* User Bio Card */}
              <div className="p-5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    {details.user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{details.user.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5" /> {details.user.email}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">@{details.user.username}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      roleColors[details.user.role] || roleColors.USER
                    }`}
                  >
                    <Shield className="w-3 h-3 inline mr-1" />
                    {details.user.role}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      statusColors[details.user.status] || statusColors.ACTIVE
                    }`}
                  >
                    {details.user.status || 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Task Completion Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Total Tasks
                  </div>
                  <div className="text-xl font-bold text-white mt-1">
                    {details.taskSummary.total}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                  </div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {details.taskSummary.completed}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> In Progress
                  </div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {details.taskSummary.inProgress}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20">
                  <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                  </div>
                  <div className="text-xl font-bold text-rose-400 mt-1">
                    {details.taskSummary.overdue}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'overview'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Accessible Projects ({details.projects?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'tasks'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Assigned Tasks ({details.tasks?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'activity'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Audit Trail ({details.recentActivities?.length || 0})
                </button>
              </div>

              {/* Tab Content: Projects */}
              {activeTab === 'overview' && (
                <div className="space-y-2">
                  {details.projects?.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No project memberships associated with this account.
                    </p>
                  ) : (
                    details.projects.map((p) => (
                      <div
                        key={p._id}
                        className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <FolderKanban className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-white">{p.name}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-sm">
                              {p.description || 'No description provided'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab Content: Tasks */}
              {activeTab === 'tasks' && (
                <div className="space-y-2">
                  {details.tasks?.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No tasks currently assigned to this user.
                    </p>
                  ) : (
                    details.tasks.map((t) => (
                      <div
                        key={t._id}
                        className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-white">{t.title}</div>
                            <div className="text-[11px] text-slate-400">
                              Project: {t.project?.name || 'Unassigned Project'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              taskStatusColors[t.status] || taskStatusColors.TODO
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab Content: Activities */}
              {activeTab === 'activity' && (
                <div className="space-y-2">
                  {details.recentActivities?.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No recent activities recorded for this user.
                    </p>
                  ) : (
                    details.recentActivities.map((a) => (
                      <div
                        key={a._id}
                        className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-3"
                      >
                        <ActivityIcon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div className="flex-1 text-xs">
                          <p className="text-slate-200">{a.message}</p>
                          <span className="text-[10px] text-slate-500">
                            {new Date(a.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
