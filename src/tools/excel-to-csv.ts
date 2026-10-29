/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseXlsx, formatCsv } from '../utils/fileUtils';
import { showToast } from '../shared/site-shell';

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const sheetSelect = document.getElementById('sheet-select') as HTMLSelectElement | null;
  const delimiterSelect = document.getElementById('delimiter-select') as HTMLSelectElement | null;
  const previewContainer = document.getElementById('preview-container');
  const previewStatsBadge = document.getElementById('preview-stats-badge');
  const previewTableBody = document.getElementById('preview-table-body');
  const previewTableHead = document.getElementById('preview-table-head');
  const csvOutput = document.getElementById('csv-output') as HTMLTextAreaElement | null;
  const btnDownloadCsv = document.getElementById('btn-download-csv');
  const btnCopyCsv = document.getElementById('btn-copy-csv');
  const btnClear = document.getElementById('btn-clear');

  let currentSheets: Record<string, string[][]> = {};
  let currentFileName = 'spreadsheet';

  const handleExcelFile = async (file: File) => {
    try {
      showToast('Parsing Excel spreadsheet...', 'info');
      currentFileName = file.name.replace(/\.[^/.]+$/, '');
      const buffer = await file.arrayBuffer();
      const { sheetNames, sheets } = await parseXlsx(buffer);

      currentSheets = sheets;

      if (!sheetSelect) return;
      sheetSelect.innerHTML = '';
      sheetNames.forEach((name) => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = `${name} (${sheets[name]?.length || 0} rows)`;
        sheetSelect.appendChild(opt);
      });

      renderCurrentSheet();
      showToast(`Loaded ${sheetNames.length} sheet(s) from Excel`, 'success');
    } catch (err: unknown) {
      showToast('Error reading Excel workbook: ' + String(err), 'error');
    }
  };

  const renderCurrentSheet = () => {
    const selectedSheetName = sheetSelect?.value || Object.keys(currentSheets)[0];
    if (!selectedSheetName || !currentSheets[selectedSheetName]) return;

    const rows = currentSheets[selectedSheetName];
    if (rows.length === 0) {
      showToast('Selected sheet is empty', 'warning');
      return;
    }

    const delim = delimiterSelect?.value || ',';
    const csvStr = formatCsv(rows, delim);
    if (csvOutput) csvOutput.value = csvStr;

    // Render Table Preview (up to first 50 rows)
    if (previewTableHead && previewTableBody) {
      previewTableHead.innerHTML = '';
      previewTableBody.innerHTML = '';

      // Header row
      const trHead = document.createElement('tr');
      trHead.className = 'border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80';
      const thIdx = document.createElement('th');
      thIdx.className = 'py-2.5 px-3 font-mono text-[11px] text-slate-400 w-12';
      thIdx.textContent = '#';
      trHead.appendChild(thIdx);

      const headerCells = rows[0] || [];
      headerCells.forEach((c) => {
        const th = document.createElement('th');
        th.className = 'py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200';
        th.textContent = c || '-';
        trHead.appendChild(th);
      });
      previewTableHead.appendChild(trHead);

      // Body preview
      const previewRows = rows.slice(1, 51);
      previewRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors';

        const tdIdx = document.createElement('td');
        tdIdx.className = 'py-2 px-3 font-mono text-xs text-slate-400';
        tdIdx.textContent = String(rIdx + 1);
        tr.appendChild(tdIdx);

        headerCells.forEach((_, cIdx) => {
          const td = document.createElement('td');
          td.className = 'py-2 px-4 text-xs text-slate-800 dark:text-slate-200 truncate max-w-xs';
          td.textContent = row[cIdx] || '';
          tr.appendChild(td);
        });
        previewTableBody.appendChild(tr);
      });
    }

    if (previewStatsBadge) {
      previewStatsBadge.textContent = `${rows.length} total rows &bull; ${rows[0]?.length || 0} columns &bull; Showing first ${Math.min(rows.length, 50)} rows in preview`;
    }

    if (previewContainer) previewContainer.classList.remove('hidden');
  };

  sheetSelect?.addEventListener('change', renderCurrentSheet);
  delimiterSelect?.addEventListener('change', renderCurrentSheet);

  btnDownloadCsv?.addEventListener('click', () => {
    if (!csvOutput || !csvOutput.value) {
      showToast('No CSV data to download', 'warning');
      return;
    }
    const blob = new Blob([csvOutput.value], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const sheetName = sheetSelect?.value ? `_${sheetSelect.value}` : '';
    a.download = `${currentFileName}${sheetName}.csv`;
    a.click();
    showToast(`Downloaded ${a.download}`, 'success');
  });

  btnCopyCsv?.addEventListener('click', () => {
    if (!csvOutput || !csvOutput.value) return;
    navigator.clipboard.writeText(csvOutput.value);
    showToast('Copied CSV to clipboard', 'success');
  });

  btnClear?.addEventListener('click', () => {
    currentSheets = {};
    if (csvOutput) csvOutput.value = '';
    if (sheetSelect) sheetSelect.innerHTML = '';
    if (previewContainer) previewContainer.classList.add('hidden');
    showToast('Cleared loaded spreadsheet', 'info');
  });

  fileInput?.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) handleExcelFile(files[0]);
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
      handleExcelFile(e.dataTransfer.files[0]);
    }
  });
});
