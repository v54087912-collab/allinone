const display = document.getElementById('sw-display') as HTMLElement | null;
const startBtn = document.getElementById('sw-start') as HTMLButtonElement | null;
const pauseBtn = document.getElementById('sw-pause') as HTMLButtonElement | null;
const resetBtn = document.getElementById('sw-reset') as HTMLButtonElement | null;
const lapBtn = document.getElementById('sw-lap') as HTMLButtonElement | null;
const lapsList = document.getElementById('sw-laps-list') as HTMLElement | null;

let startTime = 0;
let elapsedTime = 0;
let timerInterval: any = null;
let laps: number[] = [];

export function initStopwatch(): void {
  function formatTime(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  function update() {
    const current = Date.now() - startTime + elapsedTime;
    if (display) display.textContent = formatTime(current);
  }

  startBtn?.addEventListener('click', () => {
    startTime = Date.now();
    timerInterval = setInterval(update, 10);
    startBtn.classList.add('hidden');
    pauseBtn?.classList.remove('hidden');
    if (lapBtn) lapBtn.disabled = false;
  });

  pauseBtn?.addEventListener('click', () => {
    clearInterval(timerInterval);
    elapsedTime += Date.now() - startTime;
    pauseBtn.classList.add('hidden');
    startBtn?.classList.remove('hidden');
  });

  resetBtn?.addEventListener('click', () => {
    clearInterval(timerInterval);
    startTime = 0;
    elapsedTime = 0;
    laps = [];
    if (display) display.textContent = '00:00.00';
    pauseBtn?.classList.add('hidden');
    startBtn?.classList.remove('hidden');
    if (lapsList) lapsList.innerHTML = '';
    if (lapBtn) lapBtn.disabled = true;
  });

  lapBtn?.addEventListener('click', () => {
    const current = Date.now() - startTime + elapsedTime;
    laps.unshift(current);
    if (!lapsList) return;
    lapsList.innerHTML = '';
    laps.forEach((lapMs, idx) => {
      const row = document.createElement('div');
      row.className = 'flex justify-between py-1.5 px-3 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
      row.innerHTML = `<span>Lap ${laps.length - idx}</span><span>${formatTime(lapMs)}</span>`;
      lapsList.appendChild(row);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStopwatch);
} else {
  initStopwatch();
}
