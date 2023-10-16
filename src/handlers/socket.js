const db = require('../database.js');
const {mailer} = require("../nodemailer");
const {auth} = require("../settings");

module.exports = (io) => {

    /* App Events */
    const app = io.of('/app');

    app.on('connection', async socket => {

        const token = socket.handshake.query.token;
        const acc = await loadAccount(`${token}`);

        // MTY4NTEwNjQ4ODcxNg.Mi44Mzk1ODM4Nzg4NTAzMTU2ZSsyNA.Mi44Mzk1ODM4Nzg4NDg2MzA0ZSsyNA

        if (acc) socket.emit('load', acc);
        else socket.emit('load', {err: true});

        socket.on('friendAdd', async details => {
            const res = await friendAdd(details.from, details.to);

            if (res.type === 1) app.emit('friendsListUpdate', res);
            else app.emit('friendsReqListUpdate', res);
        });

        socket.on('friendRemove', async details => {
            const res = await friendRemove(details.from, details.to);

            if (res.type === 1) app.emit('friendsListUpdate', res);
            else app.emit('friendsReqListUpdate', res);
        });

        const tokens = [];

        socket.on('joined', async token => {

            if (!tokens.includes(token)) {
                await updatePresence(token);

                tokens.push(token);

                setInterval(async () => {
                    const presence = await checkPresence(token);

                    io.of('/app').emit('userPresenceUpdate', presence);
                }, 10000);
            }
        });
    });


    const chat = io.of('/chat');

    chat.on('connection', async socket => {

        socket.on('loadRequest', async data => {
            socket.emit('load', await getDMs(data.self, data.friend));
        });

        socket.on('requestMessages1', async data => {
            socket.emit('requestMessages2', await getDMs(data.self, data.friend));
        })

        socket.on('msgSave', async (data, cf) => {
            // data = { from: user_tag, to: currentFriend, sent_at: (edit ? edit : messageId), text: msgInput.value, reference: ref };
            if (data?.reference === null) {
                const sender = (await db.get('accounts')).find(a => a.user_tag === data.from);
                const messages = await db.get(`messages_${sender.user_id}`) || [];
                const edited_msg = messages.find(m => m.sent_at === data.sent_at);
                if (edited_msg?.reference !== null) {
                    data.reference = edited_msg?.reference || null;
                }
            }
            io.of('/chat').emit('msgReceive', data);
            await saveMessage(data);
        });

        socket.on('delete', async msg => {

            const msgID = msg.id;
            chat.emit('msgDelete', msg);

            const accounts = await db.get('accounts');
            const sender = accounts.find(a => a.user_tag === msg.by);

            const msgs = await db.get(`messages_${sender.user_id}`);
            const updated = msgs.filter(m => m.sent_at !== parseInt(msgID));

            await db.set(`messages_${sender.user_id}`, updated);
        })
    });

    const account = io.of('/account');

    account.on('connection', async (socket) => {
        const token = socket.handshake.query.token;

        const accounts = await db.get('accounts') || [];
        const user = accounts.find(a => a.user_token === token) || {};

        const account = await db.get(`user_${user.user_id}`);
        socket.emit('loadInfo', account);

        socket.on('change', async data => {

            const accounts = await db.get('accounts') || [];
            const existing = accounts.find(a => a.user_token === data.token);

            const account = await db.get(`user_${existing.user_id}`);
            const updated = accounts.filter(a => a.user_token !== data.token);

            existing[data.key] = data.value;
            account[data.key] = data.value;

            if (data.key === 'password'){
                const newToken = genUserToken({created_at: existing.created_at});
                existing['user_token'] = newToken;
                account['user_token'] = newToken;
                await mailer.sendMail({
                    from: `"Nexus" <${auth.user}>`,
                    to: existing.email,
                    subject: 'Password changed',
                    html: `
      <img src="https://cdn.discordapp.com/attachments/841712516685234186/1115681395117916293/nexus-logo.png" alt="logo" width="100px" height="100px">
      <h1>Greetings, ${existing.user_tag}!</h1>
      <p>Your password has been successfully changed.</p>
      <p><b>If you did not change your password, contact Nexus support as soon as possible!</b></p>
      <br />
      <footer>This mail was sent by <a href="${process.env.URL || ''}">Nexus</a></footer>
      `
                });
            }

            updated.push(existing);

            await db.set('accounts', updated);
            await db.set(`user_${existing.user_id}`, account);
        });

        socket.on('create', async data => {
            const accounts = await db.get('accounts') || [];
            const exists = accounts.find(a => a.user_tag === data.user_tag);

            if (exists) socket.emit('error', {err: 'The name is already taken'});
            else if (exists && exists.email === req.body.email) socket.emit('error', {err: 'The email is taken'});

            else {
                const token = genUserToken(data);
                const id = data.created_at;

                const acc = data;
                const object = {
                    user_tag: acc.user_tag,
                    email: acc.email,
                    password: acc.password,
                    user_id: acc.created_at,
                    user_token: token
                }

                object.user_token = token;
                await db.push('accounts', object);

                await db.set(`icon_${id}`, `https://api.dicebear.com/6.x/fun-emoji/png?seed=${acc.user_tag}`);
                await db.set(`banner_${id}`, 'https://th.bing.com/th/id/OIP.Ov3O4R-Kv-xvjZcJOtGnnAHaEK?pid=ImgDet&rs=1');

                object.friends = [];
                object.dms = [];

                await db.set(`user_${id}`, object);
                socket.emit('success', {created: true, token: object.user_token});
            }
        });

        socket.on('verify', async data => {
            try {
                function mailCallback(...args) {
                    socket.emit('signup-error', ...args);
                }

                await mailer.sendMail({
                    from: `"Nexus" <${auth.user}>`,
                    to: data.email,
                    subject: 'Verify your account',
                    html: `
      <img src="https://cdn.discordapp.com/attachments/841712516685234186/1115681395117916293/nexus-logo.png" alt="logo" width="100px" height="100px">
      <h1>Greetings, ${data.username}!</h1>
      <p>Thank you for signing up. Your verification code is:</p>
      <h2>${data.code}</h2>
      <p>Please enter this code to verify your account. <b>If you did not request this code, you can safely ignore this email.</b></p>
      <footer>This mail was sent by <a href="${process.env.URL || ''}">Nexus</a></footer>
      `
                }, mailCallback);
            } catch (e) {
                console.log(e);
                socket.emit('signup-error', {err: e.message});
            }
        });

        // TODO: test socket endpoint for 2FA
        socket.on('2fa', async data => {
            if (data.method === 'email') {
                try {
                    function mailCallback(...args) {
                        socket.emit('2fa-error', ...args);
                    }

                    await mailer.sendMail({
                        from: `"Nexus" <${auth.user}>`,
                        to: data.email,
                        subject: '2FA Login Code',
                        html: `
                          <img src="https://cdn.discordapp.com/attachments/841712516685234186/1115681395117916293/nexus-logo.png" alt="logo" width="100px" height="100px">
                          <h1>Greetings, ${data.username}!</h1>
                          <p>Someone is trying to log in on your account. If this is you, here is the one-time code to login:</p>
                          <h2>${data.code}</h2>
                          <p>Please enter this code to log in to account. <b>If you did not request this code, change your password!</b></p>
                          <footer>This mail was sent by <a href="${process.env.URL || ''}">Nexus</a></footer>
                        `
                    }, mailCallback);
                } catch (e) {
                    console.log(e);
                    socket.emit('2fa-error', {err: e.message});
                }
            }
            else {
                socket.emit('2fa-error', {err: `"${data.type}" is not a valid 2FA type.`})
            }
        });

        socket.on('forgotPass', async data => {
            const users = await db.get('accounts') || []
            const user = users.find(a => a.email === data.email);

            await mailer.sendMail({
                from: `"Nexus" <${auth.user}>`,
                to: data.email,
                subject: 'Forgot your password?',
                html: `
                <body>
                    <img src="https://cdn.discordapp.com/attachments/841712516685234186/1115681395117916293/nexus-logo.png" alt="logo" width="100px" height="100px">
                    <h1>Hello, ${user.user_tag}!</h1>
                    <p>It seems like you forgot your account password. Don't worry, here's your password:</p>
                    <h4>${user.password}</h4>
                    <p>Now you can log in to your account <b>If you meant to reset your password, you can do so on the settings page.</b></p>
                    <footer>This mail was sent by <a href="${process.env.URL || ''}">Nexus</a></footer>
                </body>
                `
            });
        });

        socket.on('tokenOf', async email => {
            const accounts = await db.get('accounts') || [];
            const exists = accounts.find(a => a.email === email);

            exists ? socket.emit('token', exists.user_token) : socket.emit('token', null);
        });

        socket.on('get2fa', async email => {
            const accounts = await db.get('accounts') || [];
            let exists;
            if (email === null || email === undefined){
                exists = accounts.find(a => a.token === token);
            }
            else {
                exists = accounts.find(a => a.email === email);
            }

            exists ? socket.emit('get2fareturn', {enabled: exists.twofa_enabled, method: exists.twofa_method, user_tag: exists.user_tag}) : socket.emit('get2fareturn', {enabled: false, method: null, user_tag: null});
        });

        socket.on('edit', async data => {

            const accounts = await db.get('accounts');

        });


    });
};

async function getDMs(self, friend) {
    const accounts = await db.get('accounts');

    const me = accounts.find(a => a.user_tag === self);
    const you = accounts.find(a => a.user_tag === friend);

    const myMsgs = await db.get(`messages_${me.user_id}`) || [];
    const urMsgs = await db.get(`messages_${you.user_id}`) || [];

    const myMsgsArr = myMsgs.filter(m => m.to === you.user_id);
    const urMsgsArr = urMsgs.filter(m => m.to === me.user_id);

    const allMsgs = [...myMsgsArr, ...urMsgsArr];
    allMsgs.sort((x, y) => {
        return x.sent_at - y.sent_at
    });

    return allMsgs;
}

async function saveMessage(data) {
    const accounts = await db.get('accounts');

    const sender = accounts.find(a => a.user_tag === data.from);
    const receiver = accounts.find(a => a.user_tag === data.to);

    const messages = await db.get(`messages_${sender.user_id}`) || [];

    const exists = messages.find(m => m.sent_at == data.sent_at);
    if (exists) await db.set(`messages_${sender.user_id}`, messages.filter(m => m.sent_at != data.sent_at));

    const msg = {
        from: sender.user_id,
        to: receiver.user_id,
        sent_at: data.sent_at,
        text: data.text,
        reference: data.reference
    };
    await db.push(`messages_${sender.user_id}`, msg);

    const me = await db.get(`user_${sender.user_id}`);
    const you = await db.get(`user_${receiver.user_id}`);

    const myDMs = (me.dms || []).filter(a => a !== receiver.user_id);
    const urDMs = (you.dms || []).filter(a => a !== sender.user_id);

    me.dms = [receiver.user_id, ...myDMs];
    you.dms = [sender.user_id, ...urDMs];

    await db.set(`user_${sender.user_id}`, me);
    await db.set(`user_${receiver.user_id}`, you);

    return msg;
}

async function loadAccount(token) {
    const accs = await db.get('accounts') || [];
    const exists = accs.find(a => a.user_token === token);

    if (exists) {
        const acc = await db.get(`user_${exists.user_id}`);
        const icon = await db.get(`icon_${exists.user_id}`);

        const allReqs = await db.get('pendingRequests') || [];
        const incoming = allReqs.filter(r => r.r === exists.user_id);

        const outgoing = allReqs.filter(r => r.s === exists.user_id);
        const requests = [...incoming, ...outgoing];

        const banner = await db.get(`banner_${exists.user_id}`);
        const friends = acc.friends || [];

        const dms = acc.dms || [];

        const friendsRes = [];
        for (x = 0; x < friends.length; x++) {

            const friend = await db.get(`user_${friends[x]}`);
            const icon = await db.get(`icon_${friends[x]}`);

            const banner = await db.get(`banner_${friends[x]}`);

            if (friend) friendsRes.push({user_tag: friend.user_tag, icon: icon, banner: banner});
        }


        const dmsRes = [];
        for (x = 0; x < dms.length; x++) {

            const dm = await db.get(`user_${dms[x]}`);
            const icon = await db.get(`icon_${dms[x]}`);

            const banner = await db.get(`banner_${dms[x]}`);

            if (dm) dmsRes.push({user_tag: dm.user_tag, icon: icon, banner: banner});
        }

        const userPfp = icon ? icon : 'https://i.pinimg.com/originals/1f/5a/30/1f5a309ca476474256c3a0049e3499fd.jpg';
        const userBanner = banner ? banner : 'https://th.bing.com/th/id/OIP.Ov3O4R-Kv-xvjZcJOtGnnAHaEK?pid=ImgDet&rs=1';

        return ({
            friends: friendsRes,
            icon: userPfp,
            banner: userBanner,
            user_tag: acc.user_tag,
            reqs: requests,
            user_id: exists.user_id,
            dms: dmsRes
        });

    } else return null;
}

async function friendAdd(token, tag) {
    let pendingReqs = await db.get('pendingRequests') || [];

    const sender = (await db.get('accounts') || []).find(a => a.user_token === token);
    const receiver = (await db.get('accounts') || []).find(a => a.user_tag === tag);

    const existingRequest = pendingReqs.find(
        r =>
            (r.s === sender.user_id && r.r === receiver.user_id) ||
            (r.s === receiver.user_id && r.r === sender.user_id)
    );

    const senderAcc = await db.get(`user_${sender.user_id}`);
    const receiverAcc = await db.get(`user_${receiver.user_id}`);

    if (existingRequest) {
        pendingReqs = pendingReqs.filter(r => r !== existingRequest);
        await db.set('pendingRequests', pendingReqs);

        const senderFriends = await db.get(`user_${sender.user_id}.friends`) || [];
        const receiverFriends = await db.get(`user_${receiver.user_id}.friends`) || [];

        senderFriends.push(receiver.user_id);
        receiverFriends.push(sender.user_id);

        senderAcc.friends = senderFriends;
        receiverAcc.friends = receiverFriends;

        const sFriends = [];
        const rFriends = [];

        await db.set(`user_${sender.user_id}`, senderAcc);
        await db.set(`user_${receiver.user_id}`, receiverAcc);

        for (const f of senderAcc.friends) {
            const acc = await db.get(`user_${f}`);

            const banner = await db.get(`banner_${f}`);
            const icon = await db.get(`icon_${f}`);

            sFriends.push({user_tag: acc.user_tag, banner: banner, icon: icon});
        }


        for (const f of receiverAcc.friends) {
            const acc = await db.get(`user_${f}`);

            const banner = await db.get(`banner_${f}`);
            const icon = await db.get(`icon_${f}`);

            rFriends.push({user_tag: acc.user_tag, banner: banner, icon: icon});
        }


        return {
            type: 1, from: sender.user_tag, to: receiver.user_tag,
            for: [senderAcc.user_token, receiverAcc.user_token],
            friends: {
                [senderAcc.user_id]: sFriends,
                [receiverAcc.user_id]: rFriends
            }
        };
    } else {

        pendingReqs.push({s: sender.user_id, r: receiver.user_id});
        await db.set('pendingRequests', pendingReqs);

        return {
            type: 0, from: sender.user_tag, to: receiver.user_tag,

            for: [senderAcc.user_token, receiverAcc.user_token],
            reqs: {
                req: {s: sender.user_id, r: receiver.user_id},
                del: false
            }
        };
    }
}

async function friendRemove(token, tag) {
    const accounts = await db.get('accounts') || [];
    let pendingReqs = await db.get('pendingRequests') || [];

    const sender = accounts.find(a => a.user_token === token);
    const receiver = accounts.find(a => a.user_tag === tag);

    const existingRequest = pendingReqs.find(
        r =>
            (r.s === sender.user_id && r.r === receiver.user_id) ||
            (r.s === receiver.user_id && r.r === sender.user_id)
    );

    const senderAcc = await db.get(`user_${sender.user_id}`);
    const receiverAcc = await db.get(`user_${receiver.user_id}`);

    if (existingRequest) {

        pendingReqs = pendingReqs.filter(r => r !== existingRequest);
        await db.set('pendingRequests', pendingReqs);

        return {
            type: 0, from: sender.user_tag, to: receiver.user_tag,
            for: [senderAcc.user_token, receiverAcc.user_token],
            reqs: {
                req: {s: sender.user_id, r: receiver.user_id},
                del: true
            }
        };

    } else {
        const senderFriends = await db.get(`user_${sender.user_id}`)?.friends || [];
        const receiverFriends = await db.get(`user_${receiver.user_id}`)?.friends || [];

        const updatedSenderFriends = senderFriends.filter(friend => friend !== receiver.user_id);
        const updatedReceiverFriends = receiverFriends.filter(friend => friend !== sender.user_id);

        senderAcc.friends = updatedSenderFriends;
        receiverAcc.friends = updatedReceiverFriends;

        const sFriends = [];
        const rFriends = [];

        await db.set(`user_${sender.user_id}`, senderAcc);
        await db.set(`user_${receiver.user_id}`, receiverAcc);

        for (const f of senderAcc.friends) {
            const acc = await db.get(`user_${f}`);

            const banner = await db.get(`banner_${f}`);
            const icon = await db.get(`icon_${f}`);

            sFriends.push({user_tag: acc.user_tag, banner: banner, icon: icon});
        }


        for (const f of receiverAcc.friends) {
            const acc = await db.get(`user_${f}`);

            const banner = await db.get(`banner_${f}`);
            const icon = await db.get(`icon_${f}`);

            rFriends.push({user_tag: acc.user_tag, banner: banner, icon: icon});
        }


        return {
            type: 1, from: sender.user_tag, to: receiver.user_tag,
            for: [senderAcc.user_token, receiverAcc.user_token],
            friends: {
                [senderAcc.user_id]: sFriends,
                [receiverAcc.user_id]: rFriends
            }
        };
    }
}

async function updatePresence(token) {
    const accounts = await db.get('accounts');
    const user = accounts.find(a => a.user_token === token);

    const status = await db.get(`status_${user.user_id}`);

    if (status !== true) {
        await db.set(`status_${user.user_id}`, true);

        setTimeout(async () => {
            await db.set(`status_${user.user_id}`, false);
        }, 10000);
    }
}

async function checkPresence(token) {
    const accounts = await db.get('accounts');
    const account = accounts.find(a => a.user_token === token);
    if (account) {
        const user = await db.get(`status_${account.user_id}`);
        return {user_tag: account.user_tag, online: user};
    } else {
        return {user_tag: null, online: null};
    }
}

function genUserToken(body) {
    const createdAt = body.created_at;
    const timeNow = Date.now();

    const combinedTime = createdAt * timeNow;

    const eCreatedAt = Buffer.from(`${createdAt}`).toString('base64');
    const eCreds = Buffer.from(`${combinedTime}`).toString('base64');

    const eRandomStuff = Buffer.from(`${combinedTime - createdAt}`).toString('base64');
    const token = `${eCreatedAt}.${eCreds}.${eRandomStuff}`.replace(/=/g, '');

    return token;
}