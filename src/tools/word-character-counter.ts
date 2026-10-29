/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { analyzeText } from '../utils/textUtils.ts';

export function initWordCharacterCounter(): void {
  const textInput = document.getElementById('text-input') as HTMLTextAreaElement | null;
  const wordCount = document.getElementById('stat-words') as HTMLHeadingElement | null;
  const charCount = document.getElementById('stat-chars') as HTMLHeadingElement | null;
  const charNoSpaces = document.getElementById('stat-chars-nospace') as HTMLHeadingElement | null;
  const sentenceCount = document.getElementById('stat-sentences') as HTMLHeadingElement | null;
  const paragraphCount = document.getElementById('stat-paragraphs') as HTMLHeadingElement | null;
  const readTime = document.getElementById('stat-reading-time') as HTMLHeadingElement | null;
  const speakTime = document.getElementById('stat-speaking-time') as HTMLHeadingElement | null;
  const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement | null;

  function update() {
    const text = textInput?.value || '';
    const stats = analyzeText(text);

    if (wordCount) wordCount.textContent = stats.words.toLocaleString();
    if (charCount) charCount.textContent = stats.characters.toLocaleString();
    if (charNoSpaces) charNoSpaces.textContent = stats.charactersNoSpaces.toLocaleString();
    if (sentenceCount) sentenceCount.textContent = stats.sentences.toLocaleString();
    if (paragraphCount) paragraphCount.textContent = stats.paragraphs.toLocaleString();
    if (readTime) readTime.textContent = `${stats.readingTimeMin} min`;
    if (speakTime) speakTime.textContent = `${stats.speakingTimeMin} min`;
  }

  if (textInput) {
    textInput.addEventListener('input', update);
  }

  if (clearBtn && textInput) {
    clearBtn.addEventListener('click', () => {
      textInput.value = '';
      update();
    });
  }

  update();
}

document.addEventListener('DOMContentLoaded', initWordCharacterCounter);
