import { useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Link2, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TAGS } from '../data/mockData';
import { getAvatarOrDefault, handleAvatarError } from '../utils/avatar';

const AVAILABLE_TAGS = TAGS.filter(tag => tag.id !== 'all');

function normalizeWebLink(value) {
  const trimmedLink = value.trim();

  if (!trimmedLink) return '';

  const linkWithProtocol = /^https?:\/\//i.test(trimmedLink)
    ? trimmedLink
    : `https://${trimmedLink}`;
  const parsedLink = new URL(linkWithProtocol);

  if (!['http:', 'https:'].includes(parsedLink.protocol)) {
    throw new Error('Only HTTP and HTTPS links are supported.');
  }

  return parsedLink.toString();
}

export default function CreatePost({ onPostCreated, courseContext = null }) {
  const { user } = useAuth();
  const presetTags = (courseContext?.tags || []).slice(0, 1);
  const courseTag = presetTags[0] || '';
  const courseCode = courseContext?.code || '';
  const currentUserAvatar = getAvatarOrDefault(user?.avatar);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState(presetTags);
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

  const composerTitle = courseCode ? `Post about ${courseCode}` : 'Create a post';
  const composerHelper = courseCode
    ? `Automatically tagged #${courseTag}.`
    : 'Share a question, update, or campus resource.';
  const titlePlaceholder = courseCode
    ? `What would you like to ask about ${courseCode}?`
    : 'What would you like to discuss?';
  const selectedTagLabel = selectedTags
    .map(tag => `#${tag === courseTag && courseCode ? courseCode : tag}`)
    .join(', ');
  const publishButtonLabel = submitting
    ? 'Publishing...'
    : courseCode
      ? 'Publish course post'
      : 'Publish post';

  const toggleTag = (tagId) => {
    setSelectedTags(previousTags =>
      previousTags.includes(tagId)
        ? previousTags.filter(selectedTag => selectedTag !== tagId)
        : [...previousTags, tagId].slice(0, 3)
    );
  };

  const handleFocus = () => {
    setExpanded(true);
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setSelectedTags(presetTags);
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

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setError('Images must be 1 MB or smaller.');
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim() || submitting) return;

    setError('');

    let normalizedLinkUrl;

    try {
      normalizedLinkUrl = normalizeWebLink(linkUrl);
    } catch (linkError) {
      setError(linkError.message || 'Enter a valid link.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: body.trim() || title.trim(),
          username: user?.username || 'Anonymous',
          tags: selectedTags,
          image_url: imageUrl.trim(),
          link_url: normalizedLinkUrl,
        }),
      });

      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}));
        throw new Error(responseData.error || 'Failed to create post');
      }

      const newPost = await response.json();

      if (onPostCreated) {
        onPostCreated(newPost);
      }

      setSubmitted(true);

      setTimeout(() => {
        resetForm();
        setSubmitted(false);
      }, 2000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscard = () => {
    resetForm();
    setError('');
  };

  return (
    <div
      id="create-post-area"
      className={`create-post-area ${courseContext ? 'is-course-context' : ''}`}
    >
      {submitted ? (
        <div className="composer-success animate-fade-in" role="status">
          <CheckCircle2 size={24} aria-hidden="true" />
          <div>
            <p className="font-semibold">
              Post published
            </p>

            <p className="text-sm mt-0.5">
              Your {courseCode ? `${courseCode} ` : ''}discussion is now live in the community
              feed.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} id="create-post-form" noValidate>
          <div className="composer-heading">
            <div>
              <p className="composer-eyebrow">
                {courseCode ? 'Course discussion' : 'Start a discussion'}
              </p>
              <h2>{composerTitle}</h2>
            </div>
            <span>{composerHelper}</span>
          </div>

          <div className="composer-main">
            <img
              src={currentUserAvatar}
              alt="Your profile"
              className="w-10 h-10 rounded-full avatar-ring shrink-0"
              onError={handleAvatarError}
            />

            <div className="flex-1 min-w-0">
              <input
                id="post-title-input"
                type="text"
                placeholder={titlePlaceholder}
                value={title}
                onChange={event => setTitle(event.target.value)}
                onFocus={handleFocus}
                className="composer-title-input"
                aria-label="Post title"
                maxLength={200}
              />

              {expanded && (
                <div className="animate-slide-down">
                  <textarea
                    id="post-body-input"
                    rows={4}
                    placeholder="Add context or details (optional)"
                    value={body}
                    onChange={event => setBody(event.target.value)}
                    className="composer-body-input"
                    aria-label="Post body"
                  />

                  <div className="composer-tags">
                    <button
                      type="button"
                      id="tag-picker-btn"
                      onClick={() => setShowTagPicker(previous => !previous)}
                      className="composer-tag-trigger"
                      aria-expanded={showTagPicker}
                    >
                      <Tag size={15} aria-hidden="true" />
                      {selectedTags.length > 0
                        ? `Topics: ${selectedTagLabel}`
                        : 'Add topics (up to 3)'}
                    </button>

                    {showTagPicker && (
                      <div className="composer-tag-picker animate-slide-down">
                        {AVAILABLE_TAGS.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            id={`select-tag-${tag.id}`}
                            onClick={() => toggleTag(tag.id)}
                            className={`tag-chip ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                            aria-pressed={selectedTags.includes(tag.id)}
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {imageUrl && (
                    <div className="composer-attachment-preview">
                      <img
                        src={imageUrl}
                        alt="Upload preview"
                        className="w-full max-h-64 object-cover"
                      />

                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <p className="text-xs truncate">
                          {imageName || 'Uploaded image'}
                        </p>

                        <button
                          type="button"
                          onClick={removeImage}
                          className="composer-remove"
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
                      onChange={event => setLinkUrl(event.target.value)}
                      placeholder="Paste a link URL"
                      className="composer-link-input"
                      aria-label="Link URL"
                    />
                  )}

                  <div className="composer-actions">
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
                      className={`composer-tool ${imageUrl ? 'active' : ''}`}
                      title="Upload image"
                      aria-label="Upload image"
                    >
                      <ImagePlus size={16} aria-hidden="true" />
                      <span>Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLinkInput(previous => !previous)}
                      className={`composer-tool ${linkUrl.trim() ? 'active' : ''}`}
                      title="Add link"
                      aria-label="Add link"
                    >
                      <Link2 size={16} aria-hidden="true" />
                      <span>Link</span>
                    </button>

                    <div className="flex-1" />

                    <button
                      type="button"
                      id="discard-post-btn"
                      onClick={handleDiscard}
                      className="button-secondary"
                    >
                      Discard
                    </button>

                    <button
                      type="submit"
                      id="submit-post-btn"
                      disabled={!title.trim() || submitting}
                      className="button-primary"
                    >
                      {publishButtonLabel}
                    </button>
                  </div>

                  {error && (
                    <p className="form-error mt-3" role="alert">
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
