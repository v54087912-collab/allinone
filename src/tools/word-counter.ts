import { analyzeText } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const textarea = document.getElementById('wc-textarea') as HTMLTextAreaElement | null;
const wordsEl = document.getElementById('wc-words') as HTMLElement | null;
const charsEl = document.getElementById('wc-chars') as HTMLElement | null;
const charsNoSpaceEl = document.getElementById('wc-chars-nospace') as HTMLElement | null;
const sentencesEl = document.getElementById('wc-sentences') as HTMLElement | null;
const paragraphsEl = document.getElementById('wc-paragraphs') as HTMLElement | null;
const readTimeEl = document.getElementById('wc-readtime') as HTMLElement | null;
const speakTimeEl = document.getElementById('wc-speaktime') as HTMLElement | null;
const clearBtn = document.getElementById('wc-clear-btn') as HTMLButtonElement | null;
const copyBtn = document.getElementById('wc-copy-btn') as HTMLButtonElement | null;

export function initWordCounter(): void {
  if (!textarea) return;

  function update() {
    const text = textarea?.value || '';
    const stats = analyzeText(text);

    if (wordsEl) wordsEl.textContent = `${stats.words}`;
    if (charsEl) charsEl.textContent = `${stats.characters}`;
    if (charsNoSpaceEl) charsNoSpaceEl.textContent = `${stats.charactersNoSpaces}`;
    if (sentencesEl) sentencesEl.textContent = `${stats.sentences}`;
    if (paragraphsEl) paragraphsEl.textContent = `${stats.paragraphs}`;
    if (readTimeEl) readTimeEl.textContent = `${stats.readingTimeMin} min`;
    if (speakTimeEl) speakTimeEl.textContent = `${stats.speakingTimeMin} min`;
  }

  textarea.addEventListener('input', update);
  clearBtn?.addEventListener('click', () => {
    textarea.value = '';
    update();
  });
  copyBtn?.addEventListener('click', () => {
    if (!textarea.value) return;
    navigator.clipboard.writeText(textarea.value).then(
      () => showToast('Text copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWordCounter);
} else {
  initWordCounter();
}
