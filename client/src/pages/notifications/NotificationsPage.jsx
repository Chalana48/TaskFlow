import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import notificationService from '../../services/notificationService';
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  Filter,
  Inbox,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  FolderKanban,
  CheckSquare,
} from 'lucide-react';
import { formatRelativeTime, getNotificationConfig } from '../../components/notifications/notificationHelpers';

export const NotificationsPage = () => {
  const { markAsRead: contextMarkAsRead, markAllAsRead: contextMarkAllAsRead, deleteNotification: contextDeleteNotification } = useNotifications();
  const navigate = useNavigate();

  // Filters & Pagination State
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Data state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (filterTab === 'UNREAD') params.isRead = false;
      if (filterTab === 'READ') params.isRead = true;
      if (typeFilter) params.type = typeFilter;

      const res = await notificationService.getNotifications(params);
      setNotifications(res.data || []);
      setTotalCount(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
      if (res.unreadCount !== undefined) {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterTab, typeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleTabChange = (tab) => {
    setFilterTab(tab);
    setPage(1);
  };

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setPage(1);
  };

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    setActionInProgress(id);
    try {
      await notificationService.markAsRead(id);
      contextMarkAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark read:', err?.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionInProgress('all');
    try {
      await notificationService.markAllAsRead();
      contextMarkAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all read:', err?.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    setActionInProgress(id);
    try {
      await notificationService.deleteNotification(id);
      contextDeleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to delete notification:', err?.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleItemClick = (notification) => {
    if (!notification.isRead) {
      notificationService.markAsRead(notification._id).catch(() => {});
      contextMarkAsRead(notification._id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time activity alerts, task assignments, and project updates.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={actionInProgress === 'all'}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/25 text-xs font-semibold transition disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md">
        {/* Tabs: All / Unread / Read */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => handleTabChange('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleTabChange('UNREAD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              filterTab === 'UNREAD'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-950 text-indigo-300 text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('READ')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterTab === 'READ'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Read
          </button>
        </div>

        {/* Type Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={typeFilter}
            onChange={handleTypeChange}
            className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Notification Types</option>
            <option value="TASK_ASSIGNED">Task Assigned</option>
            <option value="TASK_STATUS_CHANGED">Status Changed</option>
            <option value="TASK_COMPLETED">Task Completed</option>
            <option value="TASK_DUE_SOON">Due Soon</option>
            <option value="TASK_OVERDUE">Overdue</option>
            <option value="PROJECT_ADDED">Added to Project</option>
            <option value="PROJECT_UPDATED">Project Updated</option>
            <option value="PROJECT_MANAGER_CHANGED">Manager Reassigned</option>
            <option value="COMMENT_ADDED">Comment Added</option>
            <option value="SYSTEM">System Alerts</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
            <span className="text-xs">Loading notifications...</span>
          </div>
        ) : error ? (
          <div className="py-16 px-4 text-center">
            <p className="text-sm text-rose-400 mb-3">{error}</p>
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3.5">
              <Inbox className="w-7 h-7" />
            </div>
            <div className="text-sm font-bold text-white">
              {filterTab === 'UNREAD'
                ? 'No unread notifications'
                : 'No notifications found'}
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {filterTab === 'UNREAD'
                ? 'You are all caught up! New alerts will show up here as they occur.'
                : 'When events occur on your tasks or projects, they will be listed here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {notifications.map((notification) => {
              const config = getNotificationConfig(notification.type);
              const IconComp = config.icon;

              return (
                <div
                  key={notification._id}
                  onClick={() => handleItemClick(notification)}
                  className={`p-4 sm:p-5 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group ${
                    notification.isRead
                      ? 'bg-transparent hover:bg-slate-800/30'
                      : 'bg-indigo-950/20 hover:bg-indigo-950/35 border-l-4 border-l-indigo-500'
                  }`}
                >
                  {/* Left: Type Icon + Text Content */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${config.badgeClass}`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            notification.isRead ? 'text-slate-300' : 'text-white'
                          }`}
                        >
                          {notification.title}
                        </span>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${config.badgeClass}`}>
                          {config.label}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-500/50" />
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {notification.message}
                      </p>

                      {/* Related Resource Badges & Sender */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                        {notification.relatedProject?.name && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                            <FolderKanban className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[160px]">
                              {notification.relatedProject.name}
                            </span>
                          </span>
                        )}

                        {notification.relatedTask?.title && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                            <CheckSquare className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[180px]">
                              {notification.relatedTask.title}
                            </span>
                          </span>
                        )}

                        {notification.relatedUser?.name && (
                          <span className="text-slate-500">
                            by <span className="text-slate-400 font-medium">{notification.relatedUser.name}</span>
                          </span>
                        )}

                        <span className="text-slate-500">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, notification._id)}
                        disabled={actionInProgress === notification._id}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 transition"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={(e) => handleDelete(e, notification._id)}
                      disabled={actionInProgress === notification._id}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/40">
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages} ({totalCount} total)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
