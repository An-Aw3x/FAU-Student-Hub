import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Hash,
  MessageCircle,
  RefreshCw,
  Search,
  UserRound,
  Users,
} from 'lucide-react';
import { TAGS } from '../data/mockData';
import { getAvatarOrDefault, handleAvatarError } from '../utils/avatar';
import PostCard from './PostCard';

const API_BASE = 'http://localhost:3001';

const SEARCH_TABS = [
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'comments', label: 'Comments', icon: MessageCircle },
  { id: 'profiles', label: 'Profiles', icon: UserRound },
  { id: 'communities', label: 'Communities / Topics', icon: Hash },
];

const TOPIC_DESCRIPTIONS = {
  housing: 'Apartments, roommates, rent, and off-campus living.',
  classes: 'Courses, professors, registration, and study advice.',
  campus: 'Campus life, student organizations, and FAU updates.',
  jobs: 'Jobs, internships, career fairs, and professional advice.',
  events: 'What is happening around FAU and Boca Raton.',
  sports: 'FAU teams, intramurals, and student athletics.',
  food: 'Dining halls, meal plans, and affordable local food.',
  safety: 'Campus alerts, transportation, and student safety.',
  tech: 'Computer science, software, projects, and tech support.',
  health: 'Student wellness, recreation, and health resources.',
  rants: 'Student frustrations and everyday campus problems.',
};

function parseDate(dateString) {
  if (!dateString) return null;

  const normalized =
    typeof dateString === 'string' && !dateString.includes('T')
      ? `${dateString.replace(' ', 'T')}Z`
      : dateString;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(dateString) {
  const date = parseDate(dateString);

  if (!date) return 'Date unavailable';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getRelevanceScore(item, type, query) {
  const normalizedQuery = query.trim().toLowerCase();
  const fields =
    type === 'posts'
      ? [item.title, item.content, item.username, ...(item.tags || [])]
      : type === 'comments'
        ? [item.content, item.username, item.post_title]
        : type === 'profiles'
          ? [item.username, item.bio]
          : [item.id, item.label, item.description];

  return fields.reduce((score, field, index) => {
    const value = String(field || '').toLowerCase();
    if (!value) return score;
    if (value === normalizedQuery) return score + 100 - index;
    if (value.startsWith(normalizedQuery)) return score + 60 - index;
    if (value.includes(normalizedQuery)) return score + 30 - index;
    return score;
  }, Number(item.matchingPostCount || 0));
}

function isWithinTimeRange(item, timeRange) {
  if (timeRange === 'all') return true;

  const date = parseDate(item.created_at);
  if (!date) return false;

  const age = Date.now() - date.getTime();
  const limit = timeRange === 'today' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

  return age >= 0 && age <= limit;
}

function getTopScore(item, type) {
  if (type === 'posts') {
    return Number(item.upvotes || 0) - Number(item.downvotes || 0);
  }

  if (type === 'comments') return Number(item.likes || 0);
  if (type === 'profiles') return Number(item.follower_count || 0);
  return Number(item.matchingPostCount || 0);
}

function SearchEmptyState({ type }) {
  const labels = {
    posts: 'posts',
    comments: 'comments',
    profiles: 'profiles',
    communities: 'communities or topics',
  };

  return (
    <div className="search-empty-state">
      <Search size={26} aria-hidden="true" />
      <h2>No {labels[type]} found</h2>
      <p>Try a broader keyword or change the search filters.</p>
    </div>
  );
}

export default function SearchResultsPage({
  query,
  viewerUsername,
  isAdmin = false,
  onBack,
  onOpenPost,
  onViewProfile,
  onOpenTopic,
}) {
  const [activeTab, setActiveTab] = useState('posts');
  const [sortMode, setSortMode] = useState('relevance');
  const [timeRange, setTimeRange] = useState('all');
  const [results, setResults] = useState({
    posts: [],
    comments: [],
    profiles: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');

      const searchParams = new URLSearchParams({ q: normalizedQuery });
      const postParams = new URLSearchParams(searchParams);
      if (viewerUsername) postParams.set('viewer', viewerUsername);

      Promise.all([
        fetch(`${API_BASE}/api/search/posts?${postParams}`, {
          signal: controller.signal,
        }).then(async response => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Could not search posts.');
          return data;
        }),
        fetch(`${API_BASE}/api/search/comments?${searchParams}`, {
          signal: controller.signal,
        }).then(async response => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Could not search comments.');
          return data;
        }),
        fetch(`${API_BASE}/api/search/users?${searchParams}`, {
          signal: controller.signal,
        }).then(async response => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Could not search profiles.');
          return data;
        }),
      ])
        .then(([posts, comments, profiles]) => {
          setResults({ posts, comments, profiles });
        })
        .catch(searchError => {
          if (searchError.name !== 'AbortError') setError(searchError.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, refreshKey, viewerUsername]);

  const communities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return TAGS.filter(topic => topic.id !== 'all')
      .map(topic => {
        const matchingPosts = results.posts.filter(post =>
          (post.tags || []).some(
            tag => String(tag).toLowerCase() === topic.id.toLowerCase()
          )
        );
        const directMatch =
          topic.id.toLowerCase().includes(normalizedQuery) ||
          topic.label.toLowerCase().includes(normalizedQuery);

        if (!directMatch && matchingPosts.length === 0) return null;

        const newestPostTime = matchingPosts.reduce((latest, post) => {
          const postTime = parseDate(post.created_at)?.getTime() || 0;
          return Math.max(latest, postTime);
        }, 0);

        return {
          ...topic,
          description: TOPIC_DESCRIPTIONS[topic.id] || 'Student discussions on OwlNet.',
          matchingPostCount: matchingPosts.length,
          created_at: newestPostTime ? new Date(newestPostTime).toISOString() : null,
        };
      })
      .filter(Boolean);
  }, [query, results.posts]);

  const resultCounts = {
    posts: results.posts.length,
    comments: results.comments.length,
    profiles: results.profiles.length,
    communities: communities.length,
  };

  const visibleResults = useMemo(() => {
    const source =
      activeTab === 'communities' ? communities : results[activeTab] || [];
    const filtered = source.filter(item => isWithinTimeRange(item, timeRange));

    return [...filtered].sort((a, b) => {
      if (sortMode === 'new') {
        return (parseDate(b.created_at)?.getTime() || 0) -
          (parseDate(a.created_at)?.getTime() || 0);
      }

      if (sortMode === 'top') {
        const topDifference =
          getTopScore(b, activeTab) - getTopScore(a, activeTab);
        if (topDifference !== 0) return topDifference;
      }

      return (
        getRelevanceScore(b, activeTab, query) -
        getRelevanceScore(a, activeTab, query)
      );
    });
  }, [activeTab, communities, query, results, sortMode, timeRange]);

  const renderPosts = () => (
    <div className="search-post-list">
      {visibleResults.map(post => (
        <PostCard
          key={`search-post-${post.id}`}
          post={post}
          aiSummaryEnabled={false}
          isAdmin={isAdmin}
          onViewProfile={onViewProfile}
          onOpenPost={onOpenPost}
        />
      ))}
    </div>
  );

  const renderComments = () => (
    <div className="search-comment-list">
      {visibleResults.map(comment => (
        <article key={`search-comment-${comment.id}`} className="search-comment-card">
          <div className="search-comment-heading">
            <button
              type="button"
              onClick={() =>
                onViewProfile?.({
                  username: comment.username,
                })
              }
            >
              {comment.username}
            </button>
            <time>{formatDate(comment.created_at)}</time>
          </div>
          <p>{comment.content}</p>
          <div className="search-comment-footer">
            <span>
              On <strong>{comment.post_title}</strong>
            </span>
            <button type="button" onClick={() => onOpenPost?.(comment.post_id)}>
              Open original post
            </button>
          </div>
        </article>
      ))}
    </div>
  );

  const renderProfiles = () => (
    <div className="search-profile-list">
      {visibleResults.map(profile => {
        const avatar = getAvatarOrDefault(profile.avatar);

        return (
          <article key={`search-profile-${profile.id}`} className="search-profile-card">
            <img src={avatar} alt="" onError={handleAvatarError} />
            <div className="search-profile-copy">
              <h2>{profile.username}</h2>
              <p>{profile.bio || 'OwlNet community member.'}</p>
              <span>
                <Users size={13} aria-hidden="true" />
                {Number(profile.follower_count || 0)} followers
              </span>
            </div>
            <button
              type="button"
              className="button-secondary button-compact"
              onClick={() =>
                onViewProfile?.({
                  username: profile.username,
                  avatar,
                  bio: profile.bio || '',
                })
              }
            >
              View profile
            </button>
          </article>
        );
      })}
    </div>
  );

  const renderCommunities = () => (
    <div className="search-topic-grid">
      {visibleResults.map(topic => (
        <button
          key={`search-topic-${topic.id}`}
          type="button"
          className="search-topic-card"
          onClick={() => onOpenTopic?.(topic.id)}
        >
          <span className="search-topic-icon">
            <Hash size={18} aria-hidden="true" />
          </span>
          <span className="search-topic-copy">
            <strong>{topic.label}</strong>
            <small>{topic.description}</small>
            <em>
              {topic.matchingPostCount}{' '}
              {topic.matchingPostCount === 1 ? 'matching post' : 'matching posts'}
            </em>
          </span>
        </button>
      ))}
    </div>
  );

  const renderResults = () => {
    if (loading) {
      return (
        <div className="search-results-status" role="status">
          <RefreshCw className="animate-spin" size={20} aria-hidden="true" />
          Searching OwlNet
        </div>
      );
    }

    if (error) {
      return (
        <div className="search-results-status is-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setRefreshKey(previous => previous + 1);
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    if (visibleResults.length === 0) return <SearchEmptyState type={activeTab} />;
    if (activeTab === 'posts') return renderPosts();
    if (activeTab === 'comments') return renderComments();
    if (activeTab === 'profiles') return renderProfiles();
    return renderCommunities();
  };

  return (
    <section className="search-results-page max-w-3xl mx-auto animate-fade-in">
      <button type="button" onClick={onBack} className="page-back-button">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to feed
      </button>

      <header className="search-results-header">
        <p className="section-eyebrow">Search OwlNet</p>
        <h1>Results for “{query.trim()}”</h1>
        <p>Search across student discussions, replies, profiles, and topics.</p>
      </header>

      <nav className="search-tabs" aria-label="Search result types">
        {SEARCH_TABS.map(tab => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'is-active' : ''}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{tab.label}</span>
              <small>{resultCounts[tab.id]}</small>
            </button>
          );
        })}
      </nav>

      <div className="search-filter-bar">
        <label>
          <span>Sort</span>
          <select value={sortMode} onChange={event => setSortMode(event.target.value)}>
            <option value="relevance">Relevance</option>
            <option value="new">New</option>
            <option value="top">Top</option>
          </select>
        </label>
        <label>
          <span>Time</span>
          <select value={timeRange} onChange={event => setTimeRange(event.target.value)}>
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
          </select>
        </label>
        <p>
          {visibleResults.length} {visibleResults.length === 1 ? 'result' : 'results'}
        </p>
      </div>

      <div className="search-results-content">{renderResults()}</div>
    </section>
  );
}
