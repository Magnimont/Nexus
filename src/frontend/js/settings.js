const themes = document.querySelectorAll('div.theme-circle');

const themevars = {
  dark: { z: '#000', o: '#222', t: '#555', zt: '#ccc', ot: '#aaa', mz: '#767676', mo: 'darkgrey' },
  light: { z: 'gray', o: '#ccc', t: '#fff', zt: '#333', ot: '#222', mz: '#ccc', mo: '#aaa' },
  azure: { z: '#15112e', o: 'darkslateblue', t: '#5346B0', zt: 'mintcream', ot: 'azure', mz: '#6959DD', mo: '#7765F9' },
  crimson: { z: '#3a0610', o: 'crimson', t: '#A61330', zt: 'linen', ot: 'mistyrose', mz: '#E31E45', mo: '#FB3F64' },
  forest: { z: '#0a380a', o: 'green', t: 'forestgreen', zt: 'mintcream', ot: 'azure', mz: 'seagreen', mo: 'mediumseagreen' },
  synth: { z: '#3D0066', o: '#8400B8', t: '#C800FF', zt: 'mintcream', ot: 'azure', mz: '#4830d5', mo: '#3720c5' }
}

Array.from(themes).forEach(theme => {
  theme.parentNode.addEventListener('click', () => {
    const parentOpt = theme.parentNode;
    if (parentOpt.classList.contains('picked')) return;

    localStorage.setItem('theme', `${theme.id}`);
    parentOpt.classList.add('picked');

    setTheme();
    removeOtherDivSelections(theme);
  });
});

function removeOtherDivSelections(div) {
  Array.from(themes).forEach(card => {
    if (card !== div) {
      card.parentNode.classList.remove('picked');
    }
  });
}

function setTheme() {
  const root = document.documentElement;
  const theme = localStorage.getItem('theme') || 'dark';

  root.style.setProperty('--bg-darkest', themevars[theme].z);
  root.style.setProperty('--bg-medium', themevars[theme].o);
  root.style.setProperty('--bg-lightest', themevars[theme].t);

  root.style.setProperty('--fg-light', themevars[theme].zt);
  root.style.setProperty('--fg-dark', themevars[theme].ot);

  root.style.setProperty('--msg-me', themevars[theme].mz);
  root.style.setProperty('--msg-them', themevars[theme].mo);

  const selectedThemeDiv = document.getElementById(`${theme}`);
  const parentCard = selectedThemeDiv.parentNode;

  if (parentCard) {
    parentCard.classList.add('picked');
  }
}

setTheme();

const appMsgSoundHeader = document.querySelector('div.app-msg-s-header');
const soundbtn = appMsgSoundHeader.querySelector('button');

appMsgSoundHeader.addEventListener('click', x => {
  const sound = localStorage.getItem('msgSound');

  if (sound) {
    localStorage.removeItem('msgSound');
    soundbtn.classList.remove('ticked');
    soundbtn.innerHTML = '';
  } else {
    localStorage.setItem('msgSound', 'true');
    soundbtn.classList.add('ticked');
    soundbtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>'
  }
});

const appMsgAlertHeader = document.querySelector('div.app-msg-a-header');
const alertbtn = appMsgAlertHeader.querySelector('button');

appMsgAlertHeader.addEventListener('click', x => {
  const alerts = localStorage.getItem('alerts');

  if (alerts) {
    localStorage.removeItem('alerts');
    alertbtn.classList.remove('ticked');
    alertbtn.innerHTML = '';
  } else {
    localStorage.setItem('alerts', 'true');
    alertbtn.classList.add('ticked');
    alertbtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>'
  }
});

const sound = localStorage.getItem('msgSound');

if (sound) {
  soundbtn.classList.add('ticked');
  soundbtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>';
} else {
  soundbtn.classList.remove('ticked');
  soundbtn.innerHTML = '';
}

const alerts = localStorage.getItem('alerts');

if (alerts) {
  alertbtn.classList.add('ticked');
  alertbtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>';
} else {
  alertbtn.classList.remove('ticked');
  alertbtn.innerHTML = '';
}

const delAccBtn = document.querySelector('button.del-acc-btn');
const logoutBtn = document.querySelector('button.logout-btn');

const accountIO = io('/account', { query: { token: localStorage.getItem('token') }});

accountIO.on('loadInfo', account => {
  const pwInput = document.querySelector('input.password-input');
  const emInput = document.querySelector('input.email-input');

  const pwToggle = pwInput.parentNode.querySelector('button');
  const emToggle = emInput.parentNode.querySelector('button');
  
  valueToggle(pwInput, pwToggle, account, 'Password');
  valueToggle(emInput, emToggle, account, 'Email');

  valueChange(pwInput, document.querySelector('button.edit-pass-btn'), 'password', account, pwToggle);
  valueChange(emInput, document.querySelector('button.edit-email-btn'), 'email', account, emToggle);



  const appMsgTwofaHeader = document.querySelector('div.app-msg-t-header');
  const twofabtn = appMsgTwofaHeader.querySelector('button');

  appMsgTwofaHeader.addEventListener('click', x => {
    if (account.twofa_enabled) {
      accountIO.emit('change', {key: 'twofa_enabled', value: false, token: localStorage.getItem('token')});
      setTimeout(() => {
        window.location.reload();
      }, 250);
    } else {
      accountIO.emit('change', {key: 'twofa_enabled', value: true, token: localStorage.getItem('token')});
      setTimeout(() => {
        window.location.reload();
      }, 250);
    }
  });

  if (account.twofa_enabled) {
    twofabtn.classList.add('ticked');
    twofabtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>';
  } else {
    twofabtn.classList.remove('ticked');
    twofabtn.innerHTML = '';
  }
});

// TODO: add possibility to change 2fa settings

function valueToggle(input, button, details, method) {
  button.addEventListener('click', () => {
    const id = button.id;

    if (id === 'show') {

      button.id = 'hide';
      input.value = '';

      button.innerHTML = '<ion-icon name="eye-outline"></ion-icon>';
      input.placeholder = method;

    } else {

      button.id = 'show';
      input.value = details[method.toLowerCase()];

      button.innerHTML = '<ion-icon name="eye-off-outline"></ion-icon>';
      input.placeholder = method;

    }
  })
}

const cache = {};

function valueChange(input, button, method, details, toggle) {

  cache[method] = 'edit';

  button.addEventListener('click', async () => {

    if (cache[method] === 'edit') {
      input.value = details[method.toLowerCase()];

      button.style.pointerEvents = 'none';
      button.style.opacity = '0.5';

      button.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>';
      input.classList.remove('inp-disabled');

      toggle.style.pointerEvents = 'none';
      toggle.style.opacity = '0.5';

      cache[method] = 'save';

    } else {
      button.innerHTML = '<ion-icon name="create-outline"></ion-icon>';
      accountIO.emit('change', { key: method.toLowerCase(), value: input.value, token: localStorage.getItem('token') });
      if (method.toLowerCase() === 'password'){
        localStorage.removeItem('token');
        window.location.href = '/app';
      }
    }
  });

  input.addEventListener('input', async () => {

    if (input.value.length >= 5)  {
      const taken = await isTaken(method.toLowerCase(), input.value);

      if (taken) {
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.5';
      }

      else {
        button.style.pointerEvents = '';
        button.style.opacity = '1';
      }
    } else {

      button.style.pointerEvents = 'none';
      button.style.opacity = '0.5';
    }
  });
}

function delAcc () {
  delAccBtn.textContent = 'Confirm Deletion!';

  delAccBtn.addEventListener('click', async () => {
    const req = await fetch(`/api/users/delete`, {

      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      }
    });

    await req.json();
    window.location.href = '/login';
  });
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = '/app';
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