import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUp,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  ExternalLink,
  Flame,
  MessageSquare,
  Tags,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAvatarOrDefault, handleAvatarError } from '../utils/avatar';
import {
  getPostActivity,
  getTrendingPosts,
  getTrendingTags,
} from '../utils/trending';

const API_BASE = 'http://localhost:3001';

const CAMPUS_LINKS = [
  { label: 'MyFAU', href: 'https://myfau.fau.edu/', icon: Building2 },
  { label: 'Canvas', href: 'https://canvas.fau.edu/', icon: BookOpen },
  {
    label: 'Academic Calendar',
    href: 'https://www.fau.edu/registrar/calendar/',
    icon: CalendarDays,
  },
  { label: 'Campus Events', href: 'https://calendar.fau.edu/', icon: Calendar },
];

async function fetchCommunityData(userEmail) {
  const emailQuery = userEmail ? `?email=${encodeURIComponent(userEmail)}` : '';
  const [statsResponse, activeResponse] = await Promise.all([
    fetch(`${API_BASE}/api/community/stats${emailQuery}`),
    fetch(`${API_BASE}/api/community/active-users`),
  ]);

  const stats = statsResponse.ok ? await statsResponse.json() : null;
  const activeUsers = activeResponse.ok ? await activeResponse.json() : null;

  return { stats, activeUsers };
}

function normalizeCommunityStats(stats) {
  return {
    memberCount: stats.memberCount || 0,
    onlineCount: stats.onlineCount || 0,
    postsToday: stats.postsToday || 0,
  };
}

export default function RightSidebar({
  onOpenCommunity,
  posts = [],
  onOpenPost,
  onFilterTag,
}) {
  const { user } = useAuth();
  const userEmail = user?.email;

  const [communityStats, setCommunityStats] = useState({
    memberCount: 0,
    onlineCount: 0,
    postsToday: 0,
  });

  const [activeUsers, setActiveUsers] = useState([]);
  const [communityDataAvailable, setCommunityDataAvailable] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchCommunityData(userEmail)
      .then(({ stats, activeUsers: currentActiveUsers }) => {
        if (cancelled) return;

        if (stats) {
          setCommunityStats(normalizeCommunityStats(stats));
        }

        if (currentActiveUsers) {
          setActiveUsers(currentActiveUsers);
        }

        setCommunityDataAvailable(Boolean(stats || currentActiveUsers));
      })
      .catch(error => {
        console.error('Could not load community data:', error);
        setCommunityDataAvailable(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) return;

    let cancelled = false;

    const sendHeartbeat = async () => {
      try {
        await fetch(`${API_BASE}/api/users/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
          }),
        });

        const { stats, activeUsers: currentActiveUsers } =
          await fetchCommunityData(userEmail);

        if (cancelled) return;

        if (stats) {
          setCommunityStats(normalizeCommunityStats(stats));
        }

        if (currentActiveUsers) {
          setActiveUsers(currentActiveUsers);
        }

        setCommunityDataAvailable(Boolean(stats || currentActiveUsers));
      } catch (error) {
        console.error('Could not update online status:', error);
        if (!cancelled) {
          setCommunityDataAvailable(false);
        }
      }
    };

    sendHeartbeat();

    const intervalId = setInterval(sendHeartbeat, 60000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [userEmail]);

  const communityStatItems = [
    {
      label: 'Members',
      value: communityDataAvailable ? communityStats.memberCount.toLocaleString() : '—',
    },
    {
      label: 'Online',
      value: communityDataAvailable ? communityStats.onlineCount.toLocaleString() : '—',
    },
    {
      label: 'Posts Today',
      value: communityDataAvailable ? communityStats.postsToday.toLocaleString() : '—',
    },
  ];

  const trendingPosts = useMemo(() => getTrendingPosts(posts, 5), [posts]);
  const popularTags = useMemo(() => getTrendingTags(posts, 7), [posts]);

  return (
    <aside
      id="right-sidebar"
      className="right-sidebar hidden xl:flex flex-col gap-4 w-72 shrink-0"
      aria-label="Student resources and community activity"
    >
      <section
        className="sidebar-panel sidebar-community-panel rounded-lg p-4"
        aria-labelledby="owlnet-community-heading"
      >
        <div className="sidebar-section-header flex items-center justify-between gap-3 mb-2">
          <h2
            id="owlnet-community-heading"
            className="sidebar-section-heading font-display font-bold text-sm flex items-center gap-2"
          >
            <Users size={16} strokeWidth={2} aria-hidden="true" />
            OwlNet Community
          </h2>

          <span
            className={`sidebar-live-badge inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded ${
              communityDataAvailable === false
                ? 'is-unavailable'
                : communityDataAvailable === null
                  ? 'is-checking'
                  : ''
            }`}
          >
            <span
              className="sidebar-live-dot w-1.5 h-1.5 rounded-full"
              aria-hidden="true"
            />
            {communityDataAvailable === false
              ? 'Unavailable'
              : communityDataAvailable === null
                ? 'Checking'
                : 'Live'}
          </span>
        </div>

        <p className="sidebar-community-description text-xs leading-relaxed mb-4">
          Connect with the Florida Atlantic student community.
        </p>

        <div className="sidebar-stats-grid grid grid-cols-3 gap-2 mb-4">
          {communityStatItems.map((stat) => (
            <div
              key={stat.label}
              className="sidebar-stat-item rounded-md px-1 py-2.5 text-center"
            >
              <div className="sidebar-stat-value font-bold text-base font-display">
                {stat.value}
              </div>

              <div className="sidebar-stat-label text-[10px] leading-tight mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenCommunity}
          className="sidebar-community-cta w-full py-2.5 rounded-md text-sm font-bold transition-colors hover:opacity-90"
        >
          Explore Community
        </button>
      </section>

      <section
        className="sidebar-panel sidebar-campus-panel rounded-lg p-4"
        aria-labelledby="campus-links-heading"
      >
        <h2
          id="campus-links-heading"
          className="sidebar-section-heading font-display font-bold text-sm mb-3 flex items-center gap-2"
        >
          <Building2 size={16} strokeWidth={2} aria-hidden="true" />
          Campus Links
        </h2>

        <nav className="sidebar-campus-links flex flex-col" aria-label="Official FAU campus links">
          {CAMPUS_LINKS.map((link) => {
            const LinkIcon = link.icon;

            return (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="sidebar-campus-link flex items-center gap-2.5 py-2.5 border-t first:border-t-0 text-xs font-semibold transition-colors hover:text-[color:var(--color-owl-blue)]"
              >
                <LinkIcon
                  className="sidebar-campus-link-icon"
                  size={15}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
                <span className="flex-1">{link.label}</span>
                <ExternalLink
                  className="sidebar-campus-external-icon"
                  size={13}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </a>
            );
          })}
        </nav>
      </section>

      <section
        className="sidebar-panel sidebar-trending-panel rounded-lg p-4"
        aria-labelledby="trending-topics-heading"
      >
        <h2
          id="trending-topics-heading"
          className="sidebar-section-heading font-display font-bold text-sm mb-3 flex items-center gap-2"
        >
          <Flame size={16} strokeWidth={2} aria-hidden="true" />
          Trending Topics
        </h2>

        <div className="sidebar-trending-list flex flex-col">
          {trendingPosts.length > 0 ? (
            trendingPosts.map((post, index) => {
              const activity = getPostActivity(post);
              const primaryTag = (post.tags || [])[0];

              return (
                <button
                  key={post.id}
                  type="button"
                  id={`trending-post-${post.id}`}
                  onClick={() => onOpenPost?.(post.id)}
                  className="sidebar-trending-item group"
                  aria-label={`Open trending post: ${post.title}`}
                >
                  <span
                    className={`sidebar-trending-rank ${
                      index === 0 ? 'is-top' : ''
                    }`}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>

                  <span className="sidebar-trending-content">
                    <span className="sidebar-trending-title">{post.title}</span>

                    <span className="sidebar-trending-meta">
                      {primaryTag && (
                        <span className="sidebar-topic-tag">#{primaryTag}</span>
                      )}

                      <span
                        className="sidebar-topic-votes"
                        aria-label={`${activity.votes} votes`}
                      >
                        <ArrowUp size={11} strokeWidth={2} aria-hidden="true" />
                        {activity.votes}
                      </span>

                      <span
                        className="sidebar-topic-comments"
                        aria-label={`${activity.comments} comments`}
                      >
                        <MessageSquare size={11} strokeWidth={2} aria-hidden="true" />
                        {activity.comments}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="sidebar-trending-empty" role="status">
              <Flame size={18} strokeWidth={1.8} aria-hidden="true" />
              <p>No trending posts yet.</p>
            </div>
          )}
        </div>
      </section>

      <section
        className="sidebar-panel sidebar-active-panel rounded-lg p-4"
        aria-labelledby="active-now-heading"
      >
        <h2
          id="active-now-heading"
          className="sidebar-section-heading font-display font-bold text-sm mb-3 flex items-center gap-2"
        >
          <Users size={16} strokeWidth={2} aria-hidden="true" />
          Active Now
        </h2>

        <div className="sidebar-active-list flex flex-col gap-3">
          {activeUsers.length > 0 ? (
            activeUsers.map((activeUser) => (
              <div key={activeUser.id} className="sidebar-active-user flex items-center gap-3">
                <div className="sidebar-active-avatar relative">
                  <img
                    src={getAvatarOrDefault(activeUser.avatar)}
                    alt={activeUser.name}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={handleAvatarError}
                  />

                  <span
                    className="sidebar-online-indicator absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                    aria-label="Online"
                  />
                </div>

                <div className="min-w-0">
                  <p className="sidebar-active-name text-xs font-semibold truncate">
                    {activeUser.name}
                  </p>
                  <p className="sidebar-active-handle text-xs truncate">{activeUser.handle}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="sidebar-active-empty">
              {communityDataAvailable === false
                ? 'Community activity is temporarily unavailable.'
                : 'No students are currently active.'}
            </p>
          )}
        </div>
      </section>

      <section
        className="sidebar-panel sidebar-tags-panel rounded-lg p-4"
        aria-labelledby="popular-tags-heading"
      >
        <h2
          id="popular-tags-heading"
          className="sidebar-section-heading font-display font-bold text-sm mb-3 flex items-center gap-2"
        >
          <Tags size={16} strokeWidth={2} aria-hidden="true" />
          Popular Tags
        </h2>

        <div className="sidebar-tag-list flex flex-wrap gap-2">
          {popularTags.length > 0 ? (
            popularTags.map((tagItem) => (
              <button
                key={tagItem.tag}
                type="button"
                onClick={() => onFilterTag?.(tagItem.tag)}
                className="sidebar-tag"
                aria-label={`Filter feed by ${tagItem.tag}`}
              >
                <span>#{tagItem.tag}</span>
                <span className="sidebar-tag-count">{tagItem.count}</span>
              </button>
            ))
          ) : (
            <p className="sidebar-tags-empty">Tags will appear as students post.</p>
          )}
        </div>
      </section>
    </aside>
  );
}
