import { summarizeText } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_TEXT = `Artificial intelligence and machine learning technologies are fundamentally reshaping how software engineers build consumer applications. Historically, complex computing tasks such as natural language processing, computer vision, and speech recognition mandated massive centralized datacenters with rack-mounted graphics processors. Every user query had to traverse transcontinental fiber optic cables, exposing proprietary information to potential interception and introducing unavoidable network latency.

However, recent advancements in browser engine sandboxing, WebAssembly compilation, and hardware-accelerated WebGPU interfaces have unlocked an entirely new computing paradigm: true client-side edge computing. By executing machine learning models directly on end-user hardware, modern applications achieve unprecedented performance, near-zero latency, and complete privacy compliance. 

Users no longer need to trust remote servers with sensitive tax documents, family photos, or medical records. Because data never leaves the local memory buffer, security risks are mathematically mitigated at the architectural layer. Furthermore, client-side processing radically eliminates infrastructure hosting costs for application providers, allowing high-utility web tools to be distributed 100% free of charge without monetizing user privacy. As web runtimes continue their rapid expansion, local-first computing is positioned to become the gold standard for global software architecture.`;

export function initTextSummarizer(): void {
  const inputEl = document.getElementById('sum-input') as HTMLTextAreaElement | null;
  const outputEl = document.getElementById('sum-output') as HTMLTextAreaElement | null;

  const ratioSlider = document.getElementById('sum-ratio-slider') as HTMLInputElement | null;
  const ratioLabel = document.getElementById('sum-ratio-label') as HTMLElement | null;

  const btnShort = document.getElementById('btn-ratio-short') as HTMLButtonElement | null;
  const btnMed = document.getElementById('btn-ratio-med') as HTMLButtonElement | null;
  const btnLong = document.getElementById('btn-ratio-long') as HTMLButtonElement | null;

  const reductionEl = document.getElementById('stat-reduction-pct') as HTMLElement | null;
  const origWordsEl = document.getElementById('stat-orig-words') as HTMLElement | null;
  const sumWordsEl = document.getElementById('stat-sum-words') as HTMLElement | null;

  const keySentencesList = document.getElementById('sum-key-sentences') as HTMLElement | null;
  const keywordsContainer = document.getElementById('sum-keywords') as HTMLElement | null;

  const copyBtn = document.getElementById('sum-copy-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('sum-download-btn') as HTMLButtonElement | null;
  const sampleBtn = document.getElementById('sum-sample-btn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('sum-clear-btn') as HTMLButtonElement | null;

  if (!inputEl || !outputEl) return;

  function update(): void {
    if (!inputEl || !outputEl) return;
    const text = inputEl.value;
    const ratioVal = ratioSlider ? parseInt(ratioSlider.value, 10) / 100 : 0.35;

    if (ratioLabel && ratioSlider) {
      const pct = ratioSlider.value;
      let label = `${pct}%`;
      if (pct <= '25') label += ' (Concise)';
      else if (pct <= '40') label += ' (Standard)';
      else label += ' (Detailed)';
      ratioLabel.textContent = label;
    }

    if (!text.trim()) {
      outputEl.value = '';
      if (reductionEl) reductionEl.textContent = '0%';
      if (origWordsEl) origWordsEl.textContent = '0';
      if (sumWordsEl) sumWordsEl.textContent = '0';
      if (keySentencesList) {
        keySentencesList.innerHTML = `<li class="text-slate-400 dark:text-slate-500 text-xs">Key extracted sentences will appear here.</li>`;
      }
      if (keywordsContainer) {
        keywordsContainer.innerHTML = `<span class="text-slate-400 dark:text-slate-500 text-xs">Key topics will be tagged here.</span>`;
      }
      return;
    }

    const res = summarizeText(text, ratioVal);
    outputEl.value = res.summary;

    if (reductionEl) reductionEl.textContent = `${res.reductionPercentage}%`;
    if (origWordsEl) origWordsEl.textContent = `${res.originalWords}`;
    if (sumWordsEl) sumWordsEl.textContent = `${res.summaryWords}`;

    if (keywordsContainer) {
      if (res.keywords.length > 0) {
        keywordsContainer.innerHTML = res.keywords
          .map((kw) => `<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">#${kw}</span>`)
          .join('');
      } else {
        keywordsContainer.innerHTML = '';
      }
    }

    if (keySentencesList) {
      if (res.keySentences.length > 0) {
        keySentencesList.innerHTML = res.keySentences
          .map((sent, idx) => `
            <li class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2">
              <span class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex-shrink-0 flex items-center justify-center text-[10px]">${idx + 1}</span>
              <span>${sent}</span>
            </li>
          `)
          .join('');
      } else {
        keySentencesList.innerHTML = '';
      }
    }
  }

  inputEl.addEventListener('input', update);
  ratioSlider?.addEventListener('input', update);

  btnShort?.addEventListener('click', () => {
    if (ratioSlider) ratioSlider.value = '20';
    update();
    showToast('Summary length set to Concise (20%)', 'info');
  });

  btnMed?.addEventListener('click', () => {
    if (ratioSlider) ratioSlider.value = '35';
    update();
    showToast('Summary length set to Standard (35%)', 'info');
  });

  btnLong?.addEventListener('click', () => {
    if (ratioSlider) ratioSlider.value = '50';
    update();
    showToast('Summary length set to Detailed (50%)', 'info');
  });

  sampleBtn?.addEventListener('click', () => {
    inputEl.value = SAMPLE_TEXT;
    update();
    showToast('Loaded sample text for summarization!', 'info');
  });

  clearBtn?.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    update();
  });

  copyBtn?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(outputEl.value).then(
      () => showToast('Summary copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  downloadBtn?.addEventListener('click', () => {
    if (!outputEl.value) {
      showToast('Nothing to download', 'warning');
      return;
    }
    const blob = new Blob([outputEl.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Summary downloaded!', 'success');
  });

  if (!inputEl.value) {
    inputEl.value = SAMPLE_TEXT;
  }
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTextSummarizer);
} else {
  initTextSummarizer();
}
