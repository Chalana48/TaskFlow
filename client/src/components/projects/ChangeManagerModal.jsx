import React, { useState } from 'react';
import Alert from '../common/Alert';

export const ChangeManagerModal = ({
  isOpen,
  onClose,
  onChangeManager,
  currentManager,
  candidates = [],
  isLoading = false,
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a candidate to become the new project manager');
      return;
    }

    try {
      setError('');
      await onChangeManager(selectedUserId);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reassign manager');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/50">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Change Project Manager</h2>
            <p className="text-xs text-slate-400 mt-0.5">Transfer lead ownership of this project</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4">
            <Alert type="error" message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select New Manager
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Choose from Team Members --</option>
              {candidates
                .filter((c) => c._id !== currentManager?._id)
                .map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name} (@{member.username}) - {member.email}
                  </option>
                ))}
            </select>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-300 leading-relaxed">
            ⚠️ The new manager will receive full permissions to manage project members, edit project settings, and assign tasks.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedUserId || isLoading}
              className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-lg shadow-primary-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              )}
              Assign Manager
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeManagerModal;
