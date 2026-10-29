import { removeExtraSpaces, type SpaceCleanOptions } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_TEXT = `   Hello    world !    Welcome    to   Toolora.   
   
   This    paragraph   has   way    too    many     spaces   .   
And   tabs	between	words	as	well	!   
   
   Empty   lines   above   and   below   .   
   `;

export function initRemoveSpaces(): void {
  const inputEl = document.getElementById('spaces-input') as HTMLTextAreaElement | null;
  const outputEl = document.getElementById('spaces-output') as HTMLTextAreaElement | null;

  const optTrim = document.getElementById('opt-trim') as HTMLInputElement | null;
  const optCollapse = document.getElementById('opt-collapse') as HTMLInputElement | null;
  const optLines = document.getElementById('opt-lines') as HTMLInputElement | null;
  const optTabs = document.getElementById('opt-tabs') as HTMLInputElement | null;
  const optPunct = document.getElementById('opt-punct') as HTMLInputElement | null;

  const presetAggressive = document.getElementById('preset-aggressive') as HTMLButtonElement | null;
  const presetStandard = document.getElementById('preset-standard') as HTMLButtonElement | null;
  const presetLinesOnly = document.getElementById('preset-lines-only') as HTMLButtonElement | null;

  const origCharsEl = document.getElementById('stat-original-chars') as HTMLElement | null;
  const cleanCharsEl = document.getElementById('stat-cleaned-chars') as HTMLElement | null;
  const savedCharsEl = document.getElementById('stat-saved-chars') as HTMLElement | null;

  const copyBtn = document.getElementById('spaces-copy-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('spaces-download-btn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('spaces-clear-btn') as HTMLButtonElement | null;
  const sampleBtn = document.getElementById('spaces-sample-btn') as HTMLButtonElement | null;

  if (!inputEl || !outputEl) return;

  function processText(): void {
    if (!inputEl || !outputEl) return;
    const text = inputEl.value;

    const options: SpaceCleanOptions = {
      trimLeadingTrailing: optTrim?.checked ?? true,
      collapseSpaces: optCollapse?.checked ?? true,
      removeEmptyLines: optLines?.checked ?? false,
      removeTabs: optTabs?.checked ?? true,
      cleanPunctuationSpaces: optPunct?.checked ?? false,
    };

    const cleaned = removeExtraSpaces(text, options);
    outputEl.value = cleaned;

    const origLen = text.length;
    const cleanLen = cleaned.length;
    const saved = Math.max(0, origLen - cleanLen);

    if (origCharsEl) origCharsEl.textContent = `${origLen}`;
    if (cleanCharsEl) cleanCharsEl.textContent = `${cleanLen}`;
    if (savedCharsEl) savedCharsEl.textContent = `${saved}`;
  }

  // Event listeners
  inputEl.addEventListener('input', processText);
  [optTrim, optCollapse, optLines, optTabs, optPunct].forEach((checkbox) => {
    checkbox?.addEventListener('change', processText);
  });

  presetAggressive?.addEventListener('click', () => {
    if (optTrim) optTrim.checked = true;
    if (optCollapse) optCollapse.checked = true;
    if (optLines) optLines.checked = true;
    if (optTabs) optTabs.checked = true;
    if (optPunct) optPunct.checked = true;
    processText();
    showToast('Applied Aggressive Clean preset!', 'info');
  });

  presetStandard?.addEventListener('click', () => {
    if (optTrim) optTrim.checked = true;
    if (optCollapse) optCollapse.checked = true;
    if (optLines) optLines.checked = false;
    if (optTabs) optTabs.checked = true;
    if (optPunct) optPunct.checked = false;
    processText();
    showToast('Applied Standard Clean preset!', 'info');
  });

  presetLinesOnly?.addEventListener('click', () => {
    if (optTrim) optTrim.checked = false;
    if (optCollapse) optCollapse.checked = false;
    if (optLines) optLines.checked = true;
    if (optTabs) optTabs.checked = false;
    if (optPunct) optPunct.checked = false;
    processText();
    showToast('Applied Remove Empty Lines preset!', 'info');
  });

  sampleBtn?.addEventListener('click', () => {
    inputEl.value = SAMPLE_TEXT;
    processText();
    showToast('Loaded sample text!', 'info');
  });

  clearBtn?.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    processText();
  });

  copyBtn?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(outputEl.value).then(
      () => showToast('Cleaned text copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  downloadBtn?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to download', 'warning');
      return;
    }
    const blob = new Blob([outputEl.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned-text.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Cleaned text downloaded!', 'success');
  });

  processText();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRemoveSpaces);
} else {
  initRemoveSpaces();
}
