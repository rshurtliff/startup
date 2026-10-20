// Canvas due dates come as plain dates like '2026-10-12', with no time.
// Keeping them in that format means they sort correctly as plain text.

// new Date('2026-10-12') reads a date-only string as midnight UTC, which is
// the evening before in Utah. Adding a time makes it local midnight instead.
function parseDue(due) {
  return new Date(`${due}T00:00`);
}

// '2026-10-12' becomes 'Mon, Oct 12'
export function formatDue(due) {
  return parseDue(due).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Due today or in the next two days. Past due doesn't count.
export function isDueSoon(due) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Math.round smooths over the hour lost or gained on daylight saving days
  const daysLeft = Math.round((parseDue(due) - today) / (1000 * 60 * 60 * 24));
  return daysLeft >= 0 && daysLeft <= 2;
}

// A saved time like '2026-10-19T21:04:00.000Z' as 'just now', '5 minutes ago',
// '2 hours ago', or '3 days ago'
export function timeAgo(isoTime) {
  const minutes = Math.floor((Date.now() - new Date(isoTime)) / (1000 * 60));
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

// For the mock data: a date n days from today in the same 'YYYY-MM-DD' format,
// so the sample assignments are always near today when I test.
export function daysFromToday(n) {
  const date = new Date();
  date.setDate(date.getDate() + n);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
