import {
  ArrowLeft,
  BadgeAlert,
  Gavel,
  IdCard,
  MonitorCheck,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';

const TERMS_SECTIONS = [
  {
    title: 'Acceptable use',
    description:
      'Use OwlNet for lawful, student-focused discussion. Do not harass others, post spam, interfere with the service, or share content you do not have permission to use.',
    icon: ShieldCheck,
  },
  {
    title: 'Moderation',
    description:
      'Moderators may review reports and remove content or restrict accounts that violate community standards. A report does not guarantee a particular outcome.',
    icon: Gavel,
  },
  {
    title: 'No impersonation',
    description:
      'Do not pretend to be another student, faculty member, staff member, department, or official FAU representative.',
    icon: IdCard,
  },
  {
    title: 'Your responsibility',
    description:
      'You are responsible for what you publish, the accuracy of your claims, and protecting your account and personal information. Think carefully before sharing.',
    icon: UserRoundCheck,
  },
];

export default function TermsPage({ onBack }) {
  return (
    <section className="resource-page terms-page animate-fade-in" aria-labelledby="terms-page-title">
      <button type="button" onClick={onBack} className="page-back-button">
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Back to feed
      </button>

      <header className="resource-hero terms-hero">
        <span className="resource-hero-icon terms-hero-icon" aria-hidden="true">
          <MonitorCheck size={27} strokeWidth={1.9} />
        </span>

        <div className="resource-hero-copy">
          <p className="resource-eyebrow">Platform information</p>
          <h1 id="terms-page-title">Terms of Service</h1>
          <p>
            These plain-language terms explain the expectations for using OwlNet. By using the
            platform, you agree to follow these terms and the Community Guidelines.
          </p>
        </div>
      </header>

      <div className="resource-content">
        <aside className="resource-callout terms-demo-callout" aria-labelledby="demo-notice-title">
          <BadgeAlert size={22} strokeWidth={2} aria-hidden="true" />
          <div>
            <h2 id="demo-notice-title">Student project notice</h2>
            <p>
              OwlNet is a class project and demonstration unless it is officially deployed and
              authorized by Florida Atlantic University. It should not be treated as an official
              FAU service, advising channel, emergency resource, or source of university policy.
            </p>
          </div>
        </aside>

        <section className="resource-section" aria-labelledby="terms-expectations-title">
          <div className="resource-section-heading">
            <div>
              <p className="resource-section-eyebrow">Using OwlNet</p>
              <h2 id="terms-expectations-title">Shared responsibilities</h2>
            </div>
            <p>These expectations help keep the student community safe and dependable.</p>
          </div>

          <div className="resource-card-grid terms-card-grid">
            {TERMS_SECTIONS.map((section) => {
              const SectionIcon = section.icon;

              return (
                <article key={section.title} className="resource-card terms-card">
                  <span className="resource-card-icon terms-card-icon" aria-hidden="true">
                    <SectionIcon size={19} strokeWidth={2} />
                  </span>
                  <div>
                    <h3>{section.title}</h3>
                    <p>{section.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="resource-note terms-note" aria-labelledby="terms-changes-title">
          <h2 id="terms-changes-title">Changes and availability</h2>
          <p>
            Features, content, and these terms may change as the student project develops. Access
            may be limited or unavailable, and users should keep copies of anything they need to
            retain.
          </p>
        </section>
      </div>
    </section>
  );
}
