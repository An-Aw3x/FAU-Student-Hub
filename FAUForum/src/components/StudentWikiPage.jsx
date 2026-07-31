import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Car,
  ExternalLink,
  GraduationCap,
  Home,
  Landmark,
  MapPin,
  Utensils,
  Users,
} from 'lucide-react';

const WIKI_SECTIONS = [
  {
    id: 'registration',
    title: 'Registration tips',
    icon: CalendarDays,
    items: [
      'Review your degree audit and meet with an academic advisor before registration opens.',
      'Check prerequisites, course locations, and meeting times before adding a class.',
      'Keep one or two backup sections ready in case your first choice fills.',
      'Confirm your final schedule and any account holds in MyFAU.',
    ],
  },
  {
    id: 'housing',
    title: 'Housing',
    icon: Home,
    items: [
      'Start comparing on-campus and off-campus options well before the next term.',
      'Read the full lease, including utility, parking, guest, and renewal policies.',
      'Meet potential roommates and agree on shared expenses before signing anything.',
      'Use official university information when checking housing deadlines and requirements.',
    ],
  },
  {
    id: 'parking',
    title: 'Parking and transportation',
    icon: Car,
    items: [
      'Verify that your vehicle and current parking permit are connected to your account.',
      'Allow extra travel time during the first weeks of a semester and major campus events.',
      'Check lot restrictions before parking; availability can vary by permit type and time.',
      'Consider campus shuttles, carpooling, biking, or walking for busy class periods.',
    ],
  },
  {
    id: 'dining',
    title: 'Dining',
    icon: Utensils,
    items: [
      'Compare meal plans with your weekly schedule and how often you expect to eat on campus.',
      'Check current dining hours before late classes, weekends, and university breaks.',
      'Keep a few nearby off-campus options in mind for group meals and late study sessions.',
      'Ask about dietary accommodations directly when ingredients or preparation are unclear.',
    ],
  },
  {
    id: 'study-spots',
    title: 'Study spots',
    icon: MapPin,
    items: [
      'Use Wimberly Library for quiet floors, group study areas, and research support.',
      'Try the Student Union or an academic building commons between classes.',
      'Reserve group rooms early during midterms and finals when demand is highest.',
      'Always confirm building and library hours because access can change during breaks.',
    ],
  },
  {
    id: 'clubs',
    title: 'Clubs and involvement',
    icon: Users,
    items: [
      'Browse registered student organizations through Owl Central before contacting a club.',
      'Look for Owl Involved and other organization fairs near the start of each semester.',
      'Visit the Club House in the Student Union when you need help finding or starting a group.',
      'Confirm that an organization is currently active before relying on old meeting information.',
    ],
  },
];

const OFFICIAL_PORTALS = [
  {
    name: 'MyFAU',
    description: 'Registration, student records, billing, holds, and university services.',
    href: 'https://myfau.fau.edu/',
    icon: Landmark,
  },
  {
    name: 'Canvas',
    description: 'Course materials, assignments, grades, and instructor announcements.',
    href: 'https://canvas.fau.edu/',
    icon: GraduationCap,
  },
  {
    name: 'Owl Central',
    description: 'Registered student organizations, involvement opportunities, and club events.',
    href: 'https://fau.campuslabs.com/engage/organizations',
    icon: Users,
  },
];

const COMING_SOON_ITEMS = [
  'Financial aid and scholarship planning notes',
  'Internship, career fair, and interview preparation notes',
  'Student-contributed tips reviewed by the OwlNet community',
];

export default function StudentWikiPage({ onBack }) {
  return (
    <section
      className="student-wiki-page resource-page animate-fade-in"
      aria-labelledby="student-wiki-title"
    >
      <button type="button" onClick={onBack} className="page-back-button">
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Back to feed
      </button>

      <header className="resource-page-hero wiki-page-hero">
        <span className="resource-page-hero-icon" aria-hidden="true">
          <BookOpen size={25} strokeWidth={1.9} />
        </span>

        <div>
          <p className="resource-page-eyebrow">Student reference</p>
          <h1 id="student-wiki-title">FAU Student Wiki</h1>
          <p>
            A practical starting point for navigating classes, campus services, and everyday
            student life at Florida Atlantic.
          </p>
        </div>
      </header>

      <div className="wiki-page-layout">
        <div className="wiki-page-main">
          <div className="wiki-page-grid">
            {WIKI_SECTIONS.map((section) => {
              const SectionIcon = section.icon;

              return (
                <article key={section.id} className="wiki-page-card resource-page-card">
                  <div className="wiki-page-card-heading">
                    <span className="wiki-page-card-icon" aria-hidden="true">
                      <SectionIcon size={19} strokeWidth={2} />
                    </span>
                    <h2>{section.title}</h2>
                  </div>

                  <ul className="wiki-page-list">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="wiki-page-sidebar" aria-label="Official student portals">
          <section className="resource-page-panel wiki-page-official-links">
            <p className="resource-page-eyebrow">Official portals</p>
            <h2>FAU student tools</h2>
            <p className="wiki-page-panel-description">
              Sign in through official FAU services for account-specific information.
            </p>

            <div className="wiki-page-link-list">
              {OFFICIAL_PORTALS.map((portal) => {
                const PortalIcon = portal.icon;

                return (
                  <a
                    key={portal.name}
                    href={portal.href}
                    target="_blank"
                    rel="noreferrer"
                    className="wiki-page-external-link"
                  >
                    <span className="wiki-page-external-icon" aria-hidden="true">
                      <PortalIcon size={18} strokeWidth={2} />
                    </span>

                    <span className="wiki-page-external-copy">
                      <strong>{portal.name}</strong>
                      <span>{portal.description}</span>
                    </span>

                    <ExternalLink size={15} strokeWidth={2} aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </section>

          <section className="resource-page-panel wiki-page-note">
            <h2>Before you act</h2>
            <p>
              This wiki offers peer-friendly guidance, not official policy. Confirm deadlines,
              fees, eligibility, and campus hours through FAU before making a decision.
            </p>
          </section>
        </aside>
      </div>

      <section className="resource-page-panel wiki-page-coming-soon">
        <div className="wiki-page-coming-soon-heading">
          <p className="resource-page-eyebrow">Growing resource</p>
          <h2>Coming soon</h2>
        </div>

        <ul>
          {COMING_SOON_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}
