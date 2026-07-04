'use strict';

const LIMIT = 20;
let currentPage = 1;
let searchQuery = '';
let levelFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
  if (!guardAdmin()) return;

  await loadAssessments(1);

  let timer;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      loadAssessments(1);
    }, 400);
  });

  document.getElementById('levelFilter').addEventListener('change', (e) => {
    levelFilter = e.target.value;
    loadAssessments(1);
  });
});

async function loadAssessments(page) {
  currentPage = page;
  const tbody = document.getElementById('assessmentsTable');
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">
    <div class="spinner-border spinner-border-sm text-purple me-2"></div>Loading…
  </td></tr>`;

  try {
    const qs   = new URLSearchParams({ search: searchQuery, level: levelFilter, page, limit: LIMIT });
    const data = await apiFetch(`/admin/assessments?${qs}`);
    const rows = data.data || [];

    document.getElementById('resultSummary').textContent =
      `Showing ${rows.length} of ${data.total} assessment(s)`;

    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No assessments found.</td></tr>';
      document.getElementById('paginationNav').classList.add('d-none');
      return;
    }

    tbody.innerHTML = rows.map((a, idx) => `
      <tr>
        <td class="text-muted small">${(page - 1) * LIMIT + idx + 1}</td>
        <td class="fw-semibold">${a.full_name}</td>
        <td class="text-muted small">${a.email}</td>
        <td class="small">${fmtDate(a.assessment_date)}</td>
        <td><strong>${a.stress_score}</strong> <span class="text-muted small">/ 40</span></td>
        <td>${stressBadge(a.stress_level)}</td>
      </tr>`).join('');

    renderPagination(data.totalPages, page);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">${err.message}</td></tr>`;
  }
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('levelFilter').value = '';
  searchQuery = '';
  levelFilter = '';
  loadAssessments(1);
}

function renderPagination(totalPages, activePage) {
  const nav  = document.getElementById('paginationNav');
  const list = document.getElementById('paginationList');
  if (totalPages <= 1) { nav.classList.add('d-none'); return; }
  nav.classList.remove('d-none');

  let html = `<li class="page-item ${activePage===1?'disabled':''}">
    <a class="page-link" href="#" onclick="loadAssessments(${activePage-1});return false;">
      <i class="bi bi-chevron-left"></i>
    </a></li>`;
  for (let p = 1; p <= totalPages; p++) {
    html += `<li class="page-item ${p===activePage?'active':''}">
      <a class="page-link" href="#" onclick="loadAssessments(${p});return false;">${p}</a></li>`;
  }
  html += `<li class="page-item ${activePage===totalPages?'disabled':''}">
    <a class="page-link" href="#" onclick="loadAssessments(${activePage+1});return false;">
      <i class="bi bi-chevron-right"></i>
    </a></li>`;
  list.innerHTML = html;
}
