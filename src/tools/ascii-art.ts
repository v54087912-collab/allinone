import { convertPixelsToAscii, ASCII_CHAR_SETS } from '../utils/designUtils.ts';
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
