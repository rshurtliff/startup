import { assignments as mockAssignments } from '../dashboard/mockData';
import { classTimesFor } from '../assignment/mockData';
import { LiveNotifier } from '../liveNotifier';

// The assignment list is saved on the server under whoever is logged in. The
// dashboard, the assignment page, and settings all read and write this list.

// Gets my list from the server. A new account has nothing saved yet, so it
// starts from the mock data and saves that.
export async function loadAssignments() {
  const response = await fetch('/api/assignments');
  if (!response.ok) {
    return [];
  }
  const list = await response.json();
  if (list.length > 0) {
    return list;
  }
  await saveAssignmentList(mockAssignments);
  return mockAssignments;
}

// Replaces my whole list on the server
export async function saveAssignmentList(list) {
  await fetch('/api/assignments', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(list),
  });
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

// Everyone's logged hours on an assignment: the mock classmates, the live
// ones, real users from the server, and mine once I've finished it and saved
// hours. Assignments I added have none.
export function allTimesFor(assignment, classTimes = {}) {
  if (isCustom(assignment)) {
    return [];
  }
  const times = [
    ...classTimesFor(assignment),
    ...LiveNotifier.timesFor(assignment.id),
    ...(classTimes[assignment.id] || []),
  ];
  if (assignment.done && assignment.myHours != null) {
    times.push(assignment.myHours);
  }
  return times;
}

// The class average the dashboard and the assignment page both show, so they
// always match. It moves when I save my hours.
export function classAverage(assignment, classTimes = {}) {
  const times = allTimesFor(assignment, classTimes);
  return times.reduce((sum, t) => sum + t, 0) / times.length;
}
