import { showToast } from '../shared/site-shell.ts';

export function initPixelMaker(): void {
  const canvas = document.getElementById('pm-canvas') as HTMLCanvasElement | null;
  const gridSelect = document.getElementById('pm-grid-size') as HTMLSelectElement | null;
  const toolSelect = document.getElementById('pm-tool') as HTMLSelectElement | null;
  const colorPicker = document.getElementById('pm-color') as HTMLInputElement | null;
  const colorHexInput = document.getElementById('pm-color-hex') as HTMLInputElement | null;
  const clearBtn = document.getElementById('pm-clear') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('pm-download') as HTMLButtonElement | null;

  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let gridSize = 16;
  let grid: string[][] = [];
  let isDrawing = false;
  let activeColor = '#000000';

  function initGrid() {
    gridSize = parseInt(gridSelect?.value || '16', 10);
    grid = [];
    for (let r = 0; r < gridSize; r++) {
      grid.push(new Array(gridSize).fill('#ffffff'));
    }
    draw();
  }

  function draw() {
    if (!canvas || !ctx) return;
    const w = canvas.width;
    const cellW = w / gridSize;

    ctx.clearRect(0, 0, w, w);

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        ctx.fillStyle = grid[r][c];
        ctx.fillRect(c * cellW, r * cellW, cellW, cellW);

        // Grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.strokeRect(c * cellW, r * cellW, cellW, cellW);
      }
    }
  }

  function setColor(hex: string, updateInputs = true) {
    if (!hex.startsWith('#')) hex = '#' + hex;
    activeColor = hex;

    if (updateInputs) {
      if (colorPicker) colorPicker.value = hex;
      if (colorHexInput) colorHexInput.value = hex.toUpperCase();
    }

    // Switch tool from eraser to pencil if active
    if (toolSelect && toolSelect.value === 'eraser') {
      toolSelect.value = 'pencil';
    }

    // Update active swatch indicator
    document.querySelectorAll<HTMLButtonElement>('[data-pm-color]').forEach((btn) => {
      const swatch = btn.getAttribute('data-pm-color')?.toLowerCase();
      if (swatch === hex.toLowerCase()) {
        btn.classList.add('ring-2', 'ring-blue-500', 'ring-offset-1');
      } else {
        btn.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1');
      }
    });
  }

  function setPixelFromClient(clientX: number, clientY: number) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const mouseX = (clientX - rect.left) * scale;
    const mouseY = (clientY - rect.top) * scale;

    const cellW = canvas.width / gridSize;
    const col = Math.floor(mouseX / cellW);
    const row = Math.floor(mouseY / cellW);

    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;

    const tool = toolSelect?.value || 'pencil';
    const fillCol = tool === 'eraser' ? '#ffffff' : activeColor;

    if (tool === 'bucket') {
      const targetColor = grid[row][col];
      floodFill(row, col, targetColor, fillCol);
    } else {
      grid[row][col] = fillCol;
    }
    draw();
  }

  function floodFill(startR: number, startC: number, target: string, fill: string) {
    if (target === fill) return;
    const queue: [number, number][] = [[startR, startC]];
    const seen = new Set<string>();

    while (queue.length > 0) {
      const [r, c] = queue.pop()!;
      const key = `${r},${c}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) continue;
      if (grid[r][c] !== target) continue;

      grid[r][c] = fill;
      queue.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
    }
  }

  // Mouse Events
  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDrawing = true;
    setPixelFromClient(e.clientX, e.clientY);
  });

  window.addEventListener('mouseup', () => (isDrawing = false));

  canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) setPixelFromClient(e.clientX, e.clientY);
  });

  // Touch Events (Phones, Tablets, Touch Laptops)
  canvas.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        isDrawing = true;
        const touch = e.touches[0];
        setPixelFromClient(touch.clientX, touch.clientY);
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
      setPixelFromClient(touch.clientX, touch.clientY);
    },
    { passive: false }
  );

  window.addEventListener('touchend', () => (isDrawing = false));

  gridSelect?.addEventListener('change', initGrid);
  clearBtn?.addEventListener('click', initGrid);

  // Swatches
  document.querySelectorAll<HTMLButtonElement>('[data-pm-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const c = btn.getAttribute('data-pm-color');
      if (c) setColor(c);
    });
  });

  // Native Color Picker input
  colorPicker?.addEventListener('input', () => {
    setColor(colorPicker.value, true);
  });

  // Hex Text input
  colorHexInput?.addEventListener('input', () => {
    let val = colorHexInput.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setColor(val, false);
      if (colorPicker) colorPicker.value = val;
    }
  });

  downloadBtn?.addEventListener('click', () => {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = 512;
    outCanvas.height = 512;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return;

    const scale = 512 / gridSize;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        outCtx.fillStyle = grid[r][c];
        outCtx.fillRect(c * scale, r * scale, scale, scale);
      }
    }

    const a = document.createElement('a');
    a.download = `pixel-art-${gridSize}x${gridSize}.png`;
    a.href = outCanvas.toDataURL('image/png');
    a.click();
    showToast('Pixel art PNG downloaded!', 'success');
  });

  initGrid();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPixelMaker);
} else {
  initPixelMaker();
}
