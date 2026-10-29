/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PERIODIC_TABLE, searchElements, ChemicalElement } from '../utils/educationUtils.ts';

export function initPeriodicTable(): void {
  const gridContainer = document.getElementById('elements-grid') as HTMLDivElement | null;
  const searchInput = document.getElementById('search-element') as HTMLInputElement | null;
  const modal = document.getElementById('element-modal') as HTMLDivElement | null;
  const modalTitle = document.getElementById('modal-title') as HTMLHeadingElement | null;
  const modalDetails = document.getElementById('modal-details') as HTMLDivElement | null;
  const closeModalBtn = document.getElementById('close-modal') as HTMLButtonElement | null;

  const categoryColors: Record<string, string> = {
    'reactive nonmetal': 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    'noble gas': 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
    'alkali metal': 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
    'alkaline earth metal': 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    'metalloid': 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    'post-transition metal': 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700',
    'transition metal': 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    'actinide': 'bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-700'
  };

  function renderGrid(elements: ChemicalElement[]) {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    elements.forEach(el => {
      const color = categoryColors[el.category] || 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300';
      const div = document.createElement('div');
      div.className = `p-2.5 rounded-xl border ${color} text-center cursor-pointer hover:scale-105 transition-all shadow-2xs flex flex-col items-center justify-center aspect-square`;
      div.innerHTML = `
        <span class="text-[10px] text-slate-400">${el.number}</span>
        <span class="text-lg font-bold">${el.symbol}</span>
        <span class="text-[9px] truncate max-w-full font-medium">${el.name}</span>
      `;
      div.addEventListener('click', () => showDetails(el));
      gridContainer.appendChild(div);
    });
  }

  function showDetails(el: ChemicalElement) {
    if (modalTitle) modalTitle.textContent = `${el.name} (${el.symbol}) - #${el.number}`;
    if (modalDetails) {
      modalDetails.innerHTML = `
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div><span class="text-slate-400">Atomic Mass:</span> <strong>${el.atomicMass} u</strong></div>
          <div><span class="text-slate-400">Category:</span> <strong class="capitalize">${el.category}</strong></div>
          <div><span class="text-slate-400">Period:</span> <strong>${el.period}</strong></div>
          <div><span class="text-slate-400">Group:</span> <strong>${el.group}</strong></div>
          <div class="col-span-2"><span class="text-slate-400">Electron Configuration:</span> <strong class="font-mono">${el.electronConfig}</strong></div>
          <div class="col-span-2 mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">${el.summary}</div>
        </div>
      `;
    }
    if (modal) modal.classList.remove('hidden');
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value;
      renderGrid(searchElements(q));
    });
  }

  renderGrid(PERIODIC_TABLE);
}

document.addEventListener('DOMContentLoaded', initPeriodicTable);
