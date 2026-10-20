import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HoursInput } from '../components/common/hoursInput';
import { LiveIndicator, LiveNote } from '../components/common/liveIndicator';
import { buckets, stats, notes } from './mockData';
import { assignments as mockAssignments } from '../dashboard/mockData';
import { formatDue } from '../utils/dates';
import { isCustom } from '../utils/assignments';
import './assignment.css';

// The tallest bar sets the chart's scale
const maxCount = Math.max(...buckets.map((b) => b.count));

export function Assignment() {
  // The id from the URL, like 'fin401-problem-set-4' from /assignment/fin401-problem-set-4
  const { id } = useParams();

  // The assignment this page shows. loaded turns true once the effect has
  // looked for it, so the page can tell "still loading" from "not found".
  const [assignment, setAssignment] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Finds this id in the saved list, the same list the dashboard uses. Runs
  // again whenever the id in the URL changes.
  useEffect(() => {
    const saved = localStorage.getItem('assignments');
    const list = saved ? JSON.parse(saved) : mockAssignments;
    setAssignment(list.find((a) => a.id === id) || null);
    setLoaded(true);
  }, [id]);

  // Placeholder until the service exists. Keeps the form from reloading the page.
  function handleSubmit(event) {
    event.preventDefault();
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
                <dd>{assignment.done ? 'Done' : 'Not done yet'}</dd>
              </div>
              <div>
                <dt>From</dt>
                <dd>{isCustom(assignment) ? 'Added by you' : 'Canvas calendar'}</dd>
              </div>
              {/* Only Canvas assignments get synced */}
              {!isCustom(assignment) && (
                <div>
                  <dt>Last synced</dt>
                  <dd>12 minutes ago</dd>
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
                  Hours spent by the 34 students who have finished this assignment.
                </figcaption>
              </figure>

              <ul className="stat-list">
                {stats.map((stat) => (
                  <li key={stat.label}>
                    <span className="stat-label">{stat.label}</span> <span className="stat-value">{stat.value}</span>
                  </li>
                ))}
              </ul>

              <LiveNote>Updating live. Tyler M. logged 2.75 hours about a minute ago.</LiveNote>
            </div>
          </section>
        )}

        {/* Time logging placeholder. Checking the box writes the completion and
             the hours to the database, then pushes the new number out over the
             WebSocket to everyone viewing this page. */}
        <section className="card">
          <div className="card-header">
            <h2>Mark It Done</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="complete" name="complete" />
                <label className="form-check-label" htmlFor="complete">I finished this assignment</label>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="hours">How long did it take you?</label>
                <HoursInput id="hours" placeholder="3" />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="note">Anything worth telling the next person?</label>
                <textarea className="form-control" id="note" name="note" rows="3" placeholder="Start early, the deployment script took me longer than the HTML."></textarea>
              </div>
              <button className="btn btn-primary w-100" type="submit">Save</button>
            </form>
          </div>
        </section>

        {/* Other students' notes. Assignments I added are only mine, so they have none. */}
        {!isCustom(assignment) && (
          <section className="notes-panel">
            <h2>Notes From Other Students</h2>

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
