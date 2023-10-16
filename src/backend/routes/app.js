const express = require('express');
const router = express.Router();

/* App */
router.get('/', (req, res) => {
    res.render('app.ejs');
});

/* Alerts */
router.get('/alerts', (req, res) => {
    res.render('alerts.ejs'); // TODO: implement alerts.ejs
});

/* Settings */
router.get('/settings', (req, res) => {
    res.render('settings.ejs');
});

module.exports = {
    route: '/app',
    router: router
};