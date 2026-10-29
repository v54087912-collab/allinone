/**
 * PDF Metadata Viewer & Editor Tool (100% In-Browser)
 * Inspects, edits, or strips PDF metadata for maximum document privacy.
 */
import { PDFDocument } from 'pdf-lib';
import {
  extractPdfMetadata,
  updatePdfMetadata,
  stripPdfMetadata,
  type PdfMetadataInfo,
} from '../utils/pdfMetadataUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

let loadedPdfBytes: Uint8Array | null = null;
let originalFileName = 'document.pdf';
let currentMetadata: PdfMetadataInfo | null = null;

// DOM Elements
const dropzone = document.getElementById('meta-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('meta-file-input') as HTMLInputElement | null;
const workspace = document.getElementById('meta-workspace') as HTMLElement | null;

const inputTitle = document.getElementById('meta-title') as HTMLInputElement | null;
const inputAuthor = document.getElementById('meta-author') as HTMLInputElement | null;
const inputSubject = document.getElementById('meta-subject') as HTMLInputElement | null;
const inputKeywords = document.getElementById('meta-keywords') as HTMLInputElement | null;

const textPages = document.getElementById('meta-pages') as HTMLElement | null;
const textFileSize = document.getElementById('meta-filesize') as HTMLElement | null;
const textCreator = document.getElementById('meta-creator') as HTMLElement | null;
const textProducer = document.getElementById('meta-producer') as HTMLElement | null;
const textCreated = document.getElementById('meta-created') as HTMLElement | null;
const textModified = document.getElementById('meta-modified') as HTMLElement | null;

const saveBtn = document.getElementById('meta-save-btn') as HTMLButtonElement | null;
const stripBtn = document.getElementById('meta-strip-btn') as HTMLButtonElement | null;
const copyJsonBtn = document.getElementById('meta-copy-json-btn') as HTMLButtonElement | null;
const resetBtn = document.getElementById('meta-reset-btn') as HTMLButtonElement | null;

export function initPdfMetadataTool(): void {
  if (!dropzone || !fileInput || !workspace) return;

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleFile(file);
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
    if (file) handleFile(file);
  });

  saveBtn?.addEventListener('click', handleSaveUpdated);
  stripBtn?.addEventListener('click', handleStripMetadata);
  copyJsonBtn?.addEventListener('click', handleCopyJson);

  resetBtn?.addEventListener('click', () => {
    loadedPdfBytes = null;
    currentMetadata = null;
    workspace.classList.add('hidden');
    dropzone.classList.remove('hidden');
  });
}

async function handleFile(file: File) {
  try {
    originalFileName = file.name;
    const buf = await file.arrayBuffer();
    loadedPdfBytes = new Uint8Array(buf);

    dropzone?.classList.add('hidden');
    workspace?.classList.remove('hidden');

    const pdfDoc = await PDFDocument.load(loadedPdfBytes);
    currentMetadata = extractPdfMetadata(pdfDoc);

    // Populate editable inputs
    if (inputTitle) inputTitle.value = currentMetadata.title;
    if (inputAuthor) inputAuthor.value = currentMetadata.author;
    if (inputSubject) inputSubject.value = currentMetadata.subject;
    if (inputKeywords) inputKeywords.value = currentMetadata.keywords.join(', ');

    // Populate read-only attributes
    if (textPages) textPages.textContent = `${currentMetadata.pageCount}`;
    if (textFileSize) textFileSize.textContent = formatBytes(file.size);
    if (textCreator) textCreator.textContent = currentMetadata.creator || 'None';
    if (textProducer) textProducer.textContent = currentMetadata.producer || 'None';
    if (textCreated) {
      textCreated.textContent = currentMetadata.creationDate
        ? new Date(currentMetadata.creationDate).toLocaleString()
        : 'Unknown';
    }
    if (textModified) {
      textModified.textContent = currentMetadata.modificationDate
        ? new Date(currentMetadata.modificationDate).toLocaleString()
        : 'Unknown';
    }

    showToast('PDF metadata extracted successfully!', 'success');
  } catch (err: any) {
    showToast('Failed to parse PDF metadata: ' + err.message, 'error');
  }
}

async function handleSaveUpdated() {
  if (!loadedPdfBytes) return;

  try {
    if (saveBtn) saveBtn.disabled = true;
    showToast('Updating PDF metadata...', 'info');

    const pdfDoc = await PDFDocument.load(loadedPdfBytes);
    const keywords = (inputKeywords?.value || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    updatePdfMetadata(pdfDoc, {
      title: inputTitle?.value?.trim() || '',
      author: inputAuthor?.value?.trim() || '',
      subject: inputSubject?.value?.trim() || '',
      keywords,
    });

    const outputBytes = await pdfDoc.save();
    downloadBlob(outputBytes, `${originalFileName.replace(/\.[^/.]+$/, '')}_metadata.pdf`);
    showToast('Updated PDF downloaded successfully!', 'success');
  } catch (err: any) {
    showToast('Error updating PDF metadata: ' + err.message, 'error');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function handleStripMetadata() {
  if (!loadedPdfBytes) return;

  try {
    if (stripBtn) stripBtn.disabled = true;
    showToast('Stripping all metadata...', 'info');

    const pdfDoc = await PDFDocument.load(loadedPdfBytes);
    stripPdfMetadata(pdfDoc);

    const outputBytes = await pdfDoc.save();
    downloadBlob(outputBytes, `${originalFileName.replace(/\.[^/.]+$/, '')}_clean.pdf`);
    showToast('Sanitized, clean PDF downloaded!', 'success');
  } catch (err: any) {
    showToast('Error stripping metadata: ' + err.message, 'error');
  } finally {
    if (stripBtn) stripBtn.disabled = false;
  }
}

function handleCopyJson() {
  if (!currentMetadata) return;
  const jsonStr = JSON.stringify(currentMetadata, null, 2);
  navigator.clipboard.writeText(jsonStr).then(
    () => showToast('Metadata JSON copied to clipboard!', 'success'),
    () => showToast('Failed to copy to clipboard.', 'error')
  );
}

function downloadBlob(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Auto init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPdfMetadataTool);
} else {
  initPdfMetadataTool();
}
