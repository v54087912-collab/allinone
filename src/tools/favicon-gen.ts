import JSZip from 'jszip';
import { showToast } from '../shared/site-shell.ts';

const SIZES = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
];

export function initFaviconGen(): void {
  const fileInput = document.getElementById('fav-file-input') as HTMLInputElement | null;
  const dropzone = document.getElementById('fav-dropzone');
  const emojiInput = document.getElementById('fav-emoji-input') as HTMLInputElement | null;
  const emojiBtn = document.getElementById('fav-emoji-btn') as HTMLButtonElement | null;
  const preview16 = document.getElementById('preview-fav-16') as HTMLImageElement | null;
  const preview32 = document.getElementById('preview-fav-32') as HTMLImageElement | null;
  const preview180 = document.getElementById('preview-fav-180') as HTMLImageElement | null;
  const downloadZipBtn = document.getElementById('fav-download-zip') as HTMLButtonElement | null;
  const htmlSnippet = document.getElementById('fav-html-snippet') as HTMLTextAreaElement | null;
  const copySnippetBtn = document.getElementById('fav-copy-snippet') as HTMLButtonElement | null;

  let sourceImage: HTMLImageElement | null = null;

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        sourceImage = img;
        updatePreviews();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function renderToCanvas(size: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    if (sourceImage) {
      ctx.drawImage(sourceImage, 0, 0, size, size);
    }
    return canvas;
  }

  function updatePreviews() {
    if (!sourceImage) return;

    if (preview16) preview16.src = renderToCanvas(16).toDataURL('image/png');
    if (preview32) preview32.src = renderToCanvas(32).toDataURL('image/png');
    if (preview180) preview180.src = renderToCanvas(180).toDataURL('image/png');

    if (downloadZipBtn) {
      downloadZipBtn.removeAttribute('disabled');
      downloadZipBtn.classList.remove('opacity-50', 'pointer-events-none');
    }
  }

  function loadEmoji(emoji: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = '380px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji || '⭐', 256, 276);

    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      updatePreviews();
    };
    img.src = canvas.toDataURL('image/png');
  }

  fileInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) loadFile(file);
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-500');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-blue-500');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500');
    const file = e.dataTransfer?.files[0];
    if (file) loadFile(file);
  });

  emojiBtn?.addEventListener('click', () => {
    const em = emojiInput?.value.trim() || '🚀';
    loadEmoji(em);
  });

  copySnippetBtn?.addEventListener('click', () => {
    if (!htmlSnippet) return;
    navigator.clipboard.writeText(htmlSnippet.value).then(() => showToast('HTML snippet copied!', 'success'));
  });

  downloadZipBtn?.addEventListener('click', async () => {
    if (!sourceImage) return;

    const zip = new JSZip();

    for (const item of SIZES) {
      const c = renderToCanvas(item.size);
      const dataUrl = c.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      zip.file(item.name, base64, { base64: true });
    }

    // Also include sample favicon.ico as 32px png
    const c32 = renderToCanvas(32);
    zip.file('favicon.ico', c32.toDataURL('image/png').split(',')[1], { base64: true });

    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'toolora-favicons.zip';
    a.click();
    showToast('All favicons downloaded as ZIP!', 'success');
  });

  // Default initial emoji
  loadEmoji('⚡');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFaviconGen);
} else {
  initFaviconGen();
}
