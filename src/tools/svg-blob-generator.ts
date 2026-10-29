import { generateSvgBlobPath } from '../utils/imageUtilityTools.ts';

document.addEventListener('DOMContentLoaded', () => {
  const previewContainer = document.getElementById('blob-preview') as HTMLElement | null;
  const pointsSlider = document.getElementById('blob-points') as HTMLInputElement | null;
  const randomSlider = document.getElementById('blob-randomness') as HTMLInputElement | null;
  const sizeSlider = document.getElementById('blob-size') as HTMLInputElement | null;
  const fillModeSelect = document.getElementById('blob-fill-mode') as HTMLSelectElement | null;
  const color1Input = document.getElementById('blob-color-1') as HTMLInputElement | null;
  const color2Input = document.getElementById('blob-color-2') as HTMLInputElement | null;
  const gradAngleSlider = document.getElementById('blob-grad-angle') as HTMLInputElement | null;
  const strokeWidthSlider = document.getElementById('blob-stroke-width') as HTMLInputElement | null;
  const randomizeBtn = document.getElementById('blob-random-btn') as HTMLButtonElement | null;
  const copySvgBtn = document.getElementById('copy-svg-code-btn') as HTMLButtonElement | null;
  const copyCssBtn = document.getElementById('copy-blob-css-btn') as HTMLButtonElement | null;
  const downloadSvgBtn = document.getElementById('download-blob-svg-btn') as HTMLButtonElement | null;

  if (!previewContainer) return;

  let currentSeed = Math.floor(Math.random() * 10000);
  let currentSvgMarkup = '';

  function renderBlob() {
    const points = Number(pointsSlider?.value || 6);
    const randomness = Number(randomSlider?.value || 40) / 100;
    const size = Number(sizeSlider?.value || 380);
    const mode = fillModeSelect?.value || 'gradient';
    const c1 = color1Input?.value || '#3b82f6';
    const c2 = color2Input?.value || '#8b5cf6';
    const angle = Number(gradAngleSlider?.value || 45);
    const strokeWidth = Number(strokeWidthSlider?.value || 0);

    const pathD = generateSvgBlobPath(points, randomness, size, currentSeed);

    let defs = '';
    let fillAttr = c1;

    if (mode === 'gradient') {
      const rad = (angle * Math.PI) / 180;
      const x1 = Math.round(50 - Math.cos(rad) * 50);
      const y1 = Math.round(50 - Math.sin(rad) * 50);
      const x2 = Math.round(50 + Math.cos(rad) * 50);
      const y2 = Math.round(50 + Math.sin(rad) * 50);

      defs = `
        <defs>
          <linearGradient id="blobGrad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
            <stop offset="0%" stop-color="${c1}" />
            <stop offset="100%" stop-color="${c2}" />
          </linearGradient>
        </defs>
      `;
      fillAttr = 'url(#blobGrad)';
    } else if (mode === 'outline') {
      fillAttr = 'none';
    }

    const strokeAttr = strokeWidth > 0 ? `stroke="${c1}" stroke-width="${strokeWidth}"` : '';

    currentSvgMarkup = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">
        ${defs}
        <path d="${pathD}" fill="${fillAttr}" ${strokeAttr} />
      </svg>
    `.trim();

    if (previewContainer) {
      previewContainer.innerHTML = currentSvgMarkup;
    }
  }

  [
    pointsSlider,
    randomSlider,
    sizeSlider,
    fillModeSelect,
    color1Input,
    color2Input,
    gradAngleSlider,
    strokeWidthSlider
  ].forEach((ctrl) => {
    ctrl?.addEventListener('input', renderBlob);
    ctrl?.addEventListener('change', renderBlob);
  });

  randomizeBtn?.addEventListener('click', () => {
    currentSeed = Math.floor(Math.random() * 100000);
    renderBlob();
  });

  copySvgBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(currentSvgMarkup);
    copySvgBtn.textContent = 'SVG Copied!';
    setTimeout(() => {
      copySvgBtn.textContent = 'Copy SVG Code';
    }, 1200);
  });

  copyCssBtn?.addEventListener('click', () => {
    const encoded = encodeURIComponent(currentSvgMarkup)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
    const css = `background-image: url("data:image/svg+xml;utf8,${encoded}");`;
    navigator.clipboard.writeText(css);
    copyCssBtn.textContent = 'CSS Copied!';
    setTimeout(() => {
      copyCssBtn.textContent = 'Copy CSS Data URI';
    }, 1200);
  });

  downloadSvgBtn?.addEventListener('click', () => {
    const blob = new Blob([currentSvgMarkup], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `blob-${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  });

  renderBlob();
});
