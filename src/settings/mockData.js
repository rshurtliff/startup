import { classes, assignments as canvasAssignments } from '../dashboard/mockData';

// Third party service placeholder. Once the service exists it fetches my iCal
// link from Canvas and parses it. For now this hands back the same shape the
// real one will: when it synced, how many assignments it found for each class,
// and the assignments themselves.
export function syncCanvas(icalUrl) {
  return {
    syncedAt: new Date().toISOString(),
    classes: classes.map((c) => ({
      ...c,
      found: canvasAssignments.filter((a) => a.classKey === c.key).length,
    })),
    assignments: canvasAssignments,
  };
}
