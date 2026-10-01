import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

export default function App() {
  return (
    <div className="app">
      <header>
        {/* React Bootstrap handles the phone menu toggle, so Bootstrap's
            JavaScript file is no longer needed */}
        <Navbar expand="lg" data-bs-theme="dark">
          <Container>
            <Navbar.Brand as="h1">
              Trackr <span className="brand-sub">for Students</span>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="main-nav" />
            <Navbar.Collapse id="main-nav">
              <Nav as="ul" className="me-auto">
                <Nav.Item as="li">
                  <Nav.Link href="/">Login</Nav.Link>
                </Nav.Item>
                <Nav.Item as="li">
                  <Nav.Link href="/dashboard">Dashboard</Nav.Link>
                </Nav.Item>
                <Nav.Item as="li">
                  <Nav.Link href="/assignment">Assignment Detail</Nav.Link>
                </Nav.Item>
                <Nav.Item as="li">
                  <Nav.Link href="/settings">Settings</Nav.Link>
                </Nav.Item>
              </Nav>
              {/* Login placeholder. The name comes from the authenticated user once
                  the service and database are wired up. */}
              <p className="user-info">
                Signed in as <span className="username">ryan.shurtliff</span>
                <a className="btn btn-sm btn-outline-light" href="/">
                  Logout
                </a>
              </p>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>

      <main className="container">App components go here</main>

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
  );
}
