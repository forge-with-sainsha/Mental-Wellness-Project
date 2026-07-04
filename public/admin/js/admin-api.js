'use strict';

const BASE            = '/api';
const ADMIN_TOKEN_KEY = 'mw_admin_token';
const ADMIN_LOGIN     = '/admin/login.html';

/* ── Token management ────────────────────────────────────────────────────── */
function getToken()   { return localStorage.getItem(ADMIN_TOKEN_KEY); }
function setToken(t)  { localStorage.setItem(ADMIN_TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(ADMIN_TOKEN_KEY); }

/* ── Decode JWT payload ──────────────────────────────────────────────────── */
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/* ── Auth guard ──────────────────────────────────────────────────────────── */
function guardAdmin() {
  const token = getToken();
  if (!token) { window.location.replace(ADMIN_LOGIN); return null; }

  const payload = decodeToken(token);
  if (!payload || payload.exp * 1000 < Date.now() || payload.role !== 'admin') {
    clearToken();
    window.location.replace(ADMIN_LOGIN);
    return null;
  }
  return payload;
}

/* ── Logout ──────────────────────────────────────────────────────────────── */
function logout() {
  clearToken();
  window.location.replace(ADMIN_LOGIN);
}

/* ── Central fetch helper ────────────────────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res  = await fetch(BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    clearToken();
    window.location.replace(ADMIN_LOGIN);
    return null;
  }

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed.');
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return data;
}

/* ── Badge helper ────────────────────────────────────────────────────────── */
function stressBadge(level) {
  const labels = { low: 'Low', moderate: 'Moderate', high: 'High' };
  return `<span class="badge badge-${level} px-2 py-1">${labels[level] || level}</span>`;
}

/* ── Format date ─────────────────────────────────────────────────────────── */
function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── Show toast notification ─────────────────────────────────────────────── */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const id = `toast-${Date.now()}`;
  const bg = type === 'success' ? 'bg-success' : 'bg-danger';
  container.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center text-white ${bg} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`);
  const el = document.getElementById(id);
  new bootstrap.Toast(el, { delay: 3000 }).show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}
