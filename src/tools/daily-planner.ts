/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';
import { formatDateKey } from '../utils/productivityUtils.js';

interface DailyPlanData {
  topPriorities: [string, string, string];
  waterGlasses: number; // 0 to 8
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  };
  timeBlocks: Record<string, string>; // "06:00": "Gym workout", ...
  notes: string;
}

const HOURS_LIST = [
  '05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
  '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'
];

function getStorageKey(dateKey: string): string {
  return `toolora_daily_planner_${dateKey}`;
}

function loadPlan(dateKey: string): DailyPlanData {
  try {
    const raw = localStorage.getItem(getStorageKey(dateKey));
    if (raw) return JSON.parse(raw);
  } catch {
    // Fall back to empty
  }
  return {
    topPriorities: ['', '', ''],
    waterGlasses: 0,
    meals: { breakfast: '', lunch: '', dinner: '', snacks: '' },
    timeBlocks: {},
    notes: '',
  };
}

function savePlan(dateKey: string, data: DailyPlanData): void {
  try {
    localStorage.setItem(getStorageKey(dateKey), JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save daily planner to localStorage', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  let currentDate = new Date();
  let dateKey = formatDateKey(currentDate);
  let planData = loadPlan(dateKey);

  const datePicker = document.getElementById('planner-date-picker') as HTMLInputElement | null;
  const prevDayBtn = document.getElementById('planner-prev-day-btn');
  const nextDayBtn = document.getElementById('planner-next-day-btn');
  const todayBtn = document.getElementById('planner-today-btn');
  const dateHeading = document.getElementById('planner-date-heading');

  // Top priorities
  const p1 = document.getElementById('priority-1') as HTMLInputElement | null;
  const p2 = document.getElementById('priority-2') as HTMLInputElement | null;
  const p3 = document.getElementById('priority-3') as HTMLInputElement | null;

  // Water buttons
  const waterContainer = document.getElementById('water-tracker-container');
  const waterCountText = document.getElementById('water-count-text');

  // Meals
  const mealBreakfast = document.getElementById('meal-breakfast') as HTMLInputElement | null;
  const mealLunch = document.getElementById('meal-lunch') as HTMLInputElement | null;
  const mealDinner = document.getElementById('meal-dinner') as HTMLInputElement | null;
  const mealSnacks = document.getElementById('meal-snacks') as HTMLInputElement | null;

  // Notes
  const notesArea = document.getElementById('planner-notes') as HTMLTextAreaElement | null;

  // Timeblocks container
  const scheduleContainer = document.getElementById('schedule-blocks-container');

  // Actions
  const printBtn = document.getElementById('planner-print-btn');
  const clearBtn = document.getElementById('planner-clear-btn');

  function renderView(): void {
    if (datePicker) datePicker.value = dateKey;

    if (dateHeading) {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateHeading.textContent = currentDate.toLocaleDateString(undefined, options);
    }

    // Priorities
    if (p1) p1.value = planData.topPriorities[0] || '';
    if (p2) p2.value = planData.topPriorities[1] || '';
    if (p3) p3.value = planData.topPriorities[2] || '';

    // Water
    if (waterCountText) waterCountText.textContent = `${planData.waterGlasses} of 8 glasses (64 oz)`;
    if (waterContainer) {
      waterContainer.innerHTML = '';
      for (let i = 1; i <= 8; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.title = `Glass ${i}`;
        const isFilled = i <= planData.waterGlasses;
        btn.className = `w-9 h-10 rounded-lg flex flex-col items-center justify-center text-sm font-bold transition-all cursor-pointer ${
          isFilled
            ? 'bg-blue-600 text-white shadow-xs'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-950'
        }`;
        btn.innerHTML = `💧<span class="text-[9px]">${i}</span>`;
        btn.addEventListener('click', () => {
          planData.waterGlasses = planData.waterGlasses === i ? i - 1 : i;
          savePlan(dateKey, planData);
          renderView();
        });
        waterContainer.appendChild(btn);
      }
    }

    // Meals
    if (mealBreakfast) mealBreakfast.value = planData.meals.breakfast || '';
    if (mealLunch) mealLunch.value = planData.meals.lunch || '';
    if (mealDinner) mealDinner.value = planData.meals.dinner || '';
    if (mealSnacks) mealSnacks.value = planData.meals.snacks || '';

    // Notes
    if (notesArea) notesArea.value = planData.notes || '';

    // Time blocks
    if (scheduleContainer) {
      scheduleContainer.innerHTML = '';
      HOURS_LIST.forEach((hr) => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0';

        const label = document.createElement('span');
        label.className = 'w-20 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0';
        label.textContent = hr;

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Scheduled activity...';
        input.value = planData.timeBlocks[hr] || '';
        input.className =
          'flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none';

        input.addEventListener('input', () => {
          planData.timeBlocks[hr] = input.value;
          savePlan(dateKey, planData);
        });

        row.appendChild(label);
        row.appendChild(input);
        scheduleContainer.appendChild(row);
      });
    }
  }

  // Bind input listeners
  const bindInput = (el: HTMLInputElement | HTMLTextAreaElement | null, updater: (val: string) => void) => {
    el?.addEventListener('input', () => {
      updater(el.value);
      savePlan(dateKey, planData);
    });
  };

  bindInput(p1, (v) => (planData.topPriorities[0] = v));
  bindInput(p2, (v) => (planData.topPriorities[1] = v));
  bindInput(p3, (v) => (planData.topPriorities[2] = v));
  bindInput(mealBreakfast, (v) => (planData.meals.breakfast = v));
  bindInput(mealLunch, (v) => (planData.meals.lunch = v));
  bindInput(mealDinner, (v) => (planData.meals.dinner = v));
  bindInput(mealSnacks, (v) => (planData.meals.snacks = v));
  bindInput(notesArea, (v) => (planData.notes = v));

  // Date Navigation
  datePicker?.addEventListener('change', () => {
    if (datePicker.value) {
      const parts = datePicker.value.split('-').map((p) => parseInt(p, 10));
      currentDate = new Date(parts[0], parts[1] - 1, parts[2]);
      dateKey = formatDateKey(currentDate);
      planData = loadPlan(dateKey);
      renderView();
    }
  });

  prevDayBtn?.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    dateKey = formatDateKey(currentDate);
    planData = loadPlan(dateKey);
    renderView();
  });

  nextDayBtn?.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    dateKey = formatDateKey(currentDate);
    planData = loadPlan(dateKey);
    renderView();
  });

  todayBtn?.addEventListener('click', () => {
    currentDate = new Date();
    dateKey = formatDateKey(currentDate);
    planData = loadPlan(dateKey);
    renderView();
  });

  // Print button
  printBtn?.addEventListener('click', () => {
    window.print();
  });

  // Clear button
  clearBtn?.addEventListener('click', () => {
    if (confirm(`Reset and clear all planner fields for ${dateKey}?`)) {
      planData = {
        topPriorities: ['', '', ''],
        waterGlasses: 0,
        meals: { breakfast: '', lunch: '', dinner: '', snacks: '' },
        timeBlocks: {},
        notes: '',
      };
      savePlan(dateKey, planData);
      renderView();
    }
  });

  renderView();
});
