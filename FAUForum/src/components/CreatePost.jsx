import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TAGS } from '../data/mockData';

const ImageIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const TagIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const AVAILABLE_TAGS = TAGS.filter(t => t.id !== 'all');

export default function CreatePost({ onPostCreated }) {
  const { user, isLoggedIn } = useAuth();
  const currentUserAvatar = user?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=OwlNetUser&backgroundColor=b6e3f4`;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const imageInputRef = useRef(null);
  const [imageName, setImageName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId].slice(0, 3)
    );
  };

  const handleFocus = () => {
    setExpanded(true);
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setSelectedTags([]);
    setImageUrl('');
    setLinkUrl('');
    setExpanded(false);
    setShowTagPicker(false);
    setShowLinkInput(false);

    setImageName('');

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    // TODO before production:
    // This demo stores uploaded images as base64 text in SQLite.
    // That is okay for small class testing, but it will not scale.
    // For a real app, upload images to cloud/file storage instead
    // and only save the image URL in the database.
    if (file.size > 1 * 1024 * 1024) {
      setError('Image must be under 1MB for this demo.');
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setImageUrl(reader.result);
      setImageName(file.name);
      setError('');
    };

    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageUrl('');
    setImageName('');

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
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
          username: user?.username || 'Anonymous',
          tags: selectedTags,
          image_url: imageUrl.trim(),
          link_url: linkUrl.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create post');
      }

      const newPost = await res.json();

      if (onPostCreated) {
        onPostCreated(newPost);
      }

      setSubmitted(true);

      setTimeout(() => {
        resetForm();
        setSubmitted(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscard = () => {
    resetForm();
    setError('');
  };

  return (
    <div id="create-post-area" className="create-post-area p-4">
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
            <img
              src={currentUserAvatar}
              alt="Your profile"
              className="w-10 h-10 rounded-full avatar-ring shrink-0 mt-1"
            />

            <div className="flex-1 min-w-0">
              <input
                id="post-title-input"
                type="text"
                placeholder="What's on your mind, FAU Owl? 🦉"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onFocus={handleFocus}
                className="w-full text-sm font-medium py-2 border-b transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                aria-label="Post title"
                maxLength={200}
              />

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
                      <div
                        className="mt-2 flex flex-wrap gap-2 p-3 rounded-xl animate-slide-down"
                        style={{
                          background: 'var(--color-surface-3)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
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

                  {imageUrl && (
                    <div
                      className="mt-3 rounded-2xl overflow-hidden"
                      style={{
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-3)',
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt="Upload preview"
                        className="w-full max-h-64 object-cover"
                      />

                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <p
                          className="text-xs truncate"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {imageName || 'Uploaded image'}
                        </p>

                        <button
                          type="button"
                          onClick={removeImage}
                          className="text-xs font-bold"
                          style={{ color: '#F87171' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {showLinkInput && (
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="Paste link URL..."
                      className="w-full text-sm mt-3 px-3 py-2 rounded-xl"
                      style={{
                        background: 'var(--color-surface-3)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2 rounded-lg transition-all hover:bg-[color:var(--color-surface-3)]"
                      style={{
                        color: imageUrl ? 'var(--color-owl-blue)' : 'var(--color-text-muted)',
                      }}
                      title="Upload image"
                      aria-label="Upload image"
                    >
                      <ImageIcon />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLinkInput(p => !p)}
                      className="p-2 rounded-lg transition-all hover:bg-[color:var(--color-surface-3)]"
                      style={{
                        color: linkUrl.trim() ? 'var(--color-owl-blue)' : 'var(--color-text-muted)',
                      }}
                      title="Add link"
                      aria-label="Add link"
                    >
                      <LinkIcon />
                    </button>

                    <div className="flex-1" />

                    <button
                      type="button"
                      id="discard-post-btn"
                      onClick={handleDiscard}
                      className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        color: 'var(--color-text-muted)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      Discard
                    </button>

                    <button
                      type="submit"
                      id="submit-post-btn"
                      disabled={!title.trim() || submitting}
                      className="px-5 py-1.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, var(--color-owl-blue), var(--color-owl-blue-light))',
                        color: 'white',
                      }}
                    >
                      {submitting ? 'Posting…' : 'Post'}
                    </button>
                  </div>

                  {error && (
                    <p className="text-xs mt-2" style={{ color: '#F87171' }}>
                      {error}
                    </p>
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