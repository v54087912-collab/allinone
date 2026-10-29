/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';
import { calculateHabitStreaks, formatDateKey } from '../utils/productivityUtils.js';

interface Habit {
  id: string;
  name: string;
  icon: string;
  category: string;
  completedDates: string[]; // YYYY-MM-DD
  createdAt: number;
}

const STORAGE_KEY = 'toolora_habit_tracker';

function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Fall back to defaults
  }
  const today = new Date();
  const todayKey = formatDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  return [
    {
      id: 'habit-1',
      name: 'Drink 2L Water',
      icon: '💧',
      category: 'Health',
      completedDates: [yesterdayKey, todayKey],
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'habit-2',
      name: 'Morning Workout & Stretch',
      icon: '🏃',
      category: 'Fitness',
      completedDates: [yesterdayKey],
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'habit-3',
      name: 'Read 20 Pages',
      icon: '📖',
      category: 'Learning',
      completedDates: [todayKey],
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'habit-4',
      name: '10 Mins Meditation',
      icon: '🧘',
      category: 'Mindfulness',
      completedDates: [],
      createdAt: Date.now() - 86400000 * 5,
    },
  ];
}

function saveHabits(habits: Habit[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch (err) {
    console.error('Failed to save habits to localStorage', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  let habits = loadHabits();

  const addForm = document.getElementById('habit-add-form') as HTMLFormElement | null;
  const nameInput = document.getElementById('habit-name-input') as HTMLInputElement | null;
  const iconInput = document.getElementById('habit-icon-select') as HTMLSelectElement | null;
  const categoryInput = document.getElementById('habit-category-select') as HTMLSelectElement | null;
  const habitsListContainer = document.getElementById('habits-list-container');
  const totalStreaksEl = document.getElementById('habits-total-streaks');
  const overallRateEl = document.getElementById('habits-overall-rate');
  const todayCompletedCountEl = document.getElementById('habits-today-count');

  // Generate last 7 days keys and labels
  const last7Days: Array<{ dateKey: string; dayLabel: string; isToday: boolean }> = [];
  const today = new Date();
  const todayKey = formatDateKey(today);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = formatDateKey(d);
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });
    last7Days.push({ dateKey: key, dayLabel, isToday: key === todayKey });
  }

  function render(): void {
    if (!habitsListContainer) return;

    let totalStreaksSum = 0;
    let todayCompletions = 0;
    let totalWeekSlots = habits.length * 7;
    let filledWeekSlots = 0;

    habitsListContainer.innerHTML = '';

    habits.forEach((habit) => {
      const stats = calculateHabitStreaks(habit.completedDates);
      totalStreaksSum += stats.currentStreak;
      if (habit.completedDates.includes(todayKey)) {
        todayCompletions++;
      }

      // Count week completions
      const weekCompletions = last7Days.filter((d) => habit.completedDates.includes(d.dateKey)).length;
      filledWeekSlots += weekCompletions;
      const weekPercent = Math.round((weekCompletions / 7) * 100);

      const card = document.createElement('div');
      card.className =
        'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4';

      // Left: Habit Info & Streaks
      const infoCol = document.createElement('div');
      infoCol.className = 'flex items-center gap-3.5 min-w-[220px]';
      infoCol.innerHTML = `
        <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0 shadow-xs">
          ${habit.icon}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-sm text-slate-900 dark:text-white">${escapeHtml(habit.name)}</h3>
          </div>
          <div class="flex items-center gap-2 mt-1 text-xs">
            <span class="text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-0.5">
              🔥 ${stats.currentStreak}d streak
            </span>
            <span class="text-slate-400">&bull;</span>
            <span class="text-slate-500 dark:text-slate-400">Best: ${stats.longestStreak}d</span>
          </div>
        </div>
      `;

      // Middle: 7-day checkboxes
      const daysCol = document.createElement('div');
      daysCol.className = 'flex items-center gap-2 overflow-x-auto py-1';

      last7Days.forEach((day) => {
        const isDone = habit.completedDates.includes(day.dateKey);
        const dayBtn = document.createElement('button');
        dayBtn.type = 'button';
        dayBtn.title = `${day.dateKey}: ${isDone ? 'Completed' : 'Not completed'}`;
        dayBtn.className = `w-9 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all cursor-pointer ${
          isDone
            ? 'bg-emerald-600 text-white shadow-xs scale-102'
            : day.isToday
            ? 'border-2 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`;
        dayBtn.innerHTML = `
          <span class="text-[10px] opacity-80">${day.dayLabel}</span>
          <span class="text-xs mt-0.5">${isDone ? '✓' : day.dateKey.split('-')[2]}</span>
        `;

        dayBtn.addEventListener('click', () => {
          if (isDone) {
            habit.completedDates = habit.completedDates.filter((k) => k !== day.dateKey);
          } else {
            habit.completedDates.push(day.dateKey);
          }
          saveHabits(habits);
          render();
        });

        daysCol.appendChild(dayBtn);
      });

      // Right: Week Completion Rate & Delete button
      const actionsCol = document.createElement('div');
      actionsCol.className = 'flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-0 border-slate-100 dark:border-slate-800';
      actionsCol.innerHTML = `
        <div class="text-right">
          <span class="text-xs font-bold text-slate-700 dark:text-slate-200">${weekPercent}%</span>
          <div class="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${weekPercent}%"></div>
          </div>
        </div>
        <button type="button" data-delete-id="${habit.id}" title="Delete Habit" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer text-sm">
          ✕
        </button>
      `;

      card.appendChild(infoCol);
      card.appendChild(daysCol);
      card.appendChild(actionsCol);

      habitsListContainer.appendChild(card);
    });

    // Update summary stats
    if (totalStreaksEl) totalStreaksEl.textContent = `${totalStreaksSum} Days`;
    if (todayCompletedCountEl) todayCompletedCountEl.textContent = `${todayCompletions} / ${habits.length}`;
    const rate = totalWeekSlots > 0 ? Math.round((filledWeekSlots / totalWeekSlots) * 100) : 0;
    if (overallRateEl) overallRateEl.textContent = `${rate}%`;
  }

  function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  }

  // Add Habit
  addForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (nameInput?.value || '').trim();
    if (!name) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      name,
      icon: iconInput?.value || '⭐',
      category: categoryInput?.value || 'General',
      completedDates: [],
      createdAt: Date.now(),
    };

    habits.push(newHabit);
    saveHabits(habits);
    if (nameInput) nameInput.value = '';
    render();
  });

  // Delegated Delete
  habitsListContainer?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-delete-id]') as HTMLElement | null;
    if (!btn) return;
    const id = btn.getAttribute('data-delete-id');
    if (!id) return;

    const habit = habits.find((h) => h.id === id);
    if (habit && confirm(`Delete habit "${habit.name}"?`)) {
      habits = habits.filter((h) => h.id !== id);
      saveHabits(habits);
      render();
    }
  });

  render();
});
