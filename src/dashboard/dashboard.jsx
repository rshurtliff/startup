import React from 'react';
import { Link } from 'react-router-dom';
import { ClassTag } from '../components/common/classTag';
import { HoursInput } from '../components/common/hoursInput';
import { LiveIndicator, LiveNote } from '../components/common/liveIndicator';
import './dashboard.css';

// Placeholder data. In Phase 2 these come from the service instead of being
// typed in here, and the JSX below renders whatever it gets back.
const classes = [
  { key: 'cs260', code: 'CS 260' },
  { key: 'fin401', code: 'FIN 401' },
  { key: 'mcom320', code: 'MCOM 320' },
  { key: 'rela275', code: 'REL A 275' },
];

// Database placeholder. Every assignment comes out of MongoDB. The done state
// and the logged time are written back to it.
const assignments = [
  { id: 'cs260-startup-html', classKey: 'cs260', classCode: 'CS 260', title: 'Startup HTML Deliverable', due: 'Tue, Sep 22', average: '3.2 hrs', dueSoon: true, done: false },
  { id: 'fin401-problem-set-4', classKey: 'fin401', classCode: 'FIN 401', title: 'Problem Set 4', due: 'Wed, Sep 23', average: '2.8 hrs', dueSoon: false, done: false },
  { id: 'mcom320-persuasive-memo', classKey: 'mcom320', classCode: 'MCOM 320', title: 'Persuasive Memo Draft', due: 'Thu, Sep 24', average: '1.5 hrs', dueSoon: false, done: false },
  { id: 'rela275-reading-journal', classKey: 'rela275', classCode: 'REL A 275', title: 'Reading Journal Week 4', due: 'Sat, Sep 19', average: '0.7 hrs', dueSoon: false, done: true },
];

// WebSocket placeholder. Deadline alerts and other students' logged times get
// pushed here in real time.
const alerts = [
  { id: 1, type: 'due', text: 'Due today: CS 260 Startup HTML' },
  { id: 2, type: 'activity', text: 'Kate D. just logged 2.5 hours on FIN 401 Problem Set 4' },
  { id: 3, type: 'activity', text: '3 classmates are working on MCOM 320 Memo right now' },
];

// Third party service placeholders. Canvas supplies the iCal feed the service
// parses, and SendGrid sends the reminder emails.
const services = [
  { name: 'Canvas iCal feed', status: 'last synced 12 minutes ago, 47 assignments loaded' },
  { name: 'SendGrid email reminders', status: 'on, sent 24 hours before each deadline' },
];

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
                  {classes.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.code}
                    </option>
                  ))}
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

          {/* One row per assignment. Each title links to the shared detail page
              with that assignment's id. */}
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
                {assignments.map((a) => (
                  <tr key={a.id} className={`class-${a.classKey}${a.dueSoon ? ' due-soon' : ''}`}>
                    <td>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`done-${a.id}`}
                        aria-label={`Mark ${a.title} as complete`}
                        defaultChecked={a.done}
                      />
                    </td>
                    <td>
                      <ClassTag code={a.classCode} />
                    </td>
                    <td>
                      <Link to={`/assignment/${a.id}`}>{a.title}</Link>
                    </td>
                    <td className="due-cell">
                      {a.due}
                      {a.dueSoon && <span className="badge due-badge">Due soon</span>}
                    </td>
                    <td>{a.average}</td>
                  </tr>
                ))}
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
              <HoursInput id="hours" defaultValue="1" />
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

      <section className="live-alerts">
        <div className="section-heading">
          <h2>Live Alerts</h2>
          <LiveIndicator label="Connected" />
        </div>
        <ul className="alert-feed">
          {alerts.map((alert) => (
            <li key={alert.id} className={`alert-${alert.type}`}>
              {alert.text}
            </li>
          ))}
        </ul>
        <LiveNote>WebSocket connected. Alerts appear as they happen.</LiveNote>
      </section>

      <section className="card services-card">
        <div className="card-body">
          <div className="services-head">
            <h2>Connected Services</h2>
            <Link to="/settings">Manage</Link>
          </div>
          <ul className="service-list">
            {services.map((service) => (
              <li key={service.name}>
                {service.name}: {service.status}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
