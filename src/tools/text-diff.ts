import { computeTextDiff } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const origInput = document.getElementById('diff-orig') as HTMLTextAreaElement | null;
const modInput = document.getElementById('diff-mod') as HTMLTextAreaElement | null;
const compareBtn = document.getElementById('diff-compare-btn') as HTMLButtonElement | null;
const swapBtn = document.getElementById('diff-swap-btn') as HTMLButtonElement | null;
const sampleBtn = document.getElementById('diff-sample-btn') as HTMLButtonElement | null;
const outputWrap = document.getElementById('diff-output') as HTMLElement | null;

export function initTextDiff(): void {
  if (!origInput || !modInput || !outputWrap) return;

  function doCompare() {
    const orig = origInput?.value || '';
    const mod = modInput?.value || '';
    const diff = computeTextDiff(orig, mod);

    outputWrap!.innerHTML = '';
    diff.forEach((d) => {
      const line = document.createElement('div');
      line.className = 'px-3 py-1 font-mono text-xs rounded leading-relaxed ';
      if (d.type === 'same') {
        line.className += 'text-slate-700 dark:text-slate-300';
        line.textContent = '  ' + d.value;
      } else if (d.type === 'added') {
        line.className += 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-l-4 border-emerald-500 font-semibold';
        line.textContent = '+ ' + d.value;
      } else if (d.type === 'removed') {
        line.className += 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-l-4 border-rose-500 line-through';
        line.textContent = '- ' + d.value;
      }
      outputWrap!.appendChild(line);
    });
    showToast('Differences computed!', 'info');
  }

  compareBtn?.addEventListener('click', doCompare);
  swapBtn?.addEventListener('click', () => {
    const tmp = origInput.value;
    origInput.value = modInput.value;
    modInput.value = tmp;
    doCompare();
  });
  sampleBtn?.addEventListener('click', () => {
    origInput.value = 'QuickPic Studio is an image editor.\nIt runs 100% in-browser.\nFeatures: Crop and Compress.';
    modInput.value = 'Toolora is a complete utility suite.\nIt runs 100% in-browser.\nFeatures: Crop, Compress, and Text Tools.\nZero server uploads.';
    doCompare();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTextDiff);
} else {
  initTextDiff();
}
