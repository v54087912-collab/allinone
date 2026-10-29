/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { splitTextFile, SplitResultPart } from '../utils/fileUtils';
import { showToast } from '../shared/site-shell';

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const textInput = document.getElementById('text-input') as HTMLTextAreaElement | null;
  const splitModeSelect = document.getElementById('split-mode') as HTMLSelectElement | null;
  const lineCountInput = document.getElementById('line-count-input') as HTMLInputElement | null;
  const partCountInput = document.getElementById('part-count-input') as HTMLInputElement | null;
  const sizeInput = document.getElementById('size-input') as HTMLInputElement | null;
  const delimInput = document.getElementById('delim-input') as HTMLInputElement | null;
  const preserveCsvHeader = document.getElementById('preserve-csv-header') as HTMLInputElement | null;

  const modeLinesContainer = document.getElementById('mode-lines-container');
  const modePartsContainer = document.getElementById('mode-parts-container');
  const modeSizeContainer = document.getElementById('mode-size-container');
  const modeDelimContainer = document.getElementById('mode-delim-container');

  const btnSplit = document.getElementById('btn-split');
  const btnClear = document.getElementById('btn-clear');
  const btnDownloadZip = document.getElementById('btn-download-zip');
  const resultsContainer = document.getElementById('results-container');
  const statsBadge = document.getElementById('stats-badge');
  const partsList = document.getElementById('parts-list');

  let baseFileName = 'split_file.txt';
  let splitParts: SplitResultPart[] = [];

  const updateModeVisibility = () => {
    const mode = splitModeSelect?.value || 'lines';
    modeLinesContainer?.classList.toggle('hidden', mode !== 'lines');
    modePartsContainer?.classList.toggle('hidden', mode !== 'parts');
    modeSizeContainer?.classList.toggle('hidden', mode !== 'size');
    modeDelimContainer?.classList.toggle('hidden', mode !== 'delimiter');
  };

  splitModeSelect?.addEventListener('change', updateModeVisibility);
  updateModeVisibility();

  const doSplit = () => {
    const text = textInput?.value || '';
    if (!text.trim()) {
      showToast('Please enter or upload text to split', 'warning');
      return;
    }

    const mode = (splitModeSelect?.value || 'lines') as 'lines' | 'parts' | 'size' | 'delimiter';
    const lineCount = parseInt(lineCountInput?.value || '500', 10);
    const partCount = parseInt(partCountInput?.value || '4', 10);
    const sizeKb = parseFloat(sizeInput?.value || '100');
    const sizeBytes = Math.round(sizeKb * 1024);
    const delimiter = delimInput?.value || '---';
    const csvHeader = preserveCsvHeader?.checked ?? false;

    splitParts = splitTextFile(text, baseFileName, {
      mode,
      lineCount,
      partCount,
      sizeBytes,
      delimiter,
      preserveCsvHeader: csvHeader,
    });

    renderParts();
    if (resultsContainer) resultsContainer.classList.remove('hidden');
    showToast(`Split into ${splitParts.length} parts`, 'success');
  };

  const renderParts = () => {
    if (!partsList) return;
    partsList.innerHTML = '';

    if (splitParts.length === 0) {
      partsList.innerHTML = `<div class="p-6 text-center text-slate-400">No parts generated.</div>`;
      return;
    }

    splitParts.forEach((part, idx) => {
      const div = document.createElement('div');
      div.className = 'p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3';

      div.innerHTML = `
        <div class="truncate">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">Part ${part.partIndex}</span>
            <span class="font-mono text-xs font-semibold text-slate-900 dark:text-white truncate">${part.fileName}</span>
          </div>
          <p class="text-[11px] text-slate-500 font-mono mt-1">${part.lineCount.toLocaleString()} lines &bull; ${(part.byteSize / 1024).toFixed(1)} KB</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" data-idx="${idx}" class="btn-copy-part px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">Copy</button>
          <button type="button" data-idx="${idx}" class="btn-download-part px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white cursor-pointer">Download</button>
        </div>
      `;

      partsList.appendChild(div);
    });

    partsList.querySelectorAll('.btn-copy-part').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
        if (splitParts[idx]) {
          navigator.clipboard.writeText(splitParts[idx].content);
          showToast(`Copied ${splitParts[idx].fileName}`, 'success');
        }
      });
    });

    partsList.querySelectorAll('.btn-download-part').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
        if (splitParts[idx]) {
          const blob = new Blob([splitParts[idx].content], { type: 'text/plain;charset=utf-8' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = splitParts[idx].fileName;
          a.click();
          showToast(`Downloaded ${splitParts[idx].fileName}`, 'success');
        }
      });
    });

    if (statsBadge) {
      statsBadge.textContent = `Generated ${splitParts.length} files from input`;
    }
  };

  btnSplit?.addEventListener('click', doSplit);

  btnDownloadZip?.addEventListener('click', async () => {
    if (splitParts.length === 0) {
      showToast('No split parts to package', 'warning');
      return;
    }

    try {
      showToast('Packaging parts into ZIP...', 'info');
      const zip = new JSZip();

      splitParts.forEach((part) => {
        zip.file(part.fileName, part.content);
      });

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${baseFileName.replace(/\.[^/.]+$/, '')}_parts.zip`;
      a.click();

      showToast(`Downloaded ${a.download}`, 'success');
    } catch (err: unknown) {
      showToast('Failed to create ZIP: ' + String(err), 'error');
    }
  });

  btnClear?.addEventListener('click', () => {
    if (textInput) textInput.value = '';
    splitParts = [];
    if (resultsContainer) resultsContainer.classList.add('hidden');
    showToast('Cleared text and parts', 'info');
  });

  fileInput?.addEventListener('change', async (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) {
      baseFileName = files[0].name;
      const text = await files[0].text();
      if (textInput) textInput.value = text;
      doSplit();
    }
  });

  dropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-blue-500');
  });

  dropZone?.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-blue-500');
  });

  dropZone?.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-blue-500');
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      baseFileName = e.dataTransfer.files[0].name;
      const text = await e.dataTransfer.files[0].text();
      if (textInput) textInput.value = text;
      doSplit();
    }
  });
});
