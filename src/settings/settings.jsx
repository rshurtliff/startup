import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClassTag } from '../components/common/classTag';
import { hoursLabel, loadAssignments, saveAssignmentChanges } from '../utils/assignments';
import { classStyle } from '../utils/classes';
import { loadSettings, saveSettings, syncInfoFrom, totalFound } from '../utils/settings';
import { daysFromToday, timeAgo } from '../utils/dates';
import './settings.css';

export function Settings({ userName, onLogout }) {
  const navigate = useNavigate();

  // What's in the Canvas link box
  const [icalUrl, setIcalUrl] = useState('');

  // The last sync: when it ran and how many assignments it found per class.
  // null means it has never synced.
  const [syncInfo, setSyncInfo] = useState(null);

  // The Account card: my assignments for the totals, when the account was
  // made, and the Change Password and Delete Account forms
  const [assignments, setAssignments] = useState([]);
  const [accountCreated, setAccountCreated] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingCatchUp, setConfirmingCatchUp] = useState(false);

  // The server's message if a password change fails
  const [passwordError, setPasswordError] = useState(null);

  // While a Canvas sync is running, and the server's message if it fails
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Which card just saved, so it can show a short "Saved" line
  const [savedMessage, setSavedMessage] = useState('');

  // Fills the page with what I saved last time, all from the server
  useEffect(() => {
    loadSettings().then((settings) => {
      setIcalUrl(settings.icalUrl || '');
      setSyncInfo(syncInfoFrom(settings));

    });

    loadAssignments().then((list) => setAssignments(list));

    // When the account was made comes from the server too
    fetch('/api/user/me')
      .then((response) => (response.ok ? response.json() : null))
      .then((me) => setAccountCreated(me ? me.createdAt : null));
  }, [userName]);

  // Asks the server to read my Canvas feed. The server downloads it, adds or
  // updates every assignment in it, keeps my checkmarks and hours, and sends
  // back the new list and what it found per class.
  async function runSync() {
    setSyncError(null);
    setSyncing(true);
    try {
      const response = await fetch('/api/sync', { method: 'POST' });
      const body = await response.json();
      if (!response.ok) {
        setSyncError(body.msg);
        return;
      }
      setAssignments(body.assignments);
      setSyncInfo(body.canvasSync);
      setSavedMessage('canvas');
    } catch {
      setSyncError("Couldn't reach the Trackr service. Try again in a minute.");
    } finally {
      setSyncing(false);
    }
  }

  // Save and Sync. Saves the link, then syncs with it.
  async function saveAndSync(event) {
    event.preventDefault();
    await saveSettings({ icalUrl: icalUrl });
    runSync();
  }

  // Remove Link. Forgets the link and the sync status. Assignments that were
  // already loaded stay on the dashboard.
  async function removeLink() {
    await saveSettings({ icalUrl: '', canvasSync: null });
    setIcalUrl('');
    setSyncInfo(null);
    setSavedMessage('');
  }

  // Change Password. The server hashes the new one with bcrypt, and login
  // checks against it from then on.
  async function changePassword(event) {
    event.preventDefault();
    setPasswordError(null);
    const response = await fetch('/api/user/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    if (!response.ok) {
      const body = await response.json();
      setPasswordError(body.msg);
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    setChangingPassword(false);
    setSavedMessage('password');
  }

  // Delete Account. The server removes my account, assignments, and settings,
  // then App logs me out here too.
  async function deleteAccount() {
    await fetch('/api/user', { method: 'DELETE' });
    onLogout();
    navigate('/');
  }

  // Everything due before today that isn't checked off. Due today doesn't
  // count, since it might still be in progress. Dates are 'YYYY-MM-DD', so
  // comparing them as text puts them in order.
  const today = daysFromToday(0);
  const pastDue = assignments.filter((a) => !a.done && a.due < today);

  // Mark Past Due Done. Checks off every past due assignment at once, for
  // catching up after the first sync. No hours are saved, so they don't
  // change anyone's class times. doneAt is the due date, not now, so Show
  // completed doesn't fill up with all of them as "finished this week."
  // Only the changed fields of the past due ones get sent, not my whole list.
  // If the save fails, the list reloads from the server and says so.
  async function markPastDueDone() {
    const changes = pastDue.map((a) => ({ id: a.id, done: true, doneAt: a.due, myHours: null, myNote: null }));
    setAssignments(assignments.map((a) => {
      const change = changes.find((c) => c.id === a.id);
      return change ? { ...a, ...change } : a;
    }));
    setConfirmingCatchUp(false);
    if (await saveAssignmentChanges(changes)) {
      setSavedMessage('catchup');
    } else {
      setSavedMessage('catchup-failed');
      setAssignments(await loadAssignments());
    }
  }

  // Totals for the Account card, worked out from my saved assignments
  const completedCount = assignments.filter((a) => a.done).length;
  const hoursLogged = assignments.reduce((sum, a) => sum + (a.done && a.myHours ? a.myHours : 0), 0);
  const passwordsMatch = newPassword.length >= 8 && newPassword === confirmPassword;

  return (
    <main className="container">
      <div className="settings-grid">
        {/* Save and Sync saves this link, then POST /api/sync has the server
            download the feed from Canvas, parse it (service/canvas.js), and
            update my assignment list. */}
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
                <button className="btn btn-primary" type="submit" disabled={syncing}>
                  {syncing ? 'Syncing...' : 'Save and Sync'}
                </button>
                <button className="btn btn-outline-danger" type="button" onClick={removeLink} disabled={!syncInfo || syncing}>
                  Remove Link
                </button>
              </div>
              {savedMessage === 'canvas' && <p className="save-note">Saved and synced.</p>}
              {syncError && (
                <div className="alert alert-danger mt-3 mb-0" role="alert">
                  {syncError}
                </div>
              )}
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

        {/* The last sync is saved in MongoDB with my other settings */}
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
                      <tr key={c.key} style={classStyle(c.key, syncInfo.classes)}>
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
              <button className="btn btn-outline-primary" type="button" onClick={runSync} disabled={!syncInfo || syncing}>
                Sync Now
              </button>
            </div>

            {/* Mark Past Due Done asks first, since undoing it means
                unchecking each one by hand */}
            <h3>Catch up</h3>
            {confirmingCatchUp ? (
              <div className="catchup-confirm">
                <p>
                  Check off {pastDue.length === 1 ? 'the 1 past due assignment' : `all ${pastDue.length} past due assignments`}? No hours
                  are saved for them.
                </p>
                <div className="button-row">
                  <button className="btn btn-primary" type="button" onClick={markPastDueDone}>
                    Yes, check them off
                  </button>
                  <button className="btn btn-link" type="button" onClick={() => setConfirmingCatchUp(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="sync-footer">
                <p>
                  {pastDue.length === 0
                    ? 'Nothing past due.'
                    : `${pastDue.length} past due ${pastDue.length === 1 ? 'assignment isn’t' : 'assignments aren’t'} checked off.`}
                </p>
                <button
                  className="btn btn-outline-primary"
                  type="button"
                  onClick={() => {
                    setConfirmingCatchUp(true);
                    setSavedMessage('');
                  }}
                  disabled={pastDue.length === 0}
                >
                  Mark Past Due Done
                </button>
              </div>
            )}
            {savedMessage === 'catchup' && <p className="save-note">Past due assignments checked off.</p>}
            {savedMessage === 'catchup-failed' && (
              <div className="alert alert-danger mt-3 mb-0" role="alert">
                Couldn't save that. Nothing was checked off. Try again in a minute.
              </div>
            )}
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
              <li><span>Total time logged</span> <strong>{hoursLabel(hoursLogged)}</strong></li>
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
                {passwordError && (
                  <div className="alert alert-danger mt-3 mb-0" role="alert">
                    {passwordError}
                  </div>
                )}
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
              <p className="save-note">Password updated. Use the new one next time you log in.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
