import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:3001';

const COMMUNITY_CHATS = [
  {
    id: 'housing',
    title: 'Housing',
    description: 'Talk about apartments, roommates, rent, and off-campus housing.',
    members: '1.2k',
  },
  {
    id: 'classes',
    title: 'Classes',
    description: 'Ask about professors, assignments, exams, and class advice.',
    members: '980',
  },
  {
    id: 'campus',
    title: 'Campus Life',
    description: 'Campus events, student life, clubs, and general FAU talk.',
    members: '740',
  },
  {
    id: 'food',
    title: 'Food & Dining',
    description: 'Best food spots near campus, meal ideas, and cheap eats.',
    members: '610',
  },
  {
    id: 'tech',
    title: 'Tech & CS',
    description: 'Coding, CS classes, projects, internships, and tech help.',
    members: '530',
  },
  {
    id: 'rants',
    title: 'Rants',
    description: 'Vent about parking, classes, campus problems, or random stuff.',
    members: '890',
  },
];

export default function CommunityPage({ onBack, onOpenChat }) {
  const { user } = useAuth();

  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [stats, setStats] = useState({
    memberCount: 0,
    onlineCount: 0,
    postsToday: 0,
  });

  const loadCommunityStats = useCallback(async () => {
    try {
      const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';
      const response = await fetch(`${API_BASE}/api/community/stats${emailQuery}`);

      if (!response.ok) {
        throw new Error('Could not load community stats.');
      }

      const data = await response.json();

      setStats({
        memberCount: data.memberCount || 0,
        onlineCount: data.onlineCount || 0,
        postsToday: data.postsToday || 0,
      });

      setJoined(Boolean(data.joined));
    } catch (error) {
      console.error(error);
    }
  }, [user?.email]);

  useEffect(() => {
    loadCommunityStats();
  }, [loadCommunityStats]);

  const handleJoinCommunity = async () => {
    if (!user?.email) return;

    try {
      setJoining(true);

      const response = await fetch(`${API_BASE}/api/community/join`, {
        method: joined ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          username: user.username,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not update community membership.');
      }

      const data = await response.json();

      setStats({
        memberCount: data.memberCount || 0,
        onlineCount: data.onlineCount || 0,
        postsToday: data.postsToday || 0,
      });

      setJoined(Boolean(data.joined));
    } catch (error) {
      console.error(error);
      alert('Could not update community membership.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto animate-fade-in">
      <button type="button" onClick={onBack} className="vote-btn mb-5">
        Back to Feed
      </button>

      <div
        className="rounded-3xl p-6 mb-6"
        style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1
              className="font-display font-bold text-3xl mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              OwlNet Community
            </h1>

            <p className="text-sm max-w-2xl" style={{ color: 'var(--color-text-muted)' }}>
              Join FAU student chats based on topics like housing, classes, campus life, food, tech, and more.
            </p>
          </div>

          <button
            type="button"
            onClick={handleJoinCommunity}
            disabled={joining}
            className="vote-btn"
          >
            {joining ? 'Updating...' : joined ? 'Joined' : 'Join Community'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--color-surface-3)' }}>
            <p className="font-display font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>
              {stats.memberCount.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Members</p>
          </div>

          <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--color-surface-3)' }}>
            <p className="font-display font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>
              {stats.onlineCount.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Online</p>
          </div>

          <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--color-surface-3)' }}>
            <p className="font-display font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>
              {stats.postsToday.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Posts Today</p>
          </div>
        </div>
      </div>

      <h2
        className="font-display font-bold text-xl mb-4"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Community Chats
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {COMMUNITY_CHATS.map((chat) => (
          <button
            key={chat.id}
            type="button"
            onClick={() => onOpenChat(chat.id)}
            className="text-left rounded-3xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3
                className="font-display font-bold text-lg"
                style={{ color: 'var(--color-text-primary)' }}
              >
                #{chat.title}
              </h3>

              <span
                className="text-xs font-semibold px-2 py-1 rounded-full"
                style={{
                  background: 'var(--color-surface-3)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {chat.members} members
              </span>
            </div>

            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              {chat.description}
            </p>

            <span className="vote-btn">
              Open Chat
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}