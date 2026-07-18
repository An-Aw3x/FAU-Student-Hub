import { useEffect, useState } from 'react';

export default function SavedPosts({ onBack }) {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSavedPosts() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('http://localhost:3001/api/saved-posts');

        if (!response.ok) {
          throw new Error('Could not load saved posts.');
        }

        const data = await response.json();
        setSavedPosts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadSavedPosts();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
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
            Posts you bookmarked will show up here.
          </p>
        </div>

        <button
          onClick={onBack}
          className="vote-btn"
        >
          Back to Feed
        </button>
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

      <div className="flex flex-col gap-4">
        {savedPosts.map(post => (
          <article
            key={post.id}
            className="post-card p-5 animate-fade-in"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {post.username || 'Anonymous'}
              </span>

              <span
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                · {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'just now'}
              </span>
            </div>

            <h2
              className="font-display font-bold text-base mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {post.title}
            </h2>

            <p
              className="text-sm leading-relaxed mb-3"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {post.content}
            </p>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="tag-chip">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}