import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import Alert from '../common/Alert';

export const TaskCommentSection = ({
  comments = [],
  onAddComment,
  onDeleteComment,
  canManage = false,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');
      await onAddComment(newComment.trim());
      setNewComment('');
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCommentDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <span>💬 Activity &amp; Discussion</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
            {comments.length}
          </span>
        </h3>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Comment Input */}
      <form onSubmit={handlePost} className="space-y-2">
        <div className="relative">
          <textarea
            rows={2}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment or status update..."
            className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow transition-all disabled:opacity-40 flex items-center gap-1.5"
          >
            {isSubmitting && (
              <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            )}
            Post Comment
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3 mt-4">
        {comments.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-6">
            No comments yet. Start the conversation!
          </p>
        ) : (
          comments.map((comment) => {
            const author = comment.user;
            const isAuthor = user && author && (typeof author === 'object' ? author._id === user._id : author === user._id);
            const canDelete = isAuthor || canManage || user?.role === 'ADMIN';

            return (
              <div
                key={comment._id}
                className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800/80 hover:border-slate-700/80 transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {author?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {author?.name || 'User'}
                      </span>
                      {author?.username && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          @{author.username}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        • {formatCommentDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words">
                      {comment.message}
                    </p>
                  </div>
                </div>

                {canDelete && onDeleteComment && (
                  <button
                    type="button"
                    onClick={() => onDeleteComment(comment._id)}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-xs opacity-0 group-hover:opacity-100"
                    title="Delete comment"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TaskCommentSection;
