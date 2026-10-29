import { renderSimpleMarkdown, analyzeText } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_MARKDOWN = `# Welcome to Markdown Editor
A **fast**, _lightweight_, and 100% private in-browser Markdown editor.

## Key Features
* Real-time preview with zero latency
* Clean HTML rendering
* Common formatting toolbar shortcuts
* Instant export as \`.md\` or \`.html\`

### Code Example
\`\`\`javascript
function greetUser(name) {
  return \`Hello, \${name}! Welcome to Toolora.\`;
}
console.log(greetUser('Developer'));
\`\`\`

> "Simplicity is the soul of efficiency." – Austin Freeman

---
Check out more utilities at [Toolora](https://toolora.com).
`;

export function initMarkdownEditor(): void {
  const textarea = document.getElementById('md-input') as HTMLTextAreaElement | null;
  const preview = document.getElementById('md-preview') as HTMLDivElement | null;

  const wordsEl = document.getElementById('stat-words') as HTMLElement | null;
  const charsEl = document.getElementById('stat-chars') as HTMLElement | null;
  const linesEl = document.getElementById('stat-lines') as HTMLElement | null;

  const copyMdBtn = document.getElementById('md-copy-btn') as HTMLButtonElement | null;
  const copyHtmlBtn = document.getElementById('md-copy-html-btn') as HTMLButtonElement | null;
  const downloadMdBtn = document.getElementById('md-download-md-btn') as HTMLButtonElement | null;
  const downloadHtmlBtn = document.getElementById('md-download-html-btn') as HTMLButtonElement | null;
  const sampleBtn = document.getElementById('md-sample-btn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('md-clear-btn') as HTMLButtonElement | null;

  if (!textarea || !preview) return;

  function update(): void {
    if (!textarea || !preview) return;
    const md = textarea.value;
    const html = renderSimpleMarkdown(md);
    preview.innerHTML = html || '<div class="text-slate-400 dark:text-slate-500 italic">Rendered preview will appear here...</div>';

    const stats = analyzeText(md);
    const lineCount = md ? md.split(/\r?\n/).length : 0;

    if (wordsEl) wordsEl.textContent = `${stats.words}`;
    if (charsEl) charsEl.textContent = `${stats.characters}`;
    if (linesEl) linesEl.textContent = `${lineCount}`;
  }

  function wrapSelection(prefix: string, suffix = ''): void {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);

    const replacement = `${prefix}${selection || 'text'}${suffix}`;
    textarea.value = text.substring(0, start) + replacement + text.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selection ? selection.length : 4));
    update();
  }

  function insertLinePrefix(prefix: string): void {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const text = textarea.value;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;

    textarea.value = text.substring(0, lineStart) + prefix + text.substring(lineStart);
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    update();
  }

  // Toolbar handlers
  document.getElementById('btn-bold')?.addEventListener('click', () => wrapSelection('**', '**'));
  document.getElementById('btn-italic')?.addEventListener('click', () => wrapSelection('*', '*'));
  document.getElementById('btn-h1')?.addEventListener('click', () => insertLinePrefix('# '));
  document.getElementById('btn-h2')?.addEventListener('click', () => insertLinePrefix('## '));
  document.getElementById('btn-h3')?.addEventListener('click', () => insertLinePrefix('### '));
  document.getElementById('btn-code')?.addEventListener('click', () => wrapSelection('`', '`'));
  document.getElementById('btn-codeblock')?.addEventListener('click', () => wrapSelection('```javascript\n', '\n```'));
  document.getElementById('btn-quote')?.addEventListener('click', () => insertLinePrefix('> '));
  document.getElementById('btn-list')?.addEventListener('click', () => insertLinePrefix('- '));
  document.getElementById('btn-link')?.addEventListener('click', () => wrapSelection('[', '](https://example.com)'));
  document.getElementById('btn-hr')?.addEventListener('click', () => wrapSelection('\n---\n'));

  textarea.addEventListener('input', update);

  sampleBtn?.addEventListener('click', () => {
    textarea.value = SAMPLE_MARKDOWN;
    update();
    showToast('Loaded sample markdown!', 'info');
  });

  clearBtn?.addEventListener('click', () => {
    textarea.value = '';
    update();
  });

  copyMdBtn?.addEventListener('click', () => {
    if (!textarea.value) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(textarea.value).then(
      () => showToast('Markdown copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  copyHtmlBtn?.addEventListener('click', () => {
    if (!preview.innerHTML) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(preview.innerHTML).then(
      () => showToast('HTML code copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  downloadMdBtn?.addEventListener('click', () => {
    if (!textarea.value) return;
    const blob = new Blob([textarea.value], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Markdown file downloaded!', 'success');
  });

  downloadHtmlBtn?.addEventListener('click', () => {
    if (!preview.innerHTML) return;
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Exported Markdown</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #db2777; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; color: #475569; font-style: italic; margin: 16px 0; }
  </style>
</head>
<body>
${preview.innerHTML}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
    showToast('HTML file downloaded!', 'success');
  });

  // Initial load
  if (!textarea.value) {
    textarea.value = SAMPLE_MARKDOWN;
  }
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMarkdownEditor);
} else {
  initMarkdownEditor();
}
