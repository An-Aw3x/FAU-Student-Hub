import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  GraduationCap,
  MessageSquare,
  PenLine,
  Star,
  UserRound,
} from 'lucide-react';
import PostCard from './PostCard';

function normalizeTag(tag) {
  return String(tag || '')
    .trim()
    .replace(/^#/, '')
    .toLowerCase();
}

function getRelatedDiscussions(course, posts) {
  const courseTags = new Set((course.tags || []).map(normalizeTag).filter(Boolean));
  const relatedPostIds = new Set((course.relatedPostIds || []).map(String));

  const matchingPosts = posts.filter((post) => {
    const matchesRelatedId = relatedPostIds.has(String(post.id));
    const matchesCourseTag = (post.tags || []).some((tag) =>
      courseTags.has(normalizeTag(tag))
    );

    return matchesRelatedId || matchesCourseTag;
  });

  const discussionsById = new Map();

  [...matchingPosts, ...(course.mockDiscussions || [])].forEach((discussion) => {
    if (discussion?.id == null) return;

    const discussionId = String(discussion.id);

    if (!discussionsById.has(discussionId)) {
      discussionsById.set(discussionId, discussion);
    }
  });

  return Array.from(discussionsById.values());
}

function formatScore(value) {
  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return `${numericValue.toFixed(1)} / 5`;
  }

  return value || 'Not rated';
}

function formatPercentage(value) {
  if (value == null || value === '') return 'Not available';

  return String(value).endsWith('%') ? String(value) : `${value}%`;
}

export default function CourseDetailPage({
  course,
  posts = [],
  onBack,
  onCreatePost,
  onViewProfile,
  aiSummaryEnabled,
  isAdmin,
}) {
  if (!course) {
    return (
      <section className="course-detail-page max-w-5xl mx-auto animate-fade-in">
        <button type="button" onClick={onBack} className="page-back-button">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          Back to courses
        </button>

        <div className="course-detail-empty">
          <BookOpen size={32} strokeWidth={1.8} aria-hidden="true" />
          <h1>Course not found</h1>
          <p>This course may no longer be available in the Course Hub.</p>
        </div>
      </section>
    );
  }

  const relatedDiscussions = getRelatedDiscussions(course, posts);
  const listedDiscussionCount = course.discussionCount ?? relatedDiscussions.length;

  const courseSummary = [
    {
      label: 'Difficulty',
      value: formatScore(course.difficulty),
      icon: BarChart3,
    },
    {
      label: 'Student rating',
      value: formatScore(course.rating),
      icon: Star,
    },
    {
      label: 'Would take again',
      value: formatPercentage(course.wouldTakeAgain),
      icon: GraduationCap,
    },
    {
      label: 'Discussions',
      value: listedDiscussionCount.toLocaleString(),
      icon: MessageSquare,
    },
  ];

  return (
    <section
      className="course-detail-page max-w-5xl mx-auto animate-fade-in"
      aria-labelledby="course-detail-title"
    >
      <button type="button" onClick={onBack} className="page-back-button">
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Back to courses
      </button>

      <header className="course-detail-hero">
        <div className="course-detail-hero-copy">
          <div className="course-detail-labels">
            <span className="course-detail-code">{course.code}</span>
            {course.department && (
              <span className="course-detail-department">{course.department}</span>
            )}
          </div>

          <h1 id="course-detail-title">{course.title}</h1>

          <p className="course-detail-professor">
            <UserRound size={17} strokeWidth={2} aria-hidden="true" />
            <span>
              Professor <strong>{course.professor}</strong>
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onCreatePost?.(course)}
          className="button-primary course-detail-create-button"
        >
          <PenLine size={17} strokeWidth={2} aria-hidden="true" />
          Start course discussion
        </button>
      </header>

      <div className="course-detail-summary" aria-label="Course rating summary">
        {courseSummary.map((item) => {
          const SummaryIcon = item.icon;

          return (
            <div key={item.label} className="course-detail-summary-item">
              <span className="course-detail-summary-icon">
                <SummaryIcon size={18} strokeWidth={2} aria-hidden="true" />
              </span>

              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <section className="course-detail-description" aria-labelledby="course-description-title">
        <div className="course-detail-section-heading">
          <BookOpen size={19} strokeWidth={2} aria-hidden="true" />
          <h2 id="course-description-title">About this course</h2>
        </div>

        <p>{course.description || 'A course description is not available yet.'}</p>
      </section>

      <section className="course-detail-discussions" aria-labelledby="course-discussions-title">
        <div className="course-detail-discussions-heading">
          <div>
            <p className="section-eyebrow">Student conversations</p>
            <h2 id="course-discussions-title">Related discussions</h2>
          </div>

          <span className="course-detail-result-count">
            {relatedDiscussions.length}{' '}
            {relatedDiscussions.length === 1 ? 'discussion' : 'discussions'}
          </span>
        </div>

        {relatedDiscussions.length > 0 ? (
          <div className="course-detail-discussion-list">
            {relatedDiscussions.map((post) => (
              <PostCard
                key={`course-discussion-${post.id}`}
                post={post}
                onViewProfile={onViewProfile}
                aiSummaryEnabled={aiSummaryEnabled}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="course-detail-empty">
            <MessageSquare size={30} strokeWidth={1.8} aria-hidden="true" />
            <h3>No course discussions yet</h3>
            <p>Start the first conversation for {course.code}.</p>
          </div>
        )}
      </section>
    </section>
  );
}
