const app = io('/app', { query: { token: localStorage.getItem('token') } });
const cache = {};

let stop = false;

/**
 * Send a browser notification.
 * @param title The title of the notifcation (eg: the user who sent a message)
 * @param body The text/message body of the notification (eg: the message a user sent)
 * @param image A big image to display above the notification (eg: an image a user sent)
 * @param icon The icon of the notification (eg: the avatar url of the user who sent a message)
 * @param timestamp The time of sending the notification (put as `undefined` to automatically pass current time)
 * @param renotify Whether to remove the last notification and send this as new one
 * @param requireInteraction Whether the user needs to interact with the notification before it disappears
 * @param actions The possible actions (buttons) on the notification
 * @param silent Whether to deliver the notification silently or not
 * @param url The URL to go to when clicking the notification
 */
function sendNotification(title, body, image, icon, timestamp, renotify, requireInteraction, actions, silent, url) {
    const alerts = localStorage.getItem('alerts');

    if (alerts) {
        if (Notification.permission == 'granted') {
            const notif = new Notification(title, {
                body: body,
                image: image,
                icon: icon,
                timestamp: timestamp,
                renotify: renotify,
                requireInteraction: requireInteraction,
                actions: actions,
                silent: silent
            });
            notif.onclick = (event) => {
                event.preventDefault();
                window.location.href = url;
            }
        } else if (Notification.permission == 'default') {
            Notification.requestPermission();
            sendNotification(title, body, image, icon, timestamp, renotify, requireInteraction, actions, silent, url);
        }
    }
}

/**
 * Create a Notification card for the alerts page.
 * @param title The title for the alert (e.g.: 'New Friend')
 * @param message The message to display on the alert (e.g.: '<strong>Nexus</strong> accepted your friend request.')
 * @param timestamp The timestamp of the alert (format: dd/mm/yyyy hh:mm)
 * @param imageUrl The url of the image/thumbnail to display next to the alert (url of the corresponding user avatar, or an icon when an action is alerted)
 * @return void: it will automatically add it to the alerts page
 */
function createNotif(title, message, timestamp, imageUrl){
    const notifCard = `
    <li class="notif">
        <img src="${imageUrl}" alt="profile picture">
        <div class="notif-text">
            <div class="notif-text header">
                <h3 class="notif-text header title">${title}</h3>
                <p class="notif-text header time">${timestamp}</p>
            </div>
            <p>${message}</p>
        </div>
    </li>
    `
    document.getElementById('notifs').innerHTML += notifCard
}

function convertRemToPixels(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

app.on('load', async data => {
    if (data.err) window.location.href = '/login';
    else setInterval(() => { app.emit('joined', localStorage.getItem('token')) }, 250);

    /* User Data */
    let { friends, icon, banner, user_tag, reqs, user_id, dms } = data;
    const friendsList = document.querySelector('div.friends-list');

    const incomingRequests = reqs.filter(r => r.s !== user_id);

    const alert = document.querySelector('div.red-circle');
    incomingRequests.length > 0 ? alert.classList.remove('hidden-alert') : alert.classList.add('hidden-alert');

    alert.getElementsByTagName('p')[0].textContent = `${incomingRequests.length}`;

    document.querySelector('div.friends-main-div').addEventListener('click', () => {
    });

    // request notifications permission
    if (Notification.permission != 'granted') {
        await Notification.requestPermission();
    }

    app.on('friendsListUpdate', async (data) => {
        if (data.for.includes(localStorage.getItem('token'))) {

            const updatedList = data.friends[`${user_id}`];

            const toDelete = (updatedList[updatedList.length - 1])?.user_tag;
            if (toDelete) document.querySelector(`div.pending-requests-list div#${toDelete}`).style.display = 'none';

            friends = updatedList;
            await makeFriendsList(friends);
        }
    });

    app.on('friendsReqListUpdate', async (data) => {
        if (data.for.includes(localStorage.getItem('token'))) {

            const updatedReqs = (data.reqs.del ? reqs.filter(r => r.s !== user_tag || r.r !== user_tag) : [...reqs, data.reqs.req])
            await setRequestsList(updatedReqs);

            const incReqs = updatedReqs.filter(r => r.s !== user_id);

            if (incReqs.length > 0) {
                const alert = document.querySelector('div.red-circle');
                alert.classList.remove('hidden-alert');

                const pings = parseInt(alert.getElementsByTagName('p')[0].textContent);
                alert.getElementsByTagName('p')[0].textContent = `${pings + 1}`;
            } else {
                const alert = document.querySelector('div.red-circle');
                alert.classList.add('hidden-alert');

                alert.getElementsByTagName('p')[0].textContent = '0';
            }
        }
    });

    await loadDMs(dms);

    async function loadDMs(dms) {
        friendsList.innerHTML = '';

        if (dms.length === 0) {

            const noFriends = document.createElement('div');
            noFriends.classList.add('no-friends');

            const heading = document.createElement('h4');
            heading.textContent = 'no DMs open';

            noFriends.append(heading);
            friendsList.appendChild(noFriends);

        } else {
            for (let x = 0; x < dms.length; x++) {

                const friend = document.createElement('div');
                friend.classList.add('friend');

                const pfp = document.createElement('img');
                pfp.src = (dms[x].icon && dms[x].icon.length > 1000
                    ? 'data:image/png;base64,' + dms[x].icon
                    : dms[x].icon);

                const info = document.createElement('div');
                info.classList.add('friend-bio');
                info.classList.add('noselect');

                const tag = document.createElement('h3');
                tag.textContent = dms[x].user_tag;

                info.append(tag);
                friend.append(pfp, info);

                friend.id = dms[x].user_tag;
                friendsList.append(friend);

                if (x === 0) friend.classList.add('selected');
            }
        }
    }


    /* Load Profile */
    const userBanner = document.querySelector('div.profile-section div.profile-banner');
    userBanner.style.backgroundImage = `url(${banner.length > 1000 ? `data:image/png;base64,${banner}` : banner})`;

    const pfp = document.querySelector('div.profile-section div.profile-pic');
    pfp.style.backgroundImage = `url(${icon.length > 1000 ? `data:image/png;base64,${icon}` : icon})`;

    const name = document.querySelector('div.profile-section input#username-input');
    name.value = user_tag;


    /* Load Friends */
    await makeFriendsList(friends);

    async function makeFriendsList(list) {
        const profileFriendsList = document.querySelector('div.friends-section div.profile-friends-list-wrapper');
        profileFriendsList.innerHTML = '';

        if (list.length > 0) {
            for (let x = 0; x < friends.length; x++) {

                const friend = document.createElement('div');
                friend.classList.add('profile-item-friend');

                const pfp = document.createElement('img');
                pfp.src = (friends[x].icon.length > 1000
                    ? 'data:image/png;base64,' + friends[x].icon
                    : friends[x].icon)

                const wrapper = document.createElement('div');
                wrapper.classList.add('profile-item-friend-wrapper');

                const tag = document.createElement('p');
                tag.textContent = friends[x].user_tag;

                tag.classList.add('friend-tag');
                friend.id = friends[x].user_tag;

                const manageFriendWrap = document.createElement('div');
                manageFriendWrap.classList.add('manage-friend-wrap');

                const btnFriendChat = document.createElement('button');
                btnFriendChat.classList.add('manage-friend-chat');

                const btnFriendDelete = document.createElement('button');
                btnFriendDelete.classList.add('manage-friend-remove');

                btnFriendChat.innerHTML = '<ion-icon name="chatbubble-outline"></ion-icon>';
                btnFriendDelete.innerHTML = '<ion-icon name="person-remove-outline"></ion-icon>';

                manageFriendWrap.append(btnFriendChat, btnFriendDelete);
                friend.append(pfp, tag, manageFriendWrap);

                profileFriendsList.appendChild(friend);
                await manageFriendControls(friend);
            }
        }
    }

    /* Handle Loaded Data */
    manageUserDMs();
    manageUserFriends();
    manageUserProfile();
    handleUserChats(user_tag, user_id);

    /* Handle User DMs */
    function manageUserDMs() {
        const chatSection = document.querySelector('div.chat-section');

        if (dms.length === 0) {
            chatSection.classList.add('hidden');

        } else {
            chatSection.classList.add('hidden');
        }
    }

    document.querySelector(`div.friends-section-btn`)?.click();
    // Selects the starting screen when going to /app. to get first friend use: `div.friends-list div#${friends[0]?.user_tag}`

    const loading = document.querySelector('div.loading');
    loading.classList.add('hidden');

    /* Handle Friends Tab */
    await setRequestsList(reqs);

    function manageUserFriends() {

        const manageFriendAdd = (btn, inp) => {

            const updatePendingReqs = async (tag) => {
                const requestsDiv = document.querySelector('div.friends-section div.pending-requests-list');
                requestsDiv.innerHTML = '';

                app.emit('friendAdd', {
                    from: localStorage.getItem('token'),
                    to: inp.value
                });
                new Alert({
                    type: 'success',
                    message: 'Friend request sent!'
                })
            }

            inp.addEventListener('keyup', e => {
                if ((/[^a-zA-Z0-9]/.test(inp.value)) || inp.value.length === 0) btn.classList.add('disabled');
                else btn.classList.remove('disabled');

                if (e.key === 'Enter'){
                    btn.click();
                }
            });

            btn.addEventListener('click', async () => {
                btn.classList.add('disabled');

                const exists = await isTaken('user_tag', inp.value);
                const friendAlready = friends.find(f => f.user_tag === inp.value);

                if (/[^a-zA-Z0-9]/.test(inp.value)) {
                    new Alert({
                        type: 'error',
                        message: 'Only alphanumeric characters are allowed.',
                    });
                }
                else if (!exists) {
                    new Alert({
                        type: 'error',
                        message: 'This user does not exist.',
                    });
                    btn.classList.remove('disabled')
                }
                else if (inp.value === user_tag) {
                    new Alert({
                        type: 'error',
                        message: 'You can not add yourself as friend.',
                    });
                    btn.classList.remove('disabled')
                }
                else if (friendAlready) {
                    new Alert({
                        type: 'error',
                        message: 'This user already is your friend.',
                    });
                    btn.classList.remove('disabled')
                }
                else {
                    await updatePendingReqs(inp.value);
                    inp.value = '';
                    btn.classList.add('disabled');
                }
            });
        }

        const friendsSection = document.querySelector('div.friends-section');

        const addFriendBtn = friendsSection.querySelector('div.profile-add-friend-form button');
        const addFriendInp = friendsSection.querySelector('div.profile-add-friend-form input');

        // addFriendBtn.classList.add('disabled');
        manageFriendAdd(addFriendBtn, addFriendInp);
    }

    function manageUserProfile() {

        const updateProfile = async (prop, value) => {

            const req = await fetch(`/api/users/${user_tag}/update`, {
                method: 'POST',
                body: JSON.stringify({
                    changes: [{ key: prop, value: value }]
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                }
            });

            await req.json();
        }

        const nameInput = document.querySelector('div.profile-section input#username-input');
        const nameBtn = document.querySelector('div.profile-section button.edit-name-btn');

        nameInput.addEventListener('input', async () => {
            const exists = await isTaken('name', nameInput.value);

            if (/[^a-zA-Z0-9]/.test(nameInput.value)) nameBtn.classList.add('disabled');
            else if (nameInput.value === user_tag) nameBtn.classList.add('disabled');
            else if (nameInput.value.length > 17) nameBtn.classList.add('disabled');
            else if (nameInput.value.length < 3) nameBtn.classList.add('disabled');
            else if (exists) nameBtn.classList.add('disabled');
            else nameBtn.classList.remove('disabled');
        });

        const bioInput = document.querySelector('div.user-bio-wrapper textarea');
        const bioBtn = document.querySelector('div.user-bio-wrapper button');

        nameBtn.addEventListener('click', async () => {

            if (!nameInput.classList.contains('disabled-input')) {
                await updateProfile('user_tag', nameInput.value);

                nameBtn.innerHTML = '<ion-icon name="create-outline"></ion-icon>';
                nameInput.classList.add('disabled-input');

            } else {
                nameInput.classList.remove('disabled-input');
                nameBtn.classList.add('disabled');

                nameBtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>';
            }
        });

        const updateImg = async (type, data) => {
            const base64String = data;
            const base64 = base64String.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
            const binaryString = atob(base64);


            const byteArray = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                byteArray[i] = binaryString.charCodeAt(i);
            }

            const blob = new Blob([byteArray], { type: 'image/png' });
            const formData = new FormData();

            formData.append('image', blob);

            await fetch(`/api/users/img/${user_tag}/${type}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': localStorage.getItem('token')
                }
            });
        }

        /* Change Profile Pic & Banner */
        const pfpDiv = document.querySelector('div.profile-section button.pfp-change-btn');
        const pfpInput = document.querySelector('input.pfp-upload');

        const bannerDiv = document.querySelector('div.profile-section button.edit-banner-btn');
        const bannerInput = document.querySelector('input.banner-upload');

        pfpDiv.addEventListener('click', () => pfpInput.click());
        bannerDiv.addEventListener('click', () => bannerInput.click());

        pfpInput.addEventListener('change', (event) => {
            const image = event.target.files[0];
            const reader = new FileReader();

            reader.addEventListener('load', async (e) => {
                const result = reader.result;

                pfpDiv.parentNode.style.backgroundImage = `url(${result})`;
                await updateImg('icon', result);
            });

            reader.readAsDataURL(image);
        });

        bannerInput.addEventListener('change', (event) => {
            const image = event.target.files[0];
            const reader = new FileReader();

            reader.addEventListener('load', async (e) => {
                const result = reader.result;

                document.querySelector('div.profile-banner').style.backgroundImage = `url(${result})`;
                await updateImg('banner', result);
            });

            reader.readAsDataURL(image);
        });
    }

    async function setRequestsList(requests) {
        const requestsDiv = document.querySelector('div.pending-requests-list');
        requestsDiv.innerHTML = '';

        for (const req of requests) {
            const requester = (req.s === user_id ? req.r : req.s);

            const res = await fetch(`/api/id/${requester}`);
            const user = await res.json();

            const div = document.createElement('div');
            div.classList.add('friend-req-div');

            const icon = document.createElement('img');
            icon.src = (user.icon?.length > 1000
                ? 'data:image/png;base64,' + user.icon
                : user.icon
            );

            const name = document.createElement('h4');
            name.textContent = user.user_tag;

            const controls = document.createElement('div');
            controls.classList.add('pending-req-controls');

            const acceptBtn = document.createElement('button');
            acceptBtn.classList.add('accept-req');

            const denyBtn = document.createElement('button');
            denyBtn.classList.add('deny-req');

            acceptBtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>';
            denyBtn.innerHTML = '<ion-icon name="close-outline"></ion-icon>';

            req.s === user_id ? controls.append(denyBtn)
                : controls.append(acceptBtn, denyBtn);

            div.append(icon, name, controls);
            requestsDiv.append(div);

            div.id = user.user_tag;
            handleFriendRequest(div, requestsDiv);
        }
    }


    async function manageFriendControls(friend) {
        const controls = friend.querySelector('div.manage-friend-wrap');

        const chatBtn = controls.querySelector('button.manage-friend-chat');
        const delBtn = controls.querySelector('button.manage-friend-remove');

        chatBtn.addEventListener('click', async () => {
            const existsAlready = document.querySelector(`div.friends-list div#${friend.id}`);

            if (!existsAlready) {
                const updatedDMs = [{
                    user_tag: friend.id,
                    icon: (friend.getElementsByTagName('img')[0].src.length > 1000
                        ? friend.getElementsByTagName('img')[0].src.split('64,')[1]
                        : friend.getElementsByTagName('img')[0].src),
                    banner: (friends.find(f => f.user_tag === friend.id).banner.length > 1000
                        ? friends.find(f => f.user_tag === friend.id).banner.split('64,')[1]
                        : friends.find(f => f.user_tag === friend.id).banner)
                },
                ...dms]

                dms = updatedDMs;
                await loadDMs(dms);

                document.querySelector(`div#${friend.id}`).click();
            }

            else {
                const chat = document.querySelector(`div#${friend.id}`);
                chat.click();
            }
        });

        delBtn.addEventListener('click', async () => {
            friend.classList.add('disabled-div');

            app.emit('friendRemove', {
                from: localStorage.getItem('token'),
                to: friend.id
            });

            const exists = document.querySelector(`div.profile-friends-list-wrapper div#${friend.id}`);
            exists.classList.add('hidden');
        });
    }

    function handleFriendRequest(friend, list) {
        const controls = friend.querySelector('div.pending-req-controls');

        const accept = controls.querySelector('button.accept-req');
        const deny = controls.querySelector('button.deny-req');

        accept && accept.addEventListener('click', async () => {
            friend.classList.add('disabled-div');

            app.emit('friendAdd', {
                from: localStorage.getItem('token'),
                to: friend.id
            });

            const existed = list.querySelector(`div#${friend.id}`);

            existed && existed.classList.add('hidden');
            //window.location.href = '/app';
        });

        deny && deny.addEventListener('click', async () => {
            friend.classList.add('disabled-div');

            app.emit('friendRemove', {
                from: localStorage.getItem('token'),
                to: friend.id
            });

            const existed = list.querySelector(`div#${friend.id}`);

            existed && existed.classList.add('hidden');
            //window.location.href = '/app';
        })
    }

    app.on('userPresenceUpdate', info => {

        const { user_tag, online } = info;
        const friendTab = document.querySelector(`div.friends-list div#${user_tag}`);

        if (friendTab) {
            const border = online ? '3px solid green' : '2px solid var(--bg-darkest)';

            online
                ? friendTab.getElementsByTagName('img')[0].style.border = border
                : friendTab.getElementsByTagName('img')[0].style.border = '';
        }
    });

    function loadMessagesAfterSending(arr, msgReference, dynamicId, message){
        const repliedMsg = arr.find(m => m.sent_at === msgReference) || { text: '[deleted message]' };

        const megaContainer = document.createElement('div');
        megaContainer.classList.add('msg-replied');

        const replyContainer = document.createElement('div');
        replyContainer.classList.add(`reply-container-${(dynamicId === 'self' ? 'right' : 'left')}`);

        const replyIcon = document.createElement('div');
        replyIcon.classList.add(`msg-reply-icon-${(dynamicId === 'self' ? 'right' : 'left')}`);

        const uppermsg = document.createElement('p');
        uppermsg.textContent = repliedMsg.text;

        const msgUpper = document.createElement('div');
        msgUpper.appendChild(uppermsg);
        localStorage.setItem('ignoreRefClick', 'false');
        if (repliedMsg.text === '[deleted message]') {
            msgUpper.style.cursor = 'default';
        }
        else {
            msgUpper.onclick = ev => {
                if (localStorage.getItem('ignoreRefClick') === 'false'){
                    localStorage.setItem('ignoreRefClick', 'true');
                    const refMsg = document.getElementById(`${repliedMsg.sent_at}`);
                    const chatMsgs = document.getElementsByClassName('chat-messages')[0];
                    chatMsgs.scrollTo({
                        top: refMsg.offsetTop - chatMsgs.offsetTop,
                        left: refMsg.offsetLeft,
                        behavior: 'smooth'
                    });
                    refMsg.style.background = 'rgba(255, 255, 255, 0.5)';
                    const refMsgW = refMsg.style.width;
                    refMsg.style.width = (refMsg.offsetWidth*1.5) + 'px';
                    setTimeout(() => {
                        refMsg.style.background = '';
                        refMsg.style.width = refMsgW;
                        localStorage.setItem('ignoreRefClick', 'false');
                    }, 1200);
                }
            }
        }


        if (dynamicId === 'self'){
            replyContainer.append(msgUpper, replyIcon);
        }
        else {
            replyContainer.append(replyIcon, msgUpper);
        }
        const existingEditedMessage = document.getElementById(message.id);
        if (existingEditedMessage){
            existingEditedMessage.parentNode.append(message);
        }
        else {
            megaContainer.append(replyContainer, message);
            messages.append(megaContainer);
        }

        megaContainer.classList.add(`align-${dynamicId}`);
        msgUpper.style.background = `var(--${(dynamicId === 'self' ? 'msg-me' : 'msg-them')})`;
        msgUpper.classList.add('msg-reply-text');
        msgUpper.id = 'ref-' + msgReference;
    }

    function handleUserChats(user_tag, user_id) {
        const sockets = {};

        document.querySelector('div.friends-list').addEventListener('click', e => {

            if (dms.map(d => d.user_tag).includes(e.target.id)) {

                document.querySelector('div.chat-messages').innerHTML = '';

                const profileSection = document.querySelector('div.profile-section');
                const friendsSection = document.querySelector('div.friends-section');

                profileSection.classList.add('hidden');
                friendsSection.classList.add('hidden');

                const div = e.target;
                const friend = div.id;

                sockets[friend] = io('/chat');
                sockets[friend].emit('loadRequest', { friend: div.id, self: user_tag });

                const selected = document.querySelectorAll('div.selected');
                selected.forEach(d => d.classList.remove('selected'));

                div.classList.add('selected');

                const chatSection = document.querySelector('div.chat-section');
                chatSection.classList.remove('hidden');

                const header = chatSection.querySelector('div.chat-header h3');
                header.innerHTML = `<span>@</span>${friend}`;

                chatSection.id = friend;
                const messages = document.querySelector('div.chat-messages');

                const elevatedProfileDisplay = document.querySelector('div.user-profile-elevated');
                const banner = elevatedProfileDisplay.querySelector('img.banner');

                const pfp = elevatedProfileDisplay.querySelector('div.pfp img');
                const name = elevatedProfileDisplay.getElementsByTagName('h2')[0];

                const bnr = dms.find(d => d.user_tag === friend).banner;
                const ico = dms.find(d => d.user_tag === friend).icon;

                banner.src = (bnr.length > 1000 ? `data:image/png;base64,${bnr}` : bnr);
                pfp.src = (ico.length > 1000 ? `data:image/png;base64,${ico}` : ico);

                name.textContent = friend;

                sockets[friend].on('load', (arr) => {
                    messages.innerHTML = '';

                    for (let x = 0; x < arr.length; x++) {
                        const message = document.createElement('div');

                        message.classList.add('msg');
                        message.id = arr[x].sent_at;

                        const dynamicId = arr[x].from == user_id
                            ? ('self')
                            : ('them');

                        message.classList.add(dynamicId);

                        const content = document.createElement('p');
                        content.textContent = arr[x].text;

                        message.appendChild(content);

                        if (arr[x].reference) {
                            loadMessagesAfterSending(arr, arr[x].reference, dynamicId, message);
                        } else messages.appendChild(message);
                    };

                    messages.scrollTop = messages.scrollHeight;
                });


                if (stop === false) {
                    stop = true;

                    const msgInput = document.querySelector('input.msg-input');
                    const msgSend = document.querySelector('button.msg-send');
                    const msgCtxMenu = document.querySelector('div.manage-message-ctx');

                    function sendMsg(){
                        const ref = (msgInput.id === 'no-regular' ? parseInt(msgCtxMenu.id) : null);
                        const edit = (msgInput.id === 'editing-msg' ? parseInt(msgCtxMenu.id) : null);

                        if (/^\s*$/.test(msgInput.value)) return;
                        if (msgInput.value === document.getElementById(edit)?.getElementsByTagName('p')[0].textContent) return;

                        const currentFriend = document.querySelector('div.chat-section').id;

                        const messageId = Date.now();
                        sockets[currentFriend].emit('msgSave', { from: user_tag, to: currentFriend, sent_at: (edit ? edit : messageId), text: msgInput.value, reference: ref }, currentFriend);

                        msgInput.value = '';
                        msgInput.id = '';

                        document.querySelector('div.replying-indicator').style.display = 'none';
                        document.querySelector('div.editing-indicator').style.display = 'none';
                    }

                    msgSend.addEventListener('click', (event) => {
                        sendMsg();
                    });

                    msgInput.addEventListener('keyup', (event) => {
                        if (event.key === 'Enter'){
                            sendMsg();
                        }
                    });

                    // Currently notifications are only sent when the url is `example.com/app`, receiving users don't get
                    // notifications when they're in the settings `example.com/app/settings` or alerts.
                    // TODO: make it possible to receive alerts on any page of the website (except homepage `example.com`)
                    sockets[friend].on('msgReceive', async (msg, cf) => {
                        const messages = document.querySelector('div.chat-messages');
                        const chatSection = document.querySelector('div.chat-section');

                        const friend_tag = chatSection.id;

                        // Send a browser notif if they have alerts on and if they're the receiving user
                        if (localStorage.getItem('alerts') === 'true' && msg.to === user_tag) {
                            sendNotification(msg.from, msg.text, undefined, 'https://cdn.discordapp.com/attachments/841712516685234186/1115681395117916293/nexus-logo.png', undefined, undefined, undefined, undefined, undefined, ('http://localhost:42320/app'))
                        }
                        if (msg.from !== user_tag && msg.from !== friend_tag) {
                            const notification = new Audio('../audio/msg.mp3');
                            await notification.play();
                        } else {
                            const message = document.getElementById(`${msg.sent_at}`) || document.createElement('div');
                            if (!message.classList.contains('msg')) message.classList.add('msg');

                            const dynamicId = msg.from === user_tag ? ('self') : ('them');

                            if (!message.classList.contains(dynamicId)) message.classList.add(dynamicId);
                            message.id = msg.sent_at;

                            const content = message.getElementsByTagName('p')[0] || document.createElement('p');
                            content.textContent = msg.text;

                            message.innerHTML = '';
                            message.appendChild(content);

                            if (msg.reference) {
                                sockets[friend].emit('requestMessages1', {self: msg.from, friend: msg.to});
                                sockets[friend].on('requestMessages2', async arr => {
                                    loadMessagesAfterSending(arr, msg.reference, dynamicId, message);
                                    messages.scrollTop = messages.scrollHeight;
                                })
                            } else {
                                if ((msg.to === user_tag && msg.from === friend_tag || msg.from === user_tag && msg.to === friend_tag)) {
                                    if (!document.getElementById(message.id)) messages.appendChild(message);
                                    else document.getElementById(message.id).getElementsByTagName('p')[0].textContent = msg.text;
                                }
                                messages.scrollTop = messages.scrollHeight;
                            }

                            const otherGuy = msg.from === user_tag ? msg.to : msg.from;
                            if (dms.find(d => d.user_tag === otherGuy)) {

                                const userData = dms.find(d => d.user_tag === otherGuy);

                                const firstDM = userData;
                                const updated = dms.filter(d => d.user_tag !== otherGuy);

                                await loadDMs([firstDM, ...updated]);
                            }
                        }
                    });

                    const chatSection = document.querySelector('div.chat-section');
                    const replyIndicator = document.querySelector('div.replying-indicator');

                    const editIndicator = document.querySelector('div.editing-indicator');
                    msgCtxMenu.addEventListener('click', e => {
                        if (e.target.classList.contains('cpy') || e.target.parentNode.classList.contains('cpy')) {
                            msgCtxMenu.style.display = 'none';
                            navigator.clipboard.writeText(document.getElementById(msgCtxMenu.id).getElementsByTagName('p')[0].textContent);
                            new Alert({
                                type: 'info',
                                message: 'Copied message!',
                                duration: 3,
                                close: false,
                            });
                        }

                        if (e.target.classList.contains('del') || e.target.parentNode.classList.contains('del')) {
                            sockets[chatSection.id].emit('delete', { id: parseInt(msgCtxMenu.id), by: user_tag });
                            msgCtxMenu.style.display = 'none';
                        }

                        if (e.target.classList.contains('ref') || e.target.parentNode.classList.contains('ref')) {
                            msgCtxMenu.style.display = 'none';

                            msgInput.id = 'no-regular';
                            replyIndicator.getElementsByTagName('a')[0].setAttribute('href', `#${msgCtxMenu.id}`);

                            replyIndicator.style.display = 'flex';
                            msgInput.focus();
                        }

                        if (e.target.classList.contains('chg') || e.target.parentNode.classList.contains('chg')) {
                            msgCtxMenu.style.display = 'none';

                            msgInput.id = 'no-regular';
                            editIndicator.getElementsByTagName('a')[0].setAttribute('href', `#${msgCtxMenu.id}`);

                            editIndicator.style.display = 'flex';
                            const messageToEdit = document.getElementById(msgCtxMenu.id);

                            msgInput.value = messageToEdit ? messageToEdit.getElementsByTagName('p')[0].textContent : '';
                            msgInput.id = 'editing-msg';
                            msgInput.focus();
                        }
                    });

                    sockets[chatSection.id].on('msgDelete', m => {
                        const message = document.getElementById(m.id);
                        if (message) document.getElementsByClassName('chat-messages')[0].removeChild(message.parentNode);
                    });
                }
            }
        });
    }

    const profileBtn = document.querySelector('div.dms-controls button');
    const container = document.querySelector('div.container');
    const elevatedProfileDisplayBackground = document.querySelector('div.user-profile-elevated-background');

    elevatedProfileDisplayBackground.addEventListener('click', () => {
        profileBtn.click()
    })

    profileBtn.addEventListener('click', () => {
        const elevatedProfileDisplay = document.querySelector('div.user-profile-elevated');
        const hidden = elevatedProfileDisplay.classList.contains('invisible');

        if (hidden) {
            elevatedProfileDisplayBackground.style.display = 'block';
            container.classList.add('blurry');
            elevatedProfileDisplay.style.animation = 'pop 0.3s ease-out';
            elevatedProfileDisplay.classList.remove('invisible');
        } else {
            elevatedProfileDisplayBackground.style.display = 'none';
            container.classList.remove('blurry');
            elevatedProfileDisplay.classList.add('invisible');
        }
    });
});

function toggle(className) {
    const sections = ['friends-section', 'profile-section', 'chat-section'];
    const button0 = document.querySelector(`.${className}`);

    if (className.split('-btn')[0] !== 'chat-section'){
        document.getElementsByClassName('chat-section')[0].id = '';
    }

    sections.forEach(s => {
        const section = document.querySelector(`div.${s}`);

        if (section.classList.contains(className.split('-btn')[0])) section.classList.remove('hidden');
        else section.classList.add('hidden');

        const selected = document.querySelectorAll('div.selected');
        selected.forEach(d => d.classList.remove('selected'));

        button0.classList.add('selected');
    });
}

async function isTaken(key, value) {
    const req = await fetch('/api/taken', {
        method: 'POST',
        body: JSON.stringify({
            key: key,
            value: value
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const res = await req.json();
    return res.taken;
}

const topSearchbar = document.querySelector('div.search input');

topSearchbar.addEventListener('input', v => {
    const dmsList = document.querySelectorAll('div.friends-list div.friend');

    const { value: query } = topSearchbar;
    if (query.length === 0) visibleDMS(dmsList);

    dmsList.forEach((person) => {
        const user = person.getElementsByTagName('h3')[0].textContent.toLowerCase().trim();
        const term = query.toLowerCase().trim();

        if (term.length === 0 || user.includes(term)) {
            person.style.display = 'flex';
        } else {
            person.style.display = 'none';
        }
    });
});

function visibleDMS(dms) {
    dms.forEach(p => p.style.display = 'flex');
};

const messages = document.querySelector('div.chat-messages');

// Declare all contextmenu's (right-clicks)
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
})

messages.addEventListener('contextmenu', e => {
    e.preventDefault();

    if (e.target.classList.contains('msg') || e.target.parentElement.classList.contains('msg')) {
        const msgID = e.target.id || e.target.parentNode.id;

        const menu = document.querySelector('div.manage-message-ctx');

        if (e.target.classList.contains('them') || e.target.parentElement.classList.contains('them')) {
            menu.getElementsByClassName('chg')[0].style.display = 'none';
            menu.getElementsByClassName('del')[0].style.display = 'none';
            menu.getElementsByClassName('ref')[0].style.borderRadius = '0 0 15px 15px';
        } else {
            menu.getElementsByClassName('chg')[0].style.display = 'flex';
            menu.getElementsByClassName('del')[0].style.display = 'flex';
            menu.getElementsByClassName('ref')[0].style.borderRadius = '';
        }

        menu.style.display = 'flex';
        menu.id = msgID;
        const menuX = e.clientX + (0.5*menu.offsetWidth);
        const menuY = e.clientY + (0.5*menu.offsetHeight);

        if (window.innerWidth - menuX < (0.55*menu.offsetWidth)){
            menu.style.left = window.innerWidth - (0.55*menu.offsetWidth) + 'px';
        } else {
            menu.style.left = menuX + 'px';
        }

        if (window.innerHeight - menuY < (0.55*menu.offsetHeight)){
            menu.style.top = window.innerHeight - (0.55*menu.offsetHeight) + 'px';
        } else {
            menu.style.top = menuY + 'px';
        }

        document.addEventListener('mousedown', (event) => {
            if (!menu.contains(event.target)) {
                menu.style.display = 'none';
            }
        });
    }
});

const replyIndicator = document.querySelector('div.replying-indicator');
const editIndicator = document.querySelector('div.editing-indicator');
const messageManager = document.querySelector('div.message-manager');
replyIndicator.getElementsByClassName('cancel')[0].addEventListener('click', x => {
    document.querySelector('input.msg-input').id = '';
    replyIndicator.style.display = 'none';
});
editIndicator.getElementsByClassName('cancel')[0].addEventListener('click', x => {
    let input = document.querySelector('input.msg-input');
    input.id = '';
    input.value = '';
    editIndicator.style.display = 'none';
})

messageManager.getElementsByClassName('msg-send')[0].addEventListener('click', ev => {
    messageManager.getElementsByClassName('msg-input')[0].press
})
