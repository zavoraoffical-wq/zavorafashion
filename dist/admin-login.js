// =====================================================================
// Admin Login — NO auto-redirect. Only explicit Sign In button triggers
// authentication. This prevents the refresh/redirect loop caused by
// stale session cookies or failed API responses.
// =====================================================================

function openAdmin() {
  window.location.replace('/admin');
}

function note(message, good) {
  var box = document.querySelector('[data-admin-login-note]');
  if (!box) return;
  box.textContent = message;
  if (good) {
    box.classList.add('success');
    box.classList.remove('error');
  } else {
    box.classList.remove('success');
    box.classList.add('error');
  }
}

async function submitAdminLogin(form, event) {
  if (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  var emailInput = form.querySelector('[name="email"]');
  var passwordInput = form.querySelector('[name="password"]');
  var button = form.querySelector('[data-admin-login-button]');

  var email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  var password = passwordInput ? passwordInput.value : '';

  if (!email || !password) {
    note('Admin email aur password required hai.');
    return false;
  }

  if (button && button.disabled) return false;

  if (button) {
    button.disabled = true;
    button.textContent = 'Signing in...';
  }

  // Step 1: POST login credentials
  var response = null;
  try {
    response = await fetch('/api/admin?action=login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
      cache: 'no-store'
    });
  } catch (networkErr) {
    if (button) {
      button.disabled = false;
      button.textContent = 'Sign In';
    }
    note('Network error. Internet connection check karo aur dobara try karo.');
    return false;
  }

  var data = {};
  try { data = await response.json(); } catch (e) {}

  if (!response.ok || !data.ok) {
    if (button) {
      button.disabled = false;
      button.textContent = 'Sign In';
    }
    note(data.error || 'Login failed. Email aur password check karo.');
    return false;
  }

  note('Login verified. Session check ho raha hai...', true);

  // Step 2: Verify session cookie was actually set
  var sessionResp = null;
  try {
    sessionResp = await fetch('/api/admin?action=session&t=' + Date.now(), {
      credentials: 'include',
      cache: 'no-store'
    });
  } catch (e) {}

  var session = {};
  try { session = await sessionResp.json(); } catch (e) {}

  if (!sessionResp || !sessionResp.ok || !session.ok) {
    if (button) {
      button.disabled = false;
      button.textContent = 'Sign In';
    }
    note('Session cookie save nahi hua. zavorafashion.com ke liye cookies allow karo aur dobara try karo.');
    return false;
  }

  note('Login successful! Admin panel khul raha hai...', true);
  setTimeout(openAdmin, 500);
  return false;
}

// Bind all form events — script placed at end of body, DOM is fully ready
(function bindLoginForm() {
  var loginForm = document.querySelector('[data-admin-login-form]');
  if (!loginForm) return;
  if (loginForm.dataset.loginBound === 'true') return;
  loginForm.dataset.loginBound = 'true';

  // Block ALL form submit events at capture phase
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    submitAdminLogin(loginForm, e);
    return false;
  }, true);

  // Sign In button click
  var btn = loginForm.querySelector('[data-admin-login-button]');
  if (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      submitAdminLogin(loginForm, e);
    });
  }

  // Enter key in any field
  loginForm.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    submitAdminLogin(loginForm, e);
  }, true);
})();
