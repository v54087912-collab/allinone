/**
 * Image to Text (OCR) Tool (100% In-Browser)
 * Extracts text from photos, scans, and documents using Tesseract.js WebAssembly.
 */
import { createWorker } from 'tesseract.js';
import {
  preprocessImageForOcr,
  calculateOcrStats,
  sanitizeOcrText,
} from '../utils/ocrUtils.ts';
import { generateDocx } from '../utils/docxUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

let loadedImage: HTMLImageElement | null = null;
let originalFileName = 'image.png';
let isProcessing = false;

// DOM Elements
const dropzone = document.getElementById('ocr-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('ocr-file-input') as HTMLInputElement | null;
const workspace = document.getElementById('ocr-workspace') as HTMLElement | null;
const previewCanvas = document.getElementById('ocr-canvas') as HTMLCanvasElement | null;

const langSelect = document.getElementById('ocr-lang-select') as HTMLSelectElement | null;
const enhanceCheck = document.getElementById('ocr-enhance-check') as HTMLInputElement | null;
const runBtn = document.getElementById('ocr-run-btn') as HTMLButtonElement | null;

const progressWrap = document.getElementById('ocr-progress-wrap') as HTMLElement | null;
const progressBar = document.getElementById('ocr-progress-bar') as HTMLElement | null;
const progressStatus = document.getElementById('ocr-progress-status') as HTMLElement | null;

const outputSection = document.getElementById('ocr-output-section') as HTMLElement | null;
const outputTextarea = document.getElementById('ocr-output-text') as HTMLTextAreaElement | null;

const statWords = document.getElementById('ocr-stat-words') as HTMLElement | null;
const statChars = document.getElementById('ocr-stat-chars') as HTMLElement | null;
const statLines = document.getElementById('ocr-stat-lines') as HTMLElement | null;
const statConfidence = document.getElementById('ocr-stat-confidence') as HTMLElement | null;

const copyBtn = document.getElementById('ocr-copy-btn') as HTMLButtonElement | null;
const downloadTxtBtn = document.getElementById('ocr-download-txt') as HTMLButtonElement | null;
const downloadDocxBtn = document.getElementById('ocr-download-docx') as HTMLButtonElement | null;
const resetBtn = document.getElementById('ocr-reset-btn') as HTMLButtonElement | null;
const metaBadge = document.getElementById('ocr-meta-badge') as HTMLElement | null;

export function initOcrTool(): void {
  if (!dropzone || !fileInput || !workspace || !previewCanvas) return;

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleImageFile(file);
    fileInput.value = '';
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleImageFile(file);
  });

  enhanceCheck?.addEventListener('change', () => {
    if (loadedImage) renderImageToCanvas();
  });

  runBtn?.addEventListener('click', runOcr);
  copyBtn?.addEventListener('click', handleCopyText);
  downloadTxtBtn?.addEventListener('click', handleDownloadTxt);
  downloadDocxBtn?.addEventListener('click', handleDownloadDocx);

  outputTextarea?.addEventListener('input', () => {
    updateStats(outputTextarea.value);
  });

  resetBtn?.addEventListener('click', () => {
    loadedImage = null;
    workspace.classList.add('hidden');
    dropzone.classList.remove('hidden');
    if (outputTextarea) outputTextarea.value = '';
    outputSection?.classList.add('hidden');
  });
}

function handleImageFile(file: File) {
  originalFileName = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      loadedImage = img;
      dropzone?.classList.add('hidden');
      workspace?.classList.remove('hidden');
      outputSection?.classList.add('hidden');

      if (metaBadge) {
        metaBadge.textContent = `${file.name} (${img.naturalWidth}x${img.naturalHeight}px \u2022 ${formatBytes(file.size)})`;
      }

      renderImageToCanvas();
      showToast('Image loaded. Ready to extract text.', 'success');
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function renderImageToCanvas() {
  if (!loadedImage || !previewCanvas) return;

  previewCanvas.width = loadedImage.naturalWidth;
  previewCanvas.height = loadedImage.naturalHeight;
  const ctx = previewCanvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(loadedImage, 0, 0);

  if (enhanceCheck?.checked) {
    preprocessImageForOcr(previewCanvas);
  }
}

async function runOcr() {
  if (!previewCanvas || isProcessing) return;

  try {
    isProcessing = true;
    if (runBtn) runBtn.disabled = true;
    progressWrap?.classList.remove('hidden');
    outputSection?.classList.add('hidden');

    const selectedLang = langSelect?.value || 'eng';
    updateProgress('Initializing OCR engine...', 10);

    const worker = await createWorker(selectedLang, undefined, {
      logger: (m) => {
        if (m.status === 'recognizing text' && m.progress !== undefined) {
          const pct = Math.round(m.progress * 100);
          updateProgress(`Extracting text... ${pct}%`, 30 + Math.round(pct * 0.65));
        } else if (m.status) {
          updateProgress(m.status.charAt(0).toUpperCase() + m.status.slice(1), 25);
        }
      },
    });

    updateProgress('Processing image...', 90);
    const ret = await worker.recognize(previewCanvas);
    await worker.terminate();

    const cleanText = sanitizeOcrText(ret.data.text);

    if (outputTextarea) {
      outputTextarea.value = cleanText;
    }

    const confidence = Math.round(ret.data.confidence);
    if (statConfidence) {
      statConfidence.textContent = `${confidence}%`;
    }

    updateStats(cleanText);

    progressWrap?.classList.add('hidden');
    outputSection?.classList.remove('hidden');
    showToast('Text extracted successfully!', 'success');
  } catch (err: any) {
    console.error('OCR Error:', err);
    showToast('OCR failed: ' + err.message, 'error');
    progressWrap?.classList.add('hidden');
  } finally {
    isProcessing = false;
    if (runBtn) runBtn.disabled = false;
  }
}

function updateProgress(status: string, percent: number) {
  if (progressStatus) progressStatus.textContent = status;
  if (progressBar) progressBar.style.width = `${percent}%`;
}

function updateStats(text: string) {
  const stats = calculateOcrStats(text);
  if (statWords) statWords.textContent = `${stats.wordCount}`;
  if (statChars) statChars.textContent = `${stats.charCount}`;
  if (statLines) statLines.textContent = `${stats.lineCount}`;
}

function handleCopyText() {
  const text = outputTextarea?.value || '';
  navigator.clipboard.writeText(text).then(
    () => showToast('Text copied to clipboard!', 'success'),
    () => showToast('Failed to copy text.', 'error')
  );
}

function handleDownloadTxt() {
  const text = outputTextarea?.value || '';
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const baseName = originalFileName.replace(/\.[^/.]+$/, '');
  a.download = `${baseName}_extracted.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  showToast('Text (.txt) file downloaded!', 'success');
}

async function handleDownloadDocx() {
  const text = outputTextarea?.value || '';
  const paragraphs = text.split(/\r?\n/).filter((p) => p.trim().length > 0);
  
  try {
    const docxBlob = await generateDocx(paragraphs);
    const url = URL.createObjectURL(docxBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_extracted.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast('Word (.docx) document downloaded!', 'success');
  } catch (err: any) {
    showToast('Failed to create DOCX: ' + err.message, 'error');
  }
}

// Auto init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOcrTool);
} else {
  initOcrTool();
}
