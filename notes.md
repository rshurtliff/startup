# Setting up AWS EC2 Server**
- I set up the server and assigned an elastic IP address. For now it's the cheapest server, a t3.nano. Remember to cancel the 
Elastic IP addrss and terminate the server after the class. For now, the cost to leave it running is the same as keeping the IP address.

To get into the server run this:
```ssh -i ~/.ssh/production.pem ubuntu@100.57.209.154```

My elastic IP address:
100.57.209.154

My DNS Domain (now supports HTTPS):
https://cs260hwtrackr.click/index.html

Working directory:
cd Desktop/Fall\ 2026/CS\ 260/startup/

## PEM Key Local Filepath:
- /Users/ryanshurtliff/.ssh/production.pem




9/18/26
# HTML Notes 9/18/26


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
      <menu>
        <li><a href="dashboard.html">Dashboard</a></li>
      </menu>
    </nav>
  </header>
  <main>
    <section>...</section>
  </main>
  <footer>...</footer>
</body>
```

`menu` works like `ul` and still takes `li` items, but the name says the list is a set of commands or links. Either one is fine for a nav bar.

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
