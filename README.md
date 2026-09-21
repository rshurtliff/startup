# What's New (for the TA's)
- Deployed Files for Simon, per assignments in the Simon HTML module in MasteryLS
- Added Startup HTML Deliverable
- Added a deployment script for the Startup, not just Simon
- Deployed initial HTML Deliverable, might revise later


# Startup HTML Deliverable

Live site: [cs260hwtrackr.click](https://cs260hwtrackr.click)

## What I Did For Each Rubric Item

**20% HTML pages for each component of your application**

Four pages, one for each part of the app.

- `index.html` is the login and register page. It loads by default.
- `dashboard.html` is the main view with the assignment list.
- `assignment.html` is the detail view for a single assignment.
- `settings.html` is where the Canvas calendar link and the email reminders get set up.

**10% Proper use of HTML tags including BODY, NAV, MAIN, HEADER, FOOTER**

All four pages share the same skeleton. The `header` holds the app name, the signed in user, and the `nav`. The `main` holds the content, split into `section` elements by topic. The `footer` has my name and a link to this repo. Inside that I used `table` with `thead` and `tbody` for the assignment lists, `dl` for the assignment details, `form` and `label` on every input, and `figure` with `figcaption` for the images.

**10% Links between pages as necessary**

The nav bar is on every page and links to every page. Past that, each assignment title on the dashboard opens the detail view, the detail view links back to the dashboard, the dashboard points to settings, and the login form sends you through to the dashboard. You can click through the entire app without a line of JavaScript.

**10% Application textual content**

None of it is filler. The login page explains what the app does and why I built it. The settings page walks through finding your Canvas calendar feed, since that is the step people actually get stuck on. The assignment page has a description, the stats, and notes other students left behind. The sample data uses the classes I am taking right now.

**10% Placeholder for 3rd party service calls**

Both of my services live on `settings.html`, with a summary on the dashboard under Connected Services. The Canvas iCal field is where a student pastes their calendar link, and the service will fetch that URL, parse it, and save every assignment it finds. The reminder settings below it control the deadline emails I will send through SendGrid.

**10% Application images**

`designSketch.png` sits on the login page and shows the three main views. `chartPlaceholder.jpg` on the assignment page stands in for the time distribution chart until React can render a real one. Both have alt text.

**10% Login placeholder, including user name display**

`index.html` has the net ID and password fields with Login and Create Account buttons. After that, every page shows "Signed in as ryan.shurtliff" in the header with a logout link next to it. The name is hardcoded for now. It will come from the authenticated user once the service is running.

**10% Database data placeholder showing content stored in the database**

Anything that would come out of MongoDB is already on the page. The dashboard has the assignment table, including the checkbox state and the class average. Settings has the sync table showing each class and how many assignments came back from Canvas. The detail page has the assignment record itself, the time distribution buckets, and the notes from other students.

**10% WebSocket data placeholder showing where realtime communication will go**

Live Alerts at the top of the dashboard is where deadline warnings and other students' activity get pushed the moment they happen. The time distribution chart on the assignment page is the other half of that. When somebody finishes the assignment and logs their hours, the chart redraws for everyone who has the page open, with no refresh. HTML comments mark both spots in the source.





# Specification Deliverable

## Elevator Pitch: BYU Student Homework Tracker
Every BYU student needs a way to track everything due across their classes, and the tools already out there don't cut it. Canvas buries assignments in course-by-course lists, and Learning Suite is being phased out entirely. My idea pulls a student's assignments straight from their Canvas iCal feed into one clean dashboard, where they can check things off and get reminders as deadlines close in. What sets it apart from a glorified to-do list is time tracking: once a student marks an assignment done, the app asks how long it actually took, and that data builds into a live distribution anyone can see before they start. Instead of guessing whether a problem set takes thirty minutes or three hours, a student can see what it actually took everyone else.

## List of Key Features
1. Ability to load all assignments from Canvas
2. Ability to add custom assignments
3. Ability to sort assignments by class, due date, etc.
4. Be able to check off assignments
5. Upon completion, user is prompted to enter the time spent
6. Ability to view a summary of time spent by others on each assignment

## Plan to use each skill / technology
- [x] **HTML** - Uses correct HTML structure for application. Pages/views for dashboard, class detail/assignment detail, and login/register. Semantic elements for assignment lists, the iCal-link setup form, and the time-logging modal.
- [x] **CSS** - Application styling that looks good on different screen sizes. Color-coded classes, due-soon highlighting on the dashboard, and animated transitions for checking off assignments and the time-distribution chart rendering.
- [x] **React** - Provides login, dashboard display, checking off assignments, time-logging prompts, and backend endpoint calls. Divided into pieces like AssignmentCard, ClassFilter, and TimeDistributionChart, with routing between the Dashboard and Assignment Detail views. Reactive to user actions. Checking off an assignment instantly triggers the time-logging prompt without a page reload.
- [x] **Service** - Backend service with endpoints for:
  - storing and parsing a student's Canvas iCal link into assignment records
  - retrieving assignments, sorted by date or grouped by class
  - marking an assignment complete and logging how long it took
  - retrieving aggregated time-distribution stats for a given assignment
  - sending deadline reminder emails using the [SendGrid API](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
  - Register, login, and logout users. Credentials securely stored in database. Can't view a dashboard unless authenticated.
- [x] **DB** - Store user accounts and credentials, each user's iCal source, parsed assignments, and completion status/logged times in the database.
- [x] **WebSocket** - As other students log how long an assignment took them, anyone currently viewing that assignment's detail page sees the time-distribution chart update live, without refreshing. Deadline reminder alerts are also pushed to the dashboard in real time as they approach.

## Design Sketch

![Design sketch of the assignment tracker: login, dashboard, and assignment detail views, plus the architecture connecting the React client, Express service, MongoDB, the Canvas iCal feed, and SendGrid](designSketch.png)

The top row sketches the three main views: **login/register**, the **dashboard** (assignments pulled from Canvas, color-coded by class and sorted by due date, with the time-logging prompt that fires the instant a box is checked), and the **assignment detail** view with its live time-distribution chart.

The bottom half shows how the pieces connect. The React client talks to the Express service two ways: ordinary HTTPS calls for reading and writing assignments, and an open WebSocket that pushes new time data and deadline alerts down to anyone currently viewing an assignment. The service is the only thing that touches MongoDB, the student's Canvas iCal feed, and the SendGrid API.

