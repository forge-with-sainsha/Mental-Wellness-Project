'use strict';

const LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];

document.addEventListener('DOMContentLoaded', async () => {
  if (!guardStudent()) return;

  let questions = [];

  try {
    const data = await apiFetch('/assessment/questions');
    questions = data.questions || [];
  } catch {
    document.getElementById('loadingQuestions').innerHTML =
      '<p class="text-danger">Failed to load questions. Please refresh.</p>';
    return;
  }

  document.getElementById('loadingQuestions').classList.add('d-none');
  document.getElementById('assessmentForm').classList.remove('d-none');

  const container = document.getElementById('questionsContainer');
  container.innerHTML = questions.map((q, idx) => `
    <div class="card question-card border p-4 mb-3" id="qcard-${q.question_id}">
      <div class="d-flex align-items-start gap-3">
        <div class="question-number">${idx + 1}</div>
        <div class="flex-grow-1">
          <p class="fw-semibold mb-3">${q.question_text}</p>
          <div class="d-flex flex-wrap gap-2">
            ${[0,1,2,3,4].map((val) => `
              <div>
                <input type="radio" class="btn-check" name="q_${q.question_id}"
                       id="q${q.question_id}_v${val}" value="${val}">
                <label class="btn btn-outline-secondary btn-sm answer-label"
                       for="q${q.question_id}_v${val}">
                  ${val} — ${LABELS[val]}
                </label>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`).join('');

  // Live progress tracker
  container.addEventListener('change', updateProgress);

  function updateProgress() {
    const answered = questions.filter((q) =>
      document.querySelector(`input[name="q_${q.question_id}"]:checked`)
    ).length;
    const pct = Math.round((answered / questions.length) * 100);
    document.getElementById('progressLabel').textContent = `Question ${answered} of ${questions.length}`;
    document.getElementById('progressPct').textContent   = `${pct}%`;
    document.getElementById('progressBar').style.width   = `${pct}%`;
  }

  const form      = document.getElementById('assessmentForm');
  const formError = document.getElementById('formError');
  const submitBtn = document.getElementById('submitBtn');
  const btnText   = document.getElementById('btnText');
  const btnSpinner= document.getElementById('btnSpinner');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.add('d-none');

    const responses = questions.map((q) => {
      const checked = document.querySelector(`input[name="q_${q.question_id}"]:checked`);
      return checked
        ? { question_id: q.question_id, selected_value: parseInt(checked.value, 10) }
        : null;
    });

    const missing = responses.filter((r) => r === null);
    if (missing.length > 0) {
      // Highlight unanswered cards
      questions.forEach((q, idx) => {
        if (!responses[idx]) {
          document.getElementById(`qcard-${q.question_id}`).style.borderColor = '#dc3545';
        }
      });
      formError.textContent = `Please answer all ${questions.length} questions before submitting.`;
      formError.classList.remove('d-none');
      document.getElementById(`qcard-${questions.find((_,i) => !responses[i]).question_id}`)
              .scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    submitBtn.disabled = true;
    btnText.innerHTML  = 'Submitting…';
    btnSpinner.classList.remove('d-none');

    try {
      await apiFetch('/assessment/submit', {
        method: 'POST',
        body: JSON.stringify({ responses }),
      });
      window.location.replace('/results.html');
    } catch (err) {
      formError.textContent = err.message || 'Submission failed. Please try again.';
      formError.classList.remove('d-none');
      submitBtn.disabled = false;
      btnText.innerHTML  = '<i class="bi bi-send me-1"></i>Submit Assessment';
      btnSpinner.classList.add('d-none');
    }
  });
});
