import { decodeJwt } from '../utils/devUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_JWT = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIERldmVsb3BlciIsImFkbWluIjp0cnVlLCJpYXQiOjE3MTYyMzkwMjIsImV4cCI6MjUyNDYwODAwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;

export function initJwtDecoder(): void {
  const tokenInput = document.getElementById('jwt-input') as HTMLTextAreaElement | null;
  const headerOutput = document.getElementById('jwt-header-output') as HTMLPreElement | null;
  const payloadOutput = document.getElementById('jwt-payload-output') as HTMLPreElement | null;
  const signatureOutput = document.getElementById('jwt-signature-output') as HTMLElement | null;

  const statusBadge = document.getElementById('jwt-status-badge') as HTMLElement | null;
  const errorMsgEl = document.getElementById('jwt-error-msg') as HTMLElement | null;
  const expDetailsEl = document.getElementById('jwt-exp-details') as HTMLElement | null;

  const btnSample = document.getElementById('btn-sample') as HTMLButtonElement | null;
  const btnClear = document.getElementById('btn-clear') as HTMLButtonElement | null;
  const btnCopyPayload = document.getElementById('btn-copy-payload') as HTMLButtonElement | null;

  if (!tokenInput) return;

  function decode(): void {
    if (!tokenInput) return;
    const token = tokenInput.value.trim();

    if (!token) {
      if (headerOutput) headerOutput.textContent = '// Header will appear here';
      if (payloadOutput) payloadOutput.textContent = '// Payload will appear here';
      if (signatureOutput) signatureOutput.textContent = '-';
      if (statusBadge) statusBadge.className = 'hidden';
      if (errorMsgEl) errorMsgEl.classList.add('hidden');
      if (expDetailsEl) expDetailsEl.textContent = '';
      return;
    }

    const res = decodeJwt(token);

    if (res.error) {
      if (errorMsgEl) {
        errorMsgEl.textContent = res.error;
        errorMsgEl.classList.remove('hidden');
      }
      if (statusBadge) statusBadge.className = 'hidden';
      return;
    }

    if (errorMsgEl) errorMsgEl.classList.add('hidden');

    if (headerOutput) headerOutput.textContent = JSON.stringify(res.header, null, 2);
    if (payloadOutput) payloadOutput.textContent = JSON.stringify(res.payload, null, 2);
    if (signatureOutput) signatureOutput.textContent = res.signature;

    if (statusBadge) {
      statusBadge.classList.remove('hidden');
      if (res.isExpired) {
        statusBadge.textContent = '✕ Token Expired';
        statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
      } else {
        statusBadge.textContent = '✓ Token Active / Valid';
        statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
      }
    }

    if (expDetailsEl) {
      let expText = '';
      if (res.issuedAt) {
        expText += `Issued at: ${res.issuedAt.toLocaleString()} `;
      }
      if (res.expiresAt) {
        expText += `• Expires: ${res.expiresAt.toLocaleString()}`;
      }
      expDetailsEl.textContent = expText;
    }
  }

  tokenInput.addEventListener('input', decode);

  btnSample?.addEventListener('click', () => {
    tokenInput.value = SAMPLE_JWT;
    decode();
    showToast('Loaded sample JWT!', 'info');
  });

  btnClear?.addEventListener('click', () => {
    tokenInput.value = '';
    decode();
  });

  btnCopyPayload?.addEventListener('click', () => {
    if (!payloadOutput || !payloadOutput.textContent) return;
    navigator.clipboard.writeText(payloadOutput.textContent).then(
      () => showToast('JWT Payload copied!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  // Initial
  if (!tokenInput.value) {
    tokenInput.value = SAMPLE_JWT;
  }
  decode();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initJwtDecoder);
} else {
  initJwtDecoder();
}
