import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

export function Login({ onLogin }) {
  const navigate = useNavigate();

  // The inputs are controlled: what you type is kept in state and sent to the
  // service when a button is clicked.
  const [netId, setNetId] = useState('');
  const [password, setPassword] = useState('');

  // The service's message when login or create fails, shown under the buttons
  const [error, setError] = useState(null);

  // A returning user goes to their dashboard
  async function loginUser() {
    if (await loginOrCreate('/api/auth/login')) {
      // Settings shows this as "Account created" until that page reads it
      // from the service
      if (!localStorage.getItem('accountCreated')) {
        localStorage.setItem('accountCreated', new Date().toISOString());
      }
      navigate('/dashboard');
    }
  }

  // A new user has no assignments yet, so they go to settings first to paste
  // in their Canvas link
  async function createUser() {
    if (await loginOrCreate('/api/auth/create')) {
      localStorage.setItem('accountCreated', new Date().toISOString());
      navigate('/settings');
    }
  }

  // Both buttons send the Net ID and password to the service. If it says yes,
  // the service has set the login cookie, so save the name and tell App.
  // Returns true when it worked.
  async function loginOrCreate(endpoint) {
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: 'post',
        body: JSON.stringify({ netId: netId, password: password }),
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        },
      });
      if (response.ok) {
        localStorage.setItem('userName', netId);
        onLogin(netId);
        return true;
      }
      const body = await response.json();
      setError(body.msg);
    } catch {
      setError("Couldn't reach the Trackr service. Try again in a minute.");
    }
    return false;
  }

  // Pressing Enter in either field logs in, the same as clicking Login
  function handleSubmit(event) {
    event.preventDefault();
    loginUser();
  }

  // Both buttons stay disabled until there's something in both fields
  const missingInfo = !netId || !password;

  return (
    <>
      <div className="header-banner">
        <div className="container">
          <p className="tagline">Every assignment from every class, in one place.</p>
          <p className="byline">
            By Ryan Shurtliff |{' '}
            <a href="https://github.com/rshurtliff/startup" target="_blank" rel="noopener noreferrer">
              GitHub Repository
            </a>
          </p>
        </div>
      </div>

      <main className="container">
        <div className="login-layout">
          <section className="card login-card">
            <div className="card-header">
              <h2>Sign in</h2>
            </div>
            <div className="card-body">
              {/* Login placeholder. React will replace this with a real form that
                  calls the service, and the service will check the credentials
                  against the database. */}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="netid">
                    BYU Net ID
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    id="netid"
                    name="netid"
                    placeholder="your-netid"
                    value={netId}
                    onChange={(e) => setNetId(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    className="form-control"
                    type="password"
                    id="password"
                    name="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="login-actions">
                  <button className="btn btn-primary" type="submit" disabled={missingInfo}>
                    Login
                  </button>
                  <button className="btn btn-outline-primary" type="button" onClick={createUser} disabled={missingInfo}>
                    Create Account
                  </button>
                </div>
                {error && (
                  <div className="alert alert-danger mt-3 mb-0" role="alert">
                    {error}
                  </div>
                )}
              </form>

              <p className="login-note">
                Once you are signed in, your assignments load automatically from your Canvas calendar feed. You can
                also add your own assignments for things Canvas does not track.
              </p>
            </div>
          </section>

          <section className="features">
            <h2>What you get</h2>
            <ul className="feature-list">
              <li>All of your assignments pulled from Canvas into one list</li>
              <li>Sort by class, due date, or how much is left to do</li>
              <li>Check an assignment off and log how long it actually took</li>
              <li>See how long the assignment took everyone else before you start</li>
              <li>Email reminders as a deadline gets close</li>
            </ul>

            <figure className="sketch">
              <img
                src="/designSketch.png"
                alt="Design sketch showing the login, dashboard, and assignment detail views"
                width="300"
              />
              <figcaption>The three main views of Trackr.</figcaption>
            </figure>
          </section>
        </div>
      </main>
    </>
  );
}
