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
    console.log(`Connected to database at ${config.hostname}`);
  } catch (ex) {
    console.log(`Unable to connect to database because ${ex.message}`);
    process.exit(1);
  }
})();

// Filled in starting in session 2, with functions like getUser for index.js
module.exports = {};
