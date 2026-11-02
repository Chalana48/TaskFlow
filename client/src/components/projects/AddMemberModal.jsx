import React, { useState, useEffect } from 'react';
import projectService from '../../services/projectService';
import Alert from '../common/Alert';

export const AddMemberModal = ({
  isOpen,
  onClose,
  onAddMember,
  currentMembers = [],
  currentManager = null,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [error, setError] = useState('');

  // Debounced search for users
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUserId(null);
      setError('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        setError('');
        const res = await projectService.searchUsers(searchQuery.trim());
        setSearchResults(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to search users');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  if (!isOpen) return null;

  // Filter out existing manager or members
  const memberIds = new Set([
    ...(currentMembers || []).map((m) => (typeof m === 'string' ? m : m._id)),
    currentManager?._id,
  ]);

  const handleSelect = (user) => {
    if (memberIds.has(user._id)) return;
    setSelectedUserId(user._id === selectedUserId ? null : user._id);
  };

  const handleAdd = async () => {
    if (!selectedUserId) return;
    try {
      setError('');
      await onAddMember(selectedUserId);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add member to project');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/50">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Add Team Member</h2>
            <p className="text-xs text-slate-400 mt-0.5">Search and invite registered users to collaborate</p>
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

        {/* Search Input */}
        <div className="mt-5">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            {isSearching && (
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                <span className="w-4 h-4 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
              </span>
            )}
          </div>
        </div>

        {/* User Search Results */}
        <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {searchResults.length === 0 && !isSearching && (
            <p className="text-center text-xs text-slate-500 py-6">
              {searchQuery ? 'No active users match your query' : 'Type to search available users'}
            </p>
          )}

          {searchResults.map((user) => {
            const isAlreadyMember = memberIds.has(user._id);
            const isSelected = selectedUserId === user._id;

            return (
              <div
                key={user._id}
                onClick={() => !isAlreadyMember && handleSelect(user)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isAlreadyMember
                    ? 'opacity-40 bg-slate-900/50 border-slate-800/60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-primary-900/20 border-primary-500/60 ring-1 ring-primary-500/50 cursor-pointer'
                    : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs shrink-0">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{user.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">@{user.username}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">{user.email}</span>
                  </div>
                </div>

                <div className="text-right">
                  {isAlreadyMember ? (
                    <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50">
                      Already in project
                    </span>
                  ) : (
                    <input
                      type="radio"
                      name="selectedUser"
                      checked={isSelected}
                      onChange={() => handleSelect(user)}
                      className="accent-primary-500 cursor-pointer"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
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
            type="button"
            onClick={handleAdd}
            disabled={!selectedUserId || isLoading}
            className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-lg shadow-primary-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            )}
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
