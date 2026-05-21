// ===== ANALYTICS CHARTS (Chart.js) =====
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/admin/analytics/data');
    const data = await res.json();

    const colors = ['#6366f1','#a78bfa','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6'];
    const gridColor = 'rgba(255,255,255,0.06)';
    const tickColor = '#94a3b8';
    const defaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: tickColor, font: { family: 'Inter' } } } },
      scales: {
        x: { ticks: { color: tickColor }, grid: { color: gridColor } },
        y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true }
      }
    };

    // Registrations per event
    new Chart(document.getElementById('regPerEvent'), {
      type: 'bar',
      data: { labels: data.regPerEvent.labels, datasets: [{ label: 'Registrations', data: data.regPerEvent.data, backgroundColor: colors.slice(0, data.regPerEvent.labels.length), borderRadius: 6 }] },
      options: { ...defaults, plugins: { ...defaults.plugins, legend: { display: false } } }
    });

    // Revenue per event
    new Chart(document.getElementById('revenuePerEvent'), {
      type: 'bar',
      data: { labels: data.revenuePerEvent.labels, datasets: [{ label: 'Revenue (₹)', data: data.revenuePerEvent.data, backgroundColor: '#10b981', borderRadius: 6 }] },
      options: { ...defaults, plugins: { ...defaults.plugins, legend: { display: false } } }
    });

    // Registrations over time
    new Chart(document.getElementById('regsOverTime'), {
      type: 'line',
      data: { labels: data.regsOverTime.labels, datasets: [{ label: 'Registrations', data: data.regsOverTime.data, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#6366f1' }] },
      options: defaults
    });

    // Category distribution
    new Chart(document.getElementById('categoryDist'), {
      type: 'doughnut',
      data: { labels: data.categoryDist.labels, datasets: [{ data: data.categoryDist.data, backgroundColor: colors.slice(0, data.categoryDist.labels.length), borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: tickColor, font: { family: 'Inter' }, padding: 16 } } } }
    });
  } catch (err) {
    console.error('Failed to load analytics:', err);
  }
});

// ===== AI REPORT GENERATION =====
const btnAiAnalysis = document.getElementById('btn-ai-analysis');
const aiReportContainer = document.getElementById('ai-report-container');

if (btnAiAnalysis && aiReportContainer) {
  btnAiAnalysis.addEventListener('click', async () => {
    btnAiAnalysis.disabled = true;
    btnAiAnalysis.innerText = '⏳ Generating...';
    aiReportContainer.innerHTML = '<div style="display:flex; justify-content:center; padding: 2rem;"><div class="spinner" style="border: 4px solid var(--border-color); border-top: 4px solid var(--primary-color); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div></div><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';

    try {
      const res = await fetch('/admin/analytics/ai-report');
      const data = await res.json();

      if (data.error) {
        aiReportContainer.innerHTML = `<p style="color: #ef4444;">Error: ${data.error}</p>`;
      } else if (data.report) {
        // Use marked.js to render markdown
        aiReportContainer.innerHTML = marked.parse(data.report);
      } else {
        aiReportContainer.innerHTML = `<p style="color: #ef4444;">Received empty response from AI.</p>`;
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
      aiReportContainer.innerHTML = `<p style="color: #ef4444;">Failed to generate report. Please try again later.</p>`;
    } finally {
      btnAiAnalysis.disabled = false;
      btnAiAnalysis.innerText = '🤖 Generate AI Analysis';
    }
  });
}
