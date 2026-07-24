import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ChevronRight = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function SettingsPage({ theme, onThemeToggle, onBack, onOpenProfile }) {
  const { user, logout, deleteAccount } = useAuth();

  const [activeTab, setActiveTab] = useState('account');
  const [copied, setCopied] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const copyText = async (label, value) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(`${label} copied`);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      setCopied('Could not copy');
      setTimeout(() => setCopied(''), 1800);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Type DELETE to confirm account deletion.');
      return;
    }

    try {
      setDeleting(true);
      setDeleteError('');

      await deleteAccount();

      setDeleteModalOpen(false);
      onBack?.();
    } catch (err) {
      setDeleteError(err.message || 'Could not delete account.');
    } finally {
      setDeleting(false);
    }
  };

  const tabs = ['account', 'profile', 'privacy', 'preferences', 'notifications'];

  return (
    <section className="max-w-4xl mx-auto animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        className="vote-btn mb-5"
      >
        Back to Feed
      </button>

      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Settings
        </h1>

        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Manage your OwlNet account and app preferences.
        </p>
      </div>

      <div className="flex items-center gap-7 mb-7 overflow-x-auto border-b" style={{ borderColor: 'var(--color-border)' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="pb-3 text-sm font-semibold capitalize transition-all"
            style={{
              color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--color-text-primary)' : '2px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {copied && (
        <div
          className="mb-5 rounded-2xl px-4 py-3 text-sm font-semibold"
          style={{
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            color: '#15803d',
          }}
        >
          {copied}
        </div>
      )}

      {activeTab === 'account' && (
        <div>
          <h2 className="font-display font-bold text-xl mb-4" style={{ color: 'var(--color-text-primary)' }}>
            General
          </h2>

          <div className="settings-list">
            <button
              type="button"
              onClick={() => copyText('Email', user?.email)}
              className="settings-row"
            >
              <div>
                <p className="settings-title">Email address</p>
                <p className="settings-subtitle">{user?.email || 'No email found'}</p>
              </div>
              <ChevronRight />
            </button>

            <button
              type="button"
              onClick={() => copyText('Username', user?.username)}
              className="settings-row"
            >
              <div>
                <p className="settings-title">Username</p>
                <p className="settings-subtitle">{user?.username || 'No username found'}</p>
              </div>
              <ChevronRight />
            </button>

            <button
              type="button"
              onClick={onOpenProfile}
              className="settings-row"
            >
              <div>
                <p className="settings-title">Profile</p>
                <p className="settings-subtitle">View and update your public profile.</p>
              </div>
              <ChevronRight />
            </button>
          </div>

          <h2 className="font-display font-bold text-xl mt-8 mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Account actions
          </h2>

          <div className="settings-list">
            <button
              type="button"
              onClick={logout}
              className="settings-row"
              style={{ color: '#ef4444' }}
            >
              <div>
                <p className="settings-title">Log out</p>
                <p className="settings-subtitle">Sign out of your OwlNet account.</p>
              </div>
              <ChevronRight />
            </button>

            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(true);
                setDeleteConfirmText('');
                setDeleteError('');
              }}
              className="settings-row"
              style={{ color: '#ef4444' }}
            >
              <div>
                <p className="settings-title" style={{ color: '#ef4444' }}>Delete account</p>
                <p className="settings-subtitle">Permanently remove your OwlNet account.</p>
              </div>
              <ChevronRight />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div>
          <h2 className="font-display font-bold text-xl mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Profile
          </h2>

          <div className="settings-list">
            <button type="button" onClick={onOpenProfile} className="settings-row">
              <div>
                <p className="settings-title">Open profile editor</p>
                <p className="settings-subtitle">Change your avatar, display name, and profile info.</p>
              </div>
              <ChevronRight />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div>
          <h2 className="font-display font-bold text-xl mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Preferences
          </h2>

          <div className="settings-list">
            <button
              type="button"
              onClick={onThemeToggle}
              className="settings-row"
            >
              <div>
                <p className="settings-title">Display mode</p>
                <p className="settings-subtitle">
                  Currently using {theme === 'dark' ? 'dark mode' : 'light mode'}.
                </p>
              </div>

              <span className="vote-btn">
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>
          </div>
        </div>
      )}

      {(activeTab === 'privacy' || activeTab === 'notifications') && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <h2 className="font-display font-bold text-xl mb-2 capitalize" style={{ color: 'var(--color-text-primary)' }}>
            {activeTab}
          </h2>

          <p className="text-sm">
            No {activeTab} settings are needed for the current demo yet.
          </p>
        </div>
      )}

      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(3px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 shadow-xl"
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <h3 className="font-display font-bold text-xl mb-2">
              Delete account?
            </h3>

            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              This will permanently delete your account. Your old posts and comments will show as Deleted User.
            </p>

            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Type DELETE to confirm
            </label>

            <input
              value={deleteConfirmText}
              onChange={(e) => {
                setDeleteConfirmText(e.target.value);
                setDeleteError('');
              }}
              className="auth-input mb-3"
              placeholder="DELETE"
            />

            {deleteError && (
              <div className="auth-error mb-3">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="vote-btn"
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                className="vote-btn"
                disabled={deleting}
                style={{ color: '#ef4444' }}
              >
                {deleting ? 'Deleting...' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}