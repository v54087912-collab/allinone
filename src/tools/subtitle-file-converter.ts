/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseSubtitles, convertSubtitles, SubtitleCue } from '../utils/mediaAudioUtils.ts';

export function initSubtitleFileConverter(): void {
  const fileInput = document.getElementById('subtitle-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('subtitle-drop-zone') as HTMLDivElement | null;
  const rawTextInput = document.getElementById('raw-text-input') as HTMLTextAreaElement | null;
  const targetFormatSelect = document.getElementById('target-format') as HTMLSelectElement | null;
  const offsetInput = document.getElementById('offset-seconds') as HTMLInputElement | null;
  const convertBtn = document.getElementById('convert-btn') as HTMLButtonElement | null;
  const outputText = document.getElementById('output-text') as HTMLTextAreaElement | null;
  const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement | null;
  const cuesCount = document.getElementById('cues-count') as HTMLSpanElement | null;

  let loadedCues: SubtitleCue[] = [];

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      if (fileInput.files?.length) {
        const text = await fileInput.files[0].text();
        if (rawTextInput) rawTextInput.value = text;
        parseInput();
      }
    });
  }

  if (rawTextInput) {
    rawTextInput.addEventListener('input', parseInput);
  }

  function parseInput() {
    const text = rawTextInput?.value || '';
    loadedCues = parseSubtitles(text);
    if (cuesCount) {
      cuesCount.textContent = `${loadedCues.length} subtitle cues parsed`;
    }
    if (convertBtn) convertBtn.disabled = loadedCues.length === 0;
  }

  if (convertBtn) {
    convertBtn.addEventListener('click', () => {
      const format = (targetFormatSelect?.value || 'vtt') as any;
      const offset = parseFloat(offsetInput?.value || '0');
      const converted = convertSubtitles(loadedCues, format, offset);

      if (outputText) outputText.value = converted;
      if (copyBtn) copyBtn.disabled = false;
      if (downloadBtn) downloadBtn.disabled = false;
    });
  }

  if (copyBtn && outputText) {
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(outputText.value);
      const orig = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = orig; }, 1500);
    });
  }

  if (downloadBtn && outputText && targetFormatSelect) {
    downloadBtn.addEventListener('click', () => {
      const format = targetFormatSelect.value;
      const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subtitles.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

document.addEventListener('DOMContentLoaded', initSubtitleFileConverter);
