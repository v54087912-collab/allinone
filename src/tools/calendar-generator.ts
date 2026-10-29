/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateCalendarGrid } from '../utils/productivityUtils.ts';

export function initCalendarGenerator(): void {
  const monthSelect = document.getElementById('cal-month') as HTMLSelectElement | null;
  const yearInput = document.getElementById('cal-year') as HTMLInputElement | null;
  const generateBtn = document.getElementById('cal-generate-btn') as HTMLButtonElement | null;
  const printBtn = document.getElementById('cal-print-btn') as HTMLButtonElement | null;
  const calendarDisplay = document.getElementById('calendar-view') as HTMLDivElement | null;
  const titleDisplay = document.getElementById('cal-month-title') as HTMLHeadingElement | null;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const now = new Date();
  if (monthSelect) monthSelect.value = now.getMonth().toString();
  if (yearInput) yearInput.value = now.getFullYear().toString();

  function renderCalendar() {
    if (!calendarDisplay) return;
    const m = parseInt(monthSelect?.value || '0');
    const y = parseInt(yearInput?.value || now.getFullYear().toString());

    if (titleDisplay) {
      titleDisplay.textContent = `${monthNames[m]} ${y}`;
    }

    const grid = generateCalendarGrid(y, m);

    let html = `
      <div class="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
        ${dayNames.map(d => `<div>${d}</div>`).join('')}
      </div>
      <div class="grid grid-cols-7 gap-1 pt-2">
    `;

    grid.forEach(cell => {
      const isCurrentMonth = cell.isCurrentMonth;
      const isToday = cell.isToday;

      html += `
        <div class="h-16 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800/60 ${isCurrentMonth ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100' : 'bg-slate-50/50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-600'} ${isToday ? 'ring-2 ring-blue-500 font-bold' : ''} flex flex-col justify-between">
          <span class="text-xs ${isToday ? 'text-blue-600' : ''}">${cell.dayNumber}</span>
        </div>
      `;
    });

    html += `</div>`;
    calendarDisplay.innerHTML = html;
  }

  if (generateBtn) generateBtn.addEventListener('click', renderCalendar);
  if (monthSelect) monthSelect.addEventListener('change', renderCalendar);
  if (yearInput) yearInput.addEventListener('input', renderCalendar);

  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  renderCalendar();
}

document.addEventListener('DOMContentLoaded', initCalendarGenerator);
