import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Home,
  Landmark,
  Laptop,
  MessageSquare,
  Utensils,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:3001';

async function fetchCommunityStats(userEmail) {
  const emailQuery = userEmail ? `?email=${encodeURIComponent(userEmail)}` : '';
  const response = await fetch(`${API_BASE}/api/community/stats${emailQuery}`);

  if (!response.ok) {
    throw new Error('Could not load community stats.');
  }

  return response.json();
}

function normalizeCommunityStats(stats) {
  return {
    memberCount: stats.memberCount || 0,
    onlineCount: stats.onlineCount || 0,
    postsToday: stats.postsToday || 0,
  };
}

const COMMUNITY_TOPICS = [
  {
    id: 'housing',
    title: 'Housing',
    description: 'Talk about apartments, roommates, rent, and off-campus housing.',
  },
  {
    id: 'classes',
    title: 'Classes',
    description: 'Ask about professors, assignments, exams, and class advice.',
  },
  {
    id: 'campus',
    title: 'Campus Life',
    description: 'Campus events, student life, clubs, and general FAU talk.',
  },
  {
    id: 'food',
    title: 'Food & Dining',
    description: 'Best food spots near campus, meal ideas, and cheap eats.',
  },
  {
    id: 'tech',
    title: 'Tech & CS',
    description: 'Coding, CS classes, projects, internships, and tech help.',
  },
  {
    id: 'rants',
    title: 'Rants',
    description: 'Vent about parking, classes, campus problems, or random stuff.',
  },
];

const TOPIC_ICONS = {
  housing: Home,
  classes: BookOpen,
  campus: Landmark,
  food: Utensils,
  tech: Laptop,
  rants: MessageSquare,
};

export default function CommunityPage({ posts = [], onBack, onOpenTopic }) {
  const { user } = useAuth();
  const userEmail = user?.email;

  const [stats, setStats] = useState({
    memberCount: 0,
    onlineCount: 0,
    postsToday: 0,
  });
  const [statsAvailable, setStatsAvailable] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchCommunityStats(userEmail)
      .then(data => {
        if (!cancelled) {
          setStats(normalizeCommunityStats(data));
          setStatsAvailable(true);
        }
      })
      .catch(error => {
        console.error(error);
        if (!cancelled) {
          setStatsAvailable(false);
        }
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

        const data = await fetchCommunityStats(userEmail);

        if (!cancelled) {
          setStats(normalizeCommunityStats(data));
          setStatsAvailable(true);
        }
      } catch (error) {
        console.error('Could not update online status:', error);
        if (!cancelled) {
          setStatsAvailable(false);
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
    { label: 'Members', value: statsAvailable ? stats.memberCount.toLocaleString() : '—' },
    { label: 'Online now', value: statsAvailable ? stats.onlineCount.toLocaleString() : '—' },
    { label: 'Posts today', value: statsAvailable ? stats.postsToday.toLocaleString() : '—' },
  ];

  return (
    <section className="community-page max-w-5xl mx-auto animate-fade-in">
      <button type="button" onClick={onBack} className="page-back-button">
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Back to feed
      </button>

      <header className="community-hero">
        <div className="community-hero-copy">
          <p className="community-hero-eyebrow">Florida Atlantic Student Hub</p>
          <h1 className="community-hero-title">OwlNet Community</h1>
          <p className="community-hero-description">
            Find student-led discussions about housing, academics, campus life, dining, technology,
            and everyday life at Florida Atlantic.
          </p>
        </div>

        <div className="community-hero-stats">
          {communityStatItems.map((stat) => (
            <div key={stat.label} className="community-hero-stat">
              <p>{stat.value}</p>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </header>

      {statsAvailable === false && (
        <p className="community-stats-note" role="status">
          Live community counts are temporarily unavailable. Discussions remain available.
        </p>
      )}

      <div className="community-section-intro">
        <div>
          <p className="section-eyebrow">Student discussions</p>
          <h2>Find your community</h2>
        </div>
        <p>Choose a topic to browse recent posts and join the conversation.</p>
      </div>

      <div className="community-topic-grid">
        {COMMUNITY_TOPICS.map((topic) => {
          const TopicIcon = TOPIC_ICONS[topic.id] || MessageSquare;
          const postCount = posts.filter(post =>
            (post.tags || []).some(tag => String(tag).toLowerCase() === topic.id)
          ).length;

          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onOpenTopic(topic.id)}
              className="community-topic-card"
            >
              <span className="community-topic-icon">
                <TopicIcon size={19} strokeWidth={2} aria-hidden="true" />
              </span>

              <span className="community-topic-content">
                <span className="community-topic-header">
                  <span className="community-topic-title">{topic.title}</span>
                  <span className="community-topic-activity">
                    <MessageSquare size={13} strokeWidth={2} aria-hidden="true" />
                    {postCount} {postCount === 1 ? 'post' : 'posts'}
                  </span>
                </span>

                <span className="community-topic-description">{topic.description}</span>

                <span className="community-topic-action">
                  Open discussion
                  <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
