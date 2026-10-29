/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initVideoMuter(): void {
  const fileInput = document.getElementById('video-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('video-drop-zone') as HTMLDivElement | null;
  const videoPlayer = document.getElementById('preview-player') as HTMLVideoElement | null;
  const muteBtn = document.getElementById('mute-btn') as HTMLButtonElement | null;
  const downloadContainer = document.getElementById('download-container') as HTMLDivElement | null;
  const downloadLink = document.getElementById('download-link') as HTMLAnchorElement | null;
  const videoInfo = document.getElementById('video-info') as HTMLDivElement | null;

  let currentFile: File | null = null;

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        currentFile = fileInput.files[0];
        if (videoPlayer) {
          videoPlayer.src = URL.createObjectURL(currentFile);
          videoPlayer.classList.remove('hidden');
        }
        if (videoInfo) {
          videoInfo.textContent = `${currentFile.name} (${(currentFile.size / (1024 * 1024)).toFixed(2)} MB)`;
          videoInfo.classList.remove('hidden');
        }
        if (muteBtn) muteBtn.disabled = false;
      }
    });
  }

  if (muteBtn && videoPlayer) {
    muteBtn.addEventListener('click', async () => {
      if (!currentFile || !videoPlayer.src) return;

      muteBtn.disabled = true;
      muteBtn.textContent = 'Stripping Audio Track...';

      try {
        const stream = (videoPlayer as any).captureStream ? (videoPlayer as any).captureStream() : (videoPlayer as any).mozCaptureStream();
        // Remove all audio tracks from the stream
        stream.getAudioTracks().forEach((track: MediaStreamTrack) => stream.removeTrack(track));

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const outUrl = URL.createObjectURL(blob);
          if (downloadLink) {
            const baseName = currentFile?.name.replace(/\.[^/.]+$/, '') || 'muted_video';
            downloadLink.href = outUrl;
            downloadLink.download = `${baseName}_muted.webm`;
            downloadLink.textContent = `Download Muted Video (${(blob.size / (1024 * 1024)).toFixed(2)} MB)`;
          }
          if (downloadContainer) downloadContainer.classList.remove('hidden');
          muteBtn.disabled = false;
          muteBtn.textContent = 'Mute Video & Export';
        };

        videoPlayer.currentTime = 0;
        videoPlayer.muted = true;
        mediaRecorder.start();
        await videoPlayer.play();

        videoPlayer.onended = () => {
          mediaRecorder.stop();
        };
      } catch (err: any) {
        alert('Could not strip audio track: ' + (err.message || 'Browser not supported'));
        muteBtn.disabled = false;
        muteBtn.textContent = 'Mute Video & Export';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initVideoMuter);
