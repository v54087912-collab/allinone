/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseCsv, createXlsx } from '../utils/fileUtils';
import { showToast } from '../shared/site-shell';

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const csvTextInput = document.getElementById('csv-text-input') as HTMLTextAreaElement | null;
  const sheetNameInput = document.getElementById('sheet-name-input') as HTMLInputElement | null;
  const delimiterSelect = document.getElementById('delimiter-select') as HTMLSelectElement | null;
  const btnGenerateXlsx = document.getElementById('btn-generate-xlsx');
  const btnSample = document.getElementById('btn-sample');
  const btnClear = document.getElementById('btn-clear');
  const resultContainer = document.getElementById('result-container');
  const statsBadge = document.getElementById('stats-badge');
  const btnDownloadXlsx = document.getElementById('btn-download-xlsx');

  let generatedBlob: Blob | null = null;
  let targetFileName = 'spreadsheet.xlsx';

  const generateExcel = async () => {
    const text = csvTextInput?.value || '';
    if (!text.trim()) {
      showToast('Please enter or upload CSV data', 'warning');
      return;
    }

    try {
      showToast('Building Excel spreadsheet...', 'info');
      const delim = delimiterSelect?.value === 'auto' ? undefined : delimiterSelect?.value;
      const rows = parseCsv(text, delim);

      if (rows.length === 0) {
        showToast('No valid CSV rows parsed', 'warning');
        return;
      }

      const sheetName = sheetNameInput?.value.trim() || 'Sheet1';
      generatedBlob = await createXlsx(rows, sheetName);
      targetFileName = `${sheetName}.xlsx`;

      const sizeKb = (generatedBlob.size / 1024).toFixed(1);
      if (statsBadge) {
        statsBadge.textContent = `${rows.length} rows &bull; ${rows[0]?.length || 0} columns &bull; Generated XLSX size: ${sizeKb} KB`;
      }
      if (resultContainer) resultContainer.classList.remove('hidden');

      showToast('Excel workbook created successfully!', 'success');
    } catch (err: unknown) {
      showToast('Failed to create Excel file: ' + String(err), 'error');
    }
  };

  btnGenerateXlsx?.addEventListener('click', generateExcel);

  btnDownloadXlsx?.addEventListener('click', () => {
    if (!generatedBlob) {
      showToast('No spreadsheet generated yet', 'warning');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(generatedBlob);
    a.download = targetFileName;
    a.click();
    showToast(`Downloaded ${targetFileName}`, 'success');
  });

  btnSample?.addEventListener('click', () => {
    if (csvTextInput) {
      csvTextInput.value = `Order ID,Customer Name,Item Description,Quantity,Unit Price,Total,Status
1001,Acme Corp,Enterprise Cloud License,5,249.00,1245.00,Paid
1002,Globex Inc,Security Hardening Audit,1,1800.00,1800.00,Pending
1003,Stark Tech,Quantum Sensor Array,12,85.50,1026.00,Shipped
1004,Wayne Labs,Thermal Composite Plate,3,450.00,1350.00,Delivered`;
      generateExcel();
    }
  });

  btnClear?.addEventListener('click', () => {
    if (csvTextInput) csvTextInput.value = '';
    generatedBlob = null;
    if (resultContainer) resultContainer.classList.add('hidden');
    showToast('Cleared data', 'info');
  });

  fileInput?.addEventListener('change', async (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) {
      const text = await files[0].text();
      if (csvTextInput) csvTextInput.value = text;
      targetFileName = files[0].name.replace(/\.[^/.]+$/, '') + '.xlsx';
      generateExcel();
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
      targetFileName = e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, '') + '.xlsx';
      generateExcel();
    }
  });
});
