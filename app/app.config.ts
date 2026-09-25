/**
 * Brand seam. Every brand string the components render lives here so the
 * site can become a template by editing one file.
 */
export default defineAppConfig({
  site: {
    name: 'The Upgrade',
    tagline: 'Your seat on the left side of the curtain',
    description: 'A fortnightly letter from Kuala Lumpur on elite status, loyalty strategy and the hotels and cabins that justify the chase.',
    cadence: 'Fortnightly from Kuala Lumpur',
    title: 'Status, strategy, and the stays worth the miles',
  },
  author: {
    name: 'Qie',
    role: 'a software engineer in Kuala Lumpur',
  },
  subscribe: {
    placeholder: 'you@email.com',
    meta: ['Free', 'Fortnightly', 'No affiliate spam'],
    metaBand: ['Free', 'Fortnightly', 'Leave any time'],
    thanks: 'Nice. The next issue lands in your inbox.',
    error: 'That did not go through. Try again in a moment.',
  },
  // Cinematic hero. Panels are named, not an array, so each keeps its own shape.
  hero: {
    title: 'The Upgrade',
    intro: { lead: 'Status, strategy, and the stays', em: 'worth the miles.' },
    tagsLabel: 'What you get',
    panels: {
      maths: {
        heading: 'The maths first, then the moment.',
        body: 'A letter for people who chase elite status from KUL and want the maths and the moment. Which tier is worth it, which stays justify it, and what to do with the points you already have.',
        facts: [
          { of: 'issues', label: 'issues and counting' },
          { of: 'programmes', label: 'programmes covered' },
        ] as { of: 'issues' | 'programmes', label: string }[],
      },
      letter: {
        heading: 'Fortnightly from Kuala Lumpur.',
        body: 'A fortnightly letter from Kuala Lumpur on elite status, loyalty strategy and the hotels and cabins that justify the chase.',
        cta: { label: 'Read the latest issue', to: '#latest' },
      },
    },
    recent: { label: 'Recent issues' },
  },
  // Programmes covered, in marquee order.
  programmes: [
    'Enrich',
    'KrisFlyer',
    'Marriott Bonvoy',
    'Hilton Honors',
    'Accor ALL',
    'World of Hyatt',
    'Asia Miles',
    'IHG One Rewards',
  ],
  nav: [
    { label: 'Issues', to: '#issues' },
    { label: 'Status Tracker', to: '#journey', soon: true },
    { label: 'About', to: '#about' },
  ],
  footerLinks: [
    { label: 'Issues', to: '#issues' },
    { label: 'Status Tracker', to: '#journey' },
    { label: 'About', to: '#about' },
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
  ],
  // Rendered nowhere yet. Add { label, href } entries when the accounts exist.
  social: [] as { label: string, href: string }[],
  legal: {
    disclaimer: 'The Upgrade is an independent publication and is not affiliated with, endorsed by or sponsored by any airline, hotel group or loyalty programme. Programme names are used for identification only. Nothing here is financial advice. Always verify status rules with the programme before you book.',
    studio: 'Designed by Qie / Axel Nova Ventures · Simple, effortless, human.',
    since: 2026,
  },
})
