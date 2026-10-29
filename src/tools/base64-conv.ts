import { encodeBase64, decodeBase64 } from '../utils/cryptoUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const inputArea = document.getElementById('b64-input') as HTMLTextAreaElement | null;
const outputArea = document.getElementById('b64-output') as HTMLTextAreaElement | null;
const encodeBtn = document.getElementById('b64-encode-btn') as HTMLButtonElement | null;
const decodeBtn = document.getElementById('b64-decode-btn') as HTMLButtonElement | null;
const copyBtn = document.getElementById('b64-copy-btn') as HTMLButtonElement | null;
const fileInput = document.getElementById('b64-file-input') as HTMLInputElement | null;

export function initBase64Conv(): void {
  if (!inputArea || !outputArea) return;

  encodeBtn?.addEventListener('click', () => {
    try {
      outputArea.value = encodeBase64(inputArea.value);
      showToast('Encoded to Base64!', 'success');
    } catch {
      showToast('Encoding error', 'error');
    }
  });

  decodeBtn?.addEventListener('click', () => {
    try {
      outputArea.value = decodeBase64(inputArea.value);
      showToast('Decoded from Base64!', 'success');
    } catch {
      showToast('Invalid Base64 input', 'error');
    }
  });

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      outputArea.value = reader.result as string;
      showToast(`Encoded ${file.name} to Base64 Data URL!`, 'success');
    };
    reader.readAsDataURL(file);
  });

  copyBtn?.addEventListener('click', () => {
    if (!outputArea.value) return;
    navigator.clipboard.writeText(outputArea.value).then(
      () => showToast('Copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBase64Conv);
} else {
  initBase64Conv();
}
