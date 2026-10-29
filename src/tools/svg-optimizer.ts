/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { optimizeSvgString } from '../utils/vectorDesignUtils.ts';

export function initSvgOptimizer(): void {
  const fileInput = document.getElementById('svg-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('svg-drop-zone') as HTMLDivElement | null;
  const rawSvgInput = document.getElementById('raw-svg') as HTMLTextAreaElement | null;
  const optimizeBtn = document.getElementById('optimize-btn') as HTMLButtonElement | null;
  const optimizedSvgOutput = document.getElementById('optimized-svg') as HTMLTextAreaElement | null;
  const savingsBadge = document.getElementById('savings-badge') as HTMLSpanElement | null;
  const previewDiv = document.getElementById('svg-preview') as HTMLDivElement | null;
  const copyBtn = document.getElementById('copy-svg-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('download-svg-btn') as HTMLButtonElement | null;

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      if (fileInput.files?.length) {
        const text = await fileInput.files[0].text();
        if (rawSvgInput) rawSvgInput.value = text;
        runOptimization();
      }
    });
  }

  function runOptimization() {
    const raw = rawSvgInput?.value || '';
    if (!raw.includes('<svg')) return;

    const result = optimizeSvgString(raw);
    if (optimizedSvgOutput) optimizedSvgOutput.value = result.optimizedSvg;
    if (savingsBadge) {
      savingsBadge.textContent = `${result.savingsPercent}% Reduced (${result.originalBytes}B → ${result.optimizedBytes}B)`;
      savingsBadge.classList.remove('hidden');
    }
    if (previewDiv) {
      previewDiv.innerHTML = result.optimizedSvg;
    }
    if (copyBtn) copyBtn.disabled = false;
    if (downloadBtn) downloadBtn.disabled = false;
  }

  if (optimizeBtn) optimizeBtn.addEventListener('click', runOptimization);
  if (rawSvgInput) rawSvgInput.addEventListener('input', runOptimization);

  if (copyBtn && optimizedSvgOutput) {
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(optimizedSvgOutput.value);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy SVG'; }, 1500);
    });
  }

  if (downloadBtn && optimizedSvgOutput) {
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([optimizedSvgOutput.value], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'optimized.svg';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

document.addEventListener('DOMContentLoaded', initSvgOptimizer);
