import React from 'react';
import { Activity as ActivityIcon, AlertCircle, Clock } from 'lucide-react';

/**
 * Format timestamp into concise relative time
 */
const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'Recently';
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const RecentActivity = ({ activities = [], loading = false, error = null }) => {
  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-4 animate-pulse">
        <div className="w-36 h-5 bg-slate-800 rounded"></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 shrink-0"></div>
            <div className="space-y-1.5 flex-1">
              <div className="w-4/5 h-3.5 bg-slate-800 rounded"></div>
              <div className="w-1/4 h-2.5 bg-slate-800/60 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col items-center justify-center text-center p-8">
        <AlertCircle className="w-7 h-7 text-rose-400 mb-2" />
        <p className="text-sm text-slate-300 font-medium">Unable to load recent activity</p>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <ActivityIcon className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-bold text-white">Recent Activity</h3>
      </div>

      {activities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400 mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-300">No Activity Recorded</h4>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Activities will populate as team members create projects, update tasks, and complete workflows.
          </p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto max-h-[360px] pr-1">
          {activities.map((item) => {
            const userObj = item.user || {};
            const initials = userObj.name
              ? userObj.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'U';

            return (
              <div key={item._id} className="flex items-start gap-3 text-xs">
                {userObj.profileImage ? (
                  <img
                    src={userObj.profileImage}
                    alt={userObj.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">
                    {initials}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 leading-snug">
                    <span className="font-semibold text-white mr-1">
                      {userObj.name || userObj.username || 'System User'}
                    </span>
                    {item.message.replace(/^[A-Za-z0-9\s]+ (created|updated|completed|assigned|added)/i, (match) => {
                      const action = match.split(' ').pop();
                      return action.toLowerCase();
                    })}
                  </p>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {getRelativeTime(item.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
