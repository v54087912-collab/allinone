/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';
import { calculateProsConsScore, pickRandomItem, playSyntheticAudioTone, ProsConsItem } from '../utils/productivityUtils.js';

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  // Mode Tabs
  const tabChoice = document.getElementById('tab-choice-btn');
  const tabCoin = document.getElementById('tab-coin-btn');
  const tabProsCons = document.getElementById('tab-pros-cons-btn');

  const sectionChoice = document.getElementById('section-choice');
  const sectionCoin = document.getElementById('section-coin');
  const sectionProsCons = document.getElementById('section-pros-cons');

  function switchTab(mode: 'choice' | 'coin' | 'pros_cons'): void {
    [tabChoice, tabCoin, tabProsCons].forEach((t) => t?.classList.remove('bg-amber-600', 'text-white', 'font-bold'));
    [sectionChoice, sectionCoin, sectionProsCons].forEach((s) => s?.classList.add('hidden'));

    if (mode === 'choice') {
      tabChoice?.classList.add('bg-amber-600', 'text-white', 'font-bold');
      sectionChoice?.classList.remove('hidden');
    } else if (mode === 'coin') {
      tabCoin?.classList.add('bg-amber-600', 'text-white', 'font-bold');
      sectionCoin?.classList.remove('hidden');
    } else {
      tabProsCons?.classList.add('bg-amber-600', 'text-white', 'font-bold');
      sectionProsCons?.classList.remove('hidden');
    }
  }

  tabChoice?.addEventListener('click', () => switchTab('choice'));
  tabCoin?.addEventListener('click', () => switchTab('coin'));
  tabProsCons?.addEventListener('click', () => switchTab('pros_cons'));

  // 1. RANDOM CHOICE PICKER
  const choiceInput = document.getElementById('choice-options-textarea') as HTMLTextAreaElement | null;
  const pickChoiceBtn = document.getElementById('choice-pick-btn');
  const choiceResultEl = document.getElementById('choice-result-display');

  pickChoiceBtn?.addEventListener('click', () => {
    const raw = choiceInput?.value || '';
    const options = raw.split('\n').map((s) => s.trim()).filter(Boolean);
    if (options.length === 0) {
      alert('Please enter at least 2 choices.');
      return;
    }

    playSyntheticAudioTone('spinner_tick');
    const chosen = pickRandomItem(options);
    if (chosen && choiceResultEl) {
      choiceResultEl.textContent = chosen.item;
      choiceResultEl.classList.remove('scale-95');
      choiceResultEl.classList.add('scale-105');
      setTimeout(() => choiceResultEl.classList.remove('scale-105'), 200);
      playSyntheticAudioTone('success_fanfare');
    }
  });

  // 2. COIN FLIP
  const coinFlipBtn = document.getElementById('coin-flip-btn');
  const coinEl = document.getElementById('coin-display');
  const coinResultEl = document.getElementById('coin-result-text');
  const headsCountEl = document.getElementById('coin-heads-count');
  const tailsCountEl = document.getElementById('coin-tails-count');

  let headsCount = 0;
  let tailsCount = 0;
  let isFlipping = false;

  coinFlipBtn?.addEventListener('click', () => {
    if (isFlipping) return;
    isFlipping = true;

    playSyntheticAudioTone('spinner_tick');
    if (coinEl) {
      coinEl.classList.add('animate-spin');
    }

    setTimeout(() => {
      const isHeads = Math.random() < 0.5;
      if (coinEl) {
        coinEl.classList.remove('animate-spin');
        coinEl.textContent = isHeads ? '🪙 HEADS' : '🪙 TAILS';
      }

      if (isHeads) {
        headsCount++;
        if (coinResultEl) coinResultEl.textContent = 'Result: HEADS!';
      } else {
        tailsCount++;
        if (coinResultEl) coinResultEl.textContent = 'Result: TAILS!';
      }

      if (headsCountEl) headsCountEl.textContent = String(headsCount);
      if (tailsCountEl) tailsCountEl.textContent = String(tailsCount);

      isFlipping = false;
      playSyntheticAudioTone('pomodoro_complete');
    }, 600);
  });

  // 3. PROS & CONS ANALYZER
  let prosList: ProsConsItem[] = [
    { id: 'p1', text: 'Significant salary bump & benefits', weight: 5 },
    { id: 'p2', text: 'Remote work flexibility', weight: 4 },
  ];
  let consList: ProsConsItem[] = [
    { id: 'c1', text: 'Steeper initial learning curve', weight: 3 },
  ];

  const prosContainer = document.getElementById('pros-list-container');
  const consContainer = document.getElementById('cons-list-container');
  const proInput = document.getElementById('add-pro-input') as HTMLInputElement | null;
  const proWeight = document.getElementById('add-pro-weight') as HTMLSelectElement | null;
  const addProBtn = document.getElementById('add-pro-btn');

  const conInput = document.getElementById('add-con-input') as HTMLInputElement | null;
  const conWeight = document.getElementById('add-con-weight') as HTMLSelectElement | null;
  const addConBtn = document.getElementById('add-con-btn');

  const prosScoreEl = document.getElementById('pros-total-score');
  const consScoreEl = document.getElementById('cons-total-score');
  const recommendationBadge = document.getElementById('pros-cons-recommendation');

  function renderProsCons(): void {
    if (!prosContainer || !consContainer) return;
    prosContainer.innerHTML = '';
    consContainer.innerHTML = '';

    prosList.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs';
      div.innerHTML = `
        <span class="font-medium text-emerald-900 dark:text-emerald-200 truncate">${escapeHtml(item.text)}</span>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900 px-1.5 py-0.5 rounded text-[10px]">W${item.weight}</span>
          <button type="button" data-del-pro="${index}" class="text-slate-400 hover:text-red-500 cursor-pointer">✕</button>
        </div>
      `;
      prosContainer.appendChild(div);
    });

    consList.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs';
      div.innerHTML = `
        <span class="font-medium text-rose-900 dark:text-rose-200 truncate">${escapeHtml(item.text)}</span>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900 px-1.5 py-0.5 rounded text-[10px]">W${item.weight}</span>
          <button type="button" data-del-con="${index}" class="text-slate-400 hover:text-red-500 cursor-pointer">✕</button>
        </div>
      `;
      consContainer.appendChild(div);
    });

    const res = calculateProsConsScore(prosList, consList);
    if (prosScoreEl) prosScoreEl.textContent = `+${res.prosTotal}`;
    if (consScoreEl) consScoreEl.textContent = `-${res.consTotal}`;

    if (recommendationBadge) {
      const recLabels: Record<string, { label: string; class: string }> = {
        strong_yes: { label: '✅ Strong YES - The advantages clearly outweigh the drawbacks!', class: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' },
        lean_yes: { label: '👍 Lean YES - Favorable overall score.', class: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200' },
        neutral: { label: '⚖️ Neutral - Pros and Cons are equally weighted.', class: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200' },
        lean_no: { label: '👎 Lean NO - Drawbacks currently outweigh benefits.', class: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900 dark:text-rose-200' },
        strong_no: { label: '🛑 Strong NO - Heavy risks or negative trade-offs!', class: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300' },
      };
      const rec = recLabels[res.recommendation];
      recommendationBadge.textContent = rec.label;
      recommendationBadge.className = `text-xs font-bold px-4 py-2 rounded-2xl border ${rec.class}`;
    }
  }

  addProBtn?.addEventListener('click', () => {
    const text = (proInput?.value || '').trim();
    if (!text) return;
    prosList.push({ id: `p-${Date.now()}`, text, weight: parseInt(proWeight?.value || '3', 10) });
    if (proInput) proInput.value = '';
    renderProsCons();
  });

  addConBtn?.addEventListener('click', () => {
    const text = (conInput?.value || '').trim();
    if (!text) return;
    consList.push({ id: `c-${Date.now()}`, text, weight: parseInt(conWeight?.value || '3', 10) });
    if (conInput) conInput.value = '';
    renderProsCons();
  });

  document.addEventListener('click', (e) => {
    const delProBtn = (e.target as HTMLElement).closest('[data-del-pro]') as HTMLElement | null;
    if (delProBtn) {
      const idx = parseInt(delProBtn.getAttribute('data-del-pro') || '0', 10);
      prosList.splice(idx, 1);
      renderProsCons();
      return;
    }

    const delConBtn = (e.target as HTMLElement).closest('[data-del-con]') as HTMLElement | null;
    if (delConBtn) {
      const idx = parseInt(delConBtn.getAttribute('data-del-con') || '0', 10);
      consList.splice(idx, 1);
      renderProsCons();
    }
  });

  function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  }

  renderProsCons();
});
