// ─────────────────────────────────────────────────────────────
//  mockData.js  –  All dummy data for OwlNet UI prototype
// ─────────────────────────────────────────────────────────────

export const TAGS = [
  { id: 'all',        label: 'All Posts',    icon: '🏠' },
  { id: 'housing',    label: 'Housing',      icon: '🏠' },
  { id: 'classes',    label: 'Classes',      icon: '📚' },
  { id: 'campus',     label: 'Campus Life',  icon: '🎓' },
  { id: 'jobs',       label: 'Jobs & Internships', icon: '💼' },
  { id: 'events',     label: 'Events',       icon: '🎉' },
  { id: 'sports',     label: 'Sports',       icon: '⚽' },
  { id: 'food',       label: 'Food & Dining', icon: '🍕' },
  { id: 'safety',     label: 'Safety',       icon: '🛡️' },
  { id: 'tech',       label: 'Tech & CS',    icon: '💻' },
  { id: 'health',     label: 'Health',       icon: '❤️' },
  { id: 'rants',      label: 'Rants',        icon: '😤' },
];

export const MOCK_USERS = [
  { id: 1,  name: 'Alex Rivera',    handle: '@alexr_fau',    avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4`    },
  { id: 2,  name: 'Jordan Lee',     handle: '@jlee_owl',     avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan&backgroundColor=ffd5dc`   },
  { id: 3,  name: 'Sam Patel',      handle: '@sampatel_cs',  avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=Sam&backgroundColor=c0aede`      },
  { id: 4,  name: 'Maya Thompson',  handle: '@mayaT',        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=Maya&backgroundColor=d1fae5`     },
  { id: 5,  name: 'Chris Nguyen',   handle: '@c_nguyen_fau', avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=Chris&backgroundColor=fee2e2`    },
  { id: 6,  name: 'Dana Kim',       handle: '@danakim',      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=Dana&backgroundColor=fef3c7`     },
];

export const MOCK_COMMENTS = [
  { id: 1, user: MOCK_USERS[1], text: 'This is super helpful, thanks for sharing! I was looking for exactly this info.', likes: 14, time: '45 min ago' },
  { id: 2, user: MOCK_USERS[2], text: 'Agreed! Also check out the university housing portal — they updated it last week.', likes: 8,  time: '32 min ago' },
  { id: 3, user: MOCK_USERS[3], text: 'Wait really?? I had no idea. Do you need to apply separately for the priority list?', likes: 3,  time: '18 min ago' },
  { id: 4, user: MOCK_USERS[0], text: 'Yes, I think you do. There is a link in the MyFAU portal under "Housing Services."', likes: 11, time: '10 min ago' },
];

export const MOCK_POSTS = [
  {
    id: 1,
    user: MOCK_USERS[0],
    title: '📢 Everything you need to know about off-campus housing near Boca campus',
    body: 'After spending 3 semesters trying to figure out housing near FAU Boca, I put together this comprehensive guide. I cover Abacoa, Palmetto Dunes, University Village, and a few hidden gems that are walking distance to campus. Prices range from $850–$1,400/mo for a single room. Happy to answer any questions in the comments!',
    tags: ['housing', 'campus'],
    upvotes: 284,
    downvotes: 12,
    commentCount: 47,
    timeAgo: '2 hours ago',
    isPinned: true,
    comments: MOCK_COMMENTS,
  },
  {
    id: 2,
    user: MOCK_USERS[1],
    title: 'COP3530 (Data Structures) with Prof. Tavana — worth it or nah?',
    body: 'I\'m registering for Fall and COP3530 is required for my CS degree. I\'ve heard mixed reviews about this section. The workload sounds intense but people say you come out really prepared. Anyone have recent experience with this course? Any tips on getting through the projects?',
    tags: ['classes', 'tech'],
    upvotes: 156,
    downvotes: 8,
    commentCount: 33,
    timeAgo: '4 hours ago',
    isPinned: false,
    comments: [
      { id: 5, user: MOCK_USERS[3], text: 'Took it last spring — challenging but 100% worth it. Start the projects EARLY.', likes: 22, time: '3 hrs ago' },
      { id: 6, user: MOCK_USERS[4], text: 'The midterm hit different 😭 study the sorting algorithms really well.', likes: 17, time: '2 hrs ago' },
    ],
  },
  {
    id: 3,
    user: MOCK_USERS[2],
    title: 'FAU career fair next Thursday — companies confirmed so far 🎉',
    body: 'Just got the confirmed list from the Career Center. Some highlights: Amazon, Chewy, FPL, Northrop Grumman, and a dozen local startups. The event is in the Breezeway from 10am–3pm. Bring printed resumes and dress business casual. Pro tip: arrive at 10am sharp before it gets crowded!',
    tags: ['jobs', 'events', 'campus'],
    upvotes: 312,
    downvotes: 4,
    commentCount: 61,
    timeAgo: '6 hours ago',
    isPinned: false,
    comments: [
      { id: 7, user: MOCK_USERS[5], text: 'This is awesome! Is it open to all majors or just engineering/CS?', likes: 9, time: '5 hrs ago' },
      { id: 8, user: MOCK_USERS[2], text: 'Open to ALL majors! They have positions in business, marketing, and design too.', likes: 14, time: '4 hrs ago' },
    ],
  },
  {
    id: 4,
    user: MOCK_USERS[3],
    title: 'Parking situation is absolutely BRUTAL this semester 😤',
    body: 'I pay $200 a semester for a parking pass and I still can\'t find a spot before 9am. The garage on Innovation way is always full by 7:45. Seriously considering dropping my early classes or just riding a bike. Has anyone found a workaround? Is the shuttle from the FAU stadium actually reliable?',
    tags: ['rants', 'campus'],
    upvotes: 498,
    downvotes: 21,
    commentCount: 88,
    timeAgo: '1 day ago',
    isPinned: false,
    comments: [
      { id: 9,  user: MOCK_USERS[0], text: 'The stadium shuttle is actually pretty solid! Runs every 15 min during peak hours.', likes: 31, time: '20 hrs ago' },
      { id: 10, user: MOCK_USERS[1], text: 'I started biking and honestly it slaps. The campus is super bike friendly.', likes: 24, time: '18 hrs ago' },
    ],
  },
  {
    id: 5,
    user: MOCK_USERS[4],
    title: 'Best places to eat on/near campus under $10 🍕',
    body: 'Budget eats guide for fellow broke college students. On campus: Chick-fil-A in the Student Union is always a win, the Fresh Food Company buffet is great value if you have a meal plan. Off campus: Bagel Factory on Glades is 🔥, and La Bamba burritos are huge for $8. Drop your recs below!',
    tags: ['food', 'campus'],
    upvotes: 203,
    downvotes: 3,
    commentCount: 42,
    timeAgo: '1 day ago',
    isPinned: false,
    comments: [
      { id: 11, user: MOCK_USERS[5], text: 'The Steak N Shake on Glades is criminally underrated for late night study fuel 🍔', likes: 19, time: '22 hrs ago' },
    ],
  },
  {
    id: 6,
    user: MOCK_USERS[5],
    title: 'Anyone know if the 24-hour study rooms in Wimberly Library are still a thing?',
    body: 'During finals last semester I swear those rooms were open 24/7. Now I\'m seeing conflicting info. My study group needs a spot at like 2am during finals week. Library website is not updated. Can anyone confirm?',
    tags: ['campus', 'classes'],
    upvotes: 87,
    downvotes: 2,
    commentCount: 14,
    timeAgo: '2 days ago',
    isPinned: false,
    comments: [
      { id: 12, user: MOCK_USERS[3], text: 'Yes! Rooms 212 and 214 on the second floor are still 24-hour during finals. Book via LibCal.', likes: 41, time: '1 day ago' },
    ],
  },
];

export const CURRENT_USER = {
  id: 99,
  name: 'You (Guest)',
  handle: '@guest_user',
  avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=OwlNetUser&backgroundColor=e0f2fe`,
};

export const LOGGED_IN_USER = {
  id: 100,
  name: 'Jamie Owls',
  handle: '@jamieowls_fau',
  avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=JamieOwls&backgroundColor=ddd6fe`,
};

export const AI_SUMMARIES = {
  1: '🦉 AI Summary: This post discusses affordable housing options within walking/biking distance of FAU Boca. Key picks: Palmetto Dunes (~$900/mo) and University Village (~$1,100/mo). Commenters recommend applying early.',
  2: '🦉 AI Summary: Mixed reviews on COP3530. Most agree the course is rigorous but highly rewarding. Top tip: begin all projects at least 1 week before the due date.',
  3: '🦉 AI Summary: FAU career fair on Thursday in the Breezeway. Amazon, Chewy, and FPL are confirmed. Open to all majors. Arrive early for best results.',
  4: '🦉 AI Summary: Widespread frustration over FAU parking. The stadium shuttle and cycling are the top community-recommended alternatives.',
  5: '🦉 AI Summary: Top budget picks near campus: Bagel Factory, La Bamba, and Chick-fil-A. Meal plan holders should prioritize Fresh Food Company for value.',
  6: '🦉 AI Summary: Confirmed — Wimberly Library rooms 212 & 214 are 24/7 during finals week. Reserve via LibCal in advance.',
};
