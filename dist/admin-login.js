let adminRedirectStarted = false;

function openAdmin() {
  if (adminRedirectStarted) return;
  adminRedirectStarted = true;
  window.location.replace('/admin?admin_bust=' + Date.now());
}

// Only auto-redirect to admin if already logged in AND this is not a forced
// fresh login (e.g. after logout, the page is opened with ?fresh=1 to skip
// the auto-session check that caused the "page refresh" symptom).
const urlParams = new URLSearchParams(window.location.search);
const forceFresh = urlParams.has('fresh') || urlParams.has('logout');

if (!forceFresh) {
  fetch('/api/admin?action=session', { credentials: 'include', cache: 'no-store' })
    .then(async function(response) {
      var data = {};
      try { data = await response.json(); } catch(e) {}
      if (response.ok && data && data.ok) {
        openAdmin();
      }
    })
    .catch(function() {});
}

function note(message, good) {
  var box = document.querySelector('[data-admin-login-note]');
  if (!box) return;
  box.textContent = message;
  if (good) {
    box.classList.add('success');
  } else {
    box.classList.remove('success');
  }
}

async function submitAdminLogin(form, event) {
  if (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  var email = (form.querySelector('[name="email"]') || {}).value;
  var password = (form.querySelector('[name="password"]') || {}).value;
  var button = form.querySelector('[data-admin-login-button]');

  email = (email || '').trim().toLowerCase();
  password = password || '';

  if (!email || !password) {
    note('Admin email aur password required hai.');
    return false;
  }

  if (button && button.disabled) return false;
  if (button) {
    button.disabled = true;
    button.textContent = 'Signing in...';
  }

  var response = null;
  try {
    response = await fetch('/api/admin?action=login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
      cache: 'no-store'
    });
  } catch(e) {
    if (button) {
      button.disabled = false;
      button.textContent = 'Sign In';
    }
    note('Network error. Please check your connection and try again.');
    return false;
  }

  var data = {};
  try { data = await response.json(); } catch(e) {}

  if (!response.ok || !data.ok) {
    if (button) {
      button.disabled = false;
      button.textContent = 'Sign In';
    }
    note(data.error || 'Admin login failed. Check your email and password.');
    return false;
  }

  note('Login verified. Checking secure session...', true);

  var sessionResponse = null;
  try {
    sessionResponse = await fetch('/api/admin?action=session&t=' + Date.now(), {
      credentials: 'include',
      cache: 'no-store'
    });
  } catch(e) {}

  var session = {};
  try { session = await sessionResponse.json(); } catch(e) {}

  if (!sessionResponse || !sessionResponse.ok || !session.ok) {
    if (button) {
      button.disabled = false;
      button.textContent = 'Sign In';
    }
    note('Login accepted, but secure session cookie was not saved. Please allow cookies for zavorafashion.com and try again.');
    return false;
  }

  note('Login successful. Opening admin...', true);
  openAdmin();
  return false;
}

// Bind events — script is placed at end of <body> so DOM is ready
(function bindLoginForm() {
  var loginForm = document.querySelector('[data-admin-login-form]');
  if (!loginForm || loginForm.dataset.loginBound === 'true') return;
  loginForm.dataset.loginBound = 'true';

  // Block form submission at every level
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    submitAdminLogin(loginForm, e);
    return false;
  }, true);

  var btn = loginForm.querySelector('[data-admin-login-button]');
  if (btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      submitAdminLogin(loginForm, e);
    });
  }

  loginForm.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    submitAdminLogin(loginForm, e);
  }, true);
})();
