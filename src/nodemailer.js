const mailer = require('nodemailer');
const { auth } = require('./settings.js');

/* SMTP settings for the app to be able to send mails */
const transporter = mailer.createTransport({
  host: 'smtp-mail.outlook.com', // change if needed
  secureConnection: false, // change accordingly to the host
  port: 587, // change accordingly to the host
  tls: {
    ciphers: 'SSLv3',
  },
  auth: auth
});

module.exports = { mailer: transporter, auth: auth };