import { convertCase, type CaseMode } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const textarea = document.getElementById('case-input') as HTMLTextAreaElement | null;
const copyBtn = document.getElementById('case-copy-btn') as HTMLButtonElement | null;
const clearBtn = document.getElementById('case-clear-btn') as HTMLButtonElement | null;
const buttons = document.querySelectorAll<HTMLButtonElement>('[data-case]');

export function initCaseConverter(): void {
  if (!textarea) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-case') as CaseMode;
      if (mode && textarea) {
        textarea.value = convertCase(textarea.value, mode);
        showToast(`Converted to ${mode.toUpperCase()}!`, 'success');
      }
    });
  });

  copyBtn?.addEventListener('click', () => {
    if (!textarea.value) return;
    navigator.clipboard.writeText(textarea.value).then(
      () => showToast('Text copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  clearBtn?.addEventListener('click', () => {
    textarea.value = '';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCaseConverter);
} else {
  initCaseConverter();
}
