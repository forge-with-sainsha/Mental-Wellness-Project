'use strict';

const BASE       = '/api';
const TOKEN_KEY  = 'mw_token';
const LOGIN_PAGE = '/index.html';

/* ── Token management ────────────────────────────────────────────────────── */
function getToken()    { return localStorage.getItem(TOKEN_KEY); }
function setToken(t)   { localStorage.setItem(TOKEN_KEY, t); }
function clearToken()  { localStorage.removeItem(TOKEN_KEY); }

/* ── Decode JWT payload (client-side, no verification) ───────────────────── */
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/* ── Auth guard — call at top of every protected student page ────────────── */
function guardStudent() {
  const token = getToken();
  if (!token) { window.location.replace(LOGIN_PAGE); return null; }

  const payload = decodeToken(token);
  if (!payload || payload.exp * 1000 < Date.now() || payload.role !== 'student') {
    clearToken();
    window.location.replace(LOGIN_PAGE);
    return null;
  }
  return payload;
}

/* ── Logout ──────────────────────────────────────────────────────────────── */
function logout() {
  clearToken();
  window.location.replace(LOGIN_PAGE);
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
    window.location.replace(LOGIN_PAGE);
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
  return `<span class="badge badge-${level} px-3 py-2 fs-6">${labels[level] || level}</span>`;
}

/* ── Format date ─────────────────────────────────────────────────────────── */
function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
