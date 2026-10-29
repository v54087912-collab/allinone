/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { formatBytes, generateOutputFilename } from '../utils/image-math';
import { showToast } from '../shared/site-shell';
import { saveSession, loadSession, clearSession } from '../utils/sessionStore';

interface QueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'waiting' | 'processing' | 'done' | 'failed' | 'cancelled';
  progress: number;
  stage: string;
  originalBitmap: ImageBitmap | null;
  resultBitmap: ImageBitmap | null;
  resultBlob?: Blob | null;
  resultUrl: string | null;
  downscaleInfo?: {
    originalW: number;
    originalH: number;
    processedW: number;
    processedH: number;
    downscaled: boolean;
  };
  error?: string;
}

async function bitmapToBlob(bitmap: ImageBitmap): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(bitmap, 0, 0);
  }
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
  });
}

type BgMode = 'transparent' | 'color' | 'gradient';

export class BackgroundRemoverApp {
  private worker: Worker | null = null;
  private queue: QueueItem[] = [];
  private activeProcessingId: string | null = null;
  private selectedItemId: string | null = null;
  private processedCountSinceWorkerSpawn: number = 0;

  // Downscale setting (0 means original / no downscale)
  private selectedMaxDimension: number = 1500;

  // Backdrop styling state
  private currentMode: BgMode = 'transparent';
  private chosenColor: string = '#ffffff';
  private chosenGradient: string = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  private currentViewMode: 'result' | 'split' | 'original' = 'result';

  // DOM elements
  private dropzone: HTMLElement | null = null;
  private fileInput: HTMLInputElement | null = null;
  private demoBtn: HTMLButtonElement | null = null;
  private queueContainer: HTMLElement | null = null;
  private queueList: HTMLElement | null = null;
  private queueStats: HTMLElement | null = null;
  private clearQueueBtn: HTMLButtonElement | null = null;
  private downloadAllZipBtn: HTMLButtonElement | null = null;
  private downscaleSelect: HTMLSelectElement | null = null;
  private editorWorkspace: HTMLElement | null = null;
  private emptyState: HTMLElement | null = null;
  private previewCanvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private downloadBtn: HTMLButtonElement | null = null;
  private customColorInput: HTMLInputElement | null = null;
  private viewModeSelect: HTMLSelectElement | null = null;

  constructor() {
    this.initDOM();
    this.bindEvents();
    this.restoreSession();
  }

  private initDOM(): void {
    this.dropzone = document.getElementById('bg-dropzone');
    this.fileInput = document.getElementById('bg-file-input') as HTMLInputElement;
    this.demoBtn = document.getElementById('bg-demo-btn') as HTMLButtonElement;
    this.queueContainer = document.getElementById('bg-queue-container');
    this.queueList = document.getElementById('bg-queue-list');
    this.queueStats = document.getElementById('bg-queue-stats');
    this.clearQueueBtn = document.getElementById('bg-clear-queue-btn') as HTMLButtonElement;
    this.downloadAllZipBtn = document.getElementById('bg-download-all-zip') as HTMLButtonElement;
    this.downscaleSelect = document.getElementById('bg-downscale-select') as HTMLSelectElement;
    this.editorWorkspace = document.getElementById('bg-editor-state');
    this.emptyState = document.getElementById('bg-empty-state');
    this.previewCanvas = document.getElementById('bg-preview-canvas') as HTMLCanvasElement;
    if (this.previewCanvas) {
      this.ctx = this.previewCanvas.getContext('2d');
    }
    this.downloadBtn = document.getElementById('bg-download-btn') as HTMLButtonElement;
    this.customColorInput = document.getElementById('bg-custom-color') as HTMLInputElement;
    this.viewModeSelect = document.getElementById('bg-view-mode') as HTMLSelectElement;
  }

  /**
   * Lazily spawns or returns the Web Worker dedicated to AI model inference
   */
  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('../workers/bg-removal.worker.ts', import.meta.url),
        { type: 'module' }
      );
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = (err) => {
        console.error('Background removal worker error:', err);
        showToast('Background removal worker error. Recovering...', 'error');
        if (this.activeProcessingId) {
          this.markItemFailed(this.activeProcessingId, 'Worker encountered an unexpected error.');
        }
        this.recycleWorker();
      };
      this.processedCountSinceWorkerSpawn = 0;
    }
    return this.worker;
  }

  /**
   * Explicitly cleans up and terminates the Web Worker to release 100% of WebGL/WASM heap
   */
  private recycleWorker(): void {
    if (this.worker) {
      try {
        this.worker.postMessage({ type: 'CLEANUP' });
        this.worker.terminate();
      } catch (e) {
        console.warn('Error during worker termination:', e);
      }
      this.worker = null;
      this.processedCountSinceWorkerSpawn = 0;
    }
  }

  private bindEvents(): void {
    // Dropzone
    if (this.dropzone && this.fileInput) {
      this.dropzone.addEventListener('click', () => this.fileInput?.click());
      this.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dropzone?.classList.add('border-indigo-500', 'bg-indigo-50/50', 'dark:bg-indigo-950/20');
      });
      this.dropzone.addEventListener('dragleave', () => {
        this.dropzone?.classList.remove('border-indigo-500', 'bg-indigo-50/50', 'dark:bg-indigo-950/20');
      });
      this.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.dropzone?.classList.remove('border-indigo-500', 'bg-indigo-50/50', 'dark:bg-indigo-950/20');
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
        this.loadDemoPhoto();
      });
    }

    // Downscale select
    if (this.downscaleSelect) {
      this.downscaleSelect.addEventListener('change', () => {
        this.selectedMaxDimension = parseInt(this.downscaleSelect?.value || '1500', 10);
        showToast(
          this.selectedMaxDimension > 0
            ? `Downscaling set to max ${this.selectedMaxDimension}px`
            : 'Processing at original resolution (no downscaling)',
          'info'
        );
      });
    }

    // Queue buttons
    if (this.clearQueueBtn) {
      this.clearQueueBtn.addEventListener('click', () => this.clearQueue());
    }
    if (this.downloadAllZipBtn) {
      this.downloadAllZipBtn.addEventListener('click', () => this.downloadAllCutoutsZip());
    }

    // Background mode buttons
    document.querySelectorAll<HTMLButtonElement>('[data-bg-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.bgMode as BgMode;
        this.currentMode = mode;
        document.querySelectorAll('[data-bg-mode]').forEach((b) => {
          b.classList.remove('bg-blue-600', 'text-white');
          b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        });
        btn.classList.add('bg-blue-600', 'text-white');
        btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        this.renderCanvas();
        this.persistSession();
      });
    });

    // Solid colors
    document.querySelectorAll<HTMLButtonElement>('[data-bg-color]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.chosenColor = btn.dataset.bgColor || '#ffffff';
        this.currentMode = 'color';
        if (this.customColorInput) this.customColorInput.value = this.chosenColor;
        this.renderCanvas();
        this.persistSession();
      });
    });

    // Custom color picker
    if (this.customColorInput) {
      this.customColorInput.addEventListener('input', () => {
        this.chosenColor = this.customColorInput?.value || '#ffffff';
        this.currentMode = 'color';
        this.renderCanvas();
        this.persistSession();
      });
    }

    // Gradient swatches
    document.querySelectorAll<HTMLButtonElement>('[data-bg-gradient]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.chosenGradient = btn.dataset.bgGradient || '';
        this.currentMode = 'gradient';
        this.renderCanvas();
        this.persistSession();
      });
    });

    // View mode select
    if (this.viewModeSelect) {
      this.viewModeSelect.addEventListener('change', () => {
        this.currentViewMode = this.viewModeSelect?.value as any;
        this.renderCanvas();
        this.persistSession();
      });
    }

    // Download button
    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadActiveResult());
    }

    // Window resize
    window.addEventListener('resize', () => this.renderCanvas());
  }

  private async handleFiles(files: File[]): Promise<void> {
    const valid = files.filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) {
      showToast('Please select valid image files', 'error');
      return;
    }

    showToast(`Added ${valid.length} image(s) to queue`, 'info');

    for (const file of valid) {
      const id = Math.random().toString(36).substring(2, 9);
      const item: QueueItem = {
        id,
        file,
        name: file.name,
        size: file.size,
        status: 'waiting',
        progress: 0,
        stage: 'Waiting in queue...',
        originalBitmap: null,
        resultBitmap: null,
        resultUrl: null,
      };
      this.queue.push(item);
    }

    if (!this.selectedItemId && this.queue.length > 0) {
      this.selectedItemId = this.queue[0].id;
    }

    this.updateUI();
    this.persistSession();
    this.processNextInQueue();
  }

  /**
   * Core Task Queue: Processes images sequentially, one-by-one
   */
  private async processNextInQueue(): Promise<void> {
    if (this.activeProcessingId) return; // Process strictly one at a time

    const next = this.queue.find((item) => item.status === 'waiting');
    if (!next) {
      this.updateQueueStats();
      return;
    }

    this.activeProcessingId = next.id;
    next.status = 'processing';
    next.progress = 5;
    next.stage = 'Loading image into memory...';
    this.updateUI();

    try {
      // Decode image to ImageBitmap
      if (!next.originalBitmap) {
        next.originalBitmap = await createImageBitmap(next.file);
      }

      // Clone bitmap to transfer ownership to worker without retaining copy in worker heap
      const bitmapForWorker = await createImageBitmap(next.originalBitmap);

      const worker = this.getWorker();
      worker.postMessage(
        {
          type: 'PROCESS',
          id: next.id,
          imageBitmap: bitmapForWorker,
          fileName: next.name,
          maxDimension: this.selectedMaxDimension,
          preferWebGPU: true,
        },
        [bitmapForWorker]
      );
    } catch (err: any) {
      console.error('Failed to prepare image for background removal:', err);
      this.markItemFailed(next.id, 'Failed to decode image.');
    }
  }

  private handleWorkerMessage(e: MessageEvent): void {
    const data = e.data;
    if (!data || !data.id) return;

    const item = this.queue.find((q) => q.id === data.id);
    if (!item) return;

    if (data.type === 'PROGRESS') {
      if (item.status === 'processing') {
        item.progress = data.percent;
        item.stage = data.stage;
        this.updateQueueItemUI(item);
      }
    } else if (data.type === 'SUCCESS') {
      item.status = 'done';
      item.progress = 100;
      item.stage = 'Completed';
      item.resultBitmap = data.resultBitmap as ImageBitmap;
      item.downscaleInfo = {
        originalW: data.originalWidth,
        originalH: data.originalHeight,
        processedW: data.outputWidth,
        processedH: data.outputHeight,
        downscaled: !!data.downscaled,
      };

      this.processedCountSinceWorkerSpawn++;
      this.activeProcessingId = null;

      // Explicit WebGL / WASM memory cleanup in worker
      this.worker?.postMessage({ type: 'CLEANUP' });

      // After 5 operations, recycle worker to guarantee zero memory accumulation in browser engine
      if (this.processedCountSinceWorkerSpawn >= 5) {
        this.recycleWorker();
      }

      if (this.selectedItemId === item.id) {
        this.renderCanvas();
      }
      this.updateUI();
      bitmapToBlob(item.resultBitmap).then((blob) => {
        item.resultBlob = blob;
        this.persistSession();
      });
      showToast(`Removed background from ${item.name}`, 'success');

      // Process next item in the queue one-by-one
      this.processNextInQueue();
    } else if (data.type === 'CANCELLED') {
      this.activeProcessingId = null;
      item.status = 'waiting';
      item.progress = 0;
      item.stage = 'Cancelled';
      this.updateUI();
      showToast('Processing cancelled', 'info');
      this.processNextInQueue();
    } else if (data.type === 'ERROR') {
      this.markItemFailed(data.id, data.error);
    }
  }

  private markItemFailed(id: string, errorMsg: string): void {
    const item = this.queue.find((q) => q.id === id);
    if (item) {
      item.status = 'failed';
      item.stage = errorMsg;
      item.error = errorMsg;
    }
    if (this.activeProcessingId === id) {
      this.activeProcessingId = null;
    }
    // Clean up worker memory after error
    this.worker?.postMessage({ type: 'CLEANUP' });
    this.updateUI();
    showToast(`Failed: ${errorMsg}`, 'error');
    this.processNextInQueue();
  }

  public cancelItem(id: string): void {
    const item = this.queue.find((q) => q.id === id);
    if (!item) return;

    if (this.activeProcessingId === id) {
      // Terminate worker to guarantee immediate abort and memory release
      this.recycleWorker();
      this.activeProcessingId = null;
      item.status = 'waiting';
      item.progress = 0;
      item.stage = 'Cancelled by user';
      this.updateUI();
      this.processNextInQueue();
    } else if (item.status === 'waiting') {
      this.removeItem(id);
    }
  }

  public retryItem(id: string): void {
    const item = this.queue.find((q) => q.id === id);
    if (!item) return;
    item.status = 'waiting';
    item.progress = 0;
    item.stage = 'Queued for retry...';
    item.error = undefined;
    this.updateUI();
    this.processNextInQueue();
  }

  public removeItem(id: string): void {
    const idx = this.queue.findIndex((q) => q.id === id);
    if (idx !== -1) {
      const it = this.queue[idx];
      // Explicitly free memory
      if (it.originalBitmap) {
        try { it.originalBitmap.close(); } catch (e) {}
        it.originalBitmap = null;
      }
      if (it.resultBitmap) {
        try { it.resultBitmap.close(); } catch (e) {}
        it.resultBitmap = null;
      }
      if (it.resultUrl) {
        URL.revokeObjectURL(it.resultUrl);
        it.resultUrl = null;
      }

      this.queue.splice(idx, 1);

      if (this.activeProcessingId === id) {
        this.recycleWorker();
        this.activeProcessingId = null;
        this.processNextInQueue();
      }

      if (this.selectedItemId === id) {
        this.selectedItemId = this.queue[0]?.id || null;
      }
      this.updateUI();
      this.persistSession();
    }
  }

  public clearQueue(): void {
    this.queue.forEach((it) => {
      if (it.originalBitmap) {
        try { it.originalBitmap.close(); } catch (e) {}
      }
      if (it.resultBitmap) {
        try { it.resultBitmap.close(); } catch (e) {}
      }
      if (it.resultUrl) {
        URL.revokeObjectURL(it.resultUrl);
      }
    });
    this.queue = [];
    this.selectedItemId = null;
    this.activeProcessingId = null;
    this.recycleWorker();
    this.updateUI();
    clearSession('bg_removal_session');
    showToast('All images cleared', 'info');
  }

  private async persistSession(): Promise<void> {
    try {
      const items = this.queue.map((it) => ({
        id: it.id,
        file: it.file,
        name: it.name,
        size: it.size,
        status: it.status,
        stage: it.stage,
        resultBlob: it.resultBlob || null,
        downscaleInfo: it.downscaleInfo,
        error: it.error,
      }));
      await saveSession('bg_removal_session', {
        items,
        selectedItemId: this.selectedItemId,
        currentMode: this.currentMode,
        chosenColor: this.chosenColor,
        chosenGradient: this.chosenGradient,
        currentViewMode: this.currentViewMode,
        selectedMaxDimension: this.selectedMaxDimension,
      });
    } catch (e) {
      console.warn('[BackgroundRemover] Failed to persist session:', e);
    }
  }

  private async restoreSession(): Promise<void> {
    try {
      const session = await loadSession<any>('bg_removal_session');
      if (!session || !session.items || session.items.length === 0) return;

      this.currentMode = session.currentMode || 'transparent';
      this.chosenColor = session.chosenColor || '#ffffff';
      this.chosenGradient = session.chosenGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      this.currentViewMode = session.currentViewMode || 'result';
      this.selectedMaxDimension = session.selectedMaxDimension || 1500;

      if (this.downscaleSelect) this.downscaleSelect.value = String(this.selectedMaxDimension);
      if (this.customColorInput) this.customColorInput.value = this.chosenColor;
      if (this.viewModeSelect) this.viewModeSelect.value = this.currentViewMode;

      for (const saved of session.items) {
        let origBmp: ImageBitmap | null = null;
        let resBmp: ImageBitmap | null = null;
        try {
          origBmp = await createImageBitmap(saved.file);
        } catch {}
        if (saved.resultBlob) {
          try {
            resBmp = await createImageBitmap(saved.resultBlob);
          } catch {}
        }

        this.queue.push({
          id: saved.id,
          file: saved.file,
          name: saved.name,
          size: saved.size,
          status: saved.status === 'processing' ? 'waiting' : saved.status,
          progress: saved.status === 'done' ? 100 : 0,
          stage: saved.stage || '',
          originalBitmap: origBmp,
          resultBitmap: resBmp,
          resultBlob: saved.resultBlob,
          resultUrl: null,
          downscaleInfo: saved.downscaleInfo,
          error: saved.error,
        });
      }

      this.selectedItemId = session.selectedItemId || (this.queue[0]?.id ?? null);
      this.updateUI();
      if (this.selectedItemId) {
        this.renderCanvas();
      }

      const hasWaiting = this.queue.some((it) => it.status === 'waiting');
      if (hasWaiting) {
        this.processNextInQueue();
      }
    } catch (e) {
      console.warn('[BackgroundRemover] Failed to restore session:', e);
    }
  }

  private updateQueueStats(): void {
    if (!this.queueStats) return;
    const waiting = this.queue.filter((q) => q.status === 'waiting').length;
    const processing = this.queue.filter((q) => q.status === 'processing').length;
    const done = this.queue.filter((q) => q.status === 'done').length;

    if (processing > 0) {
      this.queueStats.textContent = `Processing 1 of ${processing + waiting + done} • ${waiting} waiting`;
    } else if (waiting > 0) {
      this.queueStats.textContent = `${waiting} waiting • ${done} done`;
    } else {
      this.queueStats.textContent = `${done} done`;
    }
  }

  private updateUI(): void {
    const hasItems = this.queue.length > 0;
    if (this.emptyState && this.editorWorkspace) {
      if (hasItems) {
        this.emptyState.classList.add('hidden');
        this.editorWorkspace.classList.remove('hidden');
      } else {
        this.emptyState.classList.remove('hidden');
        this.editorWorkspace.classList.add('hidden');
      }
    }

    this.updateQueueStats();
    this.renderQueueList();
    this.renderCanvas();

    const selected = this.queue.find((q) => q.id === this.selectedItemId);
    if (this.downloadBtn) {
      this.downloadBtn.disabled = !selected || selected.status !== 'done';
    }

    if (this.downloadAllZipBtn) {
      const doneCount = this.queue.filter((q) => q.status === 'done').length;
      this.downloadAllZipBtn.disabled = doneCount === 0;
      this.downloadAllZipBtn.textContent = doneCount > 0
        ? `Download All Cutouts (.zip) (${doneCount})`
        : 'Download All Cutouts (.zip)';
    }
  }

  private renderQueueList(): void {
    if (!this.queueList) return;
    this.queueList.innerHTML = '';

    this.queue.forEach((item) => {
      const isSelected = item.id === this.selectedItemId;
      const el = document.createElement('div');
      el.className = `p-3 rounded-xl border transition-all text-xs flex flex-col gap-2 ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500/20'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
      }`;

      // Status indicator tag
      let statusHtml = '';
      if (item.status === 'processing') {
        statusHtml = `
          <div class="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-medium">
            <span class="flex items-center gap-1.5">
              <svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
              Processing (${item.progress}%)
            </span>
            <button type="button" data-action="cancel" data-id="${item.id}" class="text-rose-500 hover:underline cursor-pointer">Cancel</button>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div class="bg-indigo-600 h-1.5 transition-all duration-200" style="width: ${item.progress}%"></div>
          </div>
          <div class="text-[11px] text-slate-500 truncate">${item.stage}</div>
        `;
      } else if (item.status === 'done') {
        const info = item.downscaleInfo;
        const scaleText = info?.downscaled
          ? `<span class="text-[10px] font-mono text-slate-400">${info.processedW}×${info.processedH} (downscaled)</span>`
          : '';
        statusHtml = `
          <div class="flex items-center justify-between">
            <span class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              &check; Done ${scaleText}
            </span>
            <div class="flex items-center gap-2">
              <button type="button" data-action="select" data-id="${item.id}" class="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium">View</button>
              <button type="button" data-action="remove" data-id="${item.id}" class="text-slate-400 hover:text-rose-500 cursor-pointer">&times;</button>
            </div>
          </div>
        `;
      } else if (item.status === 'failed') {
        statusHtml = `
          <div class="flex items-center justify-between text-rose-500">
            <span class="truncate max-w-[140px]">${item.error || 'Failed'}</span>
            <div class="flex items-center gap-2">
              <button type="button" data-action="retry" data-id="${item.id}" class="text-blue-600 underline cursor-pointer">Retry</button>
              <button type="button" data-action="remove" data-id="${item.id}" class="text-slate-400 hover:text-rose-500 cursor-pointer">&times;</button>
            </div>
          </div>
        `;
      } else {
        statusHtml = `
          <div class="flex items-center justify-between text-slate-400">
            <span>Waiting in queue...</span>
            <button type="button" data-action="remove" data-id="${item.id}" class="hover:text-rose-500 cursor-pointer">&times;</button>
          </div>
        `;
      }

      el.innerHTML = `
        <div class="flex items-center justify-between gap-2 cursor-pointer" data-select-id="${item.id}">
          <div class="truncate font-medium text-slate-800 dark:text-slate-200" title="${item.name}">
            ${item.name}
          </div>
          <span class="text-slate-400 font-mono shrink-0">${formatBytes(item.size)}</span>
        </div>
        ${statusHtml}
      `;

      el.querySelector('[data-select-id]')?.addEventListener('click', () => {
        this.selectedItemId = item.id;
        this.updateUI();
      });

      el.querySelector('[data-action="select"]')?.addEventListener('click', () => {
        this.selectedItemId = item.id;
        this.updateUI();
      });

      el.querySelector('[data-action="cancel"]')?.addEventListener('click', () => this.cancelItem(item.id));
      el.querySelector('[data-action="retry"]')?.addEventListener('click', () => this.retryItem(item.id));
      el.querySelector('[data-action="remove"]')?.addEventListener('click', () => this.removeItem(item.id));

      this.queueList?.appendChild(el);
    });
  }

  private updateQueueItemUI(item: QueueItem): void {
    const itemEl = this.queueList?.querySelector(`[data-select-id="${item.id}"]`)?.parentElement;
    if (itemEl && item.status === 'processing') {
      const bar = itemEl.querySelector('.bg-indigo-600') as HTMLElement;
      if (bar) bar.style.width = `${item.progress}%`;
      const stageEl = itemEl.querySelector('.text-\\[11px\\]');
      if (stageEl) stageEl.textContent = item.stage;
    }
  }

  private renderCanvas(): void {
    if (!this.previewCanvas || !this.ctx) return;
    const selected = this.queue.find((q) => q.id === this.selectedItemId);

    const parent = this.previewCanvas.parentElement;
    const maxW = parent ? parent.clientWidth : 700;
    const maxH = 500;

    if (!selected) {
      this.previewCanvas.width = 300;
      this.previewCanvas.height = 200;
      this.ctx.clearRect(0, 0, 300, 200);
      return;
    }

    const imgSource =
      this.currentViewMode === 'original' || !selected.resultBitmap
        ? selected.originalBitmap
        : selected.resultBitmap;

    if (!imgSource) {
      this.previewCanvas.width = 400;
      this.previewCanvas.height = 300;
      this.ctx.clearRect(0, 0, 400, 300);
      this.ctx.fillStyle = '#64748b';
      this.ctx.font = '14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        selected.status === 'processing' ? `Processing (${selected.progress}%)...` : 'Image queued...',
        200,
        150
      );
      return;
    }

    const imgW = imgSource.width;
    const imgH = imgSource.height;
    const scale = Math.min(maxW / imgW, maxH / imgH, 1);
    const dispW = Math.max(1, Math.round(imgW * scale));
    const dispH = Math.max(1, Math.round(imgH * scale));

    this.previewCanvas.width = dispW;
    this.previewCanvas.height = dispH;
    this.ctx.clearRect(0, 0, dispW, dispH);

    // If viewing cutout with solid color or gradient
    if (this.currentViewMode !== 'original' && selected.resultBitmap) {
      if (this.currentMode === 'color') {
        this.ctx.fillStyle = this.chosenColor;
        this.ctx.fillRect(0, 0, dispW, dispH);
      } else if (this.currentMode === 'gradient') {
        const grad = this.ctx.createLinearGradient(0, 0, dispW, dispH);
        if (this.chosenGradient.includes('#667eea')) {
          grad.addColorStop(0, '#667eea');
          grad.addColorStop(1, '#764ba2');
        } else if (this.chosenGradient.includes('#ff758c')) {
          grad.addColorStop(0, '#ff758c');
          grad.addColorStop(1, '#ff7eb3');
        } else {
          grad.addColorStop(0, '#1e3c72');
          grad.addColorStop(1, '#2a5298');
        }
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, dispW, dispH);
      }
    }

    if (this.currentViewMode === 'split' && selected.originalBitmap && selected.resultBitmap) {
      // Left: Original
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(0, 0, dispW / 2, dispH);
      this.ctx.clip();
      this.ctx.drawImage(selected.originalBitmap, 0, 0, dispW, dispH);
      this.ctx.restore();

      // Right: Cutout
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(dispW / 2, 0, dispW / 2, dispH);
      this.ctx.clip();
      this.ctx.drawImage(selected.resultBitmap, 0, 0, dispW, dispH);
      this.ctx.restore();

      // Divider line
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(dispW / 2, 0);
      this.ctx.lineTo(dispW / 2, dispH);
      this.ctx.stroke();
    } else {
      this.ctx.drawImage(imgSource, 0, 0, dispW, dispH);
    }
  }

  private async downloadActiveResult(): Promise<void> {
    const item = this.queue.find((q) => q.id === this.selectedItemId);
    if (!item || !item.resultBitmap) return;

    try {
      showToast('Exporting cutout image...', 'info');
      const w = item.resultBitmap.width;
      const h = item.resultBitmap.height;

      const outCanvas = document.createElement('canvas');
      outCanvas.width = w;
      outCanvas.height = h;
      const outCtx = outCanvas.getContext('2d')!;

      const isTransparent = this.currentMode === 'transparent';
      if (!isTransparent) {
        if (this.currentMode === 'color') {
          outCtx.fillStyle = this.chosenColor;
          outCtx.fillRect(0, 0, w, h);
        } else if (this.currentMode === 'gradient') {
          const grad = outCtx.createLinearGradient(0, 0, w, h);
          if (this.chosenGradient.includes('#667eea')) {
            grad.addColorStop(0, '#667eea');
            grad.addColorStop(1, '#764ba2');
          } else if (this.chosenGradient.includes('#ff758c')) {
            grad.addColorStop(0, '#ff758c');
            grad.addColorStop(1, '#ff7eb3');
          } else {
            grad.addColorStop(0, '#1e3c72');
            grad.addColorStop(1, '#2a5298');
          }
          outCtx.fillStyle = grad;
          outCtx.fillRect(0, 0, w, h);
        }
      }

      outCtx.drawImage(item.resultBitmap, 0, 0, w, h);

      const mimeType = isTransparent ? 'image/png' : 'image/jpeg';
      const ext = isTransparent ? 'png' : 'jpg';
      const outName = generateOutputFilename(item.name, '-nobg', ext);

      outCanvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = outName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          showToast(`Downloaded ${outName}`, 'success');

          // Free canvas memory
          outCanvas.width = 0;
          outCanvas.height = 0;
        },
        mimeType,
        0.95
      );
    } catch (err) {
      console.error(err);
      showToast('Error exporting download', 'error');
    }
  }

  public async downloadAllCutoutsZip(): Promise<void> {
    const doneItems = this.queue.filter((q) => q.status === 'done' && q.resultBitmap);
    if (doneItems.length === 0) return;

    showToast(`Packaging ${doneItems.length} cutout images into ZIP...`, 'info');

    try {
      const zip = new JSZip();
      const isTransparent = this.currentMode === 'transparent';
      const ext = isTransparent ? 'png' : 'jpg';
      const mimeType = isTransparent ? 'image/png' : 'image/jpeg';

      for (const item of doneItems) {
        if (!item.resultBitmap) continue;
        const w = item.resultBitmap.width;
        const h = item.resultBitmap.height;

        const outCanvas = document.createElement('canvas');
        outCanvas.width = w;
        outCanvas.height = h;
        const outCtx = outCanvas.getContext('2d')!;

        if (!isTransparent) {
          if (this.currentMode === 'color') {
            outCtx.fillStyle = this.chosenColor;
            outCtx.fillRect(0, 0, w, h);
          } else if (this.currentMode === 'gradient') {
            const grad = outCtx.createLinearGradient(0, 0, w, h);
            if (this.chosenGradient.includes('#667eea')) {
              grad.addColorStop(0, '#667eea');
              grad.addColorStop(1, '#764ba2');
            } else if (this.chosenGradient.includes('#ff758c')) {
              grad.addColorStop(0, '#ff758c');
              grad.addColorStop(1, '#ff7eb3');
            } else {
              grad.addColorStop(0, '#1e3c72');
              grad.addColorStop(1, '#2a5298');
            }
            outCtx.fillStyle = grad;
            outCtx.fillRect(0, 0, w, h);
          }
        }

        outCtx.drawImage(item.resultBitmap, 0, 0, w, h);

        const blob = await new Promise<Blob>((res, rej) => {
          outCanvas.toBlob(
            (b) => (b ? res(b) : rej(new Error('Export failed'))),
            mimeType,
            0.95
          );
        });

        const fileName = generateOutputFilename(item.name, '-nobg', ext);
        zip.file(fileName, blob);

        outCanvas.width = 0;
        outCanvas.height = 0;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `quickpic-cutouts-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(zipUrl);

      showToast(`Downloaded ZIP with ${doneItems.length} cutouts!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to create ZIP file', 'error');
    }
  }

  private async loadDemoPhoto(): Promise<void> {
    showToast('Loading demo product photo...', 'info');

    const c = document.createElement('canvas');
    c.width = 1000;
    c.height = 1000;
    const ctx = c.getContext('2d')!;

    // Flat grey studio background
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 1000, 1000);

    // Subject: Product camera
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(300, 250, 400, 500, 50);
    ctx.fill();

    // Lens
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(500, 480, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(470, 450, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STUDIO PRO 4K', 500, 680);

    const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/png'));
    const file = new File([blob], 'demo-camera-product.png', { type: 'image/png' });
    this.handleFiles([file]);
  }
}

// Auto init
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BackgroundRemoverApp());
  } else {
    new BackgroundRemoverApp();
  }
}
