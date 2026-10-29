/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const STORAGE_KEY = 'toolora_checklist_items';

const TEMPLATES: Record<string, string[]> = {
  travel: [
    'Passport & Government ID',
    'Boarding passes & hotel confirmations',
    'Phone charger & universal travel adapter',
    'Headphones & portable power bank',
    'Prescription medications & mini first aid',
    'Toothbrush, toothpaste & travel toiletries',
    'Weather-appropriate jackets & extra socks',
    'Comfortable walking shoes',
  ],
  grocery: [
    'Fresh fruit (Bananas, Apples, Berries)',
    'Vegetables (Spinach, Broccoli, Carrots, Onions)',
    'Milk, yogurt & eggs',
    'Whole wheat bread & oats',
    'Olive oil & seasonings',
    'Coffee beans or tea',
    'Chicken breast or tofu',
  ],
  daily_launch: [
    'Clear desk and glass of water',
    'Check calendar for scheduled calls today',
    'Process inbox to zero or flag urgent threads',
    'Select top 3 must-win priorities',
    'Set timer for first 50-minute deep work sprint',
  ],
  event: [
    'Confirm venue reservation & access hours',
    'Send reminder invitations & track RSVPs',
    'Order catering, coffee & refreshments',
    'Test projector, microphones & sound system',
    'Print name badges & welcome signage',
    'Prepare emergency kit & extra power strips',
  ],
};

function loadItems(): ChecklistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return TEMPLATES.travel.map((text, idx) => ({
    id: `item-${idx}`,
    text,
    completed: idx < 2,
  }));
}

function saveItems(items: ChecklistItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save checklist items', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  let items = loadItems();

  const container = document.getElementById('checklist-items-container');
  const addForm = document.getElementById('checklist-single-form') as HTMLFormElement | null;
  const singleInput = document.getElementById('checklist-single-input') as HTMLInputElement | null;
  const bulkArea = document.getElementById('checklist-bulk-textarea') as HTMLTextAreaElement | null;
  const bulkAddBtn = document.getElementById('checklist-bulk-add-btn');

  // Actions
  const clearCompletedBtn = document.getElementById('checklist-clear-completed-btn');
  const resetAllBtn = document.getElementById('checklist-reset-btn');
  const copyMdBtn = document.getElementById('checklist-copy-md-btn');
  const printBtn = document.getElementById('checklist-print-btn');
  const templateSelect = document.getElementById('checklist-template-select') as HTMLSelectElement | null;
  const loadTemplateBtn = document.getElementById('checklist-load-template-btn');

  // Stats
  const totalCountEl = document.getElementById('checklist-total-count');
  const completedCountEl = document.getElementById('checklist-completed-count');
  const progressBarEl = document.getElementById('checklist-progress-bar');

  function render(): void {
    if (!container) return;
    container.innerHTML = '';

    const total = items.length;
    const completed = items.filter((i) => i.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (totalCountEl) totalCountEl.textContent = `${total} items`;
    if (completedCountEl) completedCountEl.textContent = `${completed} completed (${percent}%)`;
    if (progressBarEl) progressBarEl.style.width = `${percent}%`;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
          Checklist is empty. Add items above or pick a template!
        </div>
      `;
      return;
    }

    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = `p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
        item.completed
          ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
      }`;

      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <button type="button" data-toggle-index="${index}" class="w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
        item.completed ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-sky-500'
      }">
            ${item.completed ? '✓' : ''}
          </button>
          <span class="text-xs sm:text-sm font-medium ${
            item.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'
          } truncate">
            ${escapeHtml(item.text)}
          </span>
        </div>
        <button type="button" data-delete-index="${index}" title="Remove item" class="text-slate-400 hover:text-red-500 p-1 text-xs cursor-pointer">
          ✕
        </button>
      `;

      container.appendChild(row);
    });
  }

  function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  }

  // Delegated clicks
  container?.addEventListener('click', (e) => {
    const toggleTarget = (e.target as HTMLElement).closest('[data-toggle-index]') as HTMLElement | null;
    if (toggleTarget) {
      const idx = parseInt(toggleTarget.getAttribute('data-toggle-index') || '0', 10);
      if (items[idx]) {
        items[idx].completed = !items[idx].completed;
        saveItems(items);
        render();
      }
      return;
    }

    const deleteTarget = (e.target as HTMLElement).closest('[data-delete-index]') as HTMLElement | null;
    if (deleteTarget) {
      const idx = parseInt(deleteTarget.getAttribute('data-delete-index') || '0', 10);
      items.splice(idx, 1);
      saveItems(items);
      render();
    }
  });

  // Single Add
  addForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = (singleInput?.value || '').trim();
    if (!text) return;
    items.push({ id: `item-${Date.now()}`, text, completed: false });
    saveItems(items);
    if (singleInput) singleInput.value = '';
    render();
  });

  // Bulk Add
  bulkAddBtn?.addEventListener('click', () => {
    const text = (bulkArea?.value || '').trim();
    if (!text) return;
    const lines = text.split('\n').map((l) => l.replace(/^[-*•\d.)\]\s]+/, '').trim()).filter(Boolean);
    lines.forEach((l) => {
      items.push({ id: `item-${Date.now()}-${Math.random()}`, text: l, completed: false });
    });
    saveItems(items);
    if (bulkArea) bulkArea.value = '';
    render();
  });

  // Load Template
  loadTemplateBtn?.addEventListener('click', () => {
    const key = templateSelect?.value;
    if (!key || !TEMPLATES[key]) return;
    if (confirm(`Replace or append this template? Click OK to load template.`)) {
      items = TEMPLATES[key].map((t, idx) => ({ id: `t-${idx}-${Date.now()}`, text: t, completed: false }));
      saveItems(items);
      render();
    }
  });

  // Clear completed
  clearCompletedBtn?.addEventListener('click', () => {
    items = items.filter((i) => !i.completed);
    saveItems(items);
    render();
  });

  // Reset all
  resetAllBtn?.addEventListener('click', () => {
    items.forEach((i) => (i.completed = false));
    saveItems(items);
    render();
  });

  // Copy Markdown
  copyMdBtn?.addEventListener('click', () => {
    const md = items.map((i) => `- [${i.completed ? 'x' : ' '}] ${i.text}`).join('\n');
    navigator.clipboard.writeText(md).then(() => {
      alert('Checklist copied to clipboard as formatted Markdown!');
    });
  });

  // Print
  printBtn?.addEventListener('click', () => {
    window.print();
  });

  render();
});
