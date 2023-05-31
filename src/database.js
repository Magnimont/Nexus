const { Database } = require("quickmongo");
const { mongoUri } = require('./settings.js');

const db = new Database(mongoUri);

db.connect().then(() => {
    console.log('[!]; Database ready');
});

module.exports = db;