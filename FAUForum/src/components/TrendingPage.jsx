import { useMemo } from 'react';
import {
  ArrowLeft,
  Clock3,
  Flame,
  Hash,
  MessageSquare,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { getPostActivity, getTrendingPosts, getTrendingTags } from '../utils/trending';

function getPostAuthor(post) {
  return post.user?.name || post.username || post.author || post.name || 'OwlNet student';
}

function getPostExcerpt(post) {
  const content = post.body || post.content || '';

  if (content.length <= 150) {
    return content;
  }

  return `${content.slice(0, 147).trimEnd()}...`;
}

function getPostTimeLabel(post, ageHours) {
  if (post.timeAgo) return post.timeAgo;
  if (!Number.isFinite(ageHours)) return '';
  if (ageHours < 1 / 60) return 'Just now';

  if (ageHours < 1) {
    const minutes = Math.max(1, Math.floor(ageHours * 60));
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  if (ageHours < 24) {
    const hours = Math.floor(ageHours);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  const days = Math.floor(ageHours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export default function TrendingPage({
  posts = [],
  onBack,
  onOpenPost,
  onFilterTag,
}) {
  const trendingTags = useMemo(() => getTrendingTags(posts), [posts]);
  const trendingPosts = useMemo(() => getTrendingPosts(posts), [posts]);
  const hasTrendingContent = trendingTags.length > 0 || trendingPosts.length > 0;

  return (
    <section
      className="trending-page resource-page animate-fade-in"
      aria-labelledby="trending-page-title"
    >
      <button type="button" onClick={onBack} className="page-back-button">
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Back to feed
      </button>

      <header className="resource-page-hero trending-page-hero">
        <span className="resource-page-hero-icon" aria-hidden="true">
          <TrendingUp size={25} strokeWidth={1.9} />
        </span>

        <div>
          <p className="resource-page-eyebrow">Community activity</p>
          <h1 id="trending-page-title">Trending This Week</h1>
          <p>
            Explore the tags and student conversations receiving the most activity across
            OwlNet.
          </p>
        </div>
      </header>

      {!hasTrendingContent ? (
        <div className="trending-page-empty resource-page-empty" role="status">
          <TrendingUp size={28} strokeWidth={1.8} aria-hidden="true" />
          <h2>No trending discussions yet</h2>
          <p>
            Topics will appear here as students post, vote, and take part in conversations.
          </p>
        </div>
      ) : (
        <div className="trending-page-layout">
          <section
            className="trending-page-topics resource-page-panel"
            aria-labelledby="trending-topics-title"
          >
            <div className="trending-page-section-heading">
              <div>
                <p className="resource-page-eyebrow">Popular subjects</p>
                <h2 id="trending-topics-title">Top topics</h2>
              </div>
              <Hash size={19} strokeWidth={2} aria-hidden="true" />
            </div>

            {trendingTags.length > 0 ? (
              <div className="trending-page-tag-list">
                {trendingTags.map((tagItem) => {
                  return (
                    <button
                      key={tagItem.tag}
                      type="button"
                      className="trending-page-tag-button"
                      onClick={() => onFilterTag?.(tagItem.tag)}
                      aria-label={`Show posts tagged ${tagItem.tag}`}
                    >
                      <span>#{tagItem.tag}</span>
                      <small>
                        {tagItem.count} {tagItem.count === 1 ? 'post' : 'posts'}
                      </small>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="trending-page-section-empty">
                Tags will appear once more discussions are posted.
              </p>
            )}
          </section>

          <section className="trending-page-posts" aria-labelledby="trending-posts-title">
            <div className="trending-page-posts-heading">
              <div>
                <p className="resource-page-eyebrow">Active conversations</p>
                <h2 id="trending-posts-title">Trending discussions</h2>
              </div>
              <Flame size={20} strokeWidth={2} aria-hidden="true" />
            </div>

            {trendingPosts.length > 0 ? (
              <div className="trending-page-post-list">
                {trendingPosts.map((post) => {
                  const activity = getPostActivity(post);
                  const author = getPostAuthor(post);
                  const timeLabel = getPostTimeLabel(post, activity.ageHours);

                  return (
                    <button
                      key={post.id}
                      type="button"
                      className="trending-page-post-card"
                      onClick={() => onOpenPost?.(post.id)}
                    >
                      <span className="trending-page-post-meta">
                        <span>
                          <UserRound size={14} strokeWidth={2} aria-hidden="true" />
                          {author}
                        </span>

                        {timeLabel && (
                          <span>
                            <Clock3 size={14} strokeWidth={2} aria-hidden="true" />
                            {timeLabel}
                          </span>
                        )}
                      </span>

                      <strong className="trending-page-post-title">{post.title}</strong>

                      {getPostExcerpt(post) && (
                        <span className="trending-page-post-excerpt">
                          {getPostExcerpt(post)}
                        </span>
                      )}

                      <span className="trending-page-post-footer">
                        <span className="trending-page-post-tags">
                          {(post.tags || []).slice(0, 3).map((tag) => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </span>

                        <span className="trending-page-post-metrics">
                          <span>
                            <TrendingUp size={14} strokeWidth={2} aria-hidden="true" />
                            {activity.votes} votes
                          </span>
                          <span>
                            <MessageSquare size={14} strokeWidth={2} aria-hidden="true" />
                            {activity.comments} comments
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="trending-page-section-empty">
                <p>No individual discussions have enough activity to rank yet.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
