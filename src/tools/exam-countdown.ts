/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initExamCountdown(): void {
  const examNameInput = document.getElementById('exam-name') as HTMLInputElement | null;
  const examDateInput = document.getElementById('exam-date') as HTMLInputElement | null;
  const addExamBtn = document.getElementById('add-exam-btn') as HTMLButtonElement | null;
  const examList = document.getElementById('exam-list') as HTMLDivElement | null;

  interface ExamItem {
    id: string;
    name: string;
    dateTime: string;
  }

  const STORAGE_KEY = 'toolora_exam_countdowns';
  let exams: ExamItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (!exams.length) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    exams.push({
      id: '1',
      name: 'Final Semester Examinations',
      dateTime: futureDate.toISOString().slice(0, 16)
    });
  }

  function renderExams() {
    if (!examList) return;
    examList.innerHTML = '';
    const now = new Date().getTime();

    exams.forEach(exam => {
      const examTime = new Date(exam.dateTime).getTime();
      const diffMs = examTime - now;

      let timeStr = '';
      let isPast = false;
      if (diffMs <= 0) {
        timeStr = 'Exam Finished / Underway';
        isPast = true;
      } else {
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        timeStr = `${days}d ${hours}h ${minutes}m remaining`;
      }

      const card = document.createElement('div');
      card.className = 'p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between';
      card.innerHTML = `
        <div>
          <div class="text-sm font-bold text-slate-900 dark:text-slate-100">${exam.name}</div>
          <div class="text-xs text-slate-500 mt-0.5">Date: ${new Date(exam.dateTime).toLocaleString()}</div>
          <div class="text-xs font-semibold ${isPast ? 'text-slate-400' : 'text-blue-600 dark:text-blue-400'} mt-2">${timeStr}</div>
        </div>
        <button type="button" data-remove="${exam.id}" class="text-red-500 hover:text-red-700 text-xs font-semibold p-2 cursor-pointer">Remove</button>
      `;
      examList.appendChild(card);
    });

    examList.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.remove;
        exams = exams.filter(e => e.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
        renderExams();
      });
    });
  }

  if (addExamBtn && examNameInput && examDateInput) {
    addExamBtn.addEventListener('click', () => {
      const name = examNameInput.value.trim();
      const dateTime = examDateInput.value;
      if (!name || !dateTime) return;

      exams.push({ id: Date.now().toString(), name, dateTime });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
      examNameInput.value = '';
      examDateInput.value = '';
      renderExams();
    });
  }

  setInterval(renderExams, 30000);
  renderExams();
}

document.addEventListener('DOMContentLoaded', initExamCountdown);
