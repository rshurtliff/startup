import React from 'react';
import './hoursInput.css';

// Number box with "hours" after it. Pass value and onChange to keep what's
// typed in state, or placeholder for a hint. The label stays with the form
// that uses it.
export function HoursInput({ id, value, onChange, placeholder, required }) {
  return (
    <div className="hours-input">
      <input
        className="form-control"
        type="number"
        id={id}
        name={id}
        min="0"
        step="0.25"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
      <span>hours</span>
    </div>
  );
}
