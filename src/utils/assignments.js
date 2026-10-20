import { assignments as mockAssignments } from '../dashboard/mockData';

// localStorage stands in for the database until the service exists. The
// dashboard and the assignment page both read and write this same list.

// The saved list. The first visit ever has nothing saved, so it starts from
// the mock data and saves that.
export function loadAssignments() {
  const saved = localStorage.getItem('assignments');
  if (saved) {
    return JSON.parse(saved);
  }
  localStorage.setItem('assignments', JSON.stringify(mockAssignments));
  return mockAssignments;
}

export function saveAssignmentList(list) {
  localStorage.setItem('assignments', JSON.stringify(list));
}

// Assignments I add with the form get ids that start with 'custom-'. Nobody
// else has them, so they can be deleted, don't ask how long they took, and
// never count toward anyone's time stats.
export function isCustom(assignment) {
  return assignment.id.startsWith('custom-');
}
