require('dotenv').config();
const db = require('./database.js');

const express = require('express');
const app = express();

const port = process.env.PORT || 3000;
const http = require('http');

const bp = require('body-parser');
app.use(express.static(__dirname + '/frontend'));

const cp = require('cookie-parser');
app.use(cp());

app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

const server = http.createServer(app);
const io = require('socket.io')(server);

app.set('view engine', 'ejs');
app.set('views', __dirname + '/frontend/ejs');

require('./handlers/routing.js')(app);
require('./handlers/api.js')(app);

db.on('ready', () => {
  server.listen(port, () => {

    console.log('server started');
    require('./handlers/socket.js')(io);

  });
});