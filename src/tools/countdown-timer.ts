import { showToast } from '../shared/site-shell.ts';

const hoursInput = document.getElementById('timer-hours') as HTMLInputElement | null;
const minsInput = document.getElementById('timer-mins') as HTMLInputElement | null;
const secsInput = document.getElementById('timer-secs') as HTMLInputElement | null;
const display = document.getElementById('timer-display') as HTMLElement | null;
const startBtn = document.getElementById('timer-start') as HTMLButtonElement | null;
const pauseBtn = document.getElementById('timer-pause') as HTMLButtonElement | null;
const resetBtn = document.getElementById('timer-reset') as HTMLButtonElement | null;

let totalRemainingSecs = 0;
let timerInterval: any = null;

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {}
}

export function initCountdownTimer(): void {
  function format(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function tick() {
    if (totalRemainingSecs <= 0) {
      clearInterval(timerInterval);
      playBeep();
      showToast('Timer Finished!', 'success');
      startBtn?.classList.remove('hidden');
      pauseBtn?.classList.add('hidden');
      return;
    }
    totalRemainingSecs--;
    if (display) display.textContent = format(totalRemainingSecs);
  }

  startBtn?.addEventListener('click', () => {
    if (totalRemainingSecs <= 0) {
      const h = parseInt(hoursInput?.value || '0', 10);
      const m = parseInt(minsInput?.value || '0', 10);
      const s = parseInt(secsInput?.value || '0', 10);
      totalRemainingSecs = h * 3600 + m * 60 + s;
    }
    if (totalRemainingSecs <= 0) return;

    if (display) display.textContent = format(totalRemainingSecs);
    timerInterval = setInterval(tick, 1000);
    startBtn.classList.add('hidden');
    pauseBtn?.classList.remove('hidden');
  });

  pauseBtn?.addEventListener('click', () => {
    clearInterval(timerInterval);
    pauseBtn.classList.add('hidden');
    startBtn?.classList.remove('hidden');
  });

  resetBtn?.addEventListener('click', () => {
    clearInterval(timerInterval);
    totalRemainingSecs = 0;
    if (display) display.textContent = '00:00:00';
    pauseBtn?.classList.add('hidden');
    startBtn?.classList.remove('hidden');
  });

  document.querySelectorAll<HTMLButtonElement>('[data-preset-mins]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.getAttribute('data-preset-mins') || '5', 10);
      if (hoursInput) hoursInput.value = '0';
      if (minsInput) minsInput.value = `${mins}`;
      if (secsInput) secsInput.value = '0';
      totalRemainingSecs = mins * 60;
      if (display) display.textContent = format(totalRemainingSecs);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCountdownTimer);
} else {
  initCountdownTimer();
}
