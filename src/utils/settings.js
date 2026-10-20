// Settings that more than one page reads. localStorage stands in for the
// database until the service exists.

// The last Canvas sync: when it ran and how many assignments it found per
// class. null means it has never synced.
export function loadSyncInfo() {
  const saved = localStorage.getItem('canvasSync');
  return saved ? JSON.parse(saved) : null;
}

// How many assignments the last sync loaded in all
export function totalFound(syncInfo) {
  return syncInfo.classes.reduce((sum, c) => sum + c.found, 0);
}

// Reminder email settings. Until they're saved once, reminders go to the
// BYU address for my Net ID, a day ahead, with the Sunday summary on.
export function loadReminders(userName) {
  const saved = localStorage.getItem('reminders');
  if (saved) {
    return JSON.parse(saved);
  }
  return { email: userName ? `${userName}@byu.edu` : '', leadTime: '24', digest: true };
}

// The words for each "Remind me" option
export const leadTimeLabels = {
  24: '24 hours',
  48: '2 days',
  72: '3 days',
};
