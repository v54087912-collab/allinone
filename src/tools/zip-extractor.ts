/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { showToast } from '../shared/site-shell';

interface ZipEntryInfo {
  name: string;
  dir: boolean;
  uncompressedSize: number;
  date: Date;
  fileObj: JSZip.JSZipObject;
}

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const filesListContainer = document.getElementById('files-list-container');
  const filesTableBody = document.getElementById('files-table-body');
  const zipStatsBadge = document.getElementById('zip-stats-badge');
  const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  const btnDownloadAll = document.getElementById('btn-download-all');
  const previewModal = document.getElementById('preview-modal');
  const previewModalTitle = document.getElementById('preview-modal-title');
  const previewModalContent = document.getElementById('preview-modal-content');
  const btnCloseModal = document.getElementById('btn-close-modal');

  let zipEntries: ZipEntryInfo[] = [];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  const handleZipFile = async (file: File) => {
    try {
      showToast('Reading zip archive...', 'info');
      const zip = await JSZip.loadAsync(file);
      zipEntries = [];

      let totalBytes = 0;
      let totalFiles = 0;

      zip.forEach((relativePath, fileObj) => {
        const info: ZipEntryInfo = {
          name: relativePath,
          dir: fileObj.dir,
          uncompressedSize: (fileObj as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0,
          date: fileObj.date || new Date(),
          fileObj,
        };
        totalBytes += info.uncompressedSize;
        if (!info.dir) totalFiles++;
        zipEntries.push(info);
      });

      if (zipStatsBadge) {
        zipStatsBadge.textContent = `${totalFiles} files in archive &bull; ${formatBytes(totalBytes)} uncompressed &bull; Archive: ${file.name}`;
      }

      renderTable();
      if (filesListContainer) filesListContainer.classList.remove('hidden');
      showToast(`Loaded ${totalFiles} files from ZIP`, 'success');
    } catch (err: unknown) {
      showToast('Failed to load ZIP archive: ' + String(err), 'error');
    }
  };

  const renderTable = () => {
    if (!filesTableBody) return;
    filesTableBody.innerHTML = '';

    const filter = searchInput?.value.toLowerCase().trim() || '';
    const filtered = zipEntries.filter((e) => !e.dir && e.name.toLowerCase().includes(filter));

    if (filtered.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" class="py-8 text-center text-slate-400">No files matched your filter</td>`;
      filesTableBody.appendChild(tr);
      return;
    }

    filtered.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors';

      const ext = entry.name.split('.').pop()?.toUpperCase() || 'FILE';
      const dateStr = entry.date.toLocaleDateString() + ' ' + entry.date.toLocaleTimeString();

      tr.innerHTML = `
        <td class="py-3 px-4 font-mono text-xs text-slate-500">${idx + 1}</td>
        <td class="py-3 px-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">${ext}</span>
          <span class="truncate max-w-xs sm:max-w-md">${entry.name}</span>
        </td>
        <td class="py-3 px-4 text-xs font-mono text-slate-600 dark:text-slate-400">${formatBytes(entry.uncompressedSize)}</td>
        <td class="py-3 px-4 text-xs text-slate-500 hidden sm:table-cell">${dateStr}</td>
        <td class="py-3 px-4 text-right space-x-2">
          <button type="button" data-idx="${idx}" class="btn-preview-file px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer">Preview</button>
          <button type="button" data-idx="${idx}" class="btn-extract-file px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">Extract</button>
        </td>
      `;

      filesTableBody.appendChild(tr);
    });

    // Attach listeners
    filesTableBody.querySelectorAll('.btn-preview-file').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
        const item = filtered[idx];
        if (item) openPreview(item);
      });
    });

    filesTableBody.querySelectorAll('.btn-extract-file').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
        const item = filtered[idx];
        if (item) downloadSingle(item);
      });
    });
  };

  const openPreview = async (item: ZipEntryInfo) => {
    if (!previewModal || !previewModalTitle || !previewModalContent) return;
    previewModalTitle.textContent = item.name;

    const lower = item.name.toLowerCase();
    const isImg = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('.gif') || lower.endsWith('.svg');

    if (isImg) {
      const blob = await item.fileObj.async('blob');
      const url = URL.createObjectURL(blob);
      previewModalContent.innerHTML = `<div class="flex justify-center p-4 bg-slate-900 rounded-xl"><img src="${url}" class="max-h-96 object-contain rounded" /></div>`;
    } else {
      try {
        const text = await item.fileObj.async('text');
        const safe = text.slice(0, 10000).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        previewModalContent.innerHTML = `<pre class="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-auto max-h-96 whitespace-pre">${safe}${text.length > 10000 ? '\n\n... [Content truncated to first 10,000 characters]' : ''}</pre>`;
      } catch {
        previewModalContent.innerHTML = `<div class="p-4 text-center text-slate-400">Binary file. Preview not available for this file type.</div>`;
      }
    }

    previewModal.classList.remove('hidden');
  };

  const downloadSingle = async (item: ZipEntryInfo) => {
    const blob = await item.fileObj.async('blob');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = item.name.split('/').pop() || 'extracted_file';
    a.click();
    showToast(`Downloaded ${a.download}`, 'success');
  };

  btnDownloadAll?.addEventListener('click', async () => {
    const nonDir = zipEntries.filter((e) => !e.dir);
    if (nonDir.length === 0) return;
    showToast(`Downloading all ${nonDir.length} files...`, 'info');
    for (const item of nonDir) {
      await downloadSingle(item);
      await new Promise((r) => setTimeout(r, 100)); // slight pause between downloads
    }
  });

  searchInput?.addEventListener('input', renderTable);

  btnCloseModal?.addEventListener('click', () => {
    if (previewModal) previewModal.classList.add('hidden');
  });

  fileInput?.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) handleZipFile(files[0]);
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
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      handleZipFile(e.dataTransfer.files[0]);
    }
  });
});
