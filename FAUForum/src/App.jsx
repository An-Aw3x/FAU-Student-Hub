import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar       from './components/Navbar';
import LeftSidebar  from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import PostCard     from './components/PostCard';
import CreatePost   from './components/CreatePost';
import SavedPosts   from './components/SavedPosts';
import AdminReports from './components/AdminReports';
import RegisterPage from './components/RegisterPage';
import LoginPage    from './components/LoginPage';
import ProfilePage  from './components/ProfilePage';
import { MOCK_POSTS } from './data/mockData';
import './index.css';

export default function App() {
  // ── Auth from context ──────────────────────────────────
  const { user, isLoggedIn, loading } = useAuth();

  // Admin check: you can expand this to check a role field later
  const isAdmin = isLoggedIn && user?.email === 'admin@fau.edu';

  // ── UI state ────────────────────────────────────────────
  const [mobileMenuOpen,    setMobileMenuOpen]    = useState(false);
  const [aiSummaryEnabled,  setAiSummaryEnabled]  = useState(false);
  const [activeTag,         setActiveTag]         = useState('all');
  const [searchQuery,       setSearchQuery]       = useState('');
  const [sortMode, setSortMode] = useState('hot');
  const [theme, setTheme] = useState("light");
  // 'feed' | 'saved' | 'admin' | 'profile' | 'login' | 'register'
  const [activeView, setActiveView] = useState('feed');

  // ── Posts state (live from DB) ──────────────────────────
  const [dbPosts, setDbPosts] = useState([]);

  // Fetch posts from the backend on mount (only when logged in)
  useEffect(() => {
    if (!isLoggedIn) return;

    fetch('/api/posts')
      .then(res => res.json())
      .then(posts => setDbPosts(posts))
      .catch(err => console.warn('Backend unavailable, using mock data only:', err));
  }, [isLoggedIn]);

  // Callback for CreatePost — prepend new post to the live feed
  const handlePostCreated = useCallback((newPost) => {
    setDbPosts(prev => [newPost, ...prev]);
  }, []);

  // Merge DB posts on top, then mock posts as seed content
  const allPosts = useMemo(() => {
    return [...dbPosts, ...MOCK_POSTS];
  }, [dbPosts]);

  // ── Filtered feed ───────────────────────────────────────
  const filteredPosts = useMemo(() => {
    let posts = allPosts;

    if (activeTag !== 'all') {
      posts = posts.filter(p => (p.tags || []).includes(activeTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.body || p.content || '').toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.includes(q)) ||
        (p.user?.name || p.username || '').toLowerCase().includes(q)
      );
    }

    return [...posts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const getTime = (post) => {
        if (!post.created_at) return 0;
        return new Date(post.created_at).getTime();
      };

      const getScore = (post) => {
        return (post.upvotes || 0) - (post.downvotes || 0);
      };

      const getHotScore = (post) => {
        const score = getScore(post);
        const time = getTime(post);

        if (!time) return score;

        const ageHours = Math.max(0, (Date.now() - time) / 3600000);
        const recencyBoost = Math.max(0, 24 - ageHours) / 6;

        return score + recencyBoost;
      };

      if (sortMode === 'new') {
        return getTime(b) - getTime(a);
      }

      if (sortMode === 'top') {
        const scoreDifference = getScore(b) - getScore(a);
        if (scoreDifference !== 0) return scoreDifference;

        return getTime(b) - getTime(a);
      }

      const hotDifference = getHotScore(b) - getHotScore(a);
      if (hotDifference !== 0) return hotDifference;

      return getTime(b) - getTime(a);
    });
  }, [allPosts, activeTag, searchQuery, sortMode]);

  const handleTagChange = (tagId) => {
    setActiveTag(tagId);
    setActiveView('feed');
    setMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const handleOpenPostFromAdmin = (postId) => {
    setActiveTag('all');
    setSearchQuery('');
    setActiveView('feed');

    setTimeout(() => {
      const postElement = document.getElementById(`post-${postId}`);

      if (postElement) {
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const oldShadow = postElement.style.boxShadow;
        postElement.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.35)';

        setTimeout(() => {
          postElement.style.boxShadow = oldShadow;
        }, 2000);
      }
    }, 150);
  };

  const handlePostDeletedFromAdmin = (postId) => {
    setDbPosts(prev => prev.filter(post => Number(post.id) !== Number(postId)));
  };

  // ── Loading state ─────────────────────────────────────
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme}`}
        style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4">🦉</div>
          <p className="font-display font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            Loading OwlNet...
          </p>
        </div>
      </div>
    );
  }

  // ── Not logged in: show auth pages ────────────────────
  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${theme}`} style={{ backgroundColor: 'var(--color-surface)' }}>
        {activeView === 'login' || activeView === 'feed' ? (
          <LoginPage onSwitchToRegister={() => setActiveView('register')} />
        ) : (
          <RegisterPage onSwitchToLogin={() => setActiveView('login')} />
        )}

        {/* Theme toggle in corner */}
        <div className="fixed bottom-4 right-4 z-50">
          <label className="toggle-switch" title="Toggle theme">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={toggleTheme}
              aria-label="Toggle dark mode"
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    );
  }

  // ── Logged in: show full app ──────────────────────────
  return (
    <div
      className={`min-h-screen ${theme}`}
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      {/* ── Navbar ──────────────────────────── */}
      <Navbar
        theme={theme}
        onThemeToggle={toggleTheme}
        onMenuToggle={() => setMobileMenuOpen(p => !p)}
        mobileMenuOpen={mobileMenuOpen}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        onNavigateProfile={() => setActiveView('profile')}
        onNavigateFeed={() => { setActiveView('feed'); setActiveTag('all'); }}
      />

      {/* ── Mobile Sidebar Backdrop ─────────────────────── */}
      {mobileMenuOpen && (
        <div
          id="sidebar-backdrop"
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Page Layout ─────────────────────────────────── */}
      <div className="pt-16 max-w-screen-xl mx-auto flex">

        {/* Left Sidebar */}
        <LeftSidebar
          activeTag={activeTag}
          onTagChange={handleTagChange}
          aiSummaryEnabled={aiSummaryEnabled}
          onAiToggle={() => setAiSummaryEnabled(p => !p)}
          mobileOpen={mobileMenuOpen}
        />

        {/* ── Main Area ─────────────────────────────────── */}
        <main
          id="main-feed"
          className="flex-1 min-w-0 px-4 py-6 lg:px-6"
          aria-label="Community feed"
        >
          {activeView === 'profile' ? (
            <ProfilePage
              onBack={() => setActiveView('feed')}
            />
          ) : activeView === 'saved' ? (
            <SavedPosts
              isAdmin={isAdmin}
              onBack={() => setActiveView('feed')}
            />
          ) : activeView === 'admin' ? (
            <AdminReports
              isAdmin={isAdmin}
              onBack={() => setActiveView('feed')}
              onOpenPost={handleOpenPostFromAdmin}
              onPostDeleted={handlePostDeletedFromAdmin}
            />
          ) : (
            <>
              {/* Feed Header */}
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--color-text-primary)' }}>
                    {activeTag === 'all' ? '🏠 Community Forum' : `#${activeTag}`}
                  </h1>

                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
                    {searchQuery ? ` matching "${searchQuery}"` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {['hot', 'new', 'top'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSortMode(mode)}
                        className={`vote-btn ${sortMode === mode ? 'upvoted' : ''}`}
                      >
                        {mode === 'hot' ? 'Hot 🔥' : mode === 'new' ? 'New' : 'Top'}
                      </button>
                    ))}
                  </div>

                  {aiSummaryEnabled && (
                    <span
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{
                        background: 'rgba(153, 200, 238, 0.12)',
                        border: '1px solid rgba(115, 114, 201, 0.14)',
                        color: 'var(--color-accent-light)',
                      }}
                    >
                      ✨ AI Features Enabled
                    </span>
                  )}

                  <button
                    onClick={() => setActiveView('saved')}
                    className="vote-btn"
                    aria-label="View saved posts"
                  >
                    🔖 Saved Posts
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setActiveView('admin')}
                      className="vote-btn"
                      aria-label="View admin reports"
                    >
                      🛡️ Admin Reports
                    </button>
                  )}
                </div>
              </div>

              {/* Create Post */}
              <div className="mb-5">
                <CreatePost
                  onPostCreated={handlePostCreated}
                />
              </div>

              {/* Post Feed */}
              {filteredPosts.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {filteredPosts.map(post => (
                    <PostCard
                      key={post.created_at ? `db-${post.id}` : `mock-${post.id}`}
                      post={post}
                      aiSummaryEnabled={aiSummaryEnabled}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center animate-fade-in">
                  <div className="text-5xl mb-4">🦉</div>

                  <h2 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    No posts found
                  </h2>

                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {searchQuery
                      ? `No results for "${searchQuery}". Try a different search.`
                      : 'Be the first to post in this topic!'}
                  </p>
                </div>
              )}
            </>
          )}
        </main>

        {/* Right Sidebar */}
        <div className="py-6 pr-4 hidden xl:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}