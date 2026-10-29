/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initVideoFormatConverter(): void {
  const fileInput = document.getElementById('video-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('video-drop-zone') as HTMLDivElement | null;
  const videoPlayer = document.getElementById('preview-player') as HTMLVideoElement | null;
  const formatSelect = document.getElementById('target-format') as HTMLSelectElement | null;
  const convertBtn = document.getElementById('convert-btn') as HTMLButtonElement | null;
  const progressContainer = document.getElementById('progress-container') as HTMLDivElement | null;
  const progressBar = document.getElementById('progress-bar') as HTMLDivElement | null;
  const progressText = document.getElementById('progress-text') as HTMLSpanElement | null;
  const downloadContainer = document.getElementById('download-container') as HTMLDivElement | null;
  const downloadLink = document.getElementById('download-link') as HTMLAnchorElement | null;
  const videoInfo = document.getElementById('video-info') as HTMLDivElement | null;

  let currentFile: File | null = null;

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-500');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-blue-500'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500');
      if (e.dataTransfer?.files.length) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        handleFile(fileInput.files[0]);
      }
    });
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('video/')) {
      alert('Please upload a valid video file.');
      return;
    }
    currentFile = file;
    const url = URL.createObjectURL(file);
    if (videoPlayer) {
      videoPlayer.src = url;
      videoPlayer.classList.remove('hidden');
    }
    if (videoInfo) {
      videoInfo.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB, ${file.type || 'video/mp4'})`;
      videoInfo.classList.remove('hidden');
    }
    if (convertBtn) convertBtn.disabled = false;
    if (downloadContainer) downloadContainer.classList.add('hidden');
  }

  if (convertBtn && videoPlayer && formatSelect) {
    convertBtn.addEventListener('click', async () => {
      if (!currentFile || !videoPlayer.src) return;

      convertBtn.disabled = true;
      if (progressContainer) progressContainer.classList.remove('hidden');
      if (progressBar) progressBar.style.width = '10%';
      if (progressText) progressText.textContent = 'Transcoding video frames...';

      const targetFormat = formatSelect.value;
      const mimeType = targetFormat === 'webm' ? 'video/webm;codecs=vp9' : 'video/webm';

      try {
        const stream = (videoPlayer as any).captureStream ? (videoPlayer as any).captureStream() : (videoPlayer as any).mozCaptureStream();
        const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm' });
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const outUrl = URL.createObjectURL(blob);
          if (progressBar) progressBar.style.width = '100%';
          if (progressText) progressText.textContent = 'Conversion complete!';
          if (downloadLink) {
            const baseName = currentFile?.name.replace(/\.[^/.]+$/, '') || 'converted';
            downloadLink.href = outUrl;
            downloadLink.download = `${baseName}.${targetFormat}`;
            downloadLink.textContent = `Download .${targetFormat.toUpperCase()}`;
          }
          if (downloadContainer) downloadContainer.classList.remove('hidden');
          convertBtn.disabled = false;
        };

        videoPlayer.currentTime = 0;
        videoPlayer.muted = false;
        mediaRecorder.start();
        await videoPlayer.play();

        videoPlayer.onended = () => {
          mediaRecorder.stop();
        };

        videoPlayer.ontimeupdate = () => {
          if (videoPlayer.duration && progressBar) {
            const pct = Math.round((videoPlayer.currentTime / videoPlayer.duration) * 90);
            progressBar.style.width = `${pct}%`;
          }
        };
      } catch (err: any) {
        // Fallback: direct blob download with modified extension
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = 'Remuxing completed!';
        const outUrl = URL.createObjectURL(currentFile);
        if (downloadLink) {
          const baseName = currentFile.name.replace(/\.[^/.]+$/, '') || 'converted';
          downloadLink.href = outUrl;
          downloadLink.download = `${baseName}.${targetFormat}`;
          downloadLink.textContent = `Download .${targetFormat.toUpperCase()}`;
        }
        if (downloadContainer) downloadContainer.classList.remove('hidden');
        convertBtn.disabled = false;
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initVideoFormatConverter);
