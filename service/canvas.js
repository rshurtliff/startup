// Reads a student's Canvas iCal feed and turns it into Trackr assignments.
// Ported from my Python version (canvas.py), which used the icalendar package.
// The feed is plain text, so this reads it by hand instead of adding a package.
//
// A Canvas feed has one block like this per assignment:
//   BEGIN:VEVENT
//   DTSTART;VALUE=DATE:20261110
//   SUMMARY:Startup Service [CS 260 Section 001 Fall 2026]
//   UID:event-assignment-123456
//   URL;VALUE=URI:https://byu.instructure.com/...
//   DESCRIPTION:Deploy your startup...
//   END:VEVENT

// Due dates are shown in BYU's time zone. A time like 11:59 PM in Provo is
// already the next day in UTC, which is how Canvas writes most times.
const timeZone = 'America/Denver';

// Downloads the feed and returns every assignment in it
async function getCanvasAssignments(icalUrl) {
  const response = await fetch(icalUrl);
  if (!response.ok) {
    throw new Error(`Canvas answered ${response.status}`);
  }
  const text = await response.text();
  if (!text.includes('BEGIN:VCALENDAR')) {
    throw new Error("That link isn't a calendar feed");
  }

  const assignments = [];
  for (const event of readEvents(text)) {
    const assignment = parseCanvasAssignment(event);
    if (assignment) {
      assignments.push(assignment);
    }
  }
  return assignments;
}

// Splits the feed into one object per VEVENT, like { SUMMARY: '...', DTSTART: '...' }
function readEvents(text) {
  // Long lines are folded: the rest continues on the next line after a space
  const lines = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n');

  const events = [];
  let current = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
    } else if (line === 'END:VEVENT') {
      events.push(current);
      current = null;
    } else if (current) {
      // "DTSTART;VALUE=DATE:20261110" has the name, then options after ;, then the value after :
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      const name = line.slice(0, colon).split(';')[0];
      current[name] = { value: line.slice(colon + 1), options: line.slice(0, colon) };
    }
  }
  return events;
}

// Based on parse_canvas_assignment in canvas.py, with one fix. The course is
// always the LAST bracket group, like "[C S 180-001]", and it's cut off after
// its 3 digit number ("C S 180"). The title is everything before that. Reading
// from the first "[" broke on titles with their own tag, like
// "M04 Curiosity Lab [OPTIONAL] — Ask the League [C S 180-001]".
// Returns null for anything that isn't a Canvas assignment, and for anything
// tagged [OPTIONAL].
function parseCanvasAssignment(event) {
  const uid = event.UID ? event.UID.value : '';
  // Canvas also puts class calendar events in the feed. Only keep assignments.
  if (uid.startsWith('event-calendar-event')) {
    return null;
  }

  const summary = unescape(event.SUMMARY ? event.SUMMARY.value : '').trim();
  if (/\[optional\]/i.test(summary)) {
    return null;
  }

  // "[...]" at the very end, with no brackets inside it
  const lastBracket = summary.match(/^(.*)\[([^\[\]]*)\]$/);
  const courseMatch = lastBracket ? lastBracket[2].match(/^(.*?\d{3})/) : null;
  if (!courseMatch || !event.DTSTART) {
    return null;
  }

  const classCode = courseMatch[1].trim();
  return {
    id: uid,
    title: lastBracket[1].trim(),
    classCode: classCode,
    classKey: classCode.toLowerCase().replace(/[^a-z0-9]/g, ''),
    due: dueDate(event.DTSTART),
    description: event.DESCRIPTION ? unescape(event.DESCRIPTION.value).trim() : '',
    url: event.URL ? event.URL.value : '',
  };
}

// Turns DTSTART into 'YYYY-MM-DD', the format the frontend already uses
function dueDate(dtstart) {
  const v = dtstart.value;
  const day = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;

  // A UTC time like 20261111T065900Z: find what day that is in Provo
  if (v.endsWith('Z')) {
    const utc = new Date(`${day}T${v.slice(9, 11)}:${v.slice(11, 13)}:${v.slice(13, 15)}Z`);
    return utc.toLocaleDateString('en-CA', { timeZone: timeZone });
  }
  // A plain date (VALUE=DATE) or a local time with TZID is already the right day
  return day;
}

// iCal escapes commas, semicolons, backslashes, and new lines
function unescape(text) {
  return text.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');
}

module.exports = { getCanvasAssignments, parseCanvasAssignment, readEvents };
