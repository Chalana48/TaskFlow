import React, { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import Alert from '../common/Alert';
import {
  Bell,
  CheckCircle2,
  Clock,
  MessageSquare,
  FolderKanban,
  UserCheck,
  Save,
  Loader2,
} from 'lucide-react';

export const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    taskAssigned: true,
    taskStatusChanged: true,
    taskCompleted: true,
    comments: true,
    projectUpdates: true,
    deadlineReminders: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    let isMounted = true;
    notificationService
      .getPreferences()
      .then((res) => {
        if (isMounted && res.data) {
          setPreferences((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch((err) => {
        console.warn('Unable to load notification preferences:', err?.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    if (alert) setAlert(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    try {
      const res = await notificationService.updatePreferences(preferences);
      if (res.data) {
        setPreferences((prev) => ({ ...prev, ...res.data }));
      }
      setAlert({
        type: 'success',
        message: 'Notification preferences updated successfully!',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.message || 'Failed to update preferences',
      });
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    {
      key: 'taskAssigned',
      title: 'Task Assignments',
      desc: 'Receive alerts when you are assigned to a new or existing task.',
      icon: UserCheck,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      key: 'taskStatusChanged',
      title: 'Task Status Changes',
      desc: 'Get notified when tasks in your projects change progress stages.',
      icon: Clock,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      key: 'taskCompleted',
      title: 'Task Completions',
      desc: 'Receive confirmation alerts when team members complete tasks.',
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      key: 'comments',
      title: 'Comments & Feedback',
      desc: 'Stay notified when teammates comment on tasks you created or are assigned to.',
      icon: MessageSquare,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    },
    {
      key: 'projectUpdates',
      title: 'Project Updates & Members',
      desc: 'Alerts when projects are modified, new members join, or managers change.',
      icon: FolderKanban,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      key: 'deadlineReminders',
      title: 'Deadline & Overdue Reminders',
      desc: 'Automated warnings for approaching deadlines and overdue tasks.',
      icon: Bell,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">In-App Notification Preferences</h3>
        </div>
        <span className="text-[11px] text-slate-400">Phase 6</span>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          className="mb-5"
          onClose={() => setAlert(null)}
        />
      )}

      {loading ? (
        <div className="py-8 flex items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span className="text-xs">Loading preferences...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              const isEnabled = preferences[cat.key] !== false;

              return (
                <div
                  key={cat.key}
                  onClick={() => handleToggle(cat.key)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 select-none ${
                    isEnabled
                      ? 'bg-slate-950/60 border-indigo-500/30 hover:border-indigo-500/50'
                      : 'bg-slate-950/30 border-slate-800/80 hover:border-slate-700/60 opacity-60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${cat.color}`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-200">
                        {cat.title}
                      </span>
                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(cat.key);
                        }}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                          isEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                        }`}
                        aria-label={`Toggle ${cat.title}`}
                      >
                        <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {cat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Preferences...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notification Preferences</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NotificationPreferences;
