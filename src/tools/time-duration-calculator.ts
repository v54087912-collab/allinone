/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateTimeBetween } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const startTimeInput = document.getElementById('start-time') as HTMLInputElement | null;
  const endTimeInput = document.getElementById('end-time') as HTMLInputElement | null;
  const midnightCheckbox = document.getElementById('cross-midnight') as HTMLInputElement | null;

  const resHms = document.getElementById('res-hms');
  const resTotalSeconds = document.getElementById('res-total-seconds');
  const resTotalMinutes = document.getElementById('res-total-minutes');
  const resDecimalHours = document.getElementById('res-decimal-hours');

  const update = () => {
    const s = startTimeInput?.value || '09:00';
    const e = endTimeInput?.value || '17:30';
    const cross = midnightCheckbox?.checked ?? false;

    const res = calculateTimeBetween(s, e, cross);

    if (resHms) resHms.textContent = `${res.hours}h ${res.minutes}m ${res.seconds}s`;
    if (resTotalSeconds) resTotalSeconds.textContent = `${res.totalSeconds.toLocaleString()} seconds`;
    if (resTotalMinutes) resTotalMinutes.textContent = `${(res.totalSeconds / 60).toFixed(1)} minutes`;
    if (resDecimalHours) resDecimalHours.textContent = `${res.decimalHours} hours`;
  };

  startTimeInput?.addEventListener('input', update);
  endTimeInput?.addEventListener('input', update);
  midnightCheckbox?.addEventListener('change', update);

  update();
});
