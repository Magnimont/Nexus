const express = require('express');
const router = express.Router();

const db = require('../../database.js');
const authCheck = require('../../handlers/requests.js');

const multer = require('multer');
const upload = multer();

const settings = require('../../settings.js');
const { ownerSecret } = settings;

/* Create an account */
router.post('/', async (req, res) => {
  const authorized = (ownerSecret === req.cookies.accesstoken);
  if (!authorized) res.status(401).json({ err: 'not authorized' });

  else {
    const accounts = await db.get('accounts') || [];
    const exists = accounts.find(a => a.user_tag === req.body.user_tag);

    if (exists) res.status(409).json({ err: 'The name is already taken' });
    else if (exists && exists.email === req.body.email) res.status(409).json({ err: 'The email is taken' });

    else {
      const token = genUserToken(req.body);
      const id = req.body.created_at;

      const acc = req.body;
      const object = { user_tag: acc.user_tag, email: acc.email, email: acc.email, password: acc.password, user_id: acc.created_at, user_token: token }

      object.user_token = token;
      await db.push('accounts', object);

      await db.set(`icon_${id}`, 'https://i.pinimg.com/originals/1f/5a/30/1f5a309ca476474256c3a0049e3499fd.jpg');
      await db.set(`banner_${id}`, 'https://th.bing.com/th/id/OIP.Ov3O4R-Kv-xvjZcJOtGnnAHaEK?pid=ImgDet&rs=1');

      object.friends = [];
      object.requests = [];

      await db.set(`user_${id}`, object);
      res.status(200).json({ created: true, token: object.user_token });
    }
  }
});

/* Get an account */
router.get('/:tag', async (req, res) => {
  const authorized = await authCheck(req.headers);
  if (!authorized) res.status(401).json({ err: 'not authorized' });

  else {
    const accounts = await db.get('accounts');
    const exists = accounts.find(a => a.user_tag === req.params.tag);

    if (exists) {
      const account = await db.get(`user_${exists.user_id}`);
      const icon = await db.get(`icon_${id}`) || 'https://i.pinimg.com/originals/1f/5a/30/1f5a309ca476474256c3a0049e3499fd.jpg';

      const banner = await db.get(`banner_${id}`) || 'https://th.bing.com/th/id/OIP.Ov3O4R-Kv-xvjZcJOtGnnAHaEK?pid=ImgDet&rs=1';
      res.status(200).json({ user_tag: account.user_tag, icon: icon, banner: banner });

    } else res.status(404).json({ err: 'not found' });
  }
});

/* Update an account */
router.post('/:tag/update', async (req, res) => {
  const authorized = await authCheck(req.headers);
  if (!authorized) res.status(401).json({ err: 'not authorized' });

  else {
    const accounts = await db.get('accounts');
    const found = accounts.find(a => a.user_token === req.headers.authorization);

    const account = await db.get(`user_${found.user_id}`);
    const changes = req.body.changes;

    for (x = 0; x < changes.length; x++) {
      const { key, value } = changes[x];
      account[key] = value;
    };

    await db.set(`user_${found.user_id}`, account);
    const filtered = accounts.filter(a => a.user_tag !== found.user_tag);

    found.user_tag = account.user_tag;
    filtered.push(found);
    
    await db.set('accounts', filtered);
    res.status(201).json({ updated: true });
  }
});

/* Add Friend Requests */
router.post('/friendship', async (req, res) => {
  const authorized = (ownerSecret === req.cookies.accesstoken);
  if (!authorized) res.status(401).json({ err: 'not authorized' });
  else {
    const accounts = await db.get('accounts') || [];
    let pendingReqs = await db.get('pendingRequests') || [];

    const sender = accounts.find(a => a.user_token === req.headers.authorization);
    const receiver = accounts.find(a => a.user_tag === req.body.to);

    const existingRequest = pendingReqs.find(r => r.s === sender.user_id && r.r === receiver.user_id)
      || pendingReqs.find(r => r.s === receiver.user_id && r.r === sender.user_id);

    if (existingRequest) {
      pendingReqs = pendingReqs.filter(r => r !== existingRequest);
      await db.set('pendingRequests', pendingReqs);

      await db.push(`user_${sender.user_id}.friends`, receiver.user_id);
      await db.push(`user_${receiver.user_id}.friends`, sender.user_id);
    } else {
      pendingReqs.push({ s: sender.user_id, r: receiver.user_id });
      await db.set('pendingRequests', pendingReqs);
    }
  }
});


/* Remove Friend Requests */
router.delete('/friendship', async (req, res) => {
  const authorized = (ownerSecret === req.cookies.accesstoken);
  if (!authorized) res.status(401).json({ err: 'not authorized' });
  else {
    const accounts = await db.get('accounts') || [];
    let pendingReqs = await db.get('pendingRequests') || [];

    const sender = accounts.find(a => a.user_token === req.headers.authorization);
    const receiver = accounts.find(a => a.user_tag === req.body.to);

    const existingRequest = pendingReqs.find(r => r.s === sender.user_id && r.r === receiver.user_id)
      || pendingReqs.find(r => r.s === receiver.user_id && r.r === sender.user_id);

    if (existingRequest) {
      pendingReqs = pendingReqs.filter(r => r !== existingRequest);
      await db.set('pendingRequests', pendingReqs);
    } else {
      await db.pull(`user_${sender.user_id}.friends`, receiver.user_id);
      await db.pull(`user_${receiver.user_id}.friends`, sender.user_id);
    }
  }
});

/* Edit Profile Images */
router.post('/img/:tag/:image', upload.single('image'), async (req, res) => {
  const authorized = await authCheck(req.headers);
  if (!authorized) res.status(401).json({ err: 'not authorized' });

  else {
    const users = await db.get('accounts');
    const user = users.find(u => u.user_token === req.headers.authorization);

    const file = req.file.buffer;
    const type = req.params.image;

    await db.set(`${type}_${user.user_id}`, file);
    res.status(200).send({ done: true });
  }
});

/* Get Profile Images */
router.get('/img/:tag/:image', async (req, res) => {
  const authorized = await authCheck(req.headers);
  if (!authorized) res.status(401).json({ err: 'not authorized' });

  else {
    const users = await db.get('accounts');
    const user = users.find(u => u.user_token === req.headers.authorization);

    const type = req.params.image;
    const data = await db.get(`${type}_${user.user_id}`);

    const file = data ? `data:image/png;base64,${data}` : null;
    res.send(file);
  }
});

/* Delete an account */
router.delete('/delete', async (req, res) => {
  const authorized = await authCheck(req.headers);
  if (!authorized) res.status(401).json({ err: 'not authorized' });

  else {
    const accounts = await db.get('accounts');
    const found = accounts.find(a => a.user_token === req.headers.authorization);

    const updated = accounts.filter(a => a.user_token !== req.headers.authorization);

    await db.delete(`user_${found.user_id}`);
    await db.set('accounts', updated);

    res.status(201).json({ deleted: true });
  }
});


module.exports = {
  route: '/api/users',
  router: router
};