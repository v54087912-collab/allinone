import { showToast } from '../shared/site-shell.ts';

export function initUnixTimestampToDate(): void {
  const epochInput = document.getElementById('epoch-input') as HTMLInputElement | null;
  const unitSelect = document.getElementById('epoch-unit') as HTMLSelectElement | null;

  const btnNow = document.getElementById('btn-now') as HTMLButtonElement | null;
  const btnSample = document.getElementById('btn-sample') as HTMLButtonElement | null;

  const isoEl = document.getElementById('ts-iso') as HTMLElement | null;
  const utcEl = document.getElementById('ts-utc') as HTMLElement | null;
  const localEl = document.getElementById('ts-local') as HTMLElement | null;
  const relativeEl = document.getElementById('ts-relative') as HTMLElement | null;

  const tzGmt = document.getElementById('tz-gmt') as HTMLElement | null;
  const tzEst = document.getElementById('tz-est') as HTMLElement | null;
  const tzPst = document.getElementById('tz-pst') as HTMLElement | null;
  const tzCet = document.getElementById('tz-cet') as HTMLElement | null;
  const tzIst = document.getElementById('tz-ist') as HTMLElement | null;
  const tzJst = document.getElementById('tz-jst') as HTMLElement | null;

  if (!epochInput) return;

  function formatRelative(targetMs: number): string {
    const now = Date.now();
    const diffSec = Math.round((targetMs - now) / 1000);
    const absSec = Math.abs(diffSec);

    let timeStr = '';
    if (absSec < 60) timeStr = `${absSec} seconds`;
    else if (absSec < 3600) timeStr = `${Math.round(absSec / 60)} minutes`;
    else if (absSec < 86400) timeStr = `${Math.round(absSec / 3600)} hours`;
    else if (absSec < 2592000) timeStr = `${Math.round(absSec / 86400)} days`;
    else timeStr = `${Math.round(absSec / 2592000)} months`;

    return diffSec >= 0 ? `in ${timeStr}` : `${timeStr} ago`;
  }

  function convert(): void {
    if (!epochInput) return;
    const rawVal = epochInput.value.trim();
    if (!rawVal) {
      clearOutputs();
      return;
    }

    let val = parseFloat(rawVal);
    if (isNaN(val)) {
      clearOutputs();
      return;
    }

    const unit = unitSelect?.value || 's';
    // If unit is seconds, convert to ms
    const ms = unit === 's' ? val * 1000 : val;
    const date = new Date(ms);

    if (isNaN(date.getTime())) {
      clearOutputs();
      return;
    }

    if (isoEl) isoEl.textContent = date.toISOString();
    if (utcEl) utcEl.textContent = date.toUTCString();
    if (localEl) localEl.textContent = date.toString();
    if (relativeEl) relativeEl.textContent = formatRelative(ms);

    // Format timezones safely
    function fmtTz(tz: string): string {
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          dateStyle: 'full',
          timeStyle: 'medium',
        }).format(date);
      } catch {
        return '-';
      }
    }

    if (tzGmt) tzGmt.textContent = fmtTz('GMT');
    if (tzEst) tzEst.textContent = fmtTz('America/New_York');
    if (tzPst) tzPst.textContent = fmtTz('America/Los_Angeles');
    if (tzCet) tzCet.textContent = fmtTz('Europe/Paris');
    if (tzIst) tzIst.textContent = fmtTz('Asia/Kolkata');
    if (tzJst) tzJst.textContent = fmtTz('Asia/Tokyo');
  }

  function clearOutputs(): void {
    if (isoEl) isoEl.textContent = '-';
    if (utcEl) utcEl.textContent = '-';
    if (localEl) localEl.textContent = '-';
    if (relativeEl) relativeEl.textContent = '-';
    if (tzGmt) tzGmt.textContent = '-';
    if (tzEst) tzEst.textContent = '-';
    if (tzPst) tzPst.textContent = '-';
    if (tzCet) tzCet.textContent = '-';
    if (tzIst) tzIst.textContent = '-';
    if (tzJst) tzJst.textContent = '-';
  }

  epochInput.addEventListener('input', convert);
  unitSelect?.addEventListener('change', convert);

  btnNow?.addEventListener('click', () => {
    const isSeconds = unitSelect?.value !== 'ms';
    const now = Date.now();
    epochInput.value = isSeconds ? `${Math.floor(now / 1000)}` : `${now}`;
    convert();
    showToast('Loaded current epoch time!', 'info');
  });

  btnSample?.addEventListener('click', () => {
    epochInput.value = '1774000000';
    if (unitSelect) unitSelect.value = 's';
    convert();
    showToast('Loaded sample epoch!', 'info');
  });

  // Attach individual copy buttons
  document.querySelectorAll<HTMLButtonElement>('[data-copy-field]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const fieldId = btn.getAttribute('data-copy-field');
      const el = document.getElementById(fieldId || '');
      const text = el?.textContent || '';
      if (text && text !== '-') {
        navigator.clipboard.writeText(text).then(
          () => showToast('Copied date to clipboard!', 'success'),
          () => showToast('Failed to copy', 'error')
        );
      }
    });
  });

  // Initial
  if (!epochInput.value) {
    epochInput.value = `${Math.floor(Date.now() / 1000)}`;
  }
  convert();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUnixTimestampToDate);
} else {
  initUnixTimestampToDate();
}
