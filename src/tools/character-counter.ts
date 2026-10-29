import { showToast } from '../shared/site-shell.ts';

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
    const noSpace = text.replace(/\s/g, '').length;
    const letters = (text.match(/[a-zA-Z]/g) || []).length;
    const numbers = (text.match(/[0-9]/g) || []).length;
    const spaces = (text.match(/\s/g) || []).length;
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
