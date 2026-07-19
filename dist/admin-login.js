const ADMIN_SESSION_KEY = 'zavoraAdminSession';

fetch('/api/admin?action=session')
  .then((response) => response.json())
  .then((data) => {
    if (data?.ok) window.location.href = 'admin.html';
  })
  .catch(() => {});

function note(message, good = false) {
  const box = document.querySelector('[data-admin-login-note]');
  if (!box) return;
  box.textContent = message;
  box.classList.toggle('success', good);
}

function renderOtpStep(form, challenge, email) {
  form.innerHTML = `
    <input inputmode="numeric" maxlength="6" placeholder="6-digit OTP" autocomplete="one-time-code" required>
    <button class="primary-admin" type="submit">Verify OTP</button>
    <button class="admin-link-btn" type="button" data-admin-resend>Resend OTP</button>
    <p class="admin-login-note" data-admin-login-note>OTP sent from support@zavorafashion.com to ${email}.</p>
  `;
  form.dataset.challenge = challenge;
  form.dataset.email = email;
  form.dataset.step = 'otp';
}

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-admin-login-form]');
  if (!form) return;
  event.preventDefault();

  if (form.dataset.step === 'otp') {
    const otp = form.querySelector('input')?.value.trim();
    if (!otp || otp.length !== 6) {
      note('Enter the 6-digit OTP.');
      return;
    }
    const button = form.querySelector('.primary-admin');
    button.textContent = 'Verifying...';
    const response = await fetch('/api/admin?action=verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp, challenge: form.dataset.challenge })
    }).catch(() => null);
    const data = await response?.json().catch(() => ({}));
    if (!response?.ok) {
      button.textContent = 'Verify OTP';
      note(data.error || 'Invalid OTP.');
      return;
    }
    localStorage.setItem(ADMIN_SESSION_KEY, data.session);
    window.location.href = 'admin.html';
    return;
  }

  const inputs = [...form.querySelectorAll('input')];
  const email = inputs[0]?.value.trim().toLowerCase();
  const password = inputs[1]?.value;
  if (!email || !password) {
    note('Admin email and password are required.');
    return;
  }
  const button = form.querySelector('.primary-admin');
  button.textContent = 'Sending OTP...';
  const response = await fetch('/api/admin?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).catch(() => null);
  const data = await response?.json().catch(() => ({}));
  if (!response?.ok) {
    button.textContent = 'Send OTP';
    note(data.error || 'Admin login failed.');
    return;
  }
  if (data.passwordOnly) {
    window.location.href = 'admin.html';
    return;
  }
  renderOtpStep(form, data.challenge, email);
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('[data-admin-resend]')) return;
  window.location.reload();
});
