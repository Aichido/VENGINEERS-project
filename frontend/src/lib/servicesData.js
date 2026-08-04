// Secondary service cards for the Services page bento grid (Maintenance & Support).
// The two larger cards (Installation, After-Sales Service) have bespoke layouts
// and are written directly in Services.jsx, since they don't share the same shape.

export const secondaryServices = [
  {
    id: 'maintenance',
    icon: 'RefreshCw',
    title: 'Preventive Maintenance',
    description:
      'Stay ahead of failures with our tailored maintenance contracts — regular cleaning, updates, and testing.',
    linkLabel: 'Learn more',
  },
  {
    id: 'support',
    icon: 'Headphones',
    title: '24/7 Technical Support',
    description:
      'Remote and on-site assistance to answer your technical questions and resolve complex incidents.',
    linkLabel: 'Access support',
  },
]
