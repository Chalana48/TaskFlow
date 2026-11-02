import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  CheckCheck,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Inbox,
  Loader2,
} from 'lucide-react';
import { formatRelativeTime, getNotificationConfig } from './notificationHelpers';

export const NotificationBell = () => {
  const {
    unreadCount,
    recentNotifications,
    loading,
    error,
    fetchRecentNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchRecentNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleItemClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkItemRead = (e, id) => {
    e.stopPropagation();
    markAsRead(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className={`p-2 rounded-xl transition relative flex items-center justify-center ${
          isOpen
            ? 'bg-slate-800 text-white border border-slate-700/60'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
        }`}
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-indigo-500 to-rose-500 text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-rose-500/25 ring-2 ring-slate-900 animate-in zoom-in duration-150">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Area */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/50">
            {loading && recentNotifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : error ? (
              <div className="py-8 px-4 text-center">
                <p className="text-xs text-rose-400 mb-2">{error}</p>
                <button
                  onClick={fetchRecentNotifications}
                  className="text-xs text-indigo-400 hover:underline font-medium"
                >
                  Try again
                </button>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-2.5">
                  <Inbox className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-300">All caught up!</div>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-[200px]">
                  No new notifications right now.
                </p>
              </div>
            ) : (
              recentNotifications.map((notification) => {
                const config = getNotificationConfig(notification.type);
                const IconComponent = config.icon;

                return (
                  <div
                    key={notification._id}
                    onClick={() => handleItemClick(notification)}
                    className={`p-3.5 transition flex items-start gap-3 cursor-pointer group ${
                      notification.isRead
                        ? 'bg-transparent hover:bg-slate-800/40 text-slate-400'
                        : 'bg-indigo-950/20 hover:bg-indigo-950/30 text-slate-200'
                    }`}
                  >
                    {/* Icon Pill */}
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 border flex items-center justify-center ${config.badgeClass}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-xs font-semibold truncate ${
                            notification.isRead ? 'text-slate-300' : 'text-white'
                          }`}
                        >
                          {notification.title}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Related Context Tags */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {notification.relatedProject?.name && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50 truncate max-w-[130px]">
                            {notification.relatedProject.name}
                          </span>
                        )}
                        {notification.relatedTask?.title && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50 truncate max-w-[130px]">
                            {notification.relatedTask.title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread dot / Mark read button */}
                    {!notification.isRead && (
                      <div className="flex flex-col items-center justify-center shrink-0 self-center">
                        <button
                          onClick={(e) => handleMarkItemRead(e, notification._id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-2 h-2 rounded-full bg-indigo-400 group-hover:hidden shadow-sm shadow-indigo-500/50" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Link to Notifications Page */}
          <div className="p-2 border-t border-slate-800/80 bg-slate-950/40 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 transition"
            >
              <span>View all notifications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
