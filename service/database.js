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
    // Every assignment lookup filters by whose it is, so index that too
    await assignmentCollection.createIndexes([{ key: { netId: 1 } }]);
    // One settings document per person
    await settingsCollection.createIndexes([{ key: { netId: 1 }, unique: true }]);
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

// ---------- Assignments (application data) ----------
// One document per assignment, tagged with whose it is:
//   { netId, id, title, classCode, classKey, due, done, doneAt, myHours, myNote, ... }

// The frontend never sees Mongo's _id or the netId tag, so the list looks
// exactly like it did before the database
const hideDbFields = { projection: { _id: 0, netId: 0 } };

function getAssignments(netId) {
  return assignmentCollection.find({ netId: netId }, hideDbFields).toArray();
}

// Replaces my whole list: delete what I had, then insert the new list.
// Anything the browser sent as _id or netId is dropped, so nobody can save
// assignments under someone else's Net ID.
async function saveAssignments(netId, list) {
  await assignmentCollection.deleteMany({ netId: netId });
  if (list.length > 0) {
    const docs = list.map(({ _id, netId: ignored, ...assignment }) => ({ ...assignment, netId: netId }));
    await assignmentCollection.insertMany(docs);
  }
}

async function deleteAssignments(netId) {
  await assignmentCollection.deleteMany({ netId: netId });
}

// Everyone else's finished assignments that have hours, for the class times.
// $ne means "not equal": not mine, and myHours isn't null or missing.
function getClassTimes(netId) {
  return assignmentCollection
    .find(
      { netId: { $ne: netId }, done: true, myHours: { $ne: null } },
      { projection: { _id: 0, id: 1, myHours: 1 } }
    )
    .toArray();
}

// Everyone except me who has this assignment in their list, so the server
// knows whose sockets to tell when I log hours on it. distinct gives each
// Net ID once, even if somehow they had it twice.
function getOwners(assignmentId, exceptNetId) {
  return assignmentCollection.distinct('netId', { id: assignmentId, netId: { $ne: exceptNetId } });
}

// ---------- Settings (application data) ----------
// One document per person: { netId, icalUrl, canvasSync: { syncedAt, classes } }

// My settings, or {} if I haven't saved any yet
async function getSettings(netId) {
  const settings = await settingsCollection.findOne({ netId: netId }, hideDbFields);
  return settings || {};
}

// Saves just the fields sent and leaves the rest alone. upsert means "insert
// if there's no document yet", so the first save creates it.
async function updateSettings(netId, changes) {
  const { _id, netId: ignored, ...fields } = changes;
  if (Object.keys(fields).length > 0) {
    await settingsCollection.updateOne({ netId: netId }, { $set: fields }, { upsert: true });
  }
  return getSettings(netId);
}

async function deleteSettings(netId) {
  await settingsCollection.deleteOne({ netId: netId });
}

module.exports = {
  getUser,
  getUserByToken,
  addUser,
  updateUser,
  clearToken,
  deleteUser,
  getAssignments,
  saveAssignments,
  deleteAssignments,
  getClassTimes,
  getOwners,
  getSettings,
  updateSettings,
  deleteSettings,
};
