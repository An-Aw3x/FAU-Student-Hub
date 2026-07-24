import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
const SearchIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const XIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const DraftIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
    <path d="M5 4H3v3a4 4 0 0 0 4 4" />
    <path d="M19 4h2v3a4 4 0 0 1-4 4" />
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
  </svg>
);

const SunIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
    <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
    <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

const SORT_OPTIONS = ['Hot 🔥', 'New 🆕', 'Top ⬆️', 'Rising 📈'];
const FILTER_OPTIONS = ['All Categories', 'Housing', 'Classes', 'Campus Life', 'Jobs', 'Events'];

export default function Navbar({
  theme,
  onThemeToggle,
  onMenuToggle,
  mobileMenuOpen,
  onSearch,
  searchQuery,
  onNavigateProfile,
  onNavigateSettings,
  onNavigateFeed,
  onShowLogin,
  onShowRegister,
}) {  const { user, isLoggedIn, logout } = useAuth();

  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Hot 🔥');
  const [selectedFilter, setSelectedFilter] = useState('All Categories');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const sortRef = useRef(null);
  const filterRef = useRef(null);
  const userMenuRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
  };

  const handleProfile = () => {
    setUserMenuOpen(false);
    onNavigateProfile?.();
  };

  const handleSettings = () => {
    setUserMenuOpen(false);
    onNavigateSettings?.();
  };

  const handleFeed = () => {
    setUserMenuOpen(false);
    onNavigateFeed?.();
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${
        theme === "dark" ? "navbar-dark" : "navbar-light"
      }`}
    >
      <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center gap-3">
        <button
          id="mobile-menu-btn"
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-3)] transition-all"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
        </button>
        <a href="#" id="fau-owl-logo" className="flex items-center gap-2 shrink-0 select-none" onClick={(e) => { e.preventDefault(); handleFeed(); }}>
          <img
            src="/fau-owl-logo.png"
            alt="FAU Logo"
            className="w-8 h-8 object-contain"
          />
          <span
            className="font-display font-800 text-xl tracking-tight hidden sm:inline-block"
            style={{
              background: "linear-gradient(135deg, #72abfc, #fd6b6b)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            }}
          >
            OwlNet
          </span>
          <span className="text-xs font-semibold hidden md:block px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,63,138,0.3)', color: '#7EB3FF', border: '1px solid rgba(18,85,179,0.3)' }}>
            FAU
          </span>
        </a>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="search-bar flex items-center gap-2 flex-1 px-4 py-2 min-w-0">
            <span className="text-[color:var(--color-text-muted)] shrink-0"><SearchIcon /></span>
            <input
              id="main-search"
              type="text"
              placeholder="Search posts, tags, users…"
              className="flex-1 text-sm bg-transparent border-none outline-none min-w-0"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              aria-label="Search posts"
            />
          </div>
          <div ref={sortRef} className="relative hidden sm:block shrink-0">
            <button
              id="sort-dropdown-btn"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              onClick={() => { setSortOpen(p => !p); setFilterOpen(false); }}
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
            >
              <span>{selectedSort}</span>
              <ChevronIcon />
            </button>
            {sortOpen && (
              <div className="dropdown-menu absolute right-0 top-full mt-1 w-40 z-50 animate-slide-down" role="listbox">
                {SORT_OPTIONS.map(o => (
                  <div
                    key={o}
                    className="dropdown-item"
                    role="option"
                    aria-selected={selectedSort === o}
                    onClick={() => { setSelectedSort(o); setSortOpen(false); }}
                  >
                    {o}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div ref={filterRef} className="relative hidden md:block shrink-0">
            <button
              id="filter-dropdown-btn"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              onClick={() => { setFilterOpen(p => !p); setSortOpen(false); }}
              aria-expanded={filterOpen}
              aria-haspopup="listbox"
            >
              <span>{selectedFilter}</span>
              <ChevronIcon />
            </button>
            {filterOpen && (
              <div className="dropdown-menu absolute right-0 top-full mt-1 w-48 z-50 animate-slide-down" role="listbox">
                {FILTER_OPTIONS.map(o => (
                  <div
                    key={o}
                    className="dropdown-item"
                    role="option"
                    aria-selected={selectedFilter === o}
                    onClick={() => { setSelectedFilter(o); setFilterOpen(false); }}
                  >
                    {o}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {isLoggedIn && user ? (
            <>
              <button
                id="notification-btn"
                className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all"
                style={{ color: 'var(--color-text-secondary)' }}
                aria-label="Notifications"
              >
                <BellIcon />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ background: 'var(--color-accent)' }} />
              </button>
              <div ref={userMenuRef} className="relative">
                <button
                  id="user-avatar-btn"
                  onClick={() => setUserMenuOpen(p => !p)}
                  className="flex items-center gap-2 px-2 py-1 rounded-xl transition-all hover:bg-[color:var(--color-surface-3)]"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full avatar-ring object-cover"
                  />
                  <span className="text-sm font-semibold hidden md:block" style={{ color: 'var(--color-text-primary)' }}>
                    {user.username}
                  </span>
                  <ChevronIcon />
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown absolute right-0 top-full mt-2 w-64 z-50 animate-slide-down" role="menu">
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {user.username}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        id="nav-profile-btn"
                        onClick={handleProfile}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all text-left"
                        style={{ color: 'var(--color-text-secondary)' }}
                        role="menuitem"
                      >
                        <UserIcon />
                        View Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onThemeToggle?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all text-left"
                        style={{ color: 'var(--color-text-secondary)' }}
                        role="menuitem"
                      >
                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                      </button>

                      <button
                        type="button"
                        onClick={handleSettings}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all text-left"
                        style={{ color: 'var(--color-text-secondary)' }}
                        role="menuitem"
                      >
                        <SettingsIcon />
                        Account Settings
                      </button>

                      <div style={{ borderTop: '1px solid var(--color-border)' }}>
                        <button
                          type="button"
                          id="nav-logout-btn"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all text-left"
                          style={{ color: '#F87171' }}
                          role="menuitem"
                        >
                          <LogoutIcon />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="nav-login-btn"
                onClick={onShowLogin}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
              >
                Log In
              </button>
              <button
                type="button"
                id="nav-signup-btn"
                onClick={onShowRegister}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, var(--color-owl-blue), var(--color-owl-blue-light))', color: 'white' }}
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
