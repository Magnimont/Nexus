const themes = document.querySelectorAll('div.theme-circle');

const themevars = {
  dark: { z: '#111', o: '#222', t: '#333', zt: '#ccc', ot: '#aaa', mz: 'grey', mo: 'darkgrey' },
  light: { z: 'gray', o: '#ccc', t: '#fff', zt: '#333', ot: '#222', mz: '#ccc', mo: '#aaa' },
  azure: { z: '#2D2754', o: 'darkslateblue', t: '#5346B0', zt: 'mintcream', ot: 'azure', mz: '#6959DD', mo: '#7765F9' },
}

Array.from(themes).forEach(theme => {
  theme.parentNode.addEventListener('click', () => {
    const parentOpt = theme.parentNode;
    if (parentOpt.classList.contains('picked')) return;

    localStorage.setItem('theme', `${theme.id}`);
    parentOpt.classList.add('picked');

    const desktopApp = localStorage.getItem('desktopApp')
    if (desktopApp){
      document.querySelector('#desktopAppRestart').showModal();
      return
    }

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

appMsgSoundHeader.addEventListener('click', x => {
  const btn = appMsgSoundHeader.querySelector('button');
  const sound = localStorage.getItem('msgSound');

  if (sound) {
    localStorage.removeItem('msgSound');
    btn.classList.remove('ticked');
    btn.innerHTML = '';
  } else {
    localStorage.setItem('msgSound', 'true');
    btn.classList.add('ticked');
    btn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>'
  }
});


const btn = document.querySelector('div.app-msg-s-header').querySelector('button');
const sound = localStorage.getItem('msgSound');

if (sound) {
  localStorage.removeItem('msgSound');
  btn.classList.remove('ticked');
  btn.innerHTML = '';
} else {
  localStorage.setItem('msgSound', 'true');
  btn.classList.add('ticked');
  btn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>';
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
});

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
    }
  });

  input.addEventListener('input', async() => {
    if (input.value >= 5)  {
      const taken = await isTaken(method.toLowerCase(), input.value);
      if (taken) {
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.5';
      }

      else {
        button.style.pointerEvents = '';
        button.style.opacity = '1';
      }
    }
  });
}

function delAcc () {
  delAccBtn.textContent = 'Confirm!';

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