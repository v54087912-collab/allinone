import { wrapCaptionLines } from '../utils/imageUtilityTools.ts';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('caption-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('caption-drop-zone') as HTMLElement | null;
  const editorContainer = document.getElementById('caption-editor') as HTMLElement | null;
  const canvas = document.getElementById('caption-canvas') as HTMLCanvasElement | null;
  const topTextInput = document.getElementById('caption-top-text') as HTMLInputElement | null;
  const bottomTextInput = document.getElementById('caption-bottom-text') as HTMLInputElement | null;
  const styleSelect = document.getElementById('caption-style') as HTMLSelectElement | null;
  const fontSelect = document.getElementById('caption-font') as HTMLSelectElement | null;
  const fontSizeSlider = document.getElementById('caption-size') as HTMLInputElement | null;
  const strokeSlider = document.getElementById('caption-stroke') as HTMLInputElement | null;
  const textColorInput = document.getElementById('caption-text-color') as HTMLInputElement | null;
  const uppercaseCheck = document.getElementById('caption-uppercase') as HTMLInputElement | null;
  const watermarkInput = document.getElementById('caption-watermark') as HTMLInputElement | null;
  const downloadBtn = document.getElementById('download-caption-btn') as HTMLButtonElement | null;
  const copyBtn = document.getElementById('copy-caption-btn') as HTMLButtonElement | null;
  const templateBtns = document.querySelectorAll('[data-template]');

  if (!fileInput || !canvas || !downloadBtn) return;

  const cvs = canvas;
  const ctx = cvs.getContext('2d');
  let currentImg: HTMLImageElement | null = null;

  function loadSample(url: string) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      currentImg = img;
      dropZone?.classList.add('hidden');
      editorContainer?.classList.remove('hidden');
      render();
    };
    img.src = url;
  }

  function render() {
    if (!currentImg || !ctx) return;
    const style = styleSelect?.value || 'meme';
    let topText = topTextInput?.value || '';
    let bottomText = bottomTextInput?.value || '';
    const isUpper = uppercaseCheck?.checked ?? true;

    if (isUpper) {
      topText = topText.toUpperCase();
      bottomText = bottomText.toUpperCase();
    }

    const fontFamily = fontSelect?.value || 'Impact';
    const textColor = textColorInput?.value || '#ffffff';
    const relSize = Number(fontSizeSlider?.value || 40) / 1000;
    const strokeWidth = Number(strokeSlider?.value || 4);
    const watermark = watermarkInput?.value.trim() || '';

    // Handle Polaroid border layout
    if (style === 'polaroid') {
      const border = Math.round(currentImg.width * 0.05);
      const bottomBorder = Math.round(currentImg.height * 0.22);
      cvs.width = currentImg.width + border * 2;
      cvs.height = currentImg.height + border + bottomBorder;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cvs.width, cvs.height);
      ctx.drawImage(currentImg, border, border);

      // Shadow behind photo inside polaroid
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(border, border, currentImg.width, currentImg.height);

      if (bottomText) {
        const pFontSize = Math.max(18, Math.round(cvs.width * 0.045));
        ctx.font = `italic 600 ${pFontSize}px "Caveat", "Brush Script MT", cursive, sans-serif`;
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bottomText, cvs.width / 2, currentImg.height + border + bottomBorder / 2);
      }
      return;
    }

    // Default sizing
    cvs.width = currentImg.width;
    cvs.height = currentImg.height;

    // Draw base image
    ctx.drawImage(currentImg, 0, 0);

    const fontSize = Math.max(16, Math.round(cvs.width * relSize));
    ctx.font = `bold ${fontSize}px ${fontFamily}, sans-serif`;
    ctx.textAlign = 'center';

    const maxChars = Math.max(12, Math.floor(cvs.width / (fontSize * 0.55)));

    if (style === 'news') {
      // News headline banner at bottom
      if (bottomText) {
        const lines = wrapCaptionLines(bottomText, maxChars);
        const bannerH = lines.length * (fontSize * 1.3) + fontSize * 0.8;
        ctx.fillStyle = '#dc2626'; // Red banner
        ctx.fillRect(0, cvs.height - bannerH, cvs.width, bannerH);

        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        lines.forEach((line, idx) => {
          const y = cvs.height - bannerH + (idx + 0.5) * (fontSize * 1.3) + fontSize * 0.4;
          ctx.fillText(line, cvs.width / 2, y);
        });
      }
    } else if (style === 'cinema') {
      // Cinema letterbox with yellow subtitle
      const letterboxH = Math.round(cvs.height * 0.1);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, cvs.width, letterboxH);
      ctx.fillRect(0, cvs.height - letterboxH, cvs.width, letterboxH);

      if (bottomText) {
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = '#fde047';
        ctx.textBaseline = 'middle';
        ctx.fillText(bottomText, cvs.width / 2, cvs.height - letterboxH / 2);
      }
    } else {
      // Classic Meme Style
      ctx.fillStyle = textColor;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(2, fontSize * (strokeWidth / 40));
      ctx.lineJoin = 'round';

      // Top text lines
      if (topText) {
        const topLines = wrapCaptionLines(topText, maxChars);
        ctx.textBaseline = 'top';
        topLines.forEach((line, idx) => {
          const y = fontSize * 0.5 + idx * (fontSize * 1.15);
          if (strokeWidth > 0) ctx.strokeText(line, cvs.width / 2, y);
          ctx.fillText(line, cvs.width / 2, y);
        });
      }

      // Bottom text lines
      if (bottomText) {
        const bottomLines = wrapCaptionLines(bottomText, maxChars);
        ctx.textBaseline = 'bottom';
        const totalBottomH = bottomLines.length * (fontSize * 1.15);
        bottomLines.forEach((line, idx) => {
          const y = cvs.height - totalBottomH + (idx + 1) * (fontSize * 1.15) - fontSize * 0.3;
          if (strokeWidth > 0) ctx.strokeText(line, cvs.width / 2, y);
          ctx.fillText(line, cvs.width / 2, y);
        });
      }
    }

    // Watermark
    if (watermark) {
      const wmSize = Math.max(12, Math.round(fontSize * 0.35));
      ctx.font = `bold ${wmSize}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 4;
      ctx.fillText(watermark, cvs.width - 12, cvs.height - 12);
      ctx.shadowBlur = 0;
    }
  }

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImg = img;
        dropZone?.classList.add('hidden');
        editorContainer?.classList.remove('hidden');
        render();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  dropZone?.addEventListener('dragover', (e) => e.preventDefault());
  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files.length) loadFile(e.dataTransfer.files[0]);
  });
  dropZone?.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) loadFile(fileInput.files[0]);
  });

  templateBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const t = btn.getAttribute('data-template');
      // Create SVG meme canvas mockup
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = 600;
      sampleCanvas.height = 400;
      const sCtx = sampleCanvas.getContext('2d');
      if (sCtx) {
        if (t === 'sunset') {
          const grad = sCtx.createLinearGradient(0, 0, 0, 400);
          grad.addColorStop(0, '#f97316');
          grad.addColorStop(0.6, '#ec4899');
          grad.addColorStop(1, '#6366f1');
          sCtx.fillStyle = grad;
          sCtx.fillRect(0, 0, 600, 400);
        } else if (t === 'mountain') {
          const grad = sCtx.createLinearGradient(0, 0, 0, 400);
          grad.addColorStop(0, '#0ea5e9');
          grad.addColorStop(1, '#065f46');
          sCtx.fillStyle = grad;
          sCtx.fillRect(0, 0, 600, 400);
        } else {
          sCtx.fillStyle = '#334155';
          sCtx.fillRect(0, 0, 600, 400);
        }
        loadSample(sampleCanvas.toDataURL('image/jpeg'));
      }
    });
  });

  [
    topTextInput,
    bottomTextInput,
    styleSelect,
    fontSelect,
    fontSizeSlider,
    strokeSlider,
    textColorInput,
    uppercaseCheck,
    watermarkInput
  ].forEach((ctrl) => {
    ctrl?.addEventListener('input', render);
    ctrl?.addEventListener('change', render);
  });

  downloadBtn.addEventListener('click', () => {
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.download = `captioned-image-${Date.now()}.jpg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/jpeg', 0.95);
  });

  copyBtn?.addEventListener('click', () => {
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      try {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        copyBtn.textContent = 'Copied to Clipboard!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy Image';
        }, 1500);
      } catch (e) {
        alert('Clipboard write not supported in this browser window.');
      }
    }, 'image/png');
  });

  // Load a default colorful placeholder initially
  loadSample('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%238b5cf6"/></linearGradient></defs><rect width="600" height="400" fill="url(%23g)"/><text x="50%" y="50%" fill="white" font-size="28" font-family="sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="middle">QuickPic Studio</text></svg>');
});
