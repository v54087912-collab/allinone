/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateMarks, SubjectMarks } from '../utils/educationUtils.ts';

export function initMarksCalculator(): void {
  const tableBody = document.getElementById('subject-rows') as HTMLTableSectionElement | null;
  const addSubjectBtn = document.getElementById('add-subject-btn') as HTMLButtonElement | null;
  const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;
  const totalScoreDisplay = document.getElementById('total-score') as HTMLHeadingElement | null;
  const percentageDisplay = document.getElementById('percentage-display') as HTMLSpanElement | null;
  const gradeBadge = document.getElementById('grade-badge') as HTMLSpanElement | null;
  const statusBadge = document.getElementById('status-badge') as HTMLSpanElement | null;

  let subjects: SubjectMarks[] = [
    { name: 'Mathematics', marksObtained: 85, maxMarks: 100, passingMarks: 40 },
    { name: 'Physics', marksObtained: 78, maxMarks: 100, passingMarks: 40 },
    { name: 'Chemistry', marksObtained: 92, maxMarks: 100, passingMarks: 40 },
    { name: 'English', marksObtained: 88, maxMarks: 100, passingMarks: 40 }
  ];

  function render() {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    subjects.forEach((s, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-200 dark:border-slate-800';
      tr.innerHTML = `
        <td class="py-2 px-3">
          <input type="text" data-idx="${idx}" data-field="name" value="${s.name}" class="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
        </td>
        <td class="py-2 px-3">
          <input type="number" min="0" data-idx="${idx}" data-field="marksObtained" value="${s.marksObtained}" class="w-24 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
        </td>
        <td class="py-2 px-3">
          <input type="number" min="1" data-idx="${idx}" data-field="maxMarks" value="${s.maxMarks}" class="w-24 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
        </td>
        <td class="py-2 px-3">
          <input type="number" min="0" data-idx="${idx}" data-field="passingMarks" value="${s.passingMarks ?? 40}" class="w-24 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
        </td>
        <td class="py-2 px-3 text-right">
          <button type="button" data-remove="${idx}" class="text-red-500 hover:text-red-700 text-xs">Remove</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    tableBody.querySelectorAll<HTMLInputElement>('input').forEach(inp => {
      inp.addEventListener('input', () => {
        const i = parseInt(inp.dataset.idx || '0');
        const f = inp.dataset.field as keyof SubjectMarks;
        if (f === 'name') subjects[i].name = inp.value;
        else (subjects[i] as any)[f] = parseFloat(inp.value) || 0;
      });
    });

    tableBody.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.remove || '0');
        subjects.splice(i, 1);
        render();
      });
    });
  }

  if (addSubjectBtn) {
    addSubjectBtn.addEventListener('click', () => {
      subjects.push({ name: `Subject ${subjects.length + 1}`, marksObtained: 80, maxMarks: 100, passingMarks: 40 });
      render();
    });
  }

  if (calculateBtn) {
    calculateBtn.addEventListener('click', () => {
      const res = calculateMarks(subjects);
      if (totalScoreDisplay) totalScoreDisplay.textContent = `${res.totalObtained} / ${res.totalMax}`;
      if (percentageDisplay) percentageDisplay.textContent = `${res.percentage}%`;
      if (gradeBadge) gradeBadge.textContent = `Grade: ${res.grade}`;
      if (statusBadge) {
        statusBadge.textContent = res.passed ? 'PASSED' : 'FAILED';
        statusBadge.className = `px-3 py-1 rounded-full text-xs font-bold ${res.passed ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'}`;
      }
    });
  }

  render();
}

document.addEventListener('DOMContentLoaded', initMarksCalculator);
