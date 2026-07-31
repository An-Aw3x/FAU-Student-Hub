import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  LogOut,
  Mail,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SETTINGS_TABS = [
  { id: 'account', label: 'Account', icon: UserRound },
  { id: 'profile', label: 'Profile', icon: Eye },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

function SettingsInfoRow({ icon: Icon, title, description }) {
  return (
    <article className="settings-row settings-info-row">
      <span className="flex min-w-0 items-start gap-3">
        <span className="settings-row-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-3)] text-[color:var(--color-accent)]">
          <Icon size={17} strokeWidth={2} aria-hidden="true" />
        </span>

        <span className="min-w-0">
          <span className="settings-title block">{title}</span>
          <span className="settings-subtitle block">{description}</span>
        </span>
      </span>
    </article>
  );
}

export default function SettingsPage({ theme, onThemeToggle, onBack, onOpenProfile }) {
  const { user, logout, deleteAccount } = useAuth();

  const [activeTab, setActiveTab] = useState('account');
  const [copyStatus, setCopyStatus] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const copyText = async (label, value) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus({ type: 'success', message: `${label} copied` });
    } catch {
      setCopyStatus({ type: 'error', message: `Could not copy ${label.toLowerCase()}.` });
    }

    setTimeout(() => setCopyStatus(null), 1800);
  };

  const openDeleteModal = () => {
    setDeleteModalOpen(true);
    setDeleteConfirmText('');
    setDeleteError('');
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteModalOpen(false);
    setDeleteConfirmText('');
    setDeleteError('');
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

  return (
    <section className="settings-page max-w-4xl mx-auto animate-fade-in">
      <button type="button" onClick={onBack} className="page-back-button">
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Back to feed
      </button>

      <header className="settings-page-header mb-6">
        <p className="section-eyebrow">Account center</p>
        <h1 className="font-display mb-2 text-3xl font-bold text-[color:var(--color-text-primary)]">
          Settings
        </h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Review your OwlNet account, profile, privacy, and display preferences.
        </p>
      </header>

      <div
        className="settings-tabs mb-7 flex items-center gap-7 overflow-x-auto border-b border-[color:var(--color-border)]"
        role="tablist"
        aria-label="Settings sections"
      >
        {SETTINGS_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`settings-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`settings-tab flex shrink-0 items-center gap-1.5 border-b-2 pb-3 text-sm font-semibold transition-colors ${
                isActive
                  ? 'border-[color:var(--color-text-primary)] text-[color:var(--color-text-primary)]'
                  : 'border-transparent text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-secondary)]'
              }`}
            >
              <TabIcon size={15} strokeWidth={2} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {copyStatus && (
        <div
          className={`${copyStatus.type === 'error' ? 'auth-error' : 'auth-success'} mb-5`}
          role="status"
        >
          {copyStatus.type === 'error' ? (
            <AlertCircle size={17} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={17} aria-hidden="true" />
          )}
          <span>{copyStatus.message}</span>
        </div>
      )}

      {activeTab === 'account' && (
        <div id="settings-panel-account" role="tabpanel" aria-label="Account settings">
          <h2 className="font-display mb-4 text-xl font-bold text-[color:var(--color-text-primary)]">
            Account details
          </h2>

          <div className="settings-list">
            <button
              type="button"
              onClick={() => copyText('Email', user?.email)}
              className="settings-row"
              aria-label="Copy email address"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="settings-row-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-3)] text-[color:var(--color-accent)]">
                  <Mail size={17} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="settings-title block">Email address</span>
                  <span className="settings-subtitle block break-all">
                    {user?.email || 'No email found'}
                  </span>
                </span>
              </span>

              <span className="settings-inline-action button-secondary button-compact shrink-0">
                <Copy size={14} aria-hidden="true" />
                Copy
              </span>
            </button>

            <button
              type="button"
              onClick={() => copyText('Username', user?.username)}
              className="settings-row"
              aria-label="Copy username"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="settings-row-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-3)] text-[color:var(--color-accent)]">
                  <UserRound size={17} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="settings-title block">Username</span>
                  <span className="settings-subtitle block break-all">
                    {user?.username || 'No username found'}
                  </span>
                </span>
              </span>

              <span className="settings-inline-action button-secondary button-compact shrink-0">
                <Copy size={14} aria-hidden="true" />
                Copy
              </span>
            </button>

            <button type="button" onClick={onOpenProfile} className="settings-row">
              <span className="flex min-w-0 items-center gap-3">
                <span className="settings-row-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-3)] text-[color:var(--color-accent)]">
                  <Eye size={17} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="settings-title block">Public profile</span>
                  <span className="settings-subtitle block">
                    Review and update the profile other OwlNet members can see.
                  </span>
                </span>
              </span>
              <ChevronRight size={17} className="shrink-0" aria-hidden="true" />
            </button>
          </div>

          <h2 className="font-display mb-4 mt-8 text-xl font-bold text-[color:var(--color-text-primary)]">
            Account actions
          </h2>

          <div className="settings-list">
            <button type="button" onClick={logout} className="settings-row">
              <span className="flex min-w-0 items-center gap-3">
                <span className="settings-row-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-3)] text-[color:var(--color-error)]">
                  <LogOut size={17} strokeWidth={2} aria-hidden="true" />
                </span>
                <span>
                  <span className="settings-title block">Log out</span>
                  <span className="settings-subtitle block">
                    Sign out of your OwlNet account on this device.
                  </span>
                </span>
              </span>
              <ChevronRight size={17} className="shrink-0" aria-hidden="true" />
            </button>

            <button type="button" onClick={openDeleteModal} className="settings-row">
              <span className="flex min-w-0 items-center gap-3">
                <span className="settings-row-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-3)] text-[color:var(--color-error)]">
                  <Trash2 size={17} strokeWidth={2} aria-hidden="true" />
                </span>
                <span>
                  <span className="settings-title block">Delete account</span>
                  <span className="settings-subtitle block">
                    Permanently remove your account and anonymize existing contributions.
                  </span>
                </span>
              </span>
              <ChevronRight size={17} className="shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div id="settings-panel-profile" role="tabpanel" aria-label="Profile settings">
          <h2 className="font-display mb-4 text-xl font-bold text-[color:var(--color-text-primary)]">
            Profile
          </h2>

          <div className="settings-list">
            <button type="button" onClick={onOpenProfile} className="settings-row">
              <span className="flex min-w-0 items-center gap-3">
                <span className="settings-row-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-3)] text-[color:var(--color-accent)]">
                  <UserRound size={17} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="settings-title block">Open profile editor</span>
                  <span className="settings-subtitle block">
                    Change your avatar, display name, and profile information.
                  </span>
                </span>
              </span>
              <ChevronRight size={17} className="shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'privacy' && (
        <div id="settings-panel-privacy" role="tabpanel" aria-label="Privacy information">
          <h2 className="font-display mb-2 text-xl font-bold text-[color:var(--color-text-primary)]">
            Privacy
          </h2>
          <p className="mb-4 text-sm text-[color:var(--color-text-muted)]">
            Here is how your account information currently appears across OwlNet.
          </p>

          <div className="settings-list">
            <SettingsInfoRow
              icon={Eye}
              title="Community visibility"
              description="Your username, avatar, bio, and public posts can be seen by signed-in OwlNet members."
            />
            <SettingsInfoRow
              icon={Mail}
              title="Email privacy"
              description="Your FAU email is used for account access and verification; it is not shown on your public profile."
            />
            <SettingsInfoRow
              icon={ShieldCheck}
              title="Reports and moderation"
              description="Reports are sent to OwlNet moderators for review and are not displayed in the community feed."
            />
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div id="settings-panel-preferences" role="tabpanel" aria-label="Display preferences">
          <h2 className="font-display mb-4 text-xl font-bold text-[color:var(--color-text-primary)]">
            Preferences
          </h2>

          <div className="settings-list">
            <button type="button" onClick={onThemeToggle} className="settings-row">
              <span className="flex min-w-0 items-center gap-3">
                <span className="settings-row-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-3)] text-[color:var(--color-accent)]">
                  {theme === 'dark' ? (
                    <Moon size={17} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Sun size={17} strokeWidth={2} aria-hidden="true" />
                  )}
                </span>
                <span>
                  <span className="settings-title block">Display mode</span>
                  <span className="settings-subtitle block">
                    Currently using {theme === 'dark' ? 'dark mode' : 'light mode'}.
                  </span>
                </span>
              </span>

              <span className="settings-inline-action button-secondary button-compact shrink-0">
                Switch to {theme === 'dark' ? 'light' : 'dark'}
              </span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div
          id="settings-panel-notifications"
          role="tabpanel"
          aria-label="Notification information"
        >
          <h2 className="font-display mb-2 text-xl font-bold text-[color:var(--color-text-primary)]">
            Notifications
          </h2>
          <p className="mb-4 text-sm text-[color:var(--color-text-muted)]">
            OwlNet currently uses in-app notifications only; there are no push notification
            subscriptions to manage.
          </p>

          <div className="settings-list">
            <SettingsInfoRow
              icon={Bell}
              title="Notification center"
              description="Use the bell in the university portal header to review activity available to your account."
            />
            <SettingsInfoRow
              icon={CheckCircle2}
              title="Read status"
              description="Choose Mark all as read in the notification panel to clear the unread indicator."
            />
            <SettingsInfoRow
              icon={Mail}
              title="Account emails"
              description="Verification and password-reset emails are handled separately from in-app notifications."
            />
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="modal-backdrop">
          <div
            className="report-dialog settings-delete-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
          >
            <h3 id="delete-account-title" className="font-display mb-2 text-xl font-bold">
              Delete account?
            </h3>

            <p id="delete-account-description" className="report-dialog-copy">
              This permanently deletes your account. Existing posts and comments will remain under
              the name Deleted User.
            </p>

            <label
              htmlFor="delete-account-confirmation"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]"
            >
              Type DELETE to confirm
            </label>

            <input
              id="delete-account-confirmation"
              value={deleteConfirmText}
              onChange={(event) => {
                setDeleteConfirmText(event.target.value);
                setDeleteError('');
              }}
              className="auth-input mb-3"
              placeholder="DELETE"
              aria-invalid={Boolean(deleteError)}
              autoComplete="off"
              autoFocus
            />

            {deleteError && (
              <div className="auth-error mb-3" role="alert">
                <AlertCircle size={17} aria-hidden="true" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="button-secondary"
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                className="vote-btn danger"
                disabled={deleting}
              >
                <Trash2 size={15} aria-hidden="true" />
                {deleting ? 'Deleting...' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
