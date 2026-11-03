import React from 'react';
import './dadJoke.css';

// The reward for reporting my time. joke is null while it's still loading.
export function DadJoke({ joke }) {
  return (
    <div className="dad-joke" aria-live="polite">
      <p className="dad-joke-label">Your reward, a dad joke</p>
      <p className="dad-joke-text">{joke || 'Finding a good one...'}</p>
    </div>
  );
}
