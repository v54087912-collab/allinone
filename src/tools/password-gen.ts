import { generatePassword, calculateEntropy } from '../utils/cryptoUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initPasswordGen(): void {
  const display = document.getElementById('pwd-display') as HTMLInputElement | null;
  const generateBtn = document.getElementById('pwd-generate-btn') as HTMLButtonElement | null;
  const copyBtn = document.getElementById('pwd-copy-btn') as HTMLButtonElement | null;
  const entropySpan = document.getElementById('pwd-entropy') as HTMLElement | null;
  const strengthText = document.getElementById('pwd-strength-text') as HTMLElement | null;
  const strengthBar = document.getElementById('pwd-strength-bar') as HTMLElement | null;

  const lengthSlider = document.getElementById('pwd-length-slider') as HTMLInputElement | null;
  const lengthVal = document.getElementById('pwd-length-val') as HTMLElement | null;
  const upperCheck = document.getElementById('pwd-upper') as HTMLInputElement | null;
  const lowerCheck = document.getElementById('pwd-lower') as HTMLInputElement | null;
  const digitsCheck = document.getElementById('pwd-digits') as HTMLInputElement | null;
  const symbolsCheck = document.getElementById('pwd-symbols') as HTMLInputElement | null;
  const avoidAmbiguousCheck = document.getElementById('pwd-avoid-ambiguous') as HTMLInputElement | null;

  const bulkCountInput = document.getElementById('pwd-bulk-count') as HTMLInputElement | null;
  const bulkGenBtn = document.getElementById('pwd-bulk-generate-btn') as HTMLButtonElement | null;
  const bulkOutput = document.getElementById('pwd-bulk-output') as HTMLTextAreaElement | null;
  const bulkCopyBtn = document.getElementById('pwd-bulk-copy-btn') as HTMLButtonElement | null;

  if (!display) return;

  function getOptions() {
    let len = parseInt(lengthSlider?.value || '16', 10);
    if (isNaN(len) || len < 6) len = 16;
    if (len > 64) len = 64;

    const uppercase = upperCheck ? upperCheck.checked : true;
    const lowercase = lowerCheck ? lowerCheck.checked : true;
    const numbers = digitsCheck ? digitsCheck.checked : true;
    const symbols = symbolsCheck ? symbolsCheck.checked : true;
    const excludeAmbiguous = avoidAmbiguousCheck ? avoidAmbiguousCheck.checked : false;

    // Ensure at least one set is checked
    if (!uppercase && !lowercase && !numbers && !symbols) {
      if (lowerCheck) lowerCheck.checked = true;
    }

    return {
      length: len,
      uppercase,
      lowercase,
      numbers,
      symbols,
      excludeAmbiguous,
    };
  }

  function doGenerate() {
    const opts = getOptions();
    if (lengthVal) lengthVal.textContent = String(opts.length);

    const pwd = generatePassword(opts);
    if (display) display.value = pwd;

    const entropyData = calculateEntropy(pwd);
    if (entropySpan) {
      entropySpan.textContent = `${entropyData.entropy} bits entropy`;
    }
    if (strengthText) {
      strengthText.textContent = entropyData.label;
      const labelColors: Record<number, string> = {
        0: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300',
        1: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300',
        2: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
        3: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
        4: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
      };
      strengthText.className = `px-2 py-0.5 rounded text-[11px] font-bold uppercase ${labelColors[entropyData.score] || labelColors[0]}`;
    }

    if (strengthBar) {
      const barColors: Record<number, string> = {
        0: 'bg-rose-500',
        1: 'bg-orange-500',
        2: 'bg-amber-500',
        3: 'bg-emerald-500',
        4: 'bg-emerald-600',
      };
      const widths: Record<number, string> = {
        0: '20%',
        1: '40%',
        2: '60%',
        3: '85%',
        4: '100%',
      };
      strengthBar.className = `h-full rounded-full transition-all duration-300 ${barColors[entropyData.score] || 'bg-rose-500'}`;
      strengthBar.style.width = widths[entropyData.score] || '20%';
    }
  }

  function doGenerateBulk() {
    if (!bulkOutput) return;
    const count = Math.min(Math.max(parseInt(bulkCountInput?.value || '5', 10) || 5, 1), 50);
    const opts = getOptions();
    const passwords: string[] = [];
    for (let i = 0; i < count; i++) {
      passwords.push(generatePassword(opts));
    }
    bulkOutput.value = passwords.join('\n');
  }

  lengthSlider?.addEventListener('input', () => {
    if (lengthVal && lengthSlider) lengthVal.textContent = lengthSlider.value;
    doGenerate();
  });

  [upperCheck, lowerCheck, digitsCheck, symbolsCheck, avoidAmbiguousCheck].forEach((cb) => {
    cb?.addEventListener('change', doGenerate);
  });

  generateBtn?.addEventListener('click', doGenerate);

  copyBtn?.addEventListener('click', () => {
    if (!display?.value) return;
    navigator.clipboard.writeText(display.value).then(
      () => showToast('Password copied to clipboard!', 'success'),
      () => showToast('Failed to copy password', 'error')
    );
  });

  bulkGenBtn?.addEventListener('click', doGenerateBulk);

  bulkCopyBtn?.addEventListener('click', () => {
    if (!bulkOutput?.value) return;
    navigator.clipboard.writeText(bulkOutput.value).then(
      () => showToast('All bulk passwords copied!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  // Initial generation
  doGenerate();
  doGenerateBulk();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPasswordGen);
} else {
  initPasswordGen();
}
