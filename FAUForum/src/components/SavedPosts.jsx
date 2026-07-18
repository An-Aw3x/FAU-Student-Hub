import { useEffect, useState } from 'react';
import PostCard from './PostCard';

const POSTS_PER_LOAD = 10;

export default function SavedPosts({ onBack }) {
  const [savedPosts, setSavedPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSaved, setTotalSaved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const loadSavedPosts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `http://localhost:3001/api/saved-posts?page=1&limit=${POSTS_PER_LOAD}`
      );

      if (!response.ok) {
        throw new Error('Could not load saved posts.');
      }

      const data = await response.json();

      setSavedPosts(data.posts || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setTotalSaved(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    const nextPage = page + 1;

    try {
      setLoadingMore(true);
      setError('');

      const response = await fetch(
        `http://localhost:3001/api/saved-posts?page=${nextPage}&limit=${POSTS_PER_LOAD}`
      );

      if (!response.ok) {
        throw new Error('Could not load more saved posts.');
      }

      const data = await response.json();

      setSavedPosts(prev => [...prev, ...(data.posts || [])]);
      setPage(data.page || nextPage);
      setTotalPages(data.totalPages || 1);
      setTotalSaved(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadSavedPosts();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1
            className="font-display font-bold text-xl"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Saved Posts
          </h1>

          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {totalSaved} saved post{totalSaved === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadSavedPosts} className="vote-btn">
            Refresh
          </button>

          <button onClick={onBack} className="vote-btn">
            Back to Feed
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading saved posts...
        </p>
      )}

      {error && (
        <p className="text-sm" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}

      {!loading && !error && savedPosts.length === 0 && (
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          No saved posts yet. Save a post from the feed and it will appear here.
        </div>
      )}

      {!loading && savedPosts.length > 0 && (
        <>
          <div className="flex flex-col gap-4">
            {savedPosts.map(post => (
              <PostCard
                key={`saved-${post.id}`}
                post={post}
                aiSummaryEnabled={false}
              />
            ))}
          </div>

          {page < totalPages && (
            <div className="flex justify-center mt-5">
              <button
                type="button"
                onClick={loadMorePosts}
                disabled={loadingMore}
                className="vote-btn disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}