const baseInput = document.getElementById('tz-base-time') as HTMLInputElement | null;
const clocksWrap = document.getElementById('tz-clocks-wrap') as HTMLElement | null;

const ZONES = [
  { name: 'UTC / GMT', zone: 'UTC', label: 'Universal Time' },
  { name: 'London', zone: 'Europe/London', label: 'UK (GMT/BST)' },
  { name: 'Paris', zone: 'Europe/Paris', label: 'Central European Time' },
  { name: 'New York', zone: 'America/New_York', label: 'US Eastern' },
  { name: 'Los Angeles', zone: 'America/Los_Angeles', label: 'US Pacific' },
  { name: 'Dubai', zone: 'Asia/Dubai', label: 'Gulf Standard Time' },
  { name: 'Mumbai / Delhi', zone: 'Asia/Kolkata', label: 'India Standard Time' },
  { name: 'Singapore', zone: 'Asia/Singapore', label: 'Singapore Standard Time' },
  { name: 'Tokyo', zone: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { name: 'Sydney', zone: 'Australia/Sydney', label: 'Australian Eastern' },
];

export function initTimezoneConv(): void {
  if (!baseInput || !clocksWrap) return;

  function update() {
    const val = baseInput?.value;
    const date = val ? new Date(val) : new Date();

    clocksWrap!.innerHTML = '';
    ZONES.forEach((z) => {
      try {
        const timeStr = date.toLocaleTimeString('en-US', {
          timeZone: z.zone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const dateStr = date.toLocaleDateString('en-US', {
          timeZone: z.zone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

        const card = document.createElement('div');
        card.className = 'p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between';
        card.innerHTML = `
          <div>
            <h4 class="font-bold text-sm text-slate-900 dark:text-white">${z.name}</h4>
            <span class="text-xs text-slate-500">${z.label} &bull; ${dateStr}</span>
          </div>
          <div class="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
            ${timeStr}
          </div>
        `;
        clocksWrap!.appendChild(card);
      } catch {}
    });
  }

  baseInput.value = new Date().toISOString().slice(0, 16);
  baseInput.addEventListener('input', update);
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTimezoneConv);
} else {
  initTimezoneConv();
}
