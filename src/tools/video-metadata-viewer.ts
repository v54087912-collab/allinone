/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateAspectRatio, estimateBitrate } from '../utils/mediaAudioUtils.ts';

export function initVideoMetadataViewer(): void {
  const fileInput = document.getElementById('video-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('video-drop-zone') as HTMLDivElement | null;
  const videoPlayer = document.getElementById('preview-player') as HTMLVideoElement | null;
  const metadataTable = document.getElementById('metadata-table') as HTMLTableElement | null;
  const snapshotCanvas = document.getElementById('snapshot-canvas') as HTMLCanvasElement | null;

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        inspectVideo(fileInput.files[0]);
      }
    });
  }

  function inspectVideo(file: File) {
    if (!videoPlayer) return;
    const url = URL.createObjectURL(file);
    videoPlayer.src = url;

    videoPlayer.onloadedmetadata = () => {
      const width = videoPlayer.videoWidth;
      const height = videoPlayer.videoHeight;
      const duration = videoPlayer.duration;
      const aspect = calculateAspectRatio(width, height);
      const bitrate = estimateBitrate(file.size, duration);

      const rows = [
        ['File Name', file.name],
        ['File Size', `${(file.size / (1024 * 1024)).toFixed(2)} MB (${file.size.toLocaleString()} bytes)`],
        ['MIME Type', file.type || 'video/mp4'],
        ['Resolution', `${width} × ${height} px`],
        ['Aspect Ratio', aspect],
        ['Duration', `${duration.toFixed(2)} seconds (${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s)`],
        ['Estimated Bitrate', bitrate],
        ['Audio Tracks Detected', (videoPlayer as any).mozHasAudio !== undefined ? ((videoPlayer as any).mozHasAudio ? 'Yes' : 'No') : 'Present in Stream']
      ];

      if (metadataTable) {
        metadataTable.innerHTML = rows
          .map(([k, v]) => `
            <tr class="border-b border-slate-200 dark:border-slate-800">
              <td class="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 text-xs">${k}</td>
              <td class="py-2.5 px-4 text-slate-900 dark:text-slate-100 font-mono text-xs">${v}</td>
            </tr>
          `)
          .join('');
      }

      // Draw poster snapshot
      videoPlayer.currentTime = Math.min(1.0, duration / 2);
    };

    videoPlayer.onseeked = () => {
      if (snapshotCanvas) {
        snapshotCanvas.width = videoPlayer.videoWidth || 320;
        snapshotCanvas.height = videoPlayer.videoHeight || 180;
        const ctx = snapshotCanvas.getContext('2d');
        if (ctx) ctx.drawImage(videoPlayer, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
      }
    };
  }
}

document.addEventListener('DOMContentLoaded', initVideoMetadataViewer);
