import { clampCropBox } from '../utils/imageUtilityTools.ts';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('crop-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('crop-drop-zone') as HTMLElement | null;
  const editorContainer = document.getElementById('crop-editor') as HTMLElement | null;
  const canvas = document.getElementById('crop-canvas') as HTMLCanvasElement | null;
  const aspectSelect = document.getElementById('aspect-select') as HTMLSelectElement | null;
  const formatSelect = document.getElementById('format-select') as HTMLSelectElement | null;
  const qualitySlider = document.getElementById('quality-slider') as HTMLInputElement | null;
  const qualityValue = document.getElementById('quality-val') as HTMLElement | null;
  const rotateLeftBtn = document.getElementById('rotate-left-btn') as HTMLButtonElement | null;
  const rotateRightBtn = document.getElementById('rotate-right-btn') as HTMLButtonElement | null;
  const flipHBtn = document.getElementById('flip-h-btn') as HTMLButtonElement | null;
  const flipVBtn = document.getElementById('flip-v-btn') as HTMLButtonElement | null;
  const resetBtn = document.getElementById('reset-crop-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('download-crop-btn') as HTMLButtonElement | null;
  const dimDisplay = document.getElementById('crop-dim-display') as HTMLElement | null;

  if (!fileInput || !dropZone || !editorContainer || !canvas || !downloadBtn) return;

  const cvs = canvas;
  const ctx = cvs.getContext('2d');
  let currentImg: HTMLImageElement | null = null;
  let rotation = 0; // 0, 90, 180, 270
  let flipH = false;
  let flipV = false;

  // Normalized crop box relative to base image orientation
  let crop = { x: 50, y: 50, w: 300, h: 300 };
  let isDragging = false;
  let dragHandle: string | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialCrop = { ...crop };
  let displayScale = 1;

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImg = img;
        rotation = 0;
        flipH = false;
        flipV = false;
        const initialSize = Math.min(img.width, img.height) * 0.8;
        crop = {
          x: Math.round((img.width - initialSize) / 2),
          y: Math.round((img.height - initialSize) / 2),
          w: Math.round(initialSize),
          h: Math.round(initialSize)
        };
        dropZone?.classList.add('hidden');
        editorContainer?.classList.remove('hidden');
        render();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function getTransformedDims(): { w: number; h: number } {
    if (!currentImg) return { w: 0, h: 0 };
    return rotation % 180 === 0
      ? { w: currentImg.width, h: currentImg.height }
      : { w: currentImg.height, h: currentImg.width };
  }

  function render() {
    if (!currentImg || !ctx) return;
    const dims = getTransformedDims();
    const maxDisplayW = Math.min(800, window.innerWidth - 48);
    const maxDisplayH = 500;

    displayScale = Math.min(maxDisplayW / dims.w, maxDisplayH / dims.h, 1);
    cvs.width = Math.round(dims.w * displayScale);
    cvs.height = Math.round(dims.h * displayScale);

    ctx.save();
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    // Render transformed image
    ctx.save();
    ctx.translate(cvs.width / 2, cvs.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    const drawW = (rotation % 180 === 0 ? dims.w : dims.h) * displayScale;
    const drawH = (rotation % 180 === 0 ? dims.h : dims.w) * displayScale;
    ctx.drawImage(currentImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Dark semi-transparent mask outside crop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    const cx = crop.x * displayScale;
    const cy = crop.y * displayScale;
    const cw = crop.w * displayScale;
    const ch = crop.h * displayScale;

    // Outer shade
    ctx.beginPath();
    ctx.rect(0, 0, cvs.width, cvs.height);
    if (aspectSelect?.value === 'circle') {
      ctx.arc(cx + cw / 2, cy + ch / 2, Math.min(cw, ch) / 2, 0, Math.PI * 2, true);
    } else {
      ctx.rect(cx + cw, cy, -cw, ch);
    }
    ctx.fill();

    // Crop Border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    if (aspectSelect?.value === 'circle') {
      ctx.beginPath();
      ctx.arc(cx + cw / 2, cy + ch / 2, Math.min(cw, ch) / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(cx, cy, cw, ch);

      // Rule of thirds grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + cw / 3, cy);
      ctx.lineTo(cx + cw / 3, cy + ch);
      ctx.moveTo(cx + (cw * 2) / 3, cy);
      ctx.lineTo(cx + (cw * 2) / 3, cy + ch);
      ctx.moveTo(cx, cy + ch / 3);
      ctx.lineTo(cx + cw, cy + ch / 3);
      ctx.moveTo(cx, cy + (ch * 2) / 3);
      ctx.lineTo(cx + cw, cy + (ch * 2) / 3);
      ctx.stroke();
    }

    // Handles
    const handleSize = 8;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;

    const handles = [
      { x: cx, y: cy },
      { x: cx + cw, y: cy },
      { x: cx, y: cy + ch },
      { x: cx + cw, y: cy + ch }
    ];

    handles.forEach((h) => {
      ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
    });

    ctx.restore();

    if (dimDisplay) {
      dimDisplay.textContent = `${Math.round(crop.w)} × ${Math.round(crop.h)} px`;
    }
  }

  function applyAspectRatio() {
    if (!currentImg) return;
    const dims = getTransformedDims();
    const aspect = aspectSelect?.value || 'free';
    if (aspect === 'free') return;

    let targetRatio = 1;
    if (aspect === '1:1' || aspect === 'circle') targetRatio = 1;
    else if (aspect === '4:5') targetRatio = 4 / 5;
    else if (aspect === '16:9') targetRatio = 16 / 9;
    else if (aspect === '9:16') targetRatio = 9 / 16;
    else if (aspect === '4:3') targetRatio = 4 / 3;
    else if (aspect === '3:2') targetRatio = 3 / 2;

    let newW = crop.w;
    let newH = newW / targetRatio;
    if (newH > dims.h) {
      newH = dims.h;
      newW = newH * targetRatio;
    }
    crop.w = Math.round(newW);
    crop.h = Math.round(newH);
    crop = clampCropBox(crop, dims.w, dims.h, 20);
    render();
  }

  // Mouse & Touch Dragging
  function getCanvasPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = cvs.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    return {
      x: (clientX - rect.left) / displayScale,
      y: (clientY - rect.top) / displayScale
    };
  }

  canvas.addEventListener('mousedown', (e) => {
    if (!currentImg) return;
    const pos = getCanvasPos(e);
    dragStartX = pos.x;
    dragStartY = pos.y;
    initialCrop = { ...crop };

    const handleDist = 20 / displayScale;
    if (Math.hypot(pos.x - (crop.x + crop.w), pos.y - (crop.y + crop.h)) < handleDist) {
      dragHandle = 'se';
    } else if (Math.hypot(pos.x - crop.x, pos.y - crop.y) < handleDist) {
      dragHandle = 'nw';
    } else if (pos.x >= crop.x && pos.x <= crop.x + crop.w && pos.y >= crop.y && pos.y <= crop.y + crop.h) {
      dragHandle = 'move';
    } else {
      dragHandle = null;
    }

    if (dragHandle) isDragging = true;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging || !currentImg) return;
    const pos = getCanvasPos(e);
    const dx = pos.x - dragStartX;
    const dy = pos.y - dragStartY;
    const dims = getTransformedDims();

    if (dragHandle === 'move') {
      crop.x = initialCrop.x + dx;
      crop.y = initialCrop.y + dy;
    } else if (dragHandle === 'se') {
      crop.w = Math.max(30, initialCrop.w + dx);
      crop.h = Math.max(30, initialCrop.h + dy);
      if (aspectSelect?.value !== 'free') {
        const ratio = initialCrop.w / initialCrop.h;
        crop.h = crop.w / ratio;
      }
    }
    crop = clampCropBox(crop, dims.w, dims.h, 20);
    render();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    dragHandle = null;
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

  aspectSelect?.addEventListener('change', applyAspectRatio);

  rotateRightBtn?.addEventListener('click', () => {
    rotation = (rotation + 90) % 360;
    const dims = getTransformedDims();
    crop = { x: 0, y: 0, w: dims.w, h: dims.h };
    render();
  });

  rotateLeftBtn?.addEventListener('click', () => {
    rotation = (rotation + 270) % 360;
    const dims = getTransformedDims();
    crop = { x: 0, y: 0, w: dims.w, h: dims.h };
    render();
  });

  flipHBtn?.addEventListener('click', () => {
    flipH = !flipH;
    render();
  });

  flipVBtn?.addEventListener('click', () => {
    flipV = !flipV;
    render();
  });

  resetBtn?.addEventListener('click', () => {
    if (!currentImg) return;
    rotation = 0;
    flipH = false;
    flipV = false;
    const dims = getTransformedDims();
    crop = { x: 0, y: 0, w: dims.w, h: dims.h };
    render();
  });

  qualitySlider?.addEventListener('input', () => {
    if (qualityValue) qualityValue.textContent = `${qualitySlider.value}%`;
  });

  downloadBtn.addEventListener('click', () => {
    if (!currentImg) return;
    const dims = getTransformedDims();
    const outCanvas = document.createElement('canvas');
    outCanvas.width = Math.round(crop.w);
    outCanvas.height = Math.round(crop.h);
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return;

    if (aspectSelect?.value === 'circle') {
      outCtx.beginPath();
      outCtx.arc(outCanvas.width / 2, outCanvas.height / 2, Math.min(outCanvas.width, outCanvas.height) / 2, 0, Math.PI * 2);
      outCtx.clip();
    }

    // Intermediate canvas for full transformed image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = dims.w;
    tempCanvas.height = dims.h;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.translate(dims.w / 2, dims.h / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    const origW = rotation % 180 === 0 ? dims.w : dims.h;
    const origH = rotation % 180 === 0 ? dims.h : dims.w;
    tempCtx.drawImage(currentImg, -origW / 2, -origH / 2, origW, origH);

    // Draw crop region into outCanvas
    outCtx.drawImage(
      tempCanvas,
      crop.x,
      crop.y,
      crop.w,
      crop.h,
      0,
      0,
      outCanvas.width,
      outCanvas.height
    );

    const format = formatSelect?.value || 'image/png';
    const quality = Number(qualitySlider?.value || 90) / 100;
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';

    outCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.download = `cropped-image.${ext}`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      },
      format,
      quality
    );
  });
});
