require('dotenv').config();

if (!process.env.MONGODB){
    throw "You need to provide a mongodb URI as `MONGODB` environment variable";
}

module.exports = {

    /* Owner Secret, to do serious http requests */
    ownerSecret: process.env.OWNERSECRET,

    /* Nodemailer Email and password */
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    /* Mongodb connection string */
    mongoUri: process.env.MONGODB
};