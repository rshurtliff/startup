const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const express = require('express');
const uuid = require('uuid');
const { getCanvasAssignments } = require('./canvas');
// Connects to MongoDB as soon as it's loaded. All the database code is in
// database.js, so this file just calls DB.getUser() and friends.
const DB = require('./database.js');
const app = express();

const authCookieName = 'token';

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
  if (await DB.getUser(req.body.netId)) {
    res.status(409).send({ msg: 'That Net ID already has an account' });
  } else {
    const user = await createUser(req.body.netId, req.body.password);

    setAuthCookie(res, user.token);
    res.send({ netId: user.netId });
  }
});

// Login: check the password against the saved hash and hand out a new token
apiRouter.post('/auth/login', async (req, res) => {
  const user = await DB.getUser(req.body.netId);
  if (user) {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const token = uuid.v4();
      await DB.updateUser(user.netId, { token: token });
      setAuthCookie(res, token);
      res.send({ netId: user.netId });
      return;
    }
  }
  res.status(401).send({ msg: 'Wrong Net ID or password' });
});

// Logout: forget the token so the cookie stops working
apiRouter.delete('/auth/logout', async (req, res) => {
  const user = await DB.getUserByToken(req.cookies[authCookieName]);
  if (user) {
    await DB.clearToken(user.netId);
  }
  res.clearCookie(authCookieName);
  res.status(204).end();
});

// Middleware for endpoints that need a login. Lets the request through only
// if the cookie's token belongs to a user in the database, and saves that
// user on req. req.user is a copy, so changing it doesn't save anything.
const verifyAuth = async (req, res, next) => {
  const user = await DB.getUserByToken(req.cookies[authCookieName]);
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
apiRouter.get('/assignments', verifyAuth, async (req, res) => {
  res.send(await DB.getAssignments(req.user.netId));
});

// SaveAssignments: replaces the logged-in user's list with the one sent
apiRouter.put('/assignments', verifyAuth, async (req, res) => {
  if (!Array.isArray(req.body)) {
    res.status(400).send({ msg: 'Send the whole assignment list' });
    return;
  }
  await DB.saveAssignments(req.user.netId, req.body);
  res.send(req.body);
});

// GetClassTimes: everyone else's logged hours, grouped by assignment id.
// My own hours aren't included because my page already adds them.
// The database finds the finished ones with hours; this just groups them.
apiRouter.get('/times', verifyAuth, async (req, res) => {
  const times = {};
  for (const a of await DB.getClassTimes(req.user.netId)) {
    if (!times[a.id]) times[a.id] = [];
    times[a.id].push(a.myHours);
  }
  res.send(times);
});

// GetSettings: my Canvas link and last sync
apiRouter.get('/settings', verifyAuth, async (req, res) => {
  res.send(await DB.getSettings(req.user.netId));
});

// SaveSettings: merges in whatever was sent, so each card can save just its part
apiRouter.put('/settings', verifyAuth, async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    res.status(400).send({ msg: 'Send the settings to change' });
    return;
  }
  res.send(await DB.updateSettings(req.user.netId, req.body));
});

// ChangePassword: saves the hash of the new password. Login uses it from now on.
apiRouter.put('/user/password', verifyAuth, async (req, res) => {
  if (!req.body.password || req.body.password.length < 8) {
    res.status(400).send({ msg: 'Password has to be at least 8 characters' });
    return;
  }
  const passwordHash = await bcrypt.hash(req.body.password, 10);
  await DB.updateUser(req.user.netId, { password: passwordHash });
  res.status(204).end();
});

// SyncCanvas: downloads my Canvas feed from the link saved in my settings and
// updates my assignment list. This has to run here, not in the browser: Canvas
// doesn't allow other sites to read the feed (CORS), and the link is private.
apiRouter.post('/sync', verifyAuth, async (req, res) => {
  const netId = req.user.netId;
  const settings = await DB.getSettings(netId);
  const icalUrl = settings.icalUrl || '';
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
  const mine = await DB.getAssignments(netId);
  const synced = fromCanvas.map((a) => {
    const old = mine.find((m) => m.id === a.id);
    return old ? { ...a, done: old.done, doneAt: old.doneAt, myHours: old.myHours, myNote: old.myNote } : { ...a, done: false };
  });
  const added = mine.filter((m) => m.id.startsWith('custom-'));
  const newList = [...synced, ...added];
  await DB.saveAssignments(netId, newList);

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
  await DB.updateSettings(netId, { canvasSync: canvasSync });

  res.send({ canvasSync: canvasSync, assignments: newList });
});

// DeleteUser: removes my account and everything saved with it, then logs me out
apiRouter.delete('/user', verifyAuth, async (req, res) => {
  const netId = req.user.netId;
  await DB.deleteUser(netId);
  await DB.deleteAssignments(netId);
  await DB.deleteSettings(netId);
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
  await DB.addUser(user);

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
