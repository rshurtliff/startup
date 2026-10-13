import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClassTag } from '../components/common/classTag';
import { HoursInput } from '../components/common/hoursInput';
import { LiveIndicator, LiveNote } from '../components/common/liveIndicator';
import { formatDue, isDueSoon } from '../utils/dates';
import { classes, assignments as mockAssignments, alerts, services } from './mockData';
import './dashboard.css';

export function Dashboard() {
  // The assignment list is state so it can change when you check something off
  // or add one. It starts empty and the effect below fills it in.
  const [assignments, setAssignments] = useState([]);

  // Class and Sort by dropdowns
  const [classFilter, setClassFilter] = useState('all');
  const [sortBy, setSortBy] = useState('due');

  // Runs once after the page first shows up. localStorage stands in for the
  // database until the service exists. The first visit ever has nothing saved,
  // so it starts from the mock data and saves that.
  useEffect(() => {
    const saved = localStorage.getItem('assignments');
    if (saved) {
      setAssignments(JSON.parse(saved));
    } else {
      setAssignments(mockAssignments);
      localStorage.setItem('assignments', JSON.stringify(mockAssignments));
    }
  }, []);

  // Every change to the list goes through here so the state and localStorage
  // never get out of sync. Checking off and adding assignments use this.
  function saveAssignments(newList) {
    setAssignments(newList);
    localStorage.setItem('assignments', JSON.stringify(newList));
  }

  // Placeholder until the service exists. Keeps the forms from reloading the page.
  function handleSubmit(event) {
    event.preventDefault();
  }

  // The rows to show. Only the ones that match the Class dropdown. This is a
  // copy, so assignments itself stays whole.
  const filtered = assignments.filter((a) => classFilter === 'all' || a.classKey === classFilter);

  // Puts the rows in order based on the Sort by dropdown. Due dates are
  // 'YYYY-MM-DD', so they sort correctly as plain text.
  filtered.sort((a, b) => {
    if (sortBy === 'class') {
      return a.classCode.localeCompare(b.classCode);
    }
    if (sortBy === 'time') {
      return a.average - b.average;
    }
    return a.due.localeCompare(b.due);
  });

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
                <select className="form-select" id="class-filter" name="class" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
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
                <select className="form-select" id="sort" name="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="due">Due date</option>
                  <option value="class">Class</option>
                  <option value="time">Estimated time</option>
                </select>
              </div>
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
                {filtered.map((a) => {
                  // Finished work isn't due soon, even if the date is close
                  const dueSoon = !a.done && isDueSoon(a.due);
                  return (
                    <tr key={a.id} className={`class-${a.classKey}${dueSoon ? ' due-soon' : ''}`}>
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
                        {formatDue(a.due)}
                        {dueSoon && <span className="badge due-badge">Due soon</span>}
                      </td>
                      <td>{a.average} hrs</td>
                    </tr>
                  );
                })}
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
