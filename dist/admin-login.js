fetch('/api/admin?action=session', { credentials: 'include' })
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

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-admin-login-form]');
  if (!form) return;
  event.preventDefault();

  const email = form.querySelector('[name="email"]')?.value.trim().toLowerCase();
  const password = form.querySelector('[name="password"]')?.value;
  const button = form.querySelector('.primary-admin');
  if (!email || !password) {
    note('Admin email aur password required hai.');
    return;
  }

  button.disabled = true;
  button.textContent = 'Signing in...';
  const response = await fetch('/api/admin?action=login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).catch(() => null);
  const data = await response?.json().catch(() => ({}));
  if (!response?.ok || !data?.ok) {
    button.disabled = false;
    button.textContent = 'Sign In';
    note(data.error || 'Admin login failed.');
    return;
  }

  note('Login successful. Opening admin...', true);
  window.location.href = 'admin.html';
});
