'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form         = document.getElementById('registerForm');
  const alertBox     = document.getElementById('alertBox');
  const btnText      = document.getElementById('btnText');
  const btnSpinner   = document.getElementById('btnSpinner');
  const submitBtn    = document.getElementById('submitBtn');

  document.getElementById('togglePwd').addEventListener('click', () => {
    const pwd  = document.getElementById('password');
    const icon = document.querySelector('#togglePwd i');
    if (pwd.type === 'password') { pwd.type = 'text'; icon.className = 'bi bi-eye-slash'; }
    else { pwd.type = 'password'; icon.className = 'bi bi-eye'; }
  });

  function showAlert(msg, type = 'danger') {
    alertBox.textContent = msg;
    alertBox.className = `alert alert-${type} py-2`;
  }

  const PWD_RE = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const full_name = document.getElementById('fullName').value.trim();
    const email     = document.getElementById('email').value.trim();
    const password  = document.getElementById('password').value;
    const confirm   = document.getElementById('confirmPassword').value;

    if (!full_name) return showAlert('Full name is required.');
    if (!email)     return showAlert('Email is required.');
    if (!PWD_RE.test(password)) {
      return showAlert('Password must be at least 8 characters and include an uppercase letter, number, and special character.');
    }
    if (password !== confirm) return showAlert('Passwords do not match.');

    submitBtn.disabled = true;
    btnText.textContent = 'Creating account…';
    btnSpinner.classList.remove('d-none');

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name, email, password }),
      });
      setToken(data.token);
      window.location.replace('/dashboard.html');
    } catch (err) {
      showAlert(err.message || 'Registration failed.');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Create Account';
      btnSpinner.classList.add('d-none');
    }
  });
});
