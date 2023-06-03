setCookie()
    .then(async () => {

        const token = localStorage.getItem('token');
        const userInfoReq = await fetch(`/api/load/${token}`);

        const userInfo = await userInfoReq.json();
        if (userInfo.err) window.location.href = '/login';

        /* Load DMs */
        const { friends, icon, banner, user_tag, reqs, user_id } = userInfo;
        const friendsList = document.querySelector('div.friends-list');

        if (friends.length === 0) {

            const noFriends = document.createElement('div');
            noFriends.classList.add('no-friends');

            const heading = document.createElement('h4');
            heading.textContent = 'no friends';

            noFriends.append(heading);
            friendsList.appendChild(noFriends);

        } else {
            for (x = 0; x < friends.length; x++) {

                const friend = document.createElement('div');
                friend.classList.add('friend');

                const pfp = document.createElement('img');
                pfp.src = (friends[x].icon.length > 1000
                    ? 'data:image/png;base64,' + friends[x].icon
                    : friends[x].icon)

                const info = document.createElement('div');
                info.classList.add('friend-bio');

                const tag = document.createElement('h3');
                tag.textContent = friends[x].user_tag;

                info.append(tag);
                friend.append(pfp, info);

                friend.id = friends[x].user_tag;
                friendsList.append(friend);
            }
        }


        /* Load Profile */
        const userBanner = document.querySelector('div.profile-section div.profile-banner');
        userBanner.style.backgroundImage = `url(data:image/png;base64,${banner})`;

        const pfp = document.querySelector('div.profile-section div.profile-pic');
        pfp.style.backgroundImage = `url(data:image/png;base64,${icon})`;

        const name = document.querySelector('div.profile-section input#username-input');
        name.value = user_tag;


        /* Load Friends */
        const profileFriendsList = document.querySelector('div.friends-section div.profile-friends-list-wrapper');
        if (friends.length > 0) {
            for (x = 0; x < friends.length; x++) {

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

        /* Handle Loaded Data */
        manageUserDMs(friends, user_id);
        manageUserFriends();
        manageUserProfile();


        /* Handle User DMs */
        function manageUserDMs(f, uid) {
            if (f.length === 0) {
                const chatSection = document.querySelector('div.chat-section');
                chatSection.classList.add('hidden');

            } else {
                handleUserChats(user_tag, uid);
                document.querySelector(`div#${friends[0].user_tag}`).click();
            }
        }

        const loading = document.querySelector('div.loading');
        loading.classList.add('hidden');

        /* Handle Friends Tab */
        await setRequestsList();

        function manageUserFriends() {

            const manageFriendAdd = (btn, inp) => {
                const updatePendingReqs = async (tag) => {
                    const requestsDiv = document.querySelector('div.friends-section div.pending-requests-list');
                    requestsDiv.innerHTML = '';

                    const request = await fetch(`/api/users/friendship`, {
                        method: 'POST',
                        body: JSON.stringify({
                            to: inp.value
                        }),
                        headers: {
                            'Authorization': localStorage.getItem('token'),
                            'Content-Type': 'application/json'
                        }
                    });

                    await request.json();
                    reqs.push(inp.value);

                    await setRequestsList();
                    window.location.href = '/app';
                }

                inp.addEventListener('input', async () => {

                    const exists = await isTaken('user_tag', inp.value);
                    const friendAlready = friends.find(f => f.user_tag === inp.value);

                    if (/[^a-zA-Z0-9]/.test(inp.value)) btn.classList.add('disabled');
                    else if (!exists) btn.classList.add('disabled');
                    else if (inp.value === user_tag) btn.classList.add('disabled');
                    else if (friendAlready) btn.classList.add('disabled');
                    else btn.classList.remove('disabled');
                });

                btn.addEventListener('click', async () => {
                    await updatePendingReqs(inp.value);
                });
            }

            const friendsSection = document.querySelector('div.friends-section');

            const addFriendBtn = friendsSection.querySelector('div.profile-add-friend-form button');
            const addFriendInp = friendsSection.querySelector('div.profile-add-friend-form input');

            addFriendBtn.classList.add('disabled');
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

        async function setRequestsList() {
            const requestsDiv = document.querySelector('div.pending-requests-list');
            requestsDiv.innerHTML = '';

            for (const req of reqs) {
                const requester = (req.s === user_id ? req.r : req.s);

                const res = await fetch(`/api/id/${requester}`);
                const user = await res.json();

                const div = document.createElement('div');
                div.classList.add('friend-req-div');

                const icon = document.createElement('img');
                icon.src = (user.icon.length > 1000
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

            chatBtn.addEventListener('click', () => {
                const chat = document.querySelector(`div#${friend.id}`);
                chat.click();
            });

            delBtn.addEventListener('click', async () => {
                const req = await fetch(`/api/users/friendship`, {
                    method: 'DELETE',
                    body: JSON.stringify({
                        to: friend.id
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('token')
                    }
                });

                await req.json();

                const exists = document.querySelector(`div#${friend.id}`);
                exists.classList.add('hidden');
            });
        }

        function handleFriendRequest(friend, list) {
            const controls = friend.querySelector('div.pending-req-controls');

            const accept = controls.querySelector('button.accept-req');
            const deny = controls.querySelector('button.deny-req');

            accept && accept.addEventListener('click', async () => {

                const req = await fetch('/api/users/friendship', {
                    method: 'POST',
                    body: JSON.stringify({
                        to: friend.id
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('token')
                    }
                });

                await req.json();
                const existed = list.querySelector(`div#${friend.id}`);

                existed && existed.classList.add('hidden');
                window.location.href = '/app';
            });

            deny && deny.addEventListener('click', async () => {
                const req = await fetch('/api/users/friendship', {
                    method: 'DELETE',
                    body: JSON.stringify({
                        to: friend.id
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('token')
                    }
                });

                await req.json();
                const existed = list.querySelector(`div#${friend.id}`);

                existed && existed.classList.add('hidden');
                window.location.href = '/app';
            })
        }
    });

async function setCookie() {
    const req = await fetch('/api/cookie');
    return await req.json();
}

function toggle(className) {
    const sections = ['friends-section', 'profile-section', 'chat-section'];
    const button0 = document.querySelector(`.${className}`);

    sections.forEach(s => {
        const section = document.querySelector(`div.${s}`);
        const button = document.querySelector(`.${s}-btn`);

        if (section.classList.contains(className.split('-btn')[0])) section.classList.remove('hidden');
        else section.classList.add('hidden');

        const selected = document.querySelectorAll('div.selected');
        selected.forEach(d => d.classList.remove('selected'));

        button0.classList.add('selected');
    })
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

let stop = false;

function handleUserChats(user_tag, user_id) {
    const list = document.querySelectorAll('div.friends-list div.friend');
    const sockets = {};

    Array.from(list).forEach(div => {
        div.addEventListener('click', () => {

            const profileSection = document.querySelector('div.profile-section');
            const friendsSection = document.querySelector('div.friends-section');

            profileSection.classList.add('hidden');
            friendsSection.classList.add('hidden');

            const friend = div.id;
            sockets[friend] = io('/chat', { query: { friend, self: user_tag } });

            const selected = document.querySelectorAll('div.selected');
            selected.forEach(d => d.classList.remove('selected'));

            div.classList.add('selected');

            const chatSection = document.querySelector('div.chat-section');
            chatSection.classList.remove('hidden');

            const header = chatSection.querySelector('div.chat-header h3');
            header.innerHTML = `<span>@</span>${friend}`;

            chatSection.id = friend;

            sockets[friend].on('dmLoad', (arr) => {
                const messages = document.querySelector('div.chat-messages');
                messages.innerHTML = '';

                for (x = 0; x < arr.length; x++) {
                    const message = document.createElement('div');
                    message.classList.add('msg');

                    arr[x].from == user_id
                        ? (message.id = 'self')
                        : (message.id = 'them');

                    const content = document.createElement('p');
                    content.textContent = arr[x].text;

                    message.appendChild(content);
                    messages.appendChild(message);
                };

                messages.scrollTop = messages.scrollHeight;
            });


            if (stop === false) {

                stop = true;
                const msgInput = document.querySelector('input.msg-input');

                msgInput.addEventListener('keyup', (event) => {
                    if (/^\s*$/.test(msgInput.value)) return;

                    if (event.key === 'Enter') {
                        const currentFriend = document.querySelector('div.chat-section').id;

                        sockets[currentFriend].emit('msgSave', { from: user_tag, to: currentFriend, sent_at: Date.now(), text: msgInput.value }, currentFriend);
                        msgInput.value = '';
                    }
                });

                sockets[friend].on('msgReceive', async (msg, cf) => {
                    const messages = document.querySelector('div.chat-messages');
                    const chatSection = document.querySelector('div.chat-section');

                    const otherPerson = (msg.to === user_id ? msg.from : msg.to);
                    const req = await fetch(`/api/id/${otherPerson}`);

                    const sender = await req.json();

                    if (chatSection.id !== sender.user_tag) {
                        const notification = new Audio();
                        notification.src = '../audio/msg.mp3';

                        if (localStorage.getItem('msgSound')) await notification.play();
                    } else {
                        const message = document.createElement('div');
                        message.classList.add('msg');

                        msg.from === user_id ? (message.id = 'self') : (message.id = 'them');

                        const content = document.createElement('p');
                        content.textContent = msg.text;

                        message.appendChild(content);
                        messages.appendChild(message);

                        messages.scrollTop = messages.scrollHeight;
                    }
                });
            }
        });
    });
}
