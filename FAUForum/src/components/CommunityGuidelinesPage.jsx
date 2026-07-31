import {
  ArrowLeft,
  Flag,
  GraduationCap,
  HeartHandshake,
  LockKeyhole,
  MessageSquareOff,
  ShieldCheck,
  UserRoundX,
} from 'lucide-react';

const COMMUNITY_RULES = [
  {
    title: 'Post with respect',
    description:
      'Disagree with ideas without attacking people. Keep replies constructive and welcoming to students from every background.',
    icon: HeartHandshake,
  },
  {
    title: 'No harassment',
    description:
      'Threats, targeted insults, discrimination, bullying, and repeated unwanted contact are not allowed.',
    icon: UserRoundX,
  },
  {
    title: 'Keep it useful',
    description:
      'Avoid spam, repeated promotions, misleading links, and posts created only to disrupt a discussion.',
    icon: MessageSquareOff,
  },
  {
    title: 'Protect private information',
    description:
      'Do not share another person’s contact details, student records, location, or other private information without permission.',
    icon: LockKeyhole,
  },
  {
    title: 'Report harmful behavior',
    description:
      'Use the report option when a post or comment breaks these guidelines. Reports help moderators review concerns without escalating the conversation.',
    icon: Flag,
  },
  {
    title: 'Practice academic honesty',
    description:
      'Course advice and study help are welcome, but do not request or share answers to active exams, quizzes, or graded assignments.',
    icon: GraduationCap,
  },
];

export default function CommunityGuidelinesPage({ onBack }) {
  return (
    <section
      className="resource-page guidelines-page animate-fade-in"
      aria-labelledby="guidelines-page-title"
    >
      <button type="button" onClick={onBack} className="page-back-button">
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Back to feed
      </button>

      <header className="resource-hero guidelines-hero">
        <span className="resource-hero-icon guidelines-hero-icon" aria-hidden="true">
          <ShieldCheck size={27} strokeWidth={1.9} />
        </span>

        <div className="resource-hero-copy">
          <p className="resource-eyebrow">Community standards</p>
          <h1 id="guidelines-page-title">Community Guidelines</h1>
          <p>
            OwlNet works best when students can ask questions, exchange advice, and disagree
            thoughtfully. These standards apply to posts, comments, profiles, and messages shared
            on the platform.
          </p>
        </div>
      </header>

      <div className="resource-content">
        <section className="resource-section" aria-labelledby="guidelines-rules-title">
          <div className="resource-section-heading">
            <div>
              <p className="resource-section-eyebrow">Before you post</p>
              <h2 id="guidelines-rules-title">Help keep OwlNet useful</h2>
            </div>
            <p>Use the same judgment online that you would use in an FAU classroom.</p>
          </div>

          <div className="resource-card-grid guidelines-rule-grid">
            {COMMUNITY_RULES.map((rule) => {
              const RuleIcon = rule.icon;

              return (
                <article key={rule.title} className="resource-card guidelines-rule-card">
                  <span className="resource-card-icon guidelines-rule-icon" aria-hidden="true">
                    <RuleIcon size={19} strokeWidth={2} />
                  </span>
                  <div>
                    <h3>{rule.title}</h3>
                    <p>{rule.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="resource-callout guidelines-report-callout" aria-labelledby="report-title">
          <Flag size={21} strokeWidth={2} aria-hidden="true" />
          <div>
            <h2 id="report-title">See something that breaks the rules?</h2>
            <p>
              Report the post or comment so a moderator can review it. If someone may be in
              immediate danger, contact campus safety or emergency services instead of relying on a
              forum report.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
