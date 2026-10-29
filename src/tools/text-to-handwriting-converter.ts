/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HANDWRITING_FONTS, PAPER_PRESETS } from '../utils/handwritingUtils.ts';
import { PDFDocument } from 'pdf-lib';

export function initTextToHandwritingConverter(): void {
  const textInput = document.getElementById('handwriting-text') as HTMLTextAreaElement | null;
  const fontSelect = document.getElementById('font-select') as HTMLSelectElement | null;
  const customFontInput = document.getElementById('custom-font-input') as HTMLInputElement | null;
  const paperSelect = document.getElementById('paper-select') as HTMLSelectElement | null;
  const inkColorInput = document.getElementById('ink-color') as HTMLInputElement | null;
  const fontSizeSlider = document.getElementById('font-size') as HTMLInputElement | null;
  const lineSpacingSlider = document.getElementById('line-spacing') as HTMLInputElement | null;
  const paperCanvas = document.getElementById('paper-canvas') as HTMLCanvasElement | null;
  const downloadPngBtn = document.getElementById('download-png-btn') as HTMLButtonElement | null;
  const downloadPdfBtn = document.getElementById('download-pdf-btn') as HTMLButtonElement | null;
  const customFontLabel = document.getElementById('custom-font-name') as HTMLSpanElement | null;

  let loadedFonts: Record<string, boolean> = {};
  let currentFontFamily = 'Antony Lark';

  // Load the 7 built-in handwriting fonts via FontFace API
  HANDWRITING_FONTS.forEach(f => {
    const font = new FontFace(f.name, `url(${f.file})`);
    font.load().then(loaded => {
      document.fonts.add(loaded);
      loadedFonts[f.name] = true;
      if (currentFontFamily === f.name) {
        renderHandwriting();
      }
    }).catch(e => console.warn('Could not load font', f.name, e));
  });

  // Handle custom uploaded fonts
  if (customFontInput) {
    customFontInput.addEventListener('change', async () => {
      if (!customFontInput.files?.length) return;
      const file = customFontInput.files[0];
      const fontName = file.name.replace(/\.[^/.]+$/, '');
      const buffer = await file.arrayBuffer();
      try {
        const customFont = new FontFace(fontName, buffer);
        const loaded = await customFont.load();
        document.fonts.add(loaded);
        loadedFonts[fontName] = true;

        // Add to select
        if (fontSelect) {
          const opt = document.createElement('option');
          opt.value = fontName;
          opt.textContent = `Custom: ${fontName}`;
          opt.selected = true;
          fontSelect.appendChild(opt);
        }
        currentFontFamily = fontName;
        if (customFontLabel) {
          customFontLabel.textContent = `Loaded: ${file.name}`;
          customFontLabel.classList.remove('hidden');
        }
        renderHandwriting();
      } catch (err: any) {
        alert('Could not load custom font file: ' + err.message);
      }
    });
  }

  function renderHandwriting() {
    if (!paperCanvas) return;
    const ctx = paperCanvas.getContext('2d');
    if (!ctx) return;

    // Standard A4 aspect ratio canvas (800 x 1130)
    const w = 800;
    const h = 1130;
    paperCanvas.width = w;
    paperCanvas.height = h;

    const paperId = paperSelect?.value || 'ruled';
    const paper = PAPER_PRESETS.find(p => p.id === paperId) || PAPER_PRESETS[0];
    const ink = inkColorInput?.value || '#1d4ed8';
    const fontSize = parseInt(fontSizeSlider?.value || '24');
    const lineSpacing = parseInt(lineSpacingSlider?.value || '40');

    // 1. Draw Paper Background
    ctx.fillStyle = paper.bgColor;
    ctx.fillRect(0, 0, w, h);

    const marginX = 80;
    const startY = 100;

    // 2. Draw Paper Horizontal Rules & Margin Line
    if (paper.hasRules) {
      ctx.strokeStyle = paper.lineColor;
      ctx.lineWidth = 1;
      for (let y = startY; y < h - 40; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(marginX - 20, y);
        ctx.lineTo(w - 40, y);
        ctx.stroke();
      }
    }

    if (paper.hasMargin && paper.marginColor) {
      ctx.strokeStyle = paper.marginColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(marginX, 0);
      ctx.lineTo(marginX, h);
      ctx.stroke();
    }

    // 3. Render Text
    const rawText = textInput?.value || 'Handwriting is an art that reflects individuality and care.\n\nPractice makes perfect!';
    const selectedFont = fontSelect?.value || 'Antony Lark';
    currentFontFamily = selectedFont;

    ctx.font = `${fontSize}px "${currentFontFamily}", cursive, sans-serif`;
    ctx.fillStyle = ink;
    ctx.textBaseline = 'bottom';

    const maxTextWidth = w - marginX - 60;
    const paragraphs = rawText.split('\n');
    let currentY = startY + lineSpacing - 6;

    paragraphs.forEach(para => {
      if (!para.trim()) {
        currentY += lineSpacing;
        return;
      }

      const words = para.split(' ');
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + ' ';
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxTextWidth && i > 0) {
          // Slight natural handwriting baseline jitter (±1.5px)
          const jitter = (Math.random() - 0.5) * 2;
          ctx.fillText(currentLine.trim(), marginX + 10, currentY + jitter);
          currentLine = words[i] + ' ';
          currentY += lineSpacing;
          if (currentY > h - 40) break; // Overflow clamp
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine && currentY <= h - 40) {
        const jitter = (Math.random() - 0.5) * 2;
        ctx.fillText(currentLine.trim(), marginX + 10, currentY + jitter);
        currentY += lineSpacing;
      }
    });
  }

  [textInput, fontSelect, paperSelect, inkColorInput, fontSizeSlider, lineSpacingSlider].forEach(el => {
    el?.addEventListener('input', renderHandwriting);
  });

  if (downloadPngBtn && paperCanvas) {
    downloadPngBtn.addEventListener('click', () => {
      const url = paperCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `handwritten-notes-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    });
  }

  if (downloadPdfBtn && paperCanvas) {
    downloadPdfBtn.addEventListener('click', async () => {
      downloadPdfBtn.disabled = true;
      downloadPdfBtn.textContent = 'Generating PDF...';

      try {
        const pngDataUrl = paperCanvas.toDataURL('image/png');
        const pngImageBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer());

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([paperCanvas.width, paperCanvas.height]);
        const pngImage = await pdfDoc.embedPng(pngImageBytes);

        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: paperCanvas.width,
          height: paperCanvas.height
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `handwritten-document-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err: any) {
        alert('Could not generate PDF: ' + err.message);
      } finally {
        downloadPdfBtn.disabled = false;
        downloadPdfBtn.textContent = 'Download as PDF';
      }
    });
  }

  // Initial draw
  setTimeout(renderHandwriting, 150);
}

document.addEventListener('DOMContentLoaded', initTextToHandwritingConverter);
