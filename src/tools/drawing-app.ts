import { showToast } from '../shared/site-shell.ts';

export function initDrawingApp(): void {
  const canvas = document.getElementById('draw-canvas') as HTMLCanvasElement | null;
  const toolSelect = document.getElementById('draw-tool') as HTMLSelectElement | null;
  const brushToolBtn = document.getElementById('draw-tool-brush') as HTMLButtonElement | null;
  const eraserToolBtn = document.getElementById('draw-tool-eraser') as HTMLButtonElement | null;
  const colorPicker = document.getElementById('draw-color') as HTMLInputElement | null;
  const colorHexInput = document.getElementById('draw-color-hex') as HTMLInputElement | null;
  const sizeSlider = document.getElementById('draw-size') as HTMLInputElement | null;
  const sizeVal = document.getElementById('draw-size-val');
  const clearBtn = document.getElementById('draw-clear') as HTMLButtonElement | null;
  const undoBtn = document.getElementById('draw-undo') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('draw-download') as HTMLButtonElement | null;

  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Initialize white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let currentTool: 'brush' | 'eraser' = 'brush';
  let currentColor = '#000000';
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  const history: ImageData[] = [];

  function setTool(tool: 'brush' | 'eraser') {
    currentTool = tool;
    if (toolSelect) toolSelect.value = tool;

    if (tool === 'brush') {
      brushToolBtn?.classList.remove('font-medium', 'text-slate-600', 'dark:text-slate-300');
      brushToolBtn?.classList.add('font-bold', 'bg-white', 'dark:bg-slate-700', 'text-blue-600', 'dark:text-blue-400', 'shadow-xs');

      eraserToolBtn?.classList.remove('font-bold', 'bg-white', 'dark:bg-slate-700', 'text-blue-600', 'dark:text-blue-400', 'shadow-xs');
      eraserToolBtn?.classList.add('font-medium', 'text-slate-600', 'dark:text-slate-300');
    } else {
      eraserToolBtn?.classList.remove('font-medium', 'text-slate-600', 'dark:text-slate-300');
      eraserToolBtn?.classList.add('font-bold', 'bg-white', 'dark:bg-slate-700', 'text-blue-600', 'dark:text-blue-400', 'shadow-xs');

      brushToolBtn?.classList.remove('font-bold', 'bg-white', 'dark:bg-slate-700', 'text-blue-600', 'dark:text-blue-400', 'shadow-xs');
      brushToolBtn?.classList.add('font-medium', 'text-slate-600', 'dark:text-slate-300');
    }
  }

  brushToolBtn?.addEventListener('click', () => setTool('brush'));
  eraserToolBtn?.addEventListener('click', () => setTool('eraser'));
  toolSelect?.addEventListener('change', () => setTool((toolSelect.value as any) || 'brush'));

  function updateColor(hex: string, updateInputs = true) {
    if (!hex.startsWith('#')) hex = '#' + hex;
    currentColor = hex;

    if (updateInputs) {
      if (colorPicker) colorPicker.value = hex;
      if (colorHexInput) colorHexInput.value = hex.toUpperCase();
    }

    // Automatically switch to brush if eraser was active
    if (currentTool === 'eraser') {
      setTool('brush');
    }

    // Update active swatch ring
    document.querySelectorAll<HTMLButtonElement>('[data-draw-swatch]').forEach((btn) => {
      const swatchColor = btn.getAttribute('data-draw-swatch')?.toLowerCase();
      if (swatchColor === hex.toLowerCase()) {
        btn.classList.add('ring-2', 'ring-blue-500', 'ring-offset-1');
      } else {
        btn.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1');
      }
    });
  }

  // Quick Swatch buttons
  document.querySelectorAll<HTMLButtonElement>('[data-draw-swatch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const c = btn.getAttribute('data-draw-swatch');
      if (c) updateColor(c);
    });
  });

  // Color picker input
  colorPicker?.addEventListener('input', () => {
    updateColor(colorPicker.value, true);
  });

  // Hex text input
  colorHexInput?.addEventListener('input', () => {
    let val = colorHexInput.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      updateColor(val, false);
      if (colorPicker) colorPicker.value = val;
    }
  });

  function saveHistory() {
    if (!canvas || !ctx) return;
    if (history.length > 25) history.shift();
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }
  saveHistory();

  function getCoordinates(clientX: number, clientY: number) {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function startDrawing(clientX: number, clientY: number) {
    isDrawing = true;
    const pos = getCoordinates(clientX, clientY);
    lastX = pos.x;
    lastY = pos.y;

    // Draw single dot on click / tap
    drawStroke(pos.x, pos.y);
  }

  function drawStroke(x: number, y: number) {
    if (!ctx) return;
    const size = parseInt(sizeSlider?.value || '6', 10);
    const color = currentTool === 'eraser' ? '#ffffff' : currentColor;

    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
  }

  function stopDrawing() {
    if (isDrawing) {
      isDrawing = false;
      saveHistory();
    }
  }

  // Mouse Events
  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startDrawing(e.clientX, e.clientY);
  });

  window.addEventListener('mouseup', stopDrawing);

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const pos = getCoordinates(e.clientX, e.clientY);
    drawStroke(pos.x, pos.y);
  });

  // Touch Events (Mobile, Tablet, Stylus)
  canvas.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        const touch = e.touches[0];
        startDrawing(touch.clientX, touch.clientY);
      }
    },
    { passive: false }
  );

  canvas.addEventListener(
    'touchmove',
    (e) => {
      if (!isDrawing || e.touches.length === 0) return;
      e.preventDefault();
      const touch = e.touches[0];
      const pos = getCoordinates(touch.clientX, touch.clientY);
      drawStroke(pos.x, pos.y);
    },
    { passive: false }
  );

  window.addEventListener('touchend', stopDrawing);

  // Brush size slider
  sizeSlider?.addEventListener('input', () => {
    if (sizeVal && sizeSlider) sizeVal.textContent = `${sizeSlider.value}px`;
  });

  // Undo button
  undoBtn?.addEventListener('click', () => {
    if (history.length > 1 && ctx) {
      history.pop();
      const lastState = history[history.length - 1];
      ctx.putImageData(lastState, 0, 0);
      showToast('Undo performed', 'info');
    }
  });

  // Clear button
  clearBtn?.addEventListener('click', () => {
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
    showToast('Canvas cleared', 'info');
  });

  // Download PNG button
  downloadBtn?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = `toolora-drawing-${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('Drawing saved as PNG!', 'success');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDrawingApp);
} else {
  initDrawingApp();
}
