const express = require('express');
const router = express.Router();

/* Home */
router.get('/', (req, res) => {
  res.render('home.ejs');
});

/* Login */
router.get('/login', (req, res) => {
  res.render('login.ejs');
});

module.exports = {
    route: '/',
    router: router
};