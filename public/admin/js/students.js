'use strict';

const LIMIT = 20;
let currentPage  = 1;
let searchQuery  = '';
let deleteTarget = null;

let deleteModal;
let deleteModalEl;

document.addEventListener('DOMContentLoaded', async () => {
  if (!guardAdmin()) return;

  deleteModalEl = document.getElementById('deleteModal');
  deleteModal   = new bootstrap.Modal(deleteModalEl);

  await loadStudents(1);

  // Debounced search
  let timer;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchQuery  = e.target.value.trim();
      currentPage  = 1;
      loadStudents(1);
    }, 400);
  });

  document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!deleteTarget) return;
    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true;
    btn.textContent = 'Deleting…';

    try {
      await apiFetch(`/admin/students/${deleteTarget.id}`, { method: 'DELETE' });
      deleteModal.hide();
      showToast(`${deleteTarget.name} has been deleted.`);
      await loadStudents(currentPage);
    } catch (err) {
      showToast(err.message || 'Delete failed.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  });
});

async function loadStudents(page) {
  currentPage = page;
  const tbody = document.getElementById('studentsTable');
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">
    <div class="spinner-border spinner-border-sm text-purple me-2"></div>Loading…
  </td></tr>`;

  try {
    const qs   = new URLSearchParams({ search: searchQuery, page, limit: LIMIT });
    const data = await apiFetch(`/admin/students?${qs}`);
    const rows = data.data || [];

    document.getElementById('resultSummary').textContent =
      `Showing ${rows.length} of ${data.total} student(s)`;

    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No students found.</td></tr>';
      document.getElementById('paginationNav').classList.add('d-none');
      return;
    }

    tbody.innerHTML = rows.map((u, idx) => `
      <tr>
        <td class="text-muted small">${(page - 1) * LIMIT + idx + 1}</td>
        <td class="fw-semibold">${u.full_name}</td>
        <td class="text-muted">${u.email}</td>
        <td class="small">${new Date(u.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</td>
        <td class="text-end">
          <button class="btn btn-outline-danger btn-sm"
                  onclick="confirmDelete(${u.user_id}, '${u.full_name.replace(/'/g,"\\'")}')">
            <i class="bi bi-trash3 me-1"></i>Delete
          </button>
        </td>
      </tr>`).join('');

    renderPagination(data.totalPages, page);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">${err.message}</td></tr>`;
  }
}

function confirmDelete(id, name) {
  deleteTarget = { id, name };
  document.getElementById('deleteStudentName').textContent = name;
  deleteModal.show();
}

function renderPagination(totalPages, activePage) {
  const nav  = document.getElementById('paginationNav');
  const list = document.getElementById('paginationList');
  if (totalPages <= 1) { nav.classList.add('d-none'); return; }
  nav.classList.remove('d-none');

  let html = `<li class="page-item ${activePage===1?'disabled':''}">
    <a class="page-link" href="#" onclick="loadStudents(${activePage-1});return false;">
      <i class="bi bi-chevron-left"></i>
    </a></li>`;
  for (let p = 1; p <= totalPages; p++) {
    html += `<li class="page-item ${p===activePage?'active':''}">
      <a class="page-link" href="#" onclick="loadStudents(${p});return false;">${p}</a></li>`;
  }
  html += `<li class="page-item ${activePage===totalPages?'disabled':''}">
    <a class="page-link" href="#" onclick="loadStudents(${activePage+1});return false;">
      <i class="bi bi-chevron-right"></i>
    </a></li>`;
  list.innerHTML = html;
}
