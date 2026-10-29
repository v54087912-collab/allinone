import { showToast } from '../shared/site-shell.ts';

const SAMPLE_REGEX = `([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})`;
const SAMPLE_TEXT = `Contact us at support@toolora.com or sales.team@sub.domain.co.uk!
Invalid emails like user@ or @domain should not match.
Reach developer at hello-dev_123@quickpic.org for assistance.`;

const REGEX_PRESETS: Record<string, { pattern: string; flags: string; text: string }> = {
  email: {
    pattern: `([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})`,
    flags: 'g',
    text: `Send queries to hello@toolora.com and dev@google.com.`,
  },
  url: {
    pattern: `https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)`,
    flags: 'g',
    text: `Visit https://toolora.com and http://localhost:3000/index.html today!`,
  },
  ipv4: {
    pattern: `\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b`,
    flags: 'g',
    text: `Local router is 192.168.1.1, Google DNS is 8.8.8.8, invalid 999.1.2.3.`,
  },
  phone: {
    pattern: `(?:\\+?(\\d{1,3}))?[-. ]?\\(?(\\d{3})\\)?[-. ]?(\\d{3})[-. ]?(\\d{4})`,
    flags: 'g',
    text: `Call us at +1 (555) 234-5678 or 800-555-1212.`,
  },
  date: {
    pattern: `\\b(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b`,
    flags: 'g',
    text: `Release date is 2026-10-28 and deadline is 2026-12-31.`,
  },
};

export function initRegexTester(): void {
  const patternInput = document.getElementById('regex-pattern') as HTMLInputElement | null;
  const testInput = document.getElementById('regex-test-string') as HTMLTextAreaElement | null;
  const replaceInput = document.getElementById('regex-replace-pattern') as HTMLInputElement | null;

  const flagG = document.getElementById('flag-g') as HTMLInputElement | null;
  const flagI = document.getElementById('flag-i') as HTMLInputElement | null;
  const flagM = document.getElementById('flag-m') as HTMLInputElement | null;
  const flagS = document.getElementById('flag-s') as HTMLInputElement | null;

  const matchCountEl = document.getElementById('stat-match-count') as HTMLElement | null;
  const errorMsgEl = document.getElementById('regex-error-msg') as HTMLElement | null;
  const highlightPreview = document.getElementById('regex-highlight-preview') as HTMLElement | null;
  const matchesList = document.getElementById('regex-matches-list') as HTMLElement | null;
  const replacedOutput = document.getElementById('regex-replaced-output') as HTMLTextAreaElement | null;

  const btnSample = document.getElementById('btn-sample') as HTMLButtonElement | null;
  const btnClear = document.getElementById('btn-clear') as HTMLButtonElement | null;

  if (!patternInput || !testInput) return;

  function runTest(): void {
    if (!patternInput || !testInput) return;

    let flags = '';
    if (flagG?.checked) flags += 'g';
    if (flagI?.checked) flags += 'i';
    if (flagM?.checked) flags += 'm';
    if (flagS?.checked) flags += 's';

    const rawPattern = patternInput.value;
    const text = testInput.value;
    const replacePattern = replaceInput?.value || '';

    if (!rawPattern) {
      if (matchCountEl) matchCountEl.textContent = '0 matches';
      if (highlightPreview) highlightPreview.innerHTML = escapeHtml(text);
      if (matchesList) matchesList.innerHTML = '<div class="text-slate-400 text-xs py-4 text-center">Enter a regular expression above.</div>';
      if (replacedOutput) replacedOutput.value = '';
      if (errorMsgEl) errorMsgEl.classList.add('hidden');
      return;
    }

    let regex: RegExp;
    try {
      regex = new RegExp(rawPattern, flags);
      if (errorMsgEl) {
        errorMsgEl.classList.add('hidden');
        errorMsgEl.textContent = '';
      }
    } catch (e: any) {
      if (errorMsgEl) {
        errorMsgEl.textContent = `Invalid Regex: ${e.message}`;
        errorMsgEl.classList.remove('hidden');
      }
      return;
    }

    // Find matches
    const matches: { match: string; index: number; groups: string[] }[] = [];
    if (flags.includes('g')) {
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        matches.push({
          match: m[0],
          index: m.index,
          groups: m.slice(1),
        });
        if (m.index === regex.lastIndex) regex.lastIndex++;
      }
    } else {
      const m = regex.exec(text);
      if (m) {
        matches.push({
          match: m[0],
          index: m.index,
          groups: m.slice(1),
        });
      }
    }

    if (matchCountEl) {
      matchCountEl.textContent = `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`;
    }

    // Render highlighted text
    if (highlightPreview) {
      if (matches.length === 0) {
        highlightPreview.innerHTML = escapeHtml(text);
      } else {
        let highlighted = '';
        let lastIdx = 0;
        matches.forEach((m) => {
          highlighted += escapeHtml(text.slice(lastIdx, m.index));
          highlighted += `<mark class="bg-amber-300 dark:bg-amber-600/70 text-slate-900 dark:text-white rounded px-1 font-bold">${escapeHtml(m.match)}</mark>`;
          lastIdx = m.index + m.match.length;
        });
        highlighted += escapeHtml(text.slice(lastIdx));
        highlightPreview.innerHTML = highlighted;
      }
    }

    // Render matches breakdown table
    if (matchesList) {
      if (matches.length === 0) {
        matchesList.innerHTML = '<div class="text-slate-400 text-xs py-4 text-center">No matches found.</div>';
      } else {
        matchesList.innerHTML = matches
          .map((m, idx) => `
            <div class="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">${idx + 1}</span>
                <span class="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">${escapeHtml(m.match)}</span>
              </div>
              <div class="text-xs text-slate-400 font-mono">
                Index: ${m.index} ${m.groups.length > 0 ? `&bull; Groups: [${m.groups.map(escapeHtml).join(', ')}]` : ''}
              </div>
            </div>
          `)
          .join('');
      }
    }

    // Substitution / Replace preview
    if (replacedOutput && replacePattern) {
      try {
        replacedOutput.value = text.replace(regex, replacePattern);
      } catch {
        replacedOutput.value = '';
      }
    } else if (replacedOutput) {
      replacedOutput.value = '';
    }
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  patternInput.addEventListener('input', runTest);
  testInput.addEventListener('input', runTest);
  replaceInput?.addEventListener('input', runTest);

  [flagG, flagI, flagM, flagS].forEach((f) => f?.addEventListener('change', runTest));

  // Preset buttons
  document.querySelectorAll<HTMLButtonElement>('[data-regex-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-regex-preset');
      const preset = presetKey ? REGEX_PRESETS[presetKey] : null;
      if (preset) {
        patternInput.value = preset.pattern;
        testInput.value = preset.text;
        if (flagG) flagG.checked = preset.flags.includes('g');
        if (flagI) flagI.checked = preset.flags.includes('i');
        if (flagM) flagM.checked = preset.flags.includes('m');
        if (flagS) flagS.checked = preset.flags.includes('s');
        runTest();
        if (presetKey) showToast(`Loaded ${presetKey.toUpperCase()} regex preset!`, 'info');
      }
    });
  });

  btnSample?.addEventListener('click', () => {
    patternInput.value = SAMPLE_REGEX;
    testInput.value = SAMPLE_TEXT;
    runTest();
  });

  btnClear?.addEventListener('click', () => {
    patternInput.value = '';
    testInput.value = '';
    if (replaceInput) replaceInput.value = '';
    runTest();
  });

  // Initial
  if (!patternInput.value) {
    patternInput.value = SAMPLE_REGEX;
    testInput.value = SAMPLE_TEXT;
  }
  runTest();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRegexTester);
} else {
  initRegexTester();
}
