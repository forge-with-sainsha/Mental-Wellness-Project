'use strict';

const RANGE_LABELS = {
  low:      'Score 0–13 · You are managing stress well.',
  moderate: 'Score 14–26 · Some stress-reduction strategies are recommended.',
  high:     'Score 27–40 · Please consider seeking additional support.',
};

const ICONS = {
  low:      'bi-emoji-smile-fill text-success',
  moderate: 'bi-emoji-neutral-fill text-warning',
  high:     'bi-emoji-frown-fill text-danger',
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!guardStudent()) return;

  try {
    const data = await apiFetch('/assessment/latest');

    document.getElementById('loadingState').classList.add('d-none');

    if (!data || !data.assessment) {
      document.getElementById('noResults').classList.remove('d-none');
      return;
    }

    const a = data.assessment;
    const level = a.stress_level;

    document.getElementById('resultsContent').classList.remove('d-none');
    document.getElementById('scoreValue').textContent  = a.stress_score;
    document.getElementById('scoreValue').style.color  =
      level === 'low' ? '#198754' : level === 'moderate' ? '#fd7e14' : '#dc3545';
    document.getElementById('levelBadge').innerHTML    = stressBadge(level);
    document.getElementById('scoreDate').textContent   = 'Assessed on ' + fmtDate(a.assessment_date);
    document.getElementById('scoreRange').innerHTML    =
      `<i class="bi ${ICONS[level]} me-1"></i>${RANGE_LABELS[level]}`;

    const recs = data.recommendations || [];
    document.getElementById('recommendationsList').innerHTML =
      recs.length === 0
        ? '<p class="text-muted">No recommendations available for your stress level.</p>'
        : recs.map((r, idx) => `
            <div class="card rec-card ${level} border p-3 mb-3">
              <div class="d-flex gap-3 align-items-start">
                <div class="fw-bold text-muted" style="min-width:1.5rem">${idx + 1}.</div>
                <div>${r.recommendation_text}</div>
              </div>
            </div>`).join('');

  } catch (err) {
    if (err && err.status === 404) {
      document.getElementById('loadingState').classList.add('d-none');
      document.getElementById('noResults').classList.remove('d-none');
    } else {
      document.getElementById('loadingState').innerHTML =
        '<p class="text-danger">Failed to load results. Please try again.</p>';
    }
  }
});
