import { checkGrammarAndStyle, type GrammarIssue } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_TEXT = `hello world ! i will definately recieve your email tommorrow .
The the quick brown fox jumped ,, over the lazy dog.
it was a very intresting begining , wich made everyone happy.`;

export function initGrammarChecker(): void {
  const textarea = document.getElementById('grammar-input') as HTMLTextAreaElement | null;
  const issuesList = document.getElementById('grammar-issues-list') as HTMLElement | null;

  const issueCountEl = document.getElementById('stat-issue-count') as HTMLElement | null;
  const wordCountEl = document.getElementById('stat-word-count') as HTMLElement | null;
  const healthBadgeEl = document.getElementById('stat-health-badge') as HTMLElement | null;

  const fixAllBtn = document.getElementById('btn-fix-all') as HTMLButtonElement | null;
  const copyCleanBtn = document.getElementById('btn-copy-clean') as HTMLButtonElement | null;
  const sampleBtn = document.getElementById('btn-sample') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('btn-clear') as HTMLButtonElement | null;

  if (!textarea || !issuesList) return;

  let currentIssues: GrammarIssue[] = [];

  function update(): void {
    if (!textarea || !issuesList) return;
    const text = textarea.value;
    currentIssues = checkGrammarAndStyle(text);

    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (wordCountEl) wordCountEl.textContent = `${words}`;
    if (issueCountEl) issueCountEl.textContent = `${currentIssues.length}`;

    if (healthBadgeEl) {
      if (currentIssues.length === 0) {
        healthBadgeEl.textContent = text.trim() ? 'Clean & Error-Free' : 'Ready';
        healthBadgeEl.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
      } else {
        healthBadgeEl.textContent = `${currentIssues.length} Suggestions`;
        healthBadgeEl.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
      }
    }

    if (currentIssues.length === 0) {
      if (!text.trim()) {
        issuesList.innerHTML = `
          <div class="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
            Type or paste text above to inspect spelling, grammar, and spacing errors in real-time.
          </div>`;
      } else {
        issuesList.innerHTML = `
          <div class="py-10 text-center">
            <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-xl mb-3">✓</div>
            <p class="font-bold text-slate-900 dark:text-white text-base mb-1">Looking Good!</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">No common spelling, repeated-word, capitalization, or punctuation issues found.</p>
          </div>`;
      }
      return;
    }

    issuesList.innerHTML = currentIssues
      .map((issue, idx) => {
        const typeBadge = getTypeBadge(issue.type);
        return `
          <div class="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-400 dark:hover:border-blue-600 transition-all">
            <div class="flex items-start gap-3">
              <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                ${idx + 1}
              </span>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  ${typeBadge}
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-300">${escapeHtml(issue.message)}</span>
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span class="line-through text-red-500 dark:text-red-400">${escapeHtml(issue.original)}</span>
                  <span class="mx-1.5 text-slate-400">→</span>
                  <span class="font-semibold text-emerald-600 dark:text-emerald-400">${escapeHtml(issue.replacement)}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              data-fix-index="${idx}"
              class="self-end sm:self-center px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:text-blue-300 text-xs font-semibold transition-all cursor-pointer border border-blue-200 dark:border-blue-800"
            >
              Apply Fix
            </button>
          </div>`;
      })
      .join('');

    issuesList.querySelectorAll<HTMLButtonElement>('[data-fix-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-fix-index') || '-1', 10);
        if (idx >= 0 && idx < currentIssues.length) {
          applySingleFix(currentIssues[idx]);
        }
      });
    });
  }

  function getTypeBadge(type: GrammarIssue['type']): string {
    switch (type) {
      case 'spelling':
        return `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300">Spelling</span>`;
      case 'repeated-word':
        return `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">Duplicate</span>`;
      case 'punctuation':
        return `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300">Punctuation</span>`;
      case 'spacing':
        return `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">Spacing</span>`;
      case 'capitalization':
        return `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300">Capitalization</span>`;
    }
  }

  function applySingleFix(issue: GrammarIssue): void {
    if (!textarea) return;
    const text = textarea.value;
    const before = text.substring(0, issue.index);
    const after = text.substring(issue.index + issue.original.length);
    textarea.value = before + issue.replacement + after;
    update();
    showToast(`Applied fix for "${issue.original}"`, 'success');
  }

  function applyAllFixes(): void {
    if (!textarea || currentIssues.length === 0) {
      showToast('No issues to fix', 'info');
      return;
    }

    let text = textarea.value;
    // Apply fixes from end to beginning to preserve earlier string indices
    const sortedDescending = [...currentIssues].sort((a, b) => b.index - a.index);

    for (const issue of sortedDescending) {
      const before = text.substring(0, issue.index);
      const after = text.substring(issue.index + issue.original.length);
      text = before + issue.replacement + after;
    }

    textarea.value = text;
    update();
    showToast('All grammar and spelling suggestions applied!', 'success');
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  textarea.addEventListener('input', update);
  fixAllBtn?.addEventListener('click', applyAllFixes);

  copyCleanBtn?.addEventListener('click', () => {
    if (!textarea.value) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(textarea.value).then(
      () => showToast('Clean text copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  sampleBtn?.addEventListener('click', () => {
    textarea.value = SAMPLE_TEXT;
    update();
    showToast('Loaded sample text with common errors!', 'info');
  });

  clearBtn?.addEventListener('click', () => {
    textarea.value = '';
    update();
  });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGrammarChecker);
} else {
  initGrammarChecker();
}
