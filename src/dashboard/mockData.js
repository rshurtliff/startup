import { daysFromToday } from '../utils/dates';

// Placeholder data for the dashboard. Once the service exists these come from
// it instead, and dashboard.jsx renders whatever it gets back.

export const classes = [
  { key: 'cs260', code: 'CS 260' },
  { key: 'fin401', code: 'FIN 401' },
  { key: 'mcom320', code: 'MCOM 320' },
  { key: 'rela275', code: 'REL A 275' },
];

// Database placeholder. Every assignment comes out of MongoDB. The done state
// and the logged time are written back to it.
// Due dates are 'YYYY-MM-DD' like the Canvas feed, set a few days around today
// so "due soon" always has something to show. average is the class average in
// hours that the mock class times are spread around (see assignment/mockData.js).
export const assignments = [
  { id: 'cs260-startup-html', classKey: 'cs260', classCode: 'CS 260', title: 'Startup HTML Deliverable', due: daysFromToday(1), average: 3.2, done: false },
  { id: 'fin401-problem-set-4', classKey: 'fin401', classCode: 'FIN 401', title: 'Problem Set 4', due: daysFromToday(3), average: 2.8, done: false },
  { id: 'mcom320-persuasive-memo', classKey: 'mcom320', classCode: 'MCOM 320', title: 'Persuasive Memo Draft', due: daysFromToday(5), average: 1.5, done: false },
  { id: 'rela275-reading-journal', classKey: 'rela275', classCode: 'REL A 275', title: 'Reading Journal Week 4', due: daysFromToday(-1), average: 0.7, done: true },
];

// WebSocket placeholder. Deadline alerts and other students' logged times get
// pushed here in real time.
export const alerts = [
  { id: 1, type: 'due', text: 'Due today: CS 260 Startup HTML' },
  { id: 2, type: 'activity', text: 'Kate D. just logged 2.5 hours on FIN 401 Problem Set 4' },
  { id: 3, type: 'activity', text: '3 classmates are working on MCOM 320 Memo right now' },
];

// Third party service placeholders. Canvas supplies the iCal feed the service
// parses, and SendGrid sends the reminder emails.
export const services = [
  { name: 'Canvas iCal feed', status: 'last synced 12 minutes ago, 47 assignments loaded' },
  { name: 'SendGrid email reminders', status: 'on, sent 24 hours before each deadline' },
];
