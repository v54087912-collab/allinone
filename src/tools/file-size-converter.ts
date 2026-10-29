/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { convertFileSize } from '../utils/fileUtils';
import { showToast } from '../shared/site-shell';

document.addEventListener('DOMContentLoaded', () => {
  const inputSize = document.getElementById('input-size') as HTMLInputElement | null;
  const selectUnit = document.getElementById('select-unit') as HTMLSelectElement | null;
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const conversionTableBody = document.getElementById('conversion-table-body');
  const transferTableBody = document.getElementById('transfer-table-body');
  const droppedFileBadge = document.getElementById('dropped-file-badge');

  const NET_SPEEDS = [
    { name: 'Mobile 3G (HSPA+)', mbps: 7.2 },
    { name: 'Mobile 4G LTE', mbps: 50 },
    { name: 'Mobile 5G Ultra-Wideband', mbps: 450 },
    { name: 'Broadband Wi-Fi (100 Mbps)', mbps: 100 },
    { name: 'Gigabit Fiber (1 Gbps)', mbps: 1000 },
    { name: 'USB 2.0 Transfer (480 Mbps)', mbps: 480 },
    { name: 'USB 3.0 / SSD (5 Gbps)', mbps: 5000 },
  ];

  const updateCalculations = () => {
    if (!inputSize || !selectUnit) return;
    const val = parseFloat(inputSize.value) || 0;
    const unit = selectUnit.value;

    const { bytes, conversions } = convertFileSize(val, unit);

    // 1. Render conversion table
    if (conversionTableBody) {
      conversionTableBody.innerHTML = '';
      conversions.forEach((item) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors';

        tr.innerHTML = `
          <td class="py-2.5 px-4 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">${item.unit}</td>
          <td class="py-2.5 px-4 text-xs text-slate-700 dark:text-slate-300">${item.name}</td>
          <td class="py-2.5 px-4 text-xs font-mono font-semibold text-slate-900 dark:text-white text-right">${item.formatted}</td>
          <td class="py-2.5 px-4 text-xs text-slate-400 text-right hidden sm:table-cell">${item.system}</td>
          <td class="py-2.5 px-4 text-right">
            <button type="button" data-val="${item.formatted} ${item.unit}" class="btn-copy-val text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Copy</button>
          </td>
        `;
        conversionTableBody.appendChild(tr);
      });

      conversionTableBody.querySelectorAll('.btn-copy-val').forEach((btn) => {
        btn.addEventListener('click', () => {
          const v = btn.getAttribute('data-val') || '';
          navigator.clipboard.writeText(v);
          showToast(`Copied ${v}`, 'success');
        });
      });
    }

    // 2. Render transfer time table
    if (transferTableBody) {
      transferTableBody.innerHTML = '';
      NET_SPEEDS.forEach((net) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors';

        const bytesPerSec = (net.mbps * 1e6) / 8;
        const totalSecs = bytes / bytesPerSec;

        let timeStr = 'Instant';
        if (totalSecs > 0.05) {
          if (totalSecs < 60) timeStr = `${totalSecs.toFixed(2)} seconds`;
          else if (totalSecs < 3600) {
            const mins = Math.floor(totalSecs / 60);
            const secs = Math.round(totalSecs % 60);
            timeStr = `${mins}m ${secs}s`;
          } else {
            const hrs = (totalSecs / 3600).toFixed(1);
            timeStr = `${hrs} hours`;
          }
        }

        tr.innerHTML = `
          <td class="py-2.5 px-4 text-xs font-medium text-slate-900 dark:text-white">${net.name}</td>
          <td class="py-2.5 px-4 text-xs font-mono text-slate-500">${net.mbps} Mbps</td>
          <td class="py-2.5 px-4 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 text-right">${timeStr}</td>
        `;
        transferTableBody.appendChild(tr);
      });
    }
  };

  inputSize?.addEventListener('input', updateCalculations);
  selectUnit?.addEventListener('change', updateCalculations);

  const handleFileDrop = (file: File) => {
    if (inputSize && selectUnit) {
      inputSize.value = String(file.size);
      selectUnit.value = 'B';
      updateCalculations();
    }
    if (droppedFileBadge) {
      droppedFileBadge.textContent = `Selected file: ${file.name} (${file.size.toLocaleString()} bytes)`;
      droppedFileBadge.classList.remove('hidden');
    }
    showToast(`Loaded ${file.name}`, 'info');
  };

  fileInput?.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) handleFileDrop(files[0]);
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
      handleFileDrop(e.dataTransfer.files[0]);
    }
  });

  // Initial calculation
  updateCalculations();
});
