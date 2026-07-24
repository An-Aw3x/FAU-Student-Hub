import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CommentSection from './CommentSection';
import { AI_SUMMARIES } from '../data/mockData';
const ArrowUpIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CommentIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const ReportIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const PinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
    <path
      fillRule="evenodd"
      d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.664.293a.75.75 0 0 1 .428 1.317l-2.791 2.39.853 3.575a.75.75 0 0 1-1.12.814L7.998 12.08l-3.135 1.915a.75.75 0 0 1-1.12-.814l.852-3.574-2.79-2.39a.75.75 0 0 1 .427-1.318l3.663-.293 1.41-3.393A.75.75 0 0 1 8 1.75Z"
      clipRule="evenodd"
    />
  </svg>
);

const BookmarkIcon = ({ active }) => (
  <svg width="14" height="14" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const TAG_COLOR_MAP = {
  housing: '#60A5FA',
  events: '#34D399',
  rants: '#F87171',
  food: '#FBBF24',
  classes: '#A78BFA',
  campus: '#38BDF8',
  jobs: '#4ADE80',
  tech: '#818CF8',
  safety: '#FB923C',
  health: '#F472B6',
  sports: '#2DD4BF',
};

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'nudity', label: 'Nudity or sexual content' },
  { value: 'hate', label: 'Hate speech' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'other', label: 'Other' },
];

const formatPostTime = (createdAt, fallbackTimeAgo) => {
  if (fallbackTimeAgo) return fallbackTimeAgo;
  if (!createdAt) return 'just now';

  const normalizedDate =
    typeof createdAt === 'string'
      ? createdAt.replace(' ', 'T')
      : createdAt;

  const postDate = new Date(normalizedDate);

  if (Number.isNaN(postDate.getTime())) {
    return 'just now';
  }

  const now = new Date();
  const diffMinutes = Math.max(0, Math.floor((now - postDate) / 60000));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;

  return postDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function PostCard({ post, aiSummaryEnabled, isAdmin }) {
  const { user } = useAuth();
  const [currentPost, setCurrentPost] = useState(post);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editBody, setEditBody] = useState(post.body || post.content || '');
  const [isSaving, setIsSaving] = useState(false);

  const [voteState, setVoteState] = useState('none');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [reported, setReported] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || post.comment_count || 0);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentPost(post);
    setEditTitle(post.title || '');
    setEditBody(post.body || post.content || '');
    setCommentCount(post.commentCount || post.comment_count || 0);
    setIsDeleted(false);
    setIsEditing(false);
    setReportModalOpen(false);
    setReportSubmitting(false);
  }, [post]);

  const isDatabasePost = Boolean(currentPost.created_at);
  const canAdminManagePost = isDatabasePost && isAdmin;

  useEffect(() => {
    let isMounted = true;

    async function loadSavedStatus() {
      if (!currentPost.created_at) {
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/posts/${currentPost.id}/saved`);

        if (!response.ok) {
          throw new Error('Failed to load saved status.');
        }

        const data = await response.json();

        if (isMounted) {
          setBookmarked(data.saved);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadSavedStatus();

    return () => {
      isMounted = false;
    };
  }, [currentPost.id, currentPost.created_at]);

  const upvoteCount = isDatabasePost
    ? currentPost.upvotes || 0
    : (currentPost.upvotes || 0) + (voteState === 'up' ? 1 : 0);

  const downvoteCount = isDatabasePost
    ? currentPost.downvotes || 0
    : (currentPost.downvotes || 0) + (voteState === 'down' ? 1 : 0);

  const handleVote = async (dir) => {
    if (!isDatabasePost) {
      setVoteState(prev => prev === dir ? 'none' : dir);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/posts/${currentPost.id}/vote`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voteType: dir,
          username: user?.username || 'Anonymous',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      const updatedPost = await response.json();

      setCurrentPost({
        ...currentPost,
        ...updatedPost,
        body: updatedPost.content,
      });

      setVoteState(updatedPost.voteState || dir);
    } catch (error) {
      console.error(error);
      alert('Could not save vote.');
    }
  };

  const handleReport = async (reason) => {
    if (reported || reportSubmitting) {
      return;
    }

    if (!REPORT_REASONS.some(item => item.value === reason)) {
      alert('Invalid report reason.');
      return;
    }

    if (!isDatabasePost) {
      setReportSubmitting(true);

      setTimeout(() => {
        setReported(true);
        setReportModalOpen(false);
        setReportSubmitting(false);
      }, 800);

      return;
    }

    try {
      setReportSubmitting(true);

      const response = await fetch(`http://localhost:3001/api/posts/${currentPost.id}/report`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to report post');
      }

      const updatedPost = await response.json();

      setCurrentPost({
        ...currentPost,
        ...updatedPost,
        body: updatedPost.content,
      });

      setReported(true);
      setReportModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Could not report the post.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editBody.trim()) {
      alert('Title and content are required.');
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(`http://localhost:3001/api/posts/${currentPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          content: editBody,
          tags: currentPost.tags || [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      const updatedPost = await response.json();

      setCurrentPost({
        ...currentPost,
        ...updatedPost,
        body: updatedPost.content,
      });

      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert('Could not update the post.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/posts/${currentPost.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      setIsDeleted(true);
    } catch (error) {
      console.error(error);
      alert('Could not delete the post.');
    }
  };

  const handleBookmark = async () => {
    if (!isDatabasePost) {
      setBookmarked((p) => !p);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/posts/${currentPost.id}/save`, {
        method: bookmarked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user?.username || 'Anonymous',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bookmark.');
      }

      const data = await response.json();
      setBookmarked(data.saved);
    } catch (error) {
      console.error(error);
      alert('Could not update saved post.');
    }
  };

  const getPostLink = () => {
    return `${window.location.origin}${window.location.pathname}#post-${currentPost.id}`;
  };

  const copyPostLink = async () => {
    try {
      await navigator.clipboard.writeText(getPostLink());
      setShareMenuOpen(false);
      alert('Post link copied!');
    } catch (error) {
      console.error(error);
      alert('Could not copy link.');
    }
  };

  const shareToX = () => {
    const text = encodeURIComponent(currentPost.title || 'Check out this OwlNet post');
    const url = encodeURIComponent(getPostLink());

    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    setShareMenuOpen(false);
  };

  const shareToWhatsApp = () => {
    const message = encodeURIComponent(`${currentPost.title || 'Check out this OwlNet post'} ${getPostLink()}`);

    window.open(`https://wa.me/?text=${message}`, '_blank');
    setShareMenuOpen(false);
  };

  const shareMoreOptions = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPost.title || 'OwlNet post',
          text: postBody,
          url: getPostLink(),
        });
        setShareMenuOpen(false);
      } catch (error) {
        console.error(error);
      }

      return;
    }

    copyPostLink();
  };

  const handleTogglePin = async () => {
    if (!canAdminManagePost) return;

    const nextPinnedState = !Boolean(currentPost.isPinned || currentPost.is_pinned);

    try {
      const response = await fetch(`http://localhost:3001/api/posts/${currentPost.id}/pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPinned: nextPinnedState,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update featured post.');
      }

      const updatedPost = await response.json();

      setCurrentPost({
        ...currentPost,
        ...updatedPost,
        isPinned: updatedPost.isPinned,
        body: updatedPost.content,
      });
    } catch (error) {
      console.error(error);
      alert('Could not update featured post.');
    }
  };

  const authorName = currentPost.user?.name || currentPost.username || 'Anonymous';
  const authorHandle = currentPost.user?.handle || '';
  const authorAvatar =
    currentPost.user?.avatar ||
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
      currentPost.username || 'Anon'
    )}&backgroundColor=b6e3f4`;

  const postBody = currentPost.body || currentPost.content || '';
  const postTime = formatPostTime(currentPost.created_at, currentPost.timeAgo);
  const postTags = currentPost.tags || [];
  const imageUrl = currentPost.image_url || currentPost.imageUrl || '';
  const linkUrl = currentPost.link_url || currentPost.linkUrl || '';

  if (isDeleted) {
    return null;
  }

  return (
    <>
      <article
      id={`post-${currentPost.id}`}
      className="post-card p-5 animate-fade-in"
      aria-label={`Post: ${currentPost.title}`}
    >
      {currentPost.isPinned && (
        <div className="flex items-center gap-1.5 mb-3 text-xs font-bold pinned-label">
          <PinIcon />
          Featured Post
        </div>
      )}

      {aiSummaryEnabled && AI_SUMMARIES[currentPost.id] && (
        <div
          className="ai-summary-banner rounded-xl px-4 py-2.5 mb-4 text-xs leading-relaxed animate-fade-in"
          style={{
            color: 'var(--color-accent-light)',
          }}
        >
          {AI_SUMMARIES[currentPost.id]}
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <img
          src={authorAvatar}
          alt={authorName}
          className="w-10 h-10 rounded-full avatar-ring shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {authorName}
            </span>

            {authorHandle && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {authorHandle}
              </span>
            )}

            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              · {postTime}
            </span>
          </div>
        </div>

        <button
          id={`report-post-${currentPost.id}`}
          onClick={() => setReportModalOpen(true)}
          disabled={reported || reportSubmitting}
          className="shrink-0 p-2 rounded-lg transition-all hover:bg-[color:var(--color-surface-3)]"
          style={{ color: reported ? '#F87171' : 'var(--color-text-muted)' }}
          title={reported ? 'Post reported' : 'Report post'}
          aria-label={`Report post: ${currentPost.title}`}
        >
          {reported ? (
            <span className="text-xs font-semibold" style={{ color: '#F87171' }}>
              Reported
            </span>
          ) : reportSubmitting ? (
            <span className="text-xs font-semibold" style={{ color: '#F87171' }}>
              Sending...
            </span>
          ) : (
            <ReportIcon />
          )}
        </button>
      </div>

      {isEditing ? (
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full mb-2 p-2 rounded-lg"
          style={{
            background: 'var(--color-surface-2)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        />
      ) : (
        <h2
          className="font-display font-bold text-base leading-snug mb-2 cursor-pointer transition-colors hover:text-[color:var(--color-accent-light)]"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {currentPost.title}
        </h2>
      )}

      {isEditing ? (
        <div className="mb-4">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            className="w-full p-2 rounded-lg"
            rows="3"
            style={{
              background: 'var(--color-surface-2)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />

          <div className="flex gap-2 mt-2 flex-wrap">
            <button onClick={handleSaveEdit} disabled={isSaving} className="vote-btn">
              {isSaving ? 'Saving...' : 'Save'}
            </button>

            {canAdminManagePost && (
              <button
                type="button"
                onClick={handleTogglePin}
                className="vote-btn"
              >
                {currentPost.isPinned || currentPost.is_pinned ? 'Unpin Featured' : 'Pin Featured'}
              </button>
            )}

            <button
              onClick={() => {
                setIsEditing(false);
                setEditTitle(currentPost.title || '');
                setEditBody(currentPost.body || currentPost.content || '');
              }}
              className="vote-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p
            className="text-sm leading-relaxed mb-4 line-clamp-3"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {postBody}
          </p>

          {imageUrl && (
            <div
              className="mb-4 overflow-hidden rounded-2xl"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <img
                src={imageUrl}
                alt="Post attachment"
                className="w-full max-h-80 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {linkUrl && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noreferrer"
              className="block mb-4 rounded-2xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-80"
              style={{
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-owl-blue)',
              }}
            >
              🔗 {linkUrl}
            </a>
          )}
        </>
      )}

      <div className="flex items-center gap-1 flex-wrap">
        <button
          id={`upvote-post-${currentPost.id}`}
          onClick={() => handleVote('up')}
          className={`vote-btn ${voteState === 'up' ? 'upvoted' : ''}`}
          aria-label={`Upvote post. Current count: ${upvoteCount}`}
          aria-pressed={voteState === 'up'}
        >
          <ArrowUpIcon />
          {upvoteCount}
        </button>

        <button
          id={`downvote-post-${currentPost.id}`}
          onClick={() => handleVote('down')}
          className={`vote-btn ${voteState === 'down' ? 'downvoted' : ''}`}
          aria-label={`Downvote post. Current count: ${downvoteCount}`}
          aria-pressed={voteState === 'down'}
        >
          <ArrowDownIcon />
          {downvoteCount}
        </button>

        <button
          id={`comments-toggle-${currentPost.id}`}
          onClick={() => setCommentsOpen((p) => !p)}
          className="vote-btn ml-1"
          aria-expanded={commentsOpen}
          aria-label={`${commentsOpen ? 'Hide' : 'Show'} comments. ${commentCount} comments`}
        >
          <CommentIcon />
          {commentCount} {commentsOpen ? 'Hide' : 'Comments'}
        </button>

        <div className="relative">
          <button
            id={`share-post-${currentPost.id}`}
            className="vote-btn"
            aria-label="Share post"
            aria-expanded={shareMenuOpen}
            onClick={() => setShareMenuOpen(prev => !prev)}
          >
            <ShareIcon />
            Share
          </button>

          {shareMenuOpen && (
            <div
              className="absolute left-0 bottom-10 z-50 w-56 rounded-2xl p-2 shadow-xl"
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <button
                type="button"
                onClick={copyPostLink}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-80"
              >
                🔗 Copy link
              </button>

              <button
                type="button"
                onClick={shareToX}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-80"
              >
                𝕏 Share to X
              </button>

              <button
                type="button"
                onClick={shareToWhatsApp}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-80"
              >
                🟢 WhatsApp
              </button>

              <button
                type="button"
                onClick={shareMoreOptions}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-80"
              >
                ⋯ More options
              </button>
            </div>
          )}
        </div>

        {canAdminManagePost && (
          <>

            <button
              id={`edit-post-${currentPost.id}`}
              onClick={() => setIsEditing(true)}
              className="vote-btn"
              aria-label="Edit post"
            >
              Edit
            </button>

            <button
              id={`delete-post-${currentPost.id}`}
              onClick={handleDeletePost}
              className="vote-btn"
              aria-label="Delete post"
            >
              Delete
            </button>
          </>
        )}

        <button
          id={`bookmark-post-${currentPost.id}`}
          onClick={handleBookmark}
          className={`vote-btn ml-auto ${bookmarked ? 'upvoted' : ''}`}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
          aria-pressed={bookmarked}
        >
          <BookmarkIcon active={bookmarked} />
          {bookmarked ? 'Saved' : 'Save'}
        </button>
      </div>

            {commentsOpen && (
        <CommentSection
          postId={currentPost.id}
          onCommentCountChange={setCommentCount}
        />
      )}
    </article>

    {reportModalOpen && !reported && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(0, 0, 0, 0.55)' }}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-4 shadow-xl max-h-[80vh] overflow-y-auto"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <h3 className="font-bold text-base mb-2">Report post</h3>

          <p
            className="text-sm mb-4"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Why are you reporting this post?
          </p>

          <div className="flex flex-col gap-2">
            {REPORT_REASONS.map(reason => (
              <button
                key={reason.value}
                onClick={() => handleReport(reason.value)}
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
            onClick={() => setReportModalOpen(false)}
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
  </>
);
}