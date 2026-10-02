// Placeholder data for the assignment detail page. In Phase 2 these come from
// the service for whichever assignment id is in the URL.

// Database placeholder. The service adds up every logged time for this
// assignment and returns these buckets. Each bar's height is its count
// divided by the tallest count.
export const buckets = [
  { label: 'Under 1', count: 2 },
  { label: '1 to 2', count: 7 },
  { label: '2 to 3', count: 12 },
  { label: '3 to 4', count: 9 },
  { label: 'Over 4', count: 4 },
];

export const stats = [
  { label: 'Average', value: '3.2 hours' },
  { label: 'Median', value: '2.9 hours' },
  { label: 'Longest', value: '6.5 hours' },
];

// Database placeholder. Notes other students left when they logged their time.
export const notes = [
  { name: 'Kate D.', hours: 2.5, text: 'Write the page plan first, it makes the nav bar trivial.' },
  { name: 'Tyler M.', hours: 2.75, text: 'The placeholders are the whole point, do not try to make it pretty.' },
  { name: 'Sam R.', hours: 4, text: 'Most of my time went to getting it deployed, not writing HTML.' },
];
