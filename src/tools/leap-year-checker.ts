/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isLeapYear } from '../utils/geoTimeUtils.ts';

export function initLeapYearChecker(): void {
  const yearInput = document.getElementById('year-input') as HTMLInputElement | null;
  const checkBtn = document.getElementById('check-btn') as HTMLButtonElement | null;
  const resultCard = document.getElementById('result-card') as HTMLDivElement | null;
  const statusBadge = document.getElementById('status-badge') as HTMLSpanElement | null;
  const reasonText = document.getElementById('reason-text') as HTMLParagraphElement | null;
  const daysText = document.getElementById('days-text') as HTMLSpanElement | null;
  const upcomingList = document.getElementById('upcoming-list') as HTMLUListElement | null;
  const previousList = document.getElementById('previous-list') as HTMLUListElement | null;

  function evaluate() {
    const y = parseInt(yearInput?.value || new Date().getFullYear().toString());
    const res = isLeapYear(y);

    if (statusBadge) {
      statusBadge.textContent = res.isLeap ? 'LEAP YEAR' : 'COMMON YEAR';
      statusBadge.className = `px-3 py-1 rounded-full text-xs font-bold ${res.isLeap ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'}`;
    }
    if (reasonText) reasonText.textContent = res.reason;
    if (daysText) daysText.textContent = `${res.daysInYear} Days (February has ${res.isLeap ? 29 : 28} days)`;

    if (upcomingList) {
      upcomingList.innerHTML = res.nextLeapYears.map(yr => `<li class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold">${yr}</li>`).join('');
    }
    if (previousList) {
      previousList.innerHTML = res.previousLeapYears.map(yr => `<li class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold">${yr}</li>`).join('');
    }

    if (resultCard) resultCard.classList.remove('hidden');
  }

  if (checkBtn) checkBtn.addEventListener('click', evaluate);
  if (yearInput) yearInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') evaluate(); });

  evaluate();
}

document.addEventListener('DOMContentLoaded', initLeapYearChecker);
