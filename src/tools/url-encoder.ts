import { encodeUriText, decodeUriText, parseUrlComponents } from '../utils/cryptoUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const inputArea = document.getElementById('url-input') as HTMLTextAreaElement | null;
const outputArea = document.getElementById('url-output') as HTMLTextAreaElement | null;
const encodeBtn = document.getElementById('url-encode-btn') as HTMLButtonElement | null;
const decodeBtn = document.getElementById('url-decode-btn') as HTMLButtonElement | null;
const parseBtn = document.getElementById('url-parse-btn') as HTMLButtonElement | null;
const copyBtn = document.getElementById('url-copy-btn') as HTMLButtonElement | null;
const parseTable = document.getElementById('url-parse-table') as HTMLElement | null;

export function initUrlEncoder(): void {
  if (!inputArea || !outputArea) return;

  encodeBtn?.addEventListener('click', () => {
    outputArea.value = encodeUriText(inputArea.value);
    parseTable?.classList.add('hidden');
    showToast('URL Encoded!', 'success');
  });

  decodeBtn?.addEventListener('click', () => {
    outputArea.value = decodeUriText(inputArea.value);
    parseTable?.classList.add('hidden');
    showToast('URL Decoded!', 'success');
  });

  parseBtn?.addEventListener('click', () => {
    const parsed = parseUrlComponents(inputArea.value);
    if (!parsed) {
      showToast('Invalid URL format', 'error');
      return;
    }
    outputArea.value = JSON.stringify(parsed, null, 2);
    if (parseTable) {
      parseTable.classList.remove('hidden');
      parseTable.innerHTML = `
        <div class="text-xs font-mono space-y-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div><strong>Protocol:</strong> ${parsed.protocol}</div>
          <div><strong>Host:</strong> ${parsed.host}</div>
          <div><strong>Path:</strong> ${parsed.pathname}</div>
          <div><strong>Parameters:</strong> ${parsed.params.length}</div>
        </div>
      `;
    }
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
  document.addEventListener('DOMContentLoaded', initUrlEncoder);
} else {
  initUrlEncoder();
}
