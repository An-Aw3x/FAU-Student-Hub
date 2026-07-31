import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Gauge,
  MessageSquare,
  Search,
  ThumbsUp,
  UserRound,
} from 'lucide-react';

export default function CoursesPage({ courses = [], onBack, onOpenCourse }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return courses;
    }

    return courses.filter((course) => {
      const searchableCourseDetails = [
        course.code,
        course.title,
        course.professor,
        course.department,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableCourseDetails.includes(normalizedQuery);
    });
  }, [courses, searchQuery]);

  return (
    <section className="courses-page animate-fade-in" aria-labelledby="courses-page-title">
      <button type="button" onClick={onBack} className="page-back-button courses-back-button">
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Back to feed
      </button>

      <header className="courses-hero">
        <div className="courses-hero-icon" aria-hidden="true">
          <BookOpen size={26} strokeWidth={1.9} />
        </div>

        <div className="courses-hero-copy">
          <p className="courses-eyebrow">Academic resources</p>
          <h1 id="courses-page-title" className="courses-title">
            Course Hub
          </h1>
          <p className="courses-description">
            Explore FAU courses, compare student feedback, and find discussions before you
            register.
          </p>
        </div>
      </header>

      <div className="courses-directory-heading">
        <div>
          <p className="courses-section-eyebrow">Course directory</p>
          <h2 className="courses-section-title">Browse classes and professors</h2>
        </div>
        <p className="courses-directory-count" aria-live="polite">
          {filteredCourses.length} course{filteredCourses.length === 1 ? '' : 's'}
        </p>
      </div>

      <label className="courses-search">
        <span className="courses-search-label">Search courses</span>
        <span className="courses-search-control">
          <Search size={18} strokeWidth={2} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by course, title, professor, or department"
            className="courses-search-input"
          />
        </span>
      </label>

      {filteredCourses.length > 0 ? (
        <div className="courses-grid">
          {filteredCourses.map((course) => (
            <button
              key={course.id || course.code}
              type="button"
              className="course-card"
              onClick={() => onOpenCourse(course)}
              aria-label={[
                `Open ${course.code}: ${course.title} with ${course.professor}.`,
                `Difficulty ${course.difficulty} out of 5.`,
                `${course.wouldTakeAgain}% would take again.`,
                `${course.discussionCount} discussions.`,
              ].join(' ')}
            >
              <span className="course-card-header">
                <span className="course-code">{course.code}</span>
                <span className="course-department">{course.department}</span>
              </span>

              <span className="course-title">{course.title}</span>

              <span className="course-professor">
                <UserRound size={15} strokeWidth={2} aria-hidden="true" />
                {course.professor}
              </span>

              <span className="course-metrics">
                <span className="course-metric">
                  <Gauge size={16} strokeWidth={2} aria-hidden="true" />
                  <span>
                    <span className="course-metric-label">Difficulty</span>
                    <strong>{course.difficulty}/5</strong>
                  </span>
                </span>

                <span className="course-metric">
                  <ThumbsUp size={16} strokeWidth={2} aria-hidden="true" />
                  <span>
                    <span className="course-metric-label">Would take again</span>
                    <strong>{course.wouldTakeAgain}%</strong>
                  </span>
                </span>

                <span className="course-metric">
                  <MessageSquare size={16} strokeWidth={2} aria-hidden="true" />
                  <span>
                    <span className="course-metric-label">Discussions</span>
                    <strong>{course.discussionCount}</strong>
                  </span>
                </span>
              </span>

              <span className="course-card-action">
                View course
                <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="courses-empty-state" role="status">
          <Search size={23} strokeWidth={1.8} aria-hidden="true" />
          <h2>No courses found</h2>
          <p>Try searching with a different course code, title, professor, or department.</p>
        </div>
      )}
    </section>
  );
}
