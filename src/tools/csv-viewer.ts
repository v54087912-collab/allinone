/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseCsv, formatCsv, csvToJson } from '../utils/fileUtils';
import { showToast } from '../shared/site-shell';

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const csvTextInput = document.getElementById('csv-text-input') as HTMLTextAreaElement | null;
  const delimiterSelect = document.getElementById('delimiter-select') as HTMLSelectElement | null;
  const headerCheckbox = document.getElementById('header-checkbox') as HTMLInputElement | null;
  const btnParse = document.getElementById('btn-parse');
  const btnClear = document.getElementById('btn-clear');
  const tableContainer = document.getElementById('table-container');
  const tableHeader = document.getElementById('table-header');
  const tableBody = document.getElementById('table-body');
  const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  const statsBadge = document.getElementById('stats-badge');
  const pageSizeSelect = document.getElementById('page-size-select') as HTMLSelectElement | null;
  const pageInfo = document.getElementById('page-info');
  const btnPrevPage = document.getElementById('btn-prev-page');
  const btnNextPage = document.getElementById('btn-next-page');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnExportJson = document.getElementById('btn-export-json');

  let rawRows: string[][] = [];
  let headers: string[] = [];
  let dataRows: string[][] = [];
  let filteredRows: string[][] = [];
  let currentPage = 1;
  let sortColIndex = -1;
  let sortAscending = true;

  const parseAndRender = () => {
    const text = csvTextInput?.value || '';
    if (!text.trim()) {
      showToast('Please upload a file or paste CSV content', 'warning');
      return;
    }

    const delim = delimiterSelect?.value === 'auto' ? undefined : delimiterSelect?.value;
    rawRows = parseCsv(text, delim);

    if (rawRows.length === 0) {
      showToast('No rows detected in CSV', 'warning');
      return;
    }

    const hasHeader = headerCheckbox?.checked ?? true;
    if (hasHeader) {
      headers = rawRows[0].map((h, i) => h.trim() || `Column ${i + 1}`);
      dataRows = rawRows.slice(1);
    } else {
      headers = rawRows[0].map((_, i) => `Column ${i + 1}`);
      dataRows = rawRows;
    }

    sortColIndex = -1;
    currentPage = 1;
    applyFilterAndSort();
    if (tableContainer) tableContainer.classList.remove('hidden');
    showToast(`Loaded ${dataRows.length} rows & ${headers.length} columns`, 'success');
  };

  const applyFilterAndSort = () => {
    const q = searchInput?.value.toLowerCase().trim() || '';
    if (!q) {
      filteredRows = [...dataRows];
    } else {
      filteredRows = dataRows.filter((row) =>
        row.some((cell) => cell.toLowerCase().includes(q))
      );
    }

    if (sortColIndex >= 0) {
      filteredRows.sort((a, b) => {
        const valA = a[sortColIndex] ?? '';
        const valB = b[sortColIndex] ?? '';
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);

        let cmp = 0;
        if (!isNaN(numA) && !isNaN(numB)) {
          cmp = numA - numB;
        } else {
          cmp = valA.localeCompare(valB);
        }
        return sortAscending ? cmp : -cmp;
      });
    }

    renderTable();
  };

  const renderTable = () => {
    if (!tableHeader || !tableBody) return;

    // Render Headers
    tableHeader.innerHTML = '';
    const trHead = document.createElement('tr');
    trHead.className = 'border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80';

    const thIdx = document.createElement('th');
    thIdx.className = 'py-3 px-3 text-left font-mono text-[11px] font-bold text-slate-400 w-12';
    thIdx.textContent = '#';
    trHead.appendChild(thIdx);

    headers.forEach((h, colIdx) => {
      const th = document.createElement('th');
      th.className = 'py-3 px-4 text-left text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors';
      const sortIcon = sortColIndex === colIdx ? (sortAscending ? ' ▲' : ' ▼') : ' ⇅';
      th.textContent = h + sortIcon;

      th.addEventListener('click', () => {
        if (sortColIndex === colIdx) {
          sortAscending = !sortAscending;
        } else {
          sortColIndex = colIdx;
          sortAscending = true;
        }
        applyFilterAndSort();
      });

      trHead.appendChild(th);
    });
    tableHeader.appendChild(trHead);

    // Render Page Rows
    tableBody.innerHTML = '';
    const pageSize = parseInt(pageSizeSelect?.value || '25', 10);
    const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * pageSize;
    const pageRows = filteredRows.slice(startIdx, startIdx + pageSize);

    if (pageRows.length === 0) {
      const trEmpty = document.createElement('tr');
      trEmpty.innerHTML = `<td colspan="${headers.length + 1}" class="py-8 text-center text-slate-400">No matching records found</td>`;
      tableBody.appendChild(trEmpty);
    } else {
      pageRows.forEach((row, rowIdx) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors';

        const tdIdx = document.createElement('td');
        tdIdx.className = 'py-2.5 px-3 font-mono text-xs text-slate-400';
        tdIdx.textContent = String(startIdx + rowIdx + 1);
        tr.appendChild(tdIdx);

        headers.forEach((_, colIdx) => {
          const td = document.createElement('td');
          td.className = 'py-2.5 px-4 text-xs text-slate-800 dark:text-slate-200 truncate max-w-xs';
          td.textContent = row[colIdx] ?? '';
          tr.appendChild(td);
        });

        tableBody.appendChild(tr);
      });
    }

    // Update pagination & stats
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${filteredRows.length} rows)`;
    if (statsBadge) statsBadge.textContent = `${headers.length} columns &bull; ${dataRows.length} total rows ${filteredRows.length !== dataRows.length ? `(${filteredRows.length} filtered)` : ''}`;
  };

  btnParse?.addEventListener('click', parseAndRender);
  searchInput?.addEventListener('input', () => {
    currentPage = 1;
    applyFilterAndSort();
  });
  pageSizeSelect?.addEventListener('change', () => {
    currentPage = 1;
    renderTable();
  });
  headerCheckbox?.addEventListener('change', parseAndRender);
  delimiterSelect?.addEventListener('change', parseAndRender);

  btnPrevPage?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  btnNextPage?.addEventListener('click', () => {
    const pageSize = parseInt(pageSizeSelect?.value || '25', 10);
    const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  btnExportCsv?.addEventListener('click', () => {
    if (filteredRows.length === 0) return;
    const all = [headers, ...filteredRows];
    const csvStr = formatCsv(all, ',');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'exported_table.csv';
    a.click();
    showToast('Exported CSV file', 'success');
  });

  btnExportJson?.addEventListener('click', () => {
    if (filteredRows.length === 0) return;
    const all = [headers, ...filteredRows];
    const csvStr = formatCsv(all, ',');
    const jsonStr = csvToJson(csvStr, { outputMode: 'objects' });
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'exported_table.json';
    a.click();
    showToast('Exported JSON file', 'success');
  });

  btnClear?.addEventListener('click', () => {
    if (csvTextInput) csvTextInput.value = '';
    rawRows = [];
    headers = [];
    dataRows = [];
    filteredRows = [];
    if (tableContainer) tableContainer.classList.add('hidden');
    showToast('Cleared table data', 'info');
  });

  fileInput?.addEventListener('change', async (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) {
      const text = await files[0].text();
      if (csvTextInput) csvTextInput.value = text;
      parseAndRender();
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
      const text = await e.dataTransfer.files[0].text();
      if (csvTextInput) csvTextInput.value = text;
      parseAndRender();
    }
  });
});
