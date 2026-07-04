'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const admin = guardAdmin();
  if (!admin) return;

  document.getElementById('adminEmail').textContent = admin.email;

  try {
    const [statsData, trendData, recentData] = await Promise.all([
      apiFetch('/admin/stats'),
      apiFetch('/admin/trend?days=30'),
      apiFetch('/admin/assessments?limit=8&page=1'),
    ]);

    const s = statsData.stats;
    document.getElementById('statStudents').textContent   = s.total_students   || 0;
    document.getElementById('statAssessments').textContent= s.total_assessments || 0;
    document.getElementById('statAvg').textContent        = s.avg_score         || '0.0';
    document.getElementById('statHigh').textContent       = s.count_high        || 0;

    // Doughnut chart
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: ['Low', 'Moderate', 'High'],
        datasets: [{
          data: [s.count_low || 0, s.count_moderate || 0, s.count_high || 0],
          backgroundColor: ['#198754', '#fd7e14', '#dc3545'],
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 } } },
        },
      },
    });

    // Line trend chart
    const trend    = trendData.trend || [];
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: trend.map((r) => r.day),
        datasets: [
          { label: 'Low',      data: trend.map((r) => r.low),      borderColor: '#198754', tension: 0.3, pointRadius: 3 },
          { label: 'Moderate', data: trend.map((r) => r.moderate), borderColor: '#fd7e14', tension: 0.3, pointRadius: 3 },
          { label: 'High',     data: trend.map((r) => r.high),     borderColor: '#dc3545', tension: 0.3, pointRadius: 3 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { maxTicksLimit: 10, font: { size: 10 } } },
        },
      },
    });

    // Recent assessments table
    const rows = recentData.data || [];
    const tbody = document.getElementById('recentTable');
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No assessments yet.</td></tr>';
    } else {
      tbody.innerHTML = rows.map((a) => `
        <tr>
          <td class="fw-semibold">${a.full_name}</td>
          <td class="text-muted small">${a.email}</td>
          <td class="small">${fmtDate(a.assessment_date)}</td>
          <td><strong>${a.stress_score}</strong></td>
          <td>${stressBadge(a.stress_level)}</td>
        </tr>`).join('');
    }

  } catch (err) {
    console.error('Admin dashboard error:', err);
  }
});
