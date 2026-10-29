/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initWorldClock(): void {
  const clockGrid = document.getElementById('world-clock-grid') as HTMLDivElement | null;
  const searchInput = document.getElementById('search-city') as HTMLInputElement | null;

  interface CityClock {
    city: string;
    country: string;
    timezone: string;
  }

  const cities: CityClock[] = [
    { city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
    { city: 'New York', country: 'United States', timezone: 'America/New_York' },
    { city: 'San Francisco', country: 'United States', timezone: 'America/Los_Angeles' },
    { city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
    { city: 'New Delhi', country: 'India', timezone: 'Asia/Kolkata' },
    { city: 'Paris', country: 'France', timezone: 'Europe/Paris' },
    { city: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai' },
    { city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' },
    { city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' },
    { city: 'Hong Kong', country: 'China', timezone: 'Asia/Hong_Kong' },
    { city: 'UTC (GMT)', country: 'Universal Coordinated Time', timezone: 'UTC' },
    { city: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin' }
  ];

  function updateClocks() {
    if (!clockGrid) return;
    const query = (searchInput?.value || '').toLowerCase().trim();

    const filtered = cities.filter(c =>
      c.city.toLowerCase().includes(query) ||
      c.country.toLowerCase().includes(query)
    );

    clockGrid.innerHTML = '';
    const now = new Date();

    filtered.forEach(c => {
      try {
        const timeStr = now.toLocaleTimeString('en-US', { timeZone: c.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString('en-US', { timeZone: c.timezone, weekday: 'short', month: 'short', day: 'numeric' });

        const card = document.createElement('div');
        card.className = 'p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between';
        card.innerHTML = `
          <div>
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">${c.city}</h3>
                <span class="text-xs text-slate-500">${c.country}</span>
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">${c.timezone.split('/')[1] || c.timezone}</span>
            </div>
          </div>
          <div class="mt-4">
            <div class="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">${timeStr}</div>
            <div class="text-xs text-slate-400 mt-1">${dateStr}</div>
          </div>
        `;
        clockGrid.appendChild(card);
      } catch (e) {
        // Fallback for uncommon zones
      }
    });
  }

  if (searchInput) searchInput.addEventListener('input', updateClocks);

  setInterval(updateClocks, 1000);
  updateClocks();
}

document.addEventListener('DOMContentLoaded', initWorldClock);
