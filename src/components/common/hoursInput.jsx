import React from 'react';
import './hoursInput.css';

// Number box with "hours" after it. Pass defaultValue for a starting number
// or placeholder for a hint. The label stays with the form that uses it.
export function HoursInput({ id, defaultValue, placeholder }) {
  return (
    <div className="hours-input">
      <input
        className="form-control"
        type="number"
        id={id}
        name={id}
        min="0"
        step="0.25"
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
      <span>hours</span>
    </div>
  );
}
