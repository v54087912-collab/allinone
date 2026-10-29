import { minifyHtml, minifyCss, minifyJs } from '../utils/devUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
  <head>
    <!-- Main page title -->
    <title>Toolora Utilities</title>
    <style>
      body {
        margin: 0;
        padding: 20px;
        background-color: #f8fafc;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Hello World</h1>
      <p>Clean, compressed HTML with comments removed.</p>
    </div>
  </body>
</html>`;

const SAMPLE_CSS = `/* Navigation styles */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

/* Button hover effects */
.btn-primary:hover {
  background-color: #1d4ed8;
  transform: translateY(-2px);
}`;

const SAMPLE_JS = `// Calculate factorial function
function factorial(n) {
  // Base condition
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

const result = factorial(5);
console.log('Result:', result);`;

export function initCodeMinifier(): void {
  const inputEl = document.getElementById('code-input') as HTMLTextAreaElement | null;
  const outputEl = document.getElementById('code-output') as HTMLTextAreaElement | null;

  const tabBtns = document.querySelectorAll<HTMLButtonElement>('[data-lang-tab]');
  const origSizeEl = document.getElementById('stat-orig-size') as HTMLElement | null;
  const minSizeEl = document.getElementById('stat-min-size') as HTMLElement | null;
  const reductionEl = document.getElementById('stat-reduction-pct') as HTMLElement | null;

  const btnMinify = document.getElementById('btn-minify') as HTMLButtonElement | null;
  const btnSample = document.getElementById('btn-sample') as HTMLButtonElement | null;
  const btnClear = document.getElementById('btn-clear') as HTMLButtonElement | null;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;
  const btnDownload = document.getElementById('btn-download') as HTMLButtonElement | null;

  if (!inputEl || !outputEl) return;

  let currentLang: 'html' | 'css' | 'js' = 'html';

  function minify(): void {
    if (!inputEl || !outputEl) return;
    const raw = inputEl.value;

    if (!raw.trim()) {
      outputEl.value = '';
      if (origSizeEl) origSizeEl.textContent = '0 B';
      if (minSizeEl) minSizeEl.textContent = '0 B';
      if (reductionEl) reductionEl.textContent = '0%';
      return;
    }

    let minified = '';
    if (currentLang === 'html') minified = minifyHtml(raw);
    else if (currentLang === 'css') minified = minifyCss(raw);
    else if (currentLang === 'js') minified = minifyJs(raw);

    outputEl.value = minified;

    const origBytes = new Blob([raw]).size;
    const minBytes = new Blob([minified]).size;
    const saved = Math.max(0, origBytes - minBytes);
    const pct = origBytes > 0 ? Math.round((saved / origBytes) * 100) : 0;

    if (origSizeEl) origSizeEl.textContent = formatBytes(origBytes);
    if (minSizeEl) minSizeEl.textContent = formatBytes(minBytes);
    if (reductionEl) reductionEl.textContent = `-${pct}%`;
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  function switchTab(lang: 'html' | 'css' | 'js'): void {
    currentLang = lang;
    tabBtns.forEach((btn) => {
      const bLang = btn.getAttribute('data-lang-tab');
      if (bLang === lang) {
        btn.classList.add('bg-blue-600', 'text-white');
        btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      }
    });

    if (lang === 'html') inputEl!.value = SAMPLE_HTML;
    else if (lang === 'css') inputEl!.value = SAMPLE_CSS;
    else if (lang === 'js') inputEl!.value = SAMPLE_JS;

    minify();
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const l = btn.getAttribute('data-lang-tab') as 'html' | 'css' | 'js';
      if (l) switchTab(l);
    });
  });

  inputEl.addEventListener('input', minify);

  btnMinify?.addEventListener('click', () => {
    minify();
    showToast(`Minified ${currentLang.toUpperCase()} code!`, 'info');
  });

  btnSample?.addEventListener('click', () => {
    switchTab(currentLang);
    showToast('Loaded sample code!', 'info');
  });

  btnClear?.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    minify();
  });

  btnCopy?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(outputEl.value).then(
      () => showToast('Minified code copied!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  btnDownload?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to download', 'warning');
      return;
    }
    const ext = currentLang === 'html' ? 'html' : currentLang === 'css' ? 'css' : 'js';
    const mime = currentLang === 'html' ? 'text/html' : currentLang === 'css' ? 'text/css' : 'application/javascript';
    const blob = new Blob([outputEl.value], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minified.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Minified file downloaded!', 'success');
  });

  // Initial
  if (!inputEl.value) {
    inputEl.value = SAMPLE_HTML;
  }
  minify();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCodeMinifier);
} else {
  initCodeMinifier();
}
