  /***************************************************************************/
 /*  DO NOT CHANGE ANYTHING IN THIS FILE UNLESS YOU KNOW WHAT YOU'RE DOING  */
/***************************************************************************/

require('dotenv').config();
const mailer = require('nodemailer');
const { auth } = require('./settings.js');

/* SMTP settings for the app to be able to send mails */
const transporter = mailer.createTransport({
  host: process.env.SMTP_HOST,
  secureConnection: (process.env.SMTP_PORT !== '587'),
  port: process.env.SMTP_PORT,
  tls: {
    ciphers: 'SSLv3',
  },
  auth: auth
});

module.exports = { mailer: transporter, auth: auth };