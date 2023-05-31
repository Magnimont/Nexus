require('dotenv').config();

module.exports = {

    /* Owner Secret, to do serious http requests */
    ownerSecret: 'h8hjbsY8inCIncdk.Jvhanc8bji8k.i8uknfofMajd09x',

    /* Nodemailer Email and password */
    auth: {
        user: process.env.user,
        pass: process.env.pass
    },

    /* Mongodb connection string */
    mongoUri: 'mongodb+srv://grvhxckz:grviscool@dcord.hg1icc2.mongodb.net/?retryWrites=true&w=majority'
};