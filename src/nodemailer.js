const mailer = require('nodemailer');
const { auth } = require('./settings.js');

const transporter = mailer.createTransport({
  host: 'smtp-mail.outlook.com',
  secureConnection: false,
  port: 587,
  tls: {
    ciphers: 'SSLv3',
  },
  auth: auth
});

module.exports = { mailer: transporter, auth: auth };