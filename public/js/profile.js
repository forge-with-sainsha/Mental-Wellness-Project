'use strict';

function showAlert(id, msg, type = 'success') {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `alert alert-${type} py-2`;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!guardStudent()) return;

  // Load current profile
  try {
    const data = await apiFetch('/auth/me');
    const u    = data.user;
    document.getElementById('fullName').value    = u.full_name;
    document.getElementById('email').value       = u.email;
    document.getElementById('memberSince').textContent = new Date(u.created_at).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch {
    showAlert('profileAlert', 'Failed to load profile.', 'danger');
  }

  // ── Profile form ──────────────────────────────────────────────────────────
  const profileForm   = document.getElementById('profileForm');
  const profileBtn    = document.getElementById('profileBtn');
  const profileBtnTxt = document.getElementById('profileBtnText');
  const profileSpin   = document.getElementById('profileSpinner');

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('profileAlert').classList.add('d-none');

    const full_name = document.getElementById('fullName').value.trim();
    const email     = document.getElementById('email').value.trim();

    if (!full_name) return showAlert('profileAlert', 'Full name is required.', 'danger');
    if (!email)     return showAlert('profileAlert', 'Email is required.', 'danger');

    profileBtn.disabled    = true;
    profileBtnTxt.textContent = 'Saving…';
    profileSpin.classList.remove('d-none');

    try {
      await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify({ full_name, email }),
      });
      showAlert('profileAlert', 'Profile updated successfully.', 'success');
    } catch (err) {
      showAlert('profileAlert', err.message || 'Update failed.', 'danger');
    } finally {
      profileBtn.disabled = false;
      profileBtnTxt.textContent = 'Save Changes';
      profileSpin.classList.add('d-none');
    }
  });

  // ── Password form ─────────────────────────────────────────────────────────
  const pwdForm   = document.getElementById('pwdForm');
  const pwdBtn    = document.getElementById('pwdBtn');
  const pwdBtnTxt = document.getElementById('pwdBtnText');
  const pwdSpin   = document.getElementById('pwdSpinner');

  pwdForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('pwdAlert').classList.add('d-none');

    const current_password = document.getElementById('currentPwd').value;
    const new_password     = document.getElementById('newPwd').value;
    const confirm          = document.getElementById('confirmPwd').value;

    if (!current_password) return showAlert('pwdAlert', 'Enter your current password.', 'danger');
    if (!PWD_RE.test(new_password)) {
      return showAlert('pwdAlert', 'New password must be 8+ chars with uppercase, number, and special character.', 'danger');
    }
    if (new_password !== confirm) return showAlert('pwdAlert', 'Passwords do not match.', 'danger');

    pwdBtn.disabled    = true;
    pwdBtnTxt.textContent = 'Updating…';
    pwdSpin.classList.remove('d-none');

    try {
      await apiFetch('/profile/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password, new_password }),
      });
      showAlert('pwdAlert', 'Password updated. You will be logged out.', 'success');
      pwdForm.reset();
      setTimeout(logout, 2000);
    } catch (err) {
      showAlert('pwdAlert', err.message || 'Password change failed.', 'danger');
    } finally {
      pwdBtn.disabled = false;
      pwdBtnTxt.textContent = 'Update Password';
      pwdSpin.classList.add('d-none');
    }
  });
});
