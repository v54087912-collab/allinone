/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initStudyTimetableMaker(): void {
  const timetableContainer = document.getElementById('timetable-grid') as HTMLDivElement | null;
  const subjectInput = document.getElementById('subject-input') as HTMLInputElement | null;
  const daySelect = document.getElementById('day-select') as HTMLSelectElement | null;
  const timeSelect = document.getElementById('time-select') as HTMLSelectElement | null;
  const addSlotBtn = document.getElementById('add-slot-btn') as HTMLButtonElement | null;
  const printBtn = document.getElementById('print-btn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement | null;

  interface Slot {
    day: string;
    time: string;
    subject: string;
    color: string;
  }

  const STORAGE_KEY = 'toolora_study_timetable';
  let slots: Slot[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM'];
  const colors = ['bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
                  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300',
                  'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
                  'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300',
                  'bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-300'];

  function saveAndRender() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    if (!timetableContainer) return;

    let html = `
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-slate-200 dark:border-slate-800 text-xs">
          <thead>
            <tr class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <th class="p-2 border border-slate-200 dark:border-slate-800">Time</th>
              ${days.map(d => `<th class="p-2 border border-slate-200 dark:border-slate-800">${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    times.forEach(t => {
      html += `<tr><td class="p-2 font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">${t}</td>`;
      days.forEach(d => {
        const slot = slots.find(s => s.day === d && s.time === t);
        if (slot) {
          html += `<td class="p-2 border border-slate-200 dark:border-slate-800 ${slot.color} font-medium relative group">
            ${slot.subject}
            <button data-remove-slot="${d}-${t}" class="hidden group-hover:inline-block ml-1 text-red-500 hover:text-red-700 font-bold cursor-pointer">×</button>
          </td>`;
        } else {
          html += `<td class="p-2 border border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 text-center">-</td>`;
        }
      });
      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    timetableContainer.innerHTML = html;

    timetableContainer.querySelectorAll<HTMLButtonElement>('[data-remove-slot]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [d, t] = (btn.dataset.removeSlot || '').split('-');
        slots = slots.filter(s => !(s.day === d && s.time === t));
        saveAndRender();
      });
    });
  }

  if (addSlotBtn && subjectInput && daySelect && timeSelect) {
    addSlotBtn.addEventListener('click', () => {
      const subject = subjectInput.value.trim();
      if (!subject) return;

      const day = daySelect.value;
      const time = timeSelect.value;
      const color = colors[Math.floor(Math.random() * colors.length)];

      slots = slots.filter(s => !(s.day === day && s.time === time));
      slots.push({ day, time, subject, color });
      subjectInput.value = '';
      saveAndRender();
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all study sessions from timetable?')) {
        slots = [];
        saveAndRender();
      }
    });
  }

  saveAndRender();
}

document.addEventListener('DOMContentLoaded', initStudyTimetableMaker);
