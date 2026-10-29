/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { showToast } from '../shared/site-shell';

interface StagedFile {
  file: File;
  archivePath: string;
}

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const filesListContainer = document.getElementById('files-list-container');
  const filesTableBody = document.getElementById('files-table-body');
  const compressionSelect = document.getElementById('compression-level') as HTMLSelectElement | null;
  const zipNameInput = document.getElementById('zip-name-input') as HTMLInputElement | null;
  const btnCreateZip = document.getElementById('btn-create-zip');
  const btnClearAll = document.getElementById('btn-clear-all');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  const totalStatsBadge = document.getElementById('total-stats-badge');

  let stagedFiles: StagedFile[] = [];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  const addFiles = (fileList: FileList | File[]) => {
    Array.from(fileList).forEach((file) => {
      // Use webkitRelativePath if available from folder drop
      const path = (file as unknown as { webkitRelativePath?: string }).webkitRelativePath || file.name;
      stagedFiles.push({ file, archivePath: path });
    });
    renderFiles();
    showToast(`Added ${fileList.length} files`, 'success');
  };

  const renderFiles = () => {
    if (!filesTableBody) return;
    filesTableBody.innerHTML = '';

    if (stagedFiles.length === 0) {
      if (filesListContainer) filesListContainer.classList.add('hidden');
      return;
    }

    if (filesListContainer) filesListContainer.classList.remove('hidden');

    let totalBytes = 0;
    stagedFiles.forEach((item, idx) => {
      totalBytes += item.file.size;
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors';

      tr.innerHTML = `
        <td class="py-3 px-4 font-mono text-xs text-slate-500">${idx + 1}</td>
        <td class="py-3 px-4">
          <input type="text" data-idx="${idx}" class="item-path-input w-full text-xs font-mono px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value="${item.archivePath}" />
        </td>
        <td class="py-3 px-4 text-xs font-mono text-slate-600 dark:text-slate-400">${formatBytes(item.file.size)}</td>
        <td class="py-3 px-4 text-right">
          <button type="button" data-idx="${idx}" class="btn-remove-item text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer">&times; Remove</button>
        </td>
      `;
      filesTableBody.appendChild(tr);
    });

    if (totalStatsBadge) {
      totalStatsBadge.textContent = `${stagedFiles.length} files &bull; Total uncompressed: ${formatBytes(totalBytes)}`;
    }

    // Attach listeners
    filesTableBody.querySelectorAll('.item-path-input').forEach((input) => {
      input.addEventListener('change', (e) => {
        const idx = parseInt((e.target as HTMLElement).getAttribute('data-idx') || '0', 10);
        if (stagedFiles[idx]) {
          stagedFiles[idx].archivePath = (e.target as HTMLInputElement).value.trim();
        }
      });
    });

    filesTableBody.querySelectorAll('.btn-remove-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
        stagedFiles.splice(idx, 1);
        renderFiles();
      });
    });
  };

  btnCreateZip?.addEventListener('click', async () => {
    if (stagedFiles.length === 0) {
      showToast('Please add at least one file to zip', 'warning');
      return;
    }

    const zip = new JSZip();
    stagedFiles.forEach((item) => {
      zip.file(item.archivePath, item.file);
    });

    const level = parseInt(compressionSelect?.value || '6', 10);
    const compression = level === 0 ? 'STORE' : 'DEFLATE';

    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';

    try {
      showToast('Compressing files...', 'info');
      const blob = await zip.generateAsync(
        {
          type: 'blob',
          compression,
          compressionOptions: { level },
        },
        (metadata) => {
          const pct = Math.floor(metadata.percent);
          if (progressBar) progressBar.style.width = `${pct}%`;
          if (progressPercent) progressPercent.textContent = `${pct}%`;
        }
      );

      const zipName = (zipNameInput?.value.trim() || 'archive.zip').replace(/\.zip$/i, '') + '.zip';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = zipName;
      a.click();

      showToast(`ZIP created: ${zipName} (${formatBytes(blob.size)})`, 'success');
      setTimeout(() => {
        if (progressContainer) progressContainer.classList.add('hidden');
      }, 1500);
    } catch (err: unknown) {
      showToast('Failed to create ZIP: ' + String(err), 'error');
      if (progressContainer) progressContainer.classList.add('hidden');
    }
  });

  btnClearAll?.addEventListener('click', () => {
    stagedFiles = [];
    renderFiles();
    showToast('Staged files cleared', 'info');
  });

  fileInput?.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) addFiles(files);
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
      addFiles(e.dataTransfer.files);
    }
  });
});
