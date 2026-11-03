import React, { useState } from 'react';
import './login.css';

export function Login({ onLogin }) {
  // The inputs are controlled: what you type is kept in state and sent to the
  // service when a button is clicked.
  const [netId, setNetId] = useState('');
  const [password, setPassword] = useState('');

  // The service's message when login or create fails, shown under the buttons
  const [error, setError] = useState(null);

  // A returning user goes to their dashboard
  function loginUser() {
    loginOrCreate('/api/auth/login', '/dashboard');
  }

  // A new user has no assignments yet, so they go to settings first to paste
  // in their Canvas link
  function createUser() {
    loginOrCreate('/api/auth/create', '/settings');
  }

  // Both buttons send the Net ID and password to the service. If it says yes,
  // the service has set the login cookie, so save the name and tell App, along
  // with the page to land on. App does the moving, since it sends anyone who
  // is logged in away from this page anyway.
  async function loginOrCreate(endpoint, landingPage) {
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
        onLogin(netId, landingPage);
        return;
      }
      const body = await response.json();
      setError(body.msg);
    } catch {
      setError("Couldn't reach the Trackr service. Try again in a minute.");
    }
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
              {/* Login sends the Net ID and password to POST /api/auth/login,
                  Create Account to POST /api/auth/create */}
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
            </div>
          </section>

          <section className="about">
            <h2>What is Trackr?</h2>
            <p>
              Trackr puts every assignment from all of your Canvas classes in one list, and shows how long each one
              actually takes. When students finish an assignment they log their hours, so before you start you can
              see what it took everyone else.
            </p>

            <h2>How to use it</h2>
            <ol className="how-to">
              <li>
                <strong>Create an account</strong> with your BYU Net ID and a password.
              </li>
              <li>
                <strong>Connect Canvas.</strong> In Canvas, open <em>Calendar</em> and click <em>Calendar Feed</em>.
                Paste that link into Trackr&apos;s Settings and click Save and Sync. Every assignment from every class
                loads in, and Sync Now pulls in anything new.
              </li>
              <li>
                <strong>Plan your week.</strong> The dashboard starts on what&apos;s due this week. Switch the
                timeframe, filter by class, or add anything Canvas doesn&apos;t have.
              </li>
              <li>
                <strong>Check it off.</strong> When you finish something, check the box and say how long it took. You
                get a dad joke for your trouble.
              </li>
              <li>
                <strong>See how long things take.</strong> Open any assignment to see how many hours other students
                spent on it before you start.
              </li>
            </ol>
          </section>
        </div>
      </main>
    </>
  );
}
