'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const user = guardStudent();
  if (!user) return;

  document.getElementById('userName').textContent = user.email.split('@')[0];
  document.getElementById('navUser').textContent  = user.email;

  const levelColors = { low: '#198754', moderate: '#fd7e14', high: '#dc3545' };

  try {
    const [latestData, trendData] = await Promise.all([
      apiFetch('/assessment/latest').catch(() => null),
      apiFetch('/assessment/trend?days=30').catch(() => ({ trend: [] })),
    ]);

    if (latestData && latestData.assessment) {
      const a = latestData.assessment;
      document.getElementById('latestScore').textContent = a.stress_score;
      document.getElementById('latestBadge').innerHTML   = stressBadge(a.stress_level);
      document.getElementById('latestDate').textContent  = 'Assessed: ' + fmtDate(a.assessment_date);

      // Show up to 3 recommendations
      const recs = latestData.recommendations || [];
      if (recs.length > 0) {
        document.getElementById('recsSection').style.removeProperty('display');
        document.getElementById('recsPreview').innerHTML = recs.slice(0, 3).map((r) =>
          `<div class="d-flex gap-2 mb-2">
             <i class="bi bi-check-circle-fill text-success mt-1 flex-shrink-0"></i>
             <span class="small">${r.recommendation_text}</span>
           </div>`
        ).join('');
      }
    } else {
      document.getElementById('latestScore').textContent = 'N/A';
      document.getElementById('latestDate').textContent  = 'No assessment yet';
      document.getElementById('firstTimeCard').style.removeProperty('display');
    }

    // Mini trend chart
    const trend = trendData.trend || [];
    if (trend.length > 0) {
      const ctx = document.getElementById('miniTrendChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: trend.map((r) => r.day),
          datasets: [{
            data: trend.map((r) => r.avg_score),
            borderColor: '#6f42c1',
            backgroundColor: 'rgba(111,66,193,.1)',
            borderWidth: 2,
            pointRadius: 3,
            fill: true,
            tension: 0.35,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: {
            callbacks: { label: (ctx) => `Score: ${ctx.raw}` }
          }},
          scales: {
            y: { min: 0, max: 40, ticks: { stepSize: 10 }, grid: { color: 'rgba(0,0,0,.05)' } },
            x: { ticks: { maxTicksLimit: 7, font: { size: 10 } } },
          },
        },
      });
    } else {
      document.querySelector('.chart-container').innerHTML =
        '<p class="text-muted small text-center pt-5">No trend data yet.</p>';
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
});
