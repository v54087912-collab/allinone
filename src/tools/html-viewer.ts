import { showToast } from '../shared/site-shell.ts';

const SAMPLE_TEMPLATES: Record<string, string> = {
  landing: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, sans-serif; }
  </style>
</head>
<body class="bg-gradient-to-br from-slate-900 to-indigo-950 text-white min-h-screen flex items-center justify-center p-6">
  <div class="max-w-lg text-center space-y-6">
    <span class="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-400/30">
      Interactive Demo
    </span>
    <h1 class="text-4xl font-black tracking-tight leading-tight">
      Build Fast. Ship Confidently.
    </h1>
    <p class="text-slate-300 text-sm leading-relaxed">
      Welcome to Toolora's Live HTML Previewer. Edit code in real-time and test responsive viewport layouts effortlessly!
    </p>
    <div class="flex items-center justify-center gap-3">
      <button class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs shadow-lg transition-transform active:scale-95">
        Get Started
      </button>
      <button class="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold">
        Learn More &rarr;
      </button>
    </div>
  </div>
</body>
</html>`,
  card: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 40px; background: #f1f5f9; display: flex; justify-content: center; font-family: sans-serif; }
    .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 340px; }
    .badge { background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: bold; }
    h2 { margin: 12px 0 8px; font-size: 20px; color: #0f172a; }
    p { color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 16px; }
    button { width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">PRO PRODUCT</span>
    <h2>Premium Subscription</h2>
    <p>Unlock unlimited fast conversions, client-side batch processing, and offline access.</p>
    <button onclick="alert('Demo Button Clicked!')">Activate Now</button>
  </div>
</body>
</html>`,
  animation: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; }
    .spinner {
      width: 60px;
      height: 60px;
      border: 6px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s infinite linear;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="spinner"></div>
</body>
</html>`,
};

export function initHtmlViewer(): void {
  const textarea = document.getElementById('html-input') as HTMLTextAreaElement | null;
  const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement | null;
  const iframeContainer = document.getElementById('iframe-container') as HTMLElement | null;

  const btnDesktop = document.getElementById('btn-view-desktop') as HTMLButtonElement | null;
  const btnTablet = document.getElementById('btn-view-tablet') as HTMLButtonElement | null;
  const btnMobile = document.getElementById('btn-view-mobile') as HTMLButtonElement | null;

  const btnClear = document.getElementById('btn-clear') as HTMLButtonElement | null;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;
  const btnDownload = document.getElementById('btn-download') as HTMLButtonElement | null;

  if (!textarea || !iframe) return;

  function renderPreview(): void {
    if (!textarea || !iframe) return;
    const code = textarea.value;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(code);
      doc.close();
    }
  }

  function setViewport(mode: 'desktop' | 'tablet' | 'mobile'): void {
    if (!iframeContainer) return;

    [btnDesktop, btnTablet, btnMobile].forEach((btn) => {
      btn?.classList.remove('bg-blue-600', 'text-white');
      btn?.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
    });

    if (mode === 'desktop') {
      iframeContainer.style.width = '100%';
      btnDesktop?.classList.add('bg-blue-600', 'text-white');
      btnDesktop?.classList.remove('bg-white', 'dark:bg-slate-800');
    } else if (mode === 'tablet') {
      iframeContainer.style.width = '768px';
      btnTablet?.classList.add('bg-blue-600', 'text-white');
      btnTablet?.classList.remove('bg-white', 'dark:bg-slate-800');
    } else if (mode === 'mobile') {
      iframeContainer.style.width = '375px';
      btnMobile?.classList.add('bg-blue-600', 'text-white');
      btnMobile?.classList.remove('bg-white', 'dark:bg-slate-800');
    }
  }

  textarea.addEventListener('input', renderPreview);

  btnDesktop?.addEventListener('click', () => setViewport('desktop'));
  btnTablet?.addEventListener('click', () => setViewport('tablet'));
  btnMobile?.addEventListener('click', () => setViewport('mobile'));

  // Template loaders
  document.querySelectorAll<HTMLButtonElement>('[data-html-template]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-html-template');
      if (key && SAMPLE_TEMPLATES[key]) {
        textarea.value = SAMPLE_TEMPLATES[key];
        renderPreview();
        showToast(`Loaded ${key.toUpperCase()} template!`, 'info');
      }
    });
  });

  btnClear?.addEventListener('click', () => {
    textarea.value = '';
    renderPreview();
  });

  btnCopy?.addEventListener('click', () => {
    if (!textarea.value) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(textarea.value).then(
      () => showToast('HTML copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  btnDownload?.addEventListener('click', () => {
    if (!textarea.value) {
      showToast('Nothing to download', 'warning');
      return;
    }
    const blob = new Blob([textarea.value], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page.html';
    a.click();
    URL.revokeObjectURL(url);
    showToast('HTML file downloaded!', 'success');
  });

  // Initial load
  if (!textarea.value) {
    textarea.value = SAMPLE_TEMPLATES.landing;
  }
  renderPreview();
  setViewport('desktop');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHtmlViewer);
} else {
  initHtmlViewer();
}
