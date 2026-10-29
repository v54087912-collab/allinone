/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateDateDifference } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const startDateInput = document.getElementById('start-date') as HTMLInputElement | null;
  const endDateInput = document.getElementById('end-date') as HTMLInputElement | null;
  const includeEndCheckbox = document.getElementById('include-end') as HTMLInputElement | null;

  const resYmd = document.getElementById('res-ymd');
  const resDays = document.getElementById('res-days');
  const resWeeks = document.getElementById('res-weeks');
  const resBusiness = document.getElementById('res-business');
  const resWeekend = document.getElementById('res-weekend');

  // Set default dates: today and +30 days
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);

  if (startDateInput && !startDateInput.value) {
    startDateInput.value = today.toISOString().split('T')[0];
  }
  if (endDateInput && !endDateInput.value) {
    endDateInput.value = nextMonth.toISOString().split('T')[0];
  }

  const update = () => {
    const s = startDateInput?.value || '';
    const e = endDateInput?.value || '';
    const inc = includeEndCheckbox?.checked ?? false;

    if (!s || !e) return;
    const res = calculateDateDifference(s, e, inc);

    if (resYmd) {
      const parts: string[] = [];
      if (res.years > 0) parts.push(`${res.years} year${res.years > 1 ? 's' : ''}`);
      if (res.months > 0) parts.push(`${res.months} month${res.months > 1 ? 's' : ''}`);
      if (res.days > 0 || parts.length === 0) parts.push(`${res.days} day${res.days > 1 ? 's' : ''}`);
      resYmd.textContent = parts.join(', ');
    }

    if (resDays) resDays.textContent = res.totalDays.toLocaleString();
    if (resWeeks) resWeeks.textContent = `${res.totalWeeks} weeks (${res.totalDays % 7} extra days)`;
    if (resBusiness) resBusiness.textContent = `${res.businessDays} days`;
    if (resWeekend) resWeekend.textContent = `${res.weekendDays} days`;
  };

  startDateInput?.addEventListener('input', update);
  endDateInput?.addEventListener('input', update);
  includeEndCheckbox?.addEventListener('change', update);

  update();
});
