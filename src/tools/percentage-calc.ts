import { calculatePercentage } from '../utils/calcUtils.ts';

// 1. A% of B
const p1A = document.getElementById('pct1-a') as HTMLInputElement | null;
const p1B = document.getElementById('pct1-b') as HTMLInputElement | null;
const p1Res = document.getElementById('pct1-res') as HTMLElement | null;

// 2. A is what % of B
const p2A = document.getElementById('pct2-a') as HTMLInputElement | null;
const p2B = document.getElementById('pct2-b') as HTMLInputElement | null;
const p2Res = document.getElementById('pct2-res') as HTMLElement | null;

// 3. % change from A to B
const p3A = document.getElementById('pct3-a') as HTMLInputElement | null;
const p3B = document.getElementById('pct3-b') as HTMLInputElement | null;
const p3Res = document.getElementById('pct3-res') as HTMLElement | null;

// 4. A + B%
const p4A = document.getElementById('pct4-a') as HTMLInputElement | null;
const p4B = document.getElementById('pct4-b') as HTMLInputElement | null;
const p4Res = document.getElementById('pct4-res') as HTMLElement | null;

export function initPercentageCalc(): void {
  function update1() {
    const a = parseFloat(p1A?.value || '0');
    const b = parseFloat(p1B?.value || '0');
    if (p1Res) p1Res.textContent = `${calculatePercentage('percent-of', a, b)}`;
  }
  p1A?.addEventListener('input', update1);
  p1B?.addEventListener('input', update1);

  function update2() {
    const a = parseFloat(p2A?.value || '0');
    const b = parseFloat(p2B?.value || '0');
    if (p2Res) p2Res.textContent = `${Math.round(calculatePercentage('is-percent-of', a, b) * 100) / 100}%`;
  }
  p2A?.addEventListener('input', update2);
  p2B?.addEventListener('input', update2);

  function update3() {
    const a = parseFloat(p3A?.value || '0');
    const b = parseFloat(p3B?.value || '0');
    const diff = Math.round(calculatePercentage('percentage-change', a, b) * 100) / 100;
    if (p3Res) p3Res.textContent = `${diff >= 0 ? '+' : ''}${diff}%`;
  }
  p3A?.addEventListener('input', update3);
  p3B?.addEventListener('input', update3);

  function update4() {
    const a = parseFloat(p4A?.value || '0');
    const b = parseFloat(p4B?.value || '0');
    if (p4Res) p4Res.textContent = `${calculatePercentage('add-percent', a, b)}`;
  }
  p4A?.addEventListener('input', update4);
  p4B?.addEventListener('input', update4);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPercentageCalc);
} else {
  initPercentageCalc();
}
