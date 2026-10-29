import {
  calculateAverageColorFromData,
  calculateColorHarmonies
} from '../utils/imageUtilityTools.ts';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('avg-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('avg-drop-zone') as HTMLElement | null;
  const resultsContainer = document.getElementById('avg-results') as HTMLElement | null;
  const previewImg = document.getElementById('avg-preview-img') as HTMLImageElement | null;
  const swatchCard = document.getElementById('avg-swatch-card') as HTMLElement | null;
  const hexVal = document.getElementById('avg-hex-val') as HTMLElement | null;
  const rgbVal = document.getElementById('avg-rgb-val') as HTMLElement | null;
  const hslVal = document.getElementById('avg-hsl-val') as HTMLElement | null;
  const lumVal = document.getElementById('avg-lum-val') as HTMLElement | null;
  const harmoniesGrid = document.getElementById('avg-harmonies-grid') as HTMLElement | null;
  const copyCssBtn = document.getElementById('copy-css-btn') as HTMLButtonElement | null;
  const copyGradientBtn = document.getElementById('copy-gradient-btn') as HTMLButtonElement | null;

  if (!fileInput || !dropZone || !resultsContainer || !swatchCard) return;

  const rContainer = resultsContainer;
  const dZone = dropZone;
  const sCard = swatchCard;

  let currentAverageHex = '#000000';
  let currentCompHex = '#ffffff';

  function processImage(img: HTMLImageElement) {
    const canvas = document.createElement('canvas');
    const maxDim = 300;
    const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const avg = calculateAverageColorFromData(imgData.data);
    currentAverageHex = avg.hex;

    sCard.style.backgroundColor = avg.hex;
    sCard.style.color = avg.isDark ? '#FFFFFF' : '#0F172A';

    if (hexVal) hexVal.textContent = avg.hex;
    if (rgbVal) rgbVal.textContent = `rgb(${avg.rgb.r}, ${avg.rgb.g}, ${avg.rgb.b})`;
    if (hslVal) hslVal.textContent = `hsl(${avg.hsl.h}, ${avg.hsl.s}%, ${avg.hsl.l}%)`;
    if (lumVal) lumVal.textContent = `${Math.round(avg.luminance * 100)}% (${avg.isDark ? 'Dark Tone' : 'Light Tone'})`;

    const harmonies = calculateColorHarmonies(avg.hex);
    currentCompHex = harmonies.complementary;

    if (harmoniesGrid) {
      harmoniesGrid.innerHTML = '';
      const items = [
        { label: 'Complementary', hex: harmonies.complementary },
        { label: 'Analogous A', hex: harmonies.analogous[0] },
        { label: 'Analogous B', hex: harmonies.analogous[1] },
        { label: 'Triadic A', hex: harmonies.triadic[0] },
        { label: 'Triadic B', hex: harmonies.triadic[1] },
        { label: 'Light Shade', hex: harmonies.shades[3] }
      ];

      items.forEach((item) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className =
          'p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between h-24 transition-transform hover:scale-102 cursor-pointer';
        card.style.backgroundColor = item.hex;
        const isDark = (parseInt(item.hex.slice(1, 3), 16) * 0.299 +
          parseInt(item.hex.slice(3, 5), 16) * 0.587 +
          parseInt(item.hex.slice(5, 7), 16) * 0.114) < 128;
        card.style.color = isDark ? '#ffffff' : '#0f172a';
        card.innerHTML = `
          <span class="text-xs font-semibold opacity-80 uppercase tracking-wider">${item.label}</span>
          <span class="text-xs font-mono font-bold">${item.hex}</span>
        `;
        card.addEventListener('click', () => {
          navigator.clipboard.writeText(item.hex);
          card.classList.add('ring-2', 'ring-blue-500');
          setTimeout(() => card.classList.remove('ring-2', 'ring-blue-500'), 1000);
        });
        harmoniesGrid.appendChild(card);
      });
    }

    rContainer.classList.remove('hidden');
    dZone.classList.add('hidden');
  }

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (previewImg) previewImg.src = img.src;
        processImage(img);
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

  copyCssBtn?.addEventListener('click', () => {
    const css = `--image-average: ${currentAverageHex};`;
    navigator.clipboard.writeText(css);
    copyCssBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyCssBtn.textContent = 'Copy CSS Variable';
    }, 1500);
  });

  copyGradientBtn?.addEventListener('click', () => {
    const grad = `background: linear-gradient(135deg, ${currentAverageHex}, ${currentCompHex});`;
    navigator.clipboard.writeText(grad);
    copyGradientBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyGradientBtn.textContent = 'Copy Gradient CSS';
    }, 1500);
  });
});
