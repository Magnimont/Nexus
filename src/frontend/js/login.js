setCookie()
    .then(async () => {
        const loginButton = document.querySelector('button.login-btn');

        loginButton.addEventListener('click', async () => {
            const id = loginButton.id;

            if (id === 'login') await handleLogin();
            else if (id === 'signup') await handleSignup();
            else if (id === 'forgot') await handleForgot();
        });

        const forgotLink = document.querySelector('p.forgot-link');
        const methodLink = document.querySelector('p.method-link');

        forgotLink.addEventListener('click', () => buildMethod('forgot', loginButton));
        methodLink.addEventListener('click', () => buildMethod(methodLink.id, loginButton));
    });

function buildMethod(method, btn) {
    const usernameInput = document.querySelector('.username-div input');
    const emailInput = document.querySelector('.email-div input');

    const passwordInput = document.querySelector('.password-div input');
    const repeatPasswordInput = document.querySelector('.repeat-password-div input');

    const forgotPasswordInput = document.querySelector('.forgot-password-div input');
    const verificationCodeInput = document.querySelector('.acc-verification-div input');

    const heading = document.querySelector('.heading-div h2');
    const subheading = document.querySelector('.heading-div h4');

    let currentMethod = 'login';

    if (method === 'login') {
        usernameInput.removeAttribute('required');
        usernameInput.parentNode.classList.add('hidden');

        repeatPasswordInput.removeAttribute('required');
        repeatPasswordInput.parentNode.classList.add('hidden');

        forgotPasswordInput.removeAttribute('required');
        forgotPasswordInput.parentNode.classList.add('hidden');

        verificationCodeInput.removeAttribute('required');
        verificationCodeInput.parentNode.classList.add('hidden');

        emailInput.setAttribute('required', '');
        emailInput.parentNode.classList.remove('hidden');

        passwordInput.setAttribute('required', '');
        passwordInput.parentNode.classList.remove('hidden');

        heading.textContent = 'Login';
        subheading.textContent = 'Enter your account details to log in';

        btn.id = 'login';
        const p = document.querySelector('p.method-link');

        p.id = 'signup';
        p.textContent = 'Don\'t have an account?';
    }

    else if (method === 'signup') {
        usernameInput.setAttribute('required', '');
        usernameInput.parentNode.classList.remove('hidden');

        repeatPasswordInput.setAttribute('required', '');
        repeatPasswordInput.parentNode.classList.remove('hidden');

        forgotPasswordInput.removeAttribute('required');
        forgotPasswordInput.parentNode.classList.add('hidden');

        verificationCodeInput.removeAttribute('required');
        verificationCodeInput.parentNode.classList.add('hidden');

        emailInput.setAttribute('required', '');
        emailInput.parentNode.classList.remove('hidden');

        passwordInput.setAttribute('required', '');
        passwordInput.parentNode.classList.remove('hidden');

        heading.textContent = 'Signup';
        subheading.textContent = 'Let\'s create an account';

        btn.id = 'signup';
        const p = document.querySelector('p.method-link');

        p.id = 'login';
        p.textContent = 'Have an existing account?';
    }

    else if (method === 'forgot') {
        usernameInput.removeAttribute('required');
        usernameInput.parentNode.classList.add('hidden');

        repeatPasswordInput.removeAttribute('required');
        repeatPasswordInput.parentNode.classList.add('hidden');

        forgotPasswordInput.setAttribute('required', '');
        forgotPasswordInput.parentNode.classList.remove('hidden');

        verificationCodeInput.removeAttribute('required');
        verificationCodeInput.parentNode.classList.add('hidden');

        emailInput.removeAttribute('required');
        emailInput.parentNode.classList.add('hidden');

        passwordInput.removeAttribute('required');
        passwordInput.parentNode.classList.add('hidden');

        heading.textContent = 'Forgot Password';
        subheading.textContent = 'Get your password on your account email';

        btn.id = 'forgot';
    }

    else if (method === 'verify') {
        usernameInput.removeAttribute('required');
        usernameInput.parentNode.classList.add('hidden');

        repeatPasswordInput.removeAttribute('required');
        repeatPasswordInput.parentNode.classList.add('hidden');

        forgotPasswordInput.removeAttribute('required', '');
        forgotPasswordInput.parentNode.classList.add('hidden');

        verificationCodeInput.setAttribute('required', '');
        verificationCodeInput.parentNode.classList.remove('hidden');

        emailInput.removeAttribute('required');
        emailInput.parentNode.classList.add('hidden');

        passwordInput.removeAttribute('required');
        passwordInput.parentNode.classList.add('hidden');

        heading.textContent = 'Email Verification';
        subheading.textContent = 'Enter the code to verify your account';
    }
}

async function handleLogin() {
    const emailInput = document.querySelector('.email-div input');
    const passwordInput = document.querySelector('.password-div input');

    const emailTaken = await isTaken('email', emailInput.value);
    const passTaken = await isTaken('password', passwordInput.value);

    const error = document.querySelector('p.err-login');
    if (emailTaken && passTaken) {

        const req = await fetch(`/api/token/${emailInput.value}`);
        const res = await req.json();

        if (res.token) localStorage.setItem('token', res.token);
        else error.textContent = 'An error has occurred while trying to log you in...';

        window.location.href = '/app';
    }
    else error.textContent = 'Email or password is invalid';
}

async function handleSignup() {
    const usernameInput = document.querySelector('.username-div input');
    const emailInput = document.querySelector('.email-div input');

    const passwordInput = document.querySelector('.password-div input');
    const repeatPasswordInput = document.querySelector('.repeat-password-div input');

    const usernameTaken = await isTaken('user_tag', usernameInput.value);
    const emailTaken = await isTaken('email', emailInput.value);

    const error = document.querySelector('p.err-login');
    error.style.color = 'orangered';

    const btn = document.querySelector('button.login-btn');

    if (usernameInput.value.length > 16) error.textContent = 'Username cannot exceed the length of 16 chars';
    else if (usernameInput.value.length < 3) error.textContent = 'Username should be of minimum 3 chars';
    else if (/[^a-zA-Z0-9]/.test(usernameInput.value)) error.textContent = 'Username cannot contain symbols or spaces';
    else if (passwordInput.value.length < 8) error.textContent = 'Password should at least be 8 chars long';
    else if (usernameTaken) error.textContent = 'That username is taken';
    else if (emailTaken) error.textContent = 'That email is taken';
    else if (passwordInput.value !== repeatPasswordInput.value) error.textContent = 'Passwords do not match';
    else {
        error.textContent = 'Creating your account...';
        error.style.color = 'slateblue';

        btn.classList.add('disabled');
        await verifyUser({ user_tag: usernameInput.value, email: emailInput.value, password: passwordInput.value });
    }
}

async function handleForgot() {
    // TODO: implement this function
}

async function verifyUser(details) {
    const acc = details;
    const code = Math.floor(Math.random() * (900000)) + 999999;

    const req = await fetch(`/api/verify`, {
        method: 'POST',
        body: JSON.stringify({
            code: code,
            username: acc.user_tag,
            email: acc.email
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const res = await req.json();
    const codeInput = document.querySelector('.acc-verification-div input');

    codeInput.parentNode.classList.remove('hidden');
    const loginButton = document.querySelector('button.login-btn');

    const err = document.querySelector('p.err-login');
    err.textContent = '';

    buildMethod('verify');
    codeInput.parentNode.style.display = 'block';

    document.querySelector('div.links-div').style.display = 'none';

    codeInput.addEventListener('input', () => {
        if (codeInput.value == code) loginButton.classList.remove('disabled');
        else loginButton.classList.add('disabled');
    });

    loginButton.addEventListener('click', async () => {
        if (codeInput.value == code) {
            
            const req = await fetch('/api/users', {
                method: 'POST',
                body: JSON.stringify({
                    created_at: Date.now(),
                    user_tag: acc.user_tag,
                    password: acc.password,
                    email: acc.email
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const res = await req.json();
            localStorage.setItem('token', res.token);

            window.location.href = '/app';
        }
    })
}

async function setCookie() {
    const req = await fetch('/api/cookie');
    const res = await req.json();

    return res;
};

async function isTaken (key, value) {
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