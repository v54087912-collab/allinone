import { encodeHtmlEntities, decodeHtmlEntities } from '../utils/devUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_TEXT = `<div class="card" id="main">
  <h1>Welcome & "Greetings" to Toolora's World!</h1>
  <p>Price: $19.99 & Free Shipping (1 < 2 & 5 > 3)</p>
</div>`;

export function initHtmlEntityEncoder(): void {
  const inputEl = document.getElementById('entity-input') as HTMLTextAreaElement | null;
  const outputEl = document.getElementById('entity-output') as HTMLTextAreaElement | null;
  const optFull = document.getElementById('opt-full') as HTMLInputElement | null;

  const btnEncode = document.getElementById('btn-encode') as HTMLButtonElement | null;
  const btnDecode = document.getElementById('btn-decode') as HTMLButtonElement | null;
  const btnSample = document.getElementById('btn-sample') as HTMLButtonElement | null;
  const btnClear = document.getElementById('btn-clear') as HTMLButtonElement | null;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;

  if (!inputEl || !outputEl) return;

  function doEncode(): void {
    if (!inputEl || !outputEl) return;
    const text = inputEl.value;
    const isFull = optFull?.checked ?? false;
    outputEl.value = encodeHtmlEntities(text, isFull);
    showToast('Encoded to HTML Entities!', 'info');
  }

  function doDecode(): void {
    if (!inputEl || !outputEl) return;
    const text = inputEl.value;
    outputEl.value = decodeHtmlEntities(text);
    showToast('Decoded HTML Entities!', 'info');
  }

  btnEncode?.addEventListener('click', doEncode);
  btnDecode?.addEventListener('click', doDecode);

  btnSample?.addEventListener('click', () => {
    inputEl.value = SAMPLE_TEXT;
    doEncode();
  });

  btnClear?.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
  });

  btnCopy?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(outputEl.value).then(
      () => showToast('Entities copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  if (!inputEl.value) {
    inputEl.value = SAMPLE_TEXT;
  }
  doEncode();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHtmlEntityEncoder);
} else {
  initHtmlEntityEncoder();
}
