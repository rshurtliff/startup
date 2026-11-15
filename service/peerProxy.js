const { WebSocketServer, WebSocket } = require('ws');
const DB = require('./database.js');

// Same cookie the login endpoints set in index.js
const authCookieName = 'token';

// Made in peerProxy(). Up here so the send functions below can reach it.
let socketServer = null;

// Pulls one cookie out of the request's raw Cookie header, which looks like
// "token=abc123; other=xyz". Express's cookieParser only runs on normal
// requests, not on the WebSocket upgrade, so this does it by hand.
function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

// Adds WebSocket to the HTTP server Express is already running, at /ws.
// A WebSocket starts as a normal HTTP request asking to "upgrade". Simon
// upgrades anyone. Trackr checks the login cookie first, so only logged in
// users can connect, and it remembers whose socket each one is.
function peerProxy(httpServer) {
  // noServer means I decide when to accept a connection, in the upgrade
  // handler below, instead of ws accepting everything on its own
  socketServer = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', async (req, socket, head) => {
    // Only /ws gets a WebSocket. Anything else asking to upgrade is dropped.
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path !== '/ws') {
      socket.destroy();
      return;
    }

    // Same check as verifyAuth: the cookie's token has to belong to a user
    let user = null;
    try {
      user = await DB.getUserByToken(readCookie(req, authCookieName));
    } catch {
      user = null;
    }
    if (!user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Finish the upgrade. From here on it's an open WebSocket.
    socketServer.handleUpgrade(req, socket, head, (ws) => {
      ws.netId = user.netId;
      socketServer.emit('connection', ws, req);
    });
  });

  socketServer.on('connection', (ws) => {
    // Answering a ping with a pong proves the connection is still alive
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Lets the browser know the connection worked
    ws.send(JSON.stringify({ type: 'connected' }));
  });

  // Every 10 seconds, ping every socket. One that never answered the last
  // ping is gone (a closed laptop, a dropped phone connection), so close it.
  setInterval(() => {
    socketServer.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 10000);
}

// Sends a message to every open socket that belongs to one of these Net IDs.
// One person can have a few sockets open (a laptop tab and a phone), so it
// checks them all. Only the message goes out, never whose socket it is.
function sendToUsers(netIds, message) {
  if (!socketServer || netIds.length === 0) return;
  const text = JSON.stringify(message);
  socketServer.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN && netIds.includes(ws.netId)) {
      ws.send(text);
    }
  });
}

// Closes every socket a user has open. Used on logout and account delete, so a
// tab that's still open stops getting updates once the login is gone.
function closeUserSockets(netId) {
  if (!socketServer) return;
  socketServer.clients.forEach((ws) => {
    if (ws.netId === netId) {
      ws.close();
    }
  });
}

module.exports = { peerProxy, sendToUsers, closeUserSockets };
