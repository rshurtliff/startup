import React from 'react';
import './classTag.css';

// Pill with a class code, like "CS 260". It takes its color from --class-color,
// which a parent sets with a class like "class-cs260".
export function ClassTag({ code }) {
  return <span className="class-tag">{code}</span>;
}
