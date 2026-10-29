/**
 * Word (.docx) to PDF Converter Tool (100% In-Browser)
 */
import { extractTextFromDocx } from '../utils/docxUtils.ts';
import { convertParagraphsToPdf, type DocParagraph } from '../utils/wordToPdfUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

let originalFile: File | null = null;
let parsedParagraphs: DocParagraph[] = [];

// DOM Elements
const dropzone = document.getElementById('word2pdf-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('word2pdf-file-input') as HTMLInputElement | null;
const workspace = document.getElementById('word2pdf-workspace') as HTMLElement | null;
const demoBtn = document.getElementById('word2pdf-demo-btn') as HTMLButtonElement | null;
const resetBtn = document.getElementById('word2pdf-reset-btn') as HTMLButtonElement | null;
const convertBtn = document.getElementById('word2pdf-convert-btn') as HTMLButtonElement | null;
const textArea = document.getElementById('word2pdf-text-input') as HTMLTextAreaElement | null;
const pageSizeSelect = document.getElementById('word2pdf-page-size') as HTMLSelectElement | null;
const marginSelect = document.getElementById('word2pdf-margin') as HTMLSelectElement | null;
const fontSizeSelect = document.getElementById('word2pdf-font-size') as HTMLSelectElement | null;
const metaBadge = document.getElementById('word2pdf-meta-badge') as HTMLElement | null;
const progressContainer = document.getElementById('word2pdf-progress-container') as HTMLElement | null;
const progressBar = document.getElementById('word2pdf-progress-bar') as HTMLElement | null;
const progressText = document.getElementById('word2pdf-progress-text') as HTMLElement | null;

export function initWordToPdfTool(): void {
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
    if (file && (file.name.endsWith('.docx') || file.type.includes('word'))) {
      handleFile(file);
    }
  });

  demoBtn?.addEventListener('click', loadDemoWord);
  resetBtn?.addEventListener('click', () => {
    originalFile = null;
    parsedParagraphs = [];
    if (textArea) textArea.value = '';
    workspace?.classList.add('hidden');
    dropzone?.classList.remove('hidden');
  });

  convertBtn?.addEventListener('click', handleConvertToPdf);
}

async function handleFile(file: File) {
  try {
    originalFile = file;
    dropzone?.classList.add('hidden');
    workspace?.classList.remove('hidden');

    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '30%';
    if (progressText) progressText.textContent = 'Parsing Word .docx structure...';

    const arrayBuffer = await file.arrayBuffer();
    const rawText = await extractTextFromDocx(arrayBuffer);

    if (progressBar) progressBar.style.width = '85%';
    if (progressText) progressText.textContent = 'Formatting document...';

    if (textArea) {
      textArea.value = rawText;
    }

    if (metaBadge) {
      metaBadge.textContent = `${file.name} \u2022 ${formatBytes(file.size)}`;
    }

    if (progressBar) progressBar.style.width = '100%';
    setTimeout(() => {
      progressContainer?.classList.add('hidden');
    }, 1000);

    showToast('Word document loaded! Ready to generate PDF.', 'success');
  } catch (err: any) {
    console.error('Word extraction error:', err);
    showToast('Failed to parse .docx: ' + err.message, 'error');
    if (progressContainer) progressContainer.classList.add('hidden');
  }
}

function loadDemoWord() {
  dropzone?.classList.add('hidden');
  workspace?.classList.remove('hidden');

  const demoText = `# Project Proposal: Next-Gen Web Applications

1. Executive Overview
This document outlines the strategic roadmap for client-side web application migration. By leveraging WebAssembly and in-browser processing, organisations can achieve 100% data privacy and reduce infrastructure costs.

2. Architecture & Design Principles
- Zero Data Ingestion: All computations happen in client memory.
- Instant Response: Eliminate network latency for batch conversions.
- Accessible UX: Modern interface compliant with WCAG guidelines.

3. Conclusion and Deliverables
The project will be completed in phases with production validation across all modern browsers.`;

  if (textArea) textArea.value = demoText;
  if (metaBadge) metaBadge.textContent = 'Demo_Proposal.docx \u2022 14 KB';
  showToast('Demo document loaded into editor!', 'success');
}

async function handleConvertToPdf() {
  const text = textArea?.value || '';
  if (!text.trim()) {
    showToast('Document text cannot be empty.', 'error');
    return;
  }

  try {
    if (convertBtn) convertBtn.disabled = true;
    showToast('Synthesizing PDF pages...', 'info');

    // Parse paragraphs from text
    const rawParagraphs = text.split(/\r?\n\s*\r?\n/).filter((p) => p.trim().length > 0);
    parsedParagraphs = rawParagraphs.map((p) => {
      const trimmed = p.trim();
      const isHeading = trimmed.startsWith('#') || (trimmed.length < 55 && !trimmed.endsWith('.'));
      return {
        text: trimmed.replace(/^#+\s*/, ''),
        isHeading,
      };
    });

    const pageSize = (pageSizeSelect?.value || 'a4') as 'a4' | 'letter';
    const margin = parseInt(marginSelect?.value || '40', 10);
    const fontSize = parseInt(fontSizeSelect?.value || '11', 10);

    const pdfBytes = await convertParagraphsToPdf(parsedParagraphs, {
      pageSize,
      margin,
      fontSize,
    });

    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = originalFile?.name.replace(/\.[^/.]+$/, '') || 'document';
    a.download = `${baseName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    showToast('PDF document downloaded successfully!', 'success');
  } catch (err: any) {
    console.error('Word to PDF error:', err);
    showToast('Failed to convert to PDF: ' + err.message, 'error');
  } finally {
    if (convertBtn) convertBtn.disabled = false;
  }
}

// Auto init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWordToPdfTool);
} else {
  initWordToPdfTool();
}
