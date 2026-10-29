/**
 * Media Utilities for Toolora Client-Side Audio & Video Processing
 */

export interface MediaDimensions {
  width: number;
  height: number;
}

export interface AspectFitResult {
  drawX: number;
  drawY: number;
  drawWidth: number;
  drawHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Formats seconds into MM:SS or MM:SS.MS format
 */
export function formatMediaTime(seconds: number, includeMs = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');

  if (includeMs) {
    const ms = Math.floor((seconds % 1) * 10);
    return `${pad(mins)}:${pad(secs)}.${ms}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Parses MM:SS or seconds string into numeric seconds
 */
export function parseMediaTime(str: string): number {
  if (!str) return 0;
  const parts = str.trim().split(':');
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return Math.max(0, mins * 60 + secs);
  }
  const val = parseFloat(str);
  return isNaN(val) ? 0 : Math.max(0, val);
}

/**
 * Scales dimensions preserving aspect ratio under max bounds
 */
export function calculateScaledVideoDimensions(
  origW: number,
  origH: number,
  maxW: number,
  maxH: number
): MediaDimensions {
  if (origW <= 0 || origH <= 0) return { width: maxW, height: maxH };

  const ratio = origW / origH;
  let targetW = origW;
  let targetH = origH;

  if (targetW > maxW) {
    targetW = maxW;
    targetH = Math.round(targetW / ratio);
  }

  if (targetH > maxH) {
    targetH = maxH;
    targetW = Math.round(targetH * ratio);
  }

  // Ensure even dimensions for video codecs (H.264/VP8/VP9 require even width/height)
  targetW = targetW % 2 === 0 ? targetW : targetW - 1;
  targetH = targetH % 2 === 0 ? targetH : targetH - 1;

  return { width: Math.max(2, targetW), height: Math.max(2, targetH) };
}

/**
 * Computes draw coordinates to cover or contain a video/image in a target aspect ratio box
 */
export function calculateAspectFit(
  srcW: number,
  srcH: number,
  boxW: number,
  boxH: number,
  mode: 'cover' | 'contain' = 'contain'
): AspectFitResult {
  const srcRatio = srcW / srcH;
  const boxRatio = boxW / boxH;

  let drawW = boxW;
  let drawH = boxH;
  let drawX = 0;
  let drawY = 0;

  if (mode === 'contain') {
    if (srcRatio > boxRatio) {
      // Source is wider than box
      drawW = boxW;
      drawH = Math.round(boxW / srcRatio);
      drawX = 0;
      drawY = Math.round((boxH - drawH) / 2);
    } else {
      // Source is taller than box
      drawH = boxH;
      drawW = Math.round(boxH * srcRatio);
      drawX = Math.round((boxW - drawW) / 2);
      drawY = 0;
    }
  } else {
    // Cover mode
    if (srcRatio > boxRatio) {
      drawH = boxH;
      drawW = Math.round(boxH * srcRatio);
      drawX = Math.round((boxW - drawW) / 2);
      drawY = 0;
    } else {
      drawW = boxW;
      drawH = Math.round(boxW / srcRatio);
      drawX = 0;
      drawY = Math.round((boxH - drawH) / 2);
    }
  }

  return {
    drawX,
    drawY,
    drawWidth: drawW,
    drawHeight: drawH,
    canvasWidth: boxW,
    canvasHeight: boxH,
  };
}

/**
 * Generates evenly spaced timestamps across a duration for thumbnail extraction
 */
export function generateThumbnailTimestamps(duration: number, count: number): number[] {
  if (duration <= 0 || count <= 0) return [0];
  if (count === 1) return [Math.min(1, duration / 2)];

  const step = duration / (count + 1);
  const timestamps: number[] = [];
  for (let i = 1; i <= count; i++) {
    timestamps.push(Math.round(i * step * 100) / 100);
  }
  return timestamps;
}

/**
 * Converts an AudioBuffer into standard 16-bit PCM WAV binary format
 */
export function audioBufferToWav(buffer: AudioBuffer): Uint8Array {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = result.length * bytesPerSample;
  const bufferLength = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Uint8Array(arrayBuffer);
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Calculates sliced audio buffer region
 */
export function calculateSliceFrameRange(
  duration: number,
  sampleRate: number,
  startSec: number,
  endSec: number
): { startFrame: number; endFrame: number; length: number } {
  const safeStart = Math.max(0, Math.min(startSec, duration));
  const safeEnd = Math.max(safeStart, Math.min(endSec, duration));

  const startFrame = Math.floor(safeStart * sampleRate);
  const endFrame = Math.floor(safeEnd * sampleRate);
  const length = Math.max(1, endFrame - startFrame);

  return { startFrame, endFrame, length };
}

/**
 * Pure TypeScript animated GIF encoder (GIF89a)
 * Compresses frame pixel data into compliant GIF byte stream.
 */
export function createSimpleGif(
  width: number,
  height: number,
  frames: Uint8ClampedArray[],
  delayMs: number
): Uint8Array {
  const bytes: number[] = [];
  const delay100ths = Math.max(1, Math.round(delayMs / 10));

  // GIF89a Header
  const header = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]; // 'GIF89a'
  bytes.push(...header);

  // Logical Screen Descriptor (width, height, color resolution)
  bytes.push(width & 0xff, (width >> 8) & 0xff);
  bytes.push(height & 0xff, (height >> 8) & 0xff);
  // Packed field: Global Color Table Flag = 1, 8 bits/pixel, 256 colors
  bytes.push(0xf7, 0x00, 0x00);

  // Global Color Table (Standard 256-color RGB palette: 6x6x6 web safe + gray ramp)
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        bytes.push(r * 51, g * 51, b * 51);
      }
    }
  }
  // Fill remaining 40 palette slots with grayscale
  for (let i = 0; i < 40; i++) {
    const val = Math.min(255, Math.floor((i * 255) / 39));
    bytes.push(val, val, val);
  }

  // Netscape 2.0 Application Extension (Infinite loop)
  bytes.push(0x21, 0xff, 0x0b);
  const netscape = 'NETSCAPE2.0';
  for (let i = 0; i < netscape.length; i++) bytes.push(netscape.charCodeAt(i));
  bytes.push(0x03, 0x01, 0x00, 0x00, 0x00);

  // Write Frames
  for (const frameData of frames) {
    // Graphic Control Extension (Delay & disposal)
    bytes.push(0x21, 0xf9, 0x04, 0x04);
    bytes.push(delay100ths & 0xff, (delay100ths >> 8) & 0xff);
    bytes.push(0x00, 0x00);

    // Image Descriptor
    bytes.push(0x2c, 0x00, 0x00, 0x00, 0x00);
    bytes.push(width & 0xff, (width >> 8) & 0xff);
    bytes.push(height & 0xff, (height >> 8) & 0xff);
    bytes.push(0x00); // No local color table

    // Quantize RGBA to 256-color palette indices
    const pixelCount = width * height;
    const indexedPixels = new Uint8Array(pixelCount);
    for (let i = 0; i < pixelCount; i++) {
      const pi = i * 4;
      const r = frameData[pi];
      const g = frameData[pi + 1];
      const b = frameData[pi + 2];
      // Map to 6x6x6 web safe palette
      const ri = Math.min(5, Math.floor((r + 25) / 51));
      const gi = Math.min(5, Math.floor((g + 25) / 51));
      const bi = Math.min(5, Math.floor((b + 25) / 51));
      indexedPixels[i] = ri * 36 + gi * 6 + bi;
    }

    // Uncompressed LZW-like raster data sub-blocks
    bytes.push(0x08); // LZW minimum code size (8 bits)
    encodeRasterSubBlocks(indexedPixels, bytes);
    bytes.push(0x00); // Block terminator
  }

  // GIF Trailer
  bytes.push(0x3b);
  return new Uint8Array(bytes);
}

function encodeRasterSubBlocks(pixels: Uint8Array, output: number[]): void {
  // Clear Code = 256, End of Information = 257
  const clearCode = 256;
  const eoiCode = 257;

  let bitBuffer = 0;
  let bitCount = 0;
  let curCodeSize = 9;
  let nextCode = 258;
  const subBlock: number[] = [];

  const writeBits = (val: number, bits: number) => {
    bitBuffer |= val << bitCount;
    bitCount += bits;
    while (bitCount >= 8) {
      subBlock.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitCount -= 8;
      if (subBlock.length === 254) {
        output.push(subBlock.length, ...subBlock);
        subBlock.length = 0;
      }
    }
  };

  writeBits(clearCode, curCodeSize);
  for (let i = 0; i < pixels.length; i++) {
    writeBits(pixels[i], curCodeSize);
    nextCode++;
    if (nextCode === 512) {
      writeBits(clearCode, curCodeSize);
      nextCode = 258;
      curCodeSize = 9;
    }
  }
  writeBits(eoiCode, curCodeSize);

  if (bitCount > 0) {
    subBlock.push(bitBuffer & 0xff);
  }
  if (subBlock.length > 0) {
    output.push(subBlock.length, ...subBlock);
  }
}
