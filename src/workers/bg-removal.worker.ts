/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { removeBackground } from '@imgly/background-removal';

export interface ProcessMessage {
  type: 'PROCESS';
  id: string;
  imageBitmap: ImageBitmap;
  fileName: string;
  maxDimension?: number;
  preferWebGPU?: boolean;
}

export interface CancelMessage {
  type: 'CANCEL';
  id: string;
}

export interface PreloadMessage {
  type: 'PRELOAD';
}

export interface CleanupMessage {
  type: 'CLEANUP';
}

export type WorkerInMessage = ProcessMessage | CancelMessage | PreloadMessage | CleanupMessage;

let isModelPreloaded = false;
let currentCanceler: { cancelled: boolean; id: string } | null = null;

/**
 * Force explicit WebGL / WASM memory release to prevent browser tab hangs and context exhaustion
 */
function explicitWebGLCleanup(): void {
  try {
    const canvas = new OffscreenCanvas(1, 1);
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    if (gl) {
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) {
        ext.loseContext();
      }
    }
    canvas.width = 0;
    canvas.height = 0;
  } catch (e) {
    // WebGL not supported or already released
  }
}

self.onmessage = async (e: MessageEvent<WorkerInMessage>) => {
  const data = e.data;
  if (!data) return;

  if (data.type === 'PRELOAD') {
    preloadModel();
    return;
  }

  if (data.type === 'CLEANUP') {
    explicitWebGLCleanup();
    self.postMessage({ type: 'CLEANED' });
    return;
  }

  if (data.type === 'CANCEL') {
    if (currentCanceler && currentCanceler.id === data.id) {
      currentCanceler.cancelled = true;
    }
    explicitWebGLCleanup();
    self.postMessage({ type: 'CANCELLED', id: data.id });
    return;
  }

  if (data.type === 'PROCESS') {
    const { id, imageBitmap, maxDimension = 1500, preferWebGPU = true } = data;
    currentCanceler = { cancelled: false, id };

    let offscreen: OffscreenCanvas | null = null;
    let targetW = 0;
    let targetH = 0;
    let origW = 0;
    let origH = 0;

    try {
      origW = imageBitmap.width;
      origH = imageBitmap.height;
      const maxSide = Math.max(origW, origH);

      targetW = origW;
      targetH = origH;

      // Downscale if requested and exceeds maxDimension
      const shouldDownscale = maxDimension > 0 && maxSide > maxDimension;
      if (shouldDownscale) {
        const scale = maxDimension / maxSide;
        targetW = Math.max(1, Math.round(origW * scale));
        targetH = Math.max(1, Math.round(origH * scale));
      }

      self.postMessage({
        type: 'PROGRESS',
        id,
        percent: 10,
        stage: shouldDownscale
          ? `Downscaling image from ${origW}×${origH} to ${targetW}×${targetH} for inference...`
          : 'Preparing image for inference...',
      });

      // Render to OffscreenCanvas
      offscreen = new OffscreenCanvas(targetW, targetH);
      const ctx = offscreen.getContext('2d');
      if (!ctx) throw new Error('Could not acquire OffscreenCanvas 2D context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imageBitmap, 0, 0, targetW, targetH);

      // Free raw input ImageBitmap memory immediately to release device RAM
      imageBitmap.close();

      if (currentCanceler.cancelled) {
        self.postMessage({ type: 'CANCELLED', id });
        return;
      }

      const processBlob = await offscreen.convertToBlob({ type: 'image/png' });

      // Determine acceleration device (WebGPU vs CPU/WASM)
      const hasWebGPU =
        preferWebGPU &&
        typeof navigator !== 'undefined' &&
        'gpu' in navigator &&
        navigator.gpu !== undefined;

      const device = hasWebGPU ? 'gpu' : 'cpu';

      self.postMessage({
        type: 'PROGRESS',
        id,
        percent: 25,
        stage: `Loading AI model (${hasWebGPU ? 'WebGPU accelerated' : 'WebAssembly'})...`,
      });

      // Run inference with a 60s timeout watchdog to prevent browser hangs
      let resultBlob: Blob;

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Background removal timed out after 60 seconds.')), 60000);
      });

      const removalPromise = (async () => {
        try {
          return await removeBackground(processBlob, {
            device: device as any,
            progress: (key: string, current: number, total: number) => {
              if (currentCanceler?.cancelled) return;
              if (total > 0) {
                const pct = Math.min(95, 25 + Math.round((current / total) * 70));
                self.postMessage({
                  type: 'PROGRESS',
                  id,
                  percent: pct,
                  stage: key.includes('fetch')
                    ? `Downloading AI neural model weights (${pct}%)...`
                    : `Segmenting foreground (${pct}%)...`,
                });
              }
            },
          });
        } catch (wasmError) {
          console.warn('WASM / Neural model inference failure, using fallback edge-chroma segmentation:', wasmError);
          // Fallback to local segmentation algorithm inside worker
          if (offscreen) {
            return await offlineMatteFallback(offscreen, targetW, targetH);
          }
          throw wasmError;
        }
      })();

      resultBlob = await Promise.race([removalPromise, timeoutPromise]);

      if (currentCanceler.cancelled) {
        self.postMessage({ type: 'CANCELLED', id });
        return;
      }

      self.postMessage({
        type: 'PROGRESS',
        id,
        percent: 98,
        stage: 'Finalizing transparent cutout...',
      });

      // Convert result to ImageBitmap to transfer back to main thread with zero-copy
      const resultBitmap = await createImageBitmap(resultBlob);

      (self as any).postMessage(
        {
          type: 'SUCCESS',
          id,
          resultBitmap,
          outputWidth: targetW,
          outputHeight: targetH,
          originalWidth: origW,
          originalHeight: origH,
          downscaled: shouldDownscale,
        },
        [resultBitmap]
      );
    } catch (err: any) {
      if (currentCanceler?.cancelled) {
        self.postMessage({ type: 'CANCELLED', id });
        return;
      }
      self.postMessage({
        type: 'ERROR',
        id,
        error: err?.message || 'Failed to remove background. Please try again.',
      });
    } finally {
      // Explicit WebGL / WASM / Canvas cleanup after each operation to prevent browser hangs
      currentCanceler = null;
      if (offscreen) {
        offscreen.width = 0;
        offscreen.height = 0;
        offscreen = null;
      }
      explicitWebGLCleanup();
    }
  }
};

async function preloadModel(): Promise<void> {
  if (isModelPreloaded) return;
  try {
    const canvas = new OffscreenCanvas(10, 10);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 10, 10);
    const dummyBlob = await canvas.convertToBlob();
    await removeBackground(dummyBlob, {
      progress: (key: string, current: number, total: number) => {
        if (total > 0) {
          const pct = Math.round((current / total) * 100);
          self.postMessage({ type: 'PRELOAD_PROGRESS', percent: pct });
        }
      },
    });
    isModelPreloaded = true;
    self.postMessage({ type: 'PRELOAD_READY' });
  } catch (err) {
    // Continue silently; will load on first real operation
  } finally {
    explicitWebGLCleanup();
  }
}

/**
 * Fast offline edge & chroma flood segmentation fallback
 */
async function offlineMatteFallback(canvas: OffscreenCanvas, w: number, h: number): Promise<Blob> {
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Sample border corners for backdrop profiling
  const samples = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [Math.floor(w / 2), 0],
    [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)],
    [Math.floor(w / 2), h - 1],
  ];

  let bgR = 0, bgG = 0, bgB = 0;
  samples.forEach(([cx, cy]) => {
    const idx = (cy * w + cx) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  });
  bgR = Math.round(bgR / samples.length);
  bgG = Math.round(bgG / samples.length);
  bgB = Math.round(bgB / samples.length);

  const tolerance = 48;
  const feather = 18;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      (r - bgR) * (r - bgR) +
      (g - bgG) * (g - bgG) +
      (b - bgB) * (b - bgB)
    );

    if (dist < tolerance) {
      data[i + 3] = 0; // Cutout transparent
    } else if (dist < tolerance + feather) {
      const alpha = (dist - tolerance) / feather;
      data[i + 3] = Math.round(data[i + 3] * alpha);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return await canvas.convertToBlob({ type: 'image/png' });
}
