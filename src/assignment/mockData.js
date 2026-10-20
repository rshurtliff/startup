// Placeholder data for the assignment detail page. Once the service exists it
// sends the logged times and notes for whichever assignment id is in the URL.

// Database placeholder. How a class's logged hours spread out, as fractions of
// the class average: most people near it, a few fast, a couple way over.
const spread = [0.35, 0.5, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.9, 0.95, 1, 1, 1.05, 1.1, 1.1, 1.15, 1.2, 1.25, 1.3, 1.4, 1.5, 1.7, 2.2];
const spreadAverage = spread.reduce((sum, x) => sum + x, 0) / spread.length;

// Hours other students logged on this assignment. The spread above scaled to
// its class average and rounded to the nearest quarter hour, so the chart
// matches the Class Average column on the dashboard.
export function classTimesFor(assignment) {
  return spread.map((x) => Math.round(((x / spreadAverage) * assignment.average) * 4) / 4);
}

// Database placeholder. Notes other students left when they logged their time.
export const notesById = {
  'cs260-startup-html': [
    { name: 'Kate D.', hours: 2.5, text: 'Write the page plan first, it makes the nav bar trivial.' },
    { name: 'Tyler M.', hours: 2.75, text: 'The placeholders are the whole point, do not try to make it pretty.' },
    { name: 'Sam R.', hours: 4, text: 'Most of my time went to getting it deployed, not writing HTML.' },
  ],
  'fin401-problem-set-4': [
    { name: 'Kate D.', hours: 2.5, text: 'Question 6 is the long one. Do the bond pricing ones first.' },
    { name: 'Josh P.', hours: 3.5, text: 'Have the formula sheet open the whole time.' },
  ],
  'mcom320-persuasive-memo': [
    { name: 'Emma L.', hours: 1.25, text: 'Outline the ask in one sentence before writing anything else.' },
  ],
  'rela275-reading-journal': [
    { name: 'Sam R.', hours: 0.5, text: 'Read first, then write. It goes fast after that.' },
  ],
};
