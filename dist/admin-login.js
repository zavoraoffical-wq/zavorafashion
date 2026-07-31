let adminRedirectStarted = false;

function openAdmin() {
  if (adminRedirectStarted) return;
  adminRedirectStarted = true;
  window.location.replace(`/admin.html?admin_bust=${Date.now()}`);
}

fetch('/api/admin?action=session', { credentials: 'include', cache: 'no-store' })
  .then(async (response) => ({ response, data: await response.json().catch(() => ({})) }))
  .then(({ response, data }) => {
    if (response.ok && data?.ok) openAdmin();
  })
  .catch(() => {});

function note(message, good = false) {
  const box = document.querySelector('[data-admin-login-note]');
  if (!box) return;
  box.textContent = message;
  box.classList.toggle('success', good);
}

async function submitAdminLogin(form) {
  const email = form.querySelector('[name="email"]')?.value.trim().toLowerCase();
  const password = form.querySelector('[name="password"]')?.value;
  const button = form.querySelector('[data-admin-login-button]');
  if (!email || !password) {
    note('Admin email aur password required hai.');
    return;
  }

  if (button?.disabled) return;
  if (button) {
    button.disabled = true;
    button.textContent = 'Signing in...';
  }
  const response = await fetch('/api/admin?action=login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store'
  }).catch(() => null);
  const data = await response?.json().catch(() => ({}));
  if (!response?.ok || !data?.ok) {
    if (button) {
      button.disabled = false;
      button.textContent = 'Sign In';
    }
    note(data.error || 'Admin login failed.');
    return;
  }

  note('Login verified. Checking secure session...', true);
  const sessionResponse = await fetch(`/api/admin?action=session&t=${Date.now()}`, {
    credentials: 'include',
    cache: 'no-store'
  }).catch(() => null);
  const session = await sessionResponse?.json().catch(() => ({}));
  if (!sessionResponse?.ok || !session?.ok) {
    if (button) {
      button.disabled = false;
      button.textContent = 'Sign In';
    }
    note('Login accepted, but secure session cookie was not saved. Please allow cookies for zavorafashion.com and try again.');
    return;
  }

  note('Login successful. Opening admin...', true);
  openAdmin();
}

const loginForm = document.querySelector('[data-admin-login-form]');
if (loginForm && loginForm.dataset.loginBound !== 'true') {
  loginForm.dataset.loginBound = 'true';
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    submitAdminLogin(loginForm);
  }, true);
  loginForm.querySelector('[data-admin-login-button]')?.addEventListener('click', (event) => {
    event.preventDefault();
    submitAdminLogin(loginForm);
  });
  loginForm.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    submitAdminLogin(loginForm);
  }, true);
}
