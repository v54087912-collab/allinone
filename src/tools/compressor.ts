/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { formatBytes, calculateSavings, generateOutputFilename } from '../utils/image-math';
import { showToast } from '../shared/site-shell';
import { saveSession, loadSession, clearSession } from '../utils/sessionStore';

interface CompressItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  compressedSize: number;
  originalUrl: string;
  img: HTMLImageElement;
  width: number;
  height: number;
  compressedBlob: Blob | null;
  compressedUrl: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  savingsPercent: number;
}

type CompressMode = 'target-size' | 'quality';

export class ImageCompressorApp {
  private items: CompressItem[] = [];
  private mode: CompressMode = 'target-size';
  private targetMaxKB: number = 100; // default under 100 KB
  private qualityPercent: number = 75; // default 75%
  private maxDimension: number = 0; // 0 = keep original
  private outputFormat: 'image/webp' | 'image/jpeg' | 'image/png' = 'image/webp';

  // DOM elements
  private dropzone: HTMLElement | null = null;
  private fileInput: HTMLInputElement | null = null;
  private demoBtn: HTMLButtonElement | null = null;
  private tableBody: HTMLElement | null = null;
  private downloadZipBtn: HTMLButtonElement | null = null;
  private clearAllBtn: HTMLButtonElement | null = null;
  private startCompressBtn: HTMLButtonElement | null = null;
  private progressBar: HTMLElement | null = null;
  private progressContainer: HTMLElement | null = null;
  private progressText: HTMLElement | null = null;
  private summaryBar: HTMLElement | null = null;

  constructor() {
    this.initDOM();
    this.bindEvents();
    this.restoreSession();
  }

  private initDOM(): void {
    this.dropzone = document.getElementById('comp-dropzone');
    this.fileInput = document.getElementById('comp-file-input') as HTMLInputElement;
    this.demoBtn = document.getElementById('comp-demo-btn') as HTMLButtonElement;
    this.tableBody = document.getElementById('comp-table-body');
    this.downloadZipBtn = document.getElementById('comp-download-zip') as HTMLButtonElement;
    this.clearAllBtn = document.getElementById('comp-clear-all') as HTMLButtonElement;
    this.startCompressBtn = document.getElementById('comp-start-btn') as HTMLButtonElement;
    this.progressBar = document.getElementById('comp-progress-bar');
    this.progressContainer = document.getElementById('comp-progress-container');
    this.progressText = document.getElementById('comp-progress-text');
    this.summaryBar = document.getElementById('comp-summary-bar');
  }

  private bindEvents(): void {
    // Dropzone
    if (this.dropzone && this.fileInput) {
      this.dropzone.addEventListener('click', () => this.fileInput?.click());
      this.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dropzone?.classList.add('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
      });
      this.dropzone.addEventListener('dragleave', () => {
        this.dropzone?.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
      });
      this.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.dropzone?.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
        if (e.dataTransfer?.files) {
          this.handleFiles(Array.from(e.dataTransfer.files));
        }
      });
      this.fileInput.addEventListener('change', () => {
        if (this.fileInput?.files) {
          this.handleFiles(Array.from(this.fileInput.files));
          this.fileInput.value = '';
        }
      });
    }

    if (this.demoBtn) {
      this.demoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.loadDemoImages();
      });
    }

    // Mode tabs (Target size vs Quality slider)
    const modeTargetBtn = document.getElementById('mode-target-size-btn');
    const modeQualityBtn = document.getElementById('mode-quality-btn');
    const targetControls = document.getElementById('target-size-controls');
    const qualityControls = document.getElementById('quality-controls');

    if (modeTargetBtn && modeQualityBtn && targetControls && qualityControls) {
      modeTargetBtn.addEventListener('click', () => {
        this.mode = 'target-size';
        modeTargetBtn.classList.add('bg-blue-600', 'text-white');
        modeTargetBtn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        modeQualityBtn.classList.remove('bg-blue-600', 'text-white');
        modeQualityBtn.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        targetControls.classList.remove('hidden');
        qualityControls.classList.add('hidden');
        this.reprocessAll();
      });

      modeQualityBtn.addEventListener('click', () => {
        this.mode = 'quality';
        modeQualityBtn.classList.add('bg-blue-600', 'text-white');
        modeQualityBtn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        modeTargetBtn.classList.remove('bg-blue-600', 'text-white');
        modeTargetBtn.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        qualityControls.classList.remove('hidden');
        targetControls.classList.add('hidden');
        this.reprocessAll();
      });
    }

    // Target size presets
    document.querySelectorAll<HTMLButtonElement>('[data-target-kb]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kb = parseInt(btn.dataset.targetKb || '100', 10);
        this.targetMaxKB = kb;
        const customInput = document.getElementById('comp-custom-kb') as HTMLInputElement;
        if (customInput) customInput.value = String(kb);

        document.querySelectorAll('[data-target-kb]').forEach((b) => {
          b.classList.remove('border-blue-600', 'bg-blue-50', 'text-blue-700', 'dark:bg-blue-950/40', 'dark:text-blue-300');
          b.classList.add('border-slate-200', 'dark:border-slate-700');
        });
        btn.classList.add('border-blue-600', 'bg-blue-50', 'text-blue-700', 'dark:bg-blue-950/40', 'dark:text-blue-300');
        btn.classList.remove('border-slate-200', 'dark:border-slate-700');

        this.reprocessAll();
      });
    });

    // Custom Target KB input
    const customKbInput = document.getElementById('comp-custom-kb') as HTMLInputElement;
    if (customKbInput) {
      customKbInput.addEventListener('change', () => {
        const val = parseInt(customKbInput.value, 10);
        if (val > 5 && val < 50000) {
          this.targetMaxKB = val;
          this.reprocessAll();
        }
      });
    }

    // Quality slider
    const qualitySlider = document.getElementById('comp-quality-slider') as HTMLInputElement;
    const qualityVal = document.getElementById('comp-quality-val');
    if (qualitySlider) {
      qualitySlider.addEventListener('input', () => {
        const q = parseInt(qualitySlider.value, 10);
        this.qualityPercent = q;
        if (qualityVal) qualityVal.textContent = `${q}%`;
      });
      qualitySlider.addEventListener('change', () => {
        this.reprocessAll();
      });
    }

    // Format select
    const formatSelect = document.getElementById('comp-format-select') as HTMLSelectElement;
    if (formatSelect) {
      formatSelect.addEventListener('change', () => {
        this.outputFormat = formatSelect.value as any;
        this.reprocessAll();
      });
    }

    // Max dimension select
    const resizeSelect = document.getElementById('comp-resize-select') as HTMLSelectElement;
    if (resizeSelect) {
      resizeSelect.addEventListener('change', () => {
        this.maxDimension = parseInt(resizeSelect.value, 10) || 0;
        this.reprocessAll();
      });
    }

    // Buttons
    if (this.downloadZipBtn) {
      this.downloadZipBtn.addEventListener('click', () => this.downloadAllZip());
    }
    if (this.clearAllBtn) {
      this.clearAllBtn.addEventListener('click', () => this.clearAll());
    }
    if (this.startCompressBtn) {
      this.startCompressBtn.addEventListener('click', () => this.processQueue());
    }
  }

  private async handleFiles(files: File[]): Promise<void> {
    const valid = files.filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) {
      showToast('Please upload valid image files', 'error');
      return;
    }

    showToast(`Loading ${valid.length} image(s)...`, 'info');

    for (const file of valid) {
      try {
        const item = await this.loadFile(file);
        this.items.push(item);
      } catch (err) {
        console.error(err);
      }
    }

    this.updateUI();
    this.persistSession();
    this.processQueue();
  }

  private loadFile(file: File): Promise<CompressItem> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: file.name,
          originalSize: file.size,
          compressedSize: 0,
          originalUrl: url,
          img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          compressedBlob: null,
          compressedUrl: null,
          status: 'pending',
          savingsPercent: 0,
        });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  private updateUI(): void {
    const hasItems = this.items.length > 0;
    const emptyState = document.getElementById('comp-empty-state');
    const editorState = document.getElementById('comp-editor-state');

    if (emptyState && editorState) {
      if (hasItems) {
        emptyState.classList.add('hidden');
        editorState.classList.remove('hidden');
      } else {
        emptyState.classList.remove('hidden');
        editorState.classList.add('hidden');
      }
    }

    if (this.downloadZipBtn) {
      this.downloadZipBtn.disabled = !hasItems;
      this.downloadZipBtn.textContent = hasItems
        ? `Download All as ZIP (${this.items.length})`
        : 'Download All as ZIP';
    }

    if (this.clearAllBtn) {
      this.clearAllBtn.disabled = !hasItems;
    }

    this.renderTable();
    this.updateSummary();
  }

  private renderTable(): void {
    if (!this.tableBody) return;
    this.tableBody.innerHTML = '';

    this.items.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-sm transition-colors';

      let statusBadge = '';
      if (item.status === 'processing') {
        statusBadge = '<span class="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400"><svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Compressing...</span>';
      } else if (item.status === 'done') {
        statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">-${item.savingsPercent}%</span>`;
      } else if (item.status === 'error') {
        statusBadge = '<span class="text-xs text-rose-500 font-medium">Failed</span>';
      } else {
        statusBadge = '<span class="text-xs text-slate-400">Queued</span>';
      }

      tr.innerHTML = `
        <td class="py-3 px-4 flex items-center gap-3">
          <img src="${item.originalUrl}" alt="${item.name}" class="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0" />
          <div class="truncate max-w-[180px] sm:max-w-xs font-medium text-slate-800 dark:text-slate-200" title="${item.name}">
            ${item.name}
            <div class="text-[11px] text-slate-400 font-mono">${item.width}&times;${item.height}px</div>
          </div>
        </td>
        <td class="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
          ${formatBytes(item.originalSize)}
        </td>
        <td class="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
          ${item.compressedSize > 0 ? formatBytes(item.compressedSize) : '—'}
        </td>
        <td class="py-3 px-4">
          ${statusBadge}
        </td>
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-2">
            ${
              item.status === 'done' && item.compressedUrl
                ? `<a href="${item.compressedUrl}" download="${this.getOutputName(item)}" class="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium cursor-pointer transition-colors">
                    Download
                  </a>`
                : ''
            }
            <button type="button" data-remove-id="${item.id}" aria-label="Remove image" class="p-1 text-slate-400 hover:text-rose-500 cursor-pointer">
              &times;
            </button>
          </div>
        </td>
      `;

      tr.querySelector(`[data-remove-id="${item.id}"]`)?.addEventListener('click', () => {
        this.removeItem(item.id);
      });

      this.tableBody?.appendChild(tr);
    });
  }

  private updateSummary(): void {
    if (!this.summaryBar) return;
    if (this.items.length === 0) {
      this.summaryBar.innerHTML = '';
      return;
    }

    const totalOriginal = this.items.reduce((acc, it) => acc + it.originalSize, 0);
    const totalCompressed = this.items.reduce((acc, it) => acc + (it.compressedSize || it.originalSize), 0);
    const overallSavings = calculateSavings(totalOriginal, totalCompressed);
    const bytesSaved = Math.max(0, totalOriginal - totalCompressed);

    this.summaryBar.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-sm">
        <div class="flex items-center gap-6">
          <div>
            <span class="text-xs text-slate-500 block">Total Original:</span>
            <span class="font-mono font-medium">${formatBytes(totalOriginal)}</span>
          </div>
          <div>
            <span class="text-xs text-slate-500 block">Total Compressed:</span>
            <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">${formatBytes(totalCompressed)}</span>
          </div>
          <div>
            <span class="text-xs text-slate-500 block">Space Saved:</span>
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">${formatBytes(bytesSaved)} (${overallSavings}%)</span>
          </div>
        </div>
        <div class="text-xs text-slate-500">
          ${this.items.filter(i => i.status === 'done').length} of ${this.items.length} files compressed
        </div>
      </div>
    `;
  }

  private removeItem(id: string): void {
    const idx = this.items.findIndex((item) => item.id === id);
    if (idx !== -1) {
      URL.revokeObjectURL(this.items[idx].originalUrl);
      if (this.items[idx].compressedUrl) {
        URL.revokeObjectURL(this.items[idx].compressedUrl!);
      }
      this.items.splice(idx, 1);
      this.updateUI();
      this.persistSession();
    }
  }

  private clearAll(): void {
    this.items.forEach((item) => {
      URL.revokeObjectURL(item.originalUrl);
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
    });
    this.items = [];
    this.updateUI();
    clearSession('compressor_session');
    showToast('Queue cleared', 'info');
  }

  private reprocessAll(): void {
    if (this.items.length === 0) return;
    this.items.forEach((item) => {
      item.status = 'pending';
    });
    this.renderTable();
    this.persistSession();
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    const pendingItems = this.items.filter((item) => item.status === 'pending');
    if (pendingItems.length === 0) return;

    if (this.progressContainer && this.progressBar && this.progressText) {
      this.progressContainer.classList.remove('hidden');
      this.progressBar.style.width = '0%';
      this.progressText.textContent = `Compressing ${this.items.length} images...`;
    }

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (item.status === 'done') continue;

      item.status = 'processing';
      this.renderTable();

      try {
        const { blob, savings } = await this.compressItem(item);
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);

        item.compressedBlob = blob;
        item.compressedSize = blob.size;
        item.compressedUrl = URL.createObjectURL(blob);
        item.savingsPercent = savings;
        item.status = 'done';
      } catch (err) {
        console.error(err);
        item.status = 'error';
      }

      const pct = Math.round(((i + 1) / this.items.length) * 100);
      if (this.progressBar && this.progressText) {
        this.progressBar.style.width = `${pct}%`;
        this.progressText.textContent = `Completed ${i + 1} of ${this.items.length} (${pct}%)`;
      }

      this.renderTable();
      this.updateSummary();
    }

    this.persistSession();

    setTimeout(() => {
      if (this.progressContainer) this.progressContainer.classList.add('hidden');
    }, 1200);

    showToast('Batch compression completed!', 'success');
  }

  private async persistSession(): Promise<void> {
    try {
      const items = this.items.map((it) => ({
        id: it.id,
        file: it.file,
        name: it.name,
        originalSize: it.originalSize,
        compressedSize: it.compressedSize,
        width: it.width,
        height: it.height,
        compressedBlob: it.compressedBlob,
        status: it.status,
        savingsPercent: it.savingsPercent,
      }));
      await saveSession('compressor_session', {
        items,
        mode: this.mode,
        targetMaxKB: this.targetMaxKB,
        qualityPercent: this.qualityPercent,
        maxDimension: this.maxDimension,
        outputFormat: this.outputFormat,
      });
    } catch (e) {
      console.warn('[Compressor] Failed to persist session:', e);
    }
  }

  private async restoreSession(): Promise<void> {
    try {
      const session = await loadSession<any>('compressor_session');
      if (!session || !session.items || session.items.length === 0) return;

      this.mode = session.mode || 'target-size';
      this.targetMaxKB = session.targetMaxKB || 100;
      this.qualityPercent = session.qualityPercent || 75;
      this.maxDimension = session.maxDimension || 0;
      this.outputFormat = session.outputFormat || 'image/webp';

      // Update UI controls to match restored session
      const modeTargetBtn = document.getElementById('mode-target-size-btn');
      const modeQualityBtn = document.getElementById('mode-quality-btn');
      const targetControls = document.getElementById('target-size-controls');
      const qualityControls = document.getElementById('quality-controls');

      if (this.mode === 'quality') {
        modeQualityBtn?.classList.add('bg-blue-600', 'text-white');
        modeQualityBtn?.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        modeTargetBtn?.classList.remove('bg-blue-600', 'text-white');
        modeTargetBtn?.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        qualityControls?.classList.remove('hidden');
        targetControls?.classList.add('hidden');
      } else {
        modeTargetBtn?.classList.add('bg-blue-600', 'text-white');
        modeTargetBtn?.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        modeQualityBtn?.classList.remove('bg-blue-600', 'text-white');
        modeQualityBtn?.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        targetControls?.classList.remove('hidden');
        qualityControls?.classList.add('hidden');
      }

      const customKbInput = document.getElementById('comp-custom-kb') as HTMLInputElement;
      if (customKbInput) customKbInput.value = String(this.targetMaxKB);

      const qualitySlider = document.getElementById('comp-quality-slider') as HTMLInputElement;
      const qualityVal = document.getElementById('comp-quality-val');
      if (qualitySlider) qualitySlider.value = String(this.qualityPercent);
      if (qualityVal) qualityVal.textContent = `${this.qualityPercent}%`;

      const formatSelect = document.getElementById('comp-format-select') as HTMLSelectElement;
      if (formatSelect) formatSelect.value = this.outputFormat;

      const resizeSelect = document.getElementById('comp-resize-select') as HTMLSelectElement;
      if (resizeSelect) resizeSelect.value = String(this.maxDimension);

      for (const saved of session.items) {
        const origUrl = URL.createObjectURL(saved.file);
        const img = new Image();
        img.src = origUrl;
        const compUrl = saved.compressedBlob ? URL.createObjectURL(saved.compressedBlob) : null;
        this.items.push({
          id: saved.id,
          file: saved.file,
          name: saved.name,
          originalSize: saved.originalSize,
          compressedSize: saved.compressedSize,
          originalUrl: origUrl,
          img,
          width: saved.width,
          height: saved.height,
          compressedBlob: saved.compressedBlob,
          compressedUrl: compUrl,
          status: saved.status === 'processing' ? 'pending' : saved.status,
          savingsPercent: saved.savingsPercent,
        });
      }

      this.updateUI();

      if (this.items.some((i) => i.status === 'pending')) {
        this.processQueue();
      }
    } catch (e) {
      console.warn('[Compressor] Failed to restore session:', e);
    }
  }

  /**
   * Compresses an image either to target file size or with quality factor.
   */
  private async compressItem(item: CompressItem): Promise<{ blob: Blob; savings: number }> {
    // Dimension scaling
    let targetW = item.width;
    let targetH = item.height;

    if (this.maxDimension > 0) {
      const maxDim = Math.max(item.width, item.height);
      if (maxDim > this.maxDimension) {
        const scale = this.maxDimension / maxDim;
        targetW = Math.round(item.width * scale);
        targetH = Math.round(item.height * scale);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;

    // White background for JPEG if image has transparent pixels
    if (this.outputFormat === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    }
    ctx.drawImage(item.img, 0, 0, targetW, targetH);

    let outputBlob: Blob;

    if (this.mode === 'quality') {
      // Direct quality slider encoding
      const q = this.qualityPercent / 100;
      outputBlob = await new Promise((res) => canvas.toBlob((b) => res(b!), this.outputFormat, q));
    } else {
      // Binary search iterative algorithm to fit under target KB
      const targetBytes = this.targetMaxKB * 1024;
      let minQ = 0.05;
      let maxQ = 0.98;
      let bestBlob: Blob | null = null;

      // Up to 5 binary search iterations for fast convergence
      for (let iter = 0; iter < 5; iter++) {
        const midQ = (minQ + maxQ) / 2;
        const testBlob = await new Promise<Blob>((res) =>
          canvas.toBlob((b) => res(b!), this.outputFormat, midQ)
        );

        if (testBlob.size <= targetBytes) {
          bestBlob = testBlob;
          minQ = midQ; // Try to get higher quality while staying under target
        } else {
          maxQ = midQ; // Too big, lower quality
        }
      }

      // If even min quality is over target, reduce dimensions as final resort
      if (!bestBlob || bestBlob.size > targetBytes) {
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = Math.round(targetW * 0.7);
        scaledCanvas.height = Math.round(targetH * 0.7);
        const sCtx = scaledCanvas.getContext('2d')!;
        if (this.outputFormat === 'image/jpeg') {
          sCtx.fillStyle = '#ffffff';
          sCtx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
        }
        sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
        bestBlob = await new Promise<Blob>((res) =>
          scaledCanvas.toBlob((b) => res(b!), this.outputFormat, 0.45)
        );
      }

      outputBlob = bestBlob;
    }

    const savings = calculateSavings(item.originalSize, outputBlob.size);
    return { blob: outputBlob, savings };
  }

  private getOutputName(item: CompressItem): string {
    const ext = this.outputFormat === 'image/webp' ? 'webp' : this.outputFormat === 'image/jpeg' ? 'jpg' : 'png';
    return generateOutputFilename(item.name, '-min', ext);
  }

  private async downloadAllZip(): Promise<void> {
    const doneItems = this.items.filter((i) => i.status === 'done' && i.compressedBlob);
    if (doneItems.length === 0) {
      showToast('No compressed images ready to download', 'info');
      return;
    }

    try {
      showToast('Packaging ZIP...', 'info');
      const zip = new JSZip();

      doneItems.forEach((item) => {
        const outName = this.getOutputName(item);
        zip.file(outName, item.compressedBlob!);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quickpic-compressed-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showToast(`ZIP downloaded with ${doneItems.length} files!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to create ZIP', 'error');
    }
  }

  private async loadDemoImages(): Promise<void> {
    showToast('Creating demo sample photos...', 'info');

    const demoSets = [
      { name: 'sample-hero-landscape.jpg', w: 1920, h: 1080, col1: '#3b82f6', col2: '#1d4ed8', title: 'Mountain Vista (FHD)' },
      { name: 'sample-portrait-session.jpg', w: 1200, h: 1500, col1: '#ec4899', col2: '#be185d', title: 'Editorial Portrait' },
      { name: 'sample-product-catalog.png', w: 1400, h: 1400, col1: '#10b981', col2: '#047857', title: 'Product Showcase' },
    ];

    for (const d of demoSets) {
      const c = document.createElement('canvas');
      c.width = d.w;
      c.height = d.h;
      const ctx = c.getContext('2d')!;

      // Background gradient
      const g = ctx.createLinearGradient(0, 0, d.w, d.h);
      g.addColorStop(0, d.col1);
      g.addColorStop(1, d.col2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, d.w, d.h);

      // Noise and geometric elements to create real image data volume
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        ctx.arc(
          Math.random() * d.w,
          Math.random() * d.h,
          20 + Math.random() * 80,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.title, d.w / 2, d.h / 2);
      ctx.font = '28px sans-serif';
      ctx.fillText(`${d.w} x ${d.h} Original High-Res Sample`, d.w / 2, d.h / 2 + 65);

      const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.95));
      const file = new File([blob], d.name, { type: 'image/jpeg' });
      const item = await this.loadFile(file);
      this.items.push(item);
    }

    this.updateUI();
    this.processQueue();
  }
}

// Initialize on page load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ImageCompressorApp());
  } else {
    new ImageCompressorApp();
  }
}
