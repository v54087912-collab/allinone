import { computeHash } from '../utils/devUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initHashGenerator(): void {
  const textInput = document.getElementById('hash-text-input') as HTMLTextAreaElement | null;
  const fileDropzone = document.getElementById('hash-file-dropzone') as HTMLElement | null;
  const fileInput = document.getElementById('hash-file-input') as HTMLInputElement | null;
  const optUpper = document.getElementById('opt-upper') as HTMLInputElement | null;

  const md5El = document.getElementById('hash-md5') as HTMLInputElement | null;
  const sha1El = document.getElementById('hash-sha1') as HTMLInputElement | null;
  const sha256El = document.getElementById('hash-sha256') as HTMLInputElement | null;
  const sha384El = document.getElementById('hash-sha384') as HTMLInputElement | null;
  const sha512El = document.getElementById('hash-sha512') as HTMLInputElement | null;

  const fileNameEl = document.getElementById('hash-file-name') as HTMLElement | null;
  const btnSample = document.getElementById('btn-sample') as HTMLButtonElement | null;
  const btnClear = document.getElementById('btn-clear') as HTMLButtonElement | null;

  if (!textInput) return;

  async function updateHashes(data: string | ArrayBuffer) {
    const isUpper = optUpper?.checked ?? false;

    const [md5H, sha1H, sha256H, sha384H, sha512H] = await Promise.all([
      computeHash(data, 'MD5'),
      computeHash(data, 'SHA-1'),
      computeHash(data, 'SHA-256'),
      computeHash(data, 'SHA-384'),
      computeHash(data, 'SHA-512'),
    ]);

    const format = (h: string) => (isUpper ? h.toUpperCase() : h.toLowerCase());

    if (md5El) md5El.value = format(md5H);
    if (sha1El) sha1El.value = format(sha1H);
    if (sha256El) sha256El.value = format(sha256H);
    if (sha384El) sha384El.value = format(sha384H);
    if (sha512El) sha512El.value = format(sha512H);
  }

  function handleTextInput() {
    if (!textInput) return;
    if (fileNameEl) fileNameEl.textContent = '';
    const text = textInput.value;
    if (!text) {
      clearHashes();
      return;
    }
    updateHashes(text);
  }

  function clearHashes() {
    if (md5El) md5El.value = '';
    if (sha1El) sha1El.value = '';
    if (sha256El) sha256El.value = '';
    if (sha384El) sha384El.value = '';
    if (sha512El) sha512El.value = '';
  }

  function handleFile(file: File) {
    if (fileNameEl) fileNameEl.textContent = `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    if (textInput) textInput.value = '';

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (buffer) {
        updateHashes(buffer);
        showToast(`Calculated hashes for ${file.name}!`, 'success');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  textInput.addEventListener('input', handleTextInput);
  optUpper?.addEventListener('change', () => {
    if (textInput.value) {
      handleTextInput();
    }
  });

  fileDropzone?.addEventListener('click', () => fileInput?.click());
  fileDropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropzone.classList.add('border-blue-500', 'bg-blue-50/50');
  });
  fileDropzone?.addEventListener('dragleave', () => {
    fileDropzone.classList.remove('border-blue-500', 'bg-blue-50/50');
  });
  fileDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropzone.classList.remove('border-blue-500', 'bg-blue-50/50');
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      handleFile(fileInput.files[0]);
    }
  });

  btnSample?.addEventListener('click', () => {
    textInput.value = 'Toolora 100% Private Offline Utilities';
    handleTextInput();
    showToast('Loaded sample text!', 'info');
  });

  btnClear?.addEventListener('click', () => {
    textInput.value = '';
    if (fileNameEl) fileNameEl.textContent = '';
    clearHashes();
  });

  // Attach individual copy buttons
  document.querySelectorAll<HTMLButtonElement>('[data-copy-hash]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-hash');
      const input = document.getElementById(targetId || '') as HTMLInputElement | null;
      if (input && input.value) {
        navigator.clipboard.writeText(input.value).then(
          () => showToast('Hash copied to clipboard!', 'success'),
          () => showToast('Failed to copy', 'error')
        );
      }
    });
  });

  // Initial
  if (!textInput.value) {
    textInput.value = 'hello world';
  }
  handleTextInput();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHashGenerator);
} else {
  initHashGenerator();
}
