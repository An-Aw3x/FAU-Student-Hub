import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  SlidersHorizontal,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAvatarOrDefault, handleAvatarError } from '../utils/avatar';
import NotificationsPanel from './NotificationsPanel';

const SORT_OPTIONS = [
  { value: 'hot', label: 'Hot' },
  { value: 'new', label: 'New' },
  { value: 'top', label: 'Top' },
];

const DEFAULT_CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'housing', label: 'Housing' },
  { value: 'classes', label: 'Classes' },
  { value: 'campus', label: 'Campus Life' },
  { value: 'jobs', label: 'Jobs & Internships' },
  { value: 'events', label: 'Events' },
  { value: 'sports', label: 'Sports' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'safety', label: 'Safety' },
  { value: 'tech', label: 'Tech & CS' },
  { value: 'health', label: 'Health' },
  { value: 'rants', label: 'Rants' },
];

export default function Navbar({
  theme,
  onThemeToggle,
  onMenuToggle,
  mobileMenuOpen,
  onSearch,
  searchQuery = '',
  showFeedControls = true,
  sortMode = 'hot',
  onSortChange,
  activeCategory = 'all',
  onCategoryChange,
  categoryOptions = DEFAULT_CATEGORY_OPTIONS,
  notifications = [],
  onMarkAllNotificationsRead,
  onNotificationSelect,
  notificationSourceLabel,
  onNavigateProfile,
  onNavigateSettings,
  onNavigateFeed,
  onShowLogin,
  onShowRegister,
}) {
  const { user, isLoggedIn, logout } = useAuth();

  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const sortRef = useRef(null);
  const filterRef = useRef(null);
  const notificationsRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(event.target)) setFilterOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setUserMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;

      setSortOpen(false);
      setFilterOpen(false);
      setUserMenuOpen(false);

      if (notificationsOpen) {
        setNotificationsOpen(false);
        notificationButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [notificationsOpen]);

  const selectedSort =
    SORT_OPTIONS.find(option => option.value === sortMode) || SORT_OPTIONS[0];
  const selectedCategory =
    categoryOptions.find(option => option.value === activeCategory) ||
    {
      value: activeCategory,
      label: activeCategory === 'all' ? 'All Categories' : `#${activeCategory}`,
    };
  const unreadNotificationCount = notifications.filter(notification => !notification.read).length;

  const closeOtherMenus = () => {
    setSortOpen(false);
    setFilterOpen(false);
    setNotificationsOpen(false);
    setUserMenuOpen(false);
  };

  const handleSortSelect = (value) => {
    onSortChange?.(value);
    setSortOpen(false);
  };

  const handleCategorySelect = (value) => {
    onCategoryChange?.(value);
    setFilterOpen(false);
  };

  const handleLogout = () => {
    closeOtherMenus();
    logout();
  };

  const handleProfile = () => {
    closeOtherMenus();
    onNavigateProfile?.();
  };

  const handleSettings = () => {
    closeOtherMenus();
    onNavigateSettings?.();
  };

  const handleFeed = () => {
    closeOtherMenus();
    onNavigateFeed?.();
  };

  return (
    <header
      className={`owl-portal-header fixed inset-x-0 top-0 z-50 ${
        theme === 'dark' ? 'navbar-dark' : 'navbar-light'
      }`}
    >
      <div className="navbar-shell mx-auto flex h-16 max-w-screen-xl items-center gap-3 px-4">
        <button
          id="mobile-menu-btn"
          type="button"
          className="navbar-mobile-toggle flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors lg:hidden"
          onClick={onMenuToggle}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="left-sidebar"
        >
          {mobileMenuOpen ? (
            <X size={21} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Menu size={21} strokeWidth={2} aria-hidden="true" />
          )}
        </button>

        <a
          href="#"
          id="fau-owl-logo"
          className="navbar-brand flex shrink-0 select-none items-center gap-2.5"
          onClick={(event) => {
            event.preventDefault();
            handleFeed();
          }}
          aria-label="OwlNet home"
        >
          <img
            src="/fau-owl-logo.png"
            alt=""
            className="navbar-brand-mark h-8 w-8 object-contain"
          />
          <span className="navbar-brand-copy hidden min-w-0 flex-col leading-none sm:flex">
            <span className="navbar-brand-name text-base font-bold tracking-tight">
              OwlNet
            </span>
            <span className="navbar-brand-descriptor mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.14em] lg:block">
              FAU Student Forum
            </span>
          </span>
        </a>

        <div className="navbar-tools flex min-w-0 flex-1 items-center gap-2">
          <label className="navbar-search search-bar flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
            <Search
              className="navbar-search-icon shrink-0"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              id="main-search"
              type="text"
              placeholder={
                onSearch
                  ? 'Search posts, comments, profiles, and topics'
                  : 'Sign in to search'
              }
              className="navbar-search-input min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
              value={searchQuery}
              onChange={(event) => onSearch?.(event.target.value)}
              disabled={!onSearch}
              aria-label="Search OwlNet"
            />
          </label>

          {showFeedControls && (
          <div ref={sortRef} className="navbar-dropdown relative hidden shrink-0 sm:block">
            <button
              id="sort-dropdown-btn"
              type="button"
              className="navbar-control flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors"
              onClick={() => {
                if (!onSortChange) return;
                setSortOpen((previous) => !previous);
                setFilterOpen(false);
                setNotificationsOpen(false);
                setUserMenuOpen(false);
              }}
              disabled={!onSortChange}
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
              aria-controls="navbar-sort-options"
            >
              <SlidersHorizontal size={14} strokeWidth={2} aria-hidden="true" />
              <span>{selectedSort.label}</span>
              <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
            </button>

            {sortOpen && (
              <div
                id="navbar-sort-options"
                className="navbar-dropdown-menu dropdown-menu absolute right-0 top-full z-50 mt-1 w-40 animate-slide-down"
                role="listbox"
                aria-label="Sort posts"
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="dropdown-item w-full text-left"
                    role="option"
                    aria-selected={sortMode === option.value}
                    onClick={() => handleSortSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {showFeedControls && (
          <div ref={filterRef} className="navbar-dropdown relative hidden shrink-0 md:block">
            <button
              id="filter-dropdown-btn"
              type="button"
              className="navbar-control flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors"
              onClick={() => {
                if (!onCategoryChange) return;
                setFilterOpen((previous) => !previous);
                setSortOpen(false);
                setNotificationsOpen(false);
                setUserMenuOpen(false);
              }}
              disabled={!onCategoryChange}
              aria-expanded={filterOpen}
              aria-haspopup="listbox"
              aria-controls="navbar-category-options"
            >
              <span>{selectedCategory.label}</span>
              <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
            </button>

            {filterOpen && (
              <div
                id="navbar-category-options"
                className="navbar-dropdown-menu dropdown-menu absolute right-0 top-full z-50 mt-1 w-48 animate-slide-down"
                role="listbox"
                aria-label="Filter posts by category"
              >
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="dropdown-item w-full text-left"
                    role="option"
                    aria-selected={activeCategory === option.value}
                    onClick={() => handleCategorySelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}
        </div>

        <div className="navbar-actions flex shrink-0 items-center gap-2">
          {isLoggedIn && user ? (
            <>
              <div ref={notificationsRef} className="navbar-notifications relative">
                <button
                  ref={notificationButtonRef}
                  id="notification-btn"
                  type="button"
                  className="navbar-icon-button relative flex h-9 w-9 items-center justify-center rounded-md transition-colors"
                  onClick={() => {
                    setNotificationsOpen(previous => !previous);
                    setSortOpen(false);
                    setFilterOpen(false);
                    setUserMenuOpen(false);
                  }}
                  aria-label={
                    unreadNotificationCount > 0
                      ? `Notifications, ${unreadNotificationCount} unread`
                      : 'Notifications'
                  }
                  aria-expanded={notificationsOpen}
                  aria-haspopup="dialog"
                  aria-controls="navbar-notifications-panel"
                >
                  <Bell size={18} strokeWidth={2} aria-hidden="true" />
                  {unreadNotificationCount > 0 && (
                    <span
                      className="navbar-notification-dot absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </button>

                {notificationsOpen && (
                  <NotificationsPanel
                    id="navbar-notifications-panel"
                    notifications={notifications}
                    onClose={() => {
                      setNotificationsOpen(false);
                      notificationButtonRef.current?.focus();
                    }}
                    onMarkAllRead={onMarkAllNotificationsRead}
                    onNotificationSelect={onNotificationSelect}
                    sourceLabel={notificationSourceLabel}
                  />
                )}
              </div>

              <div ref={userMenuRef} className="navbar-user-menu relative">
                <button
                  id="user-avatar-btn"
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(previous => !previous);
                    setSortOpen(false);
                    setFilterOpen(false);
                    setNotificationsOpen(false);
                  }}
                  className="navbar-user-trigger flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <img
                    src={getAvatarOrDefault(user.avatar)}
                    alt=""
                    className="navbar-user-avatar avatar-ring h-8 w-8 rounded-full object-cover"
                    onError={handleAvatarError}
                  />
                  <span className="navbar-username hidden max-w-28 truncate text-sm font-semibold md:block">
                    {user.username}
                  </span>
                  <ChevronDown
                    className="hidden md:block"
                    size={14}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="sr-only">Open account menu for {user.username}</span>
                </button>

                {userMenuOpen && (
                  <div
                    className="navbar-account-menu user-dropdown absolute right-0 top-full z-50 mt-2 w-64 animate-slide-down"
                    role="menu"
                  >
                    <div className="navbar-account-summary border-b px-4 py-3">
                      <p className="truncate text-sm font-bold">{user.username}</p>
                      <p className="mt-0.5 truncate text-xs">{user.email}</p>
                    </div>

                    <div className="navbar-account-actions py-1">
                      <button
                        type="button"
                        id="nav-profile-btn"
                        onClick={handleProfile}
                        className="navbar-account-action flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors"
                        role="menuitem"
                      >
                        <User size={15} strokeWidth={2} aria-hidden="true" />
                        View Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onThemeToggle?.();
                        }}
                        className="navbar-account-action flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors"
                        role="menuitem"
                      >
                        {theme === 'dark' ? (
                          <Sun size={15} strokeWidth={2} aria-hidden="true" />
                        ) : (
                          <Moon size={15} strokeWidth={2} aria-hidden="true" />
                        )}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                      </button>

                      <button
                        type="button"
                        onClick={handleSettings}
                        className="navbar-account-action flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors"
                        role="menuitem"
                      >
                        <Settings size={15} strokeWidth={2} aria-hidden="true" />
                        Account Settings
                      </button>

                      <div className="navbar-account-divider border-t">
                        <button
                          type="button"
                          id="nav-logout-btn"
                          onClick={handleLogout}
                          className="navbar-account-action navbar-logout-action flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors"
                          role="menuitem"
                        >
                          <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="navbar-auth-actions flex items-center gap-2">
              <button
                type="button"
                id="nav-login-btn"
                onClick={onShowLogin}
                className="navbar-login-button rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:px-4"
              >
                Log In
              </button>
              <button
                type="button"
                id="nav-signup-btn"
                onClick={onShowRegister}
                className="navbar-signup-button rounded-md px-3 py-2 text-sm font-bold transition-colors sm:px-4"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
