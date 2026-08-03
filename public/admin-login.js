// =====================================================================
// Admin Login — Secure login without session-check loop.
// Login API se ok:true milne par seedha admin panel open karo.
// Admin.js server-side session enforce karta hai.
// =====================================================================

let adminLoginInFlight = false;

function openAdmin() {
  // Small delay ensures Set-Cookie header is processed by the browser
  // before the navigation to /admin begins.
  window.location.href = '/admin';
}

function note(message, good) {
  var box = document.querySelector('[data-admin-login-note]');
  if (!box) return;
  box.textContent = message || '';
  if (good) {
    box.classList.add('success');
    box.classList.remove('error');
  } else {
    box.classList.remove('success');
    if (message) box.classList.add('error');
  }
}

function resetLoginButton() {
  adminLoginInFlight = false;
  var button = document.querySelector('[data-admin-login-button]');
  if (button) {
    button.disabled = false;
    button.textContent = 'Sign In';
  }
}

async function submitAdminLogin(form, event) {
  if (event) {
    event.preventDefault();
    if (event.stopPropagation) event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
  }

  if (!form) {
    form = document.querySelector('[data-admin-login-form]');
  }
  if (!form) return false;

  var emailInput = form.querySelector('[name="email"]');
  var passwordInput = form.querySelector('[name="password"]');
  var button = form.querySelector('[data-admin-login-button]');

  var email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  var password = passwordInput ? passwordInput.value : '';

  if (!email || !password) {
    note('Admin email aur password required hai.');
    return false;
  }

  if (adminLoginInFlight || (button && button.disabled)) return false;
  adminLoginInFlight = true;

  if (button) {
    button.disabled = true;
    button.textContent = 'Signing in...';
  }
  note('Login verify ho raha hai...', true);

  try {
    var response = await fetch('/api/admin?action=login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email: email, password: password }),
      cache: 'no-store'
    });

    var data = {};
    try { data = await response.json(); } catch (e) {}

    if (!response.ok || !data.ok) {
      resetLoginButton();
      note(data.error || 'Login failed. Email aur password check karo.');
      return false;
    }

    // Login succeeded — cookie is set by the API response.
    // Navigate to admin panel. Admin.js will verify session server-side.
    note('Login successful! Admin panel khul raha hai...', true);
    setTimeout(openAdmin, 800);

  } catch (networkErr) {
    resetLoginButton();
    note('Network error. Internet connection check karo aur dobara try karo.');
  }

  return false;
}

// Bind all form events
(function bindLoginForm() {
  var loginForm = document.querySelector('[data-admin-login-form]');
  if (!loginForm) return;
  if (loginForm.dataset.loginBound === 'true') return;
  loginForm.dataset.loginBound = 'true';

  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    submitAdminLogin(loginForm, e);
    return false;
  }, true);

  var btn = loginForm.querySelector('[data-admin-login-button]');
  if (btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      submitAdminLogin(loginForm, e);
    });
  }

  loginForm.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    submitAdminLogin(loginForm, e);
  }, true);
})();
