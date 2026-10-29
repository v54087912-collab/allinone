/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { computeAllChecksums, FileChecksums } from '../utils/fileUtils';
import { showToast } from '../shared/site-shell';

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const resultsContainer = document.getElementById('results-container');
  const fileMetaBadge = document.getElementById('file-meta-badge');
  const expectedHashInput = document.getElementById('expected-hash-input') as HTMLInputElement | null;
  const hashMatchResult = document.getElementById('hash-match-result');
  const btnCopyAll = document.getElementById('btn-copy-all');

  const md5Val = document.getElementById('val-md5');
  const sha1Val = document.getElementById('val-sha1');
  const sha256Val = document.getElementById('val-sha256');
  const sha512Val = document.getElementById('val-sha512');
  const crc32Val = document.getElementById('val-crc32');

  let currentChecksums: FileChecksums | null = null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const handleFile = async (file: File) => {
    try {
      showToast('Computing checksums...', 'info');
      if (fileMetaBadge) {
        fileMetaBadge.textContent = `${file.name} &bull; ${formatBytes(file.size)} (${file.size.toLocaleString()} bytes)`;
      }

      const buffer = await file.arrayBuffer();
      currentChecksums = await computeAllChecksums(buffer);

      if (md5Val) md5Val.textContent = currentChecksums.md5;
      if (sha1Val) sha1Val.textContent = currentChecksums.sha1;
      if (sha256Val) sha256Val.textContent = currentChecksums.sha256;
      if (sha512Val) sha512Val.textContent = currentChecksums.sha512;
      if (crc32Val) crc32Val.textContent = currentChecksums.crc32;

      checkMatch();

      if (resultsContainer) resultsContainer.classList.remove('hidden');
      showToast('Checksums computed successfully', 'success');
    } catch (err: unknown) {
      showToast('Checksum computation failed: ' + String(err), 'error');
    }
  };

  const checkMatch = () => {
    if (!hashMatchResult || !currentChecksums) return;
    const expected = expectedHashInput?.value.trim().toLowerCase() || '';

    if (!expected) {
      hashMatchResult.classList.add('hidden');
      return;
    }

    const hashes = [
      currentChecksums.md5.toLowerCase(),
      currentChecksums.sha1.toLowerCase(),
      currentChecksums.sha256.toLowerCase(),
      currentChecksums.sha512.toLowerCase(),
      currentChecksums.crc32.toLowerCase(),
    ];

    const matchFound = hashes.includes(expected);
    hashMatchResult.classList.remove('hidden');

    if (matchFound) {
      hashMatchResult.className = 'p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-2';
      hashMatchResult.innerHTML = `<span>✓ MATCH VERIFIED: Expected checksum matches one of the computed file hashes!</span>`;
    } else {
      hashMatchResult.className = 'p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold text-xs flex items-center gap-2';
      hashMatchResult.innerHTML = `<span>✗ CHECKSUM MISMATCH: Expected hash does not match MD5, SHA-1, SHA-256, SHA-512, or CRC32.</span>`;
    }
  };

  expectedHashInput?.addEventListener('input', checkMatch);

  // Copy individual hash buttons
  document.querySelectorAll('.btn-copy-hash').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target') || '';
      const text = document.getElementById(targetId)?.textContent || '';
      if (text) {
        navigator.clipboard.writeText(text);
        showToast('Copied hash to clipboard', 'success');
      }
    });
  });

  btnCopyAll?.addEventListener('click', () => {
    if (!currentChecksums) return;
    const all = `MD5:    ${currentChecksums.md5}
SHA-1:  ${currentChecksums.sha1}
SHA-256: ${currentChecksums.sha256}
SHA-512: ${currentChecksums.sha512}
CRC-32: ${currentChecksums.crc32}
Size:   ${currentChecksums.sizeBytes} bytes`;
    navigator.clipboard.writeText(all);
    showToast('Copied all hashes to clipboard', 'success');
  });

  fileInput?.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) handleFile(files[0]);
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
      handleFile(e.dataTransfer.files[0]);
    }
  });
});
