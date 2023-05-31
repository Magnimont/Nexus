const db = require('../database.js');

module.exports = async (headers) => {
    const accounts = await db.get('accounts');
    const exists = accounts.find(a => a.user_token === headers.authorization);

    if (exists) return true;
    else return null;
};