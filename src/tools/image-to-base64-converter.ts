import { formatBase64Snippets } from '../utils/imageUtilityTools.ts';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('b64-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('b64-drop-zone') as HTMLElement | null;
  const resultsContainer = document.getElementById('b64-results') as HTMLElement | null;
  const previewImg = document.getElementById('b64-preview-img') as HTMLImageElement | null;
  const formatSelect = document.getElementById('b64-output-format') as HTMLSelectElement | null;
  const outputTextarea = document.getElementById('b64-output-text') as HTMLTextAreaElement | null;
  const copyBtn = document.getElementById('copy-b64-btn') as HTMLButtonElement | null;
  const downloadTxtBtn = document.getElementById('download-b64-txt') as HTMLButtonElement | null;
  const origSizeDisplay = document.getElementById('b64-orig-size') as HTMLElement | null;
  const b64SizeDisplay = document.getElementById('b64-enc-size') as HTMLElement | null;
  const overheadDisplay = document.getElementById('b64-overhead') as HTMLElement | null;

  if (!fileInput || !dropZone || !resultsContainer || !outputTextarea) return;

  let currentSnippets: ReturnType<typeof formatBase64Snippets> | null = null;

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function updateOutput() {
    if (!currentSnippets || !outputTextarea) return;
    const mode = formatSelect?.value || 'data-uri';
    if (mode === 'data-uri') outputTextarea.value = currentSnippets.dataUri;
    else if (mode === 'html') outputTextarea.value = currentSnippets.imgTag;
    else if (mode === 'css') outputTextarea.value = currentSnippets.cssBg;
    else if (mode === 'raw') outputTextarea.value = currentSnippets.rawBase64;
  }

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      if (previewImg) previewImg.src = dataUri;

      currentSnippets = formatBase64Snippets(dataUri, file.type, file.size);
      updateOutput();

      if (origSizeDisplay) origSizeDisplay.textContent = formatBytes(currentSnippets.originalBytes);
      if (b64SizeDisplay) b64SizeDisplay.textContent = formatBytes(currentSnippets.base64Bytes);
      if (overheadDisplay) overheadDisplay.textContent = `+${currentSnippets.overheadPercent}%`;

      dropZone?.classList.add('hidden');
      resultsContainer?.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  dropZone.addEventListener('dragover', (e) => e.preventDefault());
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files.length) loadFile(e.dataTransfer.files[0]);
  });
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) loadFile(fileInput.files[0]);
  });

  formatSelect?.addEventListener('change', updateOutput);

  copyBtn?.addEventListener('click', () => {
    if (!outputTextarea) return;
    navigator.clipboard.writeText(outputTextarea.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy to Clipboard';
    }, 1200);
  });

  downloadTxtBtn?.addEventListener('click', () => {
    if (!outputTextarea) return;
    const blob = new Blob([outputTextarea.value], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = `base64-image-${Date.now()}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  });
});
