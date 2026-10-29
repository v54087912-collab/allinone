/**
 * PDF to Word (.docx) Converter Tool (100% In-Browser)
 */
import * as pdfjsLib from 'pdfjs-dist';
import {
  createDocxZip,
  groupTextItemsIntoParagraphs,
  type ExtractedPdfTextItem,
  type PageTextContent,
} from '../utils/docxUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

// Set up PDF.js worker
import '../utils/pdfWorkerSetup.ts';

let pdfDoc: any = null;
let originalFile: File | null = null;
let parsedPages: PageTextContent[] = [];

// DOM Elements
const dropzone = document.getElementById('pdf2word-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('pdf2word-file-input') as HTMLInputElement | null;
const workspace = document.getElementById('pdf2word-workspace') as HTMLElement | null;
const demoBtn = document.getElementById('pdf2word-demo-btn') as HTMLButtonElement | null;
const resetBtn = document.getElementById('pdf2word-reset-btn') as HTMLButtonElement | null;
const downloadDocxBtn = document.getElementById('pdf2word-download-docx-btn') as HTMLButtonElement | null;
const downloadTxtBtn = document.getElementById('pdf2word-download-txt-btn') as HTMLButtonElement | null;
const copyBtn = document.getElementById('pdf2word-copy-btn') as HTMLButtonElement | null;
const progressContainer = document.getElementById('pdf2word-progress-container') as HTMLElement | null;
const progressBar = document.getElementById('pdf2word-progress-bar') as HTMLElement | null;
const progressText = document.getElementById('pdf2word-progress-text') as HTMLElement | null;
const previewArea = document.getElementById('pdf2word-preview-text') as HTMLElement | null;
const metaBadge = document.getElementById('pdf2word-meta-badge') as HTMLElement | null;

export function initPdfToWordTool(): void {
  if (!dropzone || !fileInput) return;

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
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      handleFile(file);
    }
  });

  demoBtn?.addEventListener('click', loadDemoPdf);
  resetBtn?.addEventListener('click', () => {
    pdfDoc = null;
    originalFile = null;
    parsedPages = [];
    workspace?.classList.add('hidden');
    dropzone?.classList.remove('hidden');
  });

  downloadDocxBtn?.addEventListener('click', handleDownloadDocx);
  downloadTxtBtn?.addEventListener('click', handleDownloadTxt);
  copyBtn?.addEventListener('click', handleCopyText);
}

async function handleFile(file: File) {
  try {
    originalFile = file;
    dropzone?.classList.add('hidden');
    workspace?.classList.remove('hidden');

    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '10%';
    if (progressText) progressText.textContent = 'Loading PDF document...';

    const arrayBuffer = await file.arrayBuffer();
    pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

    const totalPages = pdfDoc.numPages;
    if (metaBadge) {
      metaBadge.textContent = `${totalPages} ${totalPages === 1 ? 'page' : 'pages'} \u2022 ${formatBytes(file.size)}`;
    }

    parsedPages = [];

    for (let i = 1; i <= totalPages; i++) {
      const percent = Math.round(10 + (i / totalPages) * 80);
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressText) progressText.textContent = `Extracting text from page ${i} of ${totalPages}...`;

      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();

      const items: ExtractedPdfTextItem[] = textContent.items
        .filter((item: any) => typeof item.str === 'string')
        .map((item: any) => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width || 10,
          height: item.height || Math.hypot(item.transform[0], item.transform[1]),
        }));

      const paragraphs = groupTextItemsIntoParagraphs(items);
      parsedPages.push({
        pageNumber: i,
        paragraphs,
      });
    }

    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = 'Text extracted successfully!';

    setTimeout(() => {
      progressContainer?.classList.add('hidden');
    }, 1200);

    renderPreview();
    showToast('PDF extracted! Ready to download as Word (.docx).', 'success');
  } catch (err: any) {
    console.error('PDF extraction error:', err);
    showToast('Failed to parse PDF: ' + err.message, 'error');
    if (progressContainer) progressContainer.classList.add('hidden');
  }
}

async function loadDemoPdf() {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const demoDoc = await PDFDocument.create();
  const font = await demoDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await demoDoc.embedFont(StandardFonts.HelveticaBold);

  const page = demoDoc.addPage([595, 842]);
  page.drawText('Sample Business Contract', {
    x: 50,
    y: 780,
    size: 22,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });

  page.drawText('1. Definitions and Obligations', {
    x: 50,
    y: 730,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText(
    'This Agreement is entered into on this day between Toolora and the Client.',
    { x: 50, y: 700, size: 11, font, color: rgb(0.2, 0.2, 0.2) }
  );
  page.drawText(
    'All services described herein are performed 100% client-side with zero data storage.',
    { x: 50, y: 680, size: 11, font, color: rgb(0.2, 0.2, 0.2) }
  );

  const bytes = await demoDoc.save();
  const file = new File([bytes as any], 'sample_contract.pdf', { type: 'application/pdf' });
  handleFile(file);
}

function renderPreview() {
  if (!previewArea) return;
  previewArea.innerHTML = '';

  parsedPages.forEach((page) => {
    const pageCard = document.createElement('div');
    pageCard.className = 'p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3';

    let html = `<div class="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Page ${page.pageNumber}</div>`;

    if (page.paragraphs.length === 0) {
      html += `<p class="text-xs text-slate-400 italic">No selectable text found on this page (likely scanned image).</p>`;
    } else {
      page.paragraphs.forEach((p) => {
        if (p.isHeading) {
          html += `<h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white pt-2">${p.text}</h4>`;
        } else {
          html += `<p class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">${p.text}</p>`;
        }
      });
    }

    pageCard.innerHTML = html;
    previewArea.appendChild(pageCard);
  });
}

async function handleDownloadDocx() {
  if (parsedPages.length === 0) return;

  try {
    if (downloadDocxBtn) downloadDocxBtn.disabled = true;
    showToast('Creating Microsoft Word (.docx)...', 'info');

    const docxBytes = await createDocxZip(parsedPages);
    const blob = new Blob([docxBytes as any], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = originalFile?.name.replace(/\.[^/.]+$/, '') || 'converted_document';
    a.download = `${baseName}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    showToast('Word document (.docx) downloaded successfully!', 'success');
  } catch (err: any) {
    console.error('Docx download error:', err);
    showToast('Failed to generate DOCX: ' + err.message, 'error');
  } finally {
    if (downloadDocxBtn) downloadDocxBtn.disabled = false;
  }
}

function handleDownloadTxt() {
  if (parsedPages.length === 0) return;

  const fullText = parsedPages
    .map((p) => `--- Page ${p.pageNumber} ---\n\n` + p.paragraphs.map((para) => para.text).join('\n\n'))
    .join('\n\n\n');

  const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const baseName = originalFile?.name.replace(/\.[^/.]+$/, '') || 'extracted_text';
  a.download = `${baseName}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  showToast('Text file (.txt) downloaded!', 'success');
}

function handleCopyText() {
  if (parsedPages.length === 0) return;

  const fullText = parsedPages
    .map((p) => p.paragraphs.map((para) => para.text).join('\n\n'))
    .join('\n\n');

  navigator.clipboard.writeText(fullText).then(() => {
    showToast('All text copied to clipboard!', 'success');
  });
}

// Auto init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPdfToWordTool);
} else {
  initPdfToWordTool();
}
