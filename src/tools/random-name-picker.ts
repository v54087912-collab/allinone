/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';
import { pickRandomItem, shuffleArray, playSyntheticAudioTone, fireCanvasConfetti } from '../utils/productivityUtils.js';

interface WinnerRecord {
  name: string;
  timestamp: string;
}

const PRESETS: Record<string, string[]> = {
  classroom: ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William'],
  team: ['Alex (Frontend)', 'Jordan (Backend)', 'Taylor (Design)', 'Morgan (QA)', 'Casey (DevOps)', 'Riley (PM)'],
  raffle: ['Ticket #102', 'Ticket #245', 'Ticket #318', 'Ticket #490', 'Ticket #512', 'Ticket #670'],
};

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  let winnersHistory: WinnerRecord[] = [];

  const namesArea = document.getElementById('picker-names-textarea') as HTMLTextAreaElement | null;
  const countBadge = document.getElementById('picker-names-count');
  const pickBtn = document.getElementById('picker-pick-btn');
  const shuffleBtn = document.getElementById('picker-shuffle-btn');
  const clearBtn = document.getElementById('picker-clear-btn');
  const winnerModal = document.getElementById('picker-winner-modal');
  const winnerNameEl = document.getElementById('picker-winner-name');
  const closeWinnerBtn = document.getElementById('picker-close-winner-btn');
  const removeWinnerCb = document.getElementById('picker-remove-winner-cb') as HTMLInputElement | null;
  const historyList = document.getElementById('picker-history-list');
  const clearHistoryBtn = document.getElementById('picker-clear-history-btn');
  const confettiCanvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;

  // Preset buttons
  const presetClassroom = document.getElementById('preset-classroom-btn');
  const presetTeam = document.getElementById('preset-team-btn');
  const presetRaffle = document.getElementById('preset-raffle-btn');

  function getNames(): string[] {
    const raw = namesArea?.value || '';
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function setNames(list: string[]): void {
    if (namesArea) namesArea.value = list.join('\n');
    updateCount();
  }

  function updateCount(): void {
    const count = getNames().length;
    if (countBadge) countBadge.textContent = `${count} names in pool`;
  }

  namesArea?.addEventListener('input', updateCount);

  // Presets
  presetClassroom?.addEventListener('click', () => setNames(PRESETS.classroom));
  presetTeam?.addEventListener('click', () => setNames(PRESETS.team));
  presetRaffle?.addEventListener('click', () => setNames(PRESETS.raffle));

  // Shuffle
  shuffleBtn?.addEventListener('click', () => {
    const list = getNames();
    if (list.length > 1) {
      setNames(shuffleArray(list));
    }
  });

  // Clear
  clearBtn?.addEventListener('click', () => {
    if (confirm('Clear all names?')) {
      setNames([]);
    }
  });

  // Pick Winner with suspense animation
  let isPicking = false;
  pickBtn?.addEventListener('click', () => {
    if (isPicking) return;
    const list = getNames();
    if (list.length === 0) {
      alert('Please enter at least one name.');
      return;
    }

    isPicking = true;
    if (pickBtn) {
      pickBtn.textContent = '🎲 Picking...';
      pickBtn.setAttribute('disabled', 'true');
    }

    let iterations = 0;
    const maxIterations = 20;
    const interval = setInterval(() => {
      iterations++;
      playSyntheticAudioTone('spinner_tick');
      const randomCandidate = list[Math.floor(Math.random() * list.length)];

      if (winnerNameEl) {
        winnerNameEl.textContent = randomCandidate;
      }

      if (iterations >= maxIterations) {
        clearInterval(interval);
        const finalChosen = pickRandomItem(list);
        if (finalChosen) {
          showWinner(finalChosen.item);
          if (removeWinnerCb?.checked) {
            list.splice(finalChosen.index, 1);
            setNames(list);
          }
        }
        isPicking = false;
        if (pickBtn) {
          pickBtn.textContent = '🎉 Pick Winner!';
          pickBtn.removeAttribute('disabled');
        }
      }
    }, 80);
  });

  function showWinner(name: string): void {
    if (winnerNameEl) winnerNameEl.textContent = name;
    if (winnerModal) winnerModal.classList.remove('hidden');

    playSyntheticAudioTone('success_fanfare');
    if (confettiCanvas) {
      fireCanvasConfetti(confettiCanvas);
    }

    winnersHistory.unshift({
      name,
      timestamp: new Date().toLocaleTimeString(),
    });
    renderHistory();
  }

  closeWinnerBtn?.addEventListener('click', () => {
    if (winnerModal) winnerModal.classList.add('hidden');
  });

  function renderHistory(): void {
    if (!historyList) return;
    historyList.innerHTML = '';

    if (winnersHistory.length === 0) {
      historyList.innerHTML = `<li class="text-xs text-slate-400">No winners picked yet.</li>`;
      return;
    }

    winnersHistory.forEach((rec, idx) => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-0';
      li.innerHTML = `
        <span class="font-bold text-slate-800 dark:text-slate-200">#${winnersHistory.length - idx} ${escapeHtml(rec.name)}</span>
        <span class="text-slate-400 font-mono text-[10px]">${rec.timestamp}</span>
      `;
      historyList.appendChild(li);
    });
  }

  clearHistoryBtn?.addEventListener('click', () => {
    winnersHistory = [];
    renderHistory();
  });

  function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  }

  updateCount();
  renderHistory();
});
