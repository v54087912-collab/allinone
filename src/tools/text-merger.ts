/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { mergeTextFiles, TextMergeOptions } from '../utils/fileUtils';
import { showToast } from '../shared/site-shell';

interface MergingFile {
  name: string;
  content: string;
}

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const filesList = document.getElementById('files-list');
  const separatorSelect = document.getElementById('separator-select') as HTMLSelectElement | null;
  const customSepInput = document.getElementById('custom-sep-input') as HTMLInputElement | null;
  const customSepContainer = document.getElementById('custom-sep-container');
  const headerStyleSelect = document.getElementById('header-style-select') as HTMLSelectElement | null;
  const mergedOutput = document.getElementById('merged-output') as HTMLTextAreaElement | null;
  const statsBadge = document.getElementById('stats-badge');
  const btnMerge = document.getElementById('btn-merge');
  const btnCopy = document.getElementById('btn-copy');
  const btnDownload = document.getElementById('btn-download');
  const btnClear = document.getElementById('btn-clear');
  const outputFileNameInput = document.getElementById('output-filename-input') as HTMLInputElement | null;

  let loadedFiles: MergingFile[] = [];

  const handleFiles = async (files: FileList | File[]) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await file.text();
      loadedFiles.push({ name: file.name, content });
    }
    renderFilesList();
    doMerge();
    showToast(`Loaded ${files.length} text file(s)`, 'success');
  };

  const renderFilesList = () => {
    if (!filesList) return;
    filesList.innerHTML = '';

    loadedFiles.forEach((file, idx) => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs';

      const lineCount = file.content.split(/\r?\n/).length;

      div.innerHTML = `
        <div class="flex items-center gap-2 truncate">
          <span class="font-mono text-slate-400 font-bold">${idx + 1}.</span>
          <span class="font-medium text-slate-900 dark:text-white truncate">${file.name}</span>
          <span class="text-slate-400 font-mono text-[11px]">(${lineCount} lines, ${(file.content.length / 1024).toFixed(1)} KB)</span>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" data-idx="${idx}" class="btn-move-up p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 ${idx === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}">▲</button>
          <button type="button" data-idx="${idx}" class="btn-move-down p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 ${idx === loadedFiles.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}">▼</button>
          <button type="button" data-idx="${idx}" class="btn-remove p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer ml-1 font-bold">&times;</button>
        </div>
      `;

      filesList.appendChild(div);
    });

    filesList.querySelectorAll('.btn-move-up').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
        if (idx > 0) {
          const temp = loadedFiles[idx];
          loadedFiles[idx] = loadedFiles[idx - 1];
          loadedFiles[idx - 1] = temp;
          renderFilesList();
          doMerge();
        }
      });
    });

    filesList.querySelectorAll('.btn-move-down').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
        if (idx < loadedFiles.length - 1) {
          const temp = loadedFiles[idx];
          loadedFiles[idx] = loadedFiles[idx + 1];
          loadedFiles[idx + 1] = temp;
          renderFilesList();
          doMerge();
        }
      });
    });

    filesList.querySelectorAll('.btn-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
        loadedFiles.splice(idx, 1);
        renderFilesList();
        doMerge();
      });
    });
  };

  const doMerge = () => {
    if (loadedFiles.length === 0) {
      if (mergedOutput) mergedOutput.value = '';
      if (statsBadge) statsBadge.textContent = 'No files loaded';
      return;
    }

    const sepVal = separatorSelect?.value as TextMergeOptions['separator'];
    const customSep = customSepInput?.value ?? '\n';
    const headerStyle = headerStyleSelect?.value as TextMergeOptions['headerStyle'];

    const result = mergeTextFiles(loadedFiles, {
      separator: sepVal,
      customSeparator: customSep,
      headerStyle,
    });

    if (mergedOutput) mergedOutput.value = result;

    const totalLines = result.split(/\r?\n/).length;
    const totalBytes = new TextEncoder().encode(result).length;

    if (statsBadge) {
      statsBadge.textContent = `${loadedFiles.length} files combined &bull; ${totalLines.toLocaleString()} lines &bull; ${(totalBytes / 1024).toFixed(1)} KB total`;
    }
  };

  separatorSelect?.addEventListener('change', () => {
    if (separatorSelect.value === 'custom') {
      customSepContainer?.classList.remove('hidden');
    } else {
      customSepContainer?.classList.add('hidden');
    }
    doMerge();
  });

  customSepInput?.addEventListener('input', doMerge);
  headerStyleSelect?.addEventListener('change', doMerge);
  btnMerge?.addEventListener('click', doMerge);

  btnCopy?.addEventListener('click', () => {
    if (!mergedOutput || !mergedOutput.value) return;
    navigator.clipboard.writeText(mergedOutput.value);
    showToast('Copied merged text to clipboard', 'success');
  });

  btnDownload?.addEventListener('click', () => {
    if (!mergedOutput || !mergedOutput.value) {
      showToast('No merged text to download', 'warning');
      return;
    }
    const filename = outputFileNameInput?.value.trim() || 'merged_document.txt';
    const blob = new Blob([mergedOutput.value], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    showToast(`Downloaded ${filename}`, 'success');
  });

  btnClear?.addEventListener('click', () => {
    loadedFiles = [];
    renderFilesList();
    doMerge();
    showToast('Cleared merged files', 'info');
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
