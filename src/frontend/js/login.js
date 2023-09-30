const loginButton = document.querySelector('button.login-btn');
const account_socket = io('/account');

let alreadyHandling = false;

loginButton.addEventListener('click', async () => {
    const id = loginButton.id;
    if (id === 'login') await handleLogin();
    else if (id === 'signup') await handleSignup();
    else if (id === 'forgot') await handleForgot();
});

document.addEventListener('keyup', (ev) => {
    if (ev.key === 'Enter'){
        loginButton.click();
    }
})

const forgotLink = document.querySelector('p.forgot-link');
const methodLink = document.querySelector('p.method-link');

forgotLink.addEventListener('click', () => buildMethod('forgot', loginButton));
methodLink.addEventListener('click', () => buildMethod(methodLink.id, loginButton));


function buildMethod(method, btn) {
    const usernameInput = document.querySelector('.username-div input');
    const emailInput = document.querySelector('.email-div input');

    const passwordInput = document.querySelector('.password-div input');
    const repeatPasswordInput = document.querySelector('.repeat-password-div input');

    const forgotPasswordInput = document.querySelector('.forgot-password-div input');
    const verificationCodeInput = document.querySelector('.acc-verification-div input');

    const heading = document.querySelector('.heading-div h2');
    const subheading = document.querySelector('.heading-div h4');

    // let currentMethod = 'login';

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
        subheading.textContent = 'Enter your account details to log in.';

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

        document.getElementById('curp').autocomplete = 'new-password';

        heading.textContent = 'Signup';
        subheading.textContent = 'Let\'s create an account.';

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
        subheading.textContent = 'We\'ll send you an email containing your current password. Make sure no other person is looking at your screen!';

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
        subheading.textContent = 'Enter the code to verify and activate your account.';
    }

    else if (method === '2fa-email') {
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

        heading.textContent = '2FA - Email';
        subheading.textContent = 'An email has been sent to your email address. Enter the code to log in to your account.';
    }
}

async function handleLogin() {
    if (alreadyHandling) return;
    alreadyHandling = true;
    const emailInput = document.querySelector('.email-div input');
    const passwordInput = document.querySelector('.password-div input');

    const emailTaken = (await isTaken('email', emailInput.value)).id;
    const passTaken = (await isTaken('password', passwordInput.value)).id;

    const error = document.querySelector('p.err-login');
    if (emailTaken === passTaken) {
        account_socket.emit('get2fa', emailInput.value);
        account_socket.on('get2fareturn', res => {
            if (res.enabled){
                handle2fa({ user_tag: res.user_tag, email: emailInput.value, password: passwordInput.value, method2fa: res.method });
            }
            else {
                account_socket.emit('tokenOf', emailInput.value);
                account_socket.on('token', res => {

                    if (res) {
                        localStorage.setItem('token', res);
                        window.location.href = '/app';
                    }
                    else {
                        error.textContent = 'An error has occurred while trying to log you in...';
                        alreadyHandling = false;
                    }
                });
            }
        })
    }
    else {
        error.textContent = 'Email or password is invalid';
        alreadyHandling = false;
    }
}

async function handleSignup() {
    const usernameInput = document.querySelector('.username-div input');
    const emailInput = document.querySelector('.email-div input');

    const passwordInput = document.querySelector('.password-div input');
    const repeatPasswordInput = document.querySelector('.repeat-password-div input');

    const usernameTaken = (await isTaken('user_tag', usernameInput.value)).taken;
    const emailTaken = (await isTaken('email', emailInput.value)).taken;

    const error = document.querySelector('p.err-login');
    error.style.color = 'orangered';

    const btn = document.querySelector('button.login-btn');

    if (usernameInput.value.length > 16) error.textContent = 'Username cannot exceed the length of 16 chars';
    else if (usernameInput.value.length < 3) error.textContent = 'Username should be of minimum 3 chars';
    else if (/[^a-zA-Z0-9]/.test(usernameInput.value)) error.textContent = 'Username cannot contain symbols or spaces';
    else if (usernameTaken) error.textContent = 'That username is taken';
    else if (emailTaken) error.textContent = 'That email is taken';
    else if (passwordInput.value.length < 8) error.textContent = 'Password should at least be 8 chars long';
    else if (passwordInput.value !== repeatPasswordInput.value) error.textContent = 'Passwords do not match';
    else {
        error.textContent = 'Creating your account...';
        error.style.color = 'slateblue';

        btn.classList.add('disabled');
        console.log("---\nVerifying...\n---")
        await verifyUser({ user_tag: usernameInput.value, email: emailInput.value, password: passwordInput.value });
    }
}

async function handleForgot() {
    const forgotPasswordInput = document.querySelector('.forgot-password-div input');
    const taken = (await isTaken('email', forgotPasswordInput.value)).taken;

    const error = document.querySelector('p.err-login');
    error.style.color = 'orangered';

    error.textContent = '';

    if (!taken) {
        error.textContent = 'That email is not linked with any account. Fill in a correct one.'
    } else {
        account_socket.emit('forgotPass', { email: forgotPasswordInput.value });
        
        error.style.color = 'lime';
        error.textContent = 'Email has been sent. Please check inbox or spam folder.';

        buildMethod('login');
    }
}

async function verifyUser(details) {
    document.querySelector('button.login-btn').id = 'verification';
    const acc = details;
    const code = Math.floor(Math.random() * (900000)) + 999999;

    account_socket.emit('verify', {
        code: code,
        username: acc.user_tag,
        email: acc.email
    });

    const codeInput = document.querySelector('.acc-verification-div input');

    codeInput.parentNode.classList.remove('hidden');
    const loginButton = document.querySelector('button.login-btn');

    const err = document.querySelector('p.err-login');
    err.textContent = '';

    buildMethod('verify');
    codeInput.parentNode.style.display = 'block';
    codeInput.setAttribute('placeholder', 'Loading...');
    codeInput.setAttribute('disabled', '');
    codeInput.style.cursor = 'not-allowed';
    account_socket.on('signup-error', async data => {
        if (data === null){
            codeInput.setAttribute('placeholder', 'Enter 7-digit code');
            codeInput.removeAttribute('disabled');
            codeInput.style.cursor = 'default';
        } else {
            new Alert({
                type: 'error',
                message: 'Something went wrong!',
                expires: false,
                withProgress: false,
                info: false
            });
            const error = document.querySelector('p.err-login');
            error.textContent = 'Something went wrong!';
            error.style.color = 'orangered';
        }
    });

    document.querySelector('div.links-div').style.display = 'none';

    codeInput.addEventListener('input', () => {
        if (codeInput.value.toString() === code.toString()) loginButton.classList.remove('disabled');
        else loginButton.classList.add('disabled');
    });

    loginButton.addEventListener('click', async () => {
        if (codeInput.value.toString() === code.toString()) {

            account_socket.emit('create', {
                created_at: Date.now(),
                user_tag: acc.user_tag,
                password: acc.password,
                email: acc.email
            });

            account_socket.on('success', (res) => {

                localStorage.setItem('token', res.token);
                window.location.href = '/app';
            });
        }
    })
}

async function handle2fa(details) {
    const acc = details;
    const code = Math.floor(Math.random() * (900000)) + 999999;

    account_socket.emit('2fa', {
        code: code,
        username: acc.user_tag,
        email: acc.email,
        method: details.method2fa
    });

    const codeInput = document.querySelector('.acc-verification-div input');

    codeInput.parentNode.classList.remove('hidden');
    const loginButton = document.querySelector('button.login-btn');
    loginButton.id = 'verification';

    const err = document.querySelector('p.err-login');
    err.textContent = '';

    buildMethod('2fa-email');
    codeInput.parentNode.style.display = 'block';
    codeInput.setAttribute('placeholder', 'Loading...');
    codeInput.setAttribute('disabled', '');
    codeInput.style.cursor = 'not-allowed';
    account_socket.on('2fa-error', async data => {
        if (data === null){
            codeInput.setAttribute('placeholder', 'Enter 7-digit code');
            codeInput.removeAttribute('disabled');
            codeInput.style.cursor = 'text';
        } else {
            new Alert({
                type: 'error',
                message: 'Something went wrong!',
                expires: false,
                withProgress: false,
                info: false
            });
            const error = document.querySelector('p.err-login');
            error.textContent = 'Something went wrong!';
            error.style.color = 'orangered';
            console.log(data);
        }
    });

    document.querySelector('div.links-div').style.display = 'none';

    codeInput.addEventListener('input', () => {
        if (codeInput.value.toString() === code.toString()) loginButton.classList.remove('disabled');
        else loginButton.classList.add('disabled');
    });

    function _login(){
        if (codeInput.value.toString() === code.toString()) {
            account_socket.emit('tokenOf', acc.email);
            account_socket.on('token', res => {
                if (res) {
                    localStorage.setItem('token', res);
                    window.location.href = '/app';
                }
                else document.querySelector('p.err-login').textContent = 'An error has occurred while trying to log you in...';
            });
        }
    }

    codeInput.addEventListener('keyup', ev => {
        if (ev.key === 'Enter'){
            _login();
        }
    })

    loginButton.addEventListener('click', async () => {
        _login();
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
    return await req.json();
}