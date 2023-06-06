require('dotenv').config();

module.exports = {

    /* Owner Secret, to do serious http requests (change this to your own) */
    ownerSecret: 'h8hjbsY8inCIncdk.Jvhanc8bji8k.i8uknfofMajd09x',

    /* Nodemailer Email and password */
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    /* Mongodb connection string (change this to your own) */
    mongoUri: 'mongodb+srv://grvhxckz:grviscool@dcord.hg1icc2.mongodb.net/?retryWrites=true&w=majority'
};