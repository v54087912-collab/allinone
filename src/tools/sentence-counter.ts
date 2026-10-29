import { analyzeSentences, analyzeText } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_TEXT = `In the heart of the digital revolution, web technologies have evolved at an unprecedented velocity. Modern web browsers are no longer just simple document viewers; they have transformed into extraordinarily powerful runtime environments capable of compiling near-native assembly code, rendering complex 3D graphics in real-time, and executing machine learning models entirely on the user's client hardware.

Privacy is paramount. When tools operate entirely within the browser, users retain 100% ownership over their sensitive data. No files or keystrokes ever leave your device. Is this the future of computing? Absolutely! We believe privacy-first utilities empower everyone with effortless productivity.`;

export function initSentenceCounter(): void {
  const textarea = document.getElementById('sc-input') as HTMLTextAreaElement | null;
  const sampleBtn = document.getElementById('sc-sample-btn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('sc-clear-btn') as HTMLButtonElement | null;
  const copyBtn = document.getElementById('sc-copy-btn') as HTMLButtonElement | null;
  const filterLongCheck = document.getElementById('sc-filter-long') as HTMLInputElement | null;

  const totalEl = document.getElementById('sc-total') as HTMLElement | null;
  const avgEl = document.getElementById('sc-avg') as HTMLElement | null;
  const shortEl = document.getElementById('sc-short') as HTMLElement | null;
  const longEl = document.getElementById('sc-long') as HTMLElement | null;
  const longCountEl = document.getElementById('sc-long-count') as HTMLElement | null;
  const wordsEl = document.getElementById('sc-words') as HTMLElement | null;
  const charsEl = document.getElementById('sc-chars') as HTMLElement | null;
  const listEl = document.getElementById('sc-list') as HTMLElement | null;

  if (!textarea) return;

  function update() {
    const text = textarea?.value || '';
    const stats = analyzeSentences(text);
    const textStats = analyzeText(text);

    if (totalEl) totalEl.textContent = `${stats.totalSentences}`;
    if (avgEl) avgEl.textContent = `${stats.avgWordsPerSentence}`;
    if (shortEl) shortEl.textContent = `${stats.shortestSentenceWords}`;
    if (longEl) longEl.textContent = `${stats.longestSentenceWords}`;
    if (longCountEl) longCountEl.textContent = `${stats.longSentencesCount}`;
    if (wordsEl) wordsEl.textContent = `${textStats.words}`;
    if (charsEl) charsEl.textContent = `${textStats.characters}`;

    if (!listEl) return;

    if (stats.sentences.length === 0) {
      listEl.innerHTML = `
        <div class="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
          Type or paste text above to see sentence-by-sentence analysis.
        </div>`;
      return;
    }

    const showOnlyLong = filterLongCheck?.checked || false;
    const filtered = showOnlyLong ? stats.sentences.filter((s) => s.isLong) : stats.sentences;

    if (filtered.length === 0 && showOnlyLong) {
      listEl.innerHTML = `
        <div class="py-8 text-center text-emerald-600 dark:text-emerald-400 font-medium text-sm">
          🎉 Great job! No overly long sentences (&gt;25 words) detected.
        </div>`;
      return;
    }

    listEl.innerHTML = filtered
      .map((item, idx) => {
        const num = stats.sentences.indexOf(item) + 1;
        const longBadge = item.isLong
          ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
               ⚠️ Long (${item.words}w &gt; 25)
             </span>`
          : '';

        return `
          <div class="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 group">
            <div class="flex items-start gap-3 flex-1 min-w-0">
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center">
                ${num}
              </span>
              <p class="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed break-words font-medium">
                ${escapeHtml(item.text)}
              </p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
              ${longBadge}
              <span class="text-xs text-slate-400 dark:text-slate-500 font-mono">
                ${item.words}w • ${item.characters}c
              </span>
              <button
                type="button"
                data-copy-sentence="${encodeURIComponent(item.text)}"
                title="Copy Sentence"
                class="opacity-70 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </button>
            </div>
          </div>`;
      })
      .join('');

    // Attach copy button handlers
    listEl.querySelectorAll<HTMLButtonElement>('[data-copy-sentence]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const textToCopy = decodeURIComponent(btn.getAttribute('data-copy-sentence') || '');
        if (textToCopy) {
          navigator.clipboard.writeText(textToCopy).then(
            () => showToast('Sentence copied!', 'success'),
            () => showToast('Failed to copy', 'error')
          );
        }
      });
    });
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  textarea.addEventListener('input', update);
  filterLongCheck?.addEventListener('change', update);

  sampleBtn?.addEventListener('click', () => {
    textarea.value = SAMPLE_TEXT;
    update();
    showToast('Sample text loaded!', 'info');
  });

  clearBtn?.addEventListener('click', () => {
    textarea.value = '';
    update();
  });

  copyBtn?.addEventListener('click', () => {
    if (!textarea.value) return;
    navigator.clipboard.writeText(textarea.value).then(
      () => showToast('Full text copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSentenceCounter);
} else {
  initSentenceCounter();
}
