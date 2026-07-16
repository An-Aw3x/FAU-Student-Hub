import { useState } from 'react';
import { TAGS } from '../data/mockData';

// ── Icons ──────────────────────────────────────────────────
const SparkleIcon = () => (
  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

const BookIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const RulesIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
  </svg>
);

const TrendIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

const COMMUNITY_LINKS = [
  { id: 'rules',    label: 'Community Guidelines',  icon: <RulesIcon />,  href: '#rules' },
  { id: 'trending', label: 'Trending This Week',    icon: <TrendIcon />,  href: '#trending' },
  { id: 'wiki',     label: 'FAU Student Wiki',      icon: <BookIcon />,   href: '#wiki' },
];

export default function LeftSidebar({ activeTag, onTagChange, aiSummaryEnabled, onAiToggle, mobileOpen }) {
  return (
    <aside
      id="left-sidebar"
      className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] overflow-y-auto z-40
        w-64 p-4 flex flex-col gap-4
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-auto lg:overflow-visible lg:z-auto
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
      aria-label="Left sidebar navigation"
    >
      {/* ── AI Summary Toggle ──────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(0,63,138,0.25), rgba(212, 55, 55, 0.1))',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <SparkleIcon />
              <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                AI Thread Summary
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              Get a quick AI-powered TL;DR for each post
            </p>
          </div>
          <label className="toggle-switch shrink-0 mt-0.5" aria-label="Toggle AI summaries">
            <input
              id="ai-summary-toggle"
              type="checkbox"
              checked={aiSummaryEnabled}
              onChange={onAiToggle}
            />
            <span className="toggle-slider" />
          </label>
        </div>
        {aiSummaryEnabled && (
          <div
            className="mt-3 text-xs rounded-xl px-3 py-2 animate-fade-in"
            style={{
              color: 'var(--color-accent-light)',
              background: 'linear-gradient(135deg, rgba(0,63,138,0.25), rgba(212, 55, 55, 0.1))',
            }}
          >
            ✨ AI summaries are <strong>ON</strong> — look for the 🦉 badge on posts!
          </div>
        )}
      </div>

      {/* ── Browse by Tag ──────────────────────────────────── */}
      <nav aria-label="Browse by tag">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
          style={{ color: 'var(--color-text-muted)' }}>
          Browse Topics
        </h2>
        <div className="flex flex-col gap-0.5">
          {TAGS.map(tag => (
            <button
              key={tag.id}
              id={`tag-${tag.id}`}
              onClick={() => onTagChange(tag.id)}
              className={`sidebar-link w-full text-left ${activeTag === tag.id ? 'active' : ''}`}
              aria-pressed={activeTag === tag.id}
            >
              <span className="text-base leading-none">{tag.icon}</span>
              <span>{tag.label}</span>
              {activeTag === tag.id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--color-owl-blue-light)' }} />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Divider ────────────────────────────────────────── */}
      <div className="h-px" style={{ background: 'var(--color-border)' }} />

      {/* ── Community Links ────────────────────────────────── */}
      <nav aria-label="Community links">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
          style={{ color: 'var(--color-text-muted)' }}>
          Community
        </h2>
        <div className="flex flex-col gap-0.5">
          {COMMUNITY_LINKS.map(link => (
            <a
              key={link.id}
              id={`community-${link.id}`}
              href={link.href}
              className="sidebar-link"
            >
              <span style={{ color: 'var(--color-owl-blue-light)' }}>{link.icon}</span>
              <span>{link.label}</span>
            </a>
          ))}

          {/* TOS / Community Guidelines highlighted link */}
          <a
            id="tos-link"
            href="#tos"
            className="sidebar-link mt-2 text-xs"
            style={{ borderColor: 'rgba(212,175,55,0.2)', color: 'var(--color-owl-gold)' }}
          >
            <span>📜</span>
            <span>Terms of Service (TOS)</span>
          </a>
        </div>
      </nav>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="mt-auto pt-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <p>© 2025 OwlNet · FAU Student Forum</p>
        <p className="mt-1">Made with 🦉 by FAU students</p>
      </div>
    </aside>
  );
}
