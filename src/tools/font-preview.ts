import { showToast } from '../shared/site-shell.ts';

const SAMPLE_FONTS = [
  { name: 'Inter', family: "'Inter', sans-serif", category: 'Sans-Serif' },
  { name: 'Roboto', family: "'Roboto', sans-serif", category: 'Sans-Serif' },
  { name: 'Open Sans', family: "'Open Sans', sans-serif", category: 'Sans-Serif' },
  { name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'Sans-Serif' },
  { name: 'Poppins', family: "'Poppins', sans-serif", category: 'Sans-Serif' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", category: 'Serif' },
  { name: 'Merriweather', family: "'Merriweather', serif", category: 'Serif' },
  { name: 'Lora', family: "'Lora', serif", category: 'Serif' },
  { name: 'Fira Code', family: "'Fira Code', monospace", category: 'Monospace' },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", category: 'Monospace' },
  { name: 'Caveat', family: "'Caveat', cursive", category: 'Handwriting' },
  { name: 'Pacifico', family: "'Pacifico', cursive", category: 'Display' },
];

export function initFontPreview(): void {
  const textInput = document.getElementById('fp-text-input') as HTMLInputElement | null;
  const sizeSlider = document.getElementById('fp-size-slider') as HTMLInputElement | null;
  const sizeVal = document.getElementById('fp-size-val');
  const weightSelect = document.getElementById('fp-weight-select') as HTMLSelectElement | null;
  const categoryFilter = document.getElementById('fp-category-filter') as HTMLSelectElement | null;
  const gridContainer = document.getElementById('fp-font-grid');

  if (!gridContainer) return;

  function render() {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    const text = textInput?.value || 'The quick brown fox jumps over the lazy dog 1234567890';
    const size = sizeSlider?.value || '28';
    const weight = weightSelect?.value || '400';
    const cat = categoryFilter?.value || 'all';

    if (sizeVal) sizeVal.textContent = `${size}px`;

    const filtered = cat === 'all' ? SAMPLE_FONTS : SAMPLE_FONTS.filter((f) => f.category === cat);

    filtered.forEach((f) => {
      const card = document.createElement('div');
      card.className = 'p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3';

      card.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <span class="font-bold text-sm text-slate-900 dark:text-white">${f.name}</span>
            <span class="ml-2 text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">${f.category}</span>
          </div>
          <button type="button" class="copy-font-btn text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Copy CSS</button>
        </div>
        <div class="overflow-x-auto py-2 leading-relaxed text-slate-900 dark:text-white" style="font-family: ${f.family}; font-size: ${size}px; font-weight: ${weight};">
          ${text}
        </div>
      `;

      card.querySelector('.copy-font-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(`font-family: ${f.family};`).then(() => showToast(`Copied ${f.name} CSS!`, 'success'));
      });

      gridContainer.appendChild(card);
    });
  }

  [textInput, sizeSlider, weightSelect, categoryFilter].forEach((el) => {
    el?.addEventListener('input', render);
    el?.addEventListener('change', render);
  });

  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFontPreview);
} else {
  initFontPreview();
}
