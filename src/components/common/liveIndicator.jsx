import React, { useEffect, useState } from 'react';
import { LiveNotifier } from '../../liveNotifier';
import './liveIndicator.css';

// The WebSocket's state ('connecting', 'connected', 'reconnecting', or 'off'),
// kept up to date. Any component that calls this redraws when it changes.
export function useLiveStatus() {
  const [status, setStatus] = useState(LiveNotifier.status);

  useEffect(() => {
    LiveNotifier.addStatusHandler(setStatus);
    // In case it changed between the first draw and now
    setStatus(LiveNotifier.status);
    return () => {
      LiveNotifier.removeStatusHandler(setStatus);
    };
  }, []);

  return status;
}

// Small pill shown next to anything the WebSocket updates. The dot pulses
// only while it's really connected. Otherwise it goes grey and says so.
export function LiveIndicator({ label = 'Live' }) {
  const status = useLiveStatus();
  const connected = status === 'connected';
  let text = label;
  if (!connected) {
    text = status === 'off' ? 'Offline' : 'Connecting';
  }

  return (
    <span className={connected ? 'live-indicator' : 'live-indicator live-off'}>
      <span className="live-dot"></span>
      {text}
    </span>
  );
}

// One line of muted text about the live connection, like the last update
export function LiveNote({ children }) {
  return <p className="ws-status">{children}</p>;
}
