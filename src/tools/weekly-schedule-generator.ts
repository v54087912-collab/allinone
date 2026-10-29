/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';

interface ScheduleSlot {
  title: string;
  category: 'work' | 'study' | 'fitness' | 'personal' | 'meeting' | 'free';
}

// 7 days x 12 time blocks (8 AM to 8 PM)
type ScheduleMatrix = Record<string, ScheduleSlot>; // key: `${dayIndex}-${hourIndex}`

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM'
];

const STORAGE_KEY = 'toolora_weekly_schedule';

const PRESET_PROFESSIONAL: ScheduleMatrix = {};
for (let d = 0; d < 5; d++) {
  // Mon-Fri
  PRESET_PROFESSIONAL[`${d}-1`] = { title: 'Deep Work / Focus', category: 'work' };
  PRESET_PROFESSIONAL[`${d}-2`] = { title: 'Team Standup & Sync', category: 'meeting' };
  PRESET_PROFESSIONAL[`${d}-3`] = { title: 'Project Execution', category: 'work' };
  PRESET_PROFESSIONAL[`${d}-4`] = { title: 'Lunch Break & Walk', category: 'personal' };
  PRESET_PROFESSIONAL[`${d}-5`] = { title: 'Client Reviews', category: 'work' };
  PRESET_PROFESSIONAL[`${d}-6`] = { title: 'Admin & Emails', category: 'work' };
  PRESET_PROFESSIONAL[`${d}-9`] = { title: 'Gym / Workout', category: 'fitness' };
}

function loadSchedule(): ScheduleMatrix {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return { ...PRESET_PROFESSIONAL };
}

function saveSchedule(matrix: ScheduleMatrix): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
  } catch (err) {
    console.error('Failed to save weekly schedule', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  let matrix = loadSchedule();

  const gridContainer = document.getElementById('weekly-schedule-grid');
  const printBtn = document.getElementById('schedule-print-btn');
  const clearBtn = document.getElementById('schedule-clear-btn');
  const templateSelect = document.getElementById('schedule-template-select') as HTMLSelectElement | null;
  const loadTemplateBtn = document.getElementById('schedule-load-template-btn');

  // Cell edit modal
  const editModal = document.getElementById('schedule-edit-modal');
  const modalSlotTitle = document.getElementById('modal-slot-title');
  const slotTitleInput = document.getElementById('modal-title-input') as HTMLInputElement | null;
  const slotCategorySelect = document.getElementById('modal-category-select') as HTMLSelectElement | null;
  const modalSaveBtn = document.getElementById('modal-save-btn');
  const modalDeleteBtn = document.getElementById('modal-delete-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');

  let activeCellKey: string | null = null;

  // Category stats
  const workHoursEl = document.getElementById('stat-work-hours');
  const fitnessHoursEl = document.getElementById('stat-fitness-hours');
  const personalHoursEl = document.getElementById('stat-personal-hours');

  function renderGrid(): void {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    // Calculate hours per category
    let workH = 0;
    let fitH = 0;
    let personalH = 0;

    Object.values(matrix).forEach((slot) => {
      if (slot.category === 'work' || slot.category === 'meeting') workH++;
      else if (slot.category === 'fitness') fitH++;
      else if (slot.category === 'personal' || slot.category === 'study') personalH++;
    });

    if (workHoursEl) workHoursEl.textContent = `${workH} hrs`;
    if (fitnessHoursEl) fitnessHoursEl.textContent = `${fitH} hrs`;
    if (personalHoursEl) personalHoursEl.textContent = `${personalH} hrs`;

    // Render Time Column + 7 Day Columns
    TIME_SLOTS.forEach((timeLabel, timeIdx) => {
      // Time label cell
      const timeCell = document.createElement('div');
      timeCell.className = 'p-2 text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-lg flex items-center justify-center shrink-0';
      timeCell.textContent = timeLabel;
      gridContainer.appendChild(timeCell);

      // 7 day cells
      DAYS.forEach((_, dayIdx) => {
        const key = `${dayIdx}-${timeIdx}`;
        const slot = matrix[key];

        const cell = document.createElement('div');
        cell.className = 'min-h-[48px] p-1.5 rounded-lg border text-[11px] transition-all cursor-pointer flex flex-col justify-center';

        const categoryStyles: Record<string, string> = {
          work: 'bg-blue-100/80 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-bold',
          meeting: 'bg-amber-100/80 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold',
          fitness: 'bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold',
          study: 'bg-indigo-100/80 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold',
          personal: 'bg-purple-100/80 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold',
          free: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 text-slate-400',
        };

        if (slot && slot.title) {
          cell.className += ` ${categoryStyles[slot.category] || categoryStyles.work}`;
          cell.innerHTML = `<span class="truncate block">${escapeHtml(slot.title)}</span>`;
        } else {
          cell.className += ` ${categoryStyles.free}`;
          cell.innerHTML = `<span class="opacity-0 hover:opacity-100 text-[10px] text-center block">+</span>`;
        }

        cell.addEventListener('click', () => {
          activeCellKey = key;
          openEditModal(DAYS[dayIdx], timeLabel, slot);
        });

        gridContainer.appendChild(cell);
      });
    });
  }

  function openEditModal(dayName: string, timeName: string, currentSlot?: ScheduleSlot): void {
    if (modalSlotTitle) modalSlotTitle.textContent = `${dayName} at ${timeName}`;
    if (slotTitleInput) slotTitleInput.value = currentSlot?.title || '';
    if (slotCategorySelect) slotCategorySelect.value = currentSlot?.category || 'work';
    if (editModal) editModal.classList.remove('hidden');
    if (slotTitleInput) slotTitleInput.focus();
  }

  function closeEditModal(): void {
    if (editModal) editModal.classList.add('hidden');
    activeCellKey = null;
  }

  modalSaveBtn?.addEventListener('click', () => {
    if (!activeCellKey) return;
    const title = (slotTitleInput?.value || '').trim();
    if (!title) {
      delete matrix[activeCellKey];
    } else {
      matrix[activeCellKey] = {
        title,
        category: (slotCategorySelect?.value as ScheduleSlot['category']) || 'work',
      };
    }
    saveSchedule(matrix);
    closeEditModal();
    renderGrid();
  });

  modalDeleteBtn?.addEventListener('click', () => {
    if (activeCellKey && matrix[activeCellKey]) {
      delete matrix[activeCellKey];
      saveSchedule(matrix);
      closeEditModal();
      renderGrid();
    }
  });

  modalCancelBtn?.addEventListener('click', closeEditModal);

  // Load Template
  loadTemplateBtn?.addEventListener('click', () => {
    const t = templateSelect?.value;
    if (confirm('Replace current schedule with this template?')) {
      matrix = {};
      if (t === 'pro') {
        for (let d = 0; d < 5; d++) {
          matrix[`${d}-1`] = { title: 'Deep Work / Focus', category: 'work' };
          matrix[`${d}-2`] = { title: 'Team Standup', category: 'meeting' };
          matrix[`${d}-3`] = { title: 'Project Execution', category: 'work' };
          matrix[`${d}-4`] = { title: 'Lunch Break', category: 'personal' };
          matrix[`${d}-5`] = { title: 'Sprint Tasks', category: 'work' };
          matrix[`${d}-9`] = { title: 'Gym Workout', category: 'fitness' };
        }
      } else if (t === 'student') {
        for (let d = 0; d < 5; d++) {
          matrix[`${d}-1`] = { title: 'Lecture 1', category: 'study' };
          matrix[`${d}-3`] = { title: 'Lecture 2 / Lab', category: 'study' };
          matrix[`${d}-4`] = { title: 'Campus Lunch', category: 'personal' };
          matrix[`${d}-6`] = { title: 'Library Study & Homework', category: 'study' };
          matrix[`${d}-8`] = { title: 'Club / Sports', category: 'fitness' };
        }
      } else if (t === 'fitness') {
        matrix['0-1'] = { title: 'Push Day (Chest/Triceps)', category: 'fitness' };
        matrix['1-1'] = { title: 'Pull Day (Back/Biceps)', category: 'fitness' };
        matrix['2-1'] = { title: '5km Run & Core', category: 'fitness' };
        matrix['3-1'] = { title: 'Legs & Shoulders', category: 'fitness' };
        matrix['4-1'] = { title: 'Active Recovery Yoga', category: 'fitness' };
        matrix['5-2'] = { title: 'Weekend Long Hike', category: 'fitness' };
      }
      saveSchedule(matrix);
      renderGrid();
    }
  });

  // Clear
  clearBtn?.addEventListener('click', () => {
    if (confirm('Clear entire weekly schedule?')) {
      matrix = {};
      saveSchedule(matrix);
      renderGrid();
    }
  });

  // Print
  printBtn?.addEventListener('click', () => {
    window.print();
  });

  function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  }

  renderGrid();
});
