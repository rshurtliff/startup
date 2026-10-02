import React from 'react';
import { Link } from 'react-router-dom';
import './dashboard.css';

export function Dashboard() {
  // Placeholder until the service exists. Keeps the forms from reloading the page.
  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <main className="container">
      <section className="card assignments-panel">
        <div className="card-header">
          <h2>My Assignments</h2>
        </div>
        <div className="card-body">
          {/* Filters and Add assignment share one row. When the add form opens
              it drops onto its own row underneath. */}
          <div className="assignments-toolbar">
            <form className="filter-bar" onSubmit={handleSubmit}>
              <div className="filter-field">
                <label className="form-label" htmlFor="class-filter">
                  Class
                </label>
                <select className="form-select" id="class-filter" name="class">
                  <option value="all">All classes</option>
                  <option value="cs260">CS 260</option>
                  <option value="fin401">FIN 401</option>
                  <option value="mcom320">MCOM 320</option>
                  <option value="rela275">REL A 275</option>
                </select>
              </div>

              <div className="filter-field">
                <label className="form-label" htmlFor="sort">
                  Sort by
                </label>
                <select className="form-select" id="sort" name="sort">
                  <option value="due">Due date</option>
                  <option value="class">Class</option>
                  <option value="time">Estimated time</option>
                </select>
              </div>

              <button className="btn btn-outline-primary" type="submit">
                Apply
              </button>
            </form>

            {/* Collapsed until clicked. <details> opens and closes on its own,
                so this needs no JavaScript. */}
            <details className="add-assignment">
              <summary className="btn btn-outline-primary">Add assignment</summary>
              <p className="text-muted-sm">For anything your professor never put in Canvas.</p>
              <form className="add-form" onSubmit={handleSubmit}>
                <div className="add-field add-title">
                  <label className="form-label" htmlFor="title">
                    Assignment
                  </label>
                  <input className="form-control" type="text" id="title" name="title" placeholder="Group project check-in" required />
                </div>
                <div className="add-field">
                  <label className="form-label" htmlFor="course">
                    Class
                  </label>
                  <input className="form-control" type="text" id="course" name="course" placeholder="CS 260" required />
                </div>
                <div className="add-field">
                  <label className="form-label" htmlFor="due">
                    Due
                  </label>
                  <input className="form-control" type="datetime-local" id="due" name="due" required />
                </div>
                <button className="btn btn-primary" type="submit">
                  Add
                </button>
              </form>
            </details>
          </div>

          {/* Database placeholder. Every row below comes out of MongoDB. The
              checkbox state and the logged time are written back to it. Each
              title links to the shared detail page with that assignment's id. */}
          <div className="table-responsive">
            <table className="table table-hover align-middle assignment-table">
              <thead>
                <tr>
                  <th>Done</th>
                  <th>Class</th>
                  <th>Assignment</th>
                  <th>Due</th>
                  <th>Class Average</th>
                </tr>
              </thead>
              <tbody>
                <tr className="class-cs260 due-soon">
                  <td>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="done-cs260-startup-html"
                      aria-label="Mark Startup HTML Deliverable as complete"
                    />
                  </td>
                  <td>
                    <span className="class-tag">CS 260</span>
                  </td>
                  <td>
                    <Link to="/assignment/cs260-startup-html">Startup HTML Deliverable</Link>
                  </td>
                  <td className="due-cell">
                    Tue, Sep 22<span className="badge due-badge">Due soon</span>
                  </td>
                  <td>3.2 hrs</td>
                </tr>
                <tr className="class-fin401">
                  <td>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="done-fin401-problem-set-4"
                      aria-label="Mark Problem Set 4 as complete"
                    />
                  </td>
                  <td>
                    <span className="class-tag">FIN 401</span>
                  </td>
                  <td>
                    <Link to="/assignment/fin401-problem-set-4">Problem Set 4</Link>
                  </td>
                  <td className="due-cell">Wed, Sep 23</td>
                  <td>2.8 hrs</td>
                </tr>
                <tr className="class-mcom320">
                  <td>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="done-mcom320-persuasive-memo"
                      aria-label="Mark Persuasive Memo Draft as complete"
                    />
                  </td>
                  <td>
                    <span className="class-tag">MCOM 320</span>
                  </td>
                  <td>
                    <Link to="/assignment/mcom320-persuasive-memo">Persuasive Memo Draft</Link>
                  </td>
                  <td className="due-cell">Thu, Sep 24</td>
                  <td>1.5 hrs</td>
                </tr>
                <tr className="class-rela275">
                  <td>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="done-rela275-reading-journal"
                      aria-label="Mark Reading Journal Week 4 as complete"
                      defaultChecked
                    />
                  </td>
                  <td>
                    <span className="class-tag">REL A 275</span>
                  </td>
                  <td>
                    <Link to="/assignment/rela275-reading-journal">Reading Journal Week 4</Link>
                  </td>
                  <td className="due-cell">Sat, Sep 19</td>
                  <td>0.7 hrs</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Time logging prompt. Phase 2 opens this the instant a box gets
              checked, and the answer is saved to the database. Shown open here
              so the placeholder is visible. */}
          <dialog className="time-log" open>
            <h2>Nice work</h2>
            <p>
              How long did <strong>Reading Journal Week 4</strong> actually take you?
            </p>
            <form className="time-log-form" onSubmit={handleSubmit}>
              <label className="form-label" htmlFor="hours">
                Time spent
              </label>
              <div className="hours-input">
                <input className="form-control" type="number" id="hours" name="hours" min="0" step="0.25" defaultValue="1" />
                <span>hours</span>
              </div>
              <button className="btn btn-primary" type="submit">
                Save
              </button>
              <button className="btn btn-link" type="submit">
                Skip
              </button>
            </form>
          </dialog>
        </div>
      </section>

      {/* WebSocket placeholder. Deadline alerts and other students' logged
          times get pushed here in real time. No refresh. */}
      <section className="live-alerts">
        <div className="section-heading">
          <h2>Live Alerts</h2>
          <span className="live-indicator">
            <span className="live-dot"></span>Connected
          </span>
        </div>
        <ul className="alert-feed">
          <li className="alert-due">Due today: CS 260 Startup HTML</li>
          <li className="alert-activity">Kate D. just logged 2.5 hours on FIN 401 Problem Set 4</li>
          <li className="alert-activity">3 classmates are working on MCOM 320 Memo right now</li>
        </ul>
        <p className="ws-status">WebSocket connected. Alerts appear as they happen.</p>
      </section>

      {/* Third party service placeholders. Canvas supplies the iCal feed the
          service parses, and SendGrid sends the reminder emails. */}
      <section className="card services-card">
        <div className="card-body">
          <div className="services-head">
            <h2>Connected Services</h2>
            <Link to="/settings">Manage</Link>
          </div>
          <ul className="service-list">
            <li>Canvas iCal feed: last synced 12 minutes ago, 47 assignments loaded</li>
            <li>SendGrid email reminders: on, sent 24 hours before each deadline</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
