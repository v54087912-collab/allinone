import JSZip from 'jszip';
import { SOCIAL_MEDIA_PRESETS, SocialPreset } from '../utils/designUtils.ts';
import { formatMediaTime } from '../utils/mediaUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initSocialResizer(): void {
  const fileInput = document.getElementById('sr-file-input') as HTMLInputElement | null;
  const dropzone = document.getElementById('sr-dropzone');
  const fitSelect = document.getElementById('sr-fit-mode') as HTMLSelectElement | null;
  const presetSelect = document.getElementById('sr-preset-select') as HTMLSelectElement | null;
  const previewCanvas = document.getElementById('sr-preview-canvas') as HTMLCanvasElement | null;
  const downloadSingleBtn = document.getElementById('sr-download-single') as HTMLButtonElement | null;
  const downloadVideoBtn = document.getElementById('sr-download-video') as HTMLButtonElement | null;
  const downloadAllBtn = document.getElementById('sr-download-all') as HTMLButtonElement | null;
  const dimensionsBadge = document.getElementById('sr-dims-badge');

  const videoControls = document.getElementById('sr-video-controls');
  const videoPlayBtn = document.getElementById('sr-video-play-btn') as HTMLButtonElement | null;
  const videoScrub = document.getElementById('sr-video-scrub') as HTMLInputElement | null;
  const videoTimeText = document.getElementById('sr-video-time');

  let sourceImage: HTMLImageElement | null = null;
  let sourceVideo: HTMLVideoElement | null = null;
  let isVideoMode = false;
  let animFrameId: number | null = null;

  function loadFile(file: File) {
    if (file.type.startsWith('video/')) {
      // Video mode
      isVideoMode = true;
      sourceImage = null;
      if (sourceVideo) {
        sourceVideo.pause();
        sourceVideo.src = '';
      }

      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.playsInline = true;
      video.muted = true;
      video.loop = true;

      video.onloadedmetadata = () => {
        sourceVideo = video;
        if (videoControls) videoControls.classList.remove('hidden');
        if (downloadVideoBtn) downloadVideoBtn.classList.remove('hidden');
        if (downloadAllBtn) downloadAllBtn.classList.add('hidden');
        if (downloadSingleBtn) downloadSingleBtn.textContent = 'Capture Frame (PNG)';
        video.currentTime = 0;
        renderLoop();
        showToast('Video loaded! Choose your social media ratio', 'success');
      };
    } else {
      // Image mode
      isVideoMode = false;
      if (sourceVideo) {
        sourceVideo.pause();
        sourceVideo = null;
      }
      if (videoControls) videoControls.classList.add('hidden');
      if (downloadVideoBtn) downloadVideoBtn.classList.add('hidden');
      if (downloadAllBtn) downloadAllBtn.classList.remove('hidden');
      if (downloadSingleBtn) downloadSingleBtn.textContent = 'Download Photo';

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          sourceImage = img;
          renderSingle();
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  function getSelectedPreset(): SocialPreset {
    const idx = parseInt(presetSelect?.value || '0', 10);
    return SOCIAL_MEDIA_PRESETS[idx] || SOCIAL_MEDIA_PRESETS[0];
  }

  function drawMediaOnCanvas(
    c: HTMLCanvasElement,
    media: HTMLImageElement | HTMLVideoElement,
    srcW: number,
    srcH: number
  ) {
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const fit = fitSelect?.value || 'cover';

    if (fit === 'cover') {
      const scale = Math.max(c.width / srcW, c.height / srcH);
      const w = srcW * scale;
      const h = srcH * scale;
      const x = (c.width - w) / 2;
      const y = (c.height - h) / 2;
      ctx.drawImage(media, x, y, w, h);
    } else {
      // Contain with blurred background
      ctx.save();
      ctx.filter = 'blur(25px)';
      ctx.drawImage(media, -20, -20, c.width + 40, c.height + 40);
      ctx.restore();

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, c.width, c.height);

      const scale = Math.min(c.width / srcW, c.height / srcH);
      const w = srcW * scale;
      const h = srcH * scale;
      const x = (c.width - w) / 2;
      const y = (c.height - h) / 2;
      ctx.drawImage(media, x, y, w, h);
    }
  }

  function renderPresetToCanvas(preset: SocialPreset): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = preset.width;
    c.height = preset.height;

    if (isVideoMode && sourceVideo) {
      drawMediaOnCanvas(c, sourceVideo, sourceVideo.videoWidth, sourceVideo.videoHeight);
    } else if (sourceImage) {
      drawMediaOnCanvas(c, sourceImage, sourceImage.width, sourceImage.height);
    }
    return c;
  }

  function renderSingle() {
    const preset = getSelectedPreset();
    if (!previewCanvas) return;

    if (isVideoMode && sourceVideo) {
      previewCanvas.width = preset.width;
      previewCanvas.height = preset.height;
      drawMediaOnCanvas(previewCanvas, sourceVideo, sourceVideo.videoWidth, sourceVideo.videoHeight);
    } else if (sourceImage) {
      const rendered = renderPresetToCanvas(preset);
      previewCanvas.width = rendered.width;
      previewCanvas.height = rendered.height;
      const ctx = previewCanvas.getContext('2d');
      ctx?.drawImage(rendered, 0, 0);
    }

    if (dimensionsBadge) {
      dimensionsBadge.textContent = `${preset.platform} ${preset.name} - ${preset.width}x${preset.height}px`;
    }
  }

  function renderLoop() {
    if (isVideoMode && sourceVideo) {
      renderSingle();
      if (videoScrub && sourceVideo.duration) {
        videoScrub.value = String((sourceVideo.currentTime / sourceVideo.duration) * 100);
      }
      if (videoTimeText && sourceVideo.duration) {
        videoTimeText.textContent = `${formatMediaTime(sourceVideo.currentTime)} / ${formatMediaTime(sourceVideo.duration)}`;
      }
      if (!sourceVideo.paused && !sourceVideo.ended) {
        animFrameId = requestAnimationFrame(renderLoop);
      }
    }
  }

  // Video Controls
  videoPlayBtn?.addEventListener('click', () => {
    if (!sourceVideo) return;
    if (sourceVideo.paused) {
      sourceVideo.play();
      if (videoPlayBtn) videoPlayBtn.textContent = '⏸ Pause';
      renderLoop();
    } else {
      sourceVideo.pause();
      if (videoPlayBtn) videoPlayBtn.textContent = '▶ Play';
      if (animFrameId) cancelAnimationFrame(animFrameId);
    }
  });

  videoScrub?.addEventListener('input', () => {
    if (!sourceVideo || !sourceVideo.duration) return;
    const pct = parseFloat(videoScrub.value) / 100;
    sourceVideo.currentTime = pct * sourceVideo.duration;
    renderSingle();
  });

  fileInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) loadFile(file);
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-500');
  });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('border-blue-500'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500');
    const file = e.dataTransfer?.files[0];
    if (file) loadFile(file);
  });

  presetSelect?.addEventListener('change', renderSingle);
  fitSelect?.addEventListener('change', renderSingle);

  downloadSingleBtn?.addEventListener('click', () => {
    if (!previewCanvas) return;
    const preset = getSelectedPreset();
    const a = document.createElement('a');
    a.download = `${preset.platform.toLowerCase()}-${preset.width}x${preset.height}.png`;
    a.href = previewCanvas.toDataURL('image/png');
    a.click();
    showToast('Photo snapshot downloaded!', 'success');
  });

  downloadVideoBtn?.addEventListener('click', async () => {
    if (!sourceVideo || !previewCanvas) return;
    const preset = getSelectedPreset();
    showToast('Recording resized video...', 'info');

    sourceVideo.currentTime = 0;
    sourceVideo.play();
    if (videoPlayBtn) videoPlayBtn.textContent = '⏸ Pause';
    renderLoop();

    const stream = previewCanvas.captureStream(30);
    const mime = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      a.download = `${preset.platform.toLowerCase()}-${preset.width}x${preset.height}.${ext}`;
      a.click();
      showToast('Resized video exported successfully!', 'success');
    };

    recorder.start();
    sourceVideo.onended = () => {
      recorder.stop();
    };

    // If video loops or duration is known, stop after 1 full cycle
    const durMs = Math.min(60000, (sourceVideo.duration || 10) * 1000);
    setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, durMs);
  });

  downloadAllBtn?.addEventListener('click', async () => {
    if (!sourceImage) return;
    const zip = new JSZip();

    for (const p of SOCIAL_MEDIA_PRESETS) {
      const c = renderPresetToCanvas(p);
      const b64 = c.toDataURL('image/png').split(',')[1];
      const filename = `${p.platform.replace(/\s+/g, '_')}_${p.width}x${p.height}.png`;
      zip.file(filename, b64, { base64: true });
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'social-media-pack.zip';
    a.click();
    showToast('Full social media pack downloaded as ZIP!', 'success');
  });

  // Generate an attractive client-side default demo canvas so it is immediately interactive offline
  const demoCanvas = document.createElement('canvas');
  demoCanvas.width = 1200;
  demoCanvas.height = 800;
  const dCtx = demoCanvas.getContext('2d');
  if (dCtx) {
    const grad = dCtx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#3b82f6');
    grad.addColorStop(0.5, '#8b5cf6');
    grad.addColorStop(1, '#ec4899');
    dCtx.fillStyle = grad;
    dCtx.fillRect(0, 0, 1200, 800);
    dCtx.fillStyle = '#ffffff';
    dCtx.font = 'bold 48px sans-serif';
    dCtx.textAlign = 'center';
    dCtx.fillText('Toolora Social Resizer', 600, 380);
    dCtx.font = '24px sans-serif';
    dCtx.fillText('Upload any image or video to fit social media specs', 600, 440);

    const demoImg = new Image();
    demoImg.onload = () => {
      sourceImage = demoImg;
      renderSingle();
    };
    demoImg.src = demoCanvas.toDataURL('image/png');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSocialResizer);
} else {
  initSocialResizer();
}
