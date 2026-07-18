import { useEffect, useState } from 'react';

// ── Icons ──────────────────────────────────────────────────
const ThumbUpIcon = ({ filled }) => (
  <svg width="14" height="14" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const ReportIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M4 4v16" />
    <path d="M4 4h13l-1.5 5L17 14H4" />
  </svg>
);

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'nudity', label: 'Nudity or sexual content' },
  { value: 'hate', label: 'Hate speech' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'other', label: 'Other' },
];

const parseCommentTimestamp = (createdAt) => {
  if (!createdAt) return null;

  if (createdAt instanceof Date) return createdAt;

  if (typeof createdAt === 'number') return new Date(createdAt);

  if (typeof createdAt === 'string') {
    const trimmed = createdAt.trim();

    const sqliteMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.\d{3})?$/);
    if (sqliteMatch) {
      const [, year, month, day, hour, minute, second] = sqliteMatch;
      const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    const normalized = trimmed.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    const fallback = new Date(trimmed);
    if (!Number.isNaN(fallback.getTime())) return fallback;
  }

  return null;
};

const formatCommentTime = (createdAt) => {
  const date = parseCommentTimestamp(createdAt);
  if (!date) return 'just now';

  const now = new Date();
  const diffMinutes = Math.max(0, Math.floor((now - date) / 60000));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// ── Comment Section Component ───────────────────────────────
export default function CommentSection({ postId, onCommentCountChange }) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [likedComments, setLikedComments] = useState({});
  const [reportedComments, setReportedComments] = useState({});
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      try {
        setLoading(true);
        setError('');
        setComments([]);

        const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments`);

        if (!response.ok) {
          throw new Error('Could not load comments.');
        }

        const data = await response.json();

        const formattedComments = [...data]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map(comment => ({
            id: comment.id,
            user: {
              name: comment.username,
              handle: `@${comment.username}`,
              avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${comment.username}&backgroundColor=e0f2fe`,
            },
            text: comment.content,
            time: formatCommentTime(comment.created_at),
            likes: 0,
            reports: comment.reports || 0,
            reportReason: comment.report_reason || '',
          }));

        if (isMounted) {
          setComments(formattedComments);
          onCommentCountChange?.(formattedComments.length);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setComments([]);
          onCommentCountChange?.(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [postId, onCommentCountChange]);

  const toggleLike = (commentId) => {
    setLikedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleReportComment = async (reason) => {
    if (!reportingCommentId || reportedComments[reportingCommentId]) {
      return;
    }

    try {
      setReportSubmitting(true);

      const response = await fetch(`http://localhost:3001/api/comments/${reportingCommentId}/report`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to report comment.');
      }

      const updatedComment = await response.json();

      setComments(prev =>
        prev.map(comment =>
          comment.id === reportingCommentId
            ? {
                ...comment,
                reports: updatedComment.reports,
                reportReason: updatedComment.report_reason,
              }
            : comment
        )
      );

      setReportedComments(prev => ({
        ...prev,
        [reportingCommentId]: true,
      }));

      setReportingCommentId(null);
    } catch (err) {
      console.error(err);
      alert('Could not report the comment.');
    } finally {
      setReportSubmitting(false);
    }
  };

  // Handle new comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    const trimmedComment = newComment.trim();
    if (!trimmedComment) return;

    try {
      setError('');

      const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: trimmedComment,
          username: 'Anonymous',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post comment.');
      }

      const createdComment = await response.json();

      const formattedComment = {
        id: createdComment.id,
        user: {
          name: createdComment.username,
          handle: `@${createdComment.username}`,
          avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${createdComment.username}&backgroundColor=e0f2fe`,
        },
        time: formatCommentTime(createdComment.created_at || new Date().toISOString()),
        text: createdComment.content,
        likes: 0,
        reports: 0,
        reportReason: '',
      };

      setComments(prev => {
        const nextComments = [formattedComment, ...prev];
        onCommentCountChange?.(nextComments.length);
        return nextComments;
      });

      setNewComment('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Render the comment section
  return (
    <div className="mt-4 pt-4 animate-fade-in" style={{ borderTop: '1px solid var(--color-border)' }}>
      {/* ── Add Comment ────────────────────────────────────── */}
      <form
        onSubmit={handleCommentSubmit}
        id={`comment-form-${postId}`}
        className="flex gap-3 mb-5"
      >
        <img
          src="https://api.dicebear.com/9.x/avataaars/svg?seed=OwlNetUser&backgroundColor=e0f2fe"
          alt="Your avatar"
          className="w-8 h-8 rounded-full avatar-ring shrink-0 mt-1"
        />

        <div
          className="flex-1 rounded-2xl px-4 py-2.5 flex items-center gap-3"
          style={{
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border)',
          }}
        >
          <input
            type="text"
            placeholder="Write a comment…"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="flex-1 text-sm"
            aria-label="Add a comment"
            id={`comment-input-${postId}`}
          />

          {newComment.trim() && (
            <button
              type="submit"
              className="text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 transition-all"
              style={{
                background: 'var(--color-owl-blue)',
                color: 'white',
              }}
            >
              Post
            </button>
          )}
        </div>
      </form>

      {/* ── Comment List ───────────────────────────────────── */}
      {loading && (
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Loading comments...
        </p>
      )}

      {error && (
        <p className="text-sm text-[color:var(--color-error)]">
          {error}
        </p>
      )}

      {!loading && !error && comments.length === 0 && (
        <p className="text-sm text-[color:var(--color-text-muted)]">
          No comments yet. Be the first to comment!
        </p>
      )}

      <div className="flex flex-col gap-4">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <img
              src={comment.user.avatar}
              alt={comment.user.name}
              className="w-7 h-7 rounded-full avatar-ring shrink-0 mt-0.5"
            />

            <div className="flex-1 min-w-0">
              <div className="comment-item">
                {/* Comment Header */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className="text-xs font-bold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {comment.user.name}
                  </span>

                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {comment.user.handle}
                  </span>

                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    · {comment.time}
                  </span>
                </div>

                {/* Comment Body */}
                <p
                  className="text-sm leading-relaxed mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {comment.text}
                </p>

                {/* Comment Actions */}
                <div className="flex items-center gap-3">
                  <button
                    id={`comment-like-${comment.id}`}
                    onClick={() => toggleLike(comment.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                      likedComments[comment.id]
                        ? 'text-[color:var(--color-upvote)]'
                        : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-secondary)]'
                    }`}
                    aria-label={`Like comment by ${comment.user.name}`}
                    aria-pressed={!!likedComments[comment.id]}
                  >
                    <ThumbUpIcon filled={likedComments[comment.id]} />
                    {comment.likes + (likedComments[comment.id] ? 1 : 0)}
                  </button>

                  <button
                    id={`comment-reply-${comment.id}`}
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="text-xs font-semibold transition-all hover:text-[color:var(--color-text-primary)]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Reply
                  </button>

                  <button
                    id={`comment-report-${comment.id}`}
                    onClick={() => setReportingCommentId(comment.id)}
                    disabled={!!reportedComments[comment.id]}
                    className="flex items-center gap-1 text-xs font-semibold transition-all hover:text-[color:var(--color-text-primary)]"
                    style={{
                      color: reportedComments[comment.id]
                        ? '#F87171'
                        : 'var(--color-text-muted)',
                    }}
                  >
                    <ReportIcon />
                    {reportedComments[comment.id] ? 'Reported' : 'Report'}
                  </button>
                </div>

                {/* Inline Reply Box */}
                {replyingTo === comment.id && (
                  <div className="mt-2 flex gap-2 animate-slide-down">
                    <input
                      type="text"
                      placeholder={`Reply to ${comment.user.name}…`}
                      className="flex-1 text-xs px-3 py-2 rounded-xl"
                      style={{
                        background: 'var(--color-surface-4)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                      id={`reply-input-${comment.id}`}
                      aria-label={`Reply to ${comment.user.name}`}
                    />

                    <button
                      className="text-xs font-bold px-3 py-1.5 rounded-xl"
                      style={{
                        background: 'var(--color-owl-blue)',
                        color: 'white',
                      }}
                      onClick={() => setReplyingTo(null)}
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Report Comment Popup ───────────────────────────── */}
      {reportingCommentId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0, 0, 0, 0.55)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-4 shadow-xl"
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <h3 className="font-bold text-base mb-2">Report comment</h3>

            <p
              className="text-sm mb-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Why are you reporting this comment?
            </p>

            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map(reason => (
                <button
                  key={reason.value}
                  onClick={() => handleReportComment(reason.value)}
                  disabled={reportSubmitting}
                  className="text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{
                    background: 'var(--color-surface-3)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {reason.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setReportingCommentId(null)}
              disabled={reportSubmitting}
              className="mt-4 w-full px-3 py-2 rounded-xl text-sm font-bold"
              style={{
                background: 'transparent',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}