import { rgbToHex, rgbToHsl } from '../utils/imageUtilityTools.ts';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('picker-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('picker-drop-zone') as HTMLElement | null;
  const editorContainer = document.getElementById('picker-editor') as HTMLElement | null;
  const canvas = document.getElementById('picker-canvas') as HTMLCanvasElement | null;
  const loupeCanvas = document.getElementById('loupe-canvas') as HTMLCanvasElement | null;
  const hexDisplay = document.getElementById('picked-hex') as HTMLElement | null;
  const rgbDisplay = document.getElementById('picked-rgb') as HTMLElement | null;
  const hslDisplay = document.getElementById('picked-hsl') as HTMLElement | null;
  const cmykDisplay = document.getElementById('picked-cmyk') as HTMLElement | null;
  const activeSwatch = document.getElementById('active-color-swatch') as HTMLElement | null;
  const historyContainer = document.getElementById('color-history') as HTMLElement | null;
  const copyHexBtn = document.getElementById('copy-active-hex') as HTMLButtonElement | null;

  if (!fileInput || !dropZone || !editorContainer || !canvas || !loupeCanvas) return;

  const cvs = canvas;
  const lCvs = loupeCanvas;
  const ctx = cvs.getContext('2d');
  const loupeCtx = lCvs.getContext('2d');
  let currentImg: HTMLImageElement | null = null;
  let historyColors: string[] = [];
  let activeColor = '#3B82F6';

  function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
    const nr = r / 255;
    const ng = g / 255;
    const nb = b / 255;
    const k = 1 - Math.max(nr, ng, nb);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    const c = Math.round(((1 - nr - k) / (1 - k)) * 100);
    const m = Math.round(((1 - ng - k) / (1 - k)) * 100);
    const y = Math.round(((1 - nb - k) / (1 - k)) * 100);
    return { c, m, y, k: Math.round(k * 100) };
  }

  function updateColor(r: number, g: number, b: number) {
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    const cmyk = rgbToCmyk(r, g, b);
    activeColor = hex;

    if (activeSwatch) activeSwatch.style.backgroundColor = hex;
    if (hexDisplay) hexDisplay.textContent = hex;
    if (rgbDisplay) rgbDisplay.textContent = `rgb(${r}, ${g}, ${b})`;
    if (hslDisplay) hslDisplay.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    if (cmykDisplay) cmykDisplay.textContent = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
  }

  function addToHistory(hex: string) {
    if (!historyColors.includes(hex)) {
      historyColors.unshift(hex);
      if (historyColors.length > 12) historyColors.pop();
      renderHistory();
    }
  }

  function renderHistory() {
    if (!historyContainer) return;
    historyContainer.innerHTML = '';
    historyColors.forEach((hex) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer transition-transform hover:scale-110';
      btn.style.backgroundColor = hex;
      btn.title = `Copy ${hex}`;
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(hex);
        btn.classList.add('ring-2', 'ring-blue-500');
        setTimeout(() => btn.classList.remove('ring-2', 'ring-blue-500'), 800);
      });
      historyContainer.appendChild(btn);
    });
  }

  function drawLoupe(pixelX: number, pixelY: number) {
    if (!currentImg || !loupeCtx) return;
    const lSize = 120;
    lCvs.width = lSize;
    lCvs.height = lSize;

    loupeCtx.clearRect(0, 0, lSize, lSize);

    // Save circle clipping
    loupeCtx.save();
    loupeCtx.beginPath();
    loupeCtx.arc(lSize / 2, lSize / 2, lSize / 2, 0, Math.PI * 2);
    loupeCtx.clip();

    // Magnify 10x
    loupeCtx.imageSmoothingEnabled = false;
    const sampleRadius = 6;
    loupeCtx.drawImage(
      cvs,
      pixelX - sampleRadius,
      pixelY - sampleRadius,
      sampleRadius * 2,
      sampleRadius * 2,
      0,
      0,
      lSize,
      lSize
    );

    // Crosshair in center
    loupeCtx.strokeStyle = '#ffffff';
    loupeCtx.lineWidth = 2;
    loupeCtx.strokeRect(lSize / 2 - 4, lSize / 2 - 4, 8, 8);
    loupeCtx.strokeStyle = '#000000';
    loupeCtx.lineWidth = 1;
    loupeCtx.strokeRect(lSize / 2 - 4, lSize / 2 - 4, 8, 8);

    loupeCtx.restore();

    // Outer border
    loupeCtx.strokeStyle = '#3b82f6';
    loupeCtx.lineWidth = 3;
    loupeCtx.beginPath();
    loupeCtx.arc(lSize / 2, lSize / 2, lSize / 2 - 1.5, 0, Math.PI * 2);
    loupeCtx.stroke();
  }

  function handlePointer(e: MouseEvent) {
    if (!currentImg || !ctx) return;
    const rect = cvs.getBoundingClientRect();
    const scaleX = cvs.width / rect.width;
    const scaleY = cvs.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (x >= 0 && x < cvs.width && y >= 0 && y < cvs.height) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      updateColor(pixel[0], pixel[1], pixel[2]);
      drawLoupe(x, y);
    }
  }

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

        // Sample center
        const center = ctx?.getImageData(Math.floor(img.width / 2), Math.floor(img.height / 2), 1, 1).data;
        if (center) {
          updateColor(center[0], center[1], center[2]);
          drawLoupe(Math.floor(img.width / 2), Math.floor(img.height / 2));
        }

        dropZone?.classList.add('hidden');
        editorContainer?.classList.remove('hidden');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  dropZone.addEventListener('dragover', (e) => e.preventDefault());
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files.length) loadFile(e.dataTransfer.files[0]);
  });
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) loadFile(fileInput.files[0]);
  });

  canvas.addEventListener('mousemove', handlePointer);
  canvas.addEventListener('click', (e) => {
    handlePointer(e);
    addToHistory(activeColor);
  });

  copyHexBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(activeColor);
    copyHexBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyHexBtn.textContent = 'Copy HEX';
    }, 1200);
  });
});
