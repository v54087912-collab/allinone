import { generateSlug, type SlugOptions } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_TITLES = `The 10 Best Free Tools for Developers in 2026!
How to Build Fast & Secure Web Apps with Modern JavaScript?
Client-Side Privacy: Why Zero Server Uploads Matter.
Café & Crème Brûlée: A Guide to International Unicode Characters!`;

export function initSlugGenerator(): void {
  const inputEl = document.getElementById('slug-input') as HTMLTextAreaElement | null;
  const outputEl = document.getElementById('slug-output') as HTMLTextAreaElement | null;

  const sepSelect = document.getElementById('slug-sep') as HTMLSelectElement | null;
  const lowerCheck = document.getElementById('slug-lower') as HTMLInputElement | null;
  const numbersCheck = document.getElementById('slug-numbers') as HTMLInputElement | null;
  const batchCheck = document.getElementById('slug-batch-mode') as HTMLInputElement | null;

  const lenEl = document.getElementById('stat-slug-len') as HTMLElement | null;
  const wordCountEl = document.getElementById('stat-word-count') as HTMLElement | null;

  const copyBtn = document.getElementById('slug-copy-btn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('slug-clear-btn') as HTMLButtonElement | null;
  const sampleBtn = document.getElementById('slug-sample-btn') as HTMLButtonElement | null;

  if (!inputEl || !outputEl) return;

  function processText(): void {
    if (!inputEl || !outputEl) return;
    const text = inputEl.value;
    const isBatch = batchCheck?.checked ?? false;

    const options: SlugOptions = {
      separator: sepSelect?.value || '-',
      lowercase: lowerCheck?.checked ?? true,
      preserveNumbers: numbersCheck?.checked ?? true,
    };

    if (!text.trim()) {
      outputEl.value = '';
      if (lenEl) lenEl.textContent = '0';
      if (wordCountEl) wordCountEl.textContent = '0';
      return;
    }

    if (isBatch) {
      const lines = text.split(/\r?\n/);
      const slugs = lines.map((line) => (line.trim() ? generateSlug(line, options) : ''));
      outputEl.value = slugs.join('\n');
      if (lenEl) lenEl.textContent = `${outputEl.value.length}`;
      if (wordCountEl) wordCountEl.textContent = `${slugs.filter(Boolean).length} slugs`;
    } else {
      const slug = generateSlug(text, options);
      outputEl.value = slug;
      if (lenEl) lenEl.textContent = `${slug.length}`;
      if (wordCountEl) wordCountEl.textContent = `${slug ? slug.split(options.separator || '-').filter(Boolean).length : 0} parts`;
    }
  }

  inputEl.addEventListener('input', processText);
  sepSelect?.addEventListener('change', processText);
  lowerCheck?.addEventListener('change', processText);
  numbersCheck?.addEventListener('change', processText);
  batchCheck?.addEventListener('change', () => {
    processText();
    showToast(batchCheck.checked ? 'Batch multi-line mode enabled!' : 'Single slug mode enabled!', 'info');
  });

  sampleBtn?.addEventListener('click', () => {
    inputEl.value = SAMPLE_TITLES;
    if (batchCheck) batchCheck.checked = true;
    processText();
    showToast('Loaded sample titles!', 'info');
  });

  clearBtn?.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    processText();
  });

  copyBtn?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('No slug to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(outputEl.value).then(
      () => showToast('Slug copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  processText();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSlugGenerator);
} else {
  initSlugGenerator();
}
