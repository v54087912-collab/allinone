import { jsonToCsv } from '../utils/devUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_DATA = `[
  { "id": 1, "name": "Alice Johnson", "role": "Frontend Lead", "city": "San Francisco", "active": true },
  { "id": 2, "name": "Bob Smith", "role": "Backend Architect", "city": "New York", "active": true },
  { "id": 3, "name": "Charlie Davis", "role": "UI/UX Designer", "city": "London", "active": false },
  { "id": 4, "name": "Diana Prince", "role": "DevOps Engineer", "city": "Berlin", "active": true }
]`;

export function initJsonToCsv(): void {
  const inputEl = document.getElementById('json-input') as HTMLTextAreaElement | null;
  const outputEl = document.getElementById('csv-output') as HTMLTextAreaElement | null;
  const delimiterSelect = document.getElementById('csv-delimiter') as HTMLSelectElement | null;

  const rowsCountEl = document.getElementById('stat-rows') as HTMLElement | null;
  const colsCountEl = document.getElementById('stat-cols') as HTMLElement | null;
  const tableContainer = document.getElementById('csv-table-preview') as HTMLElement | null;
  const errorMsgEl = document.getElementById('json-error-msg') as HTMLElement | null;

  const btnSample = document.getElementById('btn-sample') as HTMLButtonElement | null;
  const btnClear = document.getElementById('btn-clear') as HTMLButtonElement | null;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;
  const btnDownload = document.getElementById('btn-download') as HTMLButtonElement | null;

  if (!inputEl || !outputEl) return;

  function convert(): void {
    if (!inputEl || !outputEl) return;
    const text = inputEl.value;
    const delimiter = delimiterSelect?.value || ',';

    if (!text.trim()) {
      outputEl.value = '';
      if (rowsCountEl) rowsCountEl.textContent = '0';
      if (colsCountEl) colsCountEl.textContent = '0';
      if (tableContainer) tableContainer.innerHTML = '<div class="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">Table preview will appear here.</div>';
      if (errorMsgEl) errorMsgEl.classList.add('hidden');
      return;
    }

    const res = jsonToCsv(text, delimiter);

    if (res.error) {
      if (errorMsgEl) {
        errorMsgEl.textContent = res.error;
        errorMsgEl.classList.remove('hidden');
      }
      return;
    }

    if (errorMsgEl) {
      errorMsgEl.classList.add('hidden');
      errorMsgEl.textContent = '';
    }

    outputEl.value = res.csv;
    if (rowsCountEl) rowsCountEl.textContent = `${res.rowCount}`;
    if (colsCountEl) colsCountEl.textContent = `${res.headers.length}`;

    // Render interactive HTML table preview
    if (tableContainer) {
      const rows = res.csv.split('\n').slice(0, 15); // preview first 15 rows
      const ths = res.headers.map((h) => `<th class="p-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">${escapeHtml(h)}</th>`).join('');

      const trs = rows.slice(1).map((row) => {
        const cells = row.split(delimiter).map((c) => `<td class="p-2.5 text-xs text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">${escapeHtml(c.replace(/^"(.*)"$/, '$1'))}</td>`).join('');
        return `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">${cells}</tr>`;
      }).join('');

      tableContainer.innerHTML = `
        <div class="overflow-x-auto max-h-[300px]">
          <table class="w-full border-collapse">
            <thead><tr>${ths}</tr></thead>
            <tbody>${trs}</tbody>
          </table>
        </div>
      `;
    }
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  inputEl.addEventListener('input', convert);
  delimiterSelect?.addEventListener('change', convert);

  btnSample?.addEventListener('click', () => {
    inputEl.value = SAMPLE_DATA;
    convert();
    showToast('Loaded sample JSON!', 'info');
  });

  btnClear?.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    convert();
  });

  btnCopy?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(outputEl.value).then(
      () => showToast('CSV copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  btnDownload?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to download', 'warning');
      return;
    }
    const blob = new Blob([outputEl.value], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV file downloaded!', 'success');
  });

  // Initial load
  if (!inputEl.value) {
    inputEl.value = SAMPLE_DATA;
  }
  convert();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initJsonToCsv);
} else {
  initJsonToCsv();
}
