import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import AvatarCropper from './AvatarCropper';

// ── Icons ──────────────────────────────────────────────────
const CameraIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const PostIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const BackIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

function formatJoinDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' });
}

export default function ProfilePage({ onBack }) {
  const { user, logout, updateProfile } = useAuth();

  const [postCount, setPostCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Avatar upload + crop
  const [cropperImage, setCropperImage] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch post count from backend
  useEffect(() => {
    if (!user?.id) return;

    fetch(`http://localhost:3001/api/users/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.postCount !== undefined) {
          setPostCount(data.postCount);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // Sync edit fields when user changes
  useEffect(() => {
    setEditUsername(user?.username || '');
    setEditBio(user?.bio || '');
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
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

    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  const handleCropSave = async (croppedImage) => {
    setCropperImage(null);
    setSaving(true);
    setError('');
    try {
      await updateProfile({ avatar: croppedImage });
      setSuccess('Avatar updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');

    if (!editUsername.trim() || editUsername.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        username: editUsername.trim(),
        bio: editBio.trim(),
      });
      setEditing(false);
      setSuccess('Profile updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Back Button */}
      <button
        type="button"
        id="profile-back-btn"
        onClick={onBack}
        className="flex items-center gap-2 mb-6 text-sm font-semibold transition-all hover:opacity-80"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <BackIcon />
        Back to Feed
      </button>

      {/* Profile Card */}
      <div className="profile-card">
        {/* Banner */}
        <div className="h-32 rounded-t-2xl"
          style={{ background: 'linear-gradient(135deg, var(--color-owl-blue), var(--color-owl-blue-light), #1a365d)' }}
        />

        {/* Avatar Section */}
        <div className="px-6 -mt-14">
          <div className="relative inline-block">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-28 h-28 rounded-full object-cover profile-avatar-ring"
            />
            <button
              type="button"
              id="change-avatar-btn"
              onClick={handleAvatarClick}
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, var(--color-owl-blue), var(--color-owl-blue-light))',
                color: 'white',
                border: '3px solid var(--color-surface-2)',
              }}
              title="Change avatar"
              aria-label="Change avatar"
            >
              <CameraIcon />
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
        </div>

        {/* User Info */}
        <div className="px-6 pt-4 pb-6">
          {/* Messages */}
          {error && <div className="auth-error mb-4 animate-slide-down">{error}</div>}
          {success && (
            <div className="mb-4 px-4 py-2.5 rounded-xl text-xs font-bold animate-slide-down"
              style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ADE80' }}>
              {success}
            </div>
          )}

          {editing ? (
            /* ── Edit Mode ──────────────────────────────── */
            <div className="animate-slide-down">
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}>
                  Username
                </label>
                <input
                  id="edit-username"
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="auth-input"
                  maxLength={30}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}>
                  About Me
                </label>
                <textarea
                  id="edit-bio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="auth-input"
                  maxLength={300}
                  style={{ resize: 'none' }}
                />
                <p className="text-xs mt-1 text-right" style={{ color: 'var(--color-text-muted)' }}>
                  {editBio.length}/300
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditUsername(user.username); setEditBio(user.bio || ''); setError(''); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="save-profile-btn"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, var(--color-owl-blue), var(--color-owl-blue-light))', color: 'white' }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            /* ── View Mode ──────────────────────────────── */
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--color-text-primary)' }}>
                    {user.username}
                  </h1>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {user.email}
                  </p>
                </div>
                <button
                  type="button"
                  id="edit-profile-btn"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:bg-[color:var(--color-surface-3)]"
                  style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                >
                  <EditIcon />
                  Edit Profile
                </button>
              </div>

              {/* Bio */}
              {user.bio ? (
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                  {user.bio}
                </p>
              ) : (
                <p className="text-sm italic mb-5" style={{ color: 'var(--color-text-muted)' }}>
                  No bio yet. Click &quot;Edit Profile&quot; to add one.
                </p>
              )}

              {/* Stats */}
              <div className="flex gap-4 mb-6 flex-wrap">
                <div className="profile-stat">
                  <CalendarIcon />
                  <span>Joined {formatJoinDate(user.joinDate)}</span>
                </div>
                <div className="profile-stat">
                  <PostIcon />
                  <span>{postCount} post{postCount !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px mb-5" style={{ background: 'var(--color-border)' }} />

              {/* Logout */}
              <button
                type="button"
                id="logout-btn"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171' }}
              >
                <LogoutIcon />
                Log Out
              </button>
            </>
          )}
        </div>
      </div>

      {/* Avatar Cropper Modal */}
      {cropperImage && (
        <AvatarCropper
          imageSrc={cropperImage}
          onSave={handleCropSave}
          onCancel={() => setCropperImage(null)}
        />
      )}
    </div>
  );
}
