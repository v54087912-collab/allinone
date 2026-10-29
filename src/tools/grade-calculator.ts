/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateWeightedGrade, WeightedItem } from '../utils/educationUtils.ts';

export function initGradeCalculator(): void {
  const tableBody = document.getElementById('grade-rows') as HTMLTableSectionElement | null;
  const addItemBtn = document.getElementById('add-item-btn') as HTMLButtonElement | null;
  const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;
  const targetInput = document.getElementById('target-grade') as HTMLInputElement | null;
  const finalWeightInput = document.getElementById('final-weight') as HTMLInputElement | null;
  const overallGrade = document.getElementById('overall-grade') as HTMLHeadingElement | null;
  const letterGradeBadge = document.getElementById('letter-grade') as HTMLSpanElement | null;
  const neededScoreText = document.getElementById('needed-score-text') as HTMLDivElement | null;

  let items: WeightedItem[] = [
    { name: 'Homework & Assignments', score: 92, maxScore: 100, weight: 20 },
    { name: 'Quizzes', score: 85, maxScore: 100, weight: 15 },
    { name: 'Midterm Exam', score: 78, maxScore: 100, weight: 25 }
  ];

  function render() {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    items.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-200 dark:border-slate-800';
      tr.innerHTML = `
        <td class="py-2 px-3">
          <input type="text" data-idx="${idx}" data-field="name" value="${item.name}" class="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
        </td>
        <td class="py-2 px-3">
          <input type="number" min="0" data-idx="${idx}" data-field="score" value="${item.score}" class="w-20 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
        </td>
        <td class="py-2 px-3">
          <input type="number" min="1" data-idx="${idx}" data-field="maxScore" value="${item.maxScore}" class="w-20 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
        </td>
        <td class="py-2 px-3">
          <input type="number" min="0" max="100" data-idx="${idx}" data-field="weight" value="${item.weight}" class="w-20 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
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
        const f = inp.dataset.field as keyof WeightedItem;
        if (f === 'name') items[i].name = inp.value;
        else (items[i] as any)[f] = parseFloat(inp.value) || 0;
      });
    });

    tableBody.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.remove || '0');
        items.splice(i, 1);
        render();
      });
    });
  }

  if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
      items.push({ name: `Assessment ${items.length + 1}`, score: 85, maxScore: 100, weight: 10 });
      render();
    });
  }

  if (calculateBtn) {
    calculateBtn.addEventListener('click', () => {
      const target = parseFloat(targetInput?.value || '85');
      const finalWeight = parseFloat(finalWeightInput?.value || '40');
      const res = calculateWeightedGrade(items, target, finalWeight);

      if (overallGrade) overallGrade.textContent = `${res.currentPercentage}%`;
      if (letterGradeBadge) letterGradeBadge.textContent = `Grade: ${res.letterGrade}`;
      if (neededScoreText && res.requiredFinalScore !== undefined) {
        neededScoreText.innerHTML = `To achieve <strong>${target}%</strong> overall, you need at least <strong>${res.requiredFinalScore}%</strong> on your final exam (weighted ${finalWeight}%).`;
        neededScoreText.classList.remove('hidden');
      }
    });
  }

  render();
}

document.addEventListener('DOMContentLoaded', initGradeCalculator);
