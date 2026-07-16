import { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar       from './components/Navbar';
import LeftSidebar  from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import PostCard     from './components/PostCard';
import CreatePost   from './components/CreatePost';
import { MOCK_POSTS, CURRENT_USER, LOGGED_IN_USER } from './data/mockData';
import './index.css';

export default function App() {
  // ── Auth state ──────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const currentUser = isLoggedIn ? LOGGED_IN_USER : CURRENT_USER;

  // ── UI state ────────────────────────────────────────────
  const [mobileMenuOpen,    setMobileMenuOpen]    = useState(false);
  const [aiSummaryEnabled,  setAiSummaryEnabled]  = useState(false);
  const [activeTag,         setActiveTag]         = useState('all');
  const [searchQuery,       setSearchQuery]       = useState('');
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);
  const [theme, setTheme] = useState("light");

  // ── Posts state (live from DB) ──────────────────────────
  const [dbPosts, setDbPosts] = useState([]);

  // Fetch posts from the backend on mount
  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(posts => setDbPosts(posts))
      .catch(err => console.warn('Backend unavailable, using mock data only:', err));
  }, []);

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

    // Tag filter
    if (activeTag !== 'all') {
      posts = posts.filter(p => (p.tags || []).includes(activeTag));
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.body || p.content || '').toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.includes(q)) ||
        (p.user?.name || p.username || '').toLowerCase().includes(q)
      );
    }

    // Pinned posts first
    return [...posts].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [allPosts, activeTag, searchQuery]);

  const handleTagChange = (tagId) => {
    setActiveTag(tagId);
    setMobileMenuOpen(false); // close sidebar on mobile after tag pick
  };

  const handleAuthToggle = () => {
    setIsLoggedIn(p => !p);
    setLoginPromptVisible(false);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const handleLoginPrompt = () => {
    setLoginPromptVisible(true);
    setTimeout(() => setLoginPromptVisible(false), 4000);
  };

  return (
    <div
      className={`min-h-screen ${theme}`}
      style={{ backgroundColor: 'var(--color-surface)' }}>

      {/* ── Navbar (fixed top) ──────────────────────────── */}
      <Navbar
        theme={theme}
        onThemeToggle={toggleTheme}
        isLoggedIn={isLoggedIn}
        onAuthToggle={handleAuthToggle}
        onMenuToggle={() => setMobileMenuOpen(p => !p)}
        mobileMenuOpen={mobileMenuOpen}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
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

      {/* ── Login Prompt Toast ───────────────────────────── */}
      {loginPromptVisible && (
        <div
          id="login-toast"
          role="alert"
          aria-live="polite"
          className="fixed top-20 left-1/2 z-50 animate-slide-down px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl"
          style={{
            transform: 'translateX(-50%)',
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-accent)',
            color: 'var(--color-accent-light)',
          }}
        >
          🔐 Please log in to post or comment — click <strong>Sign Up</strong> to demo!
        </div>
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

        {/* ── Main Feed ─────────────────────────────────── */}
        <main
          id="main-feed"
          className="flex-1 min-w-0 px-4 py-6 lg:px-6"
          aria-label="Community feed"
        >
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
            {aiSummaryEnabled && (
              <span
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse-glow"
                style={{
                  background: 'rgba(212,175,55,0.12)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  color: 'var(--color-accent)',
                }}
              >
                ✨ AI Summaries Active
              </span>
            )}
          </div>

          {/* Create Post */}
          <div className="mb-5">
            <CreatePost
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              currentUserAvatar={currentUser.avatar}
              onLoginPrompt={handleLoginPrompt}
              onPostCreated={handlePostCreated}
            />
          </div>

          {/* Post Feed */}
          {filteredPosts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filteredPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  aiSummaryEnabled={aiSummaryEnabled}
                />
              ))}
            </div>
          ) : (
            /* Empty state */
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
        </main>

        {/* Right Sidebar */}
        <div className="py-6 pr-4 hidden xl:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
