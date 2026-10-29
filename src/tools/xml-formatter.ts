import { formatXml, minifyXml } from '../utils/devUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog><book id="bk101"><author>Gambardella, Matthew</author><title>XML Developer's Guide</title><genre>Computer</genre><price>44.95</price><publish_date>2000-10-01</publish_date><description>An in-depth look at creating applications with XML.</description></book><book id="bk102"><author>Ralls, Kim</author><title>Midnight Rain</title><genre>Fantasy</genre><price>5.95</price></book></catalog>`;

export function initXmlFormatter(): void {
  const inputEl = document.getElementById('xml-input') as HTMLTextAreaElement | null;
  const outputEl = document.getElementById('xml-output') as HTMLTextAreaElement | null;
  const indentSelect = document.getElementById('xml-indent') as HTMLSelectElement | null;

  const statusBadge = document.getElementById('xml-status-badge') as HTMLElement | null;
  const errorMsgEl = document.getElementById('xml-error-msg') as HTMLElement | null;

  const btnFormat = document.getElementById('btn-format') as HTMLButtonElement | null;
  const btnMinify = document.getElementById('btn-minify') as HTMLButtonElement | null;
  const btnSample = document.getElementById('btn-sample') as HTMLButtonElement | null;
  const btnClear = document.getElementById('btn-clear') as HTMLButtonElement | null;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;
  const btnDownload = document.getElementById('btn-download') as HTMLButtonElement | null;

  if (!inputEl || !outputEl) return;

  function doFormat(): void {
    if (!inputEl || !outputEl) return;
    const raw = inputEl.value;
    if (!raw.trim()) {
      outputEl.value = '';
      setStatus(null);
      return;
    }

    const indent = indentSelect?.value === '4' ? '    ' : indentSelect?.value === 'tab' ? '\t' : '  ';
    const res = formatXml(raw, indent);

    outputEl.value = res.formatted;
    setStatus(res.isValid, res.error);
  }

  function doMinify(): void {
    if (!inputEl || !outputEl) return;
    const raw = inputEl.value;
    if (!raw.trim()) {
      outputEl.value = '';
      return;
    }
    outputEl.value = minifyXml(raw);
    showToast('Minified XML!', 'info');
  }

  function setStatus(isValid: boolean | null, error?: string): void {
    if (!statusBadge || !errorMsgEl) return;

    if (isValid === null) {
      statusBadge.textContent = 'Ready';
      statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      errorMsgEl.classList.add('hidden');
      return;
    }

    if (isValid) {
      statusBadge.textContent = '✓ Well-Formed XML';
      statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
      errorMsgEl.classList.add('hidden');
    } else {
      statusBadge.textContent = '✕ XML Syntax Error';
      statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
      errorMsgEl.classList.remove('hidden');
      errorMsgEl.textContent = error || 'Invalid XML syntax';
    }
  }

  inputEl.addEventListener('input', doFormat);
  indentSelect?.addEventListener('change', doFormat);

  btnFormat?.addEventListener('click', () => {
    doFormat();
    showToast('Formatted XML!', 'info');
  });

  btnMinify?.addEventListener('click', doMinify);

  btnSample?.addEventListener('click', () => {
    inputEl.value = SAMPLE_XML;
    doFormat();
    showToast('Loaded sample XML!', 'info');
  });

  btnClear?.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    setStatus(null);
  });

  btnCopy?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(outputEl.value).then(
      () => showToast('XML copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  btnDownload?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to download', 'warning');
      return;
    }
    const blob = new Blob([outputEl.value], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.xml';
    a.click();
    URL.revokeObjectURL(url);
    showToast('XML file downloaded!', 'success');
  });

  if (!inputEl.value) {
    inputEl.value = SAMPLE_XML;
  }
  doFormat();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initXmlFormatter);
} else {
  initXmlFormatter();
}
