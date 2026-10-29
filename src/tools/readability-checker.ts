import { calculateReadability } from '../utils/textUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const SAMPLE_EASY = `The cat sat on the warm mat. It was a sunny day in the green park. A little boy came along and tossed a red ball. The cat leaped high into the air and caught it. Everyone smiled and clapped their hands. It was simple, fun, and easy for everyone to enjoy.`;

const SAMPLE_HARD = `Notwithstanding the intricate philosophical tenets previously articulated regarding quantum decoherence, empirical observations substantiate the hypothesis that macroscopic superpositions rapidly degrade via environmental entanglement. Consequently, thermodynamic irreversibility demonstrates profound ramifications across computational quantum architectures.`;

export function initReadabilityChecker(): void {
  const textarea = document.getElementById('read-input') as HTMLTextAreaElement | null;

  const easeEl = document.getElementById('stat-flesch-ease') as HTMLElement | null;
  const levelEl = document.getElementById('stat-reading-level') as HTMLElement | null;
  const gradeEl = document.getElementById('stat-grade-level') as HTMLElement | null;
  const fogEl = document.getElementById('stat-gunning-fog') as HTMLElement | null;
  const readTimeEl = document.getElementById('stat-read-time') as HTMLElement | null;

  const wordsEl = document.getElementById('stat-words') as HTMLElement | null;
  const sentencesEl = document.getElementById('stat-sentences') as HTMLElement | null;
  const syllablesEl = document.getElementById('stat-syllables') as HTMLElement | null;
  const complexEl = document.getElementById('stat-complex-words') as HTMLElement | null;
  const tipsEl = document.getElementById('read-tips') as HTMLElement | null;

  const sampleEasyBtn = document.getElementById('btn-sample-easy') as HTMLButtonElement | null;
  const sampleHardBtn = document.getElementById('btn-sample-hard') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('btn-clear') as HTMLButtonElement | null;
  const copyBtn = document.getElementById('btn-copy') as HTMLButtonElement | null;

  if (!textarea) return;

  function update(): void {
    if (!textarea) return;
    const text = textarea.value;
    const score = calculateReadability(text);

    if (easeEl) easeEl.textContent = `${score.fleschEase}`;
    if (levelEl) levelEl.textContent = score.readingLevel;
    if (gradeEl) gradeEl.textContent = `Grade ${score.gradeLevel}`;
    if (fogEl) fogEl.textContent = `${score.gunningFog}`;
    if (readTimeEl) readTimeEl.textContent = `${score.readingTimeMin} min`;

    if (wordsEl) wordsEl.textContent = `${score.words}`;
    if (sentencesEl) sentencesEl.textContent = `${score.sentences}`;
    if (syllablesEl) syllablesEl.textContent = `${score.syllables}`;
    if (complexEl) complexEl.textContent = `${score.complexWords}`;

    if (tipsEl) {
      if (!text.trim()) {
        tipsEl.innerHTML = `<li class="text-slate-400 dark:text-slate-500 text-xs">Enter text to view writing style tips and audience recommendations.</li>`;
      } else {
        const tips: string[] = [];

        if (score.fleschEase >= 80) {
          tips.push('🟢 Excellent readability! Accessible to a broad audience, including younger readers and conversational web copy.');
        } else if (score.fleschEase >= 60) {
          tips.push('🔵 Standard readability. Well-balanced for blogs, articles, and general professional communication.');
        } else if (score.fleschEase >= 50) {
          tips.push('🟡 Moderately complex. Consider splitting long sentences and substituting complex multi-syllable terms for general audiences.');
        } else {
          tips.push('🔴 Academic or dense reading level. Sentences and vocabulary may challenge average readers.');
        }

        const avgWordsPerSent = score.words / Math.max(1, score.sentences);
        if (avgWordsPerSent > 20) {
          tips.push(`⚠️ Your average sentence length is ${Math.round(avgWordsPerSent)} words. Aim for 14-18 words per sentence for optimal engagement.`);
        } else {
          tips.push(`✓ Average sentence length (${Math.round(avgWordsPerSent)} words) is in a healthy, engaging range.`);
        }

        const complexPct = (score.complexWords / Math.max(1, score.words)) * 100;
        if (complexPct > 15) {
          tips.push(`⚠️ Complex words make up ${Math.round(complexPct)}% of your text. Replacing some 3+ syllable words can increase clarity.`);
        }

        tipsEl.innerHTML = tips
          .map((t) => `<li class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2 leading-relaxed"><span class="mt-0.5">•</span><span>${t}</span></li>`)
          .join('');
      }
    }
  }

  textarea.addEventListener('input', update);

  sampleEasyBtn?.addEventListener('click', () => {
    textarea.value = SAMPLE_EASY;
    update();
    showToast('Loaded easy reading sample!', 'info');
  });

  sampleHardBtn?.addEventListener('click', () => {
    textarea.value = SAMPLE_HARD;
    update();
    showToast('Loaded academic reading sample!', 'info');
  });

  clearBtn?.addEventListener('click', () => {
    textarea.value = '';
    update();
  });

  copyBtn?.addEventListener('click', () => {
    if (!textarea.value) return;
    navigator.clipboard.writeText(textarea.value).then(
      () => showToast('Text copied to clipboard!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReadabilityChecker);
} else {
  initReadabilityChecker();
}
