// Third party API: icanhazdadjoke.com. Reporting how long an assignment took
// earns a random dad joke. It's free, needs no key, and allows calls from any
// site (CORS), so the frontend can fetch it directly.

// Used if the joke site can't be reached, so the reward never just disappears
const backupJoke = "I'd tell you a joke about the joke service, but it's not responding.";

export async function getDadJoke() {
  try {
    // Without the Accept header the site sends back a whole HTML page
    const response = await fetch('https://icanhazdadjoke.com/', {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return backupJoke;
    }
    const data = await response.json();
    return data.joke;
  } catch {
    return backupJoke;
  }
}
