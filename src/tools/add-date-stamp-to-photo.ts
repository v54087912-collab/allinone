import { formatPhotoDateStamp } from '../utils/imageUtilityTools.ts';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('date-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('date-drop-zone') as HTMLElement | null;
  const previewContainer = document.getElementById('date-editor') as HTMLElement | null;
  const canvas = document.getElementById('date-canvas') as HTMLCanvasElement | null;
  const dateInput = document.getElementById('stamp-date-input') as HTMLInputElement | null;
  const formatSelect = document.getElementById('stamp-format-select') as HTMLSelectElement | null;
  const customTextInput = document.getElementById('custom-stamp-text') as HTMLInputElement | null;
  const colorSelect = document.getElementById('stamp-color-select') as HTMLSelectElement | null;
  const customColorInput = document.getElementById('custom-stamp-color') as HTMLInputElement | null;
  const positionSelect = document.getElementById('stamp-pos-select') as HTMLSelectElement | null;
  const sizeSlider = document.getElementById('stamp-size-slider') as HTMLInputElement | null;
  const glowSlider = document.getElementById('stamp-glow-slider') as HTMLInputElement | null;
  const opacitySlider = document.getElementById('stamp-opacity-slider') as HTMLInputElement | null;
  const fontStyleSelect = document.getElementById('stamp-font-style') as HTMLSelectElement | null;
  const downloadBtn = document.getElementById('download-date-btn') as HTMLButtonElement | null;

  // Preset buttons
  const retro90sBtn = document.getElementById('preset-90s-btn') as HTMLButtonElement | null;
  const y2kBtn = document.getElementById('preset-y2k-btn') as HTMLButtonElement | null;
  const todayBtn = document.getElementById('preset-today-btn') as HTMLButtonElement | null;

  if (!fileInput || !dropZone || !previewContainer || !canvas || !downloadBtn) return;

  const cvs = canvas;
  const ctx = cvs.getContext('2d');
  let currentImg: HTMLImageElement | null = null;

  // Default to today's date
  if (dateInput) {
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
  }

  function getStampText(): string {
    if (customTextInput && customTextInput.value.trim()) {
      return customTextInput.value.trim();
    }
    const dateVal = dateInput?.value ? new Date(dateInput.value + 'T12:00:00') : new Date();
    const format = formatSelect?.value || 'short-y-m-d';
    return formatPhotoDateStamp(dateVal, format);
  }

  function getStampColor(): string {
    const sel = colorSelect?.value || 'orange';
    if (sel === 'orange') return '#ff7700';
    if (sel === 'amber') return '#ffb700';
    if (sel === 'red') return '#ff2222';
    if (sel === 'green') return '#33ff33';
    if (sel === 'white') return '#ffffff';
    if (sel === 'custom' && customColorInput) return customColorInput.value;
    return '#ff7700';
  }

  function render() {
    if (!currentImg || !ctx) return;

    cvs.width = currentImg.width;
    cvs.height = currentImg.height;

    // Draw base image
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.drawImage(currentImg, 0, 0);

    const text = getStampText();
    const color = getStampColor();
    const pos = positionSelect?.value || 'bottom-right';
    const fontScale = Number(sizeSlider?.value || 30) / 1000;
    const fontSize = Math.max(16, Math.round(cvs.width * fontScale));
    const glowLevel = Number(glowSlider?.value || 6);
    const opacity = Number(opacitySlider?.value || 90) / 100;
    const fontChoice = fontStyleSelect?.value || 'digital';

    ctx.save();
    ctx.globalAlpha = opacity;

    // Font stack
    let fontFamily = '"Courier New", Courier, monospace';
    if (fontChoice === 'digital') {
      fontFamily = '"Consolas", "Courier New", monospace';
    } else if (fontChoice === 'dotmatrix') {
      fontFamily = '"Lucida Console", Monaco, monospace';
    } else if (fontChoice === 'impact') {
      fontFamily = 'Impact, "Arial Black", sans-serif';
    }

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textAlign = pos.includes('left') ? 'left' : 'right';
    ctx.textBaseline = pos.includes('top') ? 'top' : 'bottom';

    const marginX = Math.round(cvs.width * 0.04);
    const marginY = Math.round(cvs.height * 0.04);

    let x = pos.includes('left') ? marginX : cvs.width - marginX;
    let y = pos.includes('top') ? marginY : cvs.height - marginY;

    // Outer Neon Glow
    if (glowLevel > 0) {
      ctx.shadowColor = color;
      ctx.shadowBlur = glowLevel * 3;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);

    // Subtle dark under-stroke for readable contrast on bright backgrounds
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = Math.max(1, fontSize * 0.04);
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);

    ctx.restore();
  }

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImg = img;
        dropZone?.classList.add('hidden');
        previewContainer?.classList.remove('hidden');
        render();
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

  [
    dateInput,
    formatSelect,
    customTextInput,
    colorSelect,
    customColorInput,
    positionSelect,
    sizeSlider,
    glowSlider,
    opacitySlider,
    fontStyleSelect
  ].forEach((ctrl) => {
    ctrl?.addEventListener('input', render);
    ctrl?.addEventListener('change', render);
  });

  retro90sBtn?.addEventListener('click', () => {
    if (customTextInput) customTextInput.value = '';
    if (dateInput) dateInput.value = '1998-10-28';
    if (formatSelect) formatSelect.value = 'short-y-m-d';
    if (colorSelect) colorSelect.value = 'orange';
    render();
  });

  y2kBtn?.addEventListener('click', () => {
    if (customTextInput) customTextInput.value = '';
    if (dateInput) dateInput.value = '2001-12-31';
    if (formatSelect) formatSelect.value = 'y2k';
    if (colorSelect) colorSelect.value = 'amber';
    render();
  });

  todayBtn?.addEventListener('click', () => {
    if (customTextInput) customTextInput.value = '';
    const now = new Date();
    if (dateInput) dateInput.value = now.toISOString().split('T')[0];
    if (formatSelect) formatSelect.value = 'short-y-m-d';
    render();
  });

  downloadBtn.addEventListener('click', () => {
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.download = `date-stamped-${Date.now()}.jpg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/jpeg', 0.95);
  });
});
