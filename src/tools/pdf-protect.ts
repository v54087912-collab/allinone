/**
 * PDF Password Protector & Encryption Tool (100% In-Browser)
 */
import {
  calculatePasswordStrength,
  encryptPdfBytes,
  decryptPdfBytes,
} from '../utils/pdfProtectUtils.ts';
import { formatBytes } from '../utils/image-math.ts';
import { showToast } from '../shared/site-shell.ts';

let loadedFileBytes: Uint8Array | null = null;
let originalFileName = 'document.pdf';
let activeMode: 'protect' | 'unlock' = 'protect';

// DOM Elements
const dropzone = document.getElementById('protect-dropzone') as HTMLElement | null;
const fileInput = document.getElementById('protect-file-input') as HTMLInputElement | null;
const workspace = document.getElementById('protect-workspace') as HTMLElement | null;
const modeProtectRadio = document.getElementById('protect-mode-encrypt') as HTMLInputElement | null;
const modeUnlockRadio = document.getElementById('protect-mode-decrypt') as HTMLInputElement | null;
const protectSection = document.getElementById('protect-encrypt-section') as HTMLElement | null;
const unlockSection = document.getElementById('protect-decrypt-section') as HTMLElement | null;

// Inputs
const passInput = document.getElementById('protect-pass') as HTMLInputElement | null;
const passConfirm = document.getElementById('protect-pass-confirm') as HTMLInputElement | null;
const strengthBar = document.getElementById('protect-strength-bar') as HTMLElement | null;
const strengthLabel = document.getElementById('protect-strength-label') as HTMLElement | null;
const unlockPassInput = document.getElementById('protect-unlock-pass') as HTMLInputElement | null;

const submitProtectBtn = document.getElementById('protect-submit-btn') as HTMLButtonElement | null;
const submitUnlockBtn = document.getElementById('protect-unlock-btn') as HTMLButtonElement | null;
const resetBtn = document.getElementById('protect-reset-btn') as HTMLButtonElement | null;
const metaBadge = document.getElementById('protect-meta-badge') as HTMLElement | null;

export function initProtectTool(): void {
  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleFile(file);
    fileInput.value = '';
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-950/20');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });

  // Mode radio toggle
  modeProtectRadio?.addEventListener('change', () => switchMode('protect'));
  modeUnlockRadio?.addEventListener('change', () => switchMode('unlock'));

  // Password strength meter
  passInput?.addEventListener('input', () => {
    const val = passInput.value || '';
    const { score, label } = calculatePasswordStrength(val);

    if (strengthBar) {
      strengthBar.style.width = `${score}%`;
      strengthBar.className = `h-full rounded-full transition-all duration-200 ${
        score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
      }`;
    }

    if (strengthLabel) {
      strengthLabel.textContent = `${label} (${score}%)`;
      strengthLabel.className = `font-bold ${
        score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : score >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
      }`;
    }
  });

  submitProtectBtn?.addEventListener('click', handleProtectPdf);
  submitUnlockBtn?.addEventListener('click', handleUnlockPdf);

  resetBtn?.addEventListener('click', () => {
    loadedFileBytes = null;
    if (passInput) passInput.value = '';
    if (passConfirm) passConfirm.value = '';
    if (unlockPassInput) unlockPassInput.value = '';
    workspace?.classList.add('hidden');
    dropzone?.classList.remove('hidden');
  });
}

function switchMode(mode: 'protect' | 'unlock') {
  activeMode = mode;
  if (mode === 'protect') {
    protectSection?.classList.remove('hidden');
    unlockSection?.classList.add('hidden');
  } else {
    protectSection?.classList.add('hidden');
    unlockSection?.classList.remove('hidden');
  }
}

async function handleFile(file: File) {
  try {
    originalFileName = file.name;
    const buf = await file.arrayBuffer();
    loadedFileBytes = new Uint8Array(buf);

    dropzone?.classList.add('hidden');
    workspace?.classList.remove('hidden');

    if (metaBadge) {
      metaBadge.textContent = `${file.name} \u2022 ${formatBytes(file.size)}`;
    }

    // Auto-detect if file is already encrypted by checking magic bytes
    if (
      loadedFileBytes.length > 7 &&
      loadedFileBytes[0] === 0x51 &&
      loadedFileBytes[1] === 0x50 &&
      loadedFileBytes[2] === 0x49 &&
      loadedFileBytes[3] === 0x43
    ) {
      if (modeUnlockRadio) modeUnlockRadio.checked = true;
      switchMode('unlock');
      showToast('Detected encrypted document! Enter password to unlock.', 'info');
    } else {
      if (modeProtectRadio) modeProtectRadio.checked = true;
      switchMode('protect');
      showToast('PDF loaded! Enter a password to encrypt.', 'success');
    }
  } catch (err: any) {
    showToast('Failed to load file: ' + err.message, 'error');
  }
}

async function handleProtectPdf() {
  if (!loadedFileBytes) return;

  const password = passInput?.value || '';
  const confirm = passConfirm?.value || '';

  if (!password) {
    showToast('Please enter an encryption password.', 'error');
    passInput?.focus();
    return;
  }

  if (password.length < 4) {
    showToast('Password must be at least 4 characters long.', 'error');
    passInput?.focus();
    return;
  }

  if (password !== confirm) {
    showToast('Passwords do not match. Please retype.', 'error');
    passConfirm?.focus();
    return;
  }

  try {
    if (submitProtectBtn) submitProtectBtn.disabled = true;
    showToast('Encrypting PDF with 256-bit AES-GCM...', 'info');

    const encryptedBytes = await encryptPdfBytes(loadedFileBytes, password);

    const blob = new Blob([encryptedBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_protected.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    showToast('Password-protected PDF downloaded successfully!', 'success');
  } catch (err: any) {
    console.error('Encryption error:', err);
    showToast('Encryption failed: ' + err.message, 'error');
  } finally {
    if (submitProtectBtn) submitProtectBtn.disabled = false;
  }
}

async function handleUnlockPdf() {
  if (!loadedFileBytes) return;

  const password = unlockPassInput?.value || '';
  if (!password) {
    showToast('Please enter the document password.', 'error');
    unlockPassInput?.focus();
    return;
  }

  try {
    if (submitUnlockBtn) submitUnlockBtn.disabled = true;
    showToast('Decrypting document...', 'info');

    const decryptedBytes = await decryptPdfBytes(loadedFileBytes, password);

    const blob = new Blob([decryptedBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = originalFileName.replace(/_protected/i, '').replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_unlocked.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    showToast('Document unlocked and downloaded!', 'success');
  } catch (err: any) {
    console.error('Decryption error:', err);
    showToast('Failed to unlock: ' + err.message, 'error');
  } finally {
    if (submitUnlockBtn) submitUnlockBtn.disabled = false;
  }
}

// Auto init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProtectTool);
} else {
  initProtectTool();
}
