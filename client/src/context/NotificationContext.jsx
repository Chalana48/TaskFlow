import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import notificationService from '../services/notificationService';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollingTimerRef = useRef(null);

  /**
   * Fetch unread notification count
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.getUnreadCount();
      const count = res.data?.count ?? res.count ?? 0;
      setUnreadCount(Math.max(0, count));
    } catch (err) {
      // Gracefully handle background polling failure
      console.debug('[NotificationContext] Poll count error:', err?.message);
    }
  }, [user]);

  /**
   * Fetch recent notifications (for dropdown)
   */
  const fetchRecentNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getNotifications({ limit: 8, page: 1 });
      const items = res.data || [];
      setRecentNotifications(items);
      if (res.unreadCount !== undefined) {
        setUnreadCount(Math.max(0, res.unreadCount));
      }
    } catch (err) {
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(async (id) => {
    if (!id) return;
    // Optimistic UI update
    setRecentNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.warn('[NotificationContext] Failed to mark as read:', err?.message);
      // Re-sync with server
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    // Optimistic UI update
    setRecentNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn('[NotificationContext] Failed to mark all as read:', err?.message);
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (id) => {
    if (!id) return;
    const target = recentNotifications.find((n) => n._id === id);
    const wasUnread = target && !target.isRead;

    // Optimistic UI update
    setRecentNotifications((prev) => prev.filter((n) => n._id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.warn('[NotificationContext] Failed to delete notification:', err?.message);
      fetchRecentNotifications();
    }
  }, [recentNotifications, fetchRecentNotifications]);

  /**
   * Periodic polling & window visibility management
   */
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setRecentNotifications([]);
      return;
    }

    // Initial fetch
    fetchUnreadCount();
    fetchRecentNotifications();

    // Start smart interval polling (30s)
    const startPolling = () => {
      stopPolling();
      pollingTimerRef.current = setInterval(() => {
        // Only poll if document is visible (avoid background battery/network drain)
        if (typeof document !== 'undefined' && !document.hidden) {
          fetchUnreadCount();
        }
      }, 30000);
    };

    const stopPolling = () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };

    startPolling();

    // Refetch immediately on tab visibility change or window focus
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };

    const handleFocus = () => {
      fetchUnreadCount();
    };

    // Custom app event for immediate notification refresh across components
    const handleAppEvent = () => {
      fetchUnreadCount();
      fetchRecentNotifications();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('taskflow:refresh-notifications', handleAppEvent);

    return () => {
      stopPolling();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('taskflow:refresh-notifications', handleAppEvent);
    };
  }, [user, fetchUnreadCount, fetchRecentNotifications]);

  const value = {
    unreadCount,
    recentNotifications,
    loading,
    error,
    fetchUnreadCount,
    fetchRecentNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
