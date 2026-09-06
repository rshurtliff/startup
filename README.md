# Startup Specification

## Initial Idea (from the application page)
Every BYU student needs a way to track everything due across their classes, and the tools already out there do not cut it. Canvas buries assignments in course by course lists, and Learning Suite is being phased out entirely. My idea is a web app that pulls a student's assignments directly from their Canvas iCal feed, stores everything in one place, and lets them check things off as they go.

The core of the app is simple. A student pastes in their iCal link once, the backend parses it and stores every assignment in a MongoDB database, and the student sees a clean dashboard of what is due and when. They can check assignments off as they finish them, and the app sends reminders as deadlines get close.

The feature that makes this more than a glorified to-do list is the time tracking. After a student checks off an assignment, the app asks how long it actually took. Once enough students have logged their time on a given assignment, anyone viewing that assignment can see a distribution of how long it took other people, not just a title and a due date. That is the real value here. Instead of guessing whether a problem set will take thirty minutes or three hours, a student can see what it actually took everyone else.

*Optional Layer for added complexity*: On top of the individual tracking, there is a social layer. Students can see how many assignments their friends have completed, compare progress by class, and see which assignments they have in common. Combined with the time data, that turns the app into something people actually want to open, not just another tool they forget about a week into the semester.

## List of Key Features
1. Ability to load all assignments from Canvas
2. Ability to add custom assignments
3. Ability to sort assignments by class, due date, etc.
4. Be able to check off assignments
5. Upon completion, user is prompted to enter the time spent
6. Ability to view a summary of time spent by others on each assignment

## Plan to use each skill / technology:
- **HTML** - Uses correct HTML structure for application. Pages/views for dashboard, class detail/assignment detail, and login/register. Semantic elements for assignment lists, the iCal-link setup form, and the time-logging modal.
- **CSS** - Application styling that looks good on different screen sizes. Color-coded classes, due-soon highlighting on the dashboard, and animated transitions for checking off assignments and the time-distribution chart rendering.
- **React** - Provides login, dashboard display, checking off assignments, time-logging prompts, and backend endpoint calls. Componentized into pieces like AssignmentCard, ClassFilter, and TimeDistributionChart, with routing between the Dashboard and Assignment Detail views. Reactive to user actions — checking off an assignment instantly triggers the time-logging prompt without a page reload.
- **Service** - Backend service with endpoints for:
  - storing and parsing a student's Canvas iCal link into assignment records
  - retrieving assignments, sorted by date or grouped by class
  - marking an assignment complete and logging how long it took
  - retrieving aggregated time-distribution stats for a given assignment
  - sending deadline reminder emails using the [SendGrid API](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
  - Register, login, and logout users. Credentials securely stored in database. Can't view a dashboard unless authenticated.
- **DB** - Store user accounts and credentials, each user's iCal source, parsed assignments, and completion status/logged times in the database.
- **WebSocket** - As other students log how long an assignment took them, anyone currently viewing that assignment's detail page sees the time-distribution chart update live, without refreshing. Deadline reminder alerts are also pushed to the dashboard in real time as they approach.