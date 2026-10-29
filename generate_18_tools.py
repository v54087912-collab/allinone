#!/usr/bin/env python3
"""
Generates 18 new utility tools for Toolora:
1. Password Generator
2. Word Counter
3. Character Counter
4. Case Converter
5. Text Diff Checker
6. Text Reverser
7. Lorem Ipsum Generator
8. UUID Generator
9. Timestamp Converter
10. Unit Converter
11. Age Calculator
12. Percentage Calculator
13. Calculator
14. Stopwatch
15. Countdown Timer
16. Timezone Converter
17. URL Encoder/Decoder
18. Base64 Encoder/Decoder
"""

import os

TOOLS_DIR = "/home/yugank/zmodd/quickpic-studio---free-in-browser-image-utilities/src/tools"
ROOT_DIR = "/home/yugank/zmodd/quickpic-studio---free-in-browser-image-utilities"

# 1. Controller for Password Generator
PWD_GEN_TS = '''import { generatePassword, calculateEntropy } from '../utils/cryptoUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const lengthSlider = document.getElementById('pwd-length') as HTMLInputElement | null;
const lengthVal = document.getElementById('pwd-length-val') as HTMLElement | null;
const uppercaseCheck = document.getElementById('pwd-uppercase') as HTMLInputElement | null;
const lowercaseCheck = document.getElementById('pwd-lowercase') as HTMLInputElement | null;
const numbersCheck = document.getElementById('pwd-numbers') as HTMLInputElement | null;
const symbolsCheck = document.getElementById('pwd-symbols') as HTMLInputElement | null;
const ambiguousCheck = document.getElementById('pwd-ambiguous') as HTMLInputElement | null;
const resultInput = document.getElementById('pwd-result') as HTMLInputElement | null;
const generateBtn = document.getElementById('pwd-generate-btn') as HTMLButtonElement | null;
const copyBtn = document.getElementById('pwd-copy-btn') as HTMLButtonElement | null;
const strengthBar = document.getElementById('pwd-strength-bar') as HTMLElement | null;
const strengthLabel = document.getElementById('pwd-strength-label') as HTMLElement | null;
const bulkList = document.getElementById('pwd-bulk-list') as HTMLElement | null;
const bulkBtn = document.getElementById('pwd-bulk-btn') as HTMLButtonElement | null;

export function initPasswordGen(): void {
  if (!resultInput) return;

  function doGenerate() {
    const len = parseInt(lengthSlider?.value || '16', 10);
    if (lengthVal) lengthVal.textContent = `${len}`;

    const pwd = generatePassword({
      length: len,
      uppercase: uppercaseCheck?.checked ?? true,
      lowercase: lowercaseCheck?.checked ?? true,
      numbers: numbersCheck?.checked ?? true,
      symbols: symbolsCheck?.checked ?? true,
      excludeAmbiguous: ambiguousCheck?.checked ?? false,
    });

    if (resultInput) resultInput.value = pwd;

    const entropy = calculateEntropy(pwd);
    if (strengthLabel) strengthLabel.textContent = `${entropy.label} (${entropy.entropy} bits)`;
    if (strengthBar) {
      const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];
      const pcts = [15, 35, 60, 85, 100];
      strengthBar.className = `h-full rounded-full transition-all duration-300 ${colors[entropy.score] || 'bg-rose-500'}`;
      strengthBar.style.width = `${pcts[entropy.score] || 15}%`;
    }
  }

  lengthSlider?.addEventListener('input', doGenerate);
  [uppercaseCheck, lowercaseCheck, numbersCheck, symbolsCheck, ambiguousCheck].forEach((cb) => {
    cb?.addEventListener('change', doGenerate);
  });
  generateBtn?.addEventListener('click', doGenerate);

  copyBtn?.addEventListener('click', () => {
    if (!resultInput?.value) return;
    navigator.clipboard.writeText(resultInput.value).then(
      () => showToast('Password copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  bulkBtn?.addEventListener('click', () => {
    if (!bulkList) return;
    bulkList.innerHTML = '';
    const len = parseInt(lengthSlider?.value || '16', 10);
    for (let i = 0; i < 5; i++) {
      const p = generatePassword({
        length: len,
        uppercase: uppercaseCheck?.checked ?? true,
        lowercase: lowercaseCheck?.checked ?? true,
        numbers: numbersCheck?.checked ?? true,
        symbols: symbolsCheck?.checked ?? true,
        excludeAmbiguous: ambiguousCheck?.checked ?? false,
      });
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs';
      row.innerHTML = `<span class="truncate mr-2 select-all">${p}</span><button type="button" class="px-2 py-1 bg-white dark:bg-slate-700 rounded-lg text-[11px] font-sans hover:bg-slate-200 cursor-pointer">Copy</button>`;
      row.querySelector('button')?.addEventListener('click', () => {
        navigator.clipboard.writeText(p).then(() => showToast('Copied!', 'success'));
      });
      bulkList.appendChild(row);
    }
  });

  doGenerate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPasswordGen);
} else {
  initPasswordGen();
}
'''

# 2. Controller for Word Counter
WORD_COUNTER_TS = '''import { analyzeText } from '../utils/textUtils.ts';
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
'''

# 3. Controller for Character Counter
CHAR_COUNTER_TS = '''import { showToast } from '../shared/site-shell.ts';

const textarea = document.getElementById('cc-textarea') as HTMLTextAreaElement | null;
const totalEl = document.getElementById('cc-total') as HTMLElement | null;
const noSpaceEl = document.getElementById('cc-no-space') as HTMLElement | null;
const lettersEl = document.getElementById('cc-letters') as HTMLElement | null;
const numbersEl = document.getElementById('cc-numbers') as HTMLElement | null;
const spacesEl = document.getElementById('cc-spaces') as HTMLElement | null;
const bytesEl = document.getElementById('cc-bytes') as HTMLElement | null;

const twitterCount = document.getElementById('cc-twitter-count') as HTMLElement | null;
const twitterBar = document.getElementById('cc-twitter-bar') as HTMLElement | null;
const smsCount = document.getElementById('cc-sms-count') as HTMLElement | null;
const instaCount = document.getElementById('cc-insta-count') as HTMLElement | null;

export function initCharCounter(): void {
  if (!textarea) return;

  function update() {
    const text = textarea?.value || '';
    const total = text.length;
    const noSpace = text.replace(/\\s/g, '').length;
    const letters = (text.match(/[a-zA-Z]/g) || []).length;
    const numbers = (text.match(/[0-9]/g) || []).length;
    const spaces = (text.match(/\\s/g) || []).length;
    const bytes = new TextEncoder().encode(text).length;

    if (totalEl) totalEl.textContent = `${total}`;
    if (noSpaceEl) noSpaceEl.textContent = `${noSpace}`;
    if (lettersEl) lettersEl.textContent = `${letters}`;
    if (numbersEl) numbersEl.textContent = `${numbers}`;
    if (spacesEl) spacesEl.textContent = `${spaces}`;
    if (bytesEl) bytesEl.textContent = `${bytes} B`;

    // Social Limits
    if (twitterCount) twitterCount.textContent = `${total} / 280`;
    if (twitterBar) {
      const pct = Math.min(100, Math.round((total / 280) * 100));
      twitterBar.style.width = `${pct}%`;
      twitterBar.className = `h-full rounded-full transition-all ${pct > 100 ? 'bg-rose-500' : 'bg-sky-500'}`;
    }

    if (smsCount) {
      const segs = Math.ceil(total / 160) || 1;
      smsCount.textContent = `${total} / 160 (${segs} SMS)`;
    }

    if (instaCount) instaCount.textContent = `${total} / 2200`;
  }

  textarea.addEventListener('input', update);
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCharCounter);
} else {
  initCharCounter();
}
'''

# 4. Controller for Case Converter
CASE_CONVERTER_TS = '''import { convertCase, type CaseMode } from '../utils/textUtils.ts';
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
'''

# 5. Controller for Text Diff Checker
TEXT_DIFF_TS = '''import { computeTextDiff } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const origInput = document.getElementById('diff-orig') as HTMLTextAreaElement | null;
const modInput = document.getElementById('diff-mod') as HTMLTextAreaElement | null;
const compareBtn = document.getElementById('diff-compare-btn') as HTMLButtonElement | null;
const swapBtn = document.getElementById('diff-swap-btn') as HTMLButtonElement | null;
const sampleBtn = document.getElementById('diff-sample-btn') as HTMLButtonElement | null;
const outputWrap = document.getElementById('diff-output') as HTMLElement | null;

export function initTextDiff(): void {
  if (!origInput || !modInput || !outputWrap) return;

  function doCompare() {
    const orig = origInput?.value || '';
    const mod = modInput?.value || '';
    const diff = computeTextDiff(orig, mod);

    outputWrap!.innerHTML = '';
    diff.forEach((d) => {
      const line = document.createElement('div');
      line.className = 'px-3 py-1 font-mono text-xs rounded leading-relaxed ';
      if (d.type === 'same') {
        line.className += 'text-slate-700 dark:text-slate-300';
        line.textContent = '  ' + d.value;
      } else if (d.type === 'added') {
        line.className += 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-l-4 border-emerald-500 font-semibold';
        line.textContent = '+ ' + d.value;
      } else if (d.type === 'removed') {
        line.className += 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-l-4 border-rose-500 line-through';
        line.textContent = '- ' + d.value;
      }
      outputWrap!.appendChild(line);
    });
    showToast('Differences computed!', 'info');
  }

  compareBtn?.addEventListener('click', doCompare);
  swapBtn?.addEventListener('click', () => {
    const tmp = origInput.value;
    origInput.value = modInput.value;
    modInput.value = tmp;
    doCompare();
  });
  sampleBtn?.addEventListener('click', () => {
    origInput.value = 'QuickPic Studio is an image editor.\\nIt runs 100% in-browser.\\nFeatures: Crop and Compress.';
    modInput.value = 'Toolora is a complete utility suite.\\nIt runs 100% in-browser.\\nFeatures: Crop, Compress, and Text Tools.\\nZero server uploads.';
    doCompare();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTextDiff);
} else {
  initTextDiff();
}
'''

# 6. Controller for Text Reverser
TEXT_REVERSER_TS = '''import { reverseText, type ReverseMode } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const inputArea = document.getElementById('rev-input') as HTMLTextAreaElement | null;
const outputArea = document.getElementById('rev-output') as HTMLTextAreaElement | null;
const modeSelect = document.getElementById('rev-mode') as HTMLSelectElement | null;
const copyBtn = document.getElementById('rev-copy-btn') as HTMLButtonElement | null;

export function initTextReverser(): void {
  if (!inputArea || !outputArea) return;

  function doReverse() {
    const text = inputArea?.value || '';
    const mode = (modeSelect?.value || 'chars') as ReverseMode;
    outputArea!.value = reverseText(text, mode);
  }

  inputArea.addEventListener('input', doReverse);
  modeSelect?.addEventListener('change', doReverse);

  copyBtn?.addEventListener('click', () => {
    if (!outputArea.value) return;
    navigator.clipboard.writeText(outputArea.value).then(
      () => showToast('Reversed text copied!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTextReverser);
} else {
  initTextReverser();
}
'''

# 7. Controller for Lorem Ipsum Generator
LOREM_IPSUM_TS = '''import { generateLoremIpsum } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const countInput = document.getElementById('lorem-count') as HTMLInputElement | null;
const typeSelect = document.getElementById('lorem-type') as HTMLSelectElement | null;
const startCheck = document.getElementById('lorem-start') as HTMLInputElement | null;
const generateBtn = document.getElementById('lorem-generate-btn') as HTMLButtonElement | null;
const outputArea = document.getElementById('lorem-output') as HTMLTextAreaElement | null;
const copyBtn = document.getElementById('lorem-copy-btn') as HTMLButtonElement | null;

export function initLoremIpsum(): void {
  if (!outputArea) return;

  function doGenerate() {
    const count = parseInt(countInput?.value || '3', 10);
    const type = (typeSelect?.value || 'paragraphs') as 'paragraphs' | 'sentences' | 'words';
    const startLorem = startCheck?.checked ?? true;
    outputArea!.value = generateLoremIpsum(count, type, startLorem);
  }

  generateBtn?.addEventListener('click', doGenerate);
  copyBtn?.addEventListener('click', () => {
    if (!outputArea.value) return;
    navigator.clipboard.writeText(outputArea.value).then(
      () => showToast('Lorem ipsum copied!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  doGenerate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoremIpsum);
} else {
  initLoremIpsum();
}
'''

# 8. Controller for UUID Generator
UUID_GEN_TS = '''import { generateUuids } from '../utils/cryptoUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const qtySelect = document.getElementById('uuid-qty') as HTMLSelectElement | null;
const formatSelect = document.getElementById('uuid-format') as HTMLSelectElement | null;
const generateBtn = document.getElementById('uuid-gen-btn') as HTMLButtonElement | null;
const outputArea = document.getElementById('uuid-output') as HTMLTextAreaElement | null;
const copyBtn = document.getElementById('uuid-copy-btn') as HTMLButtonElement | null;

export function initUuidGen(): void {
  if (!outputArea) return;

  function doGenerate() {
    const qty = parseInt(qtySelect?.value || '1', 10);
    const fmt = (formatSelect?.value || 'standard') as 'standard' | 'nohyphen' | 'uppercase';
    const uuids = generateUuids(qty, fmt);
    outputArea!.value = uuids.join('\\n');
  }

  generateBtn?.addEventListener('click', doGenerate);
  copyBtn?.addEventListener('click', () => {
    if (!outputArea.value) return;
    navigator.clipboard.writeText(outputArea.value).then(
      () => showToast('UUIDs copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  doGenerate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUuidGen);
} else {
  initUuidGen();
}
'''

# 9. Controller for Timestamp Converter
TIMESTAMP_CONV_TS = '''import { parseTimestamp } from '../utils/calcUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const liveEpoch = document.getElementById('ts-live-epoch') as HTMLElement | null;
const copyLiveBtn = document.getElementById('ts-copy-live') as HTMLButtonElement | null;

const epochInput = document.getElementById('ts-epoch-input') as HTMLInputElement | null;
const epochConvertBtn = document.getElementById('ts-epoch-btn') as HTMLButtonElement | null;
const utcRes = document.getElementById('ts-utc-res') as HTMLElement | null;
const localRes = document.getElementById('ts-local-res') as HTMLElement | null;
const relativeRes = document.getElementById('ts-relative-res') as HTMLElement | null;

const dateInput = document.getElementById('ts-date-input') as HTMLInputElement | null;
const dateConvertBtn = document.getElementById('ts-date-btn') as HTMLButtonElement | null;
const dateEpochSec = document.getElementById('ts-date-epoch-sec') as HTMLElement | null;
const dateEpochMs = document.getElementById('ts-date-epoch-ms') as HTMLElement | null;

export function initTimestampConv(): void {
  // Live ticking epoch
  setInterval(() => {
    if (liveEpoch) liveEpoch.textContent = `${Math.floor(Date.now() / 1000)}`;
  }, 1000);

  copyLiveBtn?.addEventListener('click', () => {
    const nowSec = `${Math.floor(Date.now() / 1000)}`;
    navigator.clipboard.writeText(nowSec).then(() => showToast('Epoch timestamp copied!', 'success'));
  });

  epochConvertBtn?.addEventListener('click', () => {
    const val = epochInput?.value.trim() || '';
    if (!val) return;
    const res = parseTimestamp(val);
    if (utcRes) utcRes.textContent = res.utcIso;
    if (localRes) localRes.textContent = res.localString;
    if (relativeRes) relativeRes.textContent = res.relativeTime;
  });

  dateConvertBtn?.addEventListener('click', () => {
    const val = dateInput?.value || '';
    if (!val) return;
    const ms = new Date(val).getTime();
    if (dateEpochSec) dateEpochSec.textContent = `${Math.floor(ms / 1000)}`;
    if (dateEpochMs) dateEpochMs.textContent = `${ms}`;
  });

  // Init with now
  if (epochInput) epochInput.value = `${Math.floor(Date.now() / 1000)}`;
  epochConvertBtn?.click();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTimestampConv);
} else {
  initTimestampConv();
}
'''

# 10. Controller for Unit Converter
UNIT_CONVERTER_TS = '''import { convertUnits, LENGTH_RATES, WEIGHT_RATES, STORAGE_RATES, SPEED_RATES } from '../utils/calcUtils.ts';

const catSelect = document.getElementById('unit-category') as HTMLSelectElement | null;
const valFromInput = document.getElementById('unit-from-val') as HTMLInputElement | null;
const valToInput = document.getElementById('unit-to-val') as HTMLInputElement | null;
const unitFromSelect = document.getElementById('unit-from-type') as HTMLSelectElement | null;
const unitToSelect = document.getElementById('unit-to-type') as HTMLSelectElement | null;
const swapBtn = document.getElementById('unit-swap-btn') as HTMLButtonElement | null;

const CATEGORY_UNITS: Record<string, string[]> = {
  length: Object.keys(LENGTH_RATES),
  weight: Object.keys(WEIGHT_RATES),
  storage: Object.keys(STORAGE_RATES),
  speed: Object.keys(SPEED_RATES),
  temperature: ['c', 'f', 'k'],
};

export function initUnitConverter(): void {
  if (!catSelect || !unitFromSelect || !unitToSelect) return;

  function populateUnits() {
    const cat = catSelect?.value || 'length';
    const units = CATEGORY_UNITS[cat] || [];
    unitFromSelect!.innerHTML = '';
    unitToSelect!.innerHTML = '';

    units.forEach((u, i) => {
      const o1 = document.createElement('option');
      o1.value = u;
      o1.textContent = u.toUpperCase();
      unitFromSelect!.appendChild(o1);

      const o2 = document.createElement('option');
      o2.value = u;
      o2.textContent = u.toUpperCase();
      unitToSelect!.appendChild(o2);
    });

    if (units.length > 1) {
      unitToSelect!.selectedIndex = 1;
    }
    doConvert();
  }

  function doConvert() {
    const cat = (catSelect?.value || 'length') as any;
    const val = parseFloat(valFromInput?.value || '1');
    const from = unitFromSelect?.value || 'm';
    const to = unitToSelect?.value || 'km';

    if (isNaN(val)) {
      if (valToInput) valToInput.value = '';
      return;
    }

    const res = convertUnits(cat, val, from, to);
    if (valToInput) valToInput.value = `${Math.round(res * 1e8) / 1e8}`;
  }

  catSelect.addEventListener('change', populateUnits);
  valFromInput?.addEventListener('input', doConvert);
  unitFromSelect.addEventListener('change', doConvert);
  unitToSelect.addEventListener('change', doConvert);

  swapBtn?.addEventListener('click', () => {
    const tmp = unitFromSelect.value;
    unitFromSelect.value = unitToSelect.value;
    unitToSelect.value = tmp;
    doConvert();
  });

  populateUnits();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUnitConverter);
} else {
  initUnitConverter();
}
'''

# 11. Controller for Age Calculator
AGE_CALCULATOR_TS = '''import { calculateAge } from '../utils/calcUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const birthInput = document.getElementById('age-birth') as HTMLInputElement | null;
const targetInput = document.getElementById('age-target') as HTMLInputElement | null;
const calcBtn = document.getElementById('age-calc-btn') as HTMLButtonElement | null;

const primaryRes = document.getElementById('age-primary-res') as HTMLElement | null;
const monthsRes = document.getElementById('age-months-res') as HTMLElement | null;
const daysRes = document.getElementById('age-days-res') as HTMLElement | null;
const weeksRes = document.getElementById('age-weeks-res') as HTMLElement | null;
const nextBdayRes = document.getElementById('age-next-bday') as HTMLElement | null;
const zodiacRes = document.getElementById('age-zodiac') as HTMLElement | null;

export function initAgeCalculator(): void {
  if (!birthInput) return;

  // Default target date to today
  if (targetInput && !targetInput.value) {
    targetInput.value = new Date().toISOString().split('T')[0];
  }

  function doCalculate() {
    const bStr = birthInput?.value;
    const tStr = targetInput?.value;
    if (!bStr) {
      showToast('Please enter your date of birth.', 'info');
      return;
    }

    try {
      const res = calculateAge(bStr, tStr);
      if (primaryRes) primaryRes.textContent = `${res.years} Years, ${res.months} Months, ${res.days} Days`;
      if (monthsRes) monthsRes.textContent = `${res.years * 12 + res.months}`;
      if (daysRes) daysRes.textContent = `${res.totalDays.toLocaleString()}`;
      if (weeksRes) weeksRes.textContent = `${res.totalWeeks.toLocaleString()}`;
      if (nextBdayRes) nextBdayRes.textContent = `${res.nextBirthdayDays} Days`;
      if (zodiacRes) zodiacRes.textContent = res.zodiacSign;
    } catch (e: any) {
      showToast('Invalid dates entered', 'error');
    }
  }

  calcBtn?.addEventListener('click', doCalculate);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAgeCalculator);
} else {
  initAgeCalculator();
}
'''

# 12. Controller for Percentage Calculator
PERCENTAGE_CALC_TS = '''import { calculatePercentage } from '../utils/calcUtils.ts';

// 1. A% of B
const p1A = document.getElementById('pct1-a') as HTMLInputElement | null;
const p1B = document.getElementById('pct1-b') as HTMLInputElement | null;
const p1Res = document.getElementById('pct1-res') as HTMLElement | null;

// 2. A is what % of B
const p2A = document.getElementById('pct2-a') as HTMLInputElement | null;
const p2B = document.getElementById('pct2-b') as HTMLInputElement | null;
const p2Res = document.getElementById('pct2-res') as HTMLElement | null;

// 3. % change from A to B
const p3A = document.getElementById('pct3-a') as HTMLInputElement | null;
const p3B = document.getElementById('pct3-b') as HTMLInputElement | null;
const p3Res = document.getElementById('pct3-res') as HTMLElement | null;

// 4. A + B%
const p4A = document.getElementById('pct4-a') as HTMLInputElement | null;
const p4B = document.getElementById('pct4-b') as HTMLInputElement | null;
const p4Res = document.getElementById('pct4-res') as HTMLElement | null;

export function initPercentageCalc(): void {
  function update1() {
    const a = parseFloat(p1A?.value || '0');
    const b = parseFloat(p1B?.value || '0');
    if (p1Res) p1Res.textContent = `${calculatePercentage('percent-of', a, b)}`;
  }
  p1A?.addEventListener('input', update1);
  p1B?.addEventListener('input', update1);

  function update2() {
    const a = parseFloat(p2A?.value || '0');
    const b = parseFloat(p2B?.value || '0');
    if (p2Res) p2Res.textContent = `${Math.round(calculatePercentage('is-percent-of', a, b) * 100) / 100}%`;
  }
  p2A?.addEventListener('input', update2);
  p2B?.addEventListener('input', update2);

  function update3() {
    const a = parseFloat(p3A?.value || '0');
    const b = parseFloat(p3B?.value || '0');
    const diff = Math.round(calculatePercentage('percentage-change', a, b) * 100) / 100;
    if (p3Res) p3Res.textContent = `${diff >= 0 ? '+' : ''}${diff}%`;
  }
  p3A?.addEventListener('input', update3);
  p3B?.addEventListener('input', update3);

  function update4() {
    const a = parseFloat(p4A?.value || '0');
    const b = parseFloat(p4B?.value || '0');
    if (p4Res) p4Res.textContent = `${calculatePercentage('add-percent', a, b)}`;
  }
  p4A?.addEventListener('input', update4);
  p4B?.addEventListener('input', update4);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPercentageCalc);
} else {
  initPercentageCalc();
}
'''

# 13. Controller for Calculator
CALCULATOR_TS = '''import { evaluateMathExpression } from '../utils/calcUtils.ts';

const display = document.getElementById('calc-display') as HTMLInputElement | null;
const history = document.getElementById('calc-history') as HTMLElement | null;

let currentExpr = '';

export function initCalculator(): void {
  if (!display) return;

  function updateDisplay() {
    if (display) display.value = currentExpr || '0';
  }

  function handleInput(btnVal: string) {
    if (btnVal === 'C' || btnVal === 'AC') {
      currentExpr = '';
      if (history) history.textContent = '';
    } else if (btnVal === 'DEL') {
      currentExpr = currentExpr.slice(0, -1);
    } else if (btnVal === '=') {
      if (!currentExpr) return;
      try {
        const res = evaluateMathExpression(currentExpr);
        if (history) history.textContent = currentExpr + ' =';
        currentExpr = `${res}`;
      } catch {
        currentExpr = 'Error';
      }
    } else {
      if (currentExpr === 'Error') currentExpr = '';
      currentExpr += btnVal;
    }
    updateDisplay();
  }

  document.querySelectorAll<HTMLButtonElement>('[data-calc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-calc');
      if (val) handleInput(val);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (/[0-9+\\-*/().%]/.test(e.key)) {
      handleInput(e.key);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleInput('=');
    } else if (e.key === 'Backspace') {
      handleInput('DEL');
    } else if (e.key === 'Escape') {
      handleInput('AC');
    }
  });

  updateDisplay();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculator);
} else {
  initCalculator();
}
'''

# 14. Controller for Stopwatch
STOPWATCH_TS = '''const display = document.getElementById('sw-display') as HTMLElement | null;
const startBtn = document.getElementById('sw-start') as HTMLButtonElement | null;
const pauseBtn = document.getElementById('sw-pause') as HTMLButtonElement | null;
const resetBtn = document.getElementById('sw-reset') as HTMLButtonElement | null;
const lapBtn = document.getElementById('sw-lap') as HTMLButtonElement | null;
const lapsList = document.getElementById('sw-laps-list') as HTMLElement | null;

let startTime = 0;
let elapsedTime = 0;
let timerInterval: any = null;
let laps: number[] = [];

export function initStopwatch(): void {
  function formatTime(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  function update() {
    const current = Date.now() - startTime + elapsedTime;
    if (display) display.textContent = formatTime(current);
  }

  startBtn?.addEventListener('click', () => {
    startTime = Date.now();
    timerInterval = setInterval(update, 10);
    startBtn.classList.add('hidden');
    pauseBtn?.classList.remove('hidden');
    if (lapBtn) lapBtn.disabled = false;
  });

  pauseBtn?.addEventListener('click', () => {
    clearInterval(timerInterval);
    elapsedTime += Date.now() - startTime;
    pauseBtn.classList.add('hidden');
    startBtn?.classList.remove('hidden');
  });

  resetBtn?.addEventListener('click', () => {
    clearInterval(timerInterval);
    startTime = 0;
    elapsedTime = 0;
    laps = [];
    if (display) display.textContent = '00:00.00';
    pauseBtn?.classList.add('hidden');
    startBtn?.classList.remove('hidden');
    if (lapsList) lapsList.innerHTML = '';
    if (lapBtn) lapBtn.disabled = true;
  });

  lapBtn?.addEventListener('click', () => {
    const current = Date.now() - startTime + elapsedTime;
    laps.unshift(current);
    if (!lapsList) return;
    lapsList.innerHTML = '';
    laps.forEach((lapMs, idx) => {
      const row = document.createElement('div');
      row.className = 'flex justify-between py-1.5 px-3 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
      row.innerHTML = `<span>Lap ${laps.length - idx}</span><span>${formatTime(lapMs)}</span>`;
      lapsList.appendChild(row);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStopwatch);
} else {
  initStopwatch();
}
'''

# 15. Controller for Countdown Timer
COUNTDOWN_TIMER_TS = '''import { showToast } from '../shared/site-shell.ts';

const hoursInput = document.getElementById('timer-hours') as HTMLInputElement | null;
const minsInput = document.getElementById('timer-mins') as HTMLInputElement | null;
const secsInput = document.getElementById('timer-secs') as HTMLInputElement | null;
const display = document.getElementById('timer-display') as HTMLElement | null;
const startBtn = document.getElementById('timer-start') as HTMLButtonElement | null;
const pauseBtn = document.getElementById('timer-pause') as HTMLButtonElement | null;
const resetBtn = document.getElementById('timer-reset') as HTMLButtonElement | null;

let totalRemainingSecs = 0;
let timerInterval: any = null;

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {}
}

export function initCountdownTimer(): void {
  function format(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function tick() {
    if (totalRemainingSecs <= 0) {
      clearInterval(timerInterval);
      playBeep();
      showToast('Timer Finished!', 'success');
      startBtn?.classList.remove('hidden');
      pauseBtn?.classList.add('hidden');
      return;
    }
    totalRemainingSecs--;
    if (display) display.textContent = format(totalRemainingSecs);
  }

  startBtn?.addEventListener('click', () => {
    if (totalRemainingSecs <= 0) {
      const h = parseInt(hoursInput?.value || '0', 10);
      const m = parseInt(minsInput?.value || '0', 10);
      const s = parseInt(secsInput?.value || '0', 10);
      totalRemainingSecs = h * 3600 + m * 60 + s;
    }
    if (totalRemainingSecs <= 0) return;

    if (display) display.textContent = format(totalRemainingSecs);
    timerInterval = setInterval(tick, 1000);
    startBtn.classList.add('hidden');
    pauseBtn?.classList.remove('hidden');
  });

  pauseBtn?.addEventListener('click', () => {
    clearInterval(timerInterval);
    pauseBtn.classList.add('hidden');
    startBtn?.classList.remove('hidden');
  });

  resetBtn?.addEventListener('click', () => {
    clearInterval(timerInterval);
    totalRemainingSecs = 0;
    if (display) display.textContent = '00:00:00';
    pauseBtn?.classList.add('hidden');
    startBtn?.classList.remove('hidden');
  });

  document.querySelectorAll<HTMLButtonElement>('[data-preset-mins]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.getAttribute('data-preset-mins') || '5', 10);
      if (hoursInput) hoursInput.value = '0';
      if (minsInput) minsInput.value = `${mins}`;
      if (secsInput) secsInput.value = '0';
      totalRemainingSecs = mins * 60;
      if (display) display.textContent = format(totalRemainingSecs);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCountdownTimer);
} else {
  initCountdownTimer();
}
'''

# 16. Controller for Timezone Converter
TIMEZONE_CONV_TS = '''const baseInput = document.getElementById('tz-base-time') as HTMLInputElement | null;
const clocksWrap = document.getElementById('tz-clocks-wrap') as HTMLElement | null;

const ZONES = [
  { name: 'UTC / GMT', zone: 'UTC', label: 'Universal Time' },
  { name: 'London', zone: 'Europe/London', label: 'UK (GMT/BST)' },
  { name: 'Paris', zone: 'Europe/Paris', label: 'Central European Time' },
  { name: 'New York', zone: 'America/New_York', label: 'US Eastern' },
  { name: 'Los Angeles', zone: 'America/Los_Angeles', label: 'US Pacific' },
  { name: 'Dubai', zone: 'Asia/Dubai', label: 'Gulf Standard Time' },
  { name: 'Mumbai / Delhi', zone: 'Asia/Kolkata', label: 'India Standard Time' },
  { name: 'Singapore', zone: 'Asia/Singapore', label: 'Singapore Standard Time' },
  { name: 'Tokyo', zone: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { name: 'Sydney', zone: 'Australia/Sydney', label: 'Australian Eastern' },
];

export function initTimezoneConv(): void {
  if (!baseInput || !clocksWrap) return;

  function update() {
    const val = baseInput?.value;
    const date = val ? new Date(val) : new Date();

    clocksWrap!.innerHTML = '';
    ZONES.forEach((z) => {
      try {
        const timeStr = date.toLocaleTimeString('en-US', {
          timeZone: z.zone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const dateStr = date.toLocaleDateString('en-US', {
          timeZone: z.zone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

        const card = document.createElement('div');
        card.className = 'p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between';
        card.innerHTML = `
          <div>
            <h4 class="font-bold text-sm text-slate-900 dark:text-white">${z.name}</h4>
            <span class="text-xs text-slate-500">${z.label} &bull; ${dateStr}</span>
          </div>
          <div class="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
            ${timeStr}
          </div>
        `;
        clocksWrap!.appendChild(card);
      } catch {}
    });
  }

  baseInput.value = new Date().toISOString().slice(0, 16);
  baseInput.addEventListener('input', update);
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTimezoneConv);
} else {
  initTimezoneConv();
}
'''

# 17. Controller for URL Encoder/Decoder
URL_ENCODER_TS = '''import { encodeUriText, decodeUriText, parseUrlComponents } from '../utils/cryptoUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const inputArea = document.getElementById('url-input') as HTMLTextAreaElement | null;
const outputArea = document.getElementById('url-output') as HTMLTextAreaElement | null;
const encodeBtn = document.getElementById('url-encode-btn') as HTMLButtonElement | null;
const decodeBtn = document.getElementById('url-decode-btn') as HTMLButtonElement | null;
const parseBtn = document.getElementById('url-parse-btn') as HTMLButtonElement | null;
const copyBtn = document.getElementById('url-copy-btn') as HTMLButtonElement | null;
const parseTable = document.getElementById('url-parse-table') as HTMLElement | null;

export function initUrlEncoder(): void {
  if (!inputArea || !outputArea) return;

  encodeBtn?.addEventListener('click', () => {
    outputArea.value = encodeUriText(inputArea.value);
    parseTable?.classList.add('hidden');
    showToast('URL Encoded!', 'success');
  });

  decodeBtn?.addEventListener('click', () => {
    outputArea.value = decodeUriText(inputArea.value);
    parseTable?.classList.add('hidden');
    showToast('URL Decoded!', 'success');
  });

  parseBtn?.addEventListener('click', () => {
    const parsed = parseUrlComponents(inputArea.value);
    if (!parsed) {
      showToast('Invalid URL format', 'error');
      return;
    }
    outputArea.value = JSON.stringify(parsed, null, 2);
    if (parseTable) {
      parseTable.classList.remove('hidden');
      parseTable.innerHTML = `
        <div class="text-xs font-mono space-y-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div><strong>Protocol:</strong> ${parsed.protocol}</div>
          <div><strong>Host:</strong> ${parsed.host}</div>
          <div><strong>Path:</strong> ${parsed.pathname}</div>
          <div><strong>Parameters:</strong> ${parsed.params.length}</div>
        </div>
      `;
    }
  });

  copyBtn?.addEventListener('click', () => {
    if (!outputArea.value) return;
    navigator.clipboard.writeText(outputArea.value).then(
      () => showToast('Copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUrlEncoder);
} else {
  initUrlEncoder();
}
'''

# 18. Controller for Base64 Encoder/Decoder
BASE64_CONV_TS = '''import { encodeBase64, decodeBase64 } from '../utils/cryptoUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const inputArea = document.getElementById('b64-input') as HTMLTextAreaElement | null;
const outputArea = document.getElementById('b64-output') as HTMLTextAreaElement | null;
const encodeBtn = document.getElementById('b64-encode-btn') as HTMLButtonElement | null;
const decodeBtn = document.getElementById('b64-decode-btn') as HTMLButtonElement | null;
const copyBtn = document.getElementById('b64-copy-btn') as HTMLButtonElement | null;
const fileInput = document.getElementById('b64-file-input') as HTMLInputElement | null;

export function initBase64Conv(): void {
  if (!inputArea || !outputArea) return;

  encodeBtn?.addEventListener('click', () => {
    try {
      outputArea.value = encodeBase64(inputArea.value);
      showToast('Encoded to Base64!', 'success');
    } catch {
      showToast('Encoding error', 'error');
    }
  });

  decodeBtn?.addEventListener('click', () => {
    try {
      outputArea.value = decodeBase64(inputArea.value);
      showToast('Decoded from Base64!', 'success');
    } catch {
      showToast('Invalid Base64 input', 'error');
    }
  });

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      outputArea.value = reader.result as string;
      showToast(`Encoded ${file.name} to Base64 Data URL!`, 'success');
    };
    reader.readAsDataURL(file);
  });

  copyBtn?.addEventListener('click', () => {
    if (!outputArea.value) return;
    navigator.clipboard.writeText(outputArea.value).then(
      () => showToast('Copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBase64Conv);
} else {
  initBase64Conv();
}
'''

CONTROLLERS = {
    "password-gen.ts": PWD_GEN_TS,
    "word-counter.ts": WORD_COUNTER_TS,
    "character-counter.ts": CHAR_COUNTER_TS,
    "case-converter.ts": CASE_CONVERTER_TS,
    "text-diff.ts": TEXT_DIFF_TS,
    "text-reverser.ts": TEXT_REVERSER_TS,
    "lorem-ipsum.ts": LOREM_IPSUM_TS,
    "uuid-generator.ts": UUID_GEN_TS,
    "timestamp-conv.ts": TIMESTAMP_CONV_TS,
    "unit-converter.ts": UNIT_CONVERTER_TS,
    "age-calculator.ts": AGE_CALCULATOR_TS,
    "percentage-calc.ts": PERCENTAGE_CALC_TS,
    "calculator.ts": CALCULATOR_TS,
    "stopwatch.ts": STOPWATCH_TS,
    "countdown-timer.ts": COUNTDOWN_TIMER_TS,
    "timezone-conv.ts": TIMEZONE_CONV_TS,
    "url-encoder.ts": URL_ENCODER_TS,
    "base64-conv.ts": BASE64_CONV_TS,
}

for fname, content in CONTROLLERS.items():
    p = os.path.join(TOOLS_DIR, fname)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created controller {fname}")
