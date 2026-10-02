import React from 'react';
import './liveIndicator.css';

// Small pill with a pulsing dot, shown next to anything the WebSocket updates
export function LiveIndicator({ label = 'Live' }) {
  return (
    <span className="live-indicator">
      <span className="live-dot"></span>
      {label}
    </span>
  );
}

// One line of muted text about the live connection, like the last update
export function LiveNote({ children }) {
  return <p className="ws-status">{children}</p>;
}
