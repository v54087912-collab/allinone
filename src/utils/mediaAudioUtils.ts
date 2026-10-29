/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// 1. Subtitle Parser & Converter (SRT, VTT, ASS, CSV, JSON, TXT)
// ==========================================

export interface SubtitleCue {
  id?: number | string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

export function formatSecondsToSrtTime(sec: number): string {
  const s = Math.max(0, sec);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = Math.floor(s % 60);
  const ms = Math.floor((s - Math.floor(s)) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

export function formatSecondsToVttTime(sec: number): string {
  const s = Math.max(0, sec);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = Math.floor(s % 60);
  const ms = Math.floor((s - Math.floor(s)) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function parseSrtTimeToSeconds(timeStr: string): number {
  const parts = timeStr.trim().replace(',', '.').split(':');
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
  } else if (parts.length === 2) {
    const [m, s] = parts;
    return parseFloat(m) * 60 + parseFloat(s);
  }
  return 0;
}

export function parseSubtitles(content: string, format?: 'srt' | 'vtt'): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    // Filter out WEBVTT header
    if (lines[0].toUpperCase().startsWith('WEBVTT')) continue;

    let timeLineIdx = 0;
    if (!lines[0].includes('-->') && lines.length > 1 && lines[1].includes('-->')) {
      timeLineIdx = 1;
    }

    if (!lines[timeLineIdx] || !lines[timeLineIdx].includes('-->')) continue;

    const [startStr, endStr] = lines[timeLineIdx].split('-->').map(s => s.trim().split(' ')[0]);
    const startTime = parseSrtTimeToSeconds(startStr);
    const endTime = parseSrtTimeToSeconds(endStr);
    const text = lines.slice(timeLineIdx + 1).join('\n');

    if (text) {
      cues.push({
        id: cues.length + 1,
        startTime,
        endTime,
        text
      });
    }
  }

  return cues;
}

export function convertSubtitles(
  cues: SubtitleCue[],
  targetFormat: 'srt' | 'vtt' | 'ass' | 'csv' | 'json' | 'txt',
  offsetSeconds: number = 0
): string {
  const shifted = cues.map(c => ({
    ...c,
    startTime: Math.max(0, c.startTime + offsetSeconds),
    endTime: Math.max(0, c.endTime + offsetSeconds)
  }));

  switch (targetFormat) {
    case 'srt':
      return shifted
        .map((c, idx) => `${idx + 1}\n${formatSecondsToSrtTime(c.startTime)} --> ${formatSecondsToSrtTime(c.endTime)}\n${c.text}\n`)
        .join('\n');

    case 'vtt':
      return `WEBVTT\n\n` + shifted
        .map((c, idx) => `${idx + 1}\n${formatSecondsToVttTime(c.startTime)} --> ${formatSecondsToVttTime(c.endTime)}\n${c.text}\n`)
        .join('\n');

    case 'ass':
      let ass = `[Script Info]\nTitle: Converted Subtitles\nScriptType: v4.00+\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
      for (const c of shifted) {
        const sTime = formatSecondsToSrtTime(c.startTime).replace(',', '.').slice(1);
        const eTime = formatSecondsToSrtTime(c.endTime).replace(',', '.').slice(1);
        ass += `Dialogue: 0,${sTime},${eTime},Default,,0,0,0,,${c.text.replace(/\n/g, '\\N')}\n`;
      }
      return ass;

    case 'csv':
      const rows = ['"ID","Start Time (s)","End Time (s)","Text"'];
      for (const c of shifted) {
        rows.push(`"${c.id}","${c.startTime.toFixed(3)}","${c.endTime.toFixed(3)}","${c.text.replace(/"/g, '""')}"`);
      }
      return rows.join('\n');

    case 'json':
      return JSON.stringify(shifted, null, 2);

    case 'txt':
      return shifted.map(c => c.text).join('\n\n');

    default:
      return '';
  }
}

// ==========================================
// 2. Audio Waveform Peak Generator
// ==========================================

export function extractWaveformPeaks(
  channelData: Float32Array,
  numBuckets: number = 100
): number[] {
  const bucketSize = Math.floor(channelData.length / numBuckets);
  if (bucketSize <= 0) return new Array(numBuckets).fill(0.5);

  const peaks: number[] = [];
  for (let i = 0; i < numBuckets; i++) {
    const start = i * bucketSize;
    let max = 0;
    for (let j = 0; j < bucketSize; j++) {
      const val = Math.abs(channelData[start + j] || 0);
      if (val > max) max = val;
    }
    // Clamp to 0..1
    peaks.push(Number(Math.min(1, Math.max(0.02, max)).toFixed(3)));
  }

  return peaks;
}

// ==========================================
// 3. Client-Side WAV Encoder (16-bit PCM)
// ==========================================

export function encodeWavBlob(
  audioBuffers: Float32Array[],
  sampleRate: number,
  numChannels: number = 1
): Blob {
  const totalLength = audioBuffers.reduce((acc, b) => acc + b.length, 0);
  const buffer = new ArrayBuffer(44 + totalLength * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalLength * 2, true);
  writeString(8, 'WAVE');

  // fmt Subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true);              // BlockAlign
  view.setUint16(34, 16, true);                           // BitsPerSample

  // data Subchunk
  writeString(36, 'data');
  view.setUint32(40, totalLength * 2, true);

  // Write PCM audio samples
  let offset = 44;
  for (const b of audioBuffers) {
    for (let i = 0; i < b.length; i++) {
      const s = Math.max(-1, Math.min(1, b[i]));
      const val = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(offset, val, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// ==========================================
// 4. Video & Audio Metadata Helpers
// ==========================================

export function calculateAspectRatio(width: number, height: number): string {
  if (!width || !height) return 'N/A';
  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }
  const divisor = gcd(width, height);
  const rW = width / divisor;
  const rH = height / divisor;
  if ((rW === 16 && rH === 9) || (rW === 4 && rH === 3) || (rW === 1 && rH === 1) || (rW === 9 && rH === 16)) {
    return `${rW}:${rH}`;
  }
  // Decimal ratio fallback
  return `${(width / height).toFixed(2)}:1`;
}

export function estimateBitrate(fileSizeBytes: number, durationSeconds: number): string {
  if (durationSeconds <= 0 || fileSizeBytes <= 0) return 'N/A';
  const totalBits = fileSizeBytes * 8;
  const bps = totalBits / durationSeconds;
  if (bps > 1_000_000) {
    return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  }
  return `${(bps / 1000).toFixed(0)} kbps`;
}
