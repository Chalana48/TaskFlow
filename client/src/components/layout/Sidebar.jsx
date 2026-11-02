import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  Bell,
  User,
  Settings,
  ShieldAlert,
  Users,
  BarChart3,
  X,
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
      isActive
        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/25 shadow-sm'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
    }`;

  const mainLinks = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', to: '/profile', icon: User },
    { name: 'Projects', to: '/projects', icon: FolderKanban },
    { name: 'Tasks & Kanban', to: '/tasks', icon: CheckSquare },
    { name: 'Calendar', to: '/calendar', icon: Calendar, badge: 'Soon' },
    {
      name: 'Notifications',
      to: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : `${unreadCount}`) : null,
      badgeHighlight: unreadCount > 0,
    },
    { name: 'Settings', to: '/settings', icon: Settings, badge: 'Soon' },
  ];

  const pmLinks = [
    { name: 'All Projects', to: '/projects', icon: FolderKanban, badge: 'PM' },
    { name: 'Team Members', to: '/team', icon: Users, badge: 'PM' },
    { name: 'Analytics', to: '/dashboard', icon: BarChart3, badge: 'PM' },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', to: '/admin', icon: ShieldAlert, badge: 'ADMIN' },
    { name: 'User Management', to: '/admin/users', icon: Users, badge: 'ADMIN' },
    { name: 'System Reports', to: '/admin/reports', icon: BarChart3, badge: 'ADMIN' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900/90 border-r border-slate-800/80 p-4 overflow-y-auto">
      {/* Mobile Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 lg:hidden">
        <span className="font-bold text-white text-sm">Navigation</span>
        <button
          onClick={onMobileClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
          Application
        </div>
        {mainLinks.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            onClick={onMobileClose}
            className={navItemClass}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                  item.badgeHighlight
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-bold'
                    : 'bg-slate-800 text-slate-400 border-slate-700/60'
                }`}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Project Manager Role Links */}
      {(user?.role === 'PROJECT_MANAGER' || user?.role === 'ADMIN') && (
        <div className="mt-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-cyan-400/80 tracking-wider uppercase flex items-center justify-between">
            <span>Project Manager</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>
          {pmLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={onMobileClose}
              className={navItemClass}
            >
              <item.icon className="w-4 h-4 shrink-0 text-cyan-400" />
              <span className="flex-1">{item.name}</span>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {item.badge}
              </span>
            </NavLink>
          ))}
        </div>
      )}

      {/* Admin Role Links */}
      {user?.role === 'ADMIN' && (
        <div className="mt-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-purple-400/80 tracking-wider uppercase flex items-center justify-between">
            <span>Administration</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          </div>
          {adminLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={onMobileClose}
              className={navItemClass}
            >
              <item.icon className="w-4 h-4 shrink-0 text-purple-400" />
              <span className="flex-1">{item.name}</span>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {item.badge}
              </span>
            </NavLink>
          ))}
        </div>
      )}

      {/* User Status pill in sidebar footer */}
      <div className="mt-auto pt-6">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
          <div className="text-white font-medium mb-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active Session
          </div>
          <div className="truncate">{user?.username} ({user?.role})</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 h-[calc(100vh-4rem)] sticky top-16 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Collapsible) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
