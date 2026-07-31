import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Flag, ThumbsUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAvatarOrDefault, handleAvatarError } from '../utils/avatar';

const API_BASE = 'http://localhost:3001';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'nudity', label: 'Nudity or sexual content' },
  { value: 'hate', label: 'Hate speech' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'other', label: 'Other' },
];

function parseCommentTimestamp(createdAt) {
  if (!createdAt) return null;
  if (createdAt instanceof Date) return createdAt;
  if (typeof createdAt === 'number') return new Date(createdAt);

  if (typeof createdAt === 'string') {
    const trimmedTimestamp = createdAt.trim();
    const sqliteTimestamp = trimmedTimestamp.match(
      /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.\d{3})?$/
    );

    if (sqliteTimestamp) {
      const [, year, month, day, hour, minute, second] = sqliteTimestamp;
      const parsedDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);

      if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
    }

    const normalizedDate = new Date(trimmedTimestamp.replace(' ', 'T'));
    if (!Number.isNaN(normalizedDate.getTime())) return normalizedDate;

    const fallbackDate = new Date(trimmedTimestamp);
    if (!Number.isNaN(fallbackDate.getTime())) return fallbackDate;
  }

  return null;
}

function formatCommentTime(createdAt) {
  const date = parseCommentTimestamp(createdAt);
  if (!date) return 'just now';

  const differenceInMinutes = Math.max(0, Math.floor((new Date() - date) / 60000));

  if (differenceInMinutes < 1) return 'just now';
  if (differenceInMinutes === 1) return '1 minute ago';
  if (differenceInMinutes < 60) return `${differenceInMinutes} minutes ago`;

  const differenceInHours = Math.floor(differenceInMinutes / 60);
  if (differenceInHours === 1) return '1 hour ago';
  if (differenceInHours < 24) return `${differenceInHours} hours ago`;

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatApiComment(comment, fallbackAvatar = '') {
  const username = comment.username || 'Anonymous';

  return {
    id: comment.id,
    user: {
      name: username,
      handle: `@${username}`,
      avatar: getAvatarOrDefault(
        comment.author_avatar || comment.avatar || fallbackAvatar
      ),
    },
    text: comment.content,
    time: formatCommentTime(comment.created_at),
    likes: comment.likes || 0,
    likedByCurrentUser: Boolean(comment.liked_by_current_user),
    reports: comment.reports || 0,
    reportReason: comment.report_reason || '',
  };
}

function formatInitialComment(comment, index, postId) {
  const username =
    comment.user?.name || comment.username || comment.author || comment.name || 'OwlNet student';

  return {
    id: comment.id ?? `${postId}-comment-${index}`,
    user: {
      name: username,
      handle: comment.user?.handle || comment.handle || `@${username.replace(/\s+/g, '')}`,
      avatar: getAvatarOrDefault(
        comment.user?.avatar ||
          comment.author_avatar ||
          comment.avatar ||
          comment.profile_avatar
      ),
    },
    text: comment.text || comment.content || comment.body || '',
    time: comment.time || formatCommentTime(comment.created_at),
    likes: Number(comment.likes) || 0,
    likedByCurrentUser: Boolean(comment.likedByCurrentUser || comment.liked_by_current_user),
    reports: Number(comment.reports) || 0,
    reportReason: comment.reportReason || comment.report_reason || '',
  };
}

function getReplyMention(comment) {
  if (comment.user.handle?.startsWith('@')) {
    return comment.user.handle;
  }

  return `@${comment.user.name.replace(/\s+/g, '')}`;
}

export default function CommentSection({
  postId,
  onCommentCountChange,
  initialComments = [],
  isLocal = false,
  onActivity,
}) {
  const { user } = useAuth();
  const currentUsername = user?.username || 'Anonymous';
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [likedComments, setLikedComments] = useState(() => {
    const likedCommentMap = {};

    if (isLocal) {
      initialComments.forEach((comment, index) => {
        const formattedComment = formatInitialComment(comment, index, postId);
        if (formattedComment.likedByCurrentUser) {
          likedCommentMap[formattedComment.id] = true;
        }
      });
    }

    return likedCommentMap;
  });
  const [reportedComments, setReportedComments] = useState({});
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [comments, setComments] = useState(() =>
    isLocal
      ? initialComments.map((comment, index) => formatInitialComment(comment, index, postId))
      : []
  );
  const [loading, setLoading] = useState(!isLocal);
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (isLocal || !loading) {
      onCommentCountChange?.(comments.length);
    }
  }, [comments.length, isLocal, loading, onCommentCountChange]);

  useEffect(() => {
    if (isLocal) return undefined;

    let isMounted = true;

    async function loadComments() {
      try {
        const response = await fetch(
          `${API_BASE}/api/posts/${postId}/comments?username=${encodeURIComponent(currentUsername)}`
        );

        if (!response.ok) {
          throw new Error('Could not load comments.');
        }

        const data = await response.json();
        const formattedComments = [...data]
          .sort((first, second) => new Date(second.created_at) - new Date(first.created_at))
          .map(comment => formatApiComment(comment));
        const likedCommentMap = {};

        formattedComments.forEach((comment) => {
          if (comment.likedByCurrentUser) {
            likedCommentMap[comment.id] = true;
          }
        });

        if (isMounted) {
          setComments(formattedComments);
          setLikedComments(likedCommentMap);
          setLoadError('');
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message);
          setComments([]);
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
  }, [currentUsername, isLocal, postId]);

  async function toggleLike(commentId) {
    setFeedback(null);

    if (isLocal) {
      const willLikeComment = !likedComments[commentId];

      setComments((previousComments) =>
        previousComments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                likes: Math.max(0, comment.likes + (willLikeComment ? 1 : -1)),
              }
            : comment
        )
      );
      setLikedComments((previousLikes) => ({
        ...previousLikes,
        [commentId]: willLikeComment,
      }));
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/comments/${commentId}/like`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: currentUsername }),
      });

      if (!response.ok) {
        throw new Error('Could not update this comment like. Please try again.');
      }

      const updatedComment = await response.json();

      setComments((previousComments) =>
        previousComments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                likes: updatedComment.likes || 0,
              }
            : comment
        )
      );
      setLikedComments((previousLikes) => ({
        ...previousLikes,
        [commentId]: Boolean(updatedComment.liked),
      }));
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: error.message });
    }
  }

  async function submitComment(content) {
    const trimmedComment = content.trim();
    if (!trimmedComment || commentSubmitting) return false;

    setCommentSubmitting(true);
    setFeedback(null);

    try {
      let formattedComment;

      if (isLocal) {
        formattedComment = {
          id: `local-${postId}-${Date.now()}`,
          user: {
            name: currentUsername,
            handle: `@${currentUsername}`,
            avatar: getAvatarOrDefault(user?.avatar),
          },
          time: 'just now',
          text: trimmedComment,
          likes: 0,
          reports: 0,
          reportReason: '',
        };
      } else {
        const response = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: trimmedComment,
            username: currentUsername,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Could not post your comment.');
        }

        formattedComment = formatApiComment(await response.json(), user?.avatar);
      }

      const nextCommentCount = comments.length + 1;
      setComments((previousComments) => [formattedComment, ...previousComments]);
      setFeedback({ type: 'success', message: 'Comment posted.' });
      onActivity?.({
        type: 'comment-created',
        postId,
        comment: formattedComment,
        commentCount: nextCommentCount,
        isLocal,
      });

      return true;
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
      return false;
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();

    const didSubmit = await submitComment(newComment);
    if (didSubmit) {
      setNewComment('');
    }
  }

  async function handleReplySubmit(event, comment) {
    event.preventDefault();

    const trimmedReply = replyText.trim();
    if (!trimmedReply) return;

    const replyContent = `${getReplyMention(comment)} ${trimmedReply}`;
    const didSubmit = await submitComment(replyContent);

    if (didSubmit) {
      setReplyText('');
      setReplyingTo(null);
    }
  }

  async function handleReportComment(reason) {
    if (reportingCommentId == null || reportedComments[reportingCommentId] || isLocal) {
      return;
    }

    try {
      setReportSubmitting(true);
      setReportError('');

      const response = await fetch(`${API_BASE}/api/comments/${reportingCommentId}/report`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          username: user?.username,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not submit this report. Please try again.');
      }

      const updatedComment = await response.json();
      const reportedCommentId = reportingCommentId;

      setComments((previousComments) =>
        previousComments.map((comment) =>
          comment.id === reportedCommentId
            ? {
                ...comment,
                reports: updatedComment.reports,
                reportReason: updatedComment.report_reason,
              }
            : comment
        )
      );
      setReportedComments((previousReports) => ({
        ...previousReports,
        [reportedCommentId]: true,
      }));
      setReportingCommentId(null);
      setFeedback({ type: 'success', message: 'Report submitted for moderator review.' });
      onActivity?.({
        type: 'comment-reported',
        postId,
        commentId: reportedCommentId,
        reason,
        isLocal: false,
      });
    } catch (error) {
      console.error(error);
      setReportError(error.message);
    } finally {
      setReportSubmitting(false);
    }
  }

  function openReply(commentId) {
    const isClosingReply = replyingTo === commentId;
    setReplyingTo(isClosingReply ? null : commentId);
    setReplyText('');
    setFeedback(null);
  }

  function closeReportDialog() {
    if (reportSubmitting) return;
    setReportingCommentId(null);
    setReportError('');
  }

  return (
    <div className="comment-section mt-4 pt-4 animate-fade-in border-t border-[var(--color-border)]">
      <form
        onSubmit={handleCommentSubmit}
        id={`comment-form-${postId}`}
        className="comment-composer flex gap-3 mb-5"
      >
        <img
          src={getAvatarOrDefault(user?.avatar)}
          alt="Your avatar"
          className="comment-composer-avatar w-8 h-8 rounded-full avatar-ring shrink-0 mt-1"
          onError={handleAvatarError}
        />

        <div className="comment-composer-control flex-1 rounded-md px-3 py-2.5 flex items-center gap-3 bg-[var(--color-surface-3)] border border-[var(--color-border)]">
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(event) => {
              setNewComment(event.target.value);
              setFeedback(null);
            }}
            className="comment-composer-input flex-1 text-sm"
            aria-label="Add a comment"
            id={`comment-input-${postId}`}
          />

          {newComment.trim() && (
            <button
              type="submit"
              disabled={commentSubmitting}
              className="comment-submit-button text-xs font-bold px-3 py-1.5 rounded-sm shrink-0 transition-all bg-[var(--color-portal-action)] text-white disabled:opacity-60"
            >
              {commentSubmitting ? 'Posting...' : 'Post'}
            </button>
          )}
        </div>
      </form>

      {loading && <p className="comment-status text-sm text-[color:var(--color-text-muted)]">Loading comments...</p>}

      {loadError && (
        <p className="comment-status comment-status-error text-sm text-[color:var(--color-error)]" role="alert">
          {loadError}
        </p>
      )}

      {feedback && (
        <p
          className={`comment-status comment-status-${feedback.type} text-sm ${
            feedback.type === 'error'
              ? 'text-[color:var(--color-error)]'
              : 'text-[color:var(--color-success)]'
          }`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      )}

      {!loading && !loadError && comments.length === 0 && (
        <p className="comment-empty text-sm text-[color:var(--color-text-muted)]">
          No comments yet. Be the first to comment.
        </p>
      )}

      <div className="comment-list flex flex-col gap-4">
        {comments.map((comment) => (
          <article key={comment.id} className="comment-row flex gap-3">
            <img
              src={comment.user.avatar}
              alt={`${comment.user.name} avatar`}
              className="comment-avatar w-7 h-7 rounded-full avatar-ring shrink-0 mt-0.5"
              onError={handleAvatarError}
            />

            <div className="comment-content flex-1 min-w-0">
              <div className="comment-item">
                <header className="comment-meta flex items-center gap-2 mb-1 flex-wrap">
                  <span className="comment-author text-xs font-bold text-[color:var(--color-text-primary)]">
                    {comment.user.name}
                  </span>
                  <span className="comment-handle text-xs text-[color:var(--color-text-muted)]">
                    {comment.user.handle}
                  </span>
                  <span className="comment-time text-xs text-[color:var(--color-text-muted)]">
                    · {comment.time}
                  </span>
                </header>

                <p className="comment-text text-sm leading-relaxed mb-2 text-[color:var(--color-text-secondary)]">
                  {comment.text}
                </p>

                <div className="comment-actions flex items-center gap-3">
                  <button
                    type="button"
                    id={`comment-like-${comment.id}`}
                    onClick={() => toggleLike(comment.id)}
                    className={`comment-action-button flex items-center gap-1.5 text-xs font-semibold transition-all ${
                      likedComments[comment.id]
                        ? 'text-[color:var(--color-upvote)]'
                        : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-secondary)]'
                    }`}
                    aria-label={`Like comment by ${comment.user.name}`}
                    aria-pressed={Boolean(likedComments[comment.id])}
                  >
                    <ThumbsUp
                      size={14}
                      strokeWidth={2}
                      fill={likedComments[comment.id] ? 'currentColor' : 'none'}
                      aria-hidden="true"
                    />
                    {comment.likes}
                  </button>

                  <button
                    type="button"
                    id={`comment-reply-${comment.id}`}
                    onClick={() => openReply(comment.id)}
                    className="comment-action-button text-xs font-semibold transition-all text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)]"
                    aria-expanded={replyingTo === comment.id}
                  >
                    Reply
                  </button>

                  {!isLocal && (
                    <button
                      type="button"
                      id={`comment-report-${comment.id}`}
                      onClick={() => {
                        setReportingCommentId(comment.id);
                        setReportError('');
                      }}
                      disabled={Boolean(reportedComments[comment.id])}
                      className={`comment-action-button flex items-center gap-1 text-xs font-semibold transition-all ${
                        reportedComments[comment.id]
                          ? 'text-[color:var(--color-error)]'
                          : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)]'
                      }`}
                    >
                      <Flag size={14} strokeWidth={2} aria-hidden="true" />
                      {reportedComments[comment.id] ? 'Reported' : 'Report'}
                    </button>
                  )}
                </div>

                {replyingTo === comment.id && (
                  <form
                    className="comment-reply-form mt-2 flex gap-2 animate-slide-down"
                    onSubmit={(event) => handleReplySubmit(event, comment)}
                  >
                    <input
                      type="text"
                      placeholder={`Reply to ${comment.user.name}...`}
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      className="comment-reply-input flex-1 text-xs px-3 py-2 rounded-md bg-[var(--color-surface-4)] border border-[var(--color-border)] text-[color:var(--color-text-primary)]"
                      id={`reply-input-${comment.id}`}
                      aria-label={`Reply to ${comment.user.name}`}
                      autoFocus
                    />

                    <button
                      type="submit"
                      disabled={!replyText.trim() || commentSubmitting}
                      className="comment-reply-submit text-xs font-bold px-3 py-1.5 rounded-sm bg-[var(--color-portal-action)] text-white disabled:opacity-60"
                    >
                      {commentSubmitting ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {!isLocal &&
        reportingCommentId != null &&
        createPortal(
          <div className="modal-backdrop comment-report-backdrop">
            <div
              className="report-dialog comment-report-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="comment-report-title"
            >
              <h3 id="comment-report-title" className="font-bold text-base mb-2">
                Report comment
              </h3>

              <p className="report-dialog-copy">Why are you reporting this comment?</p>

              {reportError && (
                <p
                  className="comment-report-error text-sm mb-3 text-[color:var(--color-error)]"
                  role="alert"
                >
                  {reportError}
                </p>
              )}

              <div className="report-reasons">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => handleReportComment(reason.value)}
                    disabled={reportSubmitting}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={closeReportDialog}
                disabled={reportSubmitting}
                className="button-secondary mt-4 w-full"
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
