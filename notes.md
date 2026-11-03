# Simon Service 10/28/26

Cloned simon-service and deployed it to https://simon.cs260hwtrackr.click with `./deployService.sh -k ~/.ssh/production.pem -h cs260hwtrackr.click -s simon`.

- The repo is two apps now. The React frontend is in the root and the Express backend is in `service/`, each with its own `package.json`.
- `deployService.sh` builds the React app and copies it into the service's `public/` folder on the server. Express hands those files out with `express.static('public')`, and PM2 keeps `node index.js` running on port 3000 (4000 for the startup).
- Every endpoint goes under `/api` through `express.Router()`. Anything else gets `index.html`, so React routes like `/play` still work on refresh.
- `verifyAuth` is middleware placed before an endpoint. It only calls `next()` if the cookie's token belongs to a user, so `/api/scores` returns 401 when you're logged out.
- Passwords are hashed with bcrypt. The hash stores its own random salt and the cost, so `bcrypt.compare` can check a password without anything else saved.
- Users and scores are plain arrays in memory, so restarting the service wipes them. The database deliverable fixes that.
- While developing, `vite.config.js` proxies `/api` from Vite's port 5173 to the service. Both have to be running: F5 for the backend, `npm run dev` for the frontend.
- The About page calls two third party APIs from the frontend: picsum.photos for the picture and quote.cs260.click for the quote.

# Startup Service Notes 10/28/26

## Session 9: Real Canvas Sync (11/3/26)

Trackr reads my actual Canvas calendar now. Claude ported my Python script (`canvas.py`) to the server. The made-up assignments, classes, classmate times, and notes are all gone, so everything on screen is real.

- `service/canvas.js` uses the same rules as `parse_canvas_assignment` in my Python: the title is everything before `[`, and the course is what's inside `[` up to its three-digit number (`[CS 260 Section 001 Fall 2026]` becomes `CS 260`).
- It reads the feed by hand instead of using a package like Python's `icalendar`. The feed is plain text with one `BEGIN:VEVENT ... END:VEVENT` block per event. Long lines are "folded," continued on the next line after a space, so those get joined back first. Commas and semicolons come escaped as `\,` and `\;`.
- Canvas writes most due times in UTC, like `20261113T065900Z`. 11:59 PM in Provo is already the next morning in UTC, so taking the date straight from the text would be a day late. It converts to `America/Denver` first. My Python version took `.dt.date()` straight from the UTC time, so it probably had this off-by-one too.
- Canvas also puts class calendar events in the feed (`UID:event-calendar-event-...`). Only `event-assignment-...` ones count.
- `POST /api/sync` runs on the server because Canvas blocks other sites from reading the feed (CORS) and the link is private. Canvas decides which assignments exist. Trackr keeps my checkmark, hours, and note on any I already had, and keeps the ones I added myself.
- The server only syncs `https://` links by hostname. It downloads whatever link a user saves, so without that check someone could point it at `http://localhost:4000` or an internal IP address.
- Classes come from my assignments now (`classesFrom()` in `src/utils/classes.js`). Colors go by position in the sorted class list, so a class has the same color everywhere. The Add form adds "Other" for things outside Canvas.
- New accounts start empty with a link to Settings. Charts say "Nobody has logged time on this yet" and the stats say "None yet." The dashboard shows "No times yet" instead of an average of nothing.
- `Math.max()` of an empty list is `-Infinity`, and dividing by a max of 0 breaks the bar heights. The chart uses `Math.max(1, ...)` so it always has something to divide by.
- The fake live classmates only log on my real assignments now. `loadAssignments()` hands the list to `LiveNotifier.setAssignments()`.
- Live Alerts start with anything due today or tomorrow that isn't done.
- Tested on my real feed too. Titles like `M04 Curiosity Lab [OPTIONAL] — Ask the League [C S 180-001]` have their own bracket tag, so reading the course from the first `[` gave a class called `OPTIONAL] — Ask the League [C S 180`. The course is now read from the last bracket group, and anything tagged `[OPTIONAL]` is skipped. My Python version had the same bug.
- The "Nice work" time prompt is a real popup now, using React Bootstrap's `Modal` instead of a `<dialog>` sitting under the table. `show` opens it and `onHide` runs on Escape, the X, or a click outside, which all count as Skip. The assignment is only forgotten in `onExited`, after the fade-out finishes, so the title doesn't disappear halfway through the animation.
- The dashboard has a Timeframe dropdown (This week, Next 2 weeks, Next month, All semester) and a Show completed switch. It starts on this week with finished work hidden, like the `plan_through()` default of 7 days in my Python version. Overdue work that isn't done always shows, so nothing late slips by. The one I just checked off stays on screen until the popup closes, so it doesn't vanish out from under me. Bug I found right after: checking off something overdue made it disappear even with Show completed on, since it was both past due and done. Now each assignment saves `doneAt` when I finish it, and Show completed also shows anything I finished in the last week, whatever its due date.
- Dates are 'YYYY-MM-DD' text, so `a.due > lastDay` compares them correctly without turning them into Date objects.
- Never put the iCal link in code, notes, or commits. It's a private link that shows my whole calendar to anyone who has it.
- Tested with a fake feed served on my laptop that had the tricky cases: a folded title, an escaped comma, an 11:59 PM UTC time, and a class meeting that should be skipped.

## Session 8: Deploying the Service (11/3/26)

Trackr is live as a real service at https://startup.cs260hwtrackr.click.

- `deployReact.sh` only copied the built React files. `deployService.sh` (copied from Simon Service) builds React into `public/`, copies `service/index.js` and `package.json` next to it, wipes `services/startup` on the server, copies the new build up, runs `npm install` there, and restarts it with `pm2 restart startup`.
- On my laptop it's two programs: Vite on 5173/5174 and Express on 4000, with `vite.config.js` forwarding `/api`. On the server it's one: Caddy sends everything for `startup.` to port 4000, and my Express app answers both `/api` calls and the website through `express.static('public')`.
- `fetch('/api/...')` has no domain in it, so the frontend code didn't change at all. The browser just asks whatever site the page came from.
- Before this, port 4000 on the server was running a placeholder `index.js` from the course's server image, and my React deploys only swapped its `public/` folder.
- Deploy with the new key: `./deployService.sh -k ~/.ssh/trackr -h cs260hwtrackr.click -s startup`.
- Over plain SSH (`ssh ... 'pm2 describe startup'`), `pm2` says "command not found" because a one-off command doesn't load the login shell's setup. Log in first, then run it.
- The live server keeps users in memory too, so every deploy or restart wipes the accounts until the database deliverable.

## Session 7: Dad Joke Reward (11/3/26)

My idea, Claude built it. When I report how long an assignment took, Trackr thanks me with a random dad joke from icanhazdadjoke.com. This is the third party API the rubric wants called from the frontend.

- The API is free, needs no key, and sends `access-control-allow-origin: *`, so the browser lets my page call it directly (CORS). Without that header the browser would block the response.
- It needs the header `Accept: application/json`. Without it the site sends back a whole HTML page instead of `{ "joke": "..." }`.
- `getDadJoke()` in `src/utils/jokes.js` does the fetch for both pages. If the site is down or the request fails, it returns a backup joke so the reward never just disappears. `try`/`catch` catches the case where `fetch` can't connect at all, and `response.ok` catches error answers.
- `DadJoke` in `src/components/common/` shows it. It says "Finding a good one..." while `joke` is still `null`.
- Dashboard: Save in the "Nice work" prompt no longer closes it. A `rewarded` state switches the prompt to a "Thanks!" view with the joke and a Close button. Skip closes it with no joke, so you have to report a time to earn one.
- Assignment page: Mark It Done shows the joke under "Saved." only if I saved hours. Changing anything in the form hides it again, since it's tied to `saved`.
- The plan had holidays or a Simon-style quote. The joke fits better because it rewards the exact thing Trackr needs people to do, which is report their time.

## Session 6: Settings on the Server (11/3/26)

Claude did this session for me. Everything on Settings is saved on the server now: the Canvas link, the last sync, and the reminder settings. Change Password and Delete Account actually work too.

- `GET /api/settings` sends back my settings and `PUT /api/settings` saves them. They're saved on my user object like my assignments.
- The PUT merges instead of replacing: `{ ...req.user.settings, ...req.body }`. Each card on Settings sends only its own part, like `{ reminders }`, and everything else stays. The later object wins when both have the same key.
- `PUT /api/user/password` hashes the new password with bcrypt and saves it over the old hash. Login checks the new one from then on. The server also refuses anything under 8 characters, since the frontend check alone could be skipped with curl.
- `DELETE /api/user` filters me out of the `users` array. My assignments and settings live on my user object, so they go too. That's why `users` is `let` and not `const`.
- "Account created" comes from `createdAt` on `/api/user/me` now, so it's the real date the account was made, not the first time I logged in on that browser.
- `src/utils/settings.js` has `loadSettings()` and `saveSettings()`, plus `syncInfoFrom()` and `remindersFrom()` to pull out the parts each page needs. The dashboard and the assignment page both use them.
- The only thing left in `localStorage` is the logged-in name for the header, the same as Simon.
- `syncCanvas()` is still a hard-coded fake. Reading a real Canvas feed would happen on the server later.
- When testing in the browser, setting a dropdown from outside React doesn't fire `onChange`, so the state never changes. Typing or clicking like a real user does.

## Session 5: Shared Class Times (10/29/26)

Real students' hours show up for each other now. If one account logs 40 hours on Startup HTML, another account sees that bar on the chart and a higher Class Average.

- No new way to save times was needed. Every user's list is already on the server with `done` and `myHours`, so `GET /api/times` just collects them.
- It's one request for every assignment, not `/api/times/:id`, because the dashboard needs a Class Average for every row at once.
- It skips my own hours (`if (user === req.user) continue;`). My page already adds mine from my own list, so they show up right when I save without asking the server again.
- `times[a.id]` with square brackets looks up a key that's in a variable. `if (!times[a.id]) times[a.id] = [];` starts an empty list the first time an id shows up.
- `classTimes = {}` in `allTimesFor` and `classAverage` is a default value. Callers that don't pass it yet still work instead of crashing on `undefined[assignment.id]`.
- The class times are state on both pages, so React draws again when they arrive a moment after the page loads.
- I typed `setClasTimes` and the build still passed. Vite only checks that the code is valid JavaScript, not that every name exists. It would have failed quietly inside the `.then`, so the times would just never show.
- The mock classmates and the fake live ones are still in the chart. The live ones only exist in the open tab and keep adding normal-sized times, so averages drift a little between tabs and logins.
- Testing with curl and two cookie files (`-c a.txt`, `-b b.txt`) is an easy way to act as two users at once.

## Session 4: Assignments on the Server (10/29/26)

My assignment list is saved on the server under my account now, not in the browser. Two accounts get two separate lists, and logging in from another computer brings mine with it.

- `GET /api/assignments` sends back my list and `PUT /api/assignments` replaces it. Both go through `verifyAuth`, which puts the logged-in user on `req.user`, so each endpoint only ever touches that user's list.
- The list is saved right on my user object (`req.user.assignments`). A new user has none, so `|| []` sends an empty list instead of `undefined`.
- GET means "give me this," PUT means "here's the new version, replace yours." Same address, different method, different endpoint.
- `fetch` doesn't hand back the answer right away. It hands back a promise. `await` waits for it, but only inside an `async` function. Reading the body with `response.json()` needs its own `await`.
- An `async` function always returns a promise, even when it looks like it returns a list. Once `loadAssignments` became `async`, every page that called it broke until I updated it.
- The function passed to `useEffect` can't be `async`, so the effects use `.then((list) => ...)` instead, like Simon's `scores.jsx`. With `{ }` around the arrow function body, several lines can run once the list is ready.
- `setLoaded(true)` had to move inside the `.then` on the assignment page. Outside, it ran before the server answered and "Assignment not found" flashed.
- `saveProgress` and `runSync` are my own functions, so they can be `async`. They `await` the save before showing "Saved." or "Synced," so the message means it actually saved.
- `event.preventDefault()` has to stay before any `await`, or the browser submits the form the old way first.
- `response.ok` is true for any 200-type answer. If I'm not logged in it's a 401, and `loadAssignments` returns an empty list instead of crashing.
- When curl got "Cannot POST /api/auth/create," it was a different project (imageupload) still running on port 4000. Only one program can use a port, so my F5 failed. `lsof -iTCP:4000 -sTCP:LISTEN` shows what's using a port.
- Still to fix: Delete Account only clears `localStorage`, so my list stays on the server. Session 6 adds a delete account endpoint.

## In-class: AI Built Login and Create Account

The attendance assignment was to have AI add login and create account to my startup, so Claude wrote this one instead of me typing it. It covers plan sessions 1 through 3.

- `service/` is its own app with its own `package.json`. The backend packages (`express cookie-parser bcryptjs uuid`) went in there, not the root.
- `uuid` 14 only works with `import`, not `require`. My server runs Node 22.12, which is right at the edge for that, so it's pinned to version 11 like Simon Service.
- `service/index.js` follows Simon Service with Net ID instead of email and port 4000. Create gives 409 if the Net ID is taken, login gives 401 for a wrong password, and logout deletes the token.
- `verifyAuth` is middleware: it runs before the endpoint and only calls `next()` if the cookie's token matches a user. `GET /api/user/me` is the endpoint behind it.
- The cookie is `httpOnly`, so my React code can't read the token at all. The browser just sends it back on every `/api` call.
- Users live in an array on the server, so restarting the service logs everyone out. The name in `localStorage` would still say I'm logged in, so `App` asks `/api/user/me` on load and clears the name if it gets a 401.
- `vite.config.js` sends `/api` calls from `npm run dev` to port 4000. Run both: F5 on `service/index.js`, then `npm run dev`.
- Tested every endpoint with curl first. `-c cookie.txt` saves the cookie and `-b cookie.txt` sends it back.

# Startup Service Plan 10/28/26

Plan for Startup Service. I type, Claude guides one step at a time.

Rubric: 10% Node/Express service, 10% frontend served by Express static middleware, 10% frontend calls a third party API, 20% backend has service endpoints, 20% frontend calls them, 25% register, login, logout, and an endpoint that needs an auth token, 5% bcrypt for passwords.

The README section has to be named "Service deliverable" with a checklist. Simon Service is already deployed at https://simon.cs260hwtrackr.click, so that prerequisite is done.

Data lives in memory on the server for now (plain arrays and objects that reset when the service restarts). The database deliverable replaces that. The fake WebSocket in `liveNotifier.js` stays fake until the WebSocket deliverable.

| # | Session | What gets built | Rubric |
|---|---|---|---|
| 1 | **Service skeleton** (done in class 10/28 by AI) | Make `service/` with its own `package.json` and install `express cookie-parser bcryptjs uuid`. `service/index.js` listens on port 4000, uses `express.json()`, `cookieParser()`, `express.static('public')`, and an `/api` router with one test endpoint. Add `vite.config.js` so `/api` calls from Vite go to port 4000. Run it with the VS Code debugger (F5). Simon: `service/index.js`, `vite.config.js`. | Express, Static |
| 2 | **Auth endpoints** (done in class 10/28 by AI) | `POST /api/auth/create`, `POST /api/auth/login`, `DELETE /api/auth/logout`. Passwords hashed with `bcrypt.hash`, checked with `bcrypt.compare`. A `uuid` token goes in an httpOnly cookie. `verifyAuth` middleware blocks anyone without a good token. Test with curl before touching the frontend. | Auth, BCrypt, Endpoints |
| 3 | **Login page uses the service** (done in class 10/28 by AI) | Login and Create Account `fetch` the auth endpoints and show an error when the Net ID is taken (409) or the password is wrong (401). Logout calls the logout endpoint. Simon: `login/unauthenticated.jsx`, `login/authenticated.jsx`. | Frontend calls, Auth |
| 4 | **Assignments on the server** (done 10/29) | `GET /api/assignments` and `PUT /api/assignments`, both behind `verifyAuth`, store each user's list on the server. `loadAssignments` and `saveAssignmentList` in `src/utils/assignments.js` switch from `localStorage` to `fetch`, so the dashboard and detail page use the server. | Endpoints, Frontend calls |
| 5 | **Shared class times** (done 10/29) | `GET /api/times` collects everyone else's hours from the assignment lists already saved on the server, grouped by assignment id. `loadClassTimes()` feeds the dashboard's Class Average and the assignment page's chart and stats, so two accounts see each other's times. Changed from the first plan of `POST`/`GET /api/times/:id`, since the lists already hold the hours and the dashboard needs every assignment at once. | Endpoints, Frontend calls |
| 6 | **Settings and sync** (done 11/3 by Claude) | `GET` and `PUT /api/settings` for the iCal link, last sync, and reminders. `PUT /api/user/password` for Change Password and `DELETE /api/user` for Delete Account. Settings, the dashboard, and the assignment page stop using `localStorage`. `syncCanvas()` stays a hard-coded mock on the frontend. | Endpoints, Frontend calls |
| 7 | **Third party API** (done 11/3 by Claude) | Reporting time earns a random dad joke from icanhazdadjoke.com, fetched from the frontend with `getDadJoke()` in `src/utils/jokes.js`. Shows in the dashboard's time prompt and on the assignment page after Mark It Done. Changed from the holidays or quote idea. | Third party |
| 8 | **Deploy and wrap up** (done 11/3) | Copied `deployService.sh` from Simon Service, removed `deployReact.sh`, and deployed with `-k ~/.ssh/trackr -s startup`. Checked the live site and every endpoint. README "Service deliverable" checklist is all checked. | All |
| 9 | **Real Canvas sync** (added 11/3, done by Claude) | Port my Python `canvas.py` to `service/canvas.js`. `POST /api/sync` downloads the saved iCal link, parses it, and merges into my list. Classes and colors come from real data, and all mock assignments, classmates, and notes are removed. SendGrid dropped. | Endpoints, Frontend calls |

Things to watch for:
- Commit at the end of every session, and in the middle when it runs long. The rubric wants dozens of commits over several days.
- Backend packages get installed inside `service/`, frontend ones in the root. Mixing them up is the usual cause of a 502 after deploying.
- The service runs on port 4000 here, not Simon's 3000. `vite.config.js` has to point at 4000 too.
- Run two things while developing: the service (F5 on `service/index.js`) and the frontend (`npm run dev`).
- A `fetch` call is async. Either `await` it or use `.then()`, and check `response.ok` before trusting the body.
- `trackr-server` (the folder next to startup) was an earlier test. It hashes with `crypto` and sends the token in a header, so it doesn't match the course's bcrypt and cookie method. Follow Simon instead.

# Startup React Phase 2 Notes 10/10/26

## Sessions 11 and 12: Canvas Sync, Reminders, Account

Settings works now. Everything on it is saved to `localStorage` and shows up on the other pages too.

- `syncCanvas()` is the course's "hard-coded response" mock. It returns exactly what the real sync will (when it synced, counts per class, the assignments), so only the inside of the function changes once the service exists.
- The real sync has to run on the server. Browsers block reading Canvas's feed from another site (CORS), and the iCal link is private like a password.
- The Service rubric wants a third party call from the frontend. Canvas will be called from the backend, so I'll need something small from the frontend too, like Simon's quote.
- `new Date().toISOString()` saves a time as text, since `localStorage` only holds strings. `timeAgo()` turns it back into "5 minutes ago".
- `.some()` is true if any item matches. Sync uses it to only add Canvas assignments that aren't already in my list.
- `.reduce((sum, c) => sum + c.found, 0)` keeps a running total. The `0` is where `sum` starts.
- `classes.map((c) => ({ ...c, found }))` needs the parentheses around the braces, or JavaScript reads the `{` as a function body.
- One `useEffect` can load several things at once. Settings loads the link, sync, reminders, and account info in one.
- `placeholder` is just the gray hint text in an empty box. `defaultValue` puts real text in it. A controlled input uses `value` instead of `defaultValue`.
- A password never goes in `localStorage`. Change Password only checks the two boxes match until the login service exists.
- Delete Account asks first with a second button instead of `window.confirm`, then clears every key Trackr saved and calls `onLogout` from `App`.
- `loadSyncInfo()` and `loadReminders()` live in `src/utils/settings.js` because the dashboard and assignment page read them too.

## Session 10: Fake WebSocket

My spec says the chart updates live as classmates log time. The real version needs the server, so `src/liveNotifier.js` fakes it with `setInterval`, the same setup as Simon's `gameNotifier.js`.

- The notifier is one shared object (`new LiveEventNotifier()` at the bottom of the file). It keeps a list of handlers, which are just functions, and calls each one with every event. When the real WebSocket comes, only this file changes.
- Every 5 seconds a made-up classmate logs hours on a random Canvas assignment, somewhere from half to 1.5 times its class average.
- The notifier keeps those times by assignment id, like a server would. `allTimesFor()` adds them in, so the chart, the stats, and the Class Average on both pages all count them.
- A `useEffect` that returns a function: that function is the cleanup. React runs it when the component leaves the screen, or before the effect runs again for a new `[id]`. That's where `removeHandler` goes, so leaving and coming back doesn't stack up listeners.
- The handler has to be defined inside the effect so `addHandler` and `removeHandler` get the exact same function. A different copy wouldn't match in the `.filter()`.
- Simon's `removeHandler` calls `.filter()` but never saves the result, so its handlers never actually get removed. Mine does `this.handlers = this.handlers.filter(...)`.
- On the assignment page, `setLastLive(event)` re-renders the page, and that render picks up the new time. That's what makes the bars move.
- `setAlerts((prev) => [alert, ...prev].slice(0, 3))` passes the setter a function instead of a value. The handler was made once, when the effect ran, so it would be stuck with the `alerts` from the first render. With a function, React hands over the current list every time.
- Events go to a random assignment, so one assignment page only gets one about every 20 seconds. The dashboard shows all of them.

## Session 9: Mark It Done and the Chart

Mark It Done saves to the same stored assignment the dashboard reads, and the chart, stats, and notes are worked out from data for each assignment instead of being one fixed mock.

- `loadAssignments()` and `saveAssignmentList()` in `src/utils/assignments.js` are the one place that touches `localStorage`. Both pages use them, so they can't drift apart on the key name or the mock fallback.
- The mock data is now a list of other students' hours per assignment, spread around its class average. Buckets, average, median, and longest are calculated from that list on every render, so they always match the Class Average on the dashboard.
- Saving my hours adds them to that list, so the chart and stats move when I save. My note shows first as "You".
- The dashboard's Class Average used to read the fixed `average` from mockData, so after saving it said 2.8 while the detail page said 2.9. Now both call `classAverage()`, which uses the same times as the chart. One calculation in one place means they can't disagree.
- The form fields are filled from the saved assignment inside the same `useEffect` that loads it, so coming back to the page shows what I saved last time.
- A checkbox uses `e.target.checked`, not `e.target.value`.
- `onChange={(e) => { setHours(e.target.value); setSaved(false); }}`: an arrow function with braces can run more than one line. Here it also hides the "Saved." line once I change something.
- `required={finished}`: hours are only required once the box is checked.
- `[...times].sort(...)` copies before sorting. `.sort()` changes the array it's called on, and I didn't want to reorder the original list.
- `notes.unshift(...)` adds to the front of an array, `push` adds to the end.
- `x != null` (with `!=`, not `!==`) is true for anything except `null` and `undefined`. The mock assignments have no `myHours` at all, so they're `undefined`, not `null`.
- Assignments I added only get the checkbox. No hours, no note, never in the stats.

## Session 8: Assignment Detail by Id

The detail page used to show Startup HTML no matter which row you clicked. Now it reads the id from the URL and loads that assignment from the same `localStorage` list the dashboard uses.

- `:id` in `path="/assignment/:id"` is a URL parameter. `const { id } = useParams()` gives me whatever is in that spot of the address.
- `[id]` as the dependency list means the effect runs on load and again whenever the id changes. React keeps the same page on screen when you go from one assignment to another, so `[]` would keep showing the old one.
- The dependency list always has to be an array. `}, id)` gave "useEffect received a final argument that is not an array."
- `.find()` returns `undefined` when nothing matches, and `|| null` makes "not found" always `null`.
- If nothing is saved yet (opening a link before ever visiting the dashboard), it falls back to the mock list.
- `useState` gives the value now and a setter that saves a new value and redraws. A plain `let` would reset every render and never redraw. The console showed `null` then the object: two renders, before and after the effect.
- Early returns: `if (!loaded) return null;` and `if (!assignment) return (...not found...)` before the main `return`. Otherwise `assignment.title` crashes on `null` during the first render.
- Hooks have to stay above any early return so React sees the same hooks every render.
- Reading the console: each red error points at a line. Fixing the first crash can reveal the next one (`localStorate` didn't show up until the render stopped crashing).
- A space in a class string, `class -${...}`, gives two wrong classes. It builds fine and just quietly loses the styling.
- Assignments I added say "Added by you" and skip Last synced, the Canvas description, the Open in Canvas button, the chart, and the notes. They only have Mark It Done.
- A JSX comment can't go right inside `&& (`. That spot expects one element, so the comment goes above the `{... && (` line.

## Session 7: Check Off and Time Prompt

This is the main feature from my spec. Checking a box saves it as done and opens the "Nice work" prompt for that assignment. Save stores my hours on it, and Skip just closes the prompt.

- The checkbox was `defaultChecked`, so the browser flipped it but React and `localStorage` never knew. Now it's `checked={a.done}` with `onChange={() => toggleDone(a.id)}`.
- To change one item in a list: `.map()` over it, return an updated copy for the one that matches and the item unchanged for the rest.
- `{ ...a, done: true }` is spread on an object. It copies every property of `a` into a new object, then `done` overrides just that one.
- `!a.done` flips true and false, so one function both checks and unchecks.
- `loggingId` holds which assignment the prompt is about. `null` means closed, so `{loggingAssignment && <dialog>}` only shows it when there is one.
- Keeping the id in state and looking up the assignment with `.find()` on each render means the prompt always shows the current title.
- Skip is `type="button"` with its own `onClick`. As `type="submit"` it would have run Save.
- `HoursInput` now takes `value` and `onChange` and passes them to its `<input>`. A component only does what its props let it, so it has to hand them through.
- Number inputs give back a string, so `Number(loggedHours)` turns `'2.5'` into `2.5` before saving.
- Unchecking clears `myHours`, since the assignment isn't done anymore.
- Assignments I added don't get the prompt and say "Only you" instead of an average. Nobody else has them, so my time can't go into a class average. `isCustom()` in `src/utils/assignments.js` checks for the `custom-` id so the dashboard and assignment page use the same rule.
- Subtracting booleans works in JavaScript (`true - false` is 1), which is how sorting by time pushes custom ones to the end.

## Session 6.5: Delete Added Assignments

Not in the original plan. Without it, a typo in an added assignment was stuck there forever.

- The delete button is a small X next to the checkbox. Only assignments I added can be deleted. Their ids start with `custom-`, so `a.id.startsWith('custom-') && (...)` shows the button just on those. Canvas ones would come right back on the next sync anyway.
- Deleting is `.filter()` again: keep everything whose id isn't this one, then `saveAssignments` the new list. Same "new array, never change the old one" rule as adding.
- `onClick={() => deleteAssignment(a.id)}` instead of `onClick={deleteAssignment}`. The function needs to know which row was clicked, so it gets wrapped in an arrow function that passes the id. The arrow runs on the click, not during render.
- The button is `type="button"` so it can't accidentally submit a form.

## Session 6: Add Assignment

The Add form needed state for each box, `value` and `onChange` on each box, and a function that builds a new assignment and saves the longer list.

- `value` and `onChange` go on the `<input>`, not the `<label>`. The label is just the text above the box. `htmlFor` on the label and `id` on the input are what link them.
- A text box's `onChange` runs on every keystroke, and `e.target.value` is everything typed so far.
- If a box has `value` but no working `onChange`, React locks it and you can't type.
- The Class box became a dropdown built from `classes`. Free text like "cs 260" wouldn't match any `classKey`, so the filter and the colors would miss it.
- The Due box is `type="date"`, which gives `'YYYY-MM-DD'` like the Canvas dates. `datetime-local` adds a time and wouldn't match.
- `classes.find(...)` is like `.filter()` but returns the first match instead of an array.
- A new assignment needs the same property names as the mock ones. A missing `classKey` doesn't error, it just quietly drops out of the filter.
- `${...}` only works inside backticks. In single quotes it's plain text, so every id would have been the same.
- `[...assignments, newAssignment]` is spread syntax: a new array with everything from before plus one more. `.push()` would change state directly, and React wouldn't notice.
- Every property in an object needs a comma after it. The error pointed at `average`, but the missing comma was on the line above. Check the line before an error too.
- `onSubmit` on the form, not `onClick` on the button, so Enter works too and the browser checks `required` first.
- Clearing a controlled box is just setting its state back to `''`.
- `{a.average === null ? 'No data yet' : `${a.average} hrs`}` is a ternary inside JSX for when a new assignment has no times logged yet.

## Session 5: Filter and Sort

In React you don't "apply" a filter. What's picked lives in state, and every render works out which rows to show from it. Change a dropdown, the state changes, React re-renders, and the table updates. So the Apply button is gone.

- `const [sortBy, setSortBy] = useState('due')` is array destructuring. `useState` gives back `[value, setter]` and the brackets on the left unpack them. The names are up to me. I don't write `setSortBy` myself, `useState` makes it.
- The start value has to match an option's `value`, like `'all'` and `'due'`, or the dropdown and state disagree.
- A controlled dropdown needs both `value={classFilter}` (state shows in the box) and `onChange={(e) => setClassFilter(e.target.value)}` (picking updates the state). Without `onChange` the box still changes on screen, but the state never does.
- `e.target.value` is the option's `value`, not its label. `<option value="time">Estimated time</option>` gives `'time'`. Labels are for people and can change, values are for code.
- `console.log` in a component prints in the browser console, not the terminal, and runs on every render. It printed `all` twice on load because `setAssignments` in the effect caused a second render.
- A blank page usually means the component crashed while rendering. Check the browser console first. Mine was `classFiler is not defined`, a typo Vite's build didn't catch.
- `.filter((a) => ...)` keeps the items where the function returns true and gives back a new array. `a` is just the name for one assignment at a time.
- `assignments` is an array of object literals, like a list of dictionaries. Nothing defines that they have a `classKey`. They just do because mockData wrote them that way, so a typo gives `undefined` instead of an error.
- `.sort((a, b) => ...)` wants a negative number if `a` goes first, positive if `b` does. `a.average - b.average` works for numbers and `localeCompare` is the version for text.
- `.sort()` changes the array it's called on, unlike `.filter()`. Fine on `filtered` since it's already a copy. Sorting `assignments` directly would change state behind React's back.

## Session 4: Assignments in State

An import from `mockData.js` can't change, so the dashboard list had to become state before anything can be checked off or added. `localStorage` is the stand-in database, saved under the key `assignments`.

- `useState([])` starts the list empty. A `useEffect` fills it in, the same as Simon's `scores.jsx`.
- `useEffect(() => { ... }, [])` runs after the component shows up on screen. The empty `[]` means only once, on first load.
- First visit ever, nothing is saved, so it uses the mock data and saves that. After that it always reads from `localStorage`.
- `localStorage` only holds strings. `JSON.stringify` going in, `JSON.parse` coming out.
- `import { assignments as mockAssignments }` renames on import so it doesn't collide with the state called `assignments`.
- Saving goes through `saveAssignments(newList)`, which sets the state and writes `localStorage` together, like `loginUser` does. I skipped a second `useEffect` for saving because it would also run on the first render while the list is still `[]` and save the empty list over the real data.
- To reset to the mock data while testing, delete the `assignments` key in DevTools and refresh.

## Session 3: Real Dates

The mock data had `due: 'Tue, Sep 22'` and `dueSoon: true`. That's display text, not data. You can't sort it (as text, "Sat" comes before "Tue" no matter the date), and `dueSoon` stays true forever. So the data had to change before sorting and filtering could work.

- `due` is now `'YYYY-MM-DD'`, which is what the Canvas feed gives. That format sorts correctly even as plain text.
- `average` is a number now, and the table adds "hrs" when it shows it.
- `dueSoon` is gone from the data. `isDueSoon()` works it out from the date, and the dashboard skips it for finished assignments.
- The helpers live in `src/utils/dates.js` because the assignment page will need them too.
- The UTC trap: `new Date('2026-10-12')` reads a date-only string as midnight UTC, which is the evening of the 11th in Utah, so every date showed a day early. `new Date('2026-10-12T00:00')` reads it as local midnight instead.
- `toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })` turns a date into "Mon, Oct 12" without any library.
- The mock dates use `daysFromToday(n)` so they're always near today. Hard-coded dates would stop showing "due soon" after a week.
- A `.map()` callback with `=> (` can only return JSX. Switching to `=> { ... return (...); }` lets me set a variable like `dueSoon` first and use it twice.

## Session 2: Logout and Locked Pages

Once `userName` lives in `App`, the header can change based on it. Logging out is just logging in backwards.

- `{userName && (...)}` hides "Signed in as" and the Logout button together when nobody is logged in.
- `&&` can only give back one thing, so the Dashboard, Assignment Detail, and Settings links are wrapped in a fragment, `<>...</>`. It groups them without adding an extra element to the page. One check instead of three.
- `logout()` undoes both halves of `loginUser`: `localStorage.removeItem('userName')` and `setUserName('')`. Both `&&` blocks go false and React hides them on the next render.
- `onClick={logout}` with no parentheses. That hands React the function to call later. `onClick={logout()}` would call it during render and log you out right away.
- The Logout link still has `to="/"`, so one click runs `logout` and then goes to the login page. No `navigate` needed.
- JavaScript is case sensitive. `setuserName` is a different name than `setUserName` and just throws "not defined."
- Hiding a link doesn't lock the page. You can still type `/settings` in the address bar. The routes need their own check.
- `<Navigate to="/" />` is a component that shows nothing and redirects as soon as it renders. So locking a route is just picking which component to render: `element={userName ? <Settings /> : <Navigate to="/" />}`.
- Ternary instead of `&&` for routes because I want something in both cases. `&&` would give a blank page when logged out.

## Session 1: Lifting State Up

The header and the login page both need to know who is logged in, so the name has to live in `App`, the parent they share. `App` keeps it with `useState` and passes Login a function prop called `onLogin`. Login can't change `App`'s state itself, but it can call that function, and `App` sets its own state. That's what the course means by "lifting state up."

- `const [userName, setUserName] = useState(localStorage.getItem('userName') || '')` gives back the value and a setter. The starting value is only used on the first render. `getItem` returns `null` when nothing is saved, so `|| ''` keeps it a string, and `''` means logged out.
- `onLogin={(name) => setUserName(name)}` is just a lambda. Functions are values in JavaScript, so `onLogin={setUserName}` works too.
- `loginUser` needs both lines. `localStorage.setItem` makes the name survive a refresh, and `onLogin` updates the header right now. With only one of them, you either lose it on refresh or don't see it until you refresh.
- `netId` is already in state from the controlled input, so `loginUser` just uses the variable instead of reading the box.
- An `on...` prop is a convention for "a function the child calls when something happens." React doesn't treat the name specially.
- `{userName && (...)}` only renders the JSX when `userName` isn't empty, since `''` is falsy. That's how "Signed in as" will hide when nobody is logged in.

# Startup React Phase 2 Plan 10/8/26

Plan for Startup React Phase 2:

Rubric: 70% multiple React components that implement or mock all app functionality, 30% React `useState` and `useEffect` hooks.

Mocks until the later deliverables: `localStorage` stands in for the database, hard-coded responses stand in for Canvas and SendGrid, and `setInterval` stands in for the WebSocket.

| # | Session | What gets built | Rubric |
|---|---|---|---|
| 1 | **Login state** | `App` keeps `userName` in `useState`, starting from `localStorage`. Login and Create Account save the Net ID to `localStorage` and pass it up through an `onLogin` prop. The header shows the real name instead of `ryan.shurtliff`. Simon: `app.jsx`, `login/unauthenticated.jsx`. | useState, Mock |
| 2 | **Logout and locked pages** | Logout clears `localStorage` and the state, then goes to `/`. Dashboard, Assignment Detail, Settings, and "Signed in as" only show in the nav when someone is logged in. Their routes send you back to login if not. Simon: `app.jsx`, `login/authenticated.jsx`. | Components |
| 3 | **Real dates** | Change `due` in the dashboard `mockData.js` to real dates and `average` to a number. Add small helpers to format a date like `Tue, Sep 22` and to work out "due soon" instead of hard-coding `dueSoon`. Needed before sorting can work. | Components |
| 4 | **Assignments in state** | Dashboard loads assignments in a `useEffect` from `localStorage`, using mockData the first time, and keeps them in `useState`. A second `useEffect` saves them back whenever they change. Simon: `scores/scores.jsx`. | useState, useEffect, Mock |
| 5 | **Filter and sort** | The class and sort dropdowns become controlled inputs. The table shows a filtered and sorted copy of the list, so it updates as you pick and the Apply button goes away. | useState |
| 6 | **Add assignment** | The Add form gets `useState` for title, class, and due date. Submitting adds a new assignment with its own id, saves it, and clears the form. | useState, Mock |
| 6.5 | **Delete added assignments** | Added after session 6. A small Delete button shows only on assignments I added (`custom-` ids), since Canvas ones would come back on the next sync. `deleteAssignment(id)` filters that one out and saves the rest. | Mock |
| 7 | **Check off and time prompt** | The checkbox toggles `done` on that assignment. The time-log dialog only renders right after you check a box (`{logging && <dialog>}`) and names that assignment. Save stores the hours on it, and Skip just closes it. Main feature from my spec. | useState, Components |
| 8 | **Assignment detail by id** | `useParams()` gets the id and the page loads that assignment from `localStorage` in a `useEffect`. Title, class, due date, and status come from it instead of being hard-coded. Bad id shows a not found message. | useEffect, Components |
| 9 | **Mark It Done and the chart** | The Mark It Done form is controlled and saves done, hours, and the note to the same stored assignment, so the dashboard matches. Your hours land in the right chart bucket, your note shows in the notes list, and the average, median, and longest are calculated from the data instead of typed in. | useState, Mock |
| 10 | **Fake WebSocket** | A `setInterval` inside a `useEffect` adds a random classmate logging a time every few seconds. The chart bars grow and the "Updating live" line changes. Dashboard Live Alerts get the same thing. The cleanup function clears the interval when you leave the page. Simon: `play/gameNotifier.js`, `play/players.jsx`. | useEffect, Mock |
| 11 | **Canvas link and sync** | The iCal input is controlled and saved to `localStorage`. Save and Sync calls a fake `syncCanvas()` that returns a hard-coded list, then updates the sync table, the totals line, and "last synced". Remove Link clears it. Sync Now runs the same function. | useState, Mock |
| 12 | **Reminders, account, wrap up** | Reminder email, lead time, and Sunday summary are controlled and saved to `localStorage`. The Account card shows the real Net ID and works out completed count and total hours from the stored assignments. Delete Account clears everything and logs out. Then the README "React part 2" checklist, these notes, and deploy with `-s startup`. | All |

Things to watch for:
- Commit at the end of every session, and more often when a session runs long. The rubric wants commits spread over several days.
- `defaultValue` and `defaultChecked` from P1 have to become `value` and `checked` with an `onChange` once the input is in state.
- Never change state directly (`assignments[0].done = true`). Make a new array or object and pass it to the setter, or React won't re-render.
- `localStorage` only holds strings, so it's `JSON.stringify` going in and `JSON.parse` coming out.
- A `useEffect` with a `setInterval` needs to return a cleanup function, or every visit to the page stacks another interval.

# Simon React Phase 2 10/8/26

Cloned the finished simon-react repo and deployed it to https://simon.cs260hwtrackr.click with `./deployReact.sh -k ~/.ssh/production.pem -h cs260hwtrackr.click -s simon`.

- The About page puts the image and quote in state and sets them in a `useEffect` with `[]`, so it runs once on load. It looks pointless now, but later the effect just swaps in a real `fetch`.
- `gameNotifier.js` fakes other players with a `setInterval` that sends a random score every 5 seconds. `players.jsx` adds a handler in `useEffect` and removes it in the cleanup function so handlers don't pile up.
- `simonGame.jsx` runs on three pieces of state: `allowPlayer`, `sequence`, and `playbackPos`. `onPressed` turns `allowPlayer` off first so you can't click again while it checks your press.
- The login state lives in `App`, not `Login`, because the nav menu needs it too. `Login` gets an `onAuthChange` function and calls it to tell `App` when it changes. That's "lifting state up."
- Scores and the username are kept in `localStorage` for now until there is a backend.

# Finishing React Phase 1 10/1/26

## What Porting Actually Means

Porting a page is mostly the same five steps every time. Copy only the page's own content into the component, since the header and footer already live in `app.jsx`. Fix the HTML that isn't valid JSX. Move that page's CSS into its own file next to the component and import it. Fix anything that assumed separate HTML pages. Then delete the old `.html` file.

## JSX Is Not HTML

- `class` is `className` and `for` is `htmlFor`, because both are JavaScript keywords.
- Comments are `{/* */}`, not `<!-- -->`.
- `style` takes an object, not a string. My bar chart's `style="--count: 12"` had to become `style={{ '--count': 12 }}`. The quotes are needed because of the dashes.
- Inputs with sample data need `defaultValue` and `defaultChecked`. Plain `value` or `checked` with no `onChange` makes React lock the input and log a warning.
- A component can only return one element. The login page has the banner and `main` side by side, so they get wrapped in `<>...</>`.
- Functions like `handleSubmit` go inside the component, above the `return`. The JSX only refers to them by name.

## A Single Page App Changes Links and Forms

There is only one real HTML page now. `<a href="dashboard.html">` becomes `<Link to="/dashboard">`, and forms use `onSubmit` with `event.preventDefault()` so they don't reload everything. `NavLink` adds an `active` class on its own, which replaced my ID selector trick for highlighting the current page.

The Vite dev server will serve a leftover `dashboard.html` at `/dashboard` before React gets a chance, so the old files had to move out of the root while I ported.

## Shared CSS vs Page CSS

`app.css` keeps what more than one page uses: colors, the header, the footer, cards, class color tags. Everything else lives next to its component. When I pasted CSS into a new file, VS Code shifted the indent, and Shift + Option + F fixed it.

## Deploying

`deployReact.sh` replaced `deployFiles.sh`. It runs `npm run build`, which bundles everything into `dist/` (one JS file, one CSS file, plus `public/`), and copies that up. `npm run preview` is the way to test the built version before deploying. The server sends back `index.html` for any path, which is why refreshing on `/settings` still works.

# Startup React Phase 1 Plan 10/1/26

Plan for Startup React Phase 1:

Rubric: 10% bundled with Vite, 70% multiple React components holding my HTML and CSS, 20% React router.

| # | Session | What gets built | Rubric |
|---|---|---|---|
| 1 | **Vite and reorganize** | `npm init`, install Vite, add the dev/build/preview scripts, add `dist` to `.gitignore`. Make `public/` for images and `src/` with a folder per view (login, dashboard, assignment, settings). Move `main.css` to `src/app.css`. | Vite |
| 2 | **Enable React** | Install `react`, `react-dom`, `react-router-dom`, `bootstrap`, and `react-bootstrap`. Rename the old `index.html` to `login.html`, then write the new `index.html` (just a `#root` div) and `index.jsx`. App stub shows up with `npm run dev`. | Vite |
| 3 | **App shell** | Move the header and footer into `app.jsx`. Swap the CDN Bootstrap for the npm import. The navbar becomes React Bootstrap `Navbar` so the phone menu collapses without Bootstrap's JS file. Change `body` styles to a wrapper class so the sticky footer still works. Inter font stays in `index.html`. | Components |
| 4 | **Router** | Stub components for Login, Dashboard, Assignment, Settings, and a NotFound page. `BrowserRouter`, `Routes`, and `NavLink` for the nav. NavLink adds `.active` on its own, so it replaces the `#page-x #nav-x` trick. | Router |
| 5 | **Login component** | Port the login HTML into `login.jsx` with its own `login.css`. The gradient banner moves into this component since only the login page has it. Login button goes to `/dashboard`. | Components |
| 6 | **Dashboard component** | Port the dashboard into `dashboard.jsx` and `dashboard.css`. JSX fixes: `class` to `className`, `for` to `htmlFor`, `checked` to `defaultChecked`, comments to `{/* */}`. Assignment titles become router `Link`s. | Components |
| 7 | **Assignment component** | Port the detail page. The bar chart's `style="--count: 12"` becomes `style={{ '--count': 12 }}`. Route becomes `/assignment/:id`, which is where the shared template idea starts to be real. | Components, Router |
| 8 | **Settings component** | Port settings. Delete the old `.html` pages and the unused `chartPlaceholder.jpg`. Check every route at phone and desktop width for overflow. | Components |
| 9 | **Deploy and document** | Replace `deployFiles.sh` with `deployReact.sh`, test with `npm run build` and `npm run preview`, then deploy with `-s startup`. Finish the README checklist and these notes. | All |

Things to watch for:
- Forms that `POST` to `dashboard.html` would reload the page in a single-page app. They need to stop doing that (button type or a small `onSubmit`) without adding real logic yet.
- React warns about inputs with `value` or `checked` and no `onChange`. Use `defaultValue` and `defaultChecked` for placeholder data.
- Refreshing on `/dashboard` only works if the server sends back `index.html` for unknown paths. My Simon React already does this on refresh, so the server is set up.
- Live Server doesn't work for Vite projects. Use `npm run dev`.

Decisions:
- Only the navbar uses React Bootstrap (`Navbar`). Everything else keeps plain Bootstrap classes like `className="btn btn-primary"`.
- `NavLink`'s `.active` class replaces the ID selector trick for the current page.
- `main.css` splits into a shared `app.css` plus one CSS file per component.
- The detail route is `/assignment/:id`, and each dashboard row links to its own id. The page still shows the same placeholder for now.
- "Signed in as" stays visible on every page until Phase 2, when there is real login state to check.
- Forms work in the single-page app now. Login and Create Account go to `/dashboard`, and the other forms stop reloading the page.

# Vite + React Notes
``` npm run dev ``` is how you launch a directory that uses vite. This still new so refer back to the Vite page in MasteryLS as needed. Vite directories don't work with the Go Live feature on VSCode.


# Finishing the CSS Deliverable 9/28/26:
## Feedback from MasteryLS
This is an exceptional CSS deliverable. You have demonstrated a high level of mastery in modern CSS techniques, particularly through the use of CSS variables, the :has() pseudo-class for state management, and a highly creative CSS-only bar chart. Your responsiveness is robust, utilizing both Grid and Flexbox effectively to handle complex layout shifts.

Strengths
CSS-only Bar Chart Implementation
In main.css, you implemented a bar chart using a semantic HTML table and CSS variables. This is a brilliant way to maintain accessibility while providing a visual representation of data without the overhead of a JavaScript library.

/* main.css */
.bar-chart td:last-child {
  grid-row: 1;
  align-self: end;
  height: calc(var(--count) / var(--max) * 100%);
  min-height: 1.75rem;
  padding-top: 0.3rem;
  /* ... */
  animation: grow-up 0.6s ease-out both;
}
Advanced Selector Usage
Your use of the :has() pseudo-class in main.css allows for sophisticated styling based on child state (checkboxes) that would traditionally require JavaScript. This keeps your codebase cleaner and more performant.

/* main.css */
.assignment-table tr:has(.form-check-input:checked) td {
  color: var(--done);
}

.assignment-table tr:has(.form-check-input:checked) a {
  color: var(--done);
  text-decoration: line-through;
}
Areas to improve
High Specificity Selectors
In main.css, you use ID-based descendant selectors to highlight the active navigation link. This creates very high specificity which can make future overrides difficult.

/* main.css */
#page-login #nav-login,
#page-dashboard #nav-dashboard,
#page-assignment #nav-assignment,
#page-settings #nav-settings {
  color: #ffffff;
  font-weight: 600;
}
Recommendation: Consider using a utility class like .active or the standard aria-current="page" attribute selector to reduce specificity.

Fixed Heights in Layouts
The bar chart container in main.css uses a fixed height, which might cause issues on very small viewport heights or if the content inside the bars (like text) grows.

` /* main.css */
.bar-chart tbody {
  display: flex;
  align-items: stretch;
  gap: clamp(0.4rem, 2vw, 1rem);
  height: 15rem;
}
Recommendation: Use min-height or aspect-ratio to allow the chart to scale more fluidly in different viewport orientations.

Bootstrap Versioning Inconsistency
In index.html (and others), you are referencing Bootstrap version 5.3.8. As of the current stable release, Bootstrap is on 5.3.3.

<!-- index.html -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
  /* ... */
/>
Recommendation: Ensure you are using a stable, existing version number to prevent potential 404 errors if a CDN purge occurs for non-existent versions.

Duplicate ID Usage
In dashboard.html, you have a time-logging dialog with an input ID of hours. If the assignment detail page and dashboard are ever merged into a single view (common in React), this will cause ID collisions.

<!-- dashboard.html -->
<input class="form-control" type="number" id="hours" name="hours" ... />
Recommendation: Use more specific IDs (e.g., id="dash-log-hours") or rely on classes for styling to ensure uniqueness across the application.

## Theming Bootstrap

Bootstrap stores its colors and fonts in CSS variables like `--bs-primary` and `--bs-body-bg`, and its components read from those. Changing them in `:root` recolors everything at once, so I never had to fight Bootstrap rule by rule. My stylesheet has to load after Bootstrap's for that to work.

The catch is that one variable can feed a lot of things. I set `--bs-body-bg` to my gray page color, and it turned out cards, tables, and inputs all use it for their background too. Everything came out gray on gray until I pointed `--bs-card-bg`, `--bs-table-bg`, and the input backgrounds back at white. A few things, like the blue glow around a focused input, are hard-coded, so those needed a normal override.

Bootstrap classes are what actually count. Loading the stylesheet only gives you the reset. The navbar, cards, form controls, buttons, and tables come from putting classes like `navbar`, `card`, `form-control`, and `btn btn-primary` in the HTML.

## Flexbox or Grid

Flexbox is for one direction, a row or a column where things share space and wrap. I used it for the navbar, button rows, the footer, and pinning the footer to the bottom (`body` as a column, `main` with `flex: 1`).

Grid is for two directions, or when I want exact columns. Each page layout is a grid that is one column on a phone and two on a bigger screen. `repeat(auto-fit, minmax(13rem, 1fr))` is the most useful line I learned. It fits as many columns as there is room for with no media query at all.

Bootstrap's own `row` and `col` are built on flexbox, so writing my own grids also meant the grader sees both.

One thing that bit me: making an `li` a flex container turns every piece inside it into a flex item. My settings steps had `<strong>` words in the middle of the sentence, and each one became its own column. Absolute positioning for the number circle fixed it and left the text as normal text.

## Selectors That Did Real Work

- `#page-dashboard #nav-dashboard` highlights the current page with no JavaScript. Every body and nav link has an id, and the pair only matches on its own page.
- `tr:has(input:checked)` styles a row based on something inside it. Checking a box crosses out the whole assignment.
- `::before` and `::after` add things that aren't in the HTML, like check marks, arrows, the nav underline, and step numbers from a CSS counter.

## A Bar Chart Without JavaScript

The assignment page's time chart is just the Hours Spent table. Each row has `style="--count: 12"` and the table has `--max: 12`. The bar's height is `calc(var(--count) / var(--max) * 100%)`. The data stays a real table for screen readers, and React will only need to change the numbers later.

## Testing for Overflow

The narrowest screen is where things break. `size="60"` on an input and `cols="50"` on a textarea both forced the page wider than a phone. Wide tables go in `table-responsive`, and on phones my assignment rows turn into small grid cards.

Breakpoints should come from the content, not a device list. My navbar collapsed at 768px at first, but at tablet width the links wrapped onto two lines, so I moved it to 992px with `navbar-expand-lg` and the matching media queries.

# Startup CSS Deliverable 9/27/26

## Plan

Milestones to complete CSS deliverable

| # | Session | What gets built | Rubric items it covers |
|---|---|---|---|
| 1 | **Foundation** | Link Bootstrap (CDN), a Google Font, and one shared `main.css` on all 4 pages. Set up color variables in `:root` and base `body`/heading styles. Fix the deploy script. | Framework, imported font, element selectors |
| 2 | **Header, nav, footer** | Turn the `nav` into a Bootstrap navbar that collapses on mobile. Lay out the header with flexbox, highlight the current page with an `#id`, add `:hover` effects, and keep the footer at the bottom of the page. | Responsive, pseudo selectors, ID selectors |
| 3 | **Login page** | Two-column grid (sign-in card on one side, "What you get" plus the sketch on the other) that stacks on phones. Bootstrap form controls and buttons. | Grid, framework, all elements styled |
| 4 | **Dashboard** | Style the Live Alerts panel (maybe a pulse animation), put the filter bar in a flex row, and make the table scroll on small screens instead of overflowing. Color-code each class, strike through checked rows with `:has(:checked)`, and style the time-logging `dialog` as a modal card. | Most of the "visually appealing" and selector points |
| 5 | **Assignment detail** | Show the `dl` as a grid of stat tiles, make the chart image responsive, show avg/median/longest as flex cards, and turn student notes into cards. | Flexbox/grid, no overflow |
| 6 | **Settings** | Style the forms, the sync table, and the danger styling on Delete Account. The long iCal URL input needs care because `size="60"` will overflow on phones. | No overflow, all elements styled |
| 7 | **Polish and ship** | Test every page at 375px, tablet, and desktop, and fix any leftover overflow. Finish the README rubric and notes.md, then deploy with `-s startup`. | Wraps up everything |



# Setting up AWS EC2 Server
- I set up the server and assigned an elastic IP address. For now it's the cheapest server, a t3.nano. Remember to cancel the 
Elastic IP addrss and terminate the server after the class. For now, the cost to leave it running is the same as keeping the IP address.

To get into the server run this:
```ssh -i ~/.ssh/trackr ubuntu@100.57.209.154```

To push changes to the server, run this from the working directory:
``` ./deployService.sh -k ~/.ssh/trackr -h cs260hwtrackr.click -s startup ```

My elastic IP address:
100.57.209.154

My DNS Domain (now supports HTTPS):
https://cs260hwtrackr.click/index.html

Working directory:
cd Desktop/Fall\ 2026/CS\ 260/startup/

## SSH Key Local Filepath:
- /Users/ryanshurtliff/.ssh/trackr (since 10/29/26)
- The old `production.pem` got committed to this repo on 9/12. I removed it the same day, but it stayed in git history where anyone could download it, so on 10/29 I made a new key and took the old one off the server. Removing a file in a later commit doesn't remove it from history. If a key ever gets committed, replace it.
- The server also has a key called `cs260` that came with the course's server image. It's not mine.

# CSS Notes:

## Selectors

A selector picks which elements a rule applies to. `p` grabs every paragraph, `.summary` every element carrying that class, `#physics` the one element with that id.

Combinators show relationships. `section p` is any paragraph inside a section, `section > p` only direct children, `div + p` the paragraph right after a div, `div ~ p` any sibling after it.

`a[href*="https"]` matches on an attribute, `section:hover` on state, and `*` grabs everything.

## Responsive Design

Phones lie about their width and scale the page down unless the head says otherwise:

```html
<meta name="viewport" content="width=device-width,initial-scale=1" />
```

`display` decides how an element renders. `block` fills the parent, `inline` only fits its content, `none` keeps the element but draws nothing, and `flex` and `grid` resize their children on their own.

`@media` applies rules conditionally, so `@media (orientation: portrait)` can hide or move things on a narrow screen.

## Simon CSS Notes

The CSS is split across files. `main.css` holds what every page shares, and `about.css`, `play.css`, and `scores.css` add only what that one page needs. Four small files are easier to work in than one long one, and it gets more true as the project grows.

Flex lays out the header, main, and footer so the three resize together. The game pad is a grid, `grid-template-columns: 1fr 1fr`, with the controls sitting on top of it using absolute positioning relative to their parent. A `@media (max-height: 600px)` rule hides content once the window gets short.

Simon also overrides Bootstrap so the menu does not flip to a column on a narrow screen. Worth remembering that a framework's defaults are just CSS and I can beat them with my own rule.

It deploys with `-s simon`, which overwrites the HTML version of Simon on that subdomain. The tab has to say "Simon CSS" for the submission to count.

# HTML Areas to improve (from MasteryLS intitial GitHub Submission):
9/18/26 (Used Claude to Make these Updates on 9/22/2026)
Secure Form Methods
In index.html, the login form uses the get method. This is a security risk because it appends the password to the URL in the browser history and server logs.

<form method="get" action="dashboard.html">
Change method="get" to method="post" for any forms handling sensitive user data like passwords.

Accessible Table Inputs
In dashboard.html, the checkboxes within the assignment table are not associated with labels or unique IDs, which makes them difficult for screen readers to navigate.

<td><input type="checkbox" /></td>
Assign a unique id to each checkbox and use an aria-label or a hidden label to describe what the checkbox does (e.g., "Mark Startup HTML Deliverable as complete").

External Link Security
In index.html and other footers, you link to your GitHub repository without specifying how the link should open.

<a href="https://github.com/rshurtliff/startup">GitHub Repository</a>
Add target="_blank" and rel="noopener noreferrer" to external links to improve user experience and prevent security vulnerabilities related to window hijacking.

Navigation List Consistency
In index.html, you used the <menu> element inside your <nav>. While valid, <menu> is typically intended for context menus or toolbars.

<nav>
  <menu>
    <li><a href="index.html">Login</a></li>
    ...
  </menu>
</nav>
Consider using a standard unordered list (<ul>) for site-wide navigation, as it is the most common and widely supported pattern for screen readers.


## What HTML Is

HTML is the structure of a web page. CSS handles how it looks and JavaScript handles what it does. The browser reads the HTML and turns it into the page I see.

## The Basic Pieces

An element is the whole thing, like `<p>Hello</p>`. The tags are the `<p>` and `</p>` parts. An attribute is extra info inside the opening tag, written as `name="value"`.

```html
<a href="https://example.com">Link text</a>
```

Here `href` is the attribute and "Link text" is the content. Elements can go inside other elements, but they have to close in the reverse order they opened. Some elements like `<img>` and `<br>` have no closing tag because they don't hold any content.

## Page Setup

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Shows up in the browser tab</title>
  </head>
  <body>
    Everything visible goes here
  </body>
</html>
```

The `head` is info about the page. The `body` is what people actually see.

## Elements I Use the Most

- `h1` to `h6` are headings. `h1` is the biggest and I should only use one per page.
- `p` is a paragraph.
- `div` is a block container and `span` is an inline container.
- `ul` and `ol` are bulleted and numbered lists. Each item is an `li`.
- `a` is a link.
- `img` is an image.
- `table`, `tr`, `th`, and `td` are the table, a row, a header cell, and a regular cell.

Block elements (`div`, `p`, `h1`) start on a new line and take up the full width. Inline elements (`span`, `a`, `img`) stay in the flow of the text.

## Semantic Elements

These do the same job as a `div`, but the name tells you what the section is for.

- `header` is the top of the page or a section
- `nav` holds the navigation links
- `main` is the main content
- `section` groups related content
- `aside` is side content
- `footer` is the bottom of the page

They help screen readers and search engines understand the page, so I should use them over plain `div`s when I can.

## Links and Images

```html
<a href="https://example.com">Click here</a>
<img src="photo.png" alt="What the image shows" width="200" />
```

`href` is where the link goes. `src` is where the image lives. `alt` is the text a screen reader reads, and it shows up if the image doesn't load. `width` sets the size in pixels.

A full URL like `https://example.com/page` is an absolute link. A path like `images/photo.png` is relative to my own site.

## Lists and Tables

```html
<ul>
  <li>First</li>
  <li>Second</li>
</ul>

<table>
  <tr>
    <th>Header</th>
    <th>Header</th>
  </tr>
  <tr>
    <td>Cell</td>
    <td>Cell</td>
  </tr>
</table>
```

Only `li` goes directly inside a list. In a table, each `tr` is one row, and every row should have the same number of cells.

## Comments

```html
<!-- This doesn't show up on the page -->
```

## CSS Intro

CSS can go in a `<style>` element. The format is `selector { property: value; }`. For example, `p { color: blue; }` makes every paragraph blue. `border`, `margin`, and `padding` control the space around an element.

## Things to Remember

- If something looks broken, check for a missing closing tag or quote first.
- Indent nested elements so I can see the structure.
- Always write `alt` text on images.
- Right click and hit Inspect to see how the browser is reading my HTML.
- Look things up on MDN when I forget them.



9/19/26
# Startup HTML Deliverable 9/19/26

## Page Plan

I mapped out four pages before writing anything, one for each part of the app:

- `index.html` is the login and register page. It has to be named this so it loads by default.
- `dashboard.html` is the assignment list.
- `assignment.html` is the detail view with the time distribution chart.
- `settings.html` is where the Canvas iCal link gets entered.

Doing this first made the nav bar easy, since I already knew every page I was linking to.

## Structure I Used

Every page follows the same skeleton:

```html
<body>
  <header>
    <h1>Trackr for Students</h1>
    <nav>
      <ul>
        <li><a href="dashboard.html">Dashboard</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <section>...</section>
  </main>
  <footer>...</footer>
</body>
```

I started with `menu` here instead of `ul`. It is valid and takes `li` items the same way, but `menu` is meant for toolbars and context menus. A nav bar should be a `ul`, since that is the pattern screen readers expect. I went back and changed all four pages.

## Placeholders

The rubric wants a spot marked for every technology I will add later, even though none of it works yet. What I did:

- Login is a real `form` with the net ID and password inputs. React will take it over later and the service will check the credentials against the database.
- I set the login form's `action` to `dashboard.html` so I can click straight through to the next page while there is no backend. That gets replaced once the service exists.
- HTML comments mark what each placeholder becomes. Comments do not render, so they cost nothing and remind me what I was thinking.

## Commits

I am committing once per page instead of dumping the whole deliverable in one push. The history shows the work actually happened over time, and the messages say something real. If I break a page, only one commit has to get undone.

I only staged `index.html` instead of using `git add -A`, which kept my unrelated `.DS_Store` change out of the commit. I should add `.DS_Store` to `.gitignore` since it is a Mac file and has nothing to do with the site.

## Saving a Claude Code Session

Sessions save on their own to `~/.claude/projects/` as `.jsonl` files, one per session. Useful commands:

- `/resume` picks an old session from a list and keeps the context.
- `claude --continue` jumps back into the most recent session in the current folder.
- `/export` writes the conversation out as readable text.

Those files live outside the repo, so they never get pushed to GitHub.




9/22/26
# Finishing the HTML Deliverable 9/22/26

## Tags I Had Not Used Before

Writing the last three pages made me reach for tags I skipped in the reading.

`dl` is a description list. It takes `dt` for the term and `dd` for the value, so it fits things like Due, Status, and Points better than a table with two columns does.

`dialog` is a real popup element. It stays hidden until something opens it, but adding the `open` attribute forces it to show. I used that for the time logging prompt so the placeholder is visible before I have any JavaScript to open it.

`figure` and `figcaption` wrap an image with its caption so the two stay attached to each other.

For tables, `thead` and `tbody` split the header row off from the data rows. The table works without them, but it makes the structure obvious when I read the source later.

## Input Types Do Real Work

I assumed every input was `type="text"` with different labels. They are not. `type="url"` and `type="email"` make the browser check the format before it submits. `type="number"` with `step="0.25"` gives me quarter hour increments on the time field. `type="datetime-local"` opens a date and time picker for free.

Every input needs a `label` whose `for` matches the input's `id`. That is what lets you click the label to focus the field, and it is how a screen reader knows what the input is asking for.

## The Deploy Script Needed Changing

The script from the Simon repo ends with `scp -r * ` which copies everything in the folder. That is right for Simon, where every file in the folder is part of the site. It is wrong for my startup folder, which also holds my README, my notes, and the whole simon-html directory.

I narrowed it to `scp *.html *.png *.svg *.jpg` so only the site goes up. Using globs instead of listing filenames means new pages get picked up without touching the script again.

## Subdomains

The `-s` flag on the deploy script is not just a label. It picks the directory on the server, `services/<service>/public`, and that is what decides the subdomain. So `-s startup` puts my site at startup.cs260hwtrackr.click and `-s simon` puts Simon at simon.cs260hwtrackr.click. The `-h` flag is only the address used to SSH in.

I had the README pointing at the root domain for a while. The assignment wants it on the startup subdomain.

## simon-html Is Its Own Repo

I tried to edit a file inside simon-html and git told me the path did not match any tracked file. It turns out simon-html has its own `.git` folder, because I cloned it inside my startup folder. My startup repo only stores a pointer to it, not the files. On GitHub that folder shows up grayed out and the TA cannot click into it.

Not a problem since Simon gets graded from its own repo, but I should know which repo I am in before I run git commands.

## Commits

The rubric wants dozens of commits spread over multiple days, and it says a thin history can get the submission rejected. Batching a day of work into one commit is the thing to avoid. One commit per change, pushed as I go.

## Fixing the Feedback From My First Submission

Four things came back on the initial GitHub submission. All of them were real.

**GET versus POST.** My login form used `method="get"`, which puts whatever you typed into the URL. That means the password lands in browser history, in server logs, and in the referrer header sent to the next site. Anything that writes data or handles something private needs `method="post"`, where the values travel in the request body instead.

I changed more than just the login form. The Canvas iCal URL on my settings page is an unguessable link that gives away a student's whole calendar, so that form should never have been a GET either. The one form I left alone is the class and sort filter on the dashboard, because a filter is a query, not a write. Putting it in the URL is the right behavior there since it makes the filtered view linkable.

Before I changed it I checked that my server would still accept a POST to a plain `.html` file. It returns 200, so the click through still works with no backend.

**Checkboxes need labels too.** The checkboxes in my assignment table were bare `<input type="checkbox" />` with nothing naming them. A sighted person knows what the box means from the row it sits in, but a screen reader reads the controls on their own and would just announce "checkbox" four times. Each one now has a unique `id` and an `aria-label` that says what it does, like "Mark Startup HTML Deliverable as complete." `aria-label` is for when the description should not be visible on screen, which is the case inside a table cell.

**External links.** Links that leave my site now have `target="_blank"` so they open in a new tab, plus `rel="noopener noreferrer"`. Without `noopener` the page I link to can reach back through `window.opener` and redirect my tab somewhere else. `noreferrer` stops my URL from being sent along.

**menu versus ul.** Covered above. Use `ul` for navigation.

The pattern in all four is the same. The page looked fine in my browser, so I assumed it was fine. Valid HTML that renders correctly can still be insecure or unusable with a screen reader.
