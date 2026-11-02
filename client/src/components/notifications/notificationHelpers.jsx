import React from 'react';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  FolderPlus,
  ShieldCheck,
  MessageSquare,
  Bell,
  Activity,
} from 'lucide-react';

/**
 * Format timestamp into friendly relative string
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get visual icon & color config for notification type
 */
export const getNotificationConfig = (type) => {
  switch (type) {
    case 'TASK_ASSIGNED':
      return {
        icon: UserCheck,
        label: 'Task Assigned',
        badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        iconClass: 'text-indigo-400',
        bgGlow: 'from-indigo-500/10 to-transparent',
      };
    case 'TASK_STATUS_CHANGED':
      return {
        icon: Activity,
        label: 'Status Changed',
        badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        iconClass: 'text-cyan-400',
        bgGlow: 'from-cyan-500/10 to-transparent',
      };
    case 'TASK_COMPLETED':
      return {
        icon: CheckCircle2,
        label: 'Task Completed',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        iconClass: 'text-emerald-400',
        bgGlow: 'from-emerald-500/10 to-transparent',
      };
    case 'TASK_DUE_SOON':
      return {
        icon: Clock,
        label: 'Due Soon',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        iconClass: 'text-amber-400',
        bgGlow: 'from-amber-500/10 to-transparent',
      };
    case 'TASK_OVERDUE':
      return {
        icon: AlertTriangle,
        label: 'Overdue',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        iconClass: 'text-rose-400',
        bgGlow: 'from-rose-500/10 to-transparent',
      };
    case 'PROJECT_ADDED':
      return {
        icon: FolderPlus,
        label: 'Project Member',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        iconClass: 'text-blue-400',
        bgGlow: 'from-blue-500/10 to-transparent',
      };
    case 'PROJECT_UPDATED':
      return {
        icon: FolderKanban,
        label: 'Project Updated',
        badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        iconClass: 'text-sky-400',
        bgGlow: 'from-sky-500/10 to-transparent',
      };
    case 'PROJECT_MANAGER_CHANGED':
      return {
        icon: ShieldCheck,
        label: 'Manager Assigned',
        badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        iconClass: 'text-purple-400',
        bgGlow: 'from-purple-500/10 to-transparent',
      };
    case 'COMMENT_ADDED':
      return {
        icon: MessageSquare,
        label: 'New Comment',
        badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        iconClass: 'text-teal-400',
        bgGlow: 'from-teal-500/10 to-transparent',
      };
    case 'SYSTEM':
    default:
      return {
        icon: Bell,
        label: 'System Notification',
        badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        iconClass: 'text-slate-400',
        bgGlow: 'from-slate-500/10 to-transparent',
      };
  }
};
