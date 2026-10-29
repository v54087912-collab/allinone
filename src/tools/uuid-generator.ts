import { generateUuids } from '../utils/cryptoUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const qtySelect = document.getElementById('uuid-qty') as HTMLSelectElement | null;
const formatSelect = document.getElementById('uuid-format') as HTMLSelectElement | null;
const generateBtn = document.getElementById('uuid-gen-btn') as HTMLButtonElement | null;
const outputArea = document.getElementById('uuid-output') as HTMLTextAreaElement | null;
const copyBtn = document.getElementById('uuid-copy-btn') as HTMLButtonElement | null;

export function initUuidGen(): void {
  if (!outputArea) return;

  function doGenerate() {
    const qty = parseInt(qtySelect?.value || '1', 10);
    const fmt = (formatSelect?.value || 'standard') as 'standard' | 'nohyphen' | 'uppercase';
    const uuids = generateUuids(qty, fmt);
    outputArea!.value = uuids.join('\n');
  }

  generateBtn?.addEventListener('click', doGenerate);
  copyBtn?.addEventListener('click', () => {
    if (!outputArea.value) return;
    navigator.clipboard.writeText(outputArea.value).then(
      () => showToast('UUIDs copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  doGenerate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUuidGen);
} else {
  initUuidGen();
}
