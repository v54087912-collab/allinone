import { calculateContrastRatio } from '../utils/designUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initContrastChecker(): void {
  const fgColor = document.getElementById('contrast-fg') as HTMLInputElement | null;
  const fgHex = document.getElementById('contrast-fg-hex') as HTMLInputElement | null;
  const bgColor = document.getElementById('contrast-bg') as HTMLInputElement | null;
  const bgHex = document.getElementById('contrast-bg-hex') as HTMLInputElement | null;
  const swapBtn = document.getElementById('contrast-swap-btn') as HTMLButtonElement | null;

  const previewBox = document.getElementById('contrast-preview-box');
  const previewText = document.querySelectorAll('.contrast-preview-text');
  const ratioBadge = document.getElementById('contrast-ratio-badge');
  const scoreBadge = document.getElementById('contrast-score-badge');

  const aaNormal = document.getElementById('status-aa-normal');
  const aaLarge = document.getElementById('status-aa-large');
  const aaaNormal = document.getElementById('status-aaa-normal');
  const aaaLarge = document.getElementById('status-aaa-large');

  function update() {
    const fg = fgHex?.value || '#000000';
    const bg = bgHex?.value || '#FFFFFF';

    if (fgColor) fgColor.value = fg;
    if (bgColor) bgColor.value = bg;

    if (previewBox) previewBox.style.backgroundColor = bg;
    previewText.forEach((el) => {
      (el as HTMLElement).style.color = fg;
    });

    const res = calculateContrastRatio(fg, bg);
    if (ratioBadge) ratioBadge.textContent = res.ratioFormatted;
    if (scoreBadge) {
      scoreBadge.textContent = res.score;
      const colorMap = {
        Excellent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        Good: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
        Fair: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        Poor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      };
      scoreBadge.className = `px-3 py-1 rounded-full text-xs font-bold uppercase ${colorMap[res.score]}`;
    }

    const setStatus = (el: HTMLElement | null, pass: boolean) => {
      if (!el) return;
      el.textContent = pass ? 'PASS' : 'FAIL';
      el.className = `px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${pass ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`;
    };

    setStatus(aaNormal, res.aaNormal);
    setStatus(aaLarge, res.aaLarge);
    setStatus(aaaNormal, res.aaaNormal);
    setStatus(aaaLarge, res.aaaLarge);
  }

  fgColor?.addEventListener('input', () => {
    if (fgHex && fgColor) fgHex.value = fgColor.value.toUpperCase();
    update();
  });
  fgHex?.addEventListener('input', () => {
    let val = fgHex.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      if (fgColor) fgColor.value = val;
      update();
    }
  });

  bgColor?.addEventListener('input', () => {
    if (bgHex && bgColor) bgHex.value = bgColor.value.toUpperCase();
    update();
  });
  bgHex?.addEventListener('input', () => {
    let val = bgHex.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      if (bgColor) bgColor.value = val;
      update();
    }
  });

  swapBtn?.addEventListener('click', () => {
    const temp = fgHex?.value || '#000000';
    if (fgHex && bgHex) {
      fgHex.value = bgHex.value;
      bgHex.value = temp;
    }
    update();
    showToast('Colors swapped!', 'info');
  });

  // Preset buttons
  document.querySelectorAll<HTMLButtonElement>('[data-contrast-pair]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pair = btn.getAttribute('data-contrast-pair')?.split(',') || [];
      if (pair.length === 2) {
        if (fgHex) fgHex.value = pair[0].toUpperCase();
        if (bgHex) bgHex.value = pair[1].toUpperCase();
        update();
      }
    });
  });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContrastChecker);
} else {
  initContrastChecker();
}
