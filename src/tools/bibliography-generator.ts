/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatCitation, CitationData } from '../utils/educationUtils.ts';

export function initBibliographyGenerator(): void {
  const styleSelect = document.getElementById('bib-style') as HTMLSelectElement | null;
  const authorInput = document.getElementById('bib-author') as HTMLInputElement | null;
  const titleInput = document.getElementById('bib-title') as HTMLInputElement | null;
  const yearInput = document.getElementById('bib-year') as HTMLInputElement | null;
  const pubInput = document.getElementById('bib-publisher') as HTMLInputElement | null;
  const addEntryBtn = document.getElementById('add-entry-btn') as HTMLButtonElement | null;
  const bibOutput = document.getElementById('bib-output') as HTMLDivElement | null;
  const copyBtn = document.getElementById('copy-bib-btn') as HTMLButtonElement | null;
  const countBadge = document.getElementById('entry-count') as HTMLSpanElement | null;

  interface BibEntry {
    author: string;
    title: string;
    year: string;
    publisher: string;
  }

  let entries: BibEntry[] = [
    { author: 'Turing, Alan M.', title: 'Computing Machinery and Intelligence', year: '1950', publisher: 'Mind' },
    { author: 'Shannon, Claude E.', title: 'A Mathematical Theory of Communication', year: '1948', publisher: 'Bell System Technical Journal' }
  ];

  function renderBibliography() {
    if (!bibOutput) return;

    // Sort alphabetically by author surname
    entries.sort((a, b) => a.author.localeCompare(b.author));

    const style = (styleSelect?.value || 'apa') as any;
    const formattedList = entries.map(e => {
      const data: CitationData = {
        authors: e.author,
        title: e.title,
        year: e.year,
        sourceOrPublisher: e.publisher
      };
      return `<div class="pl-8 -indent-8 mb-3 text-slate-800 dark:text-slate-200 text-xs sm:text-sm">${formatCitation('book', data, style)}</div>`;
    });

    bibOutput.innerHTML = formattedList.join('') || '<p class="text-slate-400 italic text-xs">No citations added yet.</p>';
    if (countBadge) countBadge.textContent = `${entries.length} References`;
    if (copyBtn) copyBtn.disabled = entries.length === 0;
  }

  if (addEntryBtn && authorInput && titleInput && yearInput && pubInput) {
    addEntryBtn.addEventListener('click', () => {
      const author = authorInput.value.trim();
      const title = titleInput.value.trim();
      if (!author || !title) return;

      entries.push({
        author,
        title,
        year: yearInput.value.trim() || 'n.d.',
        publisher: pubInput.value.trim()
      });

      authorInput.value = '';
      titleInput.value = '';
      yearInput.value = '';
      pubInput.value = '';
      renderBibliography();
    });
  }

  if (styleSelect) {
    styleSelect.addEventListener('change', renderBibliography);
  }

  if (copyBtn && bibOutput) {
    copyBtn.addEventListener('click', async () => {
      const text = bibOutput.innerText;
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy Bibliography'; }, 1500);
    });
  }

  renderBibliography();
}

document.addEventListener('DOMContentLoaded', initBibliographyGenerator);
