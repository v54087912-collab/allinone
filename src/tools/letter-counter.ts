/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { analyzeLetterCounts } from '../utils/handwritingUtils.ts';

export function initLetterCounter(): void {
  const textInput = document.getElementById('letter-text-input') as HTMLTextAreaElement | null;
  const countLetters = document.getElementById('stat-letters') as HTMLHeadingElement | null;
  const countTotalChars = document.getElementById('stat-total-chars') as HTMLHeadingElement | null;
  const countWords = document.getElementById('stat-words') as HTMLHeadingElement | null;
  const countSentences = document.getElementById('stat-sentences') as HTMLHeadingElement | null;
  const countDigits = document.getElementById('stat-digits') as HTMLHeadingElement | null;
  const limitsContainer = document.getElementById('limits-container') as HTMLDivElement | null;
  const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement | null;

  function update() {
    const text = textInput?.value || '';
    const res = analyzeLetterCounts(text);

    if (countLetters) countLetters.textContent = res.letters.toLocaleString();
    if (countTotalChars) countTotalChars.textContent = res.characters.toLocaleString();
    if (countWords) countWords.textContent = res.words.toLocaleString();
    if (countSentences) countSentences.textContent = res.sentences.toLocaleString();
    if (countDigits) countDigits.textContent = res.digits.toLocaleString();

    if (limitsContainer) {
      limitsContainer.innerHTML = '';
      for (const limit of Object.values(res.limits)) {
        const isOver = limit.isOver;
        const barColor = isOver ? 'bg-red-500' : limit.percent > 85 ? 'bg-amber-500' : 'bg-blue-600';

        const row = document.createElement('div');
        row.className = 'p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5';
        row.innerHTML = `
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold text-slate-800 dark:text-slate-200">${limit.name}</span>
            <span class="${isOver ? 'text-red-500 font-bold' : 'text-slate-500'} font-mono">${limit.current} / ${limit.limit} (${isOver ? `+${Math.abs(limit.remaining)} over` : `${limit.remaining} left`})</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div class="${barColor} h-2 rounded-full transition-all duration-200" style="width: ${Math.min(100, limit.percent)}%"></div>
          </div>
        `;
        limitsContainer.appendChild(row);
      }
    }
  }

  if (textInput) textInput.addEventListener('input', update);
  if (clearBtn && textInput) {
    clearBtn.addEventListener('click', () => {
      textInput.value = '';
      update();
    });
  }

  update();
}

document.addEventListener('DOMContentLoaded', initLetterCounter);
