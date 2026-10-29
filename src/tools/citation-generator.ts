/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatCitation, CitationData } from '../utils/educationUtils.ts';

export function initCitationGenerator(): void {
  const sourceSelect = document.getElementById('source-type') as HTMLSelectElement | null;
  const styleSelect = document.getElementById('citation-style') as HTMLSelectElement | null;
  const authorInput = document.getElementById('cite-author') as HTMLInputElement | null;
  const titleInput = document.getElementById('cite-title') as HTMLInputElement | null;
  const yearInput = document.getElementById('cite-year') as HTMLInputElement | null;
  const pubInput = document.getElementById('cite-publisher') as HTMLInputElement | null;
  const urlInput = document.getElementById('cite-url') as HTMLInputElement | null;
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement | null;
  const outputText = document.getElementById('citation-output') as HTMLDivElement | null;
  const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement | null;

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const type = (sourceSelect?.value || 'book') as any;
      const style = (styleSelect?.value || 'apa') as any;
      const data: CitationData = {
        authors: authorInput?.value || '',
        title: titleInput?.value || '',
        year: yearInput?.value || '',
        sourceOrPublisher: pubInput?.value || '',
        urlOrDoi: urlInput?.value || ''
      };

      const result = formatCitation(type, data, style);
      if (outputText) {
        outputText.innerHTML = result;
      }
      if (copyBtn) copyBtn.disabled = false;
    });
  }

  if (copyBtn && outputText) {
    copyBtn.addEventListener('click', async () => {
      const text = outputText.textContent || '';
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy Citation'; }, 1500);
    });
  }
}

document.addEventListener('DOMContentLoaded', initCitationGenerator);
