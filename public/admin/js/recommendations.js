'use strict';

let activeLevel  = '';
let deleteTarget = null;
let deleteModal;

document.addEventListener('DOMContentLoaded', async () => {
  if (!guardAdmin()) return;

  deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

  await loadRecommendations('');

  // Tab switching
  document.getElementById('levelTabs').addEventListener('click', (e) => {
    e.preventDefault();
    const link = e.target.closest('a[data-level]');
    if (!link) return;
    document.querySelectorAll('#levelTabs .nav-link').forEach((l) => l.classList.remove('active'));
    link.classList.add('active');
    activeLevel = link.dataset.level;
    loadRecommendations(activeLevel);
  });

  // Char counter
  const textarea = document.getElementById('newText');
  textarea.addEventListener('input', () => {
    document.getElementById('charCount').textContent = textarea.value.length;
  });

  // Add form
  document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alert = document.getElementById('formAlert');
    alert.classList.add('d-none');

    const stress_level       = document.getElementById('newLevel').value;
    const recommendation_text = document.getElementById('newText').value.trim();

    if (!stress_level)          return showFormAlert('Please select a stress level.', 'danger');
    if (!recommendation_text)   return showFormAlert('Recommendation text is required.', 'danger');
    if (recommendation_text.length > 1000) return showFormAlert('Text must not exceed 1000 characters.', 'danger');

    const addBtn  = document.getElementById('addBtn');
    const addTxt  = document.getElementById('addBtnText');
    const addSpin = document.getElementById('addSpinner');
    addBtn.disabled = true;
    addTxt.innerHTML = 'Adding…';
    addSpin.classList.remove('d-none');

    try {
      await apiFetch('/admin/recommendations', {
        method: 'POST',
        body: JSON.stringify({ stress_level, recommendation_text }),
      });
      document.getElementById('addForm').reset();
      document.getElementById('charCount').textContent = '0';
      showFormAlert('Recommendation added!', 'success');
      await loadRecommendations(activeLevel);
    } catch (err) {
      showFormAlert(err.message || 'Failed to add recommendation.', 'danger');
    } finally {
      addBtn.disabled = false;
      addTxt.innerHTML = '<i class="bi bi-plus me-1"></i>Add Recommendation';
      addSpin.classList.add('d-none');
    }
  });

  // Delete confirm
  document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!deleteTarget) return;
    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true;
    btn.textContent = 'Deleting…';

    try {
      await apiFetch(`/admin/recommendations/${deleteTarget}`, { method: 'DELETE' });
      deleteModal.hide();
      showToast('Recommendation deleted.');
      await loadRecommendations(activeLevel);
    } catch (err) {
      showToast(err.message || 'Delete failed.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  });
});

async function loadRecommendations(level) {
  const list = document.getElementById('recsList');
  list.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-purple"></div></div>';

  try {
    const qs   = level ? `?level=${level}` : '';
    const data = await apiFetch(`/admin/recommendations${qs}`);
    const recs = data.recommendations || [];

    document.getElementById('recCount').textContent = `${recs.length} recommendation(s)`;

    if (recs.length === 0) {
      list.innerHTML = '<p class="text-muted text-center py-3">No recommendations for this level.</p>';
      return;
    }

    list.innerHTML = recs.map((r) => `
      <div class="card rec-card ${r.stress_level} border mb-2 p-3">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            ${stressBadge(r.stress_level)}
            <p class="mb-0 mt-2 small">${r.recommendation_text}</p>
          </div>
          <button class="btn btn-outline-danger btn-sm flex-shrink-0"
                  onclick="confirmDelete(${r.recommendation_id})">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </div>`).join('');
  } catch (err) {
    list.innerHTML = `<p class="text-danger small">${err.message}</p>`;
  }
}

function confirmDelete(id) {
  deleteTarget = id;
  deleteModal.show();
}

function showFormAlert(msg, type) {
  const el = document.getElementById('formAlert');
  el.textContent = msg;
  el.className = `alert alert-${type} py-2`;
}
