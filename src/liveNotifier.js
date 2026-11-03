// Made-up classmates for the fake events
const classmates = ['Kate D.', 'Tyler M.', 'Sam R.', 'Josh P.', 'Emma L.', 'Ben W.'];

// Stands in for the WebSocket until that deliverable. Components add a handler
// to hear about classmates logging time, and remove it when they go away.
// Later, the events come from the server instead of a timer.
class LiveEventNotifier {
  handlers = [];

  // My real Canvas assignments, so the fake classmates only log time on ones
  // I actually have. loadAssignments() fills this in.
  assignments = [];

  // Hours classmates logged since the app opened, by assignment id
  liveTimes = {};

  constructor() {
    // Every 5 seconds a made-up classmate logs time on one of my assignments,
    // somewhere between half an hour and 4 hours
    setInterval(() => {
      if (this.assignments.length === 0) {
        return;
      }
      const assignment = this.assignments[Math.floor(Math.random() * this.assignments.length)];
      const hours = Math.round((0.5 + Math.random() * 3.5) * 4) / 4;
      const name = classmates[Math.floor(Math.random() * classmates.length)];

      if (!this.liveTimes[assignment.id]) {
        this.liveTimes[assignment.id] = [];
      }
      this.liveTimes[assignment.id].push(hours);

      this.broadcast({
        name,
        hours,
        assignmentId: assignment.id,
        title: assignment.title,
        classCode: assignment.classCode,
      });
    }, 5000);
  }

  setAssignments(list) {
    this.assignments = list;
  }

  // The live times for one assignment, or none yet
  timesFor(id) {
    return this.liveTimes[id] || [];
  }

  addHandler(handler) {
    this.handlers.push(handler);
  }

  removeHandler(handler) {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }

  // Sends one event to every handler that's listening
  broadcast(event) {
    this.handlers.forEach((handler) => handler(event));
  }
}

export const LiveNotifier = new LiveEventNotifier();
