import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Assignment } from './assignment/assignment';
import { Settings } from './settings/settings';

export default function App() {
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');

  // Where the login page sends me once I'm logged in. Login sets it to
  // /settings for a brand new account so I can paste my Canvas link first.
  const [landingPage, setLandingPage] = useState('/dashboard');

  function login(name, page) {
    setLandingPage(page);
    setUserName(name);
  }

  // The saved name can outlive the login. The service forgets everyone when it
  // restarts, and the cookie can expire. So on load, ask the service who is
  // logged in, and clear the name if the answer is nobody.
  useEffect(() => {
    if (!userName) return;
    fetch('/api/user/me').then((response) => {
      if (response.status === 401) {
        clearUser();
      }
    }).catch(() => {
      // Service unreachable. Keep the name and let later calls sort it out.
    });
  }, []);

  function clearUser() {
    localStorage.removeItem('userName');
    setUserName('');
    setLandingPage('/dashboard');
  }

  // Clears the name right away so the header and nav go back to their logged
  // out look, and the login page doesn't bounce me to the dashboard. Then tells
  // the service to forget the login token. If the service can't be reached,
  // I'm still logged out here.
  function logout() {
    clearUser();
    fetch('/api/auth/logout', { method: 'delete' }).catch(() => {});
  }

  return (
    <BrowserRouter>
      <div className="app">
        <header>
          {/* React Bootstrap handles the phone menu toggle, so Bootstrap's
              JavaScript file is no longer needed. collapseOnSelect closes
              the menu after a link is tapped. */}
          <Navbar expand="lg" data-bs-theme="dark" collapseOnSelect>
            <Container>
              <Navbar.Brand as="h1">
                Trackr <span className="brand-sub">for Students</span>
              </Navbar.Brand>
              <Navbar.Toggle aria-controls="main-nav" />
              <Navbar.Collapse id="main-nav">
                {/* NavLink adds the active class to the link for the current route */}
                <Nav as="ul" className="me-auto">
                  {/* Login only shows when logged out, and the other pages
                      only show once someone is logged in */}
                  {!userName && (
                    <Nav.Item as="li">
                      <Nav.Link as={NavLink} to="/" eventKey="/" end>
                        Login
                      </Nav.Link>
                    </Nav.Item>
                  )}
                  {userName && (
                    <>
                      <Nav.Item as="li">
                        <Nav.Link as={NavLink} to="/dashboard" eventKey="/dashboard">
                          Dashboard
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item as="li">
                        <Nav.Link as={NavLink} to="/settings" eventKey="/settings">
                          Settings
                        </Nav.Link>
                      </Nav.Item>
                    </>
                  )}
                </Nav>
                {/* Only shows when someone is logged in. userName is App's state,
                    which starts from localStorage. */}
                {userName && (
                  <Nav as="div" className="user-info">
                    <span>
                      Signed in as <span className="username">{userName}</span>
                    </span>
                    <Nav.Link as={Link} to="/" onClick={logout} eventKey="logout" className="btn btn-sm btn-outline-light logout-link">
                      Logout
                    </Nav.Link>
                  </Nav>
                )}
              </Navbar.Collapse>
            </Container>
          </Navbar>
        </header>

        {/* Pages past login redirect to / when nobody is logged in, and the
            login page redirects to the dashboard when someone already is */}
        <Routes>
          <Route path="/" element={userName ? <Navigate to={landingPage} /> : <Login onLogin={login} />} />
          <Route path="/dashboard" element={userName ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/assignment/:id" element={userName ? <Assignment /> : <Navigate to="/" />} />
          <Route path="/settings" element={userName ? <Settings userName={userName} onLogout={logout} /> : <Navigate to="/" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <footer className="site-footer">
          <div className="container">
            <p>Ryan Shurtliff</p>
            <p>
              <a href="https://github.com/rshurtliff/startup" target="_blank" rel="noopener noreferrer">
                GitHub Repository
              </a>
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <main className="container not-found">
      <h2>404</h2>
      <p>That page doesn't exist.</p>
      <Link className="btn btn-primary" to="/dashboard">
        Back to dashboard
      </Link>
    </main>
  );
}
