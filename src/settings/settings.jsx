import React from 'react';
import { ClassTag } from '../components/common/classTag';
import './settings.css';

// Database placeholder. Written by the service each time it parses the
// Canvas feed: how many assignments it found for each class.
const syncedClasses = [
  { key: 'cs260', code: 'CS 260', found: 14, lastSynced: '12 minutes ago' },
  { key: 'fin401', code: 'FIN 401', found: 11, lastSynced: '12 minutes ago' },
  { key: 'mcom320', code: 'MCOM 320', found: 9, lastSynced: '12 minutes ago' },
  { key: 'rela275', code: 'REL A 275', found: 13, lastSynced: '12 minutes ago' },
];

export function Settings() {
  // Placeholder until the service exists. Keeps the forms from reloading the page.
  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <main className="container">
      <div className="settings-grid">
        {/* Third party service placeholder. The service fetches this URL from
             Canvas, parses the iCal feed, and writes the assignments it finds
             into the database. */}
        <section className="card">
          <div className="card-header">
            <h2>Canvas Calendar Link</h2>
          </div>
          <div className="card-body">
            <p>
              This is what fills your dashboard. Paste your Canvas calendar feed
              below and Trackr pulls in every assignment from every class you are
              enrolled in.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="ical">Canvas iCal feed URL</label>
                <input
                  className="form-control"
                  type="url"
                  id="ical"
                  name="ical"
                  placeholder="https://byu.instructure.com/feeds/calendars/user_xxxxxxxx.ics"
                  defaultValue="https://byu.instructure.com/feeds/calendars/user_a1b2c3d4e5.ics"
                  required
                />
              </div>
              <div className="button-row">
                <button className="btn btn-primary" type="submit">Save and Sync</button>
                <button className="btn btn-outline-danger" type="submit">Remove Link</button>
              </div>
            </form>

            <h3>Where to find it</h3>
            <ol className="steps">
              <li>Open Canvas and click <strong>Calendar</strong> in the left sidebar.</li>
              <li>Click <strong>Calendar Feed</strong> in the bottom right.</li>
              <li>Copy the whole URL it gives you and paste it above.</li>
            </ol>
            <p className="info-note">
              The link is read only. Trackr can see your due dates and nothing else,
              and it cannot make changes to your Canvas account.
            </p>
          </div>
        </section>

        {/* Database placeholder. Sync history and the class list both come out
             of MongoDB, written there by the service after it parses the feed. */}
        <section className="card">
          <div className="card-header">
            <h2>Sync Status</h2>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table align-middle sync-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Assignments Found</th>
                    <th>Last Synced</th>
                  </tr>
                </thead>
                <tbody>
                  {syncedClasses.map((c) => (
                    <tr key={c.key} className={`class-${c.key}`}>
                      <td>
                        <ClassTag code={c.code} />
                      </td>
                      <td>{c.found}</td>
                      <td>{c.lastSynced}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sync-footer">
              <p>47 assignments loaded across 4 classes.</p>
              <button className="btn btn-outline-primary" type="button">Sync Now</button>
            </div>
          </div>
        </section>

        {/* Third party service placeholder. These options control the reminder
             emails the service sends through the SendGrid API. */}
        <section className="card">
          <div className="card-header">
            <h2>Email Reminders</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="email">Send reminders to</label>
                <input className="form-control" type="email" id="email" name="email" defaultValue="ryan.shurtliff@byu.edu" required />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="lead-time">Remind me</label>
                <select className="form-select" id="lead-time" name="lead-time">
                  <option value="24">24 hours before it is due</option>
                  <option value="48">2 days before it is due</option>
                  <option value="72">3 days before it is due</option>
                </select>
              </div>
              <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" role="switch" id="digest" name="digest" defaultChecked />
                <label className="form-check-label" htmlFor="digest">Also send me a summary every Sunday night</label>
              </div>
              <button className="btn btn-primary" type="submit">Save Reminder Settings</button>
            </form>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Account</h2>
          </div>
          <div className="card-body">
            <ul className="account-list">
            <li><span>Net ID</span> <strong>ryan.shurtliff</strong></li>
            <li><span>Account created</span> <strong>September 2026</strong></li>
            <li><span>Assignments completed</span> <strong>23</strong></li>
            <li><span>Total time logged</span> <strong>61.5 hours</strong></li>
            </ul>
            <div className="button-row">
              <button className="btn btn-outline-primary" type="button">Change Password</button>
              <button className="btn btn-outline-danger" type="button">Delete Account</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
