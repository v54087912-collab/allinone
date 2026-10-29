import { generateLoremIpsum } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const countInput = document.getElementById('lorem-count') as HTMLInputElement | null;
const typeSelect = document.getElementById('lorem-type') as HTMLSelectElement | null;
const startCheck = document.getElementById('lorem-start') as HTMLInputElement | null;
const generateBtn = document.getElementById('lorem-generate-btn') as HTMLButtonElement | null;
const outputArea = document.getElementById('lorem-output') as HTMLTextAreaElement | null;
const copyBtn = document.getElementById('lorem-copy-btn') as HTMLButtonElement | null;

export function initLoremIpsum(): void {
  if (!outputArea) return;

  function doGenerate() {
    const count = parseInt(countInput?.value || '3', 10);
    const type = (typeSelect?.value || 'paragraphs') as 'paragraphs' | 'sentences' | 'words';
    const startLorem = startCheck?.checked ?? true;
    outputArea!.value = generateLoremIpsum(count, type, startLorem);
  }

  generateBtn?.addEventListener('click', doGenerate);
  copyBtn?.addEventListener('click', () => {
    if (!outputArea.value) return;
    navigator.clipboard.writeText(outputArea.value).then(
      () => showToast('Lorem ipsum copied!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  doGenerate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoremIpsum);
} else {
  initLoremIpsum();
}
