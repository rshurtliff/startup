import React from 'react';
import { Link } from 'react-router-dom';
import { HoursInput } from '../components/common/hoursInput';
import { LiveIndicator, LiveNote } from '../components/common/liveIndicator';
import './assignment.css';

// Database placeholder. The service adds up every logged time for this
// assignment and returns these buckets. Each bar's height is its count
// divided by the tallest count.
const buckets = [
  { label: 'Under 1', count: 2 },
  { label: '1 to 2', count: 7 },
  { label: '2 to 3', count: 12 },
  { label: '3 to 4', count: 9 },
  { label: 'Over 4', count: 4 },
];
const maxCount = Math.max(...buckets.map((b) => b.count));

const stats = [
  { label: 'Average', value: '3.2 hours' },
  { label: 'Median', value: '2.9 hours' },
  { label: 'Longest', value: '6.5 hours' },
];

// Database placeholder. Notes other students left when they logged their time.
const notes = [
  { name: 'Kate D.', hours: 2.5, text: 'Write the page plan first, it makes the nav bar trivial.' },
  { name: 'Tyler M.', hours: 2.75, text: 'The placeholders are the whole point, do not try to make it pretty.' },
  { name: 'Sam R.', hours: 4, text: 'Most of my time went to getting it deployed, not writing HTML.' },
];

export function Assignment() {
  // Placeholder until the service exists. Keeps the form from reloading the page.
  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <main className="container">
      <p className="back-link"><Link to="/dashboard">Back to dashboard</Link></p>

      <div className="detail-grid">
        {/* Database placeholder. Only fields the Canvas iCal feed actually has:
            the title and course code (SUMMARY), the due date (DTSTART, usually
            a date with no time), the description, and a link back to Canvas.
            Your status and last synced come from Trackr, not Canvas. */}
        <section className="card assignment-summary class-cs260">
          <div className="card-header">
            <p className="course-line">CS 260</p>
          </div>
          <div className="card-body">
            <h2>Startup HTML Deliverable</h2>

            <dl className="detail-stats">
              <div>
                <dt>Due</dt>
                <dd>Tue, Sep 22</dd>
                <dd className="detail-note">No time listed in Canvas</dd>
              </div>
              <div>
                <dt>Your status</dt>
                <dd>Not done yet</dd>
              </div>
              <div>
                <dt>From</dt>
                <dd>Canvas calendar</dd>
              </div>
              <div>
                <dt>Last synced</dt>
                <dd>12 minutes ago</dd>
              </div>
            </dl>

            {/* The DESCRIPTION field from the iCal feed, shown as-is. Canvas only
                sends one for about half of assignments. When it's missing, this
                says "No description in Canvas" instead. */}
            <div className="assignment-desc">
              <p className="desc-label">Description from Canvas</p>
              <p>View this content in MasteryLS.</p>
            </div>
            <a className="btn btn-outline-primary" href="https://byu.instructure.com/calendar" target="_blank" rel="noopener noreferrer">
              Open in Canvas
            </a>
          </div>
        </section>

        {/* WebSocket placeholder. The chart below redraws on its own as other
             students finish this assignment and log their times. Anyone with
             this page open sees the update without refreshing. */}
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
      </div>
    </main>
  );
}
