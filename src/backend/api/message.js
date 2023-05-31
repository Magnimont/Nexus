const express = require('express');
const router = express.Router();

/* Create a message */
router.post('/', async (req, res) => {
    const authorized = await authCheck(req.headers);
    if (!authorized) res.status(401).json({ err: 'not authorized' });

    else {
        const accounts = await db.get('accounts');
        const exists = accounts.find(a => a.user_token === req.headers.token);

        const messages = await db.get(`msgs_${exists.user_id}`) || [];
        messages.push(req.body.message);

        await db.set(`msgs_${exists.user_id}`, messages);
        res.status(200).json({ done: true });
    }
});

/* Get messages */
router.get('/', async (req, res) => {
    const authorized = (process.env.ownerAuth === req.cookies.ownerOnly);
    if (!authorized) res.status(401).json({ err: 'not authorized' });

    else {
        const accounts = await db.get('accounts');

        const sender = accounts.find(a => a.user_tag === req.body.from);
        const receiver = accounts.find(a => a.user_tag === req.body.to);

        const from = await db.get(`msgs_${sender.user_id}`) || [];
        const to = await db.get(`msgs_${receiver.user_id}`) || [];

        const myMsgs = filterMsgs(from, sender.user_id, receiver.user_id);
        const urMsgs = filterMsgs(to, receiver.user_id, sender.user_id);

        res.status(200).json({ messages: [...myMsgs, ...urMsgs] });
    }
});

function filterMsgs(arr, from, to) {
    const output = [];

    for (x = 0; x < arr.length; x++) {
        const msg = arr[x];
        if (msg.from === from && msg.to === to) output.push(msg);
    };

    return output;
}

module.exports = {
    route: '/api/messages',
    router: router
};