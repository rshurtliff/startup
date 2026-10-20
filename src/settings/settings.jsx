import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClassTag } from '../components/common/classTag';
import { syncCanvas } from './mockData';
import { loadAssignments, saveAssignmentList } from '../utils/assignments';
import { leadTimeLabels, loadReminders, loadSyncInfo, totalFound } from '../utils/settings';
import { timeAgo } from '../utils/dates';
import './settings.css';

export function Settings({ userName, onLogout }) {
  const navigate = useNavigate();

  // What's in the Canvas link box
  const [icalUrl, setIcalUrl] = useState('');

  // The last sync: when it ran and how many assignments it found per class.
  // null means it has never synced.
  const [syncInfo, setSyncInfo] = useState(null);

  // The Email Reminders form
  const [email, setEmail] = useState('');
  const [leadTime, setLeadTime] = useState('24');
  const [digest, setDigest] = useState(true);

  // The Account card: my assignments for the totals, when the account was
  // made, and the Change Password and Delete Account forms
  const [assignments, setAssignments] = useState([]);
  const [accountCreated, setAccountCreated] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Which card just saved, so it can show a short "Saved" line
  const [savedMessage, setSavedMessage] = useState('');

  // Fills the page with what I saved last time. localStorage stands in for the
  // database until the service exists.
  useEffect(() => {
    setIcalUrl(localStorage.getItem('icalUrl') || '');
    setSyncInfo(loadSyncInfo());

    const reminders = loadReminders(userName);
    setEmail(reminders.email);
    setLeadTime(reminders.leadTime);
    setDigest(reminders.digest);

    setAssignments(loadAssignments());
    setAccountCreated(localStorage.getItem('accountCreated'));
  }, [userName]);

  // Runs the fake Canvas sync and saves what it found. Any Canvas assignment
  // that isn't on my dashboard yet gets added. Ones already there keep my
  // checkmarks and hours.
  function runSync() {
    const result = syncCanvas(icalUrl);

    const list = loadAssignments();
    const newOnes = result.assignments.filter((a) => !list.some((mine) => mine.id === a.id));
    const newList = [...list, ...newOnes];
    saveAssignmentList(newList);
    setAssignments(newList);

    const info = { syncedAt: result.syncedAt, classes: result.classes };
    localStorage.setItem('canvasSync', JSON.stringify(info));
    setSyncInfo(info);
    setSavedMessage('canvas');
  }

  // Save and Sync. Saves the link, then syncs with it.
  function saveAndSync(event) {
    event.preventDefault();
    localStorage.setItem('icalUrl', icalUrl);
    runSync();
  }

  // Remove Link. Forgets the link and the sync status. Assignments that were
  // already loaded stay on the dashboard.
  function removeLink() {
    localStorage.removeItem('icalUrl');
    localStorage.removeItem('canvasSync');
    setIcalUrl('');
    setSyncInfo(null);
    setSavedMessage('');
  }

  // Save Reminder Settings. Once the service exists it sends these emails
  // through SendGrid.
  function saveReminders(event) {
    event.preventDefault();
    localStorage.setItem('reminders', JSON.stringify({ email, leadTime, digest }));
    setSavedMessage('reminders');
  }

  // Change Password. There's no real password until the login service exists,
  // so this only checks the two boxes match. It never saves the password,
  // since a password doesn't belong in localStorage.
  function changePassword(event) {
    event.preventDefault();
    setNewPassword('');
    setConfirmPassword('');
    setChangingPassword(false);
    setSavedMessage('password');
  }

  // Delete Account. Clears everything Trackr saved and logs out.
  function deleteAccount() {
    ['assignments', 'icalUrl', 'canvasSync', 'reminders', 'accountCreated'].forEach((key) => localStorage.removeItem(key));
    onLogout();
    navigate('/');
  }

  // Totals for the Account card, worked out from my saved assignments
  const completedCount = assignments.filter((a) => a.done).length;
  const hoursLogged = assignments.reduce((sum, a) => sum + (a.done && a.myHours ? a.myHours : 0), 0);
  const passwordsMatch = newPassword.length >= 8 && newPassword === confirmPassword;

  return (
    <main className="container">
      <div className="settings-grid">
        {/* Third party service placeholder. syncCanvas() in mockData.js returns
            what the real sync will: once the service exists it fetches this
            URL from Canvas, parses the iCal feed, and writes the assignments
            it finds into the database. */}
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

            <form onSubmit={saveAndSync}>
              <div className="mb-3">
                <label className="form-label" htmlFor="ical">Canvas iCal feed URL</label>
                <input
                  className="form-control"
                  type="url"
                  id="ical"
                  name="ical"
                  placeholder="https://byu.instructure.com/feeds/calendars/user_xxxxxxxx.ics"
                  value={icalUrl}
                  onChange={(e) => {
                    setIcalUrl(e.target.value);
                    setSavedMessage('');
                  }}
                  required
                />
              </div>
              <div className="button-row">
                <button className="btn btn-primary" type="submit">Save and Sync</button>
                <button className="btn btn-outline-danger" type="button" onClick={removeLink} disabled={!syncInfo}>
                  Remove Link
                </button>
              </div>
              {savedMessage === 'canvas' && <p className="save-note">Saved and synced.</p>}
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

        {/* Database placeholder. The last sync is saved in localStorage for now.
            Once the service exists it comes out of MongoDB. */}
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
                  {syncInfo ? (
                    syncInfo.classes.map((c) => (
                      <tr key={c.key} className={`class-${c.key}`}>
                        <td>
                          <ClassTag code={c.code} />
                        </td>
                        <td>{c.found}</td>
                        <td>{timeAgo(syncInfo.syncedAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3">Not synced yet. Save your Canvas link to sync.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="sync-footer">
              <p>
                {syncInfo
                  ? `${totalFound(syncInfo)} assignments loaded across ${syncInfo.classes.length} classes.`
                  : 'Nothing loaded yet.'}
              </p>
              {/* Syncs again with the saved link. Needs a link first. */}
              <button className="btn btn-outline-primary" type="button" onClick={runSync} disabled={!syncInfo}>
                Sync Now
              </button>
            </div>
          </div>
        </section>

        {/* Third party service placeholder. These options control the reminder
            emails the service will send through the SendGrid API. Saved in
            localStorage for now. */}
        <section className="card">
          <div className="card-header">
            <h2>Email Reminders</h2>
          </div>
          <div className="card-body">
            <form onSubmit={saveReminders}>
              <div className="mb-3">
                <label className="form-label" htmlFor="email">Send reminders to</label>
                <input
                  className="form-control"
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSavedMessage('');
                  }}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="lead-time">Remind me</label>
                <select
                  className="form-select"
                  id="lead-time"
                  name="lead-time"
                  value={leadTime}
                  onChange={(e) => {
                    setLeadTime(e.target.value);
                    setSavedMessage('');
                  }}
                >
                  {Object.entries(leadTimeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label} before it is due
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="digest"
                  name="digest"
                  checked={digest}
                  onChange={(e) => {
                    setDigest(e.target.checked);
                    setSavedMessage('');
                  }}
                />
                <label className="form-check-label" htmlFor="digest">Also send me a summary every Sunday night</label>
              </div>
              <button className="btn btn-primary" type="submit">Save Reminder Settings</button>
              {savedMessage === 'reminders' && <p className="save-note">Reminder settings saved.</p>}
            </form>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Account</h2>
          </div>
          <div className="card-body">
            {/* Worked out from the saved assignments, so it matches the dashboard */}
            <ul className="account-list">
              <li><span>Net ID</span> <strong>{userName}</strong></li>
              <li>
                <span>Account created</span>{' '}
                <strong>
                  {accountCreated
                    ? new Date(accountCreated).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : 'Not recorded'}
                </strong>
              </li>
              <li><span>Assignments completed</span> <strong>{completedCount}</strong></li>
              <li><span>Total time logged</span> <strong>{hoursLogged} hours</strong></li>
            </ul>

            {/* Change Password opens a small form. Delete Account asks first. */}
            {changingPassword && (
              <form className="account-form" onSubmit={changePassword}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="new-password">New password</label>
                  <input
                    className="form-control"
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="confirm-password">Type it again</label>
                  <input
                    className="form-control"
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="button-row">
                  <button className="btn btn-primary" type="submit" disabled={!passwordsMatch}>Save Password</button>
                  <button className="btn btn-link" type="button" onClick={() => setChangingPassword(false)}>Cancel</button>
                </div>
              </form>
            )}

            {confirmingDelete && (
              <div className="delete-confirm">
                <p>This clears your assignments, logged time, and settings, then logs you out. Are you sure?</p>
                <div className="button-row">
                  <button className="btn btn-danger" type="button" onClick={deleteAccount}>Yes, delete my account</button>
                  <button className="btn btn-link" type="button" onClick={() => setConfirmingDelete(false)}>Cancel</button>
                </div>
              </div>
            )}

            {!changingPassword && !confirmingDelete && (
              <div className="button-row">
                <button
                  className="btn btn-outline-primary"
                  type="button"
                  onClick={() => {
                    setChangingPassword(true);
                    setSavedMessage('');
                  }}
                >
                  Change Password
                </button>
                <button
                  className="btn btn-outline-danger"
                  type="button"
                  onClick={() => {
                    setConfirmingDelete(true);
                    setSavedMessage('');
                  }}
                >
                  Delete Account
                </button>
              </div>
            )}
            {savedMessage === 'password' && (
              <p className="save-note">Password updated. It gets saved for real once the login service exists.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
