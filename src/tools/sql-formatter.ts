import { formatSql, minifySql } from '../utils/devUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_SQL = `select u.id, u.username, u.email, count(o.id) as total_orders, sum(o.amount) as total_spent from users u left join orders o on u.id = o.user_id where u.active = 1 and u.created_at >= '2026-01-01' group by u.id, u.username, u.email having count(o.id) > 5 order by total_spent desc limit 50;`;

export function initSqlFormatter(): void {
  const inputEl = document.getElementById('sql-input') as HTMLTextAreaElement | null;
  const outputEl = document.getElementById('sql-output') as HTMLTextAreaElement | null;

  const btnFormat = document.getElementById('btn-format') as HTMLButtonElement | null;
  const btnMinify = document.getElementById('btn-minify') as HTMLButtonElement | null;
  const btnSample = document.getElementById('btn-sample') as HTMLButtonElement | null;
  const btnClear = document.getElementById('btn-clear') as HTMLButtonElement | null;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;
  const btnDownload = document.getElementById('btn-download') as HTMLButtonElement | null;

  if (!inputEl || !outputEl) return;

  function doFormat(): void {
    if (!inputEl || !outputEl) return;
    const raw = inputEl.value;
    outputEl.value = formatSql(raw);
  }

  function doMinify(): void {
    if (!inputEl || !outputEl) return;
    const raw = inputEl.value;
    outputEl.value = minifySql(raw);
    showToast('SQL minified to single line!', 'info');
  }

  inputEl.addEventListener('input', doFormat);

  btnFormat?.addEventListener('click', () => {
    doFormat();
    showToast('Formatted SQL Query!', 'info');
  });

  btnMinify?.addEventListener('click', doMinify);

  btnSample?.addEventListener('click', () => {
    inputEl.value = SAMPLE_SQL;
    doFormat();
    showToast('Loaded sample SQL query!', 'info');
  });

  btnClear?.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
  });

  btnCopy?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(outputEl.value).then(
      () => showToast('SQL query copied!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  btnDownload?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to download', 'warning');
      return;
    }
    const blob = new Blob([outputEl.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query.sql';
    a.click();
    URL.revokeObjectURL(url);
    showToast('SQL file downloaded!', 'success');
  });

  if (!inputEl.value) {
    inputEl.value = SAMPLE_SQL;
  }
  doFormat();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSqlFormatter);
} else {
  initSqlFormatter();
}
