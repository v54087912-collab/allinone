import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

export function initGifToMp4(): void {
  const dropzone = document.getElementById('g2v-dropzone');
  const fileInput = document.getElementById('g2v-file-input') as HTMLInputElement | null;
  const workspace = document.getElementById('g2v-workspace');
  const gifPreview = document.getElementById('g2v-gif-preview') as HTMLImageElement | null;
  const fileNameEl = document.getElementById('g2v-file-name');
  const fileSizeEl = document.getElementById('g2v-file-size');

  const loopSelect = document.getElementById('g2v-loop') as HTMLSelectElement | null;
  const convertBtn = document.getElementById('g2v-convert-btn') as HTMLButtonElement | null;

  const progressWrap = document.getElementById('g2v-progress-wrap');
  const progressBar = document.getElementById('g2v-progress-bar');
  const progressText = document.getElementById('g2v-progress-text');

  const resultCard = document.getElementById('g2v-result-card');
  const resultVideo = document.getElementById('g2v-video-preview') as HTMLVideoElement | null;
  const videoSizeEl = document.getElementById('g2v-video-size');
  const downloadBtn = document.getElementById('g2v-download-btn') as HTMLButtonElement | null;

  let originalFile: File | null = null;
  let convertedVideoBlob: Blob | null = null;

  function loadGif(file: File) {
    originalFile = file;
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileSizeEl) fileSizeEl.textContent = formatBytes(file.size);

    const url = URL.createObjectURL(file);
    if (gifPreview) {
      gifPreview.src = url;
      const reveal = () => {
        if (workspace) workspace.classList.remove('hidden');
        if (resultCard) resultCard.classList.add('hidden');
        if (convertBtn) convertBtn.removeAttribute('disabled');
        showToast('GIF loaded! Choose loop count and convert to video', 'success');
      };

      if (gifPreview.complete && gifPreview.naturalWidth > 0) {
        reveal();
      } else {
        gifPreview.onload = reveal;
        // Fallback safety timeout
        setTimeout(reveal, 200);
      }
    }
  }

  // Click on dropzone opens file picker
  dropzone?.addEventListener('click', (e) => {
    if (e.target !== fileInput) {
      fileInput?.click();
    }
  });

  fileInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      loadGif(file);
      fileInput.value = '';
    }
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-cyan-500');
  });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('border-cyan-500'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-cyan-500');
    const file = e.dataTransfer?.files[0];
    if (file) loadGif(file);
  });

  convertBtn?.addEventListener('click', async () => {
    if (!originalFile) return;

    const loops = parseInt(loopSelect?.value || '2', 10);
    const origW = gifPreview?.naturalWidth || 400;
    const origH = gifPreview?.naturalHeight || 400;

    // Ensure even dimensions for H.264/WebM video codecs
    const canvasW = origW % 2 === 0 ? origW : origW + 1;
    const canvasH = origH % 2 === 0 ? origH : origH + 1;

    if (progressWrap) progressWrap.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '15%';
    if (progressText) progressText.textContent = 'Decoding animated GIF frames...';

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mime = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) {
      mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mime = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
      mime = 'video/webm; codecs=vp9';
    }

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 3000000 });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      convertedVideoBlob = new Blob(chunks, { type: mime });
      if (resultVideo) resultVideo.src = URL.createObjectURL(convertedVideoBlob);
      if (videoSizeEl) videoSizeEl.textContent = formatBytes(convertedVideoBlob.size);

      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = 'Conversion complete!';
      setTimeout(() => {
        if (progressWrap) progressWrap.classList.add('hidden');
      }, 500);

      if (resultCard) resultCard.classList.remove('hidden');
      showToast('GIF successfully converted to video!', 'success');
    };

    recorder.start();

    // Check if ImageDecoder is supported (Chrome/Edge/Modern browsers)
    if (typeof (window as any).ImageDecoder !== 'undefined') {
      try {
        const decoder = new (window as any).ImageDecoder({
          data: originalFile.stream(),
          type: 'image/gif',
        });
        await decoder.tracks.ready;
        const frameCount = decoder.tracks.selectedTrack.frameCount || 1;

        const decodedFrames: { image: any; durationMs: number }[] = [];
        for (let i = 0; i < frameCount; i++) {
          const frame = await decoder.decode({ frameIndex: i });
          const dur = (frame.image.duration || 100000) / 1000; // microseconds to ms
          decodedFrames.push({ image: frame.image, durationMs: Math.max(20, dur) });
        }

        const totalGifFrames = decodedFrames.length * loops;
        let drawnCount = 0;

        for (let l = 0; l < loops; l++) {
          for (const item of decodedFrames) {
            ctx.clearRect(0, 0, canvasW, canvasH);
            ctx.drawImage(item.image, 0, 0, canvasW, canvasH);
            drawnCount++;

            const pct = Math.min(95, Math.round((drawnCount / totalGifFrames) * 90) + 5);
            if (progressBar) progressBar.style.width = `${pct}%`;
            if (progressText) progressText.textContent = `Rendering video frames... (${drawnCount}/${totalGifFrames})`;

            await new Promise((r) => setTimeout(r, item.durationMs));
          }
        }

        if (recorder.state === 'recording') recorder.stop();
        return;
      } catch (e) {
        console.warn('ImageDecoder failed, using animated canvas fallback', e);
      }
    }

    // Fallback: Animate using image element capture loop
    const totalMs = loops * 3000;
    const start = performance.now();

    const drawFallback = (now: number) => {
      const elapsed = now - start;
      if (gifPreview) {
        ctx.drawImage(gifPreview, 0, 0, canvasW, canvasH);
      }

      const pct = Math.min(95, Math.round((elapsed / totalMs) * 90) + 5);
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressText) progressText.textContent = `Converting GIF to video... ${pct}%`;

      if (elapsed < totalMs) {
        requestAnimationFrame(drawFallback);
      } else {
        if (recorder.state === 'recording') recorder.stop();
      }
    };
    requestAnimationFrame(drawFallback);
  });

  downloadBtn?.addEventListener('click', () => {
    if (!convertedVideoBlob || !originalFile) return;
    const isMp4 = convertedVideoBlob.type.includes('mp4');
    const ext = isMp4 ? 'mp4' : 'webm';
    const base = originalFile.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(convertedVideoBlob);
    a.download = `${base}.${ext}`;
    a.click();
    showToast(`Video downloaded as .${ext}!`, 'success');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGifToMp4);
} else {
  initGifToMp4();
}
