// My classes come from my assignments now, since Canvas decides which classes
// I'm in. Every page works the list out the same way, so a class gets the same
// color everywhere.

// For assignments I add that don't belong to a Canvas class
export const otherClass = { key: 'other', code: 'Other' };

// Class colors in order. The first class (by course code) gets the first one.
const palette = ['var(--class-1)', 'var(--class-2)', 'var(--class-3)', 'var(--class-4)', 'var(--class-5)', 'var(--class-6)'];

// Every class in a list of assignments, once each, sorted by course code
export function classesFrom(assignments) {
  const classes = [];
  for (const a of assignments) {
    if (!classes.some((c) => c.key === a.classKey)) {
      classes.push({ key: a.classKey, code: a.classCode });
    }
  }
  return classes.sort((a, b) => a.code.localeCompare(b.code));
}

// The style that gives a row or card its class color. Anything inside reads
// --class-color, like the ClassTag pill and the colored left border.
export function classStyle(classKey, classes) {
  const real = classes.filter((c) => c.key !== otherClass.key);
  const index = real.findIndex((c) => c.key === classKey);
  const color = index === -1 ? 'var(--text-muted)' : palette[index % palette.length];
  return { '--class-color': color };
}
