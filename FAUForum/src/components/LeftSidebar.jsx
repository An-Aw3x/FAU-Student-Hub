import {
  BookOpen,
  Briefcase,
  CalendarDays,
  FileText,
  GraduationCap,
  HeartPulse,
  House,
  Laptop,
  LayoutList,
  MessageSquare,
  ShieldCheck,
  Tag,
  TrendingUp,
  Trophy,
  Utensils,
} from 'lucide-react';
import { TAGS } from '../data/mockData';

const TOPIC_ICONS = {
  all: LayoutList,
  housing: House,
  classes: BookOpen,
  campus: GraduationCap,
  jobs: Briefcase,
  events: CalendarDays,
  sports: Trophy,
  food: Utensils,
  safety: ShieldCheck,
  tech: Laptop,
  health: HeartPulse,
  rants: MessageSquare,
};

const COMMUNITY_LINKS = [
  {
    id: 'guidelines',
    label: 'Community Guidelines',
    icon: ShieldCheck,
    view: 'guidelines',
  },
  {
    id: 'trending',
    label: 'Trending This Week',
    icon: TrendingUp,
    view: 'trending',
  },
  {
    id: 'wiki',
    label: 'FAU Student Wiki',
    icon: BookOpen,
    view: 'wiki',
  },
  {
    id: 'terms',
    label: 'Terms of Service',
    icon: FileText,
    view: 'terms',
  },
];

export default function LeftSidebar({
  activeTag,
  activeView = 'feed',
  onTagChange,
  onOpenCourses,
  onOpenCommunityResource,
  aiSummaryEnabled,
  onAiToggle,
  mobileOpen,
}) {
  const courseHubActive = activeView === 'courses' || activeView === 'courseDetail';

  return (
    <aside
      id="left-sidebar"
      className={`
        left-sidebar fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-64
        flex-col gap-5 overflow-y-auto px-4 py-5
        transition-transform duration-300 ease-in-out
        lg:static lg:z-auto lg:h-auto lg:translate-x-0 lg:overflow-visible
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      aria-label="Left sidebar navigation"
    >
      <section
        className="ai-summary-preference rounded-lg border p-3.5"
        aria-labelledby="ai-summary-heading"
      >
        <div className="ai-summary-preference-row flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText
                className="ai-summary-preference-icon shrink-0"
                size={16}
                strokeWidth={1.9}
                aria-hidden="true"
              />
              <h2
                id="ai-summary-heading"
                className="ai-summary-preference-title text-sm font-bold"
              >
                Summary Preview
              </h2>
            </div>
            <p className="ai-summary-preference-copy mt-1.5 text-xs leading-relaxed">
              Show a locally prepared overview on supported sample discussions.
            </p>
          </div>

          <label className="toggle-switch mt-0.5 shrink-0" aria-label="Toggle AI summaries">
            <input
              id="ai-summary-toggle"
              type="checkbox"
              checked={aiSummaryEnabled}
              onChange={onAiToggle}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {aiSummaryEnabled && (
          <p
            className="ai-summary-preference-status mt-3 border-t pt-2.5 text-xs animate-fade-in"
            role="status"
          >
            Preview summaries are enabled for supported sample discussions.
          </p>
        )}
      </section>

      <nav className="sidebar-section" aria-label="Student tools">
        <h2 className="sidebar-section-title mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em]">
          Student Tools
        </h2>

        <button
          id="open-course-hub"
          type="button"
          onClick={onOpenCourses}
          className={`sidebar-link sidebar-tool-link w-full text-left ${
            courseHubActive ? 'active' : ''
          }`}
          aria-current={courseHubActive ? 'page' : undefined}
        >
          <BookOpen
            className="sidebar-link-icon shrink-0"
            size={16}
            strokeWidth={1.9}
            aria-hidden="true"
          />
          <span className="truncate">Course Hub</span>
          {courseHubActive && (
            <span
              className="sidebar-active-marker ml-auto h-4 w-0.5 shrink-0 rounded-sm"
              aria-hidden="true"
            />
          )}
        </button>
      </nav>

      <div className="sidebar-divider h-px" aria-hidden="true" />

      <nav className="sidebar-section" aria-label="Browse by tag">
        <h2 className="sidebar-section-title mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em]">
          Browse Topics
        </h2>

        <div className="sidebar-nav-list flex flex-col gap-0.5">
          {TAGS.map((topic) => {
            const TopicIcon = TOPIC_ICONS[topic.id] || Tag;
            const isActive = activeView === 'feed' && activeTag === topic.id;

            return (
              <button
                key={topic.id}
                id={`tag-${topic.id}`}
                type="button"
                onClick={() => onTagChange(topic.id)}
                className={`sidebar-link sidebar-topic-link w-full text-left ${
                  isActive ? 'active' : ''
                }`}
                aria-pressed={isActive}
              >
                <TopicIcon
                  className="sidebar-link-icon shrink-0"
                  size={16}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
                <span className="truncate">{topic.label}</span>
                {isActive && (
                  <span
                    className="sidebar-active-marker ml-auto h-4 w-0.5 shrink-0 rounded-sm"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="sidebar-divider h-px" aria-hidden="true" />

      <nav className="sidebar-section" aria-label="Community links">
        <h2 className="sidebar-section-title mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em]">
          Community
        </h2>

        <div className="sidebar-nav-list flex flex-col gap-0.5">
          {COMMUNITY_LINKS.map((link) => {
            const LinkIcon = link.icon;
            const isActive = activeView === link.view;

            return (
              <button
                key={link.id}
                id={`community-${link.id}`}
                type="button"
                onClick={() => onOpenCommunityResource(link.view)}
                className={`sidebar-link sidebar-community-link w-full text-left ${
                  isActive ? 'active' : ''
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <LinkIcon
                  className="sidebar-link-icon shrink-0"
                  size={16}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
                <span className="truncate">{link.label}</span>
                {isActive && (
                  <span
                    className="sidebar-active-marker ml-auto h-4 w-0.5 shrink-0 rounded-sm"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <footer
        className="sidebar-footer mt-auto border-t pt-4 text-xs leading-relaxed"
      >
        <p>
          &copy; 2026 OwlNet <span aria-hidden="true">&middot;</span> FAU Student Forum
        </p>
        <p className="mt-1">Built for the FAU student community.</p>
      </footer>
    </aside>
  );
}
