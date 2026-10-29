document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('censor-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('censor-drop-zone') as HTMLElement | null;
  const editorContainer = document.getElementById('censor-editor') as HTMLElement | null;
  const canvas = document.getElementById('censor-canvas') as HTMLCanvasElement | null;
  const modeSelect = document.getElementById('censor-mode') as HTMLSelectElement | null;
  const intensitySlider = document.getElementById('censor-intensity') as HTMLInputElement | null;
  const undoBtn = document.getElementById('censor-undo-btn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('censor-clear-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('download-censor-btn') as HTMLButtonElement | null;

  if (!fileInput || !dropZone || !editorContainer || !canvas || !downloadBtn) return;

  const cvs = canvas;
  const ctx = cvs.getContext('2d');
  let currentImg: HTMLImageElement | null = null;
  let historyStack: ImageData[] = [];
  let isDrawing = false;
  let startX = 0;
  let startY = 0;
  let baseSnapshot: ImageData | null = null;

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImg = img;
        cvs.width = img.width;
        cvs.height = img.height;
        ctx?.drawImage(img, 0, 0);
        historyStack = [];
        saveState();
        dropZone?.classList.add('hidden');
        editorContainer?.classList.remove('hidden');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function saveState() {
    if (!ctx) return;
    historyStack.push(ctx.getImageData(0, 0, cvs.width, cvs.height));
    if (historyStack.length > 20) historyStack.shift();
  }

  function applyCensorBox(x: number, y: number, w: number, h: number) {
    if (!ctx || w <= 0 || h <= 0) return;
    const mode = modeSelect?.value || 'pixelate';
    const intensity = Number(intensitySlider?.value || 16);

    if (mode === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, w, h);
    } else if (mode === 'classified') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffffff';
      const fontSize = Math.max(12, Math.min(24, Math.round(h * 0.4)));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TOP SECRET', x + w / 2, y + h / 2);
    } else if (mode === 'blur') {
      // Temporary canvas for localized blur
      const sub = ctx.getImageData(x, y, w, h);
      const subCanvas = document.createElement('canvas');
      subCanvas.width = w;
      subCanvas.height = h;
      const sCtx = subCanvas.getContext('2d');
      if (sCtx) {
        sCtx.putImageData(sub, 0, 0);
        ctx.save();
        ctx.filter = `blur(${Math.max(4, intensity * 0.6)}px)`;
        ctx.drawImage(subCanvas, x, y);
        ctx.restore();
      }
    } else {
      // Pixelate
      const blockSize = Math.max(4, intensity);
      const sub = ctx.getImageData(x, y, w, h);
      const data = sub.data;

      for (let py = 0; py < h; py += blockSize) {
        for (let px = 0; px < w; px += blockSize) {
          const sampleIdx = (py * w + px) * 4;
          const r = data[sampleIdx];
          const g = data[sampleIdx + 1];
          const b = data[sampleIdx + 2];

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x + px, y + py, blockSize, blockSize);
        }
      }
    }
  }

  function getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = cvs.getBoundingClientRect();
    const scaleX = cvs.width / rect.width;
    const scaleY = cvs.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY)
    };
  }

  canvas.addEventListener('mousedown', (e) => {
    if (!ctx) return;
    const pos = getCanvasCoords(e);
    isDrawing = true;
    startX = pos.x;
    startY = pos.y;
    baseSnapshot = ctx.getImageData(0, 0, cvs.width, cvs.height);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || !ctx || !baseSnapshot) return;
    const pos = getCanvasCoords(e);
    ctx.putImageData(baseSnapshot, 0, 0);

    const x = Math.min(startX, pos.x);
    const y = Math.min(startY, pos.y);
    const w = Math.abs(pos.x - startX);
    const h = Math.abs(pos.y - startY);

    // Live preview rectangle outline
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  });

  window.addEventListener('mouseup', (e) => {
    if (!isDrawing || !ctx || !baseSnapshot) return;
    isDrawing = false;
    ctx.putImageData(baseSnapshot, 0, 0);

    const pos = getCanvasCoords(e);
    const x = Math.min(startX, pos.x);
    const y = Math.min(startY, pos.y);
    const w = Math.abs(pos.x - startX);
    const h = Math.abs(pos.y - startY);

    if (w > 5 && h > 5) {
      applyCensorBox(x, y, w, h);
      saveState();
    }
  });

  undoBtn?.addEventListener('click', () => {
    if (historyStack.length > 1 && ctx) {
      historyStack.pop();
      const prev = historyStack[historyStack.length - 1];
      ctx.putImageData(prev, 0, 0);
    }
  });

  clearBtn?.addEventListener('click', () => {
    if (currentImg && ctx) {
      ctx.drawImage(currentImg, 0, 0);
      saveState();
    }
  });

  dropZone.addEventListener('dragover', (e) => e.preventDefault());
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files.length) loadFile(e.dataTransfer.files[0]);
  });
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) loadFile(fileInput.files[0]);
  });

  downloadBtn.addEventListener('click', () => {
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.download = `censored-photo-${Date.now()}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  });
});
