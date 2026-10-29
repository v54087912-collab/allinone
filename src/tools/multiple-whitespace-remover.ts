/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { cleanWhitespace } from '../utils/handwritingUtils.ts';

export function initMultipleWhitespaceRemover(): void {
  const inputArea = document.getElementById('raw-text-input') as HTMLTextAreaElement | null;
  const outputArea = document.getElementById('cleaned-output') as HTMLTextAreaElement | null;
  const optCollapse = document.getElementById('opt-collapse-spaces') as HTMLInputElement | null;
  const optTrim = document.getElementById('opt-trim-lines') as HTMLInputElement | null;
  const optBlank = document.getElementById('opt-remove-blank') as HTMLInputElement | null;
  const optTabs = document.getElementById('opt-strip-tabs') as HTMLInputElement | null;
  const optUnwrap = document.getElementById('opt-unwrap-lines') as HTMLInputElement | null;
  const copyBtn = document.getElementById('copy-cleaned-btn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement | null;
  const diffBadge = document.getElementById('diff-badge') as HTMLSpanElement | null;

  function runClean() {
    const raw = inputArea?.value || '';
    const cleaned = cleanWhitespace(raw, {
      collapseSpaces: optCollapse?.checked ?? true,
      trimLines: optTrim?.checked ?? true,
      removeBlankLines: optBlank?.checked ?? true,
      stripTabs: optTabs?.checked ?? true,
      unwrapLines: optUnwrap?.checked ?? false
    });

    if (outputArea) outputArea.value = cleaned;

    const savedChars = raw.length - cleaned.length;
    if (diffBadge) {
      diffBadge.textContent = savedChars > 0
        ? `${savedChars.toLocaleString()} characters removed (${raw.length} → ${cleaned.length})`
        : `0 characters removed`;
    }
  }

  [inputArea, optCollapse, optTrim, optBlank, optTabs, optUnwrap].forEach(el => {
    el?.addEventListener('input', runClean);
    el?.addEventListener('change', runClean);
  });

  if (copyBtn && outputArea) {
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(outputArea.value);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy Cleaned Text'; }, 1500);
    });
  }

  if (clearBtn && inputArea && outputArea) {
    clearBtn.addEventListener('click', () => {
      inputArea.value = '';
      outputArea.value = '';
      if (diffBadge) diffBadge.textContent = '0 characters removed';
    });
  }

  runClean();
}

document.addEventListener('DOMContentLoaded', initMultipleWhitespaceRemover);
