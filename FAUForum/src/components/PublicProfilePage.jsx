export default function PublicProfilePage({ profile, posts = [], onBack }) {
  const username = profile?.username || profile?.name || 'Unknown User';
  const handle = profile?.handle || `@${username.toLowerCase().replace(/\s+/g, '_')}`;

  const userPosts = posts.filter((post) => {
    const postUser = post.username || post.author || post.name;
    return postUser === username;
  });

  return (
    <section className="max-w-3xl mx-auto animate-fade-in">
      <button type="button" onClick={onBack} className="vote-btn mb-5">
        Back to Feed
      </button>

      <div
        className="rounded-3xl overflow-hidden mb-6"
        style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          className="h-32"
          style={{
            background: 'linear-gradient(135deg, var(--color-owl-blue), var(--color-owl-blue-light))',
          }}
        />

        <div className="p-6 pt-0">
          <img
            src={profile?.avatar}
            alt={username}
            className="w-24 h-24 rounded-full border-4 -mt-12 mb-3"
            style={{ borderColor: 'var(--color-surface-2)' }}
          />

          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--color-text-primary)' }}>
            {username}
          </h1>

          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {handle}
          </p>

          <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
            {profile?.bio || 'OwlNet community member.'}
          </p>

          <div className="flex gap-3">
            <div className="vote-btn">
              {userPosts.length} Posts
            </div>

            <div className="vote-btn">
              Public Profile
            </div>
          </div>
        </div>
      </div>

      <h2 className="font-display font-bold text-xl mb-4" style={{ color: 'var(--color-text-primary)' }}>
        Posts by {username}
      </h2>

      {userPosts.length === 0 ? (
        <div
          className="rounded-2xl p-5 text-sm"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          No posts found for this user yet.
        </div>
      ) : (
        <div className="space-y-3">
          {userPosts.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl p-4"
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h3 className="font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {post.title}
              </h3>

              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {post.content || post.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}