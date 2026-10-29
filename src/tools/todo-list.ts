/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';

interface TodoItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  tag: string;
  dueDate: string;
  completed: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'toolora_todo_list';

function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Default initial tasks
      return [
        {
          id: 'todo-1',
          title: 'Review project requirements and setup roadmap',
          priority: 'high',
          tag: 'Work',
          dueDate: new Date().toISOString().split('T')[0],
          completed: true,
          createdAt: Date.now() - 3600000,
        },
        {
          id: 'todo-2',
          title: 'Organize workspace and clear desktop distractions',
          priority: 'medium',
          tag: 'Personal',
          dueDate: new Date().toISOString().split('T')[0],
          completed: false,
          createdAt: Date.now() - 1800000,
        },
        {
          id: 'todo-3',
          title: 'Complete 4 Pomodoro focus sessions',
          priority: 'high',
          tag: 'Urgent',
          dueDate: new Date().toISOString().split('T')[0],
          completed: false,
          createdAt: Date.now(),
        },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTodos(todos: TodoItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (err) {
    console.error('Failed to save todos to localStorage', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  let todos: TodoItem[] = loadTodos();
  let currentFilter = 'all';
  let searchQuery = '';

  const taskForm = document.getElementById('todo-form') as HTMLFormElement | null;
  const taskInput = document.getElementById('todo-title-input') as HTMLInputElement | null;
  const prioritySelect = document.getElementById('todo-priority-select') as HTMLSelectElement | null;
  const tagSelect = document.getElementById('todo-tag-select') as HTMLSelectElement | null;
  const dueDateInput = document.getElementById('todo-due-input') as HTMLInputElement | null;
  const searchInput = document.getElementById('todo-search-input') as HTMLInputElement | null;
  const todoListContainer = document.getElementById('todo-list-container') as HTMLDivElement | null;
  const emptyState = document.getElementById('todo-empty-state') as HTMLDivElement | null;

  // Stats
  const totalCountEl = document.getElementById('todo-total-count');
  const completedCountEl = document.getElementById('todo-completed-count');
  const pendingCountEl = document.getElementById('todo-pending-count');
  const progressPercentEl = document.getElementById('todo-progress-percent');
  const progressBarEl = document.getElementById('todo-progress-bar');

  // Action buttons
  const clearCompletedBtn = document.getElementById('todo-clear-completed-btn');
  const exportJsonBtn = document.getElementById('todo-export-json-btn');
  const exportCsvBtn = document.getElementById('todo-export-csv-btn');
  const importFileBtn = document.getElementById('todo-import-file-btn');
  const fileInput = document.getElementById('todo-file-input') as HTMLInputElement | null;
  const filterBtns = document.querySelectorAll<HTMLButtonElement>('.todo-filter-btn');

  // Set default due date to today
  if (dueDateInput) {
    dueDateInput.value = new Date().toISOString().split('T')[0];
  }

  function render(): void {
    if (!todoListContainer) return;

    // Filter todos
    const filtered = todos.filter((item) => {
      if (currentFilter === 'active' && item.completed) return false;
      if (currentFilter === 'completed' && !item.completed) return false;
      if (currentFilter === 'high' && item.priority !== 'high') return false;
      if (currentFilter === 'work' && item.tag.toLowerCase() !== 'work') return false;
      if (currentFilter === 'personal' && item.tag.toLowerCase() !== 'personal') return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.tag.toLowerCase().includes(query) ||
          item.priority.toLowerCase().includes(query)
        );
      }
      return true;
    });

    // Update stats
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (totalCountEl) totalCountEl.textContent = String(total);
    if (completedCountEl) completedCountEl.textContent = String(completed);
    if (pendingCountEl) pendingCountEl.textContent = String(pending);
    if (progressPercentEl) progressPercentEl.textContent = `${percent}%`;
    if (progressBarEl) progressBarEl.style.width = `${percent}%`;

    // Empty state
    if (filtered.length === 0) {
      todoListContainer.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // Build DOM
    todoListContainer.innerHTML = '';
    filtered.forEach((todo) => {
      const itemEl = document.createElement('div');
      itemEl.className = `p-4 rounded-xl border transition-all flex items-start gap-3 group ${
        todo.completed
          ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs hover:border-blue-300 dark:hover:border-blue-600'
      }`;

      const priorityBadgeColors: Record<string, string> = {
        high: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-800',
        medium: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      };

      const tagBadgeColors: Record<string, string> = {
        Work: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        Personal: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800',
        Shopping: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        Urgent: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800',
        General: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      };

      itemEl.innerHTML = `
        <button type="button" data-action="toggle" data-id="${todo.id}" class="mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
        todo.completed
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
      }">
          ${todo.completed ? '✓' : ''}
        </button>
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <span class="text-xs px-2 py-0.5 rounded-md font-semibold border ${priorityBadgeColors[todo.priority] || priorityBadgeColors.low}">
              ${todo.priority.toUpperCase()}
            </span>
            <span class="text-xs px-2 py-0.5 rounded-md font-medium border ${tagBadgeColors[todo.tag] || tagBadgeColors.General}">
              ${todo.tag}
            </span>
            ${
              todo.dueDate
                ? `<span class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    📅 ${todo.dueDate}
                   </span>`
                : ''
            }
          </div>
          <p class="text-sm font-medium ${
            todo.completed
              ? 'line-through text-slate-400 dark:text-slate-500'
              : 'text-slate-800 dark:text-slate-100'
          }">
            ${escapeHtml(todo.title)}
          </p>
        </div>
        <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button type="button" data-action="delete" data-id="${todo.id}" title="Delete task" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer transition-colors">
            ✕
          </button>
        </div>
      `;

      todoListContainer.appendChild(itemEl);
    });
  }

  function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  }

  // Add Task Form
  taskForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = (taskInput?.value || '').trim();
    if (!title) return;

    const newItem: TodoItem = {
      id: `todo-${Date.now()}`,
      title,
      priority: (prioritySelect?.value as 'high' | 'medium' | 'low') || 'medium',
      tag: tagSelect?.value || 'General',
      dueDate: dueDateInput?.value || '',
      completed: false,
      createdAt: Date.now(),
    };

    todos.unshift(newItem);
    saveTodos(todos);
    if (taskInput) taskInput.value = '';
    render();
  });

  // Delegated Clicks (Toggle, Delete)
  todoListContainer?.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!target) return;

    const action = target.getAttribute('data-action');
    const id = target.getAttribute('data-id');
    if (!id) return;

    if (action === 'toggle') {
      todos = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      saveTodos(todos);
      render();
    } else if (action === 'delete') {
      todos = todos.filter((t) => t.id !== id);
      saveTodos(todos);
      render();
    }
  });

  // Filter Buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => {
        b.classList.remove('bg-blue-600', 'text-white', 'font-semibold');
        b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      });
      btn.classList.add('bg-blue-600', 'text-white', 'font-semibold');
      btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');

      currentFilter = btn.getAttribute('data-filter') || 'all';
      render();
    });
  });

  // Search input
  searchInput?.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value.trim();
    render();
  });

  // Clear completed
  clearCompletedBtn?.addEventListener('click', () => {
    const completedCount = todos.filter((t) => t.completed).length;
    if (completedCount === 0) return;
    if (confirm(`Clear all ${completedCount} completed tasks?`)) {
      todos = todos.filter((t) => !t.completed);
      saveTodos(todos);
      render();
    }
  });

  // Export JSON
  exportJsonBtn?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(todos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Export CSV
  exportCsvBtn?.addEventListener('click', () => {
    const headers = ['ID', 'Title', 'Priority', 'Tag', 'Due Date', 'Completed', 'Created At'];
    const rows = todos.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.priority,
      t.tag,
      t.dueDate,
      t.completed ? 'Yes' : 'No',
      new Date(t.createdAt).toISOString(),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import JSON
  importFileBtn?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          todos = imported;
          saveTodos(todos);
          render();
          alert(`Successfully imported ${imported.length} tasks!`);
        }
      } catch {
        alert('Invalid JSON file format.');
      }
      fileInput.value = '';
    };
    reader.readAsText(file);
  });

  render();
});
