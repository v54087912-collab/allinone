import { showToast } from '../shared/site-shell.ts';

export function initGradientGenerator(): void {
  const previewBox = document.getElementById('grad-preview');
  const typeSelect = document.getElementById('grad-type') as HTMLSelectElement | null;
  const angleSlider = document.getElementById('grad-angle') as HTMLInputElement | null;
  const angleVal = document.getElementById('grad-angle-val') as HTMLElement | null;
  const angleWrap = document.getElementById('grad-angle-wrap');
  const color1 = document.getElementById('grad-color-1') as HTMLInputElement | null;
  const color2 = document.getElementById('grad-color-2') as HTMLInputElement | null;
  const color3 = document.getElementById('grad-color-3') as HTMLInputElement | null;
  const hex1 = document.getElementById('grad-hex-1') as HTMLInputElement | null;
  const hex2 = document.getElementById('grad-hex-2') as HTMLInputElement | null;
  const hex3 = document.getElementById('grad-hex-3') as HTMLInputElement | null;
  const cssOutput = document.getElementById('grad-css-output') as HTMLTextAreaElement | null;
  const copyBtn = document.getElementById('grad-copy-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('grad-download-btn') as HTMLButtonElement | null;
  const randomBtn = document.getElementById('grad-random-btn') as HTMLButtonElement | null;

  if (!previewBox) return;

  function buildCss(): string {
    const type = typeSelect?.value || 'linear';
    const angle = angleSlider?.value || '135';
    const c1 = color1?.value || '#3b82f6';
    const c2 = color2?.value || '#8b5cf6';
    const c3 = color3?.value || '#ec4899';

    if (type === 'linear') {
      return `background: linear-gradient(${angle}deg, ${c1} 0%, ${c2} 50%, ${c3} 100%);`;
    } else if (type === 'radial') {
      return `background: radial-gradient(circle at center, ${c1} 0%, ${c2} 60%, ${c3} 100%);`;
    } else {
      return `background: conic-gradient(from ${angle}deg, ${c1}, ${c2}, ${c3}, ${c1});`;
    }
  }

  function update() {
    const css = buildCss();
    if (previewBox) {
      const gradVal = css.replace('background: ', '').replace(';', '');
      previewBox.style.background = gradVal;
    }
    if (cssOutput) cssOutput.value = css;
    if (angleVal && angleSlider) angleVal.textContent = `${angleSlider.value}°`;
    if (angleWrap) {
      angleWrap.style.display = typeSelect?.value === 'radial' ? 'none' : 'flex';
    }
    if (hex1 && color1) hex1.value = color1.value.toUpperCase();
    if (hex2 && color2) hex2.value = color2.value.toUpperCase();
    if (hex3 && color3) hex3.value = color3.value.toUpperCase();
  }

  [typeSelect, angleSlider, color1, color2, color3].forEach((el) => {
    el?.addEventListener('input', update);
    el?.addEventListener('change', update);
  });

  const setupHexInput = (hexInput: HTMLInputElement | null, colorInput: HTMLInputElement | null) => {
    hexInput?.addEventListener('input', () => {
      let val = hexInput.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9A-Fa-f]{6}$/.test(val) && colorInput) {
        colorInput.value = val;
        update();
      }
    });
  };
  setupHexInput(hex1, color1);
  setupHexInput(hex2, color2);
  setupHexInput(hex3, color3);

  copyBtn?.addEventListener('click', () => {
    if (!cssOutput) return;
    navigator.clipboard.writeText(cssOutput.value).then(() => showToast('CSS copied to clipboard!', 'success'));
  });

  randomBtn?.addEventListener('click', () => {
    const randHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    if (color1) color1.value = randHex();
    if (color2) color2.value = randHex();
    if (color3) color3.value = randHex();
    if (angleSlider) angleSlider.value = String(Math.floor(Math.random() * 360));
    update();
  });

  // Preset buttons
  document.querySelectorAll<HTMLButtonElement>('[data-grad-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const colors = btn.getAttribute('data-grad-preset')?.split(',') || [];
      if (colors[0] && color1) color1.value = colors[0];
      if (colors[1] && color2) color2.value = colors[1];
      if (colors[2] && color3) color3.value = colors[2];
      update();
    });
  });

  downloadBtn?.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const type = typeSelect?.value || 'linear';
    const c1 = color1?.value || '#3b82f6';
    const c2 = color2?.value || '#8b5cf6';
    const c3 = color3?.value || '#ec4899';

    if (type === 'radial') {
      const grad = ctx.createRadialGradient(960, 540, 50, 960, 540, 960);
      grad.addColorStop(0, c1);
      grad.addColorStop(0.5, c2);
      grad.addColorStop(1, c3);
      ctx.fillStyle = grad;
    } else {
      const rad = ((parseInt(angleSlider?.value || '135', 10) - 90) * Math.PI) / 180;
      const x1 = 960 - Math.cos(rad) * 960;
      const y1 = 540 - Math.sin(rad) * 540;
      const x2 = 960 + Math.cos(rad) * 960;
      const y2 = 540 + Math.sin(rad) * 540;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, c1);
      grad.addColorStop(0.5, c2);
      grad.addColorStop(1, c3);
      ctx.fillStyle = grad;
    }
    ctx.fillRect(0, 0, 1920, 1080);

    const a = document.createElement('a');
    a.download = 'gradient-wallpaper.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('High-res wallpaper downloaded!', 'success');
  });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGradientGenerator);
} else {
  initGradientGenerator();
}
