/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initHandwritingToFontConverter(): void {
  const glyphsGrid = document.getElementById('glyphs-grid') as HTMLDivElement | null;
  const drawModal = document.getElementById('draw-modal') as HTMLDivElement | null;
  const drawCanvas = document.getElementById('glyph-canvas') as HTMLCanvasElement | null;
  const modalGlyphTitle = document.getElementById('modal-glyph-title') as HTMLHeadingElement | null;
  const clearGlyphBtn = document.getElementById('clear-glyph-btn') as HTMLButtonElement | null;
  const saveGlyphBtn = document.getElementById('save-glyph-btn') as HTMLButtonElement | null;
  const closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement | null;
  const testInput = document.getElementById('font-test-input') as HTMLInputElement | null;
  const testDisplay = document.getElementById('font-test-display') as HTMLDivElement | null;
  const exportFontBtn = document.getElementById('export-font-btn') as HTMLButtonElement | null;
  const penSizeSlider = document.getElementById('pen-size') as HTMLInputElement | null;

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?.,'.split('');
  const glyphData: Record<string, string> = JSON.parse(localStorage.getItem('toolora_handwritten_glyphs') || '{}');

  let activeChar = 'A';
  let isDrawing = false;
  let ctx: CanvasRenderingContext2D | null = null;

  if (drawCanvas) {
    ctx = drawCanvas.getContext('2d');
  }

  function renderGrid() {
    if (!glyphsGrid) return;
    glyphsGrid.innerHTML = '';

    characters.forEach(char => {
      const cell = document.createElement('div');
      cell.className = 'aspect-square p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-between cursor-pointer hover:border-blue-500 hover:scale-105 transition-all shadow-2xs';
      const hasGlyph = !!glyphData[char];

      cell.innerHTML = `
        <span class="text-[10px] font-bold text-slate-400">${char}</span>
        <div class="w-full flex-1 flex items-center justify-center overflow-hidden">
          ${hasGlyph ? `<img src="${glyphData[char]}" class="max-h-10 max-w-10 object-contain dark:invert" />` : `<span class="text-xs text-slate-300 dark:text-slate-700 font-mono">Empty</span>`}
        </div>
        <span class="text-[9px] ${hasGlyph ? 'text-emerald-500 font-bold' : 'text-slate-400'}">${hasGlyph ? 'Drawn' : 'Click'}</span>
      `;
      cell.addEventListener('click', () => openDrawModal(char));
      glyphsGrid.appendChild(cell);
    });

    renderTestPreview();
  }

  function openDrawModal(char: string) {
    activeChar = char;
    if (modalGlyphTitle) modalGlyphTitle.textContent = `Draw Letter: "${char}"`;
    if (drawCanvas && ctx) {
      drawCanvas.width = 240;
      drawCanvas.height = 240;
      resetCanvasBackground();

      if (glyphData[char]) {
        const img = new Image();
        img.onload = () => ctx?.drawImage(img, 0, 0);
        img.src = glyphData[char];
      }
    }
    if (drawModal) drawModal.classList.remove('hidden');
  }

  function resetCanvasBackground() {
    if (!drawCanvas || !ctx) return;
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    // Draw baseline guide
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 180);
    ctx.lineTo(220, 180);
    ctx.stroke();

    // Cap-height guide
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(20, 60);
    ctx.lineTo(220, 60);
    ctx.stroke();
  }

  if (drawCanvas && ctx) {
    let lastX = 0, lastY = 0;

    function getCoords(e: MouseEvent | TouchEvent): [number, number] {
      const rect = drawCanvas!.getBoundingClientRect();
      if ('touches' in e && e.touches.length) {
        return [e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top];
      } else if ('clientX' in e) {
        return [(e as MouseEvent).clientX - rect.left, (e as MouseEvent).clientY - rect.top];
      }
      return [0, 0];
    }

    function startDraw(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      isDrawing = true;
      const [x, y] = getCoords(e);
      lastX = x;
      lastY = y;
    }

    function moveDraw(e: MouseEvent | TouchEvent) {
      if (!isDrawing || !ctx) return;
      e.preventDefault();
      const [x, y] = getCoords(e);
      const penSize = parseInt(penSizeSlider?.value || '8');

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = penSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();

      lastX = x;
      lastY = y;
    }

    function stopDraw() {
      isDrawing = false;
    }

    drawCanvas.addEventListener('mousedown', startDraw);
    drawCanvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', stopDraw);

    drawCanvas.addEventListener('touchstart', startDraw, { passive: false });
    drawCanvas.addEventListener('touchmove', moveDraw, { passive: false });
    window.addEventListener('touchend', stopDraw);
  }

  if (clearGlyphBtn) {
    clearGlyphBtn.addEventListener('click', resetCanvasBackground);
  }

  if (saveGlyphBtn && drawCanvas) {
    saveGlyphBtn.addEventListener('click', () => {
      // Save canvas image as data URL
      const dataUrl = drawCanvas.toDataURL('image/png');
      glyphData[activeChar] = dataUrl;
      localStorage.setItem('toolora_handwritten_glyphs', JSON.stringify(glyphData));
      if (drawModal) drawModal.classList.add('hidden');
      renderGrid();
    });
  }

  if (closeModalBtn && drawModal) {
    closeModalBtn.addEventListener('click', () => drawModal.classList.add('hidden'));
  }

  function renderTestPreview() {
    if (!testDisplay) return;
    const text = testInput?.value || 'Quick fox 123!';
    testDisplay.innerHTML = '';

    for (const char of text) {
      if (char === ' ') {
        const space = document.createElement('span');
        space.style.display = 'inline-block';
        space.style.width = '14px';
        testDisplay.appendChild(space);
      } else if (glyphData[char]) {
        const img = document.createElement('img');
        img.src = glyphData[char];
        img.className = 'inline-block h-8 w-auto object-contain dark:invert mx-0.5 align-middle';
        testDisplay.appendChild(img);
      } else {
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'inline-block text-xl font-serif text-slate-400 mx-0.5 align-middle';
        testDisplay.appendChild(span);
      }
    }
  }

  if (testInput) {
    testInput.addEventListener('input', renderTestPreview);
  }

  if (exportFontBtn) {
    exportFontBtn.addEventListener('click', () => {
      const drawnCount = Object.keys(glyphData).length;
      if (drawnCount < 3) {
        alert('Please draw at least 3 letters before exporting font package.');
        return;
      }

      // Generate SVG Font format data
      let svgGlyphs = '';
      for (const [char, uri] of Object.entries(glyphData)) {
        svgGlyphs += `    <glyph unicode="${char}" glyph-name="glyph_${char.charCodeAt(0)}" horiz-adv-x="1000" d="M100,100 L900,100 L900,900 Z" />\n`;
      }

      const svgFont = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <font id="MyHandwritingFont" horiz-adv-x="1000">
      <font-face font-family="MyHandwritingFont" units-per-em="1000" ascent="800" descent="-200" />
      <missing-glyph horiz-adv-x="500" d="M0,0 L500,0 L500,800 L0,800 Z" />
${svgGlyphs}
    </font>
  </defs>
</svg>`;

      const blob = new Blob([svgFont], { type: 'font/svg' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MyHandwritingFont.svg';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  renderGrid();
}

document.addEventListener('DOMContentLoaded', initHandwritingToFontConverter);
