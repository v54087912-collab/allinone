/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { csvToJson, parseCsv } from '../utils/fileUtils';
import { showToast } from '../shared/site-shell';

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const csvInput = document.getElementById('csv-input') as HTMLTextAreaElement | null;
  const jsonOutput = document.getElementById('json-output') as HTMLTextAreaElement | null;
  const delimiterSelect = document.getElementById('delimiter-select') as HTMLSelectElement | null;
  const outputModeSelect = document.getElementById('output-mode-select') as HTMLSelectElement | null;
  const inferTypesCheckbox = document.getElementById('infer-types-checkbox') as HTMLInputElement | null;
  const indentSelect = document.getElementById('indent-select') as HTMLSelectElement | null;
  const btnConvert = document.getElementById('btn-convert');
  const btnCopy = document.getElementById('btn-copy');
  const btnDownload = document.getElementById('btn-download');
  const btnClear = document.getElementById('btn-clear');
  const btnSample = document.getElementById('btn-sample');
  const statsBadge = document.getElementById('stats-badge');

  const doConvert = () => {
    const text = csvInput?.value || '';
    if (!text.trim()) {
      showToast('Please enter or upload CSV data', 'warning');
      return;
    }

    try {
      const delimiter = delimiterSelect?.value === 'auto' ? undefined : delimiterSelect?.value;
      const outputMode = (outputModeSelect?.value || 'objects') as 'objects' | 'arrays' | 'columnar';
      const inferTypes = inferTypesCheckbox?.checked ?? true;
      const indent = parseInt(indentSelect?.value || '2', 10);

      const jsonStr = csvToJson(text, {
        delimiter,
        outputMode,
        inferTypes,
        indent,
      });

      if (jsonOutput) jsonOutput.value = jsonStr;

      const rows = parseCsv(text, delimiter);
      const rowCount = Math.max(0, rows.length - 1);
      const colCount = rows[0]?.length || 0;
      const csvBytes = new TextEncoder().encode(text).length;
      const jsonBytes = new TextEncoder().encode(jsonStr).length;

      if (statsBadge) {
        statsBadge.textContent = `${rowCount} records &bull; ${colCount} columns &bull; CSV: ${(csvBytes / 1024).toFixed(1)} KB &rarr; JSON: ${(jsonBytes / 1024).toFixed(1)} KB`;
        statsBadge.classList.remove('hidden');
      }

      showToast('Converted CSV to JSON', 'success');
    } catch (err: unknown) {
      showToast('Conversion error: ' + String(err), 'error');
    }
  };

  btnConvert?.addEventListener('click', doConvert);

  btnCopy?.addEventListener('click', () => {
    if (!jsonOutput || !jsonOutput.value) return;
    navigator.clipboard.writeText(jsonOutput.value);
    showToast('JSON copied to clipboard', 'success');
  });

  btnDownload?.addEventListener('click', () => {
    if (!jsonOutput || !jsonOutput.value) {
      showToast('No JSON to download', 'warning');
      return;
    }
    const blob = new Blob([jsonOutput.value], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'converted.json';
    a.click();
    showToast('Downloaded converted.json', 'success');
  });

  btnSample?.addEventListener('click', () => {
    if (csvInput) {
      csvInput.value = `id,first_name,last_name,email,is_active,balance,country
1,Alice,Smith,alice@example.com,true,1240.50,US
2,Bob,Johnson,bob@example.com,false,0.00,CA
3,Charlie,Lee,charlie@example.com,true,3890.15,UK
4,Diana,Garcia,diana@example.com,true,750.25,ES`;
      doConvert();
    }
  });

  btnClear?.addEventListener('click', () => {
    if (csvInput) csvInput.value = '';
    if (jsonOutput) jsonOutput.value = '';
    if (statsBadge) statsBadge.classList.add('hidden');
    showToast('Cleared input & output', 'info');
  });

  fileInput?.addEventListener('change', async (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) {
      const text = await files[0].text();
      if (csvInput) csvInput.value = text;
      doConvert();
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
      if (csvInput) csvInput.value = text;
      doConvert();
    }
  });
});
