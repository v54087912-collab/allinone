import os

PROJECT_DIR = '/home/yugank/zmodd/quickpic-studio---free-in-browser-image-utilities'
TOOLS_DIR = os.path.join(PROJECT_DIR, 'src/tools')

# 15. Icon Finder Controller
icon_finder_ts = '''import { showToast } from '../shared/site-shell.ts';

const ICONS_DB = [
  { name: 'Search', path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', tag: 'ui search look find' },
  { name: 'Home', path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', tag: 'ui home house main' },
  { name: 'Settings', path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', tag: 'settings gear options' },
  { name: 'Download', path: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', tag: 'files download save' },
  { name: 'Upload', path: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', tag: 'files upload send' },
  { name: 'Heart', path: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', tag: 'like love heart social' },
  { name: 'Star', path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', tag: 'rate star favorite' },
  { name: 'Check', path: 'M5 13l4 4L19 7', tag: 'ui check success ok' },
  { name: 'X / Close', path: 'M6 18L18 6M6 6l12 12', tag: 'ui close delete cancel' },
  { name: 'Copy', path: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z', tag: 'ui copy clipboard' },
  { name: 'Lock', path: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', tag: 'security lock private' },
  { name: 'Eye', path: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', tag: 'view eye watch see' },
  { name: 'Moon', path: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z', tag: 'theme dark moon' },
  { name: 'Sun', path: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z', tag: 'theme light sun bright' },
  { name: 'Folder', path: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', tag: 'files folder directory' },
  { name: 'Trash', path: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', tag: 'ui delete remove trash' },
];

export function initIconFinder(): void {
  const searchInput = document.getElementById('icon-search') as HTMLInputElement | null;
  const sizeSlider = document.getElementById('icon-size') as HTMLInputElement | null;
  const strokeSlider = document.getElementById('icon-stroke') as HTMLInputElement | null;
  const colorInput = document.getElementById('icon-color') as HTMLInputElement | null;
  const countBadge = document.getElementById('icon-count');
  const grid = document.getElementById('icon-grid');

  if (!grid) return;

  function render() {
    if (!grid) return;
    grid.innerHTML = '';

    const query = (searchInput?.value || '').trim().toLowerCase();
    const size = parseInt(sizeSlider?.value || '28', 10);
    const stroke = parseFloat(strokeSlider?.value || '2');
    const color = colorInput?.value || 'currentColor';

    const filtered = query
      ? ICONS_DB.filter((i) => i.name.toLowerCase().includes(query) || i.tag.includes(query))
      : ICONS_DB;

    if (countBadge) countBadge.textContent = `${filtered.length} icons found`;

    filtered.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-between text-center space-y-3';

      const svgHtml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${item.path.split(' ').map(d => `<path d="${d}" />`).join('')}</svg>`;

      card.innerHTML = `
        <div class="h-16 flex items-center justify-center">${svgHtml}</div>
        <div class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate w-full">${item.name}</div>
        <div class="flex items-center gap-1.5 w-full">
          <button type="button" class="copy-svg-btn flex-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer">Copy SVG</button>
        </div>
      `;

      card.querySelector('.copy-svg-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(svgHtml).then(() => showToast(`Copied ${item.name} SVG!`, 'success'));
      });

      grid.appendChild(card);
    });
  }

  [searchInput, sizeSlider, strokeSlider, colorInput].forEach((el) => {
    el?.addEventListener('input', render);
    el?.addEventListener('change', render);
  });

  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIconFinder);
} else {
  initIconFinder();
}
'''

# 16. ASCII Art Generator Controller
ascii_art_ts = '''import { convertPixelsToAscii, ASCII_CHAR_SETS } from '../utils/designUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initAsciiArt(): void {
  const fileInput = document.getElementById('ascii-file-input') as HTMLInputElement | null;
  const dropzone = document.getElementById('ascii-dropzone');
  const widthSlider = document.getElementById('ascii-width') as HTMLInputElement | null;
  const widthVal = document.getElementById('ascii-width-val');
  const charsetSelect = document.getElementById('ascii-charset') as HTMLSelectElement | null;
  const invertCheck = document.getElementById('ascii-invert') as HTMLInputElement | null;
  const outputPre = document.getElementById('ascii-output');
  const copyBtn = document.getElementById('ascii-copy-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('ascii-download-btn') as HTMLButtonElement | null;

  if (!outputPre) return;

  let sourceImage: HTMLImageElement | null = null;

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        sourceImage = img;
        render();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function render() {
    if (!sourceImage || !outputPre) return;

    const targetWidth = parseInt(widthSlider?.value || '80', 10);
    if (widthVal) widthVal.textContent = String(targetWidth);

    const charSetName = charsetSelect?.value || 'standard';
    const charSet = ASCII_CHAR_SETS[charSetName] || ASCII_CHAR_SETS.standard;
    const invert = invertCheck?.checked || false;

    // Draw to temp canvas
    const c = document.createElement('canvas');
    c.width = sourceImage.width;
    c.height = sourceImage.height;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(sourceImage, 0, 0);
    const imgData = ctx.getImageData(0, 0, c.width, c.height);

    const ascii = convertPixelsToAscii(imgData.data, c.width, c.height, targetWidth, charSet, invert);
    outputPre.textContent = ascii;

    copyBtn?.removeAttribute('disabled');
    downloadBtn?.removeAttribute('disabled');
  }

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

  [widthSlider, charsetSelect, invertCheck].forEach((el) => {
    el?.addEventListener('input', render);
    el?.addEventListener('change', render);
  });

  copyBtn?.addEventListener('click', () => {
    if (!outputPre?.textContent) return;
    navigator.clipboard.writeText(outputPre.textContent).then(() => showToast('ASCII art copied!', 'success'));
  });

  downloadBtn?.addEventListener('click', () => {
    if (!outputPre?.textContent) return;
    const blob = new Blob([outputPre.textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ascii-art.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('ASCII text file downloaded!', 'success');
  });

  // Default demo
  const demoImg = new Image();
  demoImg.onload = () => {
    sourceImage = demoImg;
    render();
  };
  demoImg.src = 'https://picsum.photos/400/400';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAsciiArt);
} else {
  initAsciiArt();
}
'''

# 17. Pixel Art Maker Controller
pixel_maker_ts = '''import { showToast } from '../shared/site-shell.ts';

export function initPixelMaker(): void {
  const canvas = document.getElementById('pm-canvas') as HTMLCanvasElement | null;
  const gridSelect = document.getElementById('pm-grid-size') as HTMLSelectElement | null;
  const toolSelect = document.getElementById('pm-tool') as HTMLSelectElement | null;
  const colorPicker = document.getElementById('pm-color') as HTMLInputElement | null;
  const clearBtn = document.getElementById('pm-clear') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('pm-download') as HTMLButtonElement | null;

  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let gridSize = 16;
  let grid: string[][] = [];
  let isDrawing = false;

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

  function setPixel(e: MouseEvent) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scale;
    const mouseY = (e.clientY - rect.top) * scale;

    const cellW = canvas.width / gridSize;
    const col = Math.floor(mouseX / cellW);
    const row = Math.floor(mouseY / cellW);

    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;

    const tool = toolSelect?.value || 'pencil';
    const color = tool === 'eraser' ? '#ffffff' : colorPicker?.value || '#000000';

    if (tool === 'bucket') {
      const targetColor = grid[row][col];
      floodFill(row, col, targetColor, color);
    } else {
      grid[row][col] = color;
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

  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    setPixel(e);
  });
  window.addEventListener('mouseup', () => (isDrawing = false));
  canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) setPixel(e);
  });

  gridSelect?.addEventListener('change', initGrid);
  clearBtn?.addEventListener('click', initGrid);

  // Swatches
  document.querySelectorAll<HTMLButtonElement>('[data-pm-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const c = btn.getAttribute('data-pm-color');
      if (c && colorPicker) colorPicker.value = c;
    });
  });

  downloadBtn?.addEventListener('click', () => {
    // Render upscaled 512x512 with crisp nearest-neighbor
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
'''

# 18. Simple Drawing App Controller
drawing_app_ts = '''import { showToast } from '../shared/site-shell.ts';

export function initDrawingApp(): void {
  const canvas = document.getElementById('draw-canvas') as HTMLCanvasElement | null;
  const toolSelect = document.getElementById('draw-tool') as HTMLSelectElement | null;
  const colorPicker = document.getElementById('draw-color') as HTMLInputElement | null;
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

  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  const history: ImageData[] = [];

  function saveHistory() {
    if (!canvas || !ctx) return;
    if (history.length > 20) history.shift();
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }
  saveHistory();

  function getMousePos(e: MouseEvent) {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;
  });

  window.addEventListener('mouseup', () => {
    if (isDrawing) {
      isDrawing = false;
      saveHistory();
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || !ctx) return;
    const pos = getMousePos(e);

    const tool = toolSelect?.value || 'brush';
    const color = tool === 'eraser' ? '#ffffff' : colorPicker?.value || '#000000';
    const size = parseInt(sizeSlider?.value || '6', 10);

    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastX = pos.x;
    lastY = pos.y;
  });

  sizeSlider?.addEventListener('input', () => {
    if (sizeVal && sizeSlider) sizeVal.textContent = `${sizeSlider.value}px`;
  });

  undoBtn?.addEventListener('click', () => {
    if (history.length > 1 && ctx) {
      history.pop();
      const lastState = history[history.length - 1];
      ctx.putImageData(lastState, 0, 0);
      showToast('Undo performed', 'info');
    }
  });

  clearBtn?.addEventListener('click', () => {
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
    showToast('Canvas cleared', 'info');
  });

  downloadBtn?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = `drawing-${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('Drawing downloaded!', 'success');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDrawingApp);
} else {
  initDrawingApp();
}
'''

with open(os.path.join(TOOLS_DIR, 'icon-finder.ts'), 'w') as f:
    f.write(icon_finder_ts)
with open(os.path.join(TOOLS_DIR, 'ascii-art.ts'), 'w') as f:
    f.write(ascii_art_ts)
with open(os.path.join(TOOLS_DIR, 'pixel-art-maker.ts'), 'w') as f:
    f.write(pixel_maker_ts)
with open(os.path.join(TOOLS_DIR, 'drawing-app.ts'), 'w') as f:
    f.write(drawing_app_ts)

print("Created icon-finder.ts, ascii-art.ts, pixel-art-maker.ts, drawing-app.ts")
