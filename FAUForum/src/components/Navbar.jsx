import { useState, useRef, useEffect } from 'react';
import { LOGGED_IN_USER } from '../data/mockData';

// ── Icons ──────────────────────────────────────────────────
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

// ── Sort Options ───────────────────────────────────────────
const SORT_OPTIONS = ['Hot 🔥', 'New 🆕', 'Top ⬆️', 'Rising 📈'];
const FILTER_OPTIONS = ['All Categories', 'Housing', 'Classes', 'Campus Life', 'Jobs', 'Events'];

export default function Navbar({ theme, onThemeToggle, isLoggedIn, onAuthToggle, onMenuToggle, mobileMenuOpen, onSearch, searchQuery }) {
  console.log(theme);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Hot 🔥');
  const [selectedFilter, setSelectedFilter] = useState('All Categories');

  const sortRef = useRef(null);
  const filterRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${
        theme === "dark" ? "navbar-dark" : "navbar-light"
      }`}
    >
      <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center gap-3">

        {/* Mobile menu toggle */}
        <button
          id="mobile-menu-btn"
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-3)] transition-all"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
        </button>

        {/* OwlNet Logo */}
        <a href="#" id="owlnet-logo" className="flex items-center gap-2 shrink-0 select-none">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-bold animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #003F8A, #D4AF37)' }}>
            🦉
          </div>
          <span className="font-display font-800 text-xl tracking-tight hidden sm:block"
            style={{ background: 'linear-gradient(135deg, #7EB3FF, #F0CC5A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            OwlNet
          </span>
          <span className="text-xs font-semibold hidden md:block px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,63,138,0.3)', color: '#7EB3FF', border: '1px solid rgba(18,85,179,0.3)' }}>
            FAU
          </span>
        </a>

        {/* Search Bar */}
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

          {/* Sort Dropdown */}
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

          {/* Filter Dropdown */}
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

        {/* Theme Toggle */}
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={theme === "dark"}
            onChange={onThemeToggle}
            aria-label="ToggleD dark mode"
          />
          <span className="toggle-slider"></span>
        </label>

        {/* Auth Section */}
        <div className="flex items-center gap-2 shrink-0">
          {isLoggedIn ? (
            <>
              {/* Notification Bell */}
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

              {/* User Avatar */}
              <button
                id="user-avatar-btn"
                onClick={onAuthToggle}
                className="flex items-center gap-2 px-2 py-1 rounded-xl transition-all hover:bg-[color:var(--color-surface-3)]"
                title="Click to sign out (demo)"
              >
                <img
                  src={LOGGED_IN_USER.avatar}
                  alt={LOGGED_IN_USER.name}
                  className="w-8 h-8 rounded-full avatar-ring"
                />
                <span className="text-sm font-semibold hidden md:block" style={{ color: 'var(--color-text-primary)' }}>
                  {LOGGED_IN_USER.name}
                </span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="login-btn"
                onClick={onAuthToggle}
                className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
              >
                Log In
              </button>
              <button
                id="signup-btn"
                onClick={onAuthToggle}
                className="px-3 py-1.5 rounded-xl text-sm font-bold transition-all"
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
