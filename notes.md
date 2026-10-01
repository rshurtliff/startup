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
```ssh -i ~/.ssh/production.pem ubuntu@100.57.209.154```

To push changes to the server, run this from the working directory:
``` ./deployFiles.sh -k ~/.ssh/production.pem -h cs260hwtrackr.click -s startup ```

My elastic IP address:
100.57.209.154

My DNS Domain (now supports HTTPS):
https://cs260hwtrackr.click/index.html

Working directory:
cd Desktop/Fall\ 2026/CS\ 260/startup/

## PEM Key Local Filepath:
- /Users/ryanshurtliff/.ssh/production.pem

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
