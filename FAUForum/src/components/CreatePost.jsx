import { useState } from 'react';
import { TAGS } from '../data/mockData';

const ImageIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const TagIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const AVAILABLE_TAGS = TAGS.filter(t => t.id !== 'all');

export default function CreatePost({ isLoggedIn, currentUser, currentUserAvatar, onLoginPrompt, onPostCreated }) {
  const [title, setTitle]           = useState('');
  const [body, setBody]             = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [expanded, setExpanded]     = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId].slice(0, 3)
    );
  };

  const handleFocus = () => {
    if (!isLoggedIn) {
      onLoginPrompt();
      return;
    }
    setExpanded(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: body.trim() || title.trim(),
          username: currentUser?.name || 'Anonymous',
          tags: selectedTags,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create post');
      }

      const newPost = await res.json();
      if (onPostCreated) onPostCreated(newPost);

      setSubmitted(true);
      setTimeout(() => {
        setTitle('');
        setBody('');
        setSelectedTags([]);
        setExpanded(false);
        setSubmitted(false);
        setShowTagPicker(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscard = () => {
    setTitle('');
    setBody('');
    setSelectedTags([]);
    setExpanded(false);
    setShowTagPicker(false);
  };

  return (
    <div
      id="create-post-area"
      className="create-post-area p-4"
    >
      {submitted ? (
        <div className="py-6 text-center animate-fade-in">
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-semibold" style={{ color: 'var(--color-owl-gold)' }}>
            Post submitted successfully!
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Your post is now live in the feed.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} id="create-post-form" noValidate>
          <div className="flex gap-3 items-start">
            {/* User Avatar */}
            <img
              src={currentUserAvatar}
              alt="Your profile"
              className="w-10 h-10 rounded-full avatar-ring shrink-0 mt-1"
            />

            <div className="flex-1 min-w-0">
              {/* Title Input */}
              <input
                id="post-title-input"
                type="text"
                placeholder={isLoggedIn ? "What's on your mind, FAU Owl? 🦉" : "Log in to post…"}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onFocus={handleFocus}
                readOnly={!isLoggedIn}
                className="w-full text-sm font-medium py-2 border-b transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                aria-label="Post title"
                maxLength={200}
              />

              {/* Expanded Body & Options */}
              {expanded && (
                <div className="animate-slide-down">
                  <textarea
                    id="post-body-input"
                    rows={4}
                    placeholder="Share more details… (optional)"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className="w-full text-sm mt-3 py-2 leading-relaxed"
                    style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                    aria-label="Post body"
                  />

                  {/* Tag Picker */}
                  <div className="mt-3">
                    <button
                      type="button"
                      id="tag-picker-btn"
                      onClick={() => setShowTagPicker(p => !p)}
                      className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                      style={{
                        color: selectedTags.length > 0 ? '#7EB3FF' : 'var(--color-text-muted)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-3)',
                      }}
                      aria-expanded={showTagPicker}
                    >
                      <TagIcon />
                      {selectedTags.length > 0
                        ? `Tags: ${selectedTags.map(t => '#' + t).join(', ')}`
                        : 'Add Tags (up to 3)'}
                    </button>

                    {showTagPicker && (
                      <div className="mt-2 flex flex-wrap gap-2 p-3 rounded-xl animate-slide-down"
                        style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)' }}>
                        {AVAILABLE_TAGS.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            id={`select-tag-${tag.id}`}
                            onClick={() => toggleTag(tag.id)}
                            className={`tag-chip ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                            aria-pressed={selectedTags.includes(tag.id)}
                          >
                            {tag.icon} {tag.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    {/* Attachment Hints */}
                    <button type="button" className="p-2 rounded-lg transition-all hover:bg-[color:var(--color-surface-3)]"
                      style={{ color: 'var(--color-text-muted)' }} title="Add image" aria-label="Add image">
                      <ImageIcon />
                    </button>
                    <button type="button" className="p-2 rounded-lg transition-all hover:bg-[color:var(--color-surface-3)]"
                      style={{ color: 'var(--color-text-muted)' }} title="Add link" aria-label="Add link">
                      <LinkIcon />
                    </button>

                    <div className="flex-1" />

                    <button
                      type="button"
                      id="discard-post-btn"
                      onClick={handleDiscard}
                      className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      id="submit-post-btn"
                      disabled={!title.trim() || submitting}
                      className="px-5 py-1.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                      style={{ background: 'linear-gradient(135deg, var(--color-owl-blue), var(--color-owl-blue-light))', color: 'white' }}
                    >
                      {submitting ? 'Posting…' : 'Post'}
                    </button>
                  </div>
                  {error && (
                    <p className="text-xs mt-2" style={{ color: '#F87171' }}>{error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
