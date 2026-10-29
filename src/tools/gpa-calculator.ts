/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateGpa, calculateTargetGpa, CourseGrade } from '../utils/educationUtils.ts';

export function initGpaCalculator(): void {
  const scaleSelect = document.getElementById('gpa-scale') as HTMLSelectElement | null;
  const courseTableBody = document.getElementById('course-rows') as HTMLTableSectionElement | null;
  const addCourseBtn = document.getElementById('add-course-btn') as HTMLButtonElement | null;
  const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;
  const gpaResult = document.getElementById('gpa-result') as HTMLHeadingElement | null;
  const totalCreditsResult = document.getElementById('total-credits-result') as HTMLSpanElement | null;
  const targetCalcBtn = document.getElementById('target-calc-btn') as HTMLButtonElement | null;
  const targetResult = document.getElementById('target-result') as HTMLDivElement | null;

  let courses: CourseGrade[] = [
    { name: 'Subject 1', credits: 4, grade: 'A' },
    { name: 'Subject 2', credits: 3, grade: 'B+' },
    { name: 'Subject 3', credits: 3, grade: 'A-' }
  ];

  function renderRows() {
    if (!courseTableBody) return;
    courseTableBody.innerHTML = '';
    courses.forEach((c, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-200 dark:border-slate-800';
      tr.innerHTML = `
        <td class="py-2 px-3">
          <input type="text" data-idx="${idx}" data-field="name" value="${c.name}" class="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
        </td>
        <td class="py-2 px-3">
          <input type="number" min="0" max="20" data-idx="${idx}" data-field="credits" value="${c.credits}" class="w-20 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
        </td>
        <td class="py-2 px-3">
          <input type="text" data-idx="${idx}" data-field="grade" value="${c.grade}" class="w-20 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs uppercase" />
        </td>
        <td class="py-2 px-3 text-right">
          <button type="button" data-remove="${idx}" class="text-red-500 hover:text-red-700 text-xs">Remove</button>
        </td>
      `;
      courseTableBody.appendChild(tr);
    });

    courseTableBody.querySelectorAll<HTMLInputElement>('input').forEach(inp => {
      inp.addEventListener('input', () => {
        const i = parseInt(inp.dataset.idx || '0');
        const f = inp.dataset.field as 'name' | 'credits' | 'grade';
        if (f === 'credits') courses[i].credits = parseFloat(inp.value) || 0;
        else if (f === 'grade') courses[i].grade = inp.value;
        else courses[i].name = inp.value;
      });
    });

    courseTableBody.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.remove || '0');
        courses.splice(i, 1);
        renderRows();
      });
    });
  }

  if (addCourseBtn) {
    addCourseBtn.addEventListener('click', () => {
      courses.push({ name: `Subject ${courses.length + 1}`, credits: 3, grade: 'A' });
      renderRows();
    });
  }

  if (calculateBtn) {
    calculateBtn.addEventListener('click', () => {
      const scale = (scaleSelect?.value || '4.0') as any;
      const res = calculateGpa(courses, scale);
      if (gpaResult) gpaResult.textContent = res.gpa.toFixed(2);
      if (totalCreditsResult) totalCreditsResult.textContent = `${res.totalCredits} Credits`;
    });
  }

  if (targetCalcBtn) {
    targetCalcBtn.addEventListener('click', () => {
      const curGpa = parseFloat((document.getElementById('cur-gpa') as HTMLInputElement)?.value || '0');
      const curCred = parseFloat((document.getElementById('cur-credits') as HTMLInputElement)?.value || '0');
      const tarGpa = parseFloat((document.getElementById('tar-gpa') as HTMLInputElement)?.value || '0');
      const remCred = parseFloat((document.getElementById('rem-credits') as HTMLInputElement)?.value || '0');

      const res = calculateTargetGpa(curGpa, curCred, tarGpa, remCred, 4.0);
      if (targetResult) {
        targetResult.innerHTML = res.achievable
          ? `<span class="text-emerald-600 dark:text-emerald-400 font-bold">Target achievable!</span> You need an average GPA of <strong>${res.requiredGpa}</strong> over your remaining ${remCred} credits.`
          : `<span class="text-red-600 dark:text-red-400 font-bold">Unrealistic target.</span> You would need a GPA of <strong>${res.requiredGpa}</strong>, which exceeds the scale limit.`;
        targetResult.classList.remove('hidden');
      }
    });
  }

  renderRows();
}

document.addEventListener('DOMContentLoaded', initGpaCalculator);
