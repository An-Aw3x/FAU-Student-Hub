import { MOCK_USERS, TAGS } from '../data/mockData';

// ── Icons ──────────────────────────────────────────────────
const FireIcon = () => (
  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C9.243 2 7 4.243 7 7c0 1.657.672 3.157 1.757 4.243C7.62 12.38 7 14.12 7 16c0 2.757 2.243 5 5 5s5-2.243 5-5c0-1.88-.62-3.62-1.757-4.757A4.978 4.978 0 0 0 17 7c0-2.757-2.243-5-5-5z"/>
  </svg>
);

// ── Trending Posts ──────────────────────────────────────────
const TRENDING_POSTS = [
  { id: 1, title: 'Off-campus housing guide near Boca 🏠',          votes: 284, tag: 'housing'  },
  { id: 3, title: 'FAU Career Fair confirmed companies 🎉',          votes: 312, tag: 'events'   },
  { id: 4, title: 'Parking situation is BRUTAL this semester 😤',    votes: 498, tag: 'rants'    },
  { id: 5, title: 'Best eats on/near campus under $10 🍕',          votes: 203, tag: 'food'     },
  { id: 2, title: 'COP3530 with Prof. Tavana — worth it? 📚',       votes: 156, tag: 'classes'  },
];

// ── Active Users ────────────────────────────────────────────
const ACTIVE_USERS = MOCK_USERS.slice(0, 4);

// ── Stats ───────────────────────────────────────────────────
const STATS = [
  { label: 'Members',  value: '4,821'  },
  { label: 'Online',   value: '143'    },
  { label: 'Posts Today', value: '67'  },
];

const TAG_COLOR_MAP = {
  housing: '#60A5FA',
  events:  '#34D399',
  rants:   '#F87171',
  food:    '#FBBF24',
  classes: '#A78BFA',
  campus:  '#38BDF8',
  jobs:    '#4ADE80',
  tech:    '#818CF8',
};

export default function RightSidebar() {
  return (
    <aside
      id="right-sidebar"
      className="hidden xl:flex flex-col gap-4 w-72 shrink-0"
      aria-label="Right sidebar"
    >
      {/* ── Community Stats ──────────────────────────────── */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            🦉 OwlNet Community
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.2)' }}>
            ● Live
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
          The unofficial FAU student community
        </p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {STATS.map(s => (
            <div key={s.label} className="rounded-xl p-2 text-center"
              style={{ background: 'var(--color-surface-3)' }}>
              <div className="font-bold text-base font-display" style={{ color: 'var(--color-text-primary)' }}>
                {s.value}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <button
          id="join-community-btn"
          className="w-full py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, var(--color-owl-blue), var(--color-owl-blue-light))', color: 'white' }}
        >
          Join Community
        </button>
      </div>

      {/* ── Trending ─────────────────────────────────────── */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2"
          style={{ color: 'var(--color-text-primary)' }}>
          <FireIcon />
          Trending Now
        </h2>
        <div className="flex flex-col gap-3">
          {TRENDING_POSTS.map((post, idx) => (
            <a
              key={post.id}
              href="#"
              id={`trending-post-${post.id}`}
              className="flex gap-3 items-start group"
              style={{ textDecoration: 'none' }}
            >
              <span className="font-bold text-sm w-5 shrink-0 mt-0.5"
                style={{ color: idx === 0 ? 'var(--color-owl-gold)' : 'var(--color-text-muted)' }}>
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium leading-snug mb-1 group-hover:text-[color:var(--color-owl-gold-light)] transition-colors"
                  style={{ color: 'var(--color-text-primary)' }}>
                  {post.title}
                </p>
                <div className="flex items-center gap-2">
                  <span className="tag-chip text-[10px]"
                    style={{ color: TAG_COLOR_MAP[post.tag] || '#7EB3FF', padding: '1px 6px' }}>
                    #{post.tag}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    ⬆️ {post.votes}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── Active Members ────────────────────────────────── */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <h2 className="font-display font-bold text-sm mb-3" style={{ color: 'var(--color-text-primary)' }}>
          👥 Active Now
        </h2>
        <div className="flex flex-col gap-3">
          {ACTIVE_USERS.map(u => (
            <div key={u.id} className="flex items-center gap-3">
              <div className="relative">
                <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full avatar-ring" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                  style={{ background: '#4ADE80', borderColor: 'var(--color-surface-2)' }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {u.name}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {u.handle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Popular Tags ─────────────────────────────────── */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <h2 className="font-display font-bold text-sm mb-3" style={{ color: 'var(--color-text-primary)' }}>
          🏷️ Popular Tags
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TAG_COLOR_MAP).map(([tag, color]) => (
            <span key={tag} className="tag-chip" style={{ color }}>
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
