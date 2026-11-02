import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import UserDetailsModal from '../../components/admin/UserDetailsModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Users,
  Search,
  Filter,
  Shield,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';

export const UserManagementPage = () => {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Selected user for details modal
  const [inspectUserId, setInspectUserId] = useState(null);

  // Action Modals State
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('USER');

  const [statusModalUser, setStatusModalUser] = useState(null);

  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await adminService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });

      setUsers(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Role Change
  const handleRoleSubmit = async () => {
    if (!roleModalUser) return;
    setSubmittingAction(true);
    setError(null);
    try {
      await adminService.updateUserRole(roleModalUser.id || roleModalUser._id, selectedRole);
      setActionSuccess(`Updated ${roleModalUser.name}'s role to ${selectedRole}`);
      setRoleModalUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update role');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Status Toggle (Suspend / Restore)
  const handleStatusSubmit = async () => {
    if (!statusModalUser) return;
    setSubmittingAction(true);
    setError(null);

    const targetStatus = statusModalUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    try {
      await adminService.updateUserStatus(statusModalUser.id || statusModalUser._id, targetStatus);
      setActionSuccess(
        `Account ${statusModalUser.name} is now ${targetStatus.toLowerCase()}`
      );
      setStatusModalUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update user status');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle User Deletion
  const handleDeleteSubmit = async () => {
    if (!deleteModalUser) return;
    setSubmittingAction(true);
    setError(null);

    try {
      await adminService.deleteUser(deleteModalUser.id || deleteModalUser._id);
      setActionSuccess(`Account ${deleteModalUser.name} was successfully deleted`);
      setDeleteModalUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete user');
    } finally {
      setSubmittingAction(false);
    }
  };

  const roleBadges = {
    ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    PROJECT_MANAGER: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    USER: 'bg-slate-700/50 text-slate-300 border-slate-600',
  };

  const statusBadges = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    SUSPENDED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-400" /> User Directory & Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search, filter, manage roles, configure account statuses, and safely govern users.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Directory
        </button>
      </div>

      {/* Notifications / Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {actionSuccess}
          </span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 transition"
          >
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
            <option value="ADMIN">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 transition"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 transition"
          >
            <option value="createdAt">Date Joined</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="role">Role</option>
            <option value="status">Status</option>
          </select>

          <button
            onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white transition"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <LoadingSpinner message="Loading user directory..." />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const uid = u.id || u._id;
                  const isCurrent = currentAdmin?._id === uid || currentAdmin?.id === uid;

                  return (
                    <tr key={uid} className="hover:bg-slate-800/30 transition">
                      {/* Name & Avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md">
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              {u.name}
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px]">{u.email}</div>
                            <div className="text-slate-500 text-[10px]">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                            roleBadges[u.role] || roleBadges.USER
                          }`}
                        >
                          <Shield className="w-3 h-3 inline mr-1" />
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                            statusBadges[u.status] || statusBadges.ACTIVE
                          }`}
                        >
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="px-5 py-4 text-slate-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Inspect Details */}
                          <button
                            onClick={() => setInspectUserId(uid)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Change Role */}
                          <button
                            onClick={() => {
                              setRoleModalUser(u);
                              setSelectedRole(u.role);
                            }}
                            className="p-1.5 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition"
                            title="Change Role"
                          >
                            <Shield className="w-4 h-4" />
                          </button>

                          {/* Suspend / Restore (Disabled on self) */}
                          <button
                            onClick={() => setStatusModalUser(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed text-slate-600'
                                : u.status === 'ACTIVE'
                                ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                            }`}
                            title={
                              isCurrent
                                ? 'Cannot modify self'
                                : u.status === 'ACTIVE'
                                ? 'Suspend User'
                                : 'Restore User'
                            }
                          >
                            {u.status === 'ACTIVE' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete User (Disabled on self) */}
                          <button
                            onClick={() => setDeleteModalUser(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed text-slate-600'
                                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                            }`}
                            title={isCurrent ? 'Cannot delete self' : 'Delete User'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{users.length}</span> of{' '}
            <span className="font-semibold text-white">{pagination.total}</span> registered users
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">
              Page <span className="font-bold text-white">{pagination.page}</span> of{' '}
              <span className="font-bold text-white">{pagination.totalPages}</span>
            </span>
            <button
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))
              }
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect User Details Modal */}
      {inspectUserId && (
        <UserDetailsModal
          userId={inspectUserId}
          isOpen={Boolean(inspectUserId)}
          onClose={() => setInspectUserId(null)}
        />
      )}

      {/* Role Change Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" /> Change User Role
              </h3>
              <button
                onClick={() => setRoleModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Modifying role for <strong className="text-white">{roleModalUser.name}</strong> (
              {roleModalUser.email}).
            </p>

            <div className="space-y-2">
              {['USER', 'PROJECT_MANAGER', 'ADMIN'].map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    selectedRole === r
                      ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 font-semibold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-xs">{r}</span>
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={selectedRole === r}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="accent-purple-500"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRoleModalUser(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleSubmit}
                disabled={submittingAction}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition disabled:opacity-50"
              >
                {submittingAction ? 'Updating...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Toggle Modal */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              {statusModalUser.status === 'ACTIVE' ? 'Suspend User Account' : 'Restore User Account'}
            </h3>

            <p className="text-xs text-slate-400">
              Are you sure you want to{' '}
              {statusModalUser.status === 'ACTIVE' ? 'suspend' : 'reactivate'} the account for{' '}
              <strong className="text-white">{statusModalUser.name}</strong>?
              {statusModalUser.status === 'ACTIVE' &&
                ' Suspended users are immediately denied access to protected endpoints and cannot log in.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setStatusModalUser(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusSubmit}
                disabled={submittingAction}
                className={`px-4 py-1.5 rounded-xl text-white text-xs font-semibold transition disabled:opacity-50 ${
                  statusModalUser.status === 'ACTIVE'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {submittingAction
                  ? 'Updating...'
                  : statusModalUser.status === 'ACTIVE'
                  ? 'Confirm Suspension'
                  : 'Reactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Permanent Account Deletion
            </h3>

            <p className="text-xs text-slate-400">
              You are about to permanently delete <strong className="text-white">{deleteModalUser.name}</strong>.
            </p>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-1">
              <p className="font-semibold">Safe Deletion Policy:</p>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-300/80">
                <li>Project memberships will be cleaned up.</li>
                <li>Assigned tasks will be safely unassigned.</li>
                <li>Users managing active projects cannot be deleted until reassigned.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalUser(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={submittingAction}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition disabled:opacity-50"
              >
                {submittingAction ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
