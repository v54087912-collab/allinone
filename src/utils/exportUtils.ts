import JSZip from 'jszip';
import { BackgroundRemovalConfig, CropRect } from '../types/crop';
import { applyWhiteRemoval } from './colorProcessing';
import { generateUniqueFilenames } from './cropMath';

/**
 * Extracts a crop from a source image element onto an offscreen canvas.
 * Preserves original pixel resolution.
 */
export function cropToCanvas(
  image: HTMLImageElement,
  crop: CropRect,
  bgRemoval?: BackgroundRemovalConfig
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = Math.max(1, Math.round(crop.width));
  const height = Math.max(1, Math.round(crop.height));

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  // Draw source image clipped to crop rectangle
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    width,
    height,
    0,
    0,
    width,
    height
  );

  // If white background removal is enabled, apply pixel processing
  if (bgRemoval && bgRemoval.enabled) {
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      applyWhiteRemoval(imgData, {
        tolerance: bgRemoval.tolerance,
        mode: bgRemoval.mode,
      });
      ctx.putImageData(imgData, 0, 0);
    } catch {
      // Ignore security/canvas access errors if any
    }
  }

  return canvas;
}

/**
 * Generates a thumbnail data URL for fast gallery preview.
 */
export function generateCropThumbnail(
  image: HTMLImageElement,
  crop: CropRect,
  maxThumbDim = 160,
  bgRemoval?: BackgroundRemovalConfig
): string {
  const canvas = cropToCanvas(image, crop, bgRemoval);
  const w = canvas.width;
  const h = canvas.height;

  // Scale down for thumbnail if needed
  if (w <= maxThumbDim && h <= maxThumbDim) {
    return canvas.toDataURL('image/png');
  }

  const thumbCanvas = document.createElement('canvas');
  const scale = Math.min(maxThumbDim / w, maxThumbDim / h);
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));

  thumbCanvas.width = tw;
  thumbCanvas.height = th;

  const tctx = thumbCanvas.getContext('2d');
  if (tctx) {
    tctx.imageSmoothingEnabled = true;
    tctx.imageSmoothingQuality = 'medium';
    tctx.drawImage(canvas, 0, 0, tw, th);
    return thumbCanvas.toDataURL('image/png');
  }

  return canvas.toDataURL('image/png');
}

/**
 * Triggers a browser download of a given blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Exports a single crop as a standalone PNG file.
 */
export function exportSingleCropPng(
  image: HTMLImageElement,
  crop: CropRect,
  filename: string,
  bgRemoval?: BackgroundRemovalConfig
): Promise<void> {
  return new Promise((resolve, reject) => {
    const canvas = cropToCanvas(image, crop, bgRemoval);
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas to blob conversion failed'));
        return;
      }
      downloadBlob(blob, filename.endsWith('.png') ? filename : `${filename}.png`);
      resolve();
    }, 'image/png');
  });
}

/**
 * Bundles multiple crops into a ZIP file with custom names and exact pixel dimensions.
 */
export async function createZipArchive(
  image: HTMLImageElement,
  crops: CropRect[],
  bgRemoval: BackgroundRemovalConfig,
  onProgress?: (current: number, total: number, currentName: string) => void
): Promise<Blob> {
  const zip = new JSZip();
  const filenameMap = generateUniqueFilenames(crops);
  const total = crops.length;

  for (let i = 0; i < total; i++) {
    const crop = crops[i];
    const filename = filenameMap.get(crop.id) || `asset_${String(i + 1).padStart(3, '0')}.png`;

    if (onProgress) {
      onProgress(i + 1, total, filename);
    }

    const canvas = cropToCanvas(image, crop, bgRemoval);

    // Convert canvas to ArrayBuffer
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );

    if (blob) {
      const buffer = await blob.arrayBuffer();
      zip.file(filename, buffer);
    }
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return zipBlob;
}
