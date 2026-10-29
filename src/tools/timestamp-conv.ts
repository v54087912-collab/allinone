import { parseTimestamp } from '../utils/calcUtils.ts';
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
