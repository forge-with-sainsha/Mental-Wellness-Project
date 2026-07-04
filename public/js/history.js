'use strict';

const LIMIT = 10;
let currentPage = 1;
let trendChart  = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!guardStudent()) return;

  await Promise.all([loadTrend(), loadHistory(1)]);
});

async function loadTrend() {
  try {
    const data  = await apiFetch('/assessment/trend?days=30');
    const trend = data.trend || [];

    const ctx = document.getElementById('trendChart').getContext('2d');

    if (trend.length === 0) {
      document.querySelector('.chart-container').innerHTML =
        '<p class="text-muted small text-center pt-4">No data in the last 30 days.</p>';
      return;
    }

    const colorMap = { low: '#198754', moderate: '#fd7e14', high: '#dc3545' };

    // Group by day for the chart (use avg_score per day)
    const byDay = {};
    trend.forEach((r) => {
      if (!byDay[r.day]) byDay[r.day] = { total: 0, count: 0 };
      byDay[r.day].total += Number(r.avg_score);
      byDay[r.day].count += 1;
    });

    const days   = Object.keys(byDay).sort();
    const scores = days.map((d) => (byDay[d].total / byDay[d].count).toFixed(1));

    if (trendChart) trendChart.destroy();
    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'Avg Stress Score',
          data: scores,
          borderColor: '#6f42c1',
          backgroundColor: 'rgba(111,66,193,.1)',
          borderWidth: 2,
          pointRadius: 4,
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `Score: ${ctx.raw}` } },
        },
        scales: {
          y: {
            min: 0, max: 40,
            ticks: { stepSize: 10 },
            grid: { color: 'rgba(0,0,0,.05)' },
          },
          x: { ticks: { maxTicksLimit: 10, font: { size: 11 } } },
        },
      },
    });
  } catch (err) {
    console.error('Trend load error:', err);
  }
}

async function loadHistory(page) {
  currentPage = page;
  const tbody = document.getElementById('historyTableBody');
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3">
    <div class="spinner-border spinner-border-sm text-purple me-2"></div>Loading…
  </td></tr>`;

  try {
    const data = await apiFetch(`/assessment/history?page=${page}&limit=${LIMIT}`);
    const rows = data.data || [];

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">
        No assessments yet. <a href="/assessment.html">Take your first one!</a>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((a, idx) => `
      <tr>
        <td class="text-muted small">${(page - 1) * LIMIT + idx + 1}</td>
        <td>${fmtDate(a.assessment_date)}</td>
        <td><strong>${a.stress_score}</strong> <span class="text-muted small">/ 40</span></td>
        <td>${stressBadge(a.stress_level)}</td>
        <td><a href="/results.html" class="btn btn-outline-primary btn-sm">View Tips</a></td>
      </tr>`).join('');

    renderPagination(data.totalPages, page);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">Failed to load history.</td></tr>`;
  }
}

function renderPagination(totalPages, activePage) {
  const nav  = document.getElementById('paginationNav');
  const list = document.getElementById('paginationList');

  if (totalPages <= 1) { nav.classList.add('d-none'); return; }
  nav.classList.remove('d-none');

  let html = `
    <li class="page-item ${activePage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="loadHistory(${activePage - 1});return false;">
        <i class="bi bi-chevron-left"></i>
      </a>
    </li>`;

  for (let p = 1; p <= totalPages; p++) {
    html += `<li class="page-item ${p === activePage ? 'active' : ''}">
      <a class="page-link" href="#" onclick="loadHistory(${p});return false;">${p}</a>
    </li>`;
  }

  html += `
    <li class="page-item ${activePage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="loadHistory(${activePage + 1});return false;">
        <i class="bi bi-chevron-right"></i>
      </a>
    </li>`;

  list.innerHTML = html;
}
