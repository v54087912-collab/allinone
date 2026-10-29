/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateDateDifference } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const dateFrom = document.getElementById('date-from') as HTMLInputElement | null;
  const dateTo = document.getElementById('date-to') as HTMLInputElement | null;
  const resTotalDays = document.getElementById('res-total-days');
  const resWorkingDays = document.getElementById('res-working-days');
  const resWeekends = document.getElementById('res-weekends');
  const resPercentYear = document.getElementById('res-percent-year');

  const today = new Date();
  const yearEnd = new Date(today.getFullYear(), 11, 31);

  if (dateFrom && !dateFrom.value) dateFrom.value = today.toISOString().split('T')[0];
  if (dateTo && !dateTo.value) dateTo.value = yearEnd.toISOString().split('T')[0];

  const update = () => {
    const from = dateFrom?.value || '';
    const to = dateTo?.value || '';
    if (!from || !to) return;

    const diff = calculateDateDifference(from, to, true);

    if (resTotalDays) resTotalDays.textContent = `${diff.totalDays} Days`;
    if (resWorkingDays) resWorkingDays.textContent = `${diff.businessDays} Working Days`;
    if (resWeekends) resWeekends.textContent = `${diff.weekendDays} Weekend Days`;

    if (resPercentYear) {
      const pct = (diff.totalDays / 365.25) * 100;
      resPercentYear.textContent = `${pct.toFixed(1)}% of a calendar year`;
    }
  };

  dateFrom?.addEventListener('input', update);
  dateTo?.addEventListener('input', update);

  update();
});
