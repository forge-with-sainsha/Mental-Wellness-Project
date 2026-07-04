'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Already logged in as admin → redirect
  const token = getToken();
  if (token) {
    const payload = decodeToken(token);
    if (payload && payload.exp * 1000 > Date.now() && payload.role === 'admin') {
      window.location.replace('/admin/dashboard.html');
      return;
    }
    clearToken();
  }

  const form      = document.getElementById('adminLoginForm');
  const alertBox  = document.getElementById('alertBox');
  const btnText   = document.getElementById('btnText');
  const btnSpinner= document.getElementById('btnSpinner');
  const submitBtn = document.getElementById('submitBtn');

  document.getElementById('togglePwd').addEventListener('click', () => {
    const pwd = document.getElementById('password');
    const icon = document.querySelector('#togglePwd i');
    if (pwd.type === 'password') { pwd.type = 'text'; icon.className = 'bi bi-eye-slash'; }
    else { pwd.type = 'password'; icon.className = 'bi bi-eye'; }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.classList.add('d-none');

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      alertBox.textContent = 'Please enter your admin email and password.';
      alertBox.classList.remove('d-none');
      return;
    }

    submitBtn.disabled = true;
    btnText.innerHTML  = 'Signing in…';
    btnSpinner.classList.remove('d-none');

    try {
      const data = await apiFetch('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      window.location.replace('/admin/dashboard.html');
    } catch (err) {
      alertBox.textContent = err.message || 'Login failed.';
      alertBox.classList.remove('d-none');
    } finally {
      submitBtn.disabled = false;
      btnText.innerHTML  = '<i class="bi bi-shield-check me-1"></i>Sign In';
      btnSpinner.classList.add('d-none');
    }
  });
});
