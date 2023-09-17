  /***************************************************************************/
 /*  DO NOT CHANGE ANYTHING IN THIS FILE UNLESS YOU KNOW WHAT YOU'RE DOING  */
/***************************************************************************/

const { Database } = require("quickmongo");
const { mongoUri } = require('./settings.js');

const db = new Database(mongoUri);

db.connect().then(() => {
    console.log('[!]; Database Connected');
});

module.exports = db;