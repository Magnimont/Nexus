  /***************************************************************************/
 /*  DO NOT CHANGE ANYTHING IN THIS FILE UNLESS YOU KNOW WHAT YOU'RE DOING  */
/***************************************************************************/

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

/* The custom 404 page */
app.get('*', function (req, res){
  res.status(404);
  if (req.accepts('html')) {
    res.render('404.ejs', {url: req.url});
    return;
  }
  if (req.accepts('json')) {
    res.json({error: 'Not found', status_code: 404});
    return;
  }
  res.type('txt').send('404 - Not Found');
});

db.on('ready', () => {
  server.listen(port, () => {

    const _address = `${server.address()['address']}:${server.address()["port"]} (${server.address()["family"]})`;
    console.log('server started: http://localhost:' + server.address()["port"].toString());
    console.log('listening to: ', _address);
    require('./handlers/socket.js')(io);

  });
});