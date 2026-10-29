const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const express = require('express');
const uuid = require('uuid');
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
