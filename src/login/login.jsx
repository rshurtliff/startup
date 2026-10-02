import React from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

export function Login() {
  const navigate = useNavigate();

  // Placeholder until the service exists. Both buttons just go to the
  // dashboard, but the required fields still have to be filled in first.
  function handleSubmit(event) {
    event.preventDefault();
    navigate('/dashboard');
  }

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
                  <input className="form-control" type="text" id="netid" name="netid" placeholder="your-netid" required />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <input className="form-control" type="password" id="password" name="password" placeholder="password" required />
                </div>
                <div className="login-actions">
                  <button className="btn btn-primary" type="submit">
                    Login
                  </button>
                  <button className="btn btn-outline-primary" type="submit">
                    Create Account
                  </button>
                </div>
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
