module.exports = (io) => {
    const chat = io.of('/chat');

    chat.on('connection', async (socket) => {
        const friendTag = socket.handshake.query.friend;
        const selfTag = socket.handshake.query.self;

        socket.emit('dmLoad', await getDMs(selfTag, friendTag));

        socket.on('msgSave', async (data, cf) => {
            const msg = await saveMessage(data);
            io.of('/chat').emit('msgReceive', msg, cf);
        });
    });

    const account = io.of('/account');

    account.on('connection', async (socket) => {
        const token = socket.handshake.query.token;

        const accounts = await db.get('accounts') || [];
        const user = accounts.find(a => a.user_token === token);

        const account = await db.get(`user_${user.user_id}`);
        socket.emit('loadInfo', account);

        socket.on('change', async data => {

            const accounts = await db.get('accounts') || [];
            const existing = accounts.find(a => a.user_token === data.token);

            const account = await db.get(`user_${existing.user_id}`);
            accounts.filter(a => a.user_token === data.token);

            existing[data.key] = data.value;
            account[data.key] = data.value;

            accounts.push(existing);
            await db.set('accounts', accounts);

            await db.set(`user_${existing.user_id}`, account);
        })
    });
};

const db = require('../database.js');

async function getDMs(self, friend) {
    const accounts = await db.get('accounts');

    const me = accounts.find(a => a.user_tag === self);
    const you = accounts.find(a => a.user_tag === friend);

    const myMsgs = await db.get(`messages_${me.user_id}`) || [];
    const urMsgs = await db.get(`messages_${you.user_id}`) || [];

    const myMsgsArr = myMsgs.filter(m => m.to === you.user_id);
    const urMsgsArr = urMsgs.filter(m => m.to === me.user_id);

    const allMsgs = [...myMsgsArr, ...urMsgsArr];
    allMsgs.sort((x, y) => { return x.sent_at - y.sent_at });

    return allMsgs;
}

async function saveMessage(data) {
    const accounts = await db.get('accounts');

    const sender = accounts.find(a => a.user_tag === data.from);
    const receiver = accounts.find(a => a.user_tag === data.to);

    const msg = { from: sender.user_id, to: receiver.user_id, sent_at: data.sent_at, text: data.text };
    await db.push(`messages_${sender.user_id}`, msg);

    return msg;
}