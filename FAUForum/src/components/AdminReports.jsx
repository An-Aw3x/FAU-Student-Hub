import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Pin,
  ShieldCheck,
} from 'lucide-react';

const REPORT_LABELS = {
  spam: 'Spam',
  harassment: 'Harassment or bullying',
  nudity: 'Nudity or sexual content',
  hate: 'Hate speech',
  violence: 'Violence or threats',
  other: 'Other',
};

export default function AdminReports({ isAdmin, onBack, onOpenPost, onPostDeleted }) {
  const [reportedPosts, setReportedPosts] = useState([]);
  const [reportedComments, setReportedComments] = useState([]);
  const [openItems, setOpenItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionStatus, setActionStatus] = useState(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setActionStatus(null);

      const response = await fetch('http://localhost:3001/api/reports');

      if (!response.ok) {
        throw new Error('Could not load reports.');
      }

      const data = await response.json();

      setReportedPosts(data.reportedPosts || []);
      setReportedComments(data.reportedComments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoadId = window.setTimeout(loadReports, 0);
    return () => window.clearTimeout(initialLoadId);
  }, [loadReports]);

  const formatReason = (reason) => {
    if (!reason) return 'No reason listed';
    return REPORT_LABELS[reason] || reason;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Unknown date';
    return new Date(dateValue).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleDeletePost = async (postId) => {
    const confirmDelete = window.confirm(
      'Delete this post? This will remove it from the feed.'
    );

    if (!confirmDelete) return;

    try {
      setActionStatus(null);

      const response = await fetch(`http://localhost:3001/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Could not delete post.');
      }

      setReportedPosts(prev => prev.filter(post => Number(post.id) !== Number(postId)));
      setReportedComments(prev => prev.filter(comment => Number(comment.post_id) !== Number(postId)));
      onPostDeleted?.(postId);
      setActionStatus({
        type: 'success',
        message: 'Post deleted from the community feed.',
      });
    } catch (err) {
      console.error(err);
      setActionStatus({
        type: 'error',
        message: err.message || 'Could not delete the post.',
      });
    }
  };

  const handleDeleteComment = async (commentId) => {
    const confirmDelete = window.confirm('Delete this comment?');

    if (!confirmDelete) return;

    try {
      setActionStatus(null);

      const response = await fetch(`http://localhost:3001/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Could not delete comment.');
      }

      setReportedComments(prev => prev.filter(comment => Number(comment.id) !== Number(commentId)));
      setActionStatus({
        type: 'success',
        message: 'Comment deleted.',
      });
    } catch (err) {
      console.error(err);
      setActionStatus({
        type: 'error',
        message: err.message || 'Could not delete the comment.',
      });
    }
  };

  const handleTogglePin = async (post) => {
    const nextPinnedState = !(post.isPinned || post.is_pinned);

    try {
      setActionStatus(null);

      const response = await fetch(`http://localhost:3001/api/posts/${post.id}/pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPinned: nextPinnedState,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not update pinned post.');
      }

      const updatedPost = await response.json();

      setReportedPosts(prev =>
        prev.map(item =>
          Number(item.id) === Number(post.id)
            ? {
                ...item,
                isPinned: updatedPost.isPinned,
                is_pinned: updatedPost.is_pinned,
              }
            : item
        )
      );
      setActionStatus({
        type: 'success',
        message: nextPinnedState
          ? 'Post featured in the community feed.'
          : 'Post removed from featured posts.',
      });
    } catch (err) {
      console.error(err);
      setActionStatus({
        type: 'error',
        message: err.message || 'Could not update the featured post.',
      });
    }
  };

  const toggleItem = (key) => {
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderReportDetails = (itemKey, details) => {
    const isOpen = !!openItems[itemKey];
    const reportDetails = details || [];

    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => toggleItem(itemKey)}
          className="w-full text-left rounded-xl px-3 py-2 text-sm font-bold transition-all"
          style={{
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          {isOpen ? (
            <ChevronDown className="inline-block mr-1" size={15} aria-hidden="true" />
          ) : (
            <ChevronRight className="inline-block mr-1" size={15} aria-hidden="true" />
          )}
          View report details
          {reportDetails.length > 0 ? ` (${reportDetails.length})` : ''}
        </button>

        {isOpen && (
          <div
            className="mt-2 rounded-xl p-3 flex flex-col gap-2"
            style={{
              background: 'var(--color-surface-3)',
              border: '1px solid var(--color-border)',
            }}
          >
            {reportDetails.length > 0 ? (
              reportDetails.map((report, index) => (
                <div
                  key={`${itemKey}-${index}`}
                  className="rounded-xl px-3 py-2"
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p
                    className="text-sm font-bold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Reported by: {report.reporter_username || 'Anonymous'}
                  </p>

                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Reason: {formatReason(report.reason)}
                  </p>

                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {formatDate(report.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <p
                className="text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                This report was created before individual reporter details were saved.
                New reports will show the reporter account here.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <section className="max-w-4xl mx-auto animate-fade-in">
        <button type="button" onClick={onBack} className="page-back-button">
          Back to feed
        </button>
        <div className="resource-page-empty">
          <ShieldCheck size={28} strokeWidth={1.8} aria-hidden="true" />
          <h1>Admin access only</h1>
          <p>You need an authorized OwlNet administrator account to review reports.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1
            className="font-display flex items-center gap-2 text-xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <ShieldCheck size={22} strokeWidth={2} aria-hidden="true" />
            <span>Admin Reports</span>
          </h1>

          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Review posts and comments that users reported.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadReports} className="vote-btn">
            Refresh
          </button>

          <button onClick={onBack} className="vote-btn">
            Back to Feed
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading reports...
        </p>
      )}

      {error && (
        <div className="auth-error admin-status-banner mb-4 flex items-start gap-2" role="alert">
          <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {actionStatus && (
        <div
          className={`${
            actionStatus.type === 'error' ? 'auth-error' : 'auth-success'
          } admin-status-banner mb-4 flex items-start gap-2`}
          role={actionStatus.type === 'error' ? 'alert' : 'status'}
        >
          {actionStatus.type === 'error' ? (
            <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <span>{actionStatus.message}</span>
        </div>
      )}

      {!loading && !error && reportedPosts.length === 0 && reportedComments.length === 0 && (
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          No reports yet. Report a post or comment from the feed and it will show up here.
        </div>
      )}

      {!loading && !error && reportedPosts.length > 0 && (
        <section className="mb-8">
          <h2
            className="font-display font-bold text-lg mb-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Reported Posts
          </h2>

          <div className="flex flex-col gap-4">
            {reportedPosts.map(post => (
              <article key={post.id} className="post-card p-5 animate-fade-in">
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div>
                    <h3
                      className="font-bold text-base"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {post.title}
                    </h3>

                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Posted by {post.username || 'Anonymous'} · {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>

                  <span
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{
                      background: 'rgba(248, 113, 113, 0.12)',
                      color: '#dc2626',
                      border: '1px solid rgba(248, 113, 113, 0.25)',
                    }}
                  >
                    {post.reports || 0} report{post.reports === 1 ? '' : 's'}
                  </span>
                </div>

                <p
                  className="text-sm leading-relaxed mb-3"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {post.content}
                </p>

                <div
                  className="text-sm rounded-xl px-3 py-2"
                  style={{
                    background: 'var(--color-surface-3)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <strong>Latest reason:</strong> {formatReason(post.report_reason)}
                </div>

                {renderReportDetails(`post-${post.id}`, post.reportDetails)}

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onOpenPost?.(post.id)}
                    className="vote-btn"
                  >
                    View original post
                  </button>                  

                  <button
                    type="button"
                    onClick={() => handleTogglePin(post)}
                    className="vote-btn"
                  >
                    <Pin size={14} aria-hidden="true" />
                    {post.isPinned || post.is_pinned ? 'Remove feature' : 'Feature post'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id)}
                    className="vote-btn"
                    style={{ color: '#dc2626' }}
                  >
                    Delete post
                  </button>
                </div>

              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && !error && reportedComments.length > 0 && (
        <section>
          <h2
            className="font-display font-bold text-lg mb-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Reported Comments
          </h2>

          <div className="flex flex-col gap-4">
            {reportedComments.map(comment => (
              <article key={comment.id} className="post-card p-5 animate-fade-in">
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div>
                    <h3
                      className="font-bold text-base"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Comment on: {comment.post_title || 'Unknown post'}
                    </h3>

                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Comment by {comment.username || 'Anonymous'} · {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>

                  <span
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{
                      background: 'rgba(248, 113, 113, 0.12)',
                      color: '#dc2626',
                      border: '1px solid rgba(248, 113, 113, 0.25)',
                    }}
                  >
                    {comment.reports || 0} report{comment.reports === 1 ? '' : 's'}
                  </span>
                </div>

                <p
                  className="text-sm leading-relaxed mb-3"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {comment.content}
                </p>

                <div
                  className="text-sm rounded-xl px-3 py-2"
                  style={{
                    background: 'var(--color-surface-3)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <strong>Latest reason:</strong> {formatReason(comment.report_reason)}
                </div>

                {renderReportDetails(`comment-${comment.id}`, comment.reportDetails)}

                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => onOpenPost?.(comment.post_id)}
                    className="vote-btn"
                  >
                    View original post
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="vote-btn"
                    style={{ color: '#dc2626' }}
                  >
                    Delete comment
                  </button>
                </div>

              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
