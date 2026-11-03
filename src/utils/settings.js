// Settings that more than one page reads. They're saved on the server under
// whoever is logged in: the Canvas link (icalUrl) and the last sync
// (canvasSync).

// Gets all my settings. A new account has none saved yet, so it gets {}.
export async function loadSettings() {
  const response = await fetch('/api/settings');
  if (!response.ok) {
    return {};
  }
  return await response.json();
}

// Saves just the parts sent, like { icalUrl }. The server keeps the rest.
export async function saveSettings(changes) {
  await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
}

// The last Canvas sync: when it ran and how many assignments it found per
// class. null means it has never synced.
export function syncInfoFrom(settings) {
  return settings.canvasSync || null;
}

// How many assignments the last sync loaded in all
export function totalFound(syncInfo) {
  return syncInfo.classes.reduce((sum, c) => sum + c.found, 0);
}
