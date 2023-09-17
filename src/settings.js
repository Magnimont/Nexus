require('dotenv').config({path: '../.env'});

if (!process.env.MONGODB){throw "You need to provide a MongoDB URI as environment variable."}

module.exports = {

    /* Nodemailer Email and password */
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    /* Mongodb connection string */
    mongoUri: process.env.MONGODB
};