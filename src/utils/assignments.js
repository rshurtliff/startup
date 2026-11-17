// The assignment list is saved on the server under whoever is logged in. The
// dashboard, the assignment page, and settings all read and write this list.

// Gets my list from the server. A new account has nothing until it syncs
// with Canvas or adds one by hand.
export async function loadAssignments() {
  const response = await fetch('/api/assignments');
  if (!response.ok) {
    return [];
  }
  return await response.json();
}

// Saves just what changed, as a list like [{ id, done: true, doneAt }].
// Sending only the changed fields keeps the request small. My whole Canvas
// list with descriptions is too big to send every time I check one off.
// Returns true if the server saved it, so pages don't act like a failed save
// worked.
export async function saveAssignmentChanges(changes) {
  try {
    const response = await fetch('/api/assignments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Deletes one assignment I added myself. Returns true if it worked.
export async function deleteAssignmentById(id) {
  try {
    const response = await fetch(`/api/assignments/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return response.ok;
  } catch {
    return false;
  }
}

// Everyone else's logged hours from the server, grouped by assignment id
export async function loadClassTimes() {
  const response = await fetch('/api/times');
  if (!response.ok) {
    return {};
  }
  return await response.json();
}

// Assignments I add with the form get ids that start with 'custom-'. Nobody
// else has them, so they can be deleted, don't ask how long they took, and
// never count toward anyone's time stats.
export function isCustom(assignment) {
  return assignment.id.startsWith('custom-');
}

// Everyone's logged hours on an assignment: other students' from the server,
// and mine once I've finished it and saved hours. Assignments I added have none.
export function allTimesFor(assignment, classTimes = {}) {
  if (isCustom(assignment)) {
    return [];
  }
  const times = [...(classTimes[assignment.id] || [])];
  if (assignment.done && assignment.myHours != null) {
    times.push(assignment.myHours);
  }
  return times;
}

// The class average the dashboard and the assignment page both show, so they
// always match. It moves when I save my hours. null when nobody has logged
// time yet, since there's nothing to average.
export function classAverage(assignment, classTimes = {}) {
  const times = allTimesFor(assignment, classTimes);
  if (times.length === 0) {
    return null;
  }
  return times.reduce((sum, t) => sum + t, 0) / times.length;
}

// "1 hour", "2.5 hours". For the live messages about classmates' time.
export function hoursLabel(hours) {
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

// Other students' notes on one assignment, newest first. Each is
// { hours, text } with no name, so they show as "A classmate."
export async function loadClassNotes(id) {
  const response = await fetch(`/api/notes/${encodeURIComponent(id)}`);
  if (!response.ok) {
    return [];
  }
  return await response.json();
}
