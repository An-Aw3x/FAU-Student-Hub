import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Copy,
  Ellipsis,
  ExternalLink,
  Flag,
  Link2,
  MessageCircle,
  MessageSquare,
  Pin,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CommentSection from './CommentSection';
import { AI_SUMMARIES } from '../data/mockData';
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

const formatPostTime = (createdAt, fallbackTimeAgo) => {
  if (fallbackTimeAgo) return fallbackTimeAgo;
  if (!createdAt) return 'just now';

  let normalizedDate = createdAt;

  if (typeof normalizedDate === 'string') {
    normalizedDate = normalizedDate.trim().replace(' ', 'T');

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(normalizedDate)) {
      normalizedDate = `${normalizedDate}Z`;
    }
  }

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

function getCommentCount(post) {
  if (!post.created_at && Array.isArray(post.comments)) {
    return post.comments.length;
  }

  return post.commentCount || post.comment_count || 0;
}

export default function PostCard({
  post,
  aiSummaryEnabled,
  isAdmin,
  onViewProfile,
  onOpenPost,
  isLocallySaved = false,
  onSavedChange,
  onActivity,
}) {
  const { user } = useAuth();
  const [currentPost, setCurrentPost] = useState(post);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editBody, setEditBody] = useState(post.body || post.content || '');
  const [isSaving, setIsSaving] = useState(false);

  const getSavedVoteState = (postData) => {
    const savedVote = postData?.voteState || postData?.vote_state || 'none';

    if (savedVote === 'up' || savedVote === 'down') {
      return savedVote;
    }

    return 'none';
  };

  const [voteState, setVoteState] = useState(() => getSavedVoteState(post));

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setCurrentPost(post);
    setVoteState(getSavedVoteState(post));
  }, [post]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsMounted, setCommentsMounted] = useState(false);
  const [bookmarked, setBookmarked] = useState(isLocallySaved);
  const [reported, setReported] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(getCommentCount(post));
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);

  const isDatabasePost = Boolean(currentPost.created_at);
  const canAdminManagePost = isDatabasePost && isAdmin;

  useEffect(() => {
    let isMounted = true;

    async function loadSavedStatus() {
      if (!currentPost.created_at) {
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/api/posts/${currentPost.id}/saved?username=${encodeURIComponent(
            user?.username || 'Anonymous'
          )}`
        );

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
  }, [currentPost.id, currentPost.created_at, user?.username]);

  const upvoteCount = isDatabasePost
    ? currentPost.upvotes || 0
    : (currentPost.upvotes || 0) + (voteState === 'up' ? 1 : 0);

  const downvoteCount = isDatabasePost
    ? currentPost.downvotes || 0
    : (currentPost.downvotes || 0) + (voteState === 'down' ? 1 : 0);

  const showActionStatus = (message, type = 'success') => {
    setActionStatus({ message, type });
  };

  const toggleComments = () => {
    if (!commentsOpen) {
      setCommentsMounted(true);
    }

    setCommentsOpen(previous => !previous);
  };

  const handleVote = async (direction) => {
    if (!isDatabasePost) {
      setVoteState(previous => (previous === direction ? 'none' : direction));
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/posts/${currentPost.id}/vote`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voteType: direction,
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

      setVoteState(getSavedVoteState(updatedPost));
    } catch (error) {
      console.error(error);
      showActionStatus('Could not save your vote. Please try again.', 'error');
    }
  };

  const handleReport = async (reason) => {
    if (reported || reportSubmitting) {
      return;
    }

    if (!REPORT_REASONS.some(item => item.value === reason)) {
      showActionStatus('Choose a valid report reason.', 'error');
      return;
    }

    if (!isDatabasePost) {
      setReportModalOpen(false);
      showActionStatus('Reporting is available on published community posts.', 'error');
      return;
    }

    try {
      setReportSubmitting(true);

      const response = await fetch(`${API_BASE}/api/posts/${currentPost.id}/report`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          username: user?.username || 'Anonymous',
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
      showActionStatus('Report submitted for moderator review.');
      onActivity?.({
        type: 'report',
        title: 'Report submitted',
        message: currentPost.title,
        postId: currentPost.id,
      });
    } catch (error) {
      console.error(error);
      showActionStatus('Could not submit this report. Please try again.', 'error');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editBody.trim()) {
      showActionStatus('Title and content are required.', 'error');
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(`${API_BASE}/api/posts/${currentPost.id}`, {
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
      showActionStatus('Post updated.');
    } catch (error) {
      console.error(error);
      showActionStatus('Could not update the post. Please try again.', 'error');
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
      const response = await fetch(`${API_BASE}/api/posts/${currentPost.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      setIsDeleted(true);
    } catch (error) {
      console.error(error);
      showActionStatus('Could not delete the post. Please try again.', 'error');
    }
  };

  const handleBookmark = async () => {
    if (!isDatabasePost) {
      const nextSavedState = !bookmarked;

      setBookmarked(nextSavedState);
      onSavedChange?.(currentPost, nextSavedState);
      showActionStatus(
        nextSavedState
          ? 'Saved for this browser session.'
          : 'Removed from your saved posts.'
      );
      onActivity?.({
        type: 'saved',
        title: nextSavedState ? 'Post saved' : 'Post removed from saved posts',
        message: currentPost.title,
        postId: currentPost.id,
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/posts/${currentPost.id}/save`, {
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
      const nextSavedState = Boolean(data.saved);

      setBookmarked(nextSavedState);
      onSavedChange?.(currentPost, nextSavedState);
      showActionStatus(
        nextSavedState ? 'Post added to your saved list.' : 'Post removed from your saved list.'
      );
      onActivity?.({
        type: 'saved',
        title: nextSavedState ? 'Post saved' : 'Post removed from saved posts',
        message: currentPost.title,
        postId: currentPost.id,
      });
    } catch (error) {
      console.error(error);
      showActionStatus('Could not update your saved posts. Please try again.', 'error');
    }
  };

  const getPostLink = () => {
    return `${window.location.origin}${window.location.pathname}#post-${currentPost.id}`;
  };

  const copyPostLink = async () => {
    try {
      await navigator.clipboard.writeText(getPostLink());
      setShareMenuOpen(false);
      showActionStatus('Post link copied.');
    } catch (error) {
      console.error(error);
      showActionStatus('Could not copy the post link.', 'error');
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

    const nextPinnedState = !(currentPost.isPinned || currentPost.is_pinned);

    try {
      const response = await fetch(`${API_BASE}/api/posts/${currentPost.id}/pin`, {
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
      showActionStatus(nextPinnedState ? 'Post featured.' : 'Post removed from featured posts.');
    } catch (error) {
      console.error(error);
      showActionStatus('Could not update the featured post.', 'error');
    }
  };

  const handleCommentActivity = (activity) => {
    if (activity.type === 'comment-created') {
      onActivity?.({
        type: 'comment',
        title: 'Comment posted',
        message: `On "${currentPost.title}"`,
        postId: currentPost.id,
      });
      return;
    }

    if (activity.type === 'comment-reported') {
      onActivity?.({
        type: 'report',
        title: 'Comment report submitted',
        message: currentPost.title,
        postId: currentPost.id,
      });
    }
  };

  const authorName = currentPost.user?.name || currentPost.username || 'Anonymous';
  const authorHandle = currentPost.user?.handle || '';
  const authorAvatar = getAvatarOrDefault(
    currentPost.author_avatar ||
    currentPost.user?.avatar ||
    currentPost.avatar ||
    currentPost.profile_avatar
  );

  console.log('PostCard avatar check:', {
    title: currentPost.title,
    username: currentPost.username,
    author_avatar: currentPost.author_avatar,
    user_avatar: currentPost.user?.avatar,
    final_avatar: authorAvatar,
  });

  const postBody = currentPost.body || currentPost.content || '';
  const postTime = formatPostTime(currentPost.created_at, currentPost.timeAgo);
  const postTags = currentPost.tags || [];
  const imageUrl = currentPost.image_url || currentPost.imageUrl || '';
  const linkUrl = currentPost.link_url || currentPost.linkUrl || '';
  const commentLabel = `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`;
  const normalizedBody = postBody.trim();
  const shouldRenderBody =
    normalizedBody &&
    normalizedBody !== String(currentPost.title || '').trim();
  const bodyNeedsExpansion = normalizedBody.length > 180;
  const openAuthorProfile = () => {
    onViewProfile?.({
      username: authorName,
      handle: authorHandle,
      avatar: authorAvatar,
      bio: currentPost.user?.bio || currentPost.bio || '',
    });
  };

  if (isDeleted) {
    return null;
  }

  return (
    <>
      <article
        id={`post-${currentPost.id}`}
        className={`post-card animate-fade-in ${
          currentPost.isPinned || currentPost.is_pinned ? 'is-featured' : ''
        }`}
        aria-label={`Post: ${currentPost.title}`}
      >
        <div className="post-card-content">
          {Boolean(currentPost.isPinned || currentPost.is_pinned) && (
            <div className="pinned-label">
              <Pin size={14} aria-hidden="true" />
              Featured post
            </div>
          )}

          {aiSummaryEnabled && AI_SUMMARIES[currentPost.id] && (
            <div className="ai-summary-banner animate-fade-in">
              <div className="ai-summary-label">
                <Sparkles size={14} aria-hidden="true" />
                Summary preview
              </div>
              <p>{AI_SUMMARIES[currentPost.id]}</p>
            </div>
          )}

          <header className="post-header">
            <button
              type="button"
              onClick={openAuthorProfile}
              className="post-author-avatar-button"
              aria-label={`View ${authorName}'s profile`}
            >
              <img
                key={authorAvatar}
                src={authorAvatar}
                alt=""
                className="w-10 h-10 rounded-full avatar-ring shrink-0"
                onError={handleAvatarError}
              />
            </button>

            <div className="post-author">
              <button
                type="button"
                onClick={openAuthorProfile}
                className="post-author-name"
              >
                {authorName}
              </button>

              <div className="post-meta">
                {authorHandle && <span>{authorHandle}</span>}
                {authorHandle && <span aria-hidden="true">&middot;</span>}
                <time>{postTime}</time>
              </div>
            </div>

            {isDatabasePost ? (
              <button
                id={`report-post-${currentPost.id}`}
                onClick={() => setReportModalOpen(true)}
                disabled={reported || reportSubmitting}
                className={`post-utility ${reported ? 'reported' : ''}`}
                title={reported ? 'Post reported' : 'Report post'}
                aria-label={`Report post: ${currentPost.title}`}
              >
                {reported ? (
                  <span>Reported</span>
                ) : reportSubmitting ? (
                  <span>Sending...</span>
                ) : (
                  <Flag size={16} aria-hidden="true" />
                )}
              </button>
            ) : (
              <span className="post-demo-label">Sample discussion</span>
            )}
          </header>

          {actionStatus && (
            <div
              className={`post-action-status is-${actionStatus.type}`}
              role={actionStatus.type === 'error' ? 'alert' : 'status'}
            >
              <span>{actionStatus.message}</span>
              <button
                type="button"
                onClick={() => setActionStatus(null)}
                aria-label="Dismiss message"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          {isEditing ? (
            <input
              value={editTitle}
              onChange={event => setEditTitle(event.target.value)}
              className="post-edit-input"
              aria-label="Edit post title"
            />
          ) : (
            <h2 className="post-title">
              {onOpenPost ? (
                <button
                  type="button"
                  className="post-title-link"
                  onClick={() => onOpenPost(currentPost.id)}
                >
                  {currentPost.title}
                </button>
              ) : (
                currentPost.title
              )}
            </h2>
          )}

          {isEditing ? (
            <div className="post-edit-area">
              <textarea
                value={editBody}
                onChange={event => setEditBody(event.target.value)}
                className="post-edit-input"
                rows="3"
                aria-label="Edit post content"
              />

              <div className="flex gap-2 mt-2 flex-wrap">
                <button onClick={handleSaveEdit} disabled={isSaving} className="button-primary button-compact">
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>

                {canAdminManagePost && (
                  <button
                    type="button"
                    onClick={handleTogglePin}
                    className="button-secondary button-compact"
                  >
                    {currentPost.isPinned || currentPost.is_pinned ? 'Remove feature' : 'Feature post'}
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(currentPost.title || '');
                    setEditBody(currentPost.body || currentPost.content || '');
                  }}
                  className="button-secondary button-compact"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {shouldRenderBody && (
                <>
                  <p
                    className={`post-body ${
                      bodyNeedsExpansion && !bodyExpanded ? 'line-clamp-3' : ''
                    }`}
                  >
                    {postBody}
                  </p>

                  {bodyNeedsExpansion && (
                    <button
                      type="button"
                      className="post-body-toggle"
                      onClick={() => setBodyExpanded(previous => !previous)}
                      aria-expanded={bodyExpanded}
                    >
                      {bodyExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </>
              )}

              {postTags.length > 0 && (
                <div className="post-tags" aria-label="Post topics">
                  {postTags.map(tag => (
                    <span key={tag} className="post-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {imageUrl && (
                <div className="post-attachment">
                  <img
                    src={imageUrl}
                    alt="Post attachment"
                    className="w-full max-h-80 object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {linkUrl && (
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="post-link"
                >
                  <Link2 size={16} aria-hidden="true" />
                  <span>{linkUrl}</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
            </>
          )}
        </div>

        <footer className="post-actions">
          <div className="post-vote-group" aria-label="Post voting">
            <button
              id={`upvote-post-${currentPost.id}`}
              onClick={() => handleVote('up')}
              className={`vote-btn ${voteState === 'up' ? 'upvoted' : ''}`}
              aria-label={`Upvote post. Current count: ${upvoteCount}`}
              aria-pressed={voteState === 'up'}
            >
              <ArrowUp size={15} aria-hidden="true" />
              {upvoteCount}
            </button>

            <button
              id={`downvote-post-${currentPost.id}`}
              onClick={() => handleVote('down')}
              className={`vote-btn ${voteState === 'down' ? 'downvoted' : ''}`}
              aria-label={`Downvote post. Current count: ${downvoteCount}`}
              aria-pressed={voteState === 'down'}
            >
              <ArrowDown size={15} aria-hidden="true" />
              {downvoteCount}
            </button>
          </div>

          <button
            id={`comments-toggle-${currentPost.id}`}
            onClick={toggleComments}
            className="vote-btn"
            aria-expanded={commentsOpen}
            aria-label={`${commentsOpen ? 'Hide' : 'Show'} comments. ${commentLabel}`}
          >
            <MessageSquare size={15} aria-hidden="true" />
            {commentsOpen ? 'Hide comments' : commentLabel}
          </button>

          <div className="post-share-wrapper relative">
            <button
              id={`share-post-${currentPost.id}`}
              className="vote-btn"
              aria-label="Share post"
              aria-expanded={shareMenuOpen}
              onClick={() => setShareMenuOpen(previous => !previous)}
            >
              <Share2 size={15} aria-hidden="true" />
              Share
            </button>

            {shareMenuOpen && (
              <div className="post-share-menu">
                <button type="button" onClick={copyPostLink}>
                  <Copy size={15} aria-hidden="true" />
                  Copy link
                </button>

                <button type="button" onClick={shareToX}>
                  <Share2 size={15} aria-hidden="true" />
                  Share to X
                </button>

                <button type="button" onClick={shareToWhatsApp}>
                  <MessageCircle size={15} aria-hidden="true" />
                  Share to WhatsApp
                </button>

                <button type="button" onClick={shareMoreOptions}>
                  <Ellipsis size={15} aria-hidden="true" />
                  More options
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
                className="vote-btn danger"
                aria-label="Delete post"
              >
                Delete
              </button>
            </>
          )}

          <button
            id={`bookmark-post-${currentPost.id}`}
            onClick={handleBookmark}
            className={`vote-btn post-save-action ${bookmarked ? 'upvoted' : ''}`}
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
            aria-pressed={bookmarked}
          >
            <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
            {bookmarked ? 'Saved' : 'Save'}
          </button>
        </footer>

        {commentsMounted && (
          <div className="post-comments" hidden={!commentsOpen}>
            <CommentSection
              postId={currentPost.id}
              initialComments={currentPost.comments || []}
              isLocal={!isDatabasePost}
              onCommentCountChange={setCommentCount}
              onActivity={handleCommentActivity}
            />
          </div>
        )}
      </article>

      {reportModalOpen && !reported && (
        <div className="modal-backdrop">
          <div
            className="report-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`report-title-${currentPost.id}`}
          >
            <h3 id={`report-title-${currentPost.id}`} className="font-bold text-base mb-2">
              Report post
            </h3>

            <p className="report-dialog-copy">
              Why are you reporting this post?
            </p>

            <div className="report-reasons">
              {REPORT_REASONS.map(reason => (
                <button
                  key={reason.value}
                  onClick={() => handleReport(reason.value)}
                  disabled={reportSubmitting}
                >
                  {reason.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setReportModalOpen(false)}
              disabled={reportSubmitting}
              className="button-secondary mt-4 w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
