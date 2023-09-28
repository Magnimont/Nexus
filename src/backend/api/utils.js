const express = require('express');
const db = require('../../database');

const router = express.Router();
const settings = require('../../settings.js');

/* Find user by ID */
router.get('/id/:id', async (req, res) => {
    const accs = await db.get('accounts') || [];
    const exists = accs.find(a => a.user_id == req.params.id);

    if (exists) {
        const icon = await db.get(`icon_${exists.user_id}`);
        const banner = await db.get(`banner_${exists.user_id}`);

        res.status(200).json({ user_tag: exists.user_tag, icon: icon, banner: banner });
    }
});

/* Check if something's taken */
router.post('/taken', async (req, res) => {
    const accounts = await db.get('accounts') || [];
    const taken = accounts.find(a => a[req.body.key] === req.body.value);

    if (taken) res.json({ taken: true, id: taken.user_id });
    else {
        if (req.body.key === 'user_tag' && /[^a-zA-Z0-9]/.test(req.body.value)) res.json({ taken: true });
        else res.json({ taken: false, id: taken?.user_id });
    }
});

/* Get user id by user tag */
router.get('/userid/:tag', async (req, res) => {
    const accounts = await db.get('accounts') || [];
    const found = accounts.find(a => a.user_tag === req.params.tag);

    res.status(200).json({ id: found?.user_id });
})

module.exports = {
    route: '/api',
    router: router
};