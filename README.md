# Startup Specification

## Initial Idea (from the application page)
Every BYU student needs a way to track everything due across their classes, and the tools already out there do not cut it. Canvas buries assignments in course by course lists, and Learning Suite is being phased out entirely. My idea is a web app that pulls a student's assignments directly from their Canvas iCal feed, stores everything in one place, and lets them check things off as they go.

The core of the app is simple. A student pastes in their iCal link once, the backend parses it and stores every assignment in a MongoDB database, and the student sees a clean dashboard of what is due and when. They can check assignments off as they finish them, and the app sends reminders as deadlines get close.

The feature that makes this more than a glorified to-do list is the time tracking. After a student checks off an assignment, the app asks how long it actually took. Once enough students have logged their time on a given assignment, anyone viewing that assignment can see a distribution of how long it took other people, not just a title and a due date. That is the real value here. Instead of guessing whether a problem set will take thirty minutes or three hours, a student can see what it actually took everyone else.

On top of the individual tracking, there is a social layer. Students can see how many assignments their friends have completed, compare progress by class, and see which assignments they have in common. Combined with the time data, that turns the app into something people actually want to open, not just another tool they forget about a week into the semester.

## Skills required (from assignment)
1. Use the fundamental web languages of HTML, CSS, and JavaScript to create a responsive web application that works well on a variety of screen sizes.
2. Use the React webframework to provide an application that reacts to user interactions.
3. Provide a backend service with endpoints for authentication and application specific functionality.
4. Persist data in a Mongo database.
5. Use Websocket to push data from your service to the browser. This can be data that the service initiates such as notification, or data that is relayed from another user.
6. Have sufficient complexity for a demonstration of mastery of full stack development at the university introductory web programming level.
