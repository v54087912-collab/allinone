import { CURATED_FONT_PAIRINGS } from '../utils/designUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initFontPairing(): void {
  const pairingsContainer = document.getElementById('font-pairings-list');
  const previewHeading = document.getElementById('font-pair-heading') as HTMLInputElement | null;
  const previewBody = document.getElementById('font-pair-body') as HTMLTextAreaElement | null;
  const copyCssBtn = document.getElementById('font-copy-css-btn') as HTMLButtonElement | null;

  if (!pairingsContainer) return;

  let activePairing = CURATED_FONT_PAIRINGS[0];

  function render() {
    if (!pairingsContainer) return;
    pairingsContainer.innerHTML = '';

    CURATED_FONT_PAIRINGS.forEach((pair) => {
      const isSelected = pair.id === activePairing.id;
      const card = document.createElement('div');
      card.className = `p-5 rounded-2xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`;

      card.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">${pair.tag}</span>
          ${isSelected ? '<span class="text-xs text-blue-600 font-bold">Selected</span>' : ''}
        </div>
        <div class="text-lg font-bold text-slate-900 dark:text-white" style="font-family: ${pair.headingFont};">${pair.heading}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mb-2">Body: <span style="font-family: ${pair.bodyFont};">${pair.body}</span></div>
        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${pair.description}</p>
      `;

      card.addEventListener('click', () => {
        activePairing = pair;
        applyPairing();
        render();
      });

      pairingsContainer.appendChild(card);
    });
  }

  function applyPairing() {
    const headingEl = document.getElementById('active-pair-heading-preview');
    const bodyEl = document.getElementById('active-pair-body-preview');
    const cssCode = document.getElementById('active-pair-css-code');

    if (headingEl) {
      headingEl.style.fontFamily = activePairing.headingFont;
      headingEl.textContent = previewHeading?.value || 'Designing Timeless Digital Experiences';
    }
    if (bodyEl) {
      bodyEl.style.fontFamily = activePairing.bodyFont;
      bodyEl.textContent = previewBody?.value || 'Great typography establishes visual hierarchy and guides readers effortlessly through your interface.';
    }
    if (cssCode) {
      const code = `/* Font Pairing: ${activePairing.heading} + ${activePairing.body} */\nh1, h2, h3 {\n  font-family: ${activePairing.headingFont};\n}\n\nbody, p {\n  font-family: ${activePairing.bodyFont};\n}`;
      cssCode.textContent = code;
    }
  }

  previewHeading?.addEventListener('input', applyPairing);
  previewBody?.addEventListener('input', applyPairing);

  copyCssBtn?.addEventListener('click', () => {
    const code = document.getElementById('active-pair-css-code')?.textContent || '';
    if (code) {
      navigator.clipboard.writeText(code).then(() => showToast('CSS copied to clipboard!', 'success'));
    }
  });

  render();
  applyPairing();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFontPairing);
} else {
  initFontPairing();
}
