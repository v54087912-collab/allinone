/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateDateMath } from '../utils/geoTimeUtils.ts';
import { calculateDateDifference } from '../utils/calcFinanceUtils.ts';

export function initDateCalculator(): void {
  const modeSelect = document.getElementById('calc-mode') as HTMLSelectElement | null;
  const mathSection = document.getElementById('math-section') as HTMLDivElement | null;
  const diffSection = document.getElementById('diff-section') as HTMLDivElement | null;

  // Math controls
  const mathStartDate = document.getElementById('math-start-date') as HTMLInputElement | null;
  const mathOp = document.getElementById('math-op') as HTMLSelectElement | null;
  const mathAmount = document.getElementById('math-amount') as HTMLInputElement | null;
  const mathUnit = document.getElementById('math-unit') as HTMLSelectElement | null;
  const mathCalcBtn = document.getElementById('math-calc-btn') as HTMLButtonElement | null;
  const mathResultBox = document.getElementById('math-result') as HTMLDivElement | null;

  // Diff controls
  const diffStart = document.getElementById('diff-start') as HTMLInputElement | null;
  const diffEnd = document.getElementById('diff-end') as HTMLInputElement | null;
  const diffCalcBtn = document.getElementById('diff-calc-btn') as HTMLButtonElement | null;
  const diffResultBox = document.getElementById('diff-result') as HTMLDivElement | null;

  if (modeSelect) {
    modeSelect.addEventListener('change', () => {
      const isMath = modeSelect.value === 'math';
      if (mathSection) mathSection.classList.toggle('hidden', !isMath);
      if (diffSection) diffSection.classList.toggle('hidden', isMath);
    });
  }

  // Set today as default
  const todayStr = new Date().toISOString().slice(0, 10);
  if (mathStartDate) mathStartDate.value = todayStr;
  if (diffStart) diffStart.value = todayStr;
  if (diffEnd) diffEnd.value = todayStr;

  if (mathCalcBtn) {
    mathCalcBtn.addEventListener('click', () => {
      const start = mathStartDate?.value || todayStr;
      const op = (mathOp?.value || 'add') as any;
      const amount = parseFloat(mathAmount?.value || '1');
      const unit = (mathUnit?.value || 'days') as any;

      try {
        const res = calculateDateMath(start, op, amount, unit);
        if (mathResultBox) {
          mathResultBox.innerHTML = `
            <span class="text-xs font-semibold text-blue-600 uppercase tracking-wider">Calculated Date</span>
            <h3 class="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">${res.resultDate}</h3>
            <p class="text-xs text-slate-500 mt-1">${res.formattedFull}</p>
          `;
          mathResultBox.classList.remove('hidden');
        }
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  if (diffCalcBtn) {
    diffCalcBtn.addEventListener('click', () => {
      const d1 = diffStart?.value || todayStr;
      const d2 = diffEnd?.value || todayStr;

      try {
        const res = calculateDateDifference(d1, d2);
        if (diffResultBox) {
          diffResultBox.innerHTML = `
            <span class="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Duration</span>
            <h3 class="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">${res.totalDays.toLocaleString()} Days</h3>
            <p class="text-xs text-slate-500 mt-1">${res.years} years, ${res.months} months, ${res.days} days (or ${res.totalWeeks} weeks, ${res.businessDays} business days)</p>
          `;
          diffResultBox.classList.remove('hidden');
        }
      } catch (err: any) {
        alert(err.message);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initDateCalculator);
