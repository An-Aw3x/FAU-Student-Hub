import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bookmark,
  CalendarDays,
  Camera,
  Clock3,
  FileText,
  History,
  ImagePlus,
  MessageCircle,
  Palette,
  Pencil,
  RefreshCw,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAvatarOrDefault, handleAvatarError } from '../utils/avatar';
import AvatarCropper from './AvatarCropper';
import PostCard from './PostCard';

const API_BASE = 'http://localhost:3001';
const DEFAULT_BANNER_COLOR = '#003b5c';
const BANNER_COLORS = ['#003b5c', '#0057b8', '#1f4e79', '#7a1f2b', '#4a3f75', '#2f6b5f'];

const PROFILE_TABS = [
  { id: 'overview', label: 'Overview', icon: UserRound },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'comments', label: 'Comments', icon: MessageCircle },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'history', label: 'History', icon: History },
  { id: 'upvoted', label: 'Upvoted', icon: ArrowUp },
  { id: 'downvoted', label: 'Downvoted', icon: ArrowDown },
];

const EMPTY_STATES = {
  posts: ['No posts yet', 'Start a discussion from the community feed.'],
  comments: ['No comments yet', 'Comments you leave on discussions will appear here.'],
  saved: ['No saved posts', 'Save useful discussions to build your private library.'],
  history: ['No recent activity', 'Your posts, comments, saves, and votes will appear here.'],
  upvoted: ['No upvoted posts', 'Posts you upvote will appear in this private tab.'],
  downvoted: ['No downvoted posts', 'Posts you downvote will appear in this private tab.'],
};

function formatDate(dateString, options = {}) {
  if (!dateString) return 'Unknown';

  const normalized =
    typeof dateString === 'string' && !dateString.includes('T')
      ? `${dateString.replace(' ', 'T')}Z`
      : dateString;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return 'Unknown';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

function ProfileEmptyState({ tab }) {
  const [title, message] = EMPTY_STATES[tab];

  return (
    <div className="profile-empty-state">
      <FileText size={24} aria-hidden="true" />
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

export default function ProfilePage({
  onBack,
  onViewProfile,
  onOpenPost,
  isAdmin = false,
  localSavedPosts = [],
  onSavedChange,
}) {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profileDetails, setProfileDetails] = useState(null);
  const [followCounts, setFollowCounts] = useState({
    followerCount: 0,
    followingCount: 0,
  });
  const [tabData, setTabData] = useState({});
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editBannerColor, setEditBannerColor] = useState(
    user?.banner_color || DEFAULT_BANNER_COLOR
  );
  const [editBannerImage, setEditBannerImage] = useState(user?.banner_image || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cropperImage, setCropperImage] = useState(null);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const bannerColorInputRef = useRef(null);

  useEffect(() => {
    if (!user?.id || !user?.username) return;

    let ignoreResult = false;
    const username = encodeURIComponent(user.username);

    Promise.all([
      fetch(`${API_BASE}/api/users/${user.id}`).then(response => {
        if (!response.ok) throw new Error('Could not load profile details.');
        return response.json();
      }),
      fetch(
        `${API_BASE}/api/users/${username}/follow-status?viewer=${username}`
      ).then(response => {
        if (!response.ok) throw new Error('Could not load follow counts.');
        return response.json();
      }),
    ])
      .then(([details, counts]) => {
        if (ignoreResult) return;
        setProfileDetails(details);
        setFollowCounts({
          followerCount: counts.followerCount || 0,
          followingCount: counts.followingCount || 0,
        });
      })
      .catch(fetchError => {
        if (!ignoreResult) setError(fetchError.message);
      });

    return () => {
      ignoreResult = true;
    };
  }, [user?.id, user?.username]);

  useEffect(() => {
    if (
      !user?.username ||
      activeTab === 'overview' ||
      tabData[activeTab] !== undefined
    ) {
      return;
    }

    let ignoreResult = false;
    const username = encodeURIComponent(user.username);
    const query = new URLSearchParams({ viewer: user.username });

    fetch(`${API_BASE}/api/users/${username}/${activeTab}?${query}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Could not load ${activeTab}.`);
        }
        return data;
      })
      .then(data => {
        if (!ignoreResult) {
          const nextData =
            activeTab === 'saved'
              ? mergeProfilePosts(data, localSavedPosts)
              : data;
          setTabData(previous => ({ ...previous, [activeTab]: nextData }));
        }
      })
      .catch(fetchError => {
        if (!ignoreResult) setTabError(fetchError.message);
      })
      .finally(() => {
        if (!ignoreResult) setTabLoading(false);
      });

    return () => {
      ignoreResult = true;
    };
  }, [activeTab, localSavedPosts, tabData, user?.username]);

  const handleFileSelect = event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropperImage(reader.result);
      setError('');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleBannerFileSelect = event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file for your banner.');
      return;
    }

    if (file.size > 1024 * 1024) {
      setError('Banner image must be under 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditBannerImage(reader.result);
      setError('');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const startEditing = section => {
    setEditBio(user.bio || '');
    setEditBannerColor(
      user.banner_color || profileDetails?.banner_color || DEFAULT_BANNER_COLOR
    );
    setEditBannerImage(user.banner_image || profileDetails?.banner_image || '');
    setError('');
    setEditing(true);

    if (section === 'banner') {
      window.setTimeout(() => bannerColorInputRef.current?.focus(), 50);
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditBio(user.bio || '');
    setEditBannerColor(
      user.banner_color || profileDetails?.banner_color || DEFAULT_BANNER_COLOR
    );
    setEditBannerImage(user.banner_image || profileDetails?.banner_image || '');
    setError('');
  };

  const showSuccess = message => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(''), 3000);
  };

  const handleCropSave = async croppedImage => {
    setCropperImage(null);
    setSaving(true);
    setError('');

    try {
      await updateProfile({ avatar: croppedImage });
      showSuccess('Avatar updated.');
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');

    setSaving(true);

    try {
      await updateProfile({
        bio: editBio.trim(),
        banner_color: editBannerColor,
        banner_image: editBannerImage,
      });
      setEditing(false);
      setActiveTab('overview');
      setTabData({});
      showSuccess('Profile updated.');
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavedChange = (post, saved) => {
    onSavedChange?.(post, saved);
    if (saved) return;

    setTabData(previous => ({
      ...previous,
      saved: (previous.saved || []).filter(item => String(item.id) !== String(post.id)),
    }));
  };

  const handleTabChange = tabId => {
    setActiveTab(tabId);
    setTabError('');
    setTabLoading(tabId !== 'overview' && tabData[tabId] === undefined);
  };

  const renderPostList = posts => {
    if (!posts?.length) return <ProfileEmptyState tab={activeTab} />;

    return (
      <div className="profile-post-list">
        {posts.map(post => (
          <PostCard
            key={`profile-${activeTab}-${post.id}`}
            post={post}
            aiSummaryEnabled={false}
            isAdmin={isAdmin}
            onViewProfile={onViewProfile}
            onOpenPost={onOpenPost}
            isLocallySaved={
              !post.created_at &&
              localSavedPosts.some(savedPost => String(savedPost.id) === String(post.id))
            }
            onSavedChange={activeTab === 'saved' ? handleSavedChange : undefined}
          />
        ))}
      </div>
    );
  };

  const renderComments = comments => {
    if (!comments?.length) return <ProfileEmptyState tab="comments" />;

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

  const renderHistory = activity => {
    if (!activity?.length) return <ProfileEmptyState tab="history" />;

    const activityDetails = {
      post: { label: 'Created a post', icon: FileText },
      comment: { label: 'Commented on a post', icon: MessageCircle },
      save: { label: 'Saved a post', icon: Bookmark },
      upvote: { label: 'Upvoted a post', icon: ArrowUp },
      downvote: { label: 'Downvoted a post', icon: ArrowDown },
    };

    return (
      <div className="profile-history-list">
        {activity.map(item => {
          const details = activityDetails[item.activity_type];
          const Icon = details?.icon || Clock3;

          return (
            <article
              key={`${item.activity_type}-${item.activity_id}`}
              className="profile-history-item"
            >
              <span className={`profile-history-icon is-${item.activity_type}`}>
                <Icon size={16} aria-hidden="true" />
              </span>
              <div>
                <div className="profile-history-heading">
                  <strong>{details?.label || 'Account activity'}</strong>
                  <time>{formatDate(item.created_at)}</time>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPost?.(item.post_id)}
                  className="profile-history-post"
                >
                  {item.post_title}
                </button>
                {item.activity_type === 'comment' && item.content && (
                  <p>{item.content}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <div className="profile-overview-grid">
          <article className="profile-overview-card">
            <h2>About</h2>
            <p>{user.bio || 'Add a bio to tell the OwlNet community about yourself.'}</p>
          </article>
          <article className="profile-overview-card">
            <h2>Community snapshot</h2>
            <div className="profile-overview-metrics">
              <span>
                <strong>{profileDetails?.postCount || 0}</strong>
                Posts
              </span>
              <span>
                <strong>{followCounts.followerCount}</strong>
                Followers
              </span>
              <span>
                <strong>{followCounts.followingCount}</strong>
                Following
              </span>
            </div>
          </article>
        </div>
      );
    }

    if (tabLoading) {
      return (
        <div className="profile-tab-status" role="status">
          <RefreshCw className="animate-spin" size={20} aria-hidden="true" />
          Loading {activeTab}
        </div>
      );
    }

    if (tabError) {
      return (
        <div className="profile-tab-status is-error" role="alert">
          <p>{tabError}</p>
          <button
            type="button"
            onClick={() => {
              setTabError('');
              setTabLoading(true);
              setTabData(previous => {
                const next = { ...previous };
                delete next[activeTab];
                return next;
              });
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    if (activeTab === 'comments') return renderComments(tabData.comments);
    if (activeTab === 'history') return renderHistory(tabData.history);
    return renderPostList(tabData[activeTab]);
  };

  if (!user) return null;

  const avatar = getAvatarOrDefault(user.avatar);
  const joinedDate = profileDetails?.created_at || user.joinDate;
  const currentBannerColor =
    user.banner_color || profileDetails?.banner_color || DEFAULT_BANNER_COLOR;
  const currentBannerImage =
    user.banner_image || profileDetails?.banner_image || '';
  const bannerStyle = getBannerStyle(
    editing ? editBannerColor : currentBannerColor,
    editing ? editBannerImage : currentBannerImage
  );

  return (
    <section className="profile-page max-w-3xl mx-auto animate-fade-in">
      <button type="button" onClick={onBack} className="page-back-button">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to feed
      </button>

      <article className="profile-card own-profile-card">
        <div className="public-profile-banner profile-banner-editor" style={bannerStyle}>
          <button
            type="button"
            className="profile-banner-edit-button"
            onClick={() => {
              if (editing) {
                bannerColorInputRef.current?.focus();
              } else {
                startEditing('banner');
              }
            }}
          >
            <Pencil size={14} aria-hidden="true" />
            Edit banner
          </button>
        </div>
        <div className="own-profile-content">
          <div className="profile-avatar-wrapper">
            <img
              src={avatar}
              alt={`${user.username} profile`}
              className="profile-avatar"
              onError={handleAvatarError}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="profile-avatar-edit"
              title="Change avatar"
              aria-label="Change avatar"
            >
              <Camera size={15} aria-hidden="true" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload avatar image"
            />
          </div>

          {error && <div className="auth-error profile-message">{error}</div>}
          {success && <div className="auth-success profile-message">{success}</div>}

          {editing ? (
            <div className="profile-edit-form">
              <label htmlFor="profile-username-readonly">Username</label>
              <input
                id="profile-username-readonly"
                type="text"
                value={user.username}
                className="auth-input profile-readonly-input"
                readOnly
                aria-describedby="profile-username-note"
              />
              <p id="profile-username-note" className="profile-username-note">
                Username changes require admin approval.
              </p>
              <label htmlFor="edit-bio">About me</label>
              <textarea
                id="edit-bio"
                value={editBio}
                onChange={event => setEditBio(event.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                className="auth-input"
                maxLength={300}
              />
              <p className="profile-character-count">{editBio.length}/300</p>

              <div className="profile-edit-section">
                <div className="profile-edit-section-heading">
                  <Palette size={16} aria-hidden="true" />
                  <span>Profile banner</span>
                </div>
                <div
                  className="profile-banner-preview"
                  style={getBannerStyle(editBannerColor, editBannerImage)}
                  aria-label="Banner preview"
                />
                <div className="profile-banner-controls">
                  <div className="profile-banner-swatches" aria-label="Banner colors">
                    {BANNER_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={editBannerColor === color ? 'is-selected' : ''}
                        style={{ backgroundColor: color }}
                        onClick={() => setEditBannerColor(color)}
                        aria-label={`Use banner color ${color}`}
                        aria-pressed={editBannerColor === color}
                      />
                    ))}
                  </div>
                  <label className="profile-color-picker">
                    <input
                      ref={bannerColorInputRef}
                      type="color"
                      value={editBannerColor}
                      onChange={event => setEditBannerColor(event.target.value)}
                    />
                    Custom color
                  </label>
                </div>
                <div className="profile-banner-image-actions">
                  <button
                    type="button"
                    className="button-secondary button-compact"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <ImagePlus size={14} aria-hidden="true" />
                    Upload image
                  </button>
                  {editBannerImage && (
                    <button
                      type="button"
                      className="profile-banner-remove"
                      onClick={() => setEditBannerImage('')}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      Remove image
                    </button>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleBannerFileSelect}
                    className="hidden"
                    aria-label="Upload profile banner"
                  />
                </div>
                <small>Use a JPG, PNG, WebP, or GIF under 1MB.</small>
              </div>

              <div className="profile-edit-section profile-avatar-edit-section">
                <div className="profile-edit-section-heading">
                  <Camera size={16} aria-hidden="true" />
                  <span>Profile photo</span>
                </div>
                <button
                  type="button"
                  className="button-secondary button-compact"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={14} aria-hidden="true" />
                  Change avatar
                </button>
              </div>

              <div className="profile-edit-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={cancelEditing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="own-profile-heading">
                <div>
                  <h1>{user.username}</h1>
                  <p>{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => startEditing('profile')}
                  className="button-secondary button-compact"
                >
                  <Pencil size={14} aria-hidden="true" />
                  Edit profile
                </button>
              </div>

              <p className={`public-profile-bio ${user.bio ? '' : 'is-empty'}`}>
                {user.bio || 'No bio yet. Add one to introduce yourself to OwlNet.'}
              </p>

              <div className="profile-summary-row" aria-label="Profile details">
                <span className="profile-stat">
                  <CalendarDays size={14} aria-hidden="true" />
                  Joined {formatDate(joinedDate, { month: 'long' })}
                </span>
                <span className="profile-stat">
                  <FileText size={14} aria-hidden="true" />
                  {profileDetails?.postCount || 0} posts
                </span>
                <span className="profile-stat">
                  <Users size={14} aria-hidden="true" />
                  {followCounts.followerCount} followers
                </span>
                <span className="profile-stat">
                  <UserRound size={14} aria-hidden="true" />
                  {followCounts.followingCount} following
                </span>
              </div>
            </>
          )}
        </div>
      </article>

      <nav
        className="profile-tabs profile-tabs-private"
        aria-label="Your profile sections"
      >
        {PROFILE_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'is-active' : ''}
              onClick={() => handleTabChange(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <Icon size={15} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="profile-tab-panel">{renderTabContent()}</div>

      {cropperImage && (
        <AvatarCropper
          imageSrc={cropperImage}
          onSave={handleCropSave}
          onCancel={() => setCropperImage(null)}
        />
      )}
    </section>
  );
}
