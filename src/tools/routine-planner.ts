/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';

interface RoutineStep {
  id: string;
  name: string;
  durationMins: number;
  icon: string;
  completed?: boolean;
}

interface RoutineData {
  morning: RoutineStep[];
  afternoon: RoutineStep[];
  evening: RoutineStep[];
}

const STORAGE_KEY = 'toolora_routine_planner';

function loadRoutines(): RoutineData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {
    morning: [
      { id: 'm1', name: 'Drink 500ml water', durationMins: 2, icon: '💧' },
      { id: 'm2', name: '10 mins stretching & mobility', durationMins: 10, icon: '🧘' },
      { id: 'm3', name: 'Healthy breakfast & coffee', durationMins: 20, icon: '☕' },
      { id: 'm4', name: 'Review top priorities of the day', durationMins: 5, icon: '🎯' },
    ],
    afternoon: [
      { id: 'a1', name: '15 mins brisk walk outdoors', durationMins: 15, icon: '🚶' },
      { id: 'a2', name: 'Quick desk tidy & inbox zero check', durationMins: 10, icon: '📥' },
    ],
    evening: [
      { id: 'e1', name: 'Screen shutdown & digital detox', durationMins: 15, icon: '📵' },
      { id: 'e2', name: 'Prepare clothes & to-do list for tomorrow', durationMins: 10, icon: '📋' },
      { id: 'e3', name: 'Read book in bed', durationMins: 20, icon: '📖' },
    ],
  };
}

function saveRoutines(data: RoutineData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save routines', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  let routines = loadRoutines();

  // Containers
  const morningList = document.getElementById('morning-routine-list');
  const afternoonList = document.getElementById('afternoon-routine-list');
  const eveningList = document.getElementById('evening-routine-list');

  // Totals
  const morningTotalEl = document.getElementById('morning-total-time');
  const afternoonTotalEl = document.getElementById('afternoon-total-time');
  const eveningTotalEl = document.getElementById('evening-total-time');

  // Form DOM
  const addForm = document.getElementById('routine-add-form') as HTMLFormElement | null;
  const sectionSelect = document.getElementById('routine-section-select') as HTMLSelectElement | null;
  const nameInput = document.getElementById('routine-name-input') as HTMLInputElement | null;
  const durationInput = document.getElementById('routine-duration-input') as HTMLInputElement | null;
  const iconSelect = document.getElementById('routine-icon-select') as HTMLSelectElement | null;
  const resetChecksBtn = document.getElementById('routine-reset-checks-btn');

  function renderSection(
    sectionKey: 'morning' | 'afternoon' | 'evening',
    container: HTMLElement | null,
    totalEl: HTMLElement | null
  ): void {
    if (!container) return;
    container.innerHTML = '';

    const list = routines[sectionKey];
    const totalMinutes = list.reduce((sum, item) => sum + item.durationMins, 0);
    if (totalEl) totalEl.textContent = `${totalMinutes} mins total`;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          No routine steps yet. Add one below!
        </div>
      `;
      return;
    }

    list.forEach((step, index) => {
      const row = document.createElement('div');
      row.className = `p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
        step.completed
          ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
      }`;

      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <button type="button" data-toggle-step="${sectionKey}:${index}" class="w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
        step.completed
          ? 'bg-emerald-600 border-emerald-600 text-white'
          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
      }">
            ${step.completed ? '✓' : ''}
          </button>
          <span class="text-lg shrink-0">${step.icon}</span>
          <span class="text-xs font-semibold ${
            step.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
          } truncate">
            ${escapeHtml(step.name)}
          </span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            ${step.durationMins}m
          </span>
          <button type="button" data-delete-step="${sectionKey}:${index}" class="text-slate-400 hover:text-red-500 p-1 text-xs cursor-pointer">
            ✕
          </button>
        </div>
      `;

      container.appendChild(row);
    });
  }

  function renderAll(): void {
    renderSection('morning', morningList, morningTotalEl);
    renderSection('afternoon', afternoonList, afternoonTotalEl);
    renderSection('evening', eveningList, eveningTotalEl);
  }

  function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  }

  // Delegated clicks for step check and delete
  document.addEventListener('click', (e) => {
    const toggleTarget = (e.target as HTMLElement).closest('[data-toggle-step]') as HTMLElement | null;
    if (toggleTarget) {
      const val = toggleTarget.getAttribute('data-toggle-step');
      if (val) {
        const [sec, idxStr] = val.split(':');
        const sectionKey = sec as 'morning' | 'afternoon' | 'evening';
        const idx = parseInt(idxStr, 10);
        if (routines[sectionKey][idx]) {
          routines[sectionKey][idx].completed = !routines[sectionKey][idx].completed;
          saveRoutines(routines);
          renderAll();
        }
      }
      return;
    }

    const deleteTarget = (e.target as HTMLElement).closest('[data-delete-step]') as HTMLElement | null;
    if (deleteTarget) {
      const val = deleteTarget.getAttribute('data-delete-step');
      if (val) {
        const [sec, idxStr] = val.split(':');
        const sectionKey = sec as 'morning' | 'afternoon' | 'evening';
        const idx = parseInt(idxStr, 10);
        routines[sectionKey].splice(idx, 1);
        saveRoutines(routines);
        renderAll();
      }
    }
  });

  // Add Step Form
  addForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const section = (sectionSelect?.value as 'morning' | 'afternoon' | 'evening') || 'morning';
    const name = (nameInput?.value || '').trim();
    if (!name) return;

    const newStep: RoutineStep = {
      id: `step-${Date.now()}`,
      name,
      durationMins: Math.max(1, parseInt(durationInput?.value || '10', 10)),
      icon: iconSelect?.value || '⚡',
      completed: false,
    };

    routines[section].push(newStep);
    saveRoutines(routines);
    if (nameInput) nameInput.value = '';
    renderAll();
  });

  // Reset checkboxes
  resetChecksBtn?.addEventListener('click', () => {
    ['morning', 'afternoon', 'evening'].forEach((sec) => {
      routines[sec as 'morning' | 'afternoon' | 'evening'].forEach((st) => (st.completed = false));
    });
    saveRoutines(routines);
    renderAll();
  });

  renderAll();
});
