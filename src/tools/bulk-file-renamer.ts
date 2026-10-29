/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { applyBulkRename, BulkRenameRules, RenamedItemResult } from '../utils/fileUtils';
import { showToast } from '../shared/site-shell';

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const tableBody = document.getElementById('renamer-table-body');
  const listContainer = document.getElementById('renamer-list-container');
  const summaryBadge = document.getElementById('summary-badge');

  // Rule inputs
  const prefixInput = document.getElementById('rule-prefix') as HTMLInputElement | null;
  const suffixInput = document.getElementById('rule-suffix') as HTMLInputElement | null;
  const findInput = document.getElementById('rule-find') as HTMLInputElement | null;
  const replaceInput = document.getElementById('rule-replace') as HTMLInputElement | null;
  const regexCheckbox = document.getElementById('rule-regex') as HTMLInputElement | null;
  const caseSelect = document.getElementById('rule-case') as HTMLSelectElement | null;
  const spacesSelect = document.getElementById('rule-spaces') as HTMLSelectElement | null;
  const seqEnabled = document.getElementById('rule-seq-enable') as HTMLInputElement | null;
  const seqStart = document.getElementById('rule-seq-start') as HTMLInputElement | null;
  const seqPad = document.getElementById('rule-seq-pad') as HTMLInputElement | null;
  const seqPos = document.getElementById('rule-seq-pos') as HTMLSelectElement | null;
  const extInput = document.getElementById('rule-ext') as HTMLInputElement | null;

  const btnApply = document.getElementById('btn-apply-rules');
  const btnDownloadZip = document.getElementById('btn-download-zip');
  const btnClearAll = document.getElementById('btn-clear-all');

  let uploadedFiles: File[] = [];
  let currentResults: RenamedItemResult[] = [];

  const handleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((f) => uploadedFiles.push(f));
    updateRules();
    showToast(`Added ${files.length} file(s)`, 'success');
  };

  const updateRules = () => {
    if (uploadedFiles.length === 0) {
      if (listContainer) listContainer.classList.add('hidden');
      return;
    }

    const rules: BulkRenameRules = {
      prefix: prefixInput?.value || '',
      suffix: suffixInput?.value || '',
      findText: findInput?.value || '',
      replaceText: replaceInput?.value || '',
      useRegex: regexCheckbox?.checked ?? false,
      ignoreCase: true,
      caseTransform: (caseSelect?.value || 'none') as BulkRenameRules['caseTransform'],
      replaceSpaces: (spacesSelect?.value || 'none') as BulkRenameRules['replaceSpaces'],
      sequence: {
        enabled: seqEnabled?.checked ?? false,
        start: parseInt(seqStart?.value || '1', 10),
        padding: parseInt(seqPad?.value || '3', 10),
        position: (seqPos?.value || 'prefix') as 'prefix' | 'suffix',
      },
      changeExtension: extInput?.value.trim() || undefined,
    };

    const filenames = uploadedFiles.map((f) => f.name);
    currentResults = applyBulkRename(filenames, rules);

    renderTable();
    if (listContainer) listContainer.classList.remove('hidden');
  };

  const renderTable = () => {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    let conflictCount = 0;
    currentResults.forEach((res, idx) => {
      if (res.conflict) conflictCount++;

      const tr = document.createElement('tr');
      tr.className = `border-b border-slate-100 dark:border-slate-800 ${res.conflict ? 'bg-rose-50 dark:bg-rose-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'} transition-colors`;

      tr.innerHTML = `
        <td class="py-2.5 px-3 font-mono text-xs text-slate-400">${idx + 1}</td>
        <td class="py-2.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-400 truncate max-w-xs">${res.originalName}</td>
        <td class="py-2.5 px-4 font-mono text-xs font-semibold ${res.conflict ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'} truncate max-w-xs">${res.newName}</td>
        <td class="py-2.5 px-4 text-center">
          ${res.conflict ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">Name Conflict</span>' : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">OK</span>'}
        </td>
        <td class="py-2.5 px-4 text-right">
          <button type="button" data-idx="${idx}" class="btn-remove-file text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer">&times;</button>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    tableBody.querySelectorAll('.btn-remove-file').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
        uploadedFiles.splice(idx, 1);
        updateRules();
      });
    });

    if (summaryBadge) {
      summaryBadge.textContent = `${uploadedFiles.length} file(s) ready to rename ${conflictCount > 0 ? `(${conflictCount} naming conflicts detected)` : ''}`;
    }
  };

  btnApply?.addEventListener('click', updateRules);

  // Auto update on any rule input change
  const inputs = [prefixInput, suffixInput, findInput, replaceInput, regexCheckbox, caseSelect, spacesSelect, seqEnabled, seqStart, seqPad, seqPos, extInput];
  inputs.forEach((inp) => {
    inp?.addEventListener('input', updateRules);
    inp?.addEventListener('change', updateRules);
  });

  btnDownloadZip?.addEventListener('click', async () => {
    if (uploadedFiles.length === 0) {
      showToast('No files to download', 'warning');
      return;
    }

    try {
      showToast('Packaging renamed files into ZIP...', 'info');
      const zip = new JSZip();

      uploadedFiles.forEach((file, idx) => {
        const renamed = currentResults[idx]?.newName || file.name;
        zip.file(renamed, file);
      });

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'renamed_files.zip';
      a.click();

      showToast(`Downloaded renamed_files.zip (${(blob.size / 1024).toFixed(1)} KB)`, 'success');
    } catch (err: unknown) {
      showToast('Failed to build ZIP: ' + String(err), 'error');
    }
  });

  btnClearAll?.addEventListener('click', () => {
    uploadedFiles = [];
    currentResults = [];
    if (listContainer) listContainer.classList.add('hidden');
    showToast('Cleared all files', 'info');
  });

  fileInput?.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) handleFiles(files);
  });

  dropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-blue-500');
  });

  dropZone?.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-blue-500');
  });

  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-blue-500');
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });
});
