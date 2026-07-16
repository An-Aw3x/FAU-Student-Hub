import { useState } from 'react';
import CommentSection from './CommentSection';
import { AI_SUMMARIES } from '../data/mockData';

// ── Icons ──────────────────────────────────────────────────
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
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const ReportIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const PinIcon = () => (
  <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7zm0 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
  </svg>
);

const BookmarkIcon = ({ active }) => (
  <svg width="14" height="14" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const TAG_COLOR_MAP = {
  housing: '#60A5FA',
  events:  '#34D399',
  rants:   '#F87171',
  food:    '#FBBF24',
  classes: '#A78BFA',
  campus:  '#38BDF8',
  jobs:    '#4ADE80',
  tech:    '#818CF8',
  safety:  '#FB923C',
  health:  '#F472B6',
  sports:  '#2DD4BF',
};

export default function PostCard({ post, aiSummaryEnabled }) {
  const [voteState, setVoteState]       = useState('none'); // 'up' | 'down' | 'none'
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [bookmarked, setBookmarked]     = useState(false);
  const [reported, setReported]         = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);

  const upvoteCount   = (post.upvotes || 0)   + (voteState === 'up'   ? 1 : 0);
  const downvoteCount = (post.downvotes || 0) + (voteState === 'down' ? 1 : 0);

  const handleVote = (dir) => {
    setVoteState(prev => prev === dir ? 'none' : dir);
  };

  const handleReport = () => {
    setShowReportConfirm(true);
    setTimeout(() => {
      setReported(true);
      setShowReportConfirm(false);
    }, 1500);
  };

  // Derive display values — works for both mock posts and DB posts
  const authorName   = post.user?.name   || post.username || 'Anonymous';
  const authorHandle = post.user?.handle || '';
  const authorAvatar = post.user?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(post.username || 'Anon')}&backgroundColor=b6e3f4`;
  const postBody     = post.body || post.content || '';
  const postTime     = post.timeAgo || (post.created_at ? new Date(post.created_at).toLocaleDateString() : 'just now');
  const postTags     = post.tags || [];
  const commentCount = post.commentCount || 0;
  const comments     = post.comments || [];

  return (
    <article
      id={`post-${post.id}`}
      className="post-card p-5 animate-fade-in"
      aria-label={`Post: ${post.title}`}
    >
      {/* ── Pinned Badge ─────────────────────────────────── */}
      {post.isPinned && (
        <div className="flex items-center gap-1.5 mb-3 text-xs font-bold"
          style={{ color: 'var(--color-owl-gold)' }}>
          <PinIcon />
          Pinned Post
        </div>
      )}

      {/* ── AI Summary Banner ─────────────────────────────── */}
      {aiSummaryEnabled && AI_SUMMARIES[post.id] && (
        <div
          className="rounded-xl px-4 py-2.5 mb-4 text-xs leading-relaxed animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(0,63,138,0.18), rgba(212,175,55,0.08))',
            border: '1px solid rgba(212,175,55,0.2)',
            color: 'var(--color-accent-light)',
          }}
        >
          {AI_SUMMARIES[post.id]}
        </div>
      )}

      {/* ── Post Header ───────────────────────────────────── */}
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

        {/* Report Button */}
        <button
          id={`report-post-${post.id}`}
          onClick={handleReport}
          disabled={reported}
          className="shrink-0 p-2 rounded-lg transition-all hover:bg-[color:var(--color-surface-3)]"
          style={{ color: reported ? '#F87171' : 'var(--color-text-muted)' }}
          title={reported ? 'Post reported' : 'Report post'}
          aria-label={`Report post: ${post.title}`}
        >
          {showReportConfirm ? (
            <span className="text-xs font-semibold" style={{ color: '#F87171' }}>Reported!</span>
          ) : (
            <ReportIcon />
          )}
        </button>
      </div>

      {/* ── Post Title ────────────────────────────────────── */}
      <h2 className="font-display font-bold text-base leading-snug mb-2 cursor-pointer hover:text-[color:var(--color-owl-gold-light)] transition-colors"
        style={{ color: 'var(--color-text-primary)' }}>
        {post.title}
      </h2>

      {/* ── Post Body ─────────────────────────────────────── */}
      <p className="text-sm leading-relaxed mb-4 line-clamp-3"
        style={{ color: 'var(--color-text-secondary)' }}>
        {postBody}
      </p>

      {/* ── Tags/Flairs ───────────────────────────────────── */}
      {postTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {postTags.map(tag => (
            <span
              key={tag}
              className="tag-chip"
              style={{ color: TAG_COLOR_MAP[tag] || '#7EB3FF' }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Action Bar ────────────────────────────────────── */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Upvote */}
        <button
          id={`upvote-post-${post.id}`}
          onClick={() => handleVote('up')}
          className={`vote-btn ${voteState === 'up' ? 'upvoted' : ''}`}
          aria-label={`Upvote post. Current count: ${upvoteCount}`}
          aria-pressed={voteState === 'up'}
        >
          <ArrowUpIcon />
          {upvoteCount}
        </button>

        {/* Downvote */}
        <button
          id={`downvote-post-${post.id}`}
          onClick={() => handleVote('down')}
          className={`vote-btn ${voteState === 'down' ? 'downvoted' : ''}`}
          aria-label={`Downvote post. Current count: ${downvoteCount}`}
          aria-pressed={voteState === 'down'}
        >
          <ArrowDownIcon />
          {downvoteCount}
        </button>

        {/* Comments Toggle */}
        <button
          id={`comments-toggle-${post.id}`}
          onClick={() => setCommentsOpen(p => !p)}
          className="vote-btn ml-1"
          aria-expanded={commentsOpen}
          aria-label={`${commentsOpen ? 'Hide' : 'Show'} comments. ${commentCount} comments`}
        >
          <CommentIcon />
          {commentCount} {commentsOpen ? 'Hide' : 'Comments'}
        </button>

        {/* Share */}
        <button
          id={`share-post-${post.id}`}
          className="vote-btn"
          aria-label="Share post"
          onClick={() => navigator.clipboard?.writeText(window.location.href)}
        >
          <ShareIcon />
          Share
        </button>

        {/* Bookmark */}
        <button
          id={`bookmark-post-${post.id}`}
          onClick={() => setBookmarked(p => !p)}
          className={`vote-btn ml-auto ${bookmarked ? 'upvoted' : ''}`}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
          aria-pressed={bookmarked}
        >
          <BookmarkIcon active={bookmarked} />
          {bookmarked ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* ── Comment Section ───────────────────────────────── */}
      {commentsOpen && (
        <CommentSection comments={comments} postId={post.id} />
      )}
    </article>
  );
}
