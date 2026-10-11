import React, { useState } from 'react';
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

  // Undoes what loginUser did: clears the saved name and empties the state, so
  // the header and nav go back to their logged out look.
  function logout() {
    localStorage.removeItem('userName');
    setUserName('');
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
                  <Nav.Item as="li">
                    <Nav.Link as={NavLink} to="/" eventKey="/" end>
                      Login
                    </Nav.Link>
                  </Nav.Item>
                  {/* The rest of the pages only show once someone is logged in */}
                  {userName && (
                    <>
                      <Nav.Item as="li">
                        <Nav.Link as={NavLink} to="/dashboard" eventKey="/dashboard">
                          Dashboard
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item as="li">
                        {/* The detail page is a shared template. This link opens a
                            sample assignment until the dashboard rows link to their own. */}
                        <Nav.Link as={NavLink} to="/assignment/cs260-startup-html" eventKey="/assignment">
                          Assignment Detail
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

        {/* Pages past login redirect to / when nobody is logged in */}
        <Routes>
          <Route path="/" element={<Login onLogin={(name) => setUserName(name)} />} />
          <Route path="/dashboard" element={userName ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/assignment/:id" element={userName ? <Assignment /> : <Navigate to="/" />} />
          <Route path="/settings" element={userName ? <Settings /> : <Navigate to="/" />} />
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
