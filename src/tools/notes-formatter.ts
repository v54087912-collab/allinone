/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initNotesFormatter(): void {
  const inputNotes = document.getElementById('input-notes') as HTMLTextAreaElement | null;
  const layoutSelect = document.getElementById('format-layout') as HTMLSelectElement | null;
  const formatBtn = document.getElementById('format-btn') as HTMLButtonElement | null;
  const formattedPreview = document.getElementById('formatted-output') as HTMLDivElement | null;
  const copyBtn = document.getElementById('copy-notes-btn') as HTMLButtonElement | null;

  if (formatBtn && inputNotes) {
    formatBtn.addEventListener('click', () => {
      const raw = inputNotes.value.trim();
      if (!raw) return;

      const layout = layoutSelect?.value || 'cornell';
      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

      if (layout === 'cornell') {
        // Cornell Notes: Left column Cue/Keywords, Right Column Notes, Bottom Summary
        const cues: string[] = [];
        const mainNotes: string[] = [];
        lines.forEach((l, i) => {
          if (i % 2 === 0) cues.push(l.split(' ')[0] || `Key Concept ${i + 1}`);
          mainNotes.push(l);
        });

        const html = `
          <div class="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <div class="p-3 bg-slate-100 dark:bg-slate-800 text-xs font-bold border-b border-slate-300 dark:border-slate-700">Cornell Notes Layout</div>
            <div class="grid grid-cols-3 min-h-[250px]">
              <div class="col-span-1 border-r border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cues / Recall Questions</div>
                ${cues.map(c => `<div class="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">${c}</div>`).join('')}
              </div>
              <div class="col-span-2 p-4 space-y-2">
                <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lecture / Reading Notes</div>
                ${mainNotes.map(m => `<div class="text-xs text-slate-700 dark:text-slate-300">• ${m}</div>`).join('')}
              </div>
            </div>
            <div class="border-t border-slate-300 dark:border-slate-700 p-4 bg-blue-50/40 dark:bg-blue-950/20">
              <div class="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Key Takeaway Summary</div>
              <div class="text-xs text-slate-600 dark:text-slate-400">${lines[0] || 'Essential study takeaways'}</div>
            </div>
          </div>
        `;
        if (formattedPreview) formattedPreview.innerHTML = html;
      } else {
        // Structured bullet points & headers
        const html = `
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 class="font-bold text-sm text-blue-600">Formatted Study Notes</h3>
            <ul class="space-y-1.5 list-disc pl-5 text-xs text-slate-700 dark:text-slate-300">
              ${lines.map(l => `<li>${l}</li>`).join('')}
            </ul>
          </div>
        `;
        if (formattedPreview) formattedPreview.innerHTML = html;
      }

      if (copyBtn) copyBtn.disabled = false;
    });
  }

  if (copyBtn && formattedPreview) {
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(formattedPreview.innerText);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy Formatted Notes'; }, 1500);
    });
  }
}

document.addEventListener('DOMContentLoaded', initNotesFormatter);
