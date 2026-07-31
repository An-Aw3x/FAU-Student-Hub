import {
  Bell,
  Bookmark,
  CheckCheck,
  FileText,
  Heart,
  MessageCircle,
  Shield,
  User,
  X,
} from 'lucide-react';

const NOTIFICATION_ICONS = {
  account: User,
  comment: MessageCircle,
  like: Heart,
  post: FileText,
  report: Shield,
  saved: Bookmark,
};

function NotificationIcon({ type }) {
  const Icon = NOTIFICATION_ICONS[type] || Bell;
  return <Icon size={16} strokeWidth={2} aria-hidden="true" />;
}

export default function NotificationsPanel({
  id,
  notifications = [],
  onClose,
  onMarkAllRead,
  onNotificationSelect,
  sourceLabel,
}) {
  const unreadCount = notifications.filter(notification => !notification.read).length;

  const renderNotificationContent = (notification) => (
    <>
      <span
        className="navbar-notification-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        aria-hidden="true"
      >
        <NotificationIcon type={notification.type} />
      </span>
      <span className="navbar-notification-copy flex min-w-0 flex-1 flex-col">
        <span className="navbar-notification-title text-sm font-semibold">
          {notification.title}
        </span>
        {notification.message && (
          <span className="navbar-notification-message mt-0.5 text-xs">
            {notification.message}
          </span>
        )}
        {(notification.timeLabel || notification.time) && (
          <span className="navbar-notification-time mt-1 text-xs">
            {notification.timeLabel || notification.time}
          </span>
        )}
      </span>
      {!notification.read && (
        <span
          className="navbar-notification-unread mt-1.5 h-2 w-2 shrink-0 rounded-full"
          aria-label="Unread notification"
        />
      )}
    </>
  );

  return (
    <section
      id={id}
      className="navbar-notifications-panel user-dropdown absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-1rem))] animate-slide-down"
      role="dialog"
      aria-labelledby={`${id}-title`}
    >
      <header className="navbar-notifications-header flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 id={`${id}-title`} className="text-sm font-bold">
            Notifications
          </h2>
          <p className="navbar-notifications-summary mt-0.5 text-xs" aria-live="polite">
            {unreadCount === 0
              ? 'You are all caught up'
              : `${unreadCount} unread ${unreadCount === 1 ? 'update' : 'updates'}`}
          </p>
        </div>

        <div className="navbar-notifications-actions flex items-center gap-1">
          {unreadCount > 0 && onMarkAllRead && (
            <button
              type="button"
              className="navbar-notifications-mark-all flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold"
              onClick={onMarkAllRead}
            >
              <CheckCheck size={14} strokeWidth={2} aria-hidden="true" />
              Mark all read
            </button>
          )}
          <button
            type="button"
            className="navbar-notifications-close flex h-8 w-8 items-center justify-center rounded-md"
            onClick={onClose}
            aria-label="Close notifications"
            autoFocus
          >
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </header>

      {notifications.length > 0 ? (
        <ul className="navbar-notifications-list max-h-96 overflow-y-auto" role="list">
          {notifications.map(notification => (
            <li
              key={notification.id}
              className={notification.read ? 'is-read' : 'is-unread'}
            >
              {onNotificationSelect ? (
                <button
                  type="button"
                  className="navbar-notification-item flex w-full items-start gap-3 border-b px-4 py-3 text-left"
                  onClick={() => {
                    onNotificationSelect(notification);
                    onClose?.();
                  }}
                  aria-label={`${notification.read ? '' : 'Unread: '}${notification.title}`}
                >
                  {renderNotificationContent(notification)}
                </button>
              ) : (
                <div className="navbar-notification-item flex items-start gap-3 border-b px-4 py-3">
                  {renderNotificationContent(notification)}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="navbar-notifications-empty px-6 py-8 text-center">
          <Bell className="mx-auto" size={24} strokeWidth={1.7} aria-hidden="true" />
          <p className="mt-3 text-sm font-bold">No new notifications</p>
          <p className="mt-1 text-xs">
            Updates about your OwlNet activity will appear here.
          </p>
        </div>
      )}

      {sourceLabel && (
        <footer className="navbar-notifications-source border-t px-4 py-2 text-xs">
          {sourceLabel}
        </footer>
      )}
    </section>
  );
}
