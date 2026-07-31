import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bookmark, ChevronLeft, RefreshCw, X } from 'lucide-react';
import PostCard from './PostCard';

const API_BASE = 'http://localhost:3001';
const POSTS_PER_LOAD = 10;

function getPostKey(post) {
  return String(post.id);
}

function mergeUniquePosts(...postGroups) {
  const seenPostIds = new Set();

  return postGroups.flat().filter(post => {
    if (!post?.id) return false;

    const postId = getPostKey(post);
    if (seenPostIds.has(postId)) return false;

    seenPostIds.add(postId);
    return true;
  });
}

async function fetchSavedPage(page, username) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(POSTS_PER_LOAD),
    username,
  });
  const response = await fetch(`${API_BASE}/api/saved-posts?${query}`);

  if (!response.ok) {
    throw new Error(
      page === 1 ? 'Could not load saved posts.' : 'Could not load more saved posts.'
    );
  }

  return response.json();
}

export default function SavedPosts({
  onBack,
  username = 'Anonymous',
  localSavedPosts = [],
  isAdmin = false,
  onViewProfile,
  onSavedChange,
  onActivity,
}) {
  const [apiSavedPosts, setApiSavedPosts] = useState([]);
  const [removedPostIds, setRemovedPostIds] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [apiTotal, setApiTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [removingPostId, setRemovingPostId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignoreResult = false;

    fetchSavedPage(1, username)
      .then(data => {
        if (ignoreResult) return;

        setApiSavedPosts(data.posts || []);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        setApiTotal(data.total || 0);
      })
      .catch(fetchError => {
        if (!ignoreResult) {
          setError(fetchError.message);
        }
      })
      .finally(() => {
        if (!ignoreResult) {
          setLoading(false);
        }
      });

    return () => {
      ignoreResult = true;
    };
  }, [username]);

  const apiPostIds = useMemo(
    () => new Set(apiSavedPosts.map(getPostKey)),
    [apiSavedPosts]
  );

  const visibleLocalPosts = useMemo(
    () =>
      localSavedPosts.filter(
        post =>
          post?.id &&
          !removedPostIds.has(getPostKey(post)) &&
          !apiPostIds.has(getPostKey(post))
      ),
    [apiPostIds, localSavedPosts, removedPostIds]
  );

  const visibleApiPosts = useMemo(
    () => apiSavedPosts.filter(post => !removedPostIds.has(getPostKey(post))),
    [apiSavedPosts, removedPostIds]
  );

  const displayedPosts = useMemo(
    () => mergeUniquePosts(visibleApiPosts, visibleLocalPosts),
    [visibleApiPosts, visibleLocalPosts]
  );

  const displayedTotal = apiTotal + visibleLocalPosts.length;

  const refreshSavedPosts = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await fetchSavedPage(1, username);

      setApiSavedPosts(data.posts || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setApiTotal(data.total || 0);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    const nextPage = page + 1;

    try {
      setLoadingMore(true);
      setError('');

      const data = await fetchSavedPage(nextPage, username);

      setApiSavedPosts(previousPosts =>
        mergeUniquePosts(previousPosts, data.posts || [])
      );
      setPage(data.page || nextPage);
      setTotalPages(data.totalPages || 1);
      setApiTotal(data.total || 0);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const removeSavedPost = async (post) => {
    const postId = getPostKey(post);
    const isApiPost = apiPostIds.has(postId);

    setRemovingPostId(postId);
    setError('');
    setRemovedPostIds(previousIds => new Set(previousIds).add(postId));

    if (isApiPost) {
      setApiTotal(previousTotal => Math.max(0, previousTotal - 1));
    }

    const activity = {
      type: 'saved-post-removed',
      post,
      postId: post.id,
      saved: false,
      source: isApiPost ? 'api' : 'local',
    };

    onSavedChange?.(activity);
    onActivity?.(activity);

    if (!isApiPost) {
      setRemovingPostId(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/posts/${post.id}/save`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error('Could not remove this saved post.');
      }
    } catch (removeError) {
      setRemovedPostIds(previousIds => {
        const restoredIds = new Set(previousIds);
        restoredIds.delete(postId);
        return restoredIds;
      });
      setApiTotal(previousTotal => previousTotal + 1);
      setError(removeError.message);

      const rollbackActivity = {
        ...activity,
        type: 'saved-post-remove-failed',
        saved: true,
      };

      onSavedChange?.(rollbackActivity);
      onActivity?.(rollbackActivity);
    } finally {
      setRemovingPostId(null);
    }
  };

  return (
    <section className="saved-posts-page mx-auto max-w-3xl" aria-labelledby="saved-posts-title">
      <header className="saved-posts-header">
        <button type="button" onClick={onBack} className="page-back-button">
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
          Back to feed
        </button>

        <div className="saved-posts-heading-row flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-eyebrow">Your library</p>
            <h1 id="saved-posts-title" className="saved-posts-title">
              Saved Posts
            </h1>
            <p className="saved-posts-count mt-1 text-sm" aria-live="polite">
              {displayedTotal} saved {displayedTotal === 1 ? 'post' : 'posts'}
            </p>
          </div>

          <button
            type="button"
            onClick={refreshSavedPosts}
            disabled={loading || loadingMore}
            className="button-secondary button-compact saved-posts-refresh"
          >
            <RefreshCw
              className={loading ? 'animate-spin' : ''}
              size={15}
              strokeWidth={2}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
      </header>

      {loading && displayedPosts.length === 0 && (
        <div className="saved-posts-status" role="status">
          <RefreshCw className="animate-spin" size={20} strokeWidth={2} aria-hidden="true" />
          <div>
            <p className="saved-posts-status-title">Loading saved posts</p>
            <p className="saved-posts-status-copy">Retrieving your saved discussions.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="saved-posts-alert" role="alert">
          <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
          <div>
            <p className="saved-posts-alert-title">Saved posts need attention</p>
            <p className="saved-posts-alert-copy">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && displayedPosts.length === 0 && (
        <div className="saved-posts-empty">
          <Bookmark size={24} strokeWidth={1.8} aria-hidden="true" />
          <h2>No saved posts yet</h2>
          <p>Save useful discussions from the feed and they will appear here.</p>
          <button type="button" onClick={onBack} className="button-primary button-compact">
            Browse the feed
          </button>
        </div>
      )}

      {displayedPosts.length > 0 && (
        <>
          <div className="saved-posts-list" aria-label="Saved posts">
            {displayedPosts.map(post => {
              const postId = getPostKey(post);

              return (
                // This view owns removal so the card and count update together.
                <div
                  key={`saved-${postId}`}
                  className="saved-post-item [&_.post-save-action]:hidden"
                >
                  <div className="saved-post-item-toolbar">
                    <span className="saved-post-item-label">
                      <Bookmark size={14} fill="currentColor" aria-hidden="true" />
                      Saved post
                    </span>
                    <button
                      type="button"
                      className="saved-post-remove"
                      onClick={() => removeSavedPost(post)}
                      disabled={removingPostId !== null}
                      aria-label={`Remove "${post.title}" from saved posts`}
                    >
                      <X size={14} strokeWidth={2} aria-hidden="true" />
                      {removingPostId === postId ? 'Removing' : 'Remove'}
                    </button>
                  </div>

                  <PostCard
                    post={post}
                    aiSummaryEnabled={false}
                    isAdmin={isAdmin}
                    onViewProfile={onViewProfile}
                    isLocallySaved={!apiPostIds.has(postId)}
                    onSavedChange={onSavedChange}
                    onActivity={onActivity}
                  />
                </div>
              );
            })}
          </div>

          {page < totalPages && (
            <div className="saved-posts-load-more">
              <button
                type="button"
                onClick={loadMorePosts}
                disabled={loadingMore}
                className="button-secondary"
              >
                {loadingMore && (
                  <RefreshCw
                    className="animate-spin"
                    size={15}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                )}
                {loadingMore ? 'Loading more' : 'Load more saved posts'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
