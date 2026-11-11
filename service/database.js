const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

// The address of my Atlas cluster, with my login from dbConfig.json built in
const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('trackr');

// One collection for each kind of thing Trackr saves
const userCollection = db.collection('user');
const assignmentCollection = db.collection('assignment');
const settingsCollection = db.collection('settings');

// Checks the connection when the server starts. If it fails, stop right away,
// so a bad password or blocked network shows up as a crash instead of a weird
// bug later. The message leaves out url on purpose, since it has my password.
(async function testConnection() {
  try {
    await db.command({ ping: 1 });
    // No two accounts can share a Net ID, even if two people hit Create
    // Account at the same moment. Does nothing if the index already exists.
    await userCollection.createIndexes([{ key: { netId: 1 }, unique: true }]);
    console.log(`Connected to database at ${config.hostname}`);
  } catch (ex) {
    console.log(`Unable to connect to database because ${ex.message}`);
    process.exit(1);
  }
})();

// ---------- Users (credentials) ----------
// A user document looks like:
//   { netId, password (bcrypt hash), token (only while logged in), createdAt }

function getUser(netId) {
  return userCollection.findOne({ netId: netId });
}

// Who owns this login token. A missing token has to return null here: asking
// Mongo for { token: undefined } would match every logged out user, since
// their documents have no token at all.
function getUserByToken(token) {
  if (!token) {
    return null;
  }
  return userCollection.findOne({ token: token });
}

async function addUser(user) {
  await userCollection.insertOne(user);
}

// Changes just the fields sent, like { token } or { password }
async function updateUser(netId, changes) {
  await userCollection.updateOne({ netId: netId }, { $set: changes });
}

// Logout: removes the token field, so the cookie stops matching anyone
async function clearToken(netId) {
  await userCollection.updateOne({ netId: netId }, { $unset: { token: 1 } });
}

async function deleteUser(netId) {
  await userCollection.deleteOne({ netId: netId });
}

module.exports = {
  getUser,
  getUserByToken,
  addUser,
  updateUser,
  clearToken,
  deleteUser,
};
