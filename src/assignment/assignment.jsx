import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HoursInput } from '../components/common/hoursInput';
import { LiveIndicator, LiveNote } from '../components/common/liveIndicator';
import { notesById } from './mockData';
import { formatDue, timeAgo } from '../utils/dates';
import { loadSyncInfo } from '../utils/settings';
import { allTimesFor, classAverage, isCustom, loadAssignments, saveAssignmentList } from '../utils/assignments';
import { LiveNotifier } from '../liveNotifier';
import './assignment.css';

// The chart's bars. Each logged time lands in the first bucket it fits under.
const bucketRanges = [
  { label: 'Under 1', under: 1 },
  { label: '1 to 2', under: 2 },
  { label: '2 to 3', under: 3 },
  { label: '3 to 4', under: 4 },
  { label: 'Over 4', under: Infinity },
];

// Counts how many times fall in each bucket
function makeBuckets(times) {
  return bucketRanges.map((range, i) => {
    const over = i === 0 ? 0 : bucketRanges[i - 1].under;
    return { label: range.label, count: times.filter((t) => t >= over && t < range.under).length };
  });
}

// The middle time once they're in order. With an even count it's the average
// of the two in the middle.
function median(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// 3.25 becomes '3.3 hours'
function formatHours(hours) {
  return `${hours.toFixed(1)} hours`;
}

export function Assignment() {
  // The id from the URL, like 'fin401-problem-set-4' from /assignment/fin401-problem-set-4
  const { id } = useParams();

  // The assignment this page shows. loaded turns true once the effect has
  // looked for it, so the page can tell "still loading" from "not found".
  const [assignment, setAssignment] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // The last Canvas sync, for the Last synced tile
  const [syncInfo, setSyncInfo] = useState(null);

  // What's in the Mark It Done form. saved shows a "Saved" line after Save
  // until something in the form changes again.
  const [finished, setFinished] = useState(false);
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  // Finds this id in the saved list, the same list the dashboard uses, and
  // fills the form with what I saved last time. Runs again whenever the id in
  // the URL changes.
  useEffect(() => {
    loadAssignments().then((list) => {
      const found = list.find((a) => a.id === id) || null;
      setAssignment(found);
      setFinished(found ? found.done : false);
      setHours(found && found.myHours != null ? String(found.myHours) : '');
      setNote(found && found.myNote ? found.myNote : '');
      setSaved(false);
      setLoaded(true);
    });
    setSyncInfo(loadSyncInfo());
  }, [id]);

  // The last classmate who logged time on this assignment, for the line under
  // the chart. Setting it also redraws the chart, which picks up their time.
  const [lastLive, setLastLive] = useState(null);

  // Listens for classmates logging time while this page is open. The function
  // it returns is the cleanup: React runs it when I leave the page or the id
  // changes, so the page stops listening.
  useEffect(() => {
    setLastLive(null);

    function handleLiveEvent(event) {
      if (event.assignmentId === id) {
        setLastLive(event);
      }
    }

    LiveNotifier.addHandler(handleLiveEvent);
    return () => {
      LiveNotifier.removeHandler(handleLiveEvent);
    };
  }, [id]);

  // Save on Mark It Done. Writes done, my hours, and my note onto this
  // assignment in the saved list, so the dashboard's checkbox matches. Hours
  // and the note only count if it's finished, and assignments I added never
  // get hours or a note since nobody else has them.
  async function saveProgress(event) {
    event.preventDefault();
    const countsForClass = finished && !isCustom(assignment);
    const updated = {
      ...assignment,
      done: finished,
      myHours: countsForClass && hours !== '' ? Number(hours) : null,
      myNote: countsForClass && note.trim() ? note.trim() : null,
    };
    const list = await loadAssignments();
    await saveAssignmentList(list.map((a) => (a.id === updated.id ? updated : a)));
    setAssignment(updated);
    setSaved(true);
  }

  // Nothing to show until the effect has looked for the assignment
  if (!loaded) {
    return null;
  }

  // Bad id in the URL, like /assignment/nope, or one I deleted
  if (!assignment) {
    return (
      <main className="container not-found">
        <h2>Assignment not found</h2>
        <p>It may have been deleted, or the link is wrong.</p>
        <Link className="btn btn-primary" to="/dashboard">
          Back to dashboard
        </Link>
      </main>
    );
  }

  // Everyone's logged times for the chart and stats: the class's, plus mine
  // once I've saved hours on it
  const times = allTimesFor(assignment);
  const buckets = makeBuckets(times);
  // The tallest bar sets the chart's scale
  const maxCount = Math.max(...buckets.map((b) => b.count));
  const stats = [
    { label: 'Average', value: formatHours(classAverage(assignment)) },
    { label: 'Median', value: formatHours(median(times)) },
    { label: 'Longest', value: formatHours(Math.max(...times)) },
  ];

  // Other students' notes, with mine first once I've saved one
  const notes = [...(notesById[assignment.id] || [])];
  if (assignment.myNote) {
    notes.unshift({ name: 'You', hours: assignment.myHours, text: assignment.myNote });
  }

  return (
    <main className="container">
      <p className="back-link"><Link to="/dashboard">Back to dashboard</Link></p>

      {/* One column for assignments I added, since the chart next to Mark It
          Done isn't there */}
      <div className={`detail-grid${isCustom(assignment) ? ' detail-grid-single' : ''}`}>
        {/* Database placeholder. Only fields the Canvas iCal feed actually has:
            the title and course code (SUMMARY), the due date (DTSTART, usually
            a date with no time), the description, and a link back to Canvas.
            Your status and last synced come from Trackr, not Canvas. */}
        <section className={`card assignment-summary class-${assignment.classKey}`}>
          <div className="card-header">
            <p className="course-line">{assignment.classCode}</p>
          </div>
          <div className="card-body">
            <h2>{assignment.title}</h2>

            <dl className="detail-stats">
              <div>
                <dt>Due</dt>
                <dd>{formatDue(assignment.due)}</dd>
                {!isCustom(assignment) && <dd className="detail-note">No time listed in Canvas</dd>}
              </div>
              <div>
                <dt>Your status</dt>
                <dd>
                  {assignment.done ? 'Done' : 'Not done yet'}
                  {assignment.done && assignment.myHours != null && ` in ${assignment.myHours} hours`}
                </dd>
              </div>
              <div>
                <dt>From</dt>
                <dd>{isCustom(assignment) ? 'Added by you' : 'Canvas calendar'}</dd>
              </div>
              {/* Only Canvas assignments get synced */}
              {!isCustom(assignment) && (
                <div>
                  <dt>Last synced</dt>
                  <dd>{syncInfo ? timeAgo(syncInfo.syncedAt) : 'Not synced yet'}</dd>
                </div>
              )}
            </dl>

            {/* Only Canvas assignments have a description and a page to go back
                to. The DESCRIPTION field from the iCal feed is shown as-is.
                Canvas only sends one for about half of assignments. When it's
                missing, this says "No description in Canvas" instead. */}
            {!isCustom(assignment) && (
              <>
                <div className="assignment-desc">
                  <p className="desc-label">Description from Canvas</p>
                  <p>View this content in MasteryLS.</p>
                </div>
                <a className="btn btn-outline-primary" href="https://byu.instructure.com/calendar" target="_blank" rel="noopener noreferrer">
                  Open in Canvas
                </a>
              </>
            )}
          </div>
        </section>

        {/* WebSocket placeholder. The chart below redraws on its own as other
            students finish this assignment and log their times. Anyone with
            this page open sees the update without refreshing. Assignments I
            added don't have class times, so they get no chart. */}
        {!isCustom(assignment) && (
          <section className="card chart-panel">
            <div className="card-header">
              <h2>How Long It Takes</h2>
              <LiveIndicator />
            </div>
            <div className="card-body">
              {/* CSS draws this table as a bar chart, using each row's count
                  for the bar height. */}
              <figure className="time-chart">
                <table className="bar-chart" style={{ '--max': maxCount }}>
                  <thead>
                    <tr>
                      <th>Hours Spent</th>
                      <th>Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buckets.map((bucket) => (
                      <tr key={bucket.label} style={{ '--count': bucket.count }}>
                        <td>{bucket.label}</td>
                        <td>{bucket.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <figcaption>
                  Hours spent by the {times.length} students who have finished this assignment.
                </figcaption>
              </figure>

              <ul className="stat-list">
                {stats.map((stat) => (
                  <li key={stat.label}>
                    <span className="stat-label">{stat.label}</span> <span className="stat-value">{stat.value}</span>
                  </li>
                ))}
              </ul>

              <LiveNote>
                {lastLive
                  ? `Updating live. ${lastLive.name} just logged ${lastLive.hours} hours.`
                  : 'Updating live. Waiting for classmates to log time.'}
              </LiveNote>
            </div>
          </section>
        )}

        {/* Saves to the same assignment the dashboard shows. Once the service
            exists the hours go to the database too and get pushed over the
            WebSocket to everyone viewing this page. */}
        <section className="card">
          <div className="card-header">
            <h2>Mark It Done</h2>
          </div>
          <div className="card-body">
            <form onSubmit={saveProgress}>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="complete"
                  name="complete"
                  checked={finished}
                  onChange={(e) => {
                    setFinished(e.target.checked);
                    setSaved(false);
                  }}
                />
                <label className="form-check-label" htmlFor="complete">
                  I finished this assignment
                </label>
              </div>
              {/* Assignments I added don't ask how long or for a note */}
              {!isCustom(assignment) && (
                <>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="hours">
                      How long did it take you?
                    </label>
                    <HoursInput
                      id="hours"
                      placeholder="3"
                      value={hours}
                      onChange={(e) => {
                        setHours(e.target.value);
                        setSaved(false);
                      }}
                      required={finished}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="note">
                      Anything worth telling the next person?
                    </label>
                    <textarea
                      className="form-control"
                      id="note"
                      name="note"
                      rows="3"
                      placeholder="Start early, the deployment script took me longer than the HTML."
                      value={note}
                      onChange={(e) => {
                        setNote(e.target.value);
                        setSaved(false);
                      }}
                    ></textarea>
                  </div>
                </>
              )}
              <button className="btn btn-primary w-100" type="submit">
                Save
              </button>
              {saved && <p className="save-note text-center">Saved.</p>}
            </form>
          </div>
        </section>

        {/* Other students' notes. Assignments I added are only mine, so they have none. */}
        {!isCustom(assignment) && (
          <section className="notes-panel">
            <h2>Notes From Other Students</h2>

            {notes.length === 0 && <p>No notes yet.</p>}
            <ul className="note-list">
              {notes.map((note) => (
                <li key={note.name}>
                  <p className="note-meta">
                    <strong>{note.name}</strong> spent {note.hours} hours.
                  </p>
                  <p>{note.text}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
