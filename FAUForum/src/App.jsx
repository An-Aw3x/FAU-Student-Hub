import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Bookmark, PenLine, SearchX, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import PostCard from './components/PostCard';
import CreatePost from './components/CreatePost';
import SavedPosts from './components/SavedPosts';
import AdminReports from './components/AdminReports';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import PublicProfilePage from './components/PublicProfilePage';
import CommunityPage from './components/CommunityPage';
import CoursesPage from './components/CoursesPage';
import CourseDetailPage from './components/CourseDetailPage';
import CommunityGuidelinesPage from './components/CommunityGuidelinesPage';
import TrendingPage from './components/TrendingPage';
import StudentWikiPage from './components/StudentWikiPage';
import TermsPage from './components/TermsPage';
import SearchResultsPage from './components/SearchResultsPage';
import { MOCK_COURSES, MOCK_POSTS } from './data/mockData';
import './index.css';

const SORT_MODES = ['hot', 'new', 'top'];
const API_BASE = 'http://localhost:3001';

function getPostTime(post) {
  if (!post.created_at) return 0;
  return new Date(post.created_at).getTime();
}

function getPostScore(post) {
  return (post.upvotes || 0) - (post.downvotes || 0);
}

function getHotScore(post) {
  const score = getPostScore(post);
  const time = getPostTime(post);

  if (!time) return score;

  const ageHours = Math.max(0, (Date.now() - time) / 3600000);
  const recencyBoost = Math.max(0, 24 - ageHours) / 6;

  return score + recencyBoost;
}

export default function App() {
  const { user, isLoggedIn, loading } = useAuth();
  const currentUserEmail = user?.email || '';
  const isAdmin =
    isLoggedIn && (user?.isAdmin === true || Number(user?.is_admin) === 1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(false);
  const [activeTag, setActiveTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('hot');
  const [theme, setTheme] = useState('light');
  const [activeView, setActiveView] = useState('feed');
  const [databasePosts, setDatabasePosts] = useState([]);
  const [authModalView, setAuthModalView] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [coursePostContext, setCoursePostContext] = useState(null);
  const [notificationState, setNotificationState] = useState({
    ownerEmail: '',
    items: [],
  });
  const [localSavedByUser, setLocalSavedByUser] = useState({});
  const handledPostHash = useRef('');

  useEffect(() => {
    const usernameQuery = user?.username
      ? `?username=${encodeURIComponent(user.username.trim())}`
      : '';

    fetch(`${API_BASE}/api/posts${usernameQuery}`)
      .then(response => response.json())
      .then(posts => setDatabasePosts(posts))
      .catch((error) => {
        console.error('Could not load posts:', error);
      });
  }, [isLoggedIn, user?.username]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');

    return () => document.documentElement.classList.remove('dark');
  }, [theme]);

  const addLocalNotification = useCallback((notification) => {
    if (!currentUserEmail) return;

    const nextNotification = {
      ...notification,
      id:
        notification.id ||
        `${notification.type || 'activity'}-${notification.postId || 'general'}-${Date.now()}`,
      timeLabel: notification.timeLabel || 'Just now',
      read: false,
    };

    setNotificationState(previousState => ({
      ownerEmail: currentUserEmail,
      items: [
        nextNotification,
        ...(previousState.ownerEmail === currentUserEmail ? previousState.items : []),
      ].slice(0, 10),
    }));
  }, [currentUserEmail]);

  const handlePostCreated = useCallback((newPost) => {
    setDatabasePosts(previousPosts => [newPost, ...previousPosts]);
    addLocalNotification({
      type: 'post',
      title: 'Post published',
      message: newPost.title,
      postId: newPost.id,
    });
  }, [addLocalNotification]);

  const allPosts = useMemo(() => {
    return [...databasePosts, ...MOCK_POSTS];
  }, [databasePosts]);

  const localSavedPostIds = useMemo(
    () => localSavedByUser[currentUserEmail] || [],
    [currentUserEmail, localSavedByUser]
  );
  const localSavedPosts = useMemo(
    () => MOCK_POSTS.filter(post => localSavedPostIds.includes(String(post.id))),
    [localSavedPostIds]
  );
  const notifications =
    isLoggedIn && notificationState.ownerEmail === currentUserEmail
      ? notificationState.items
      : [];

  const selectedCourse =
    MOCK_COURSES.find(course => course.id === selectedCourseId) || null;

  const filteredPosts = useMemo(() => {
    let posts = allPosts;

    if (activeTag !== 'all') {
      const normalizedTag = activeTag.toLowerCase();
      posts = posts.filter(post =>
        (post.tags || []).some(tag => String(tag).toLowerCase() === normalizedTag)
      );
    }

    return [...posts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortMode === 'new') {
        return getPostTime(b) - getPostTime(a);
      }

      if (sortMode === 'top') {
        const scoreDifference = getPostScore(b) - getPostScore(a);
        if (scoreDifference !== 0) return scoreDifference;

        return getPostTime(b) - getPostTime(a);
      }

      const hotDifference = getHotScore(b) - getHotScore(a);
      if (hotDifference !== 0) return hotDifference;

      return getPostTime(b) - getPostTime(a);
    });
  }, [allPosts, activeTag, sortMode]);

  const handleTagChange = (tagId) => {
    setActiveTag(tagId);
    setSearchQuery('');
    setActiveView('feed');
    setCoursePostContext(null);
    setMobileMenuOpen(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!isLoggedIn) return;

    if (query.trim()) {
      setActiveTag('all');
      setActiveView('search');
      setCoursePostContext(null);
      setMobileMenuOpen(false);
    } else if (activeView === 'search') {
      setActiveView('feed');
    }
  };

  const toggleTheme = () => {
    setTheme(previousTheme => (previousTheme === 'light' ? 'dark' : 'light'));
  };

  const handleViewProfile = (profile) => {
    setSearchQuery('');
    setSelectedProfile(profile);
    setActiveView('publicProfile');
  };

  const handleOpenCommunityTopic = (tagId) => {
    setActiveTag(tagId);
    setSearchQuery('');
    setActiveView('feed');
    setCoursePostContext(null);
  };

  const handleReturnToFeed = () => {
    setSearchQuery('');
    setActiveView('feed');
    setCoursePostContext(null);
  };

  const handleSortChange = (mode) => {
    if (!SORT_MODES.includes(mode)) return;

    setSortMode(mode);
    setMobileMenuOpen(false);

    if (isLoggedIn) {
      handleReturnToFeed();
    }
  };

  const handleNavigateFeed = () => {
    setActiveTag('all');
    setMobileMenuOpen(false);
    handleReturnToFeed();
  };

  const handleOpenCourses = () => {
    setMobileMenuOpen(false);
    setCoursePostContext(null);

    if (!isLoggedIn) {
      setAuthModalView('login');
      return;
    }

    setActiveView('courses');
  };

  const handleOpenCommunityResource = (view) => {
    setMobileMenuOpen(false);
    setCoursePostContext(null);

    if (!isLoggedIn && view === 'trending') {
      setAuthModalView('login');
      return;
    }

    setActiveView(view);
  };

  const handleOpenCourse = (course) => {
    setSelectedCourseId(course.id);
    setActiveView('courseDetail');
  };

  const handleCreateCoursePost = (course) => {
    const courseTag = course.tags?.[0] || course.code.toLowerCase();

    setCoursePostContext({
      id: course.id,
      code: course.code,
      tags: [courseTag],
    });
    setActiveTag(courseTag);
    setSearchQuery('');
    setActiveView('feed');

    setTimeout(() => {
      document.getElementById('post-title-input')?.focus();
    }, 50);
  };

  const handleOpenPost = useCallback((postId) => {
    if (!isLoggedIn) {
      setAuthModalView('login');
      return;
    }

    setActiveTag('all');
    setSearchQuery('');
    setActiveView('feed');
    setCoursePostContext(null);
    setMobileMenuOpen(false);

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
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !window.location.hash.startsWith('#post-')) return;

    const postHash = window.location.hash;
    const postId = decodeURIComponent(postHash.slice('#post-'.length));
    const postExists = allPosts.some(post => String(post.id) === postId);

    if (!postExists || handledPostHash.current === postHash) return;

    handledPostHash.current = postHash;
    handleOpenPost(postId);
  }, [allPosts, handleOpenPost, isLoggedIn]);

  const handleFilterTrendingTag = (tagId) => {
    if (!isLoggedIn) {
      setAuthModalView('login');
      return;
    }

    setSearchQuery('');
    handleTagChange(tagId);
  };

  const handleSavedChange = useCallback((post, saved) => {
    if (post.created_at || !currentUserEmail) return;

    const postId = String(post.id);

    setLocalSavedByUser(previousSavedByUser => {
      const savedIds = previousSavedByUser[currentUserEmail] || [];
      const nextSavedIds = saved
        ? [...new Set([...savedIds, postId])]
        : savedIds.filter(savedId => savedId !== postId);

      return {
        ...previousSavedByUser,
        [currentUserEmail]: nextSavedIds,
      };
    });
  }, [currentUserEmail]);

  const handleSavedPageChange = useCallback((activity) => {
    if (activity.source === 'local' && activity.post) {
      handleSavedChange(activity.post, activity.saved);
    }
  }, [handleSavedChange]);

  const handleSavedPageActivity = useCallback((activity) => {
    if (!activity.type?.startsWith('saved-post-')) {
      addLocalNotification(activity);
      return;
    }

    const removeFailed = activity.type === 'saved-post-remove-failed';

    addLocalNotification({
      type: 'saved',
      title: removeFailed ? 'Saved post restored' : 'Post removed from saved posts',
      message: activity.post?.title || 'Saved discussion',
      postId: activity.postId,
    });
  }, [addLocalNotification]);

  const handleMarkAllNotificationsRead = () => {
    setNotificationState(previousState => {
      if (previousState.ownerEmail !== currentUserEmail) return previousState;

      return {
        ...previousState,
        items: previousState.items.map(notification => ({
          ...notification,
          read: true,
        })),
      };
    });
  };

  const handleNotificationSelect = (selectedNotification) => {
    setNotificationState(previousState => {
      if (previousState.ownerEmail !== currentUserEmail) return previousState;

      return {
        ...previousState,
        items: previousState.items.map(notification =>
          notification.id === selectedNotification.id
            ? { ...notification, read: true }
            : notification
        ),
      };
    });

    if (selectedNotification.postId != null) {
      handleOpenPost(selectedNotification.postId);
    }
  };

  const handlePostDeletedFromAdmin = (postId) => {
    setDatabasePosts(previousPosts =>
      previousPosts.filter(post => Number(post.id) !== Number(postId))
    );
  };

  if (loading) {
    return (
      <div className={`app-shell min-h-screen flex items-center justify-center ${theme}`}>
        <div className="loading-state animate-fade-in">
          <img src="/fau-owl-logo.png" alt="" className="loading-logo" />
          <p className="font-display font-bold text-lg">Loading OwlNet...</p>
        </div>
      </div>
    );
  }

  const handleGuestCreatePost = () => setAuthModalView('login');

  const closeAuthModal = () => setAuthModalView(null);

  return (
    <>
      <div className={`min-h-screen app-shell ${theme}`}>
        <Navbar
          theme={theme}
          onThemeToggle={toggleTheme}
          onMenuToggle={() => setMobileMenuOpen(previous => !previous)}
          mobileMenuOpen={mobileMenuOpen}
          onSearch={isLoggedIn ? handleSearch : undefined}
          searchQuery={searchQuery}
          showFeedControls={activeView === 'feed'}
          sortMode={sortMode}
          onSortChange={isLoggedIn ? handleSortChange : undefined}
          activeCategory={activeTag}
          onCategoryChange={isLoggedIn ? handleTagChange : undefined}
          notifications={notifications}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onNotificationSelect={handleNotificationSelect}
          notificationSourceLabel="Local session activity. Email and push notifications are not enabled."
          onNavigateProfile={() => {
            setSearchQuery('');
            setActiveView('profile');
          }}
          onNavigateSettings={() => {
            setSearchQuery('');
            setActiveView('settings');
          }}
          onNavigateFeed={handleNavigateFeed}
          onShowLogin={() => setAuthModalView('login')}
          onShowRegister={() => setAuthModalView('register')}
        />

        {mobileMenuOpen && (
          <div
            id="sidebar-backdrop"
            className="sidebar-backdrop fixed inset-0 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="app-layout pt-16 max-w-screen-xl mx-auto flex">
          <LeftSidebar
            activeTag={activeTag}
            activeView={activeView}
            onTagChange={handleTagChange}
            onOpenCourses={handleOpenCourses}
            onOpenCommunityResource={handleOpenCommunityResource}
            aiSummaryEnabled={aiSummaryEnabled}
            onAiToggle={() => setAiSummaryEnabled(previous => !previous)}
            mobileOpen={mobileMenuOpen}
          />

          <main
            id="main-feed"
            className="main-feed flex-1 min-w-0 px-4 py-6 lg:px-6"
            aria-label="OwlNet content"
          >
            {activeView === 'guidelines' ? (
              <CommunityGuidelinesPage onBack={handleReturnToFeed} />
            ) : activeView === 'wiki' ? (
              <StudentWikiPage onBack={handleReturnToFeed} />
            ) : activeView === 'terms' ? (
              <TermsPage onBack={handleReturnToFeed} />
            ) : !isLoggedIn ? (
              <div className="guest-welcome max-w-xl mx-auto mt-16 text-center animate-fade-in">
                <img
                  src="/fau-owl-logo.png"
                  alt="FAU OwlNet"
                  className="w-14 h-14 mx-auto mb-4 object-contain"
                />

                <p className="section-eyebrow">FAU Student Community</p>
                <h1 className="font-display font-bold text-2xl mb-2">Welcome to OwlNet</h1>

                <p className="text-sm mb-6 guest-welcome-copy">
                  Sign in with a verified FAU email to view posts, create threads, comment, and use
                  OwlNet.
                </p>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAuthModalView('login')}
                    className="button-secondary"
                  >
                    Log In
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthModalView('register')}
                    className="button-primary"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            ) : activeView === 'courses' ? (
              <CoursesPage
                courses={MOCK_COURSES}
                onBack={handleReturnToFeed}
                onOpenCourse={handleOpenCourse}
              />
            ) : activeView === 'courseDetail' ? (
              <CourseDetailPage
                course={selectedCourse}
                posts={allPosts}
                onBack={() => setActiveView('courses')}
                onCreatePost={handleCreateCoursePost}
                onViewProfile={handleViewProfile}
                aiSummaryEnabled={aiSummaryEnabled}
                isAdmin={isAdmin}
              />
            ) : activeView === 'search' ? (
              <SearchResultsPage
                query={searchQuery}
                viewerUsername={user?.username || ''}
                isAdmin={isAdmin}
                onBack={handleReturnToFeed}
                onOpenPost={handleOpenPost}
                onViewProfile={handleViewProfile}
                onOpenTopic={handleOpenCommunityTopic}
              />
            ) : activeView === 'trending' ? (
              <TrendingPage
                posts={databasePosts}
                onBack={handleReturnToFeed}
                onOpenPost={handleOpenPost}
                onFilterTag={handleFilterTrendingTag}
              />
            ) : activeView === 'publicProfile' ? (
              <PublicProfilePage
                key={selectedProfile?.username || selectedProfile?.name || 'public-profile'}
                profile={selectedProfile}
                availablePosts={allPosts}
                onBack={handleReturnToFeed}
                onOpenPost={handleOpenPost}
                onViewProfile={handleViewProfile}
                isAdmin={isAdmin}
              />
            ) : activeView === 'community' ? (
              <CommunityPage
                posts={databasePosts}
                onBack={handleReturnToFeed}
                onOpenTopic={handleOpenCommunityTopic}
              />
            ) : activeView === 'settings' ? (
              <SettingsPage
                theme={theme}
                onThemeToggle={toggleTheme}
                onBack={handleReturnToFeed}
                onOpenProfile={() => setActiveView('profile')}
              />
            ) : activeView === 'profile' ? (
              <ProfilePage
                onBack={handleReturnToFeed}
                onOpenPost={handleOpenPost}
                onViewProfile={handleViewProfile}
                isAdmin={isAdmin}
                localSavedPosts={localSavedPosts}
                onSavedChange={handleSavedChange}
              />
            ) : activeView === 'saved' ? (
              <SavedPosts
                username={user?.username || 'Anonymous'}
                localSavedPosts={localSavedPosts}
                isAdmin={isAdmin}
                onBack={handleReturnToFeed}
                onViewProfile={handleViewProfile}
                onSavedChange={handleSavedPageChange}
                onActivity={handleSavedPageActivity}
              />
            ) : activeView === 'admin' ? (
              <AdminReports
                isAdmin={isAdmin}
                onBack={handleReturnToFeed}
                onOpenPost={handleOpenPost}
                onPostDeleted={handlePostDeletedFromAdmin}
              />
            ) : (
              <>
                <div className="feed-heading">
                  <div className="feed-heading-copy">
                    <p className="section-eyebrow">
                      {activeTag === 'all' ? 'FAU Student Community' : 'Topic discussion'}
                    </p>
                    <h1 className="font-display font-bold text-2xl">
                      {activeTag === 'all' ? 'Community Feed' : `#${activeTag}`}
                    </h1>

                    <p className="feed-count">
                      {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
                      {searchQuery ? ` matching "${searchQuery}"` : ''}
                    </p>
                  </div>

                  <div className="feed-toolbar">
                    <div className="feed-sort-control" aria-label="Sort posts">
                      {SORT_MODES.map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setSortMode(mode)}
                          className={sortMode === mode ? 'active' : ''}
                          aria-pressed={sortMode === mode}
                        >
                          {mode[0].toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>

                    {aiSummaryEnabled && (
                      <span className="feature-status">
                        <Sparkles size={14} aria-hidden="true" />
                        Summary previews on
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveView('saved')}
                      className="feed-toolbar-action"
                      aria-label="View saved posts"
                    >
                      <Bookmark size={15} aria-hidden="true" />
                      Saved
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setActiveView('admin')}
                        className="feed-toolbar-action"
                        aria-label="View admin reports"
                      >
                        <ShieldCheck size={15} aria-hidden="true" />
                        Admin reports
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-5">
                  {isLoggedIn ? (
                    <CreatePost
                      key={coursePostContext?.id || 'general-post-composer'}
                      onPostCreated={handlePostCreated}
                      courseContext={coursePostContext}
                    />
                  ) : (
                    <button
                      type="button"
                      id="guest-post-prompt"
                      onClick={handleGuestCreatePost}
                      className="guest-post-prompt"
                    >
                      <PenLine size={18} aria-hidden="true" />
                      <span>Sign in to create a post</span>
                    </button>
                  )}
                </div>

                {filteredPosts.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {filteredPosts.map(post => (
                      <PostCard
                        key={post.created_at ? `db-${post.id}` : `mock-${post.id}`}
                        post={post}
                        onViewProfile={handleViewProfile}
                        aiSummaryEnabled={aiSummaryEnabled}
                        isAdmin={isAdmin}
                        isLocallySaved={localSavedPostIds.includes(String(post.id))}
                        onSavedChange={handleSavedChange}
                        onActivity={addLocalNotification}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state animate-fade-in">
                    <SearchX size={32} aria-hidden="true" />
                    <h2 className="font-display font-bold text-xl mb-2">No posts found</h2>
                    <p className="text-sm">
                      {searchQuery
                        ? `No results for "${searchQuery}". Try a different search.`
                        : 'Be the first to post in this topic!'}
                    </p>
                  </div>
                )}
              </>
            )}
          </main>

          <div className="right-sidebar-column py-6 pr-4 hidden xl:block">
            <RightSidebar
              posts={isLoggedIn ? databasePosts : []}
              onOpenPost={handleOpenPost}
              onFilterTag={handleFilterTrendingTag}
              onOpenCommunity={() => {
                if (!isLoggedIn) {
                  setAuthModalView('login');
                  return;
                }

                setCoursePostContext(null);
                setActiveView('community');
              }}
            />
          </div>
        </div>
      </div>

      {authModalView && (
        <div className={`auth-modal-backdrop ${theme}`}>
          <div className="auth-modal-content animate-fade-in">
            {authModalView === 'login' ? (
              <LoginPage
                onSwitchToRegister={() => setAuthModalView('register')}
                onClose={closeAuthModal}
              />
            ) : (
              <RegisterPage
                onSwitchToLogin={() => setAuthModalView('login')}
                onClose={closeAuthModal}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
