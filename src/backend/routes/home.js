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

/* Contributors */
router.get('/contributors', (req, res) => {
    res.render('contributors.ejs');
})

/* Privacy Policy */
router.get('/privacypolicy', (req, res) => {
    res.render('privacypolicy.ejs');
})

/* License */
router.get('/license', (req, res) => {
    res.render('license.ejs');
})

module.exports = {
    route: '/',
    router: router
};
