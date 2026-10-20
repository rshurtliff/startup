import { assignments as canvasAssignments } from './dashboard/mockData';

// Made-up classmates for the fake events
const classmates = ['Kate D.', 'Tyler M.', 'Sam R.', 'Josh P.', 'Emma L.', 'Ben W.'];

// Stands in for the WebSocket until the service exists. Components add a
// handler to hear about classmates logging time, and remove it when they go
// away. Later, the events come from the server instead of a timer.
class LiveEventNotifier {
  handlers = [];

  // Hours classmates logged since the app opened, by assignment id. The
  // server keeps these once it exists.
  liveTimes = {};

  constructor() {
    // Every 5 seconds a made-up classmate logs time on a random assignment
    setInterval(() => {
      const assignment = canvasAssignments[Math.floor(Math.random() * canvasAssignments.length)];
      const hours = Math.max(0.25, Math.round(assignment.average * (0.5 + Math.random()) * 4) / 4);
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
