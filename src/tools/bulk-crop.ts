/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import {
  AspectRatioPreset,
  CropDimensions,
  calculateInitialCropBox,
  clampCropBox,
  formatBytes,
  generateCropFilename,
  getAspectRatioValue,
} from '../utils/image-math';
import { showToast } from '../shared/site-shell';

export interface SavedCrop {
  id: string;
  name: string;
  preset: AspectRatioPreset;
  cropBox: CropDimensions;
  width: number;
  height: number;
  thumbnailUrl: string;
}

export interface ImageCropItem {
  id: string;
  file: File;
  name: string;
  url: string;
  img: HTMLImageElement;
  width: number;
  height: number;
  crops: SavedCrop[];
  activeCropId: string;
}

export class BulkCropApp {
  private images: ImageCropItem[] = [];
  private activeImageIndex: number = 0;
  private outputFormat: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';
  private outputQuality: number = 0.92;
  private sidebarFilter: 'current' | 'all' = 'current';

  // DOM Elements
  private dropzone: HTMLElement | null = null;
  private fileInput: HTMLInputElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private imageQueueList: HTMLElement | null = null;
  private activeImageInfo: HTMLElement | null = null;
  private addCropBtn: HTMLButtonElement | null = null;
  private sidebarAddCropBtn: HTMLButtonElement | null = null;
  private resetCropBtn: HTMLButtonElement | null = null;
  private downloadZipBtn: HTMLButtonElement | null = null;
  private downloadCurrentZipBtn: HTMLButtonElement | null = null;
  private clearAllBtn: HTMLButtonElement | null = null;
  private demoPhotosBtn: HTMLButtonElement | null = null;
  private applyAllBtn: HTMLButtonElement | null = null;
  private progressBar: HTMLElement | null = null;
  private progressContainer: HTMLElement | null = null;
  private progressText: HTMLElement | null = null;
  private sidebarCropsContainer: HTMLElement | null = null;
  private sidebarTotalBadge: HTMLElement | null = null;
  private filterCurrentBtn: HTMLButtonElement | null = null;
  private filterAllBtn: HTMLButtonElement | null = null;

  // Pointer / Drag State (supports mouse and touch)
  private isDragging: boolean = false;
  private dragMode: 'move' | 'nw' | 'ne' | 'sw' | 'se' | null = null;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private initialCropAtDrag: CropDimensions | null = null;
  private canvasScale: number = 1;

  constructor() {
    this.initDOM();
    this.bindEvents();
  }

  private initDOM(): void {
    this.dropzone = document.getElementById('crop-dropzone');
    this.fileInput = document.getElementById('crop-file-input') as HTMLInputElement;
    this.canvas = document.getElementById('crop-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
    this.imageQueueList = document.getElementById('crop-image-list');
    this.activeImageInfo = document.getElementById('active-image-info');
    this.addCropBtn = document.getElementById('crop-add-crop-btn') as HTMLButtonElement;
    this.sidebarAddCropBtn = document.getElementById('crop-sidebar-add-crop-btn') as HTMLButtonElement;
    this.resetCropBtn = document.getElementById('crop-reset-btn') as HTMLButtonElement;
    this.downloadZipBtn = document.getElementById('download-crop-zip') as HTMLButtonElement;
    this.downloadCurrentZipBtn = document.getElementById('download-current-crops-zip') as HTMLButtonElement;
    this.clearAllBtn = document.getElementById('crop-clear-all') as HTMLButtonElement;
    this.demoPhotosBtn = document.getElementById('crop-demo-btn') as HTMLButtonElement;
    this.applyAllBtn = document.getElementById('crop-apply-all-btn') as HTMLButtonElement;
    this.progressBar = document.getElementById('crop-progress-bar');
    this.progressContainer = document.getElementById('crop-progress-container');
    this.progressText = document.getElementById('crop-progress-text');
    this.sidebarCropsContainer = document.getElementById('crop-sidebar-crops-container');
    this.sidebarTotalBadge = document.getElementById('crop-sidebar-total-badge');
    this.filterCurrentBtn = document.getElementById('crop-filter-current') as HTMLButtonElement;
    this.filterAllBtn = document.getElementById('crop-filter-all') as HTMLButtonElement;
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

    if (this.demoPhotosBtn) {
      this.demoPhotosBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.loadDemoPhotos();
      });
    }

    // Ratio Presets
    document.querySelectorAll<HTMLButtonElement>('[data-crop-ratio]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ratio = btn.dataset.cropRatio as AspectRatioPreset;
        this.setRatioPreset(ratio);
        this.updateRatioButtonStyles(ratio);
      });
    });

    // Add another crop buttons
    if (this.addCropBtn) {
      this.addCropBtn.addEventListener('click', () => this.addCropToActiveImage());
    }
    if (this.sidebarAddCropBtn) {
      this.sidebarAddCropBtn.addEventListener('click', () => this.addCropToActiveImage());
    }

    // Reset crop button
    if (this.resetCropBtn) {
      this.resetCropBtn.addEventListener('click', () => this.resetActiveCrop());
    }

    // Apply to all photos
    if (this.applyAllBtn) {
      this.applyAllBtn.addEventListener('click', () => this.applyPresetToAll());
    }

    // Download ZIP buttons
    if (this.downloadZipBtn) {
      this.downloadZipBtn.addEventListener('click', () => this.downloadAllZip());
    }
    if (this.downloadCurrentZipBtn) {
      this.downloadCurrentZipBtn.addEventListener('click', () => this.downloadCurrentPhotoZip());
    }

    // Clear All
    if (this.clearAllBtn) {
      this.clearAllBtn.addEventListener('click', () => this.clearAll());
    }

    // Filter toggle in sidebar
    if (this.filterCurrentBtn && this.filterAllBtn) {
      this.filterCurrentBtn.addEventListener('click', () => {
        this.sidebarFilter = 'current';
        this.filterCurrentBtn?.classList.add('bg-white', 'dark:bg-slate-900', 'text-blue-600', 'dark:text-blue-400', 'font-semibold', 'shadow-xs');
        this.filterCurrentBtn?.classList.remove('text-slate-600', 'dark:text-slate-300');
        this.filterAllBtn?.classList.remove('bg-white', 'dark:bg-slate-900', 'text-blue-600', 'dark:text-blue-400', 'font-semibold', 'shadow-xs');
        this.filterAllBtn?.classList.add('text-slate-600', 'dark:text-slate-300');
        this.renderSidebarCrops();
      });
      this.filterAllBtn.addEventListener('click', () => {
        this.sidebarFilter = 'all';
        this.filterAllBtn?.classList.add('bg-white', 'dark:bg-slate-900', 'text-blue-600', 'dark:text-blue-400', 'font-semibold', 'shadow-xs');
        this.filterAllBtn?.classList.remove('text-slate-600', 'dark:text-slate-300');
        this.filterCurrentBtn?.classList.remove('bg-white', 'dark:bg-slate-900', 'text-blue-600', 'dark:text-blue-400', 'font-semibold', 'shadow-xs');
        this.filterCurrentBtn?.classList.add('text-slate-600', 'dark:text-slate-300');
        this.renderSidebarCrops();
      });
    }

    // Format select
    const formatSelect = document.getElementById('crop-format-select') as HTMLSelectElement;
    if (formatSelect) {
      formatSelect.addEventListener('change', () => {
        this.outputFormat = formatSelect.value as any;
      });
    }

    // Quality slider
    const qualitySlider = document.getElementById('crop-quality-slider') as HTMLInputElement;
    const qualityVal = document.getElementById('crop-quality-value');
    if (qualitySlider) {
      qualitySlider.addEventListener('input', () => {
        const q = parseInt(qualitySlider.value, 10);
        this.outputQuality = q / 100;
        if (qualityVal) qualityVal.textContent = `${q}%`;
      });
    }

    // Pointer events for Canvas (Unifies mouse, stylus and mobile touch)
    if (this.canvas) {
      this.canvas.style.touchAction = 'none'; // Prevent browser scrolling while dragging crop
      this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
      window.addEventListener('pointermove', this.handlePointerMove.bind(this));
      window.addEventListener('pointerup', this.handlePointerUp.bind(this));
      window.addEventListener('pointercancel', this.handlePointerUp.bind(this));
    }

    window.addEventListener('resize', () => {
      if (this.images.length > 0) this.renderCanvas();
    });
  }

  private async handleFiles(files: File[]): Promise<void> {
    const valid = files.filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) {
      showToast('Please select valid image files', 'error');
      return;
    }

    showToast(`Loading ${valid.length} image(s)...`, 'info');

    for (const file of valid) {
      try {
        const item = await this.loadFileAsItem(file);
        this.images.push(item);
      } catch (err) {
        console.error('Error loading image', file.name, err);
      }
    }

    this.updateUI();
    showToast(`${this.images.length} image(s) ready`, 'success');
  }

  private loadFileAsItem(file: File): Promise<ImageCropItem> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const defaultPreset: AspectRatioPreset = '1:1';
        const cropBox = calculateInitialCropBox(img.naturalWidth, img.naturalHeight, defaultPreset);
        const cropId = Math.random().toString(36).substring(2, 9);
        const w = Math.round(cropBox.width);
        const h = Math.round(cropBox.height);
        const thumbnailUrl = this.generateThumbnailUrl(img, cropBox);

        const initialCrop: SavedCrop = {
          id: cropId,
          name: 'Crop #1',
          preset: defaultPreset,
          cropBox,
          width: w,
          height: h,
          thumbnailUrl,
        };

        resolve({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: file.name,
          url,
          img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          crops: [initialCrop],
          activeCropId: cropId,
        });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  private generateThumbnailUrl(img: HTMLImageElement, cropBox: CropDimensions): string {
    try {
      const thumbCanvas = document.createElement('canvas');
      const maxSide = 140;
      const w = Math.max(1, Math.round(cropBox.width));
      const h = Math.max(1, Math.round(cropBox.height));
      const scale = Math.min(maxSide / w, maxSide / h, 1);
      thumbCanvas.width = Math.max(1, Math.round(w * scale));
      thumbCanvas.height = Math.max(1, Math.round(h * scale));
      const ctx = thumbCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          img,
          cropBox.x,
          cropBox.y,
          cropBox.width,
          cropBox.height,
          0,
          0,
          thumbCanvas.width,
          thumbCanvas.height
        );
        return thumbCanvas.toDataURL('image/jpeg', 0.85);
      }
    } catch (e) {
      console.warn('Could not generate thumbnail', e);
    }
    return '';
  }

  private getActiveCrop(): SavedCrop | null {
    const active = this.images[this.activeImageIndex];
    if (!active || active.crops.length === 0) return null;
    const found = active.crops.find((c) => c.id === active.activeCropId);
    return found || active.crops[0];
  }

  /**
   * Adds another crop definition to the current active photo
   */
  public addCropToActiveImage(preset?: AspectRatioPreset): void {
    const active = this.images[this.activeImageIndex];
    if (!active) return;

    // Pick a complementary or current preset
    const currentCrop = this.getActiveCrop();
    const targetPreset = preset || currentCrop?.preset || '1:1';
    const cropBox = calculateInitialCropBox(active.width, active.height, targetPreset);
    const cropNum = active.crops.length + 1;
    const cropId = Math.random().toString(36).substring(2, 9);
    const w = Math.round(cropBox.width);
    const h = Math.round(cropBox.height);
    const thumbnailUrl = this.generateThumbnailUrl(active.img, cropBox);

    const newCrop: SavedCrop = {
      id: cropId,
      name: `Crop #${cropNum}`,
      preset: targetPreset,
      cropBox,
      width: w,
      height: h,
      thumbnailUrl,
    };

    active.crops.push(newCrop);
    active.activeCropId = cropId;

    this.updateRatioButtonStyles(targetPreset);
    this.updateUI();
    showToast(`Added Crop #${cropNum} (${targetPreset}) to ${active.name}`, 'success');
  }

  public selectCrop(cropId: string, imageIndex?: number): void {
    if (imageIndex !== undefined && imageIndex >= 0 && imageIndex < this.images.length) {
      this.activeImageIndex = imageIndex;
    }
    const active = this.images[this.activeImageIndex];
    if (!active) return;

    const crop = active.crops.find((c) => c.id === cropId);
    if (!crop) return;

    active.activeCropId = crop.id;
    this.updateRatioButtonStyles(crop.preset);
    this.renderCanvas();
    this.renderSidebarCrops();
    this.updateActiveInfo();
  }

  public deleteCrop(cropId: string, imageIndex?: number): void {
    const targetImgIndex = imageIndex !== undefined ? imageIndex : this.activeImageIndex;
    const imgItem = this.images[targetImgIndex];
    if (!imgItem) return;

    const idx = imgItem.crops.findIndex((c) => c.id === cropId);
    if (idx === -1) return;

    imgItem.crops.splice(idx, 1);

    // If all crops were removed, recreate an initial default crop
    if (imgItem.crops.length === 0) {
      const defaultPreset: AspectRatioPreset = '1:1';
      const cropBox = calculateInitialCropBox(imgItem.width, imgItem.height, defaultPreset);
      const newId = Math.random().toString(36).substring(2, 9);
      imgItem.crops.push({
        id: newId,
        name: 'Crop #1',
        preset: defaultPreset,
        cropBox,
        width: Math.round(cropBox.width),
        height: Math.round(cropBox.height),
        thumbnailUrl: this.generateThumbnailUrl(imgItem.img, cropBox),
      });
      imgItem.activeCropId = newId;
    } else if (imgItem.activeCropId === cropId) {
      imgItem.activeCropId = imgItem.crops[0].id;
    }

    const activeCrop = this.getActiveCrop();
    if (activeCrop) {
      this.updateRatioButtonStyles(activeCrop.preset);
    }

    this.updateUI();
    showToast('Crop removed', 'info');
  }

  private resetActiveCrop(): void {
    const active = this.images[this.activeImageIndex];
    const crop = this.getActiveCrop();
    if (!active || !crop) return;

    crop.cropBox = calculateInitialCropBox(active.width, active.height, crop.preset);
    crop.width = Math.round(crop.cropBox.width);
    crop.height = Math.round(crop.cropBox.height);
    crop.thumbnailUrl = this.generateThumbnailUrl(active.img, crop.cropBox);

    this.renderCanvas();
    this.renderSidebarCrops();
    this.updateActiveInfo();
    showToast('Reset crop to center', 'info');
  }

  private setRatioPreset(preset: AspectRatioPreset): void {
    const active = this.images[this.activeImageIndex];
    const crop = this.getActiveCrop();
    if (!active || !crop) return;

    crop.preset = preset;
    crop.cropBox = calculateInitialCropBox(active.width, active.height, preset);
    crop.width = Math.round(crop.cropBox.width);
    crop.height = Math.round(crop.cropBox.height);
    crop.thumbnailUrl = this.generateThumbnailUrl(active.img, crop.cropBox);

    this.renderCanvas();
    this.renderSidebarCrops();
    this.updateActiveInfo();
  }

  private updateRatioButtonStyles(selectedPreset: AspectRatioPreset): void {
    document.querySelectorAll<HTMLButtonElement>('[data-crop-ratio]').forEach((btn) => {
      const ratio = btn.dataset.cropRatio as AspectRatioPreset;
      if (ratio === selectedPreset) {
        btn.classList.add('bg-blue-600', 'text-white');
        btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      }
    });
  }

  private applyPresetToAll(): void {
    const crop = this.getActiveCrop();
    if (!crop) return;
    const preset = crop.preset;

    this.images.forEach((item) => {
      // Update each image's active crop, or all crops in each image
      const activeC = item.crops.find((c) => c.id === item.activeCropId) || item.crops[0];
      if (activeC) {
        activeC.preset = preset;
        activeC.cropBox = calculateInitialCropBox(item.width, item.height, preset);
        activeC.width = Math.round(activeC.cropBox.width);
        activeC.height = Math.round(activeC.cropBox.height);
        activeC.thumbnailUrl = this.generateThumbnailUrl(item.img, activeC.cropBox);
      }
    });

    this.renderCanvas();
    this.renderSidebarCrops();
    this.updateActiveInfo();
    showToast(`Applied ${preset} ratio to active crop on all images`, 'success');
  }

  public async downloadSingleCrop(crop: SavedCrop, imageItem: ImageCropItem, cropNumber: number): Promise<void> {
    try {
      showToast(`Preparing Crop #${cropNumber}...`, 'info');
      const offscreen = document.createElement('canvas');
      offscreen.width = Math.max(1, Math.round(crop.cropBox.width));
      offscreen.height = Math.max(1, Math.round(crop.cropBox.height));
      const ctx = offscreen.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D canvas context');

      ctx.drawImage(
        imageItem.img,
        crop.cropBox.x,
        crop.cropBox.y,
        crop.cropBox.width,
        crop.cropBox.height,
        0,
        0,
        offscreen.width,
        offscreen.height
      );

      const ext = this.outputFormat === 'image/png' ? 'png' : this.outputFormat === 'image/webp' ? 'webp' : 'jpg';
      const outName = generateCropFilename(imageItem.name, cropNumber, ext, crop.preset);

      offscreen.toBlob(
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
        },
        this.outputFormat,
        this.outputQuality
      );
    } catch (err) {
      console.error(err);
      showToast('Error downloading crop', 'error');
    }
  }

  public async downloadCurrentPhotoZip(): Promise<void> {
    const active = this.images[this.activeImageIndex];
    if (!active || active.crops.length === 0) return;

    try {
      showToast(`Packaging ${active.crops.length} crops for ${active.name}...`, 'info');
      const zip = new JSZip();
      const ext = this.outputFormat === 'image/png' ? 'png' : this.outputFormat === 'image/webp' ? 'webp' : 'jpg';

      for (let i = 0; i < active.crops.length; i++) {
        const crop = active.crops[i];
        const fileName = generateCropFilename(active.name, i + 1, ext, crop.preset);

        const offscreen = document.createElement('canvas');
        offscreen.width = Math.max(1, Math.round(crop.cropBox.width));
        offscreen.height = Math.max(1, Math.round(crop.cropBox.height));
        const ctx = offscreen.getContext('2d')!;

        ctx.drawImage(
          active.img,
          crop.cropBox.x,
          crop.cropBox.y,
          crop.cropBox.width,
          crop.cropBox.height,
          0,
          0,
          offscreen.width,
          offscreen.height
        );

        const blob = await new Promise<Blob>((res, rej) => {
          offscreen.toBlob(
            (b) => (b ? res(b) : rej(new Error('Export failed'))),
            this.outputFormat,
            this.outputQuality
          );
        });

        zip.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      const baseName = active.name.replace(/\.[^/.]+$/, '');
      a.download = `${baseName}-crops-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(zipUrl);

      showToast(`Downloaded ZIP with ${active.crops.length} crops!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to create ZIP package', 'error');
    }
  }

  public async downloadAllZip(): Promise<void> {
    if (this.images.length === 0) return;

    if (this.progressContainer && this.progressBar && this.progressText) {
      this.progressContainer.classList.remove('hidden');
      this.progressBar.style.width = '0%';
      this.progressText.textContent = 'Packaging all configured crops...';
    }

    try {
      const zip = new JSZip();
      const ext = this.outputFormat === 'image/png' ? 'png' : this.outputFormat === 'image/webp' ? 'webp' : 'jpg';

      let totalTasks = 0;
      this.images.forEach((img) => {
        totalTasks += img.crops.length;
      });

      let completedTasks = 0;

      for (const imageItem of this.images) {
        for (let i = 0; i < imageItem.crops.length; i++) {
          const crop = imageItem.crops[i];
          const cropNumber = i + 1;
          const fileName = generateCropFilename(imageItem.name, cropNumber, ext, crop.preset);

          const offscreen = document.createElement('canvas');
          offscreen.width = Math.max(1, Math.round(crop.cropBox.width));
          offscreen.height = Math.max(1, Math.round(crop.cropBox.height));
          const ctx = offscreen.getContext('2d')!;

          ctx.drawImage(
            imageItem.img,
            crop.cropBox.x,
            crop.cropBox.y,
            crop.cropBox.width,
            crop.cropBox.height,
            0,
            0,
            offscreen.width,
            offscreen.height
          );

          const blob = await new Promise<Blob>((res, rej) => {
            offscreen.toBlob(
              (b) => (b ? res(b) : rej(new Error('Export failed'))),
              this.outputFormat,
              this.outputQuality
            );
          });

          zip.file(fileName, blob);
          completedTasks++;

          const pct = Math.round((completedTasks / totalTasks) * 100);
          if (this.progressBar && this.progressText) {
            this.progressBar.style.width = `${pct}%`;
            this.progressText.textContent = `Rendering crop ${completedTasks} of ${totalTasks} (${pct}%)...`;
          }
        }
      }

      if (this.progressText) {
        this.progressText.textContent = 'Creating ZIP file...';
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        if (this.progressBar) this.progressBar.style.width = `${metadata.percent}%`;
      });

      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `quickpic-all-crops-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(zipUrl);

      showToast(`ZIP downloaded with ${completedTasks} crops!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to create ZIP package', 'error');
    } finally {
      setTimeout(() => {
        if (this.progressContainer) this.progressContainer.classList.add('hidden');
      }, 1500);
    }
  }

  private updateUI(): void {
    const hasImages = this.images.length > 0;
    const emptyState = document.getElementById('crop-empty-state');
    const editorState = document.getElementById('crop-editor-state');

    if (emptyState && editorState) {
      if (hasImages) {
        emptyState.classList.add('hidden');
        editorState.classList.remove('hidden');
      } else {
        emptyState.classList.remove('hidden');
        editorState.classList.add('hidden');
      }
    }

    const totalCropsCount = this.images.reduce((acc, img) => acc + img.crops.length, 0);

    if (this.sidebarTotalBadge) {
      this.sidebarTotalBadge.textContent = `${totalCropsCount} crop${totalCropsCount !== 1 ? 's' : ''}`;
    }

    if (this.downloadZipBtn) {
      this.downloadZipBtn.disabled = !hasImages;
      this.downloadZipBtn.textContent = hasImages
        ? `Download All Crops as ZIP (${totalCropsCount})`
        : 'Download All Crops as ZIP';
    }

    if (this.downloadCurrentZipBtn) {
      const active = this.images[this.activeImageIndex];
      const count = active ? active.crops.length : 0;
      this.downloadCurrentZipBtn.disabled = count === 0;
      this.downloadCurrentZipBtn.textContent = `Download Current Photo's Crops (${count})`;
    }

    if (this.clearAllBtn) {
      this.clearAllBtn.disabled = !hasImages;
    }

    const activeCrop = this.getActiveCrop();
    if (activeCrop) {
      this.updateRatioButtonStyles(activeCrop.preset);
    }

    this.renderImageQueue();
    this.renderSidebarCrops();
    this.renderCanvas();
    this.updateActiveInfo();
  }

  private renderImageQueue(): void {
    if (!this.imageQueueList) return;
    this.imageQueueList.innerHTML = '';

    this.images.forEach((item, idx) => {
      const btn = document.createElement('div');
      const isActive = idx === this.activeImageIndex;
      btn.className = `relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
        isActive
          ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-md'
          : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
      }`;

      const cropsCount = item.crops.length;

      btn.innerHTML = `
        <img src="${item.url}" alt="${item.name}" class="w-full h-full object-cover" />
        <span class="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
          #${idx + 1}
        </span>
        <span class="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-xs">
          ${cropsCount} crop${cropsCount !== 1 ? 's' : ''}
        </span>
        <button type="button" data-remove-id="${item.id}" title="Remove image" class="absolute top-1 right-1 w-5 h-5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-xs shadow cursor-pointer">&times;</button>
      `;

      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.dataset.removeId) {
          e.stopPropagation();
          this.removeImage(target.dataset.removeId);
        } else {
          this.activeImageIndex = idx;
          const activeCrop = this.getActiveCrop();
          if (activeCrop) {
            this.updateRatioButtonStyles(activeCrop.preset);
          }
          this.updateUI();
        }
      });

      this.imageQueueList?.appendChild(btn);
    });
  }

  private renderSidebarCrops(): void {
    if (!this.sidebarCropsContainer) return;
    this.sidebarCropsContainer.innerHTML = '';

    const hasImages = this.images.length > 0;
    if (!hasImages) {
      this.sidebarCropsContainer.innerHTML = `
        <div class="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          Upload an image to configure crops.
        </div>
      `;
      return;
    }

    if (this.sidebarFilter === 'current') {
      const active = this.images[this.activeImageIndex];
      if (!active) return;

      if (active.crops.length === 0) {
        this.sidebarCropsContainer.innerHTML = `
          <div class="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No crops configured for this photo. Click <strong>+ Add Another Crop</strong> above.
          </div>
        `;
        return;
      }

      active.crops.forEach((crop, idx) => {
        const card = this.createCropCardElement(crop, active, idx, this.activeImageIndex);
        this.sidebarCropsContainer?.appendChild(card);
      });
    } else {
      // 'All' view: group crops by image
      this.images.forEach((imgItem, imgIdx) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'space-y-2 border-b border-slate-200 dark:border-slate-700/60 pb-3 last:border-b-0';

        const isCurrentImg = imgIdx === this.activeImageIndex;
        groupEl.innerHTML = `
          <div class="flex items-center justify-between gap-2 px-1">
            <div class="flex items-center gap-2 truncate">
              <span class="w-2 h-2 rounded-full ${isCurrentImg ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}"></span>
              <span class="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate" title="${imgItem.name}">${imgItem.name}</span>
            </div>
            <span class="text-[10px] font-mono text-slate-400 shrink-0">${imgItem.crops.length} crop${imgItem.crops.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="space-y-2"></div>
        `;

        const cardsContainer = groupEl.querySelector('.space-y-2')!;
        imgItem.crops.forEach((crop, cropIdx) => {
          const card = this.createCropCardElement(crop, imgItem, cropIdx, imgIdx);
          cardsContainer.appendChild(card);
        });

        this.sidebarCropsContainer?.appendChild(groupEl);
      });
    }
  }

  private createCropCardElement(
    crop: SavedCrop,
    imgItem: ImageCropItem,
    cropIdx: number,
    imgIdx: number
  ): HTMLElement {
    const card = document.createElement('div');
    const isSelected = imgIdx === this.activeImageIndex && crop.id === imgItem.activeCropId;
    const cropNum = cropIdx + 1;

    card.className = `p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 cursor-pointer ${
      isSelected
        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 ring-1 ring-blue-500/20 shadow-xs'
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
    }`;

    card.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0" data-action="select">
        <img src="${crop.thumbnailUrl || imgItem.url}" alt="Crop ${cropNum}" class="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0" />
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-xs text-slate-900 dark:text-white">${crop.name || `Crop #${cropNum}`}</span>
            <span class="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              ${crop.preset}
            </span>
            ${isSelected ? '<span class="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.2 rounded">Active</span>' : ''}
          </div>
          <div class="text-[11px] font-mono text-slate-500 mt-0.5">
            ${crop.width} &times; ${crop.height} px
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <button
          type="button"
          data-action="download"
          title="Download this crop"
          class="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-semibold cursor-pointer transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        </button>
        <button
          type="button"
          data-action="delete"
          title="Delete this crop"
          class="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </div>
    `;

    card.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('button');
      if (target?.dataset.action === 'download') {
        e.stopPropagation();
        this.downloadSingleCrop(crop, imgItem, cropNum);
      } else if (target?.dataset.action === 'delete') {
        e.stopPropagation();
        this.deleteCrop(crop.id, imgIdx);
      } else {
        this.selectCrop(crop.id, imgIdx);
      }
    });

    return card;
  }

  private removeImage(id: string): void {
    const idx = this.images.findIndex((img) => img.id === id);
    if (idx !== -1) {
      URL.revokeObjectURL(this.images[idx].url);
      this.images.splice(idx, 1);
      if (this.activeImageIndex >= this.images.length) {
        this.activeImageIndex = Math.max(0, this.images.length - 1);
      }
      this.updateUI();
      showToast('Image removed', 'info');
    }
  }

  private clearAll(): void {
    this.images.forEach((img) => URL.revokeObjectURL(img.url));
    this.images = [];
    this.activeImageIndex = 0;
    this.updateUI();
    showToast('All photos cleared', 'info');
  }

  private updateActiveInfo(): void {
    if (!this.activeImageInfo) return;
    const active = this.images[this.activeImageIndex];
    const crop = this.getActiveCrop();
    if (!active || !crop) {
      this.activeImageInfo.innerHTML = '';
      return;
    }

    const { width, height, name, file, crops } = active;
    this.activeImageInfo.innerHTML = `
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 dark:text-slate-400">
        <span class="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs" title="${name}">
          <strong>${name}</strong> (${formatBytes(file.size)})
        </span>
        <span class="text-slate-300 dark:text-slate-700">&bull;</span>
        <span class="font-mono text-[11px]">Orig: ${width}&times;${height}px</span>
        <span class="text-slate-300 dark:text-slate-700">&bull;</span>
        <span class="text-blue-600 dark:text-blue-400 font-bold font-mono text-[11px]">
          ${crop.name}: ${Math.round(crop.cropBox.width)}&times;${Math.round(crop.cropBox.height)}px (${crop.preset})
        </span>
        <span class="text-slate-400 text-[11px]">(${crops.length} configured crop${crops.length !== 1 ? 's' : ''})</span>
      </div>
    `;
  }

  private renderCanvas(): void {
    if (!this.canvas || !this.ctx) return;
    const active = this.images[this.activeImageIndex];
    const activeCrop = this.getActiveCrop();
    if (!active || !activeCrop) return;

    const parent = this.canvas.parentElement;
    if (!parent) return;

    const maxW = parent.clientWidth || 640;
    const maxH = 500;

    const imgW = active.width;
    const imgH = active.height;

    const scale = Math.min(maxW / imgW, maxH / imgH, 1);
    this.canvasScale = scale;

    const dispW = Math.round(imgW * scale);
    const dispH = Math.round(imgH * scale);

    this.canvas.width = dispW;
    this.canvas.height = dispH;

    // Draw base image
    this.ctx.clearRect(0, 0, dispW, dispH);
    this.ctx.drawImage(active.img, 0, 0, dispW, dispH);

    // Dim area outside active crop box
    const crop = activeCrop.cropBox;
    const cx = crop.x * scale;
    const cy = crop.y * scale;
    const cw = crop.width * scale;
    const ch = crop.height * scale;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    this.ctx.fillRect(0, 0, dispW, cy);
    this.ctx.fillRect(0, cy + ch, dispW, dispH - (cy + ch));
    this.ctx.fillRect(0, cy, cx, ch);
    this.ctx.fillRect(cx + cw, cy, dispW - (cx + cw), ch);

    // Render faint outlines of other configured crops on the same image
    active.crops.forEach((otherCrop, idx) => {
      if (otherCrop.id !== activeCrop.id) {
        const ocx = otherCrop.cropBox.x * scale;
        const ocy = otherCrop.cropBox.y * scale;
        const ocw = otherCrop.cropBox.width * scale;
        const och = otherCrop.cropBox.height * scale;

        this.ctx!.save();
        this.ctx!.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        this.ctx!.setLineDash([4, 4]);
        this.ctx!.lineWidth = 1.5;
        this.ctx!.strokeRect(ocx, ocy, ocw, och);

        // Small tag
        this.ctx!.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx!.fillRect(ocx, ocy - 16, 60, 16);
        this.ctx!.fillStyle = '#ffffff';
        this.ctx!.font = '9px sans-serif';
        this.ctx!.fillText(otherCrop.name || `Crop #${idx + 1}`, ocx + 4, ocy - 4);
        this.ctx!.restore();
      }
    });

    // Active crop border
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeRect(cx, cy, cw, ch);

    // Rule of thirds grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(cx + cw / 3, cy);
    this.ctx.lineTo(cx + cw / 3, cy + ch);
    this.ctx.moveTo(cx + (2 * cw) / 3, cy);
    this.ctx.lineTo(cx + (2 * cw) / 3, cy + ch);
    this.ctx.moveTo(cx, cy + ch / 3);
    this.ctx.lineTo(cx + cw, cy + ch / 3);
    this.ctx.moveTo(cx, cy + (2 * ch) / 3);
    this.ctx.lineTo(cx + cw, cy + (2 * ch) / 3);
    this.ctx.stroke();

    // Corner drag handles
    const handleSize = 14;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#2563eb';
    this.ctx.lineWidth = 2.5;

    const corners = [
      { x: cx, y: cy },
      { x: cx + cw, y: cy },
      { x: cx, y: cy + ch },
      { x: cx + cw, y: cy + ch },
    ];

    corners.forEach((pt) => {
      this.ctx!.fillRect(pt.x - handleSize / 2, pt.y - handleSize / 2, handleSize, handleSize);
      this.ctx!.strokeRect(pt.x - handleSize / 2, pt.y - handleSize / 2, handleSize, handleSize);
    });
  }

  // Pointer event handling for unified mouse and touch support
  private handlePointerDown(e: PointerEvent): void {
    const active = this.images[this.activeImageIndex];
    const crop = this.getActiveCrop();
    if (!active || !crop || !this.canvas) return;

    this.canvas.setPointerCapture(e.pointerId);

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scale = this.canvasScale;
    const cx = crop.cropBox.x * scale;
    const cy = crop.cropBox.y * scale;
    const cw = crop.cropBox.width * scale;
    const ch = crop.cropBox.height * scale;

    const threshold = 22; // Generous hit area for fingers on mobile

    if (Math.abs(mouseX - cx) < threshold && Math.abs(mouseY - cy) < threshold) {
      this.dragMode = 'nw';
    } else if (Math.abs(mouseX - (cx + cw)) < threshold && Math.abs(mouseY - cy) < threshold) {
      this.dragMode = 'ne';
    } else if (Math.abs(mouseX - cx) < threshold && Math.abs(mouseY - (cy + ch)) < threshold) {
      this.dragMode = 'sw';
    } else if (Math.abs(mouseX - (cx + cw)) < threshold && Math.abs(mouseY - (cy + ch)) < threshold) {
      this.dragMode = 'se';
    } else if (mouseX >= cx && mouseX <= cx + cw && mouseY >= cy && mouseY <= cy + ch) {
      this.dragMode = 'move';
    } else {
      this.dragMode = null;
      return;
    }

    this.isDragging = true;
    this.dragStartX = mouseX;
    this.dragStartY = mouseY;
    this.initialCropAtDrag = { ...crop.cropBox };
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.isDragging || !this.dragMode || !this.initialCropAtDrag || !this.canvas) return;
    const active = this.images[this.activeImageIndex];
    const crop = this.getActiveCrop();
    if (!active || !crop) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const deltaX = (mouseX - this.dragStartX) / this.canvasScale;
    const deltaY = (mouseY - this.dragStartY) / this.canvasScale;

    const init = this.initialCropAtDrag;
    const ratio = getAspectRatioValue(crop.preset);

    let newCrop: CropDimensions = { ...init };

    if (this.dragMode === 'move') {
      newCrop.x = init.x + deltaX;
      newCrop.y = init.y + deltaY;
    } else if (this.dragMode === 'se') {
      newCrop.width = Math.max(30, init.width + deltaX);
      newCrop.height = ratio ? newCrop.width / ratio : Math.max(30, init.height + deltaY);
    } else if (this.dragMode === 'sw') {
      const newWidth = Math.max(30, init.width - deltaX);
      newCrop.width = newWidth;
      newCrop.x = init.x + (init.width - newWidth);
      newCrop.height = ratio ? newWidth / ratio : Math.max(30, init.height + deltaY);
    } else if (this.dragMode === 'ne') {
      const newWidth = Math.max(30, init.width + deltaX);
      newCrop.width = newWidth;
      newCrop.height = ratio ? newWidth / ratio : Math.max(30, init.height - deltaY);
      newCrop.y = init.y + (init.height - newCrop.height);
    } else if (this.dragMode === 'nw') {
      const newWidth = Math.max(30, init.width - deltaX);
      newCrop.width = newWidth;
      newCrop.x = init.x + (init.width - newWidth);
      newCrop.height = ratio ? newWidth / ratio : Math.max(30, init.height - deltaY);
      newCrop.y = init.y + (init.height - newCrop.height);
    }

    crop.cropBox = clampCropBox(newCrop, active.width, active.height, ratio);
    crop.width = Math.round(crop.cropBox.width);
    crop.height = Math.round(crop.cropBox.height);

    this.renderCanvas();
    this.updateActiveInfo();
  }

  private handlePointerUp(e: PointerEvent): void {
    if (this.isDragging && this.canvas) {
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    if (this.isDragging) {
      const active = this.images[this.activeImageIndex];
      const crop = this.getActiveCrop();
      if (active && crop) {
        crop.thumbnailUrl = this.generateThumbnailUrl(active.img, crop.cropBox);
        this.renderSidebarCrops();
      }
    }
    this.isDragging = false;
    this.dragMode = null;
    this.initialCropAtDrag = null;
  }

  private async loadDemoPhotos(): Promise<void> {
    showToast('Loading demo photos...', 'info');

    const samples = [
      { name: 'beach-sunset.jpg', w: 1200, h: 800, title: 'Beach Sunset', colorA: '#f97316', colorB: '#0284c7' },
      { name: 'city-architecture.jpg', w: 900, h: 1200, title: 'City Skyline', colorA: '#3b82f6', colorB: '#1e1b4b' },
    ];

    for (const s of samples) {
      const c = document.createElement('canvas');
      c.width = s.w;
      c.height = s.h;
      const ctx = c.getContext('2d')!;

      const grad = ctx.createLinearGradient(0, 0, s.w, s.h);
      grad.addColorStop(0, s.colorA);
      grad.addColorStop(1, s.colorB);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, s.w, s.h);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(s.w / 2, s.h / 2, Math.min(s.w, s.h) / 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.title, s.w / 2, s.h / 2);

      const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.9));
      const file = new File([blob], s.name, { type: 'image/jpeg' });
      const item = await this.loadFileAsItem(file);
      this.images.push(item);
    }

    // Add a second crop preset to the first demo photo to show multiple configured crops immediately
    if (this.images.length > 0) {
      const first = this.images[0];
      const crop2Box = calculateInitialCropBox(first.width, first.height, '16:9');
      first.crops.push({
        id: Math.random().toString(36).substring(2, 9),
        name: 'Crop #2',
        preset: '16:9',
        cropBox: crop2Box,
        width: Math.round(crop2Box.width),
        height: Math.round(crop2Box.height),
        thumbnailUrl: this.generateThumbnailUrl(first.img, crop2Box),
      });
    }

    this.updateUI();
    showToast('Loaded sample photos with configured crops!', 'success');
  }
}

// Auto init
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BulkCropApp());
  } else {
    new BulkCropApp();
  }
}
