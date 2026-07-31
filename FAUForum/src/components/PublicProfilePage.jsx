import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  FileText,
  MessageCircle,
  RefreshCw,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAvatarOrDefault, handleAvatarError } from '../utils/avatar';
import PostCard from './PostCard';

const API_BASE = 'http://localhost:3001';
const DEFAULT_BANNER_COLOR = '#003b5c';

const PUBLIC_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'posts', label: 'Posts' },
  { id: 'comments', label: 'Comments' },
  { id: 'followers', label: 'Followers' },
  { id: 'following', label: 'Following' },
];

function formatDate(dateString) {
  if (!dateString) return '';

  const normalized =
    typeof dateString === 'string' && !dateString.includes('T')
      ? `${dateString.replace(' ', 'T')}Z`
      : dateString;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function PublicEmptyState({ icon: Icon, title, message }) {
  return (
    <div className="profile-empty-state">
      <Icon size={24} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

function mergeProfilePosts(...postGroups) {
  const seen = new Set();

  return postGroups.flat().filter(post => {
    const key = `${post.created_at ? 'database' : 'sample'}-${post.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getBannerStyle(color, image) {
  const bannerColor = color || DEFAULT_BANNER_COLOR;

  if (image) {
    const safeImage = image.replace(/["\\\n\r]/g, character =>
      encodeURIComponent(character)
    );

    return {
      backgroundColor: bannerColor,
      backgroundImage: `linear-gradient(90deg, rgba(0, 32, 64, 0.2), rgba(0, 32, 64, 0.05)), url("${safeImage}")`,
    };
  }

  return {
    backgroundColor: bannerColor,
    backgroundImage: `linear-gradient(135deg, ${bannerColor}, #0057b8)`,
  };
}

export default function PublicProfilePage({
  profile,
  availablePosts = [],
  onBack,
  onOpenPost,
  onViewProfile,
  isAdmin = false,
}) {
  const { user } = useAuth();
  const requestedUsername = profile?.username || profile?.name || 'Unknown User';
  const [activeTab, setActiveTab] = useState('overview');
  const [profileDetails, setProfileDetails] = useState(profile || {});
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [people, setPeople] = useState({});
  const [followState, setFollowState] = useState({
    userExists: null,
    following: false,
    followerCount: 0,
    followingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [followStatusLoading, setFollowStatusLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState('');
  const matchingAvailablePosts = useMemo(
    () =>
      availablePosts.filter(post => {
        const postUsername =
          post.user?.name || post.username || post.author || post.name || '';
        return postUsername.toLowerCase() === requestedUsername.toLowerCase();
      }),
    [availablePosts, requestedUsername]
  );

  useEffect(() => {
    let ignoreResult = false;
    const username = encodeURIComponent(requestedUsername);
    const viewerQuery = user?.username
      ? `?viewer=${encodeURIComponent(user.username)}`
      : '';

    fetch(
      `${API_BASE}/api/users/${username}/follow-status${viewerQuery}`
    )
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load follow status.');
        return data;
      })
      .then(status => {
        if (ignoreResult) return;

        setFollowState(status);
        setProfileDetails(previous => ({ ...previous, ...(status.profile || {}) }));
      })
      .catch(fetchError => {
        if (!ignoreResult) setError(fetchError.message);
      })
      .finally(() => {
        if (!ignoreResult) setFollowStatusLoading(false);
      });

    Promise.all([
      fetch(`${API_BASE}/api/users/${username}/posts${viewerQuery}`).then(
        async response => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Could not load profile posts.');
          return data;
        }
      ),
      fetch(`${API_BASE}/api/users/${username}/comments`).then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load profile comments.');
        return data;
      }),
    ])
      .then(([profilePosts, profileComments]) => {
        if (ignoreResult) return;

        setPosts(mergeProfilePosts(profilePosts, matchingAvailablePosts));
        setComments(profileComments);
      })
      .catch(fetchError => {
        if (!ignoreResult) setError(fetchError.message);
      })
      .finally(() => {
        if (!ignoreResult) setLoading(false);
      });

    return () => {
      ignoreResult = true;
    };
  }, [matchingAvailablePosts, profile, requestedUsername, user?.username]);

  useEffect(() => {
    if (
      (activeTab !== 'followers' && activeTab !== 'following') ||
      people[activeTab] !== undefined
    ) {
      return;
    }

    let ignoreResult = false;
    const username = encodeURIComponent(requestedUsername);

    fetch(`${API_BASE}/api/users/${username}/${activeTab}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Could not load ${activeTab}.`);
        return data;
      })
      .then(data => {
        if (!ignoreResult) {
          setPeople(previous => ({ ...previous, [activeTab]: data }));
        }
      })
      .catch(fetchError => {
        if (!ignoreResult) setError(fetchError.message);
      })
      .finally(() => {
        if (!ignoreResult) setPeopleLoading(false);
      });

    return () => {
      ignoreResult = true;
    };
  }, [activeTab, people, requestedUsername]);

  const username = followState.username || profileDetails.username || requestedUsername;
  const isOwnProfile =
    Boolean(user?.username) &&
    user.username.toLowerCase() === username.toLowerCase();
  const handle =
    profileDetails.handle || `@${username.toLowerCase().replace(/\s+/g, '_')}`;
  const avatar = getAvatarOrDefault(profileDetails.avatar);

  const joinedLabel = useMemo(
    () => formatDate(profileDetails.created_at),
    [profileDetails.created_at]
  );
  const bannerStyle = getBannerStyle(
    profileDetails.banner_color,
    profileDetails.banner_image
  );

  const handleFollowToggle = async () => {
    if (!user?.username || !followState.userExists || followLoading) return;

    setFollowLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_BASE}/api/users/${encodeURIComponent(username)}/follow`,
        {
          method: followState.following ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followerUsername: user.username }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not update follow status.');
      }

      setFollowState(previous => ({ ...previous, ...data }));
      setPeople(previous => {
        const next = { ...previous };
        delete next.followers;
        return next;
      });
      if (activeTab === 'followers') setPeopleLoading(true);
    } catch (followError) {
      setError(followError.message);
    } finally {
      setFollowLoading(false);
    }
  };

  const renderPosts = () => {
    if (!posts.length) {
      return (
        <PublicEmptyState
          icon={FileText}
          title="No posts yet"
          message={`${username} has not created a post yet.`}
        />
      );
    }

    return (
      <div className="profile-post-list">
        {posts.map(post => (
          <PostCard
            key={`public-profile-post-${post.id}`}
            post={post}
            aiSummaryEnabled={false}
            isAdmin={isAdmin}
            onViewProfile={onViewProfile}
            onOpenPost={onOpenPost}
          />
        ))}
      </div>
    );
  };

  const handleTabChange = tabId => {
    setActiveTab(tabId);
    setError('');
    setPeopleLoading(
      (tabId === 'followers' || tabId === 'following') &&
        people[tabId] === undefined
    );
  };

  const renderComments = () => {
    if (!comments.length) {
      return (
        <PublicEmptyState
          icon={MessageCircle}
          title="No comments yet"
          message={`${username} has not commented on a discussion yet.`}
        />
      );
    }

    return (
      <div className="profile-comment-list">
        {comments.map(comment => (
          <article key={comment.id} className="profile-comment-card">
            <div className="profile-comment-meta">
              <span>Commented on</span>
              <time>{formatDate(comment.created_at)}</time>
            </div>
            <button
              type="button"
              className="profile-comment-post-title"
              onClick={() => onOpenPost?.(comment.post_id)}
            >
              {comment.post_title}
            </button>
            <p>{comment.content}</p>
            <button
              type="button"
              className="profile-open-post-button"
              onClick={() => onOpenPost?.(comment.post_id)}
            >
              Open original post
            </button>
          </article>
        ))}
      </div>
    );
  };

  const renderPeople = type => {
    if (peopleLoading) {
      return (
        <div className="profile-tab-status" role="status">
          <RefreshCw className="animate-spin" size={20} aria-hidden="true" />
          Loading {type}
        </div>
      );
    }

    const list = people[type] || [];

    if (!list.length) {
      return (
        <PublicEmptyState
          icon={Users}
          title={`No ${type} yet`}
          message={
            type === 'followers'
              ? `${username} does not have any followers yet.`
              : `${username} is not following anyone yet.`
          }
        />
      );
    }

    return (
      <div className="profile-people-list">
        {list.map(person => {
          const personAvatar = getAvatarOrDefault(person.avatar);

          return (
            <button
              key={person.id}
              type="button"
              className="profile-person-card"
              onClick={() =>
                onViewProfile?.({
                  username: person.username,
                  avatar: personAvatar,
                  bio: person.bio || '',
                })
              }
            >
              <img src={personAvatar} alt="" onError={handleAvatarError} />
              <span>
                <strong>{person.username}</strong>
                <small>
                  {person.post_count || 0}{' '}
                  {Number(person.post_count) === 1 ? 'post' : 'posts'}
                </small>
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderActiveTab = () => {
    if (loading) {
      return (
        <div className="profile-tab-status" role="status">
          <RefreshCw className="animate-spin" size={20} aria-hidden="true" />
          Loading profile activity
        </div>
      );
    }

    if (activeTab === 'overview') {
      return (
        <div className="profile-overview-grid">
          <article className="profile-overview-card">
            <h2>About</h2>
            <p>{profileDetails.bio || 'OwlNet community member.'}</p>
            {joinedLabel && <small>Joined OwlNet {joinedLabel}</small>}
          </article>
          <article className="profile-overview-card">
            <h2>Community snapshot</h2>
            <div className="profile-overview-metrics">
              <span>
                <strong>{posts.length}</strong>
                Posts
              </span>
              <span>
                <strong>{followState.followerCount || 0}</strong>
                Followers
              </span>
              <span>
                <strong>{followState.followingCount || 0}</strong>
                Following
              </span>
            </div>
          </article>
        </div>
      );
    }

    if (activeTab === 'posts') return renderPosts();
    if (activeTab === 'comments') return renderComments();
    return renderPeople(activeTab);
  };

  return (
    <section className="public-profile-page max-w-3xl mx-auto animate-fade-in">
      <button type="button" onClick={onBack} className="page-back-button">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to feed
      </button>

      <article className="profile-card public-profile-card">
        <div
          className="public-profile-banner"
          style={bannerStyle}
          aria-hidden="true"
        />
        <div className="public-profile-content">
          <div className="public-profile-top-row">
            <img
              src={avatar}
              alt={`${username} profile`}
              className="public-profile-avatar profile-avatar-ring"
              onError={handleAvatarError}
            />

            {!isOwnProfile && user && followState.userExists !== false && (
              <button
                type="button"
                onClick={handleFollowToggle}
                disabled={
                  followLoading ||
                  followStatusLoading ||
                  followState.userExists !== true
                }
                className={
                  followState.following
                    ? 'button-secondary public-profile-follow'
                    : 'button-primary public-profile-follow'
                }
              >
                {followState.following ? (
                  <UserCheck size={16} aria-hidden="true" />
                ) : (
                  <UserPlus size={16} aria-hidden="true" />
                )}
                {followStatusLoading
                  ? 'Loading...'
                  : followState.userExists !== true
                    ? 'Follow unavailable'
                    : followLoading
                  ? 'Updating...'
                  : followState.following
                    ? 'Unfollow'
                    : 'Follow'}
              </button>
            )}
          </div>

          <div className="public-profile-identity">
            <h1>{username}</h1>
            <p className="public-profile-handle">{handle}</p>
          </div>

          <p className="public-profile-bio">
            {profileDetails.bio || 'OwlNet community member.'}
          </p>

          <div className="public-profile-stats" aria-label="Profile details">
            <span className="public-profile-stat">
              <strong>{posts.length}</strong> {posts.length === 1 ? 'post' : 'posts'}
            </span>
            <span className="public-profile-stat">
              <strong>{followState.followerCount || 0}</strong> followers
            </span>
            <span className="public-profile-stat">
              <strong>{followState.followingCount || 0}</strong> following
            </span>
          </div>
        </div>
      </article>

      {error && <div className="auth-error profile-public-error">{error}</div>}

      <nav
        className="profile-tabs profile-tabs-public"
        aria-label={`${username}'s public profile sections`}
      >
        {PUBLIC_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'is-active' : ''}
            onClick={() => handleTabChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="profile-tab-panel">{renderActiveTab()}</div>
    </section>
  );
}
