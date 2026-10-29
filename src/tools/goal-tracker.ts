/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';

interface Milestone {
  id: string;
  text: string;
  done: boolean;
}

interface Goal {
  id: string;
  title: string;
  category: string;
  currentValue: number;
  targetValue: number;
  unit: string; // e.g. "$", "books", "km", "%"
  deadline: string; // YYYY-MM-DD
  milestones: Milestone[];
  completed: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'toolora_goals';

function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [
    {
      id: 'g-1',
      title: 'Build Emergency Fund',
      category: 'Finance',
      currentValue: 3500,
      targetValue: 5000,
      unit: '$',
      deadline: '2026-12-31',
      milestones: [
        { id: 'm-1', text: 'Open high-yield savings account', done: true },
        { id: 'm-2', text: 'Reach $2,500 milestone', done: true },
        { id: 'm-3', text: 'Automate weekly deposit', done: false },
      ],
      completed: false,
      createdAt: Date.now() - 86400000 * 30,
    },
    {
      id: 'g-2',
      title: 'Read Non-Fiction Books',
      category: 'Learning',
      currentValue: 18,
      targetValue: 24,
      unit: 'books',
      deadline: '2026-11-30',
      milestones: [
        { id: 'm-4', text: 'Read 2 books per month', done: true },
      ],
      completed: false,
      createdAt: Date.now() - 86400000 * 60,
    },
  ];
}

function saveGoals(goals: Goal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch (err) {
    console.error('Failed to save goals', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  let goals = loadGoals();
  let currentFilter = 'all';

  // DOM elements
  const goalsContainer = document.getElementById('goals-container');
  const addForm = document.getElementById('goal-add-form') as HTMLFormElement | null;
  const titleInput = document.getElementById('goal-title-input') as HTMLInputElement | null;
  const categorySelect = document.getElementById('goal-category-select') as HTMLSelectElement | null;
  const targetValInput = document.getElementById('goal-target-val') as HTMLInputElement | null;
  const unitInput = document.getElementById('goal-unit-input') as HTMLInputElement | null;
  const deadlineInput = document.getElementById('goal-deadline-input') as HTMLInputElement | null;

  // Stats
  const activeCountEl = document.getElementById('goals-active-count');
  const completedCountEl = document.getElementById('goals-completed-count');
  const overallProgressEl = document.getElementById('goals-overall-progress');

  // Filter Buttons
  const filterBtns = document.querySelectorAll<HTMLButtonElement>('.goal-filter-btn');

  function render(): void {
    if (!goalsContainer) return;
    goalsContainer.innerHTML = '';

    const activeGoals = goals.filter((g) => !g.completed);
    const completedGoals = goals.filter((g) => g.completed);

    if (activeCountEl) activeCountEl.textContent = String(activeGoals.length);
    if (completedCountEl) completedCountEl.textContent = String(completedGoals.length);

    let totalProgressSum = 0;
    goals.forEach((g) => {
      const p = Math.min(100, Math.round((g.currentValue / Math.max(1, g.targetValue)) * 100));
      totalProgressSum += p;
    });
    const avgProgress = goals.length > 0 ? Math.round(totalProgressSum / goals.length) : 0;
    if (overallProgressEl) overallProgressEl.textContent = `${avgProgress}%`;

    const filtered = goals.filter((g) => {
      if (currentFilter === 'active' && g.completed) return false;
      if (currentFilter === 'completed' && !g.completed) return false;
      return true;
    });

    if (filtered.length === 0) {
      goalsContainer.innerHTML = `
        <div class="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-sm text-slate-400">
          No goals found. Set a new objective below!
        </div>
      `;
      return;
    }

    filtered.forEach((goal) => {
      const percent = Math.min(100, Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 100));
      const isComplete = percent >= 100 || goal.completed;

      // Days remaining calculation
      let daysRemainingText = 'No deadline';
      if (goal.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(goal.deadline + 'T00:00:00');
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          daysRemainingText = `⚠️ Overdue by ${Math.abs(diffDays)}d`;
        } else if (diffDays === 0) {
          daysRemainingText = '🔥 Due today!';
        } else {
          daysRemainingText = `⏳ ${diffDays} days left`;
        }
      }

      const card = document.createElement('div');
      card.className = `p-6 bg-white dark:bg-slate-900 border rounded-3xl shadow-xs transition-all ${
        isComplete
          ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/20'
          : 'border-slate-200 dark:border-slate-800'
      }`;

      card.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                ${goal.category}
              </span>
              <span class="text-xs text-slate-400 font-medium">${daysRemainingText}</span>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white mt-1.5">${escapeHtml(goal.title)}</h3>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" data-add-progress="${goal.id}:1" class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer">
              +1
            </button>
            <button type="button" data-add-progress="${goal.id}:5" class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer">
              +5
            </button>
            <button type="button" data-delete-goal="${goal.id}" title="Delete goal" class="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer">
              ✕
            </button>
          </div>
        </div>

        <!-- Metric & Progress Bar -->
        <div class="mb-4">
          <div class="flex items-baseline justify-between text-xs mb-1.5 font-bold">
            <span class="text-slate-700 dark:text-slate-300">
              ${goal.unit === '$' ? '$' : ''}${goal.currentValue} / ${goal.unit === '$' ? '$' : ''}${goal.targetValue} ${goal.unit !== '$' ? goal.unit : ''}
            </span>
            <span class="${isComplete ? 'text-emerald-600' : 'text-purple-600'}">${percent}%</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div class="${isComplete ? 'bg-emerald-500' : 'bg-purple-600'} h-3 rounded-full transition-all duration-300" style="width: ${percent}%"></div>
          </div>
        </div>

        <!-- Milestones list -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          ${goal.milestones
            .map(
              (m, idx) => `
            <div class="flex items-center gap-2 text-xs">
              <button type="button" data-toggle-milestone="${goal.id}:${idx}" class="w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                m.done ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 dark:border-slate-600'
              }">
                ${m.done ? '✓' : ''}
              </button>
              <span class="${m.done ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-300'}">${escapeHtml(m.text)}</span>
            </div>
          `
            )
            .join('')}
        </div>
      `;

      goalsContainer.appendChild(card);
    });
  }

  function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  }

  // Delegated interactions
  goalsContainer?.addEventListener('click', (e) => {
    // Add progress
    const progressBtn = (e.target as HTMLElement).closest('[data-add-progress]') as HTMLElement | null;
    if (progressBtn) {
      const val = progressBtn.getAttribute('data-add-progress');
      if (val) {
        const [id, incStr] = val.split(':');
        const inc = parseFloat(incStr);
        const goal = goals.find((g) => g.id === id);
        if (goal) {
          goal.currentValue = Math.min(goal.targetValue, goal.currentValue + inc);
          if (goal.currentValue >= goal.targetValue) goal.completed = true;
          saveGoals(goals);
          render();
        }
      }
      return;
    }

    // Toggle milestone
    const milestoneBtn = (e.target as HTMLElement).closest('[data-toggle-milestone]') as HTMLElement | null;
    if (milestoneBtn) {
      const val = milestoneBtn.getAttribute('data-toggle-milestone');
      if (val) {
        const [goalId, idxStr] = val.split(':');
        const idx = parseInt(idxStr, 10);
        const goal = goals.find((g) => g.id === goalId);
        if (goal && goal.milestones[idx]) {
          goal.milestones[idx].done = !goal.milestones[idx].done;
          saveGoals(goals);
          render();
        }
      }
      return;
    }

    // Delete goal
    const deleteBtn = (e.target as HTMLElement).closest('[data-delete-goal]') as HTMLElement | null;
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-delete-goal');
      if (id) {
        const goal = goals.find((g) => g.id === id);
        if (goal && confirm(`Delete goal "${goal.title}"?`)) {
          goals = goals.filter((g) => g.id !== id);
          saveGoals(goals);
          render();
        }
      }
    }
  });

  // Filter Buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('bg-purple-600', 'text-white', 'font-semibold'));
      btn.classList.add('bg-purple-600', 'text-white', 'font-semibold');
      currentFilter = btn.getAttribute('data-filter') || 'all';
      render();
    });
  });

  // Add Goal Form
  addForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = (titleInput?.value || '').trim();
    if (!title) return;

    const newGoal: Goal = {
      id: `g-${Date.now()}`,
      title,
      category: categorySelect?.value || 'Personal',
      currentValue: 0,
      targetValue: Math.max(1, parseFloat(targetValInput?.value || '100')),
      unit: unitInput?.value || '%',
      deadline: deadlineInput?.value || '',
      milestones: [],
      completed: false,
      createdAt: Date.now(),
    };

    goals.unshift(newGoal);
    saveGoals(goals);
    if (titleInput) titleInput.value = '';
    render();
  });

  render();
});
