import { convertSvgStrokesToFills } from '../utils/imageUtilityTools.ts';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('s2f-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('s2f-drop-zone') as HTMLElement | null;
  const editorContainer = document.getElementById('s2f-editor') as HTMLElement | null;
  const origPreview = document.getElementById('s2f-orig-preview') as HTMLElement | null;
  const convPreview = document.getElementById('s2f-conv-preview') as HTMLElement | null;
  const strokeCountDisplay = document.getElementById('s2f-stroke-count') as HTMLElement | null;
  const colorModeSelect = document.getElementById('s2f-color-mode') as HTMLSelectElement | null;
  const customColorInput = document.getElementById('s2f-custom-color') as HTMLInputElement | null;
  const copyBtn = document.getElementById('copy-s2f-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('download-s2f-btn') as HTMLButtonElement | null;

  if (!fileInput || !dropZone || !editorContainer) return;

  let originalSvg = '';
  let convertedSvg = '';

  function process() {
    if (!originalSvg) return;
    const mode = colorModeSelect?.value || 'preserve';
    const customFill = mode === 'custom' && customColorInput ? customColorInput.value : undefined;

    const res = convertSvgStrokesToFills(originalSvg, { customFill });
    convertedSvg = res.convertedSvg;

    if (origPreview) origPreview.innerHTML = originalSvg;
    if (convPreview) convPreview.innerHTML = convertedSvg;
    if (strokeCountDisplay) {
      strokeCountDisplay.textContent = `${res.strokeCount} stroke elements converted to fills`;
    }
  }

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      originalSvg = (e.target?.result as string) || '';
      dropZone?.classList.add('hidden');
      editorContainer?.classList.remove('hidden');
      process();
    };
    reader.readAsText(file);
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

  colorModeSelect?.addEventListener('change', () => {
    if (customColorInput) {
      customColorInput.classList.toggle('hidden', colorModeSelect.value !== 'custom');
    }
    process();
  });
  customColorInput?.addEventListener('input', process);

  copyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(convertedSvg);
    copyBtn.textContent = 'SVG Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy Converted SVG';
    }, 1200);
  });

  downloadBtn?.addEventListener('click', () => {
    const blob = new Blob([convertedSvg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `filled-vector-${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  });
});
