const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const express = require('express');
const uuid = require('uuid');
const { getCanvasAssignments } = require('./canvas');
const app = express();

const authCookieName = 'token';

// Users are kept in memory for now, so they go away whenever the service
// restarts. The database deliverable replaces this.
let users = [];

// The port comes from the command line when PM2 starts it on the server.
// Startup services use 4000.
const port = process.argv.length > 2 ? process.argv[2] : 4000;

// Turns JSON request bodies into req.body
app.use(express.json());

// Reads the login cookie into req.cookies
app.use(cookieParser());

// Serves the built React frontend once it's deployed
app.use(express.static('public'));

// Every endpoint lives under /api
const apiRouter = express.Router();
app.use(`/api`, apiRouter);

// Create Account: 409 if the Net ID is taken, otherwise make the user and log them in
apiRouter.post('/auth/create', async (req, res) => {
  if (await findUser('netId', req.body.netId)) {
    res.status(409).send({ msg: 'That Net ID already has an account' });
  } else {
    const user = await createUser(req.body.netId, req.body.password);

    setAuthCookie(res, user.token);
    res.send({ netId: user.netId });
  }
});

// Login: check the password against the saved hash and hand out a new token
apiRouter.post('/auth/login', async (req, res) => {
  const user = await findUser('netId', req.body.netId);
  if (user) {
    if (await bcrypt.compare(req.body.password, user.password)) {
      user.token = uuid.v4();
      setAuthCookie(res, user.token);
      res.send({ netId: user.netId });
      return;
    }
  }
  res.status(401).send({ msg: 'Wrong Net ID or password' });
});

// Logout: forget the token so the cookie stops working
apiRouter.delete('/auth/logout', async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user) {
    delete user.token;
  }
  res.clearCookie(authCookieName);
  res.status(204).end();
});

// Middleware for endpoints that need a login. Lets the request through only
// if the cookie's token belongs to a user, and saves that user on req.
const verifyAuth = async (req, res, next) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user) {
    req.user = user;
    next();
  } else {
    res.status(401).send({ msg: 'Unauthorized' });
  }
};

// Get Me: who is logged in. Needs the auth token.
apiRouter.get('/user/me', verifyAuth, (req, res) => {
  res.send({ netId: req.user.netId, createdAt: req.user.createdAt });
});

// GetAssignments: the logged-in user's assignment list. Empty until they save one.
apiRouter.get('/assignments', verifyAuth, (req, res) => {
  res.send(req.user.assignments || []);
});

// SaveAssignments: replaces the logged-in user's list with the one sent
apiRouter.put('/assignments', verifyAuth, (req, res) => {
  req.user.assignments = req.body;
  res.send(req.user.assignments);
});

// GetClassTimes: everyone else's logged hours, grouped by assignment id.
// My own hours aren't included because my page already adds them.
apiRouter.get('/times', verifyAuth, (req, res) => {
  const times = {};
  for (const user of users) {
    if (user === req.user) continue;
    for (const a of user.assignments || []) {
      if (a.done && a.myHours != null) {
        if (!times[a.id]) times[a.id] = [];
        times[a.id].push(a.myHours);
      }
    }
  }
  res.send(times);
});

// GetSettings: my Canvas link, last sync, and reminder settings
apiRouter.get('/settings', verifyAuth, (req, res) => {
  res.send(req.user.settings || {});
});

// SaveSettings: merges in whatever was sent, so each card can save just its part
apiRouter.put('/settings', verifyAuth, (req, res) => {
  req.user.settings = { ...req.user.settings, ...req.body };
  res.send(req.user.settings);
});

// ChangePassword: saves the hash of the new password. Login uses it from now on.
apiRouter.put('/user/password', verifyAuth, async (req, res) => {
  if (!req.body.password || req.body.password.length < 8) {
    res.status(400).send({ msg: 'Password has to be at least 8 characters' });
    return;
  }
  req.user.password = await bcrypt.hash(req.body.password, 10);
  res.status(204).end();
});

// SyncCanvas: downloads my Canvas feed from the link saved in my settings and
// updates my assignment list. This has to run here, not in the browser: Canvas
// doesn't allow other sites to read the feed (CORS), and the link is private.
apiRouter.post('/sync', verifyAuth, async (req, res) => {
  const icalUrl = req.user.settings ? req.user.settings.icalUrl : '';
  if (!icalUrl) {
    res.status(400).send({ msg: 'Save your Canvas link first' });
    return;
  }
  if (!isSafeFeedUrl(icalUrl)) {
    res.status(400).send({ msg: 'Use the https:// link from Canvas\'s Calendar Feed button' });
    return;
  }

  let fromCanvas;
  try {
    fromCanvas = await getCanvasAssignments(icalUrl);
  } catch (err) {
    res.status(502).send({ msg: `Couldn't read your Canvas feed. ${err.message}.` });
    return;
  }

  // Canvas decides which assignments exist and what they're called. Trackr
  // keeps my checkmark, hours, and note on any I already had. Assignments I
  // added myself stay too.
  const mine = req.user.assignments || [];
  const synced = fromCanvas.map((a) => {
    const old = mine.find((m) => m.id === a.id);
    return old ? { ...a, done: old.done, myHours: old.myHours, myNote: old.myNote } : { ...a, done: false };
  });
  const added = mine.filter((m) => m.id.startsWith('custom-'));
  req.user.assignments = [...synced, ...added];

  // When it synced and how many it found per class, for the Sync Status table
  const classes = [];
  for (const a of fromCanvas) {
    const c = classes.find((c) => c.key === a.classKey);
    if (c) {
      c.found++;
    } else {
      classes.push({ key: a.classKey, code: a.classCode, found: 1 });
    }
  }
  classes.sort((a, b) => a.code.localeCompare(b.code));
  const canvasSync = { syncedAt: new Date().toISOString(), classes: classes };
  req.user.settings = { ...req.user.settings, canvasSync: canvasSync };

  res.send({ canvasSync: canvasSync, assignments: req.user.assignments });
});

// DeleteUser: removes my account and everything saved with it, then logs me out
apiRouter.delete('/user', verifyAuth, (req, res) => {
  users = users.filter((u) => u !== req.user);
  res.clearCookie(authCookieName);
  res.status(204).end();
});

// Default error handler
app.use(function (err, req, res, next) {
  res.status(500).send({ type: err.name, message: err.message });
});

// Any other path gets the React app, so routes like /dashboard work on refresh
app.use((_req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// Only the hash of the password is saved, never the password itself
async function createUser(netId, password) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    netId: netId,
    password: passwordHash,
    token: uuid.v4(),
    createdAt: new Date().toISOString(),
  };
  users.push(user);

  return user;
}

// The server downloads whatever link a user saves, so only allow real https
// sites by name. That stops a link like http://localhost:4000 or a bare IP
// address from making my server poke at itself or the network it sits on.
function isSafeFeedUrl(text) {
  let url;
  try {
    url = new URL(text);
  } catch {
    return false;
  }
  const host = url.hostname;
  const isIpAddress = /^[\d.]+$/.test(host) || host.includes(':') || host.startsWith('[');
  return url.protocol === 'https:' && host !== 'localhost' && !host.endsWith('.localhost') && !isIpAddress;
}

async function findUser(field, value) {
  if (!value) return null;

  return users.find((u) => u[field] === value);
}

// httpOnly keeps JavaScript from reading the cookie, secure means HTTPS only,
// and sameSite strict only sends it back to this site
function setAuthCookie(res, authToken) {
  res.cookie(authCookieName, authToken, {
    maxAge: 1000 * 60 * 60 * 24 * 365,
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  });
}

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
