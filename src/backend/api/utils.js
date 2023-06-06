const express = require('express');
const db = require('../../database');

const router = express.Router();
const settings = require('../../settings.js');

/* Set secret cookie */
router.get('/cookie', (req, res) => {
    res.cookie('accesstoken', settings.ownerSecret, { sameSite: 'Strict', httpOnly: true });
    res.json({ done: true });
});

/* Get User's Info */
router.get('/load/:token', async (req, res) => {
    const authorized = (settings.ownerSecret === req.cookies.accesstoken);
    if (!authorized) res.status(401).json({ err: 'not authorized' });

    else {
        const accs = await db.get('accounts') || [];
        const exists = accs.find(a => a.user_token === req.params.token);

        if (exists) {
            const acc = await db.get(`user_${exists.user_id}`);
            const icon = await db.get(`icon_${exists.user_id}`);

            const allReqs = await db.get('pendingRequests') || [];
            const incoming = allReqs.filter(r => r.r === exists.user_id);

            const outgoing = allReqs.filter(r => r.s === exists.user_id);
            const requests = [...incoming, ...outgoing];

            const banner = await db.get(`banner_${exists.user_id}`);
            const friends = acc.friends || [];

            const friendsRes = [];
            for (x = 0; x < friends.length; x++) {

                const friend = await db.get(`user_${friends[x]}`);
                const icon = await db.get(`icon_${friends[x]}`);

                const banner = await db.get(`banner_${friends[x]}`);

                if (friend) friendsRes.push({ user_tag: friend.user_tag, icon: icon, banner: banner });
            };

            const userPfp = icon ? icon : 'https://i.pinimg.com/originals/1f/5a/30/1f5a309ca476474256c3a0049e3499fd.jpg';
            const userBanner = banner ? banner : 'https://th.bing.com/th/id/OIP.Ov3O4R-Kv-xvjZcJOtGnnAHaEK?pid=ImgDet&rs=1';

            res.status(200).json({
                friends: friendsRes, icon: userPfp, banner: userBanner, user_tag: acc.user_tag, reqs: requests, user_id: exists.user_id
            });
        } else res.status(404).send({ err: 'user does not exist' });
    }
});

/* Find user by ID */
router.get('/id/:id', async (req, res) => {
    const authorized = (settings.ownerSecret === req.cookies.accesstoken);
    if (!authorized) res.status(401).json({ err: 'not authorized' });

    else {
        const accs = await db.get('accounts') || [];
        const exists = accs.find(a => a.user_id == req.params.id);

        if (exists) {
            const icon = await db.get(`icon_${exists.user_id}`);
            const banner = await db.get(`banner_${exists.user_id}`);

            res.status(200).json({ user_tag: exists.user_tag, icon: icon, banner: banner });
        }
    }
});

/* Check if something's taken */
router.post('/taken', async (req, res) => {
    const authorized = (settings.ownerSecret === req.cookies.accesstoken);
    if (!authorized) res.status(401).json({ err: 'not authorized' });

    else {
        const accounts = await db.get('accounts') || [];
        const taken = accounts.find(a => a[req.body.key] === req.body.value);

        if (taken) res.json({ taken: true, id: taken.user_id });
        else res.json({ taken: null, id: taken?.user_id });
    }
});

/* Get user token */
router.get('/token/:id', async (req, res) => {
    const authorized = (settings.ownerSecret === req.cookies.accesstoken);
    if (!authorized) res.status(401).json({ err: 'not authorized' });

    else {
        const accounts = await db.get('accounts');
        const exists = accounts.find(a => a.email == req.params.id);

        if (exists) res.json({ token: exists.user_token });
        else res.json({ token: null });
    }
});

/* Verify a User */
router.post('/verify', async (req, res) => {
    const authorized = (settings.ownerSecret === req.cookies.accesstoken);
    if (!authorized) res.status(401).json({ err: 'not authorized' });

    else {
        const { auth } = require('../../settings.js');
        const { mailer } = require('../../nodemailer.js');
        
        await mailer.sendMail({
            from: `"NexCord", <${auth.user}>`,
            to: req.body.email,
            subject: 'Verify your account',
            html: `
      <h1>Greetings, ${req.body.username}!</h1>
      <p>Thank you for signing up. Your verification code is:</p>
      <h2>${req.body.code}</h2>
      <p>Please enter this code to verify your account. <b>If you did not request this code, you can safely ignore this email.</b></p>
      `
        });

        res.send({ done: true });
    }
});

/* Get user id by user tag */
router.get('/userid/:tag', async (req, res) => {
    const authorized = (settings.ownerSecret === req.cookies.accesstoken);
    if (!authorized) res.status(401).json({ err: 'not authorized' });

    else {
        const accounts = await db.get('accounts') || [];
        const found = accounts.find(a => a.user_tag === req.params.tag);

        res.status(200).json({ id: found?.user_id });
    }
})

module.exports = {
    route: '/api',
    router: router
};