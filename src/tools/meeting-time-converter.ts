/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';
import { convertMeetingTime, getHourComfortStatus, formatTime12H, minutesToTime } from '../utils/productivityUtils.js';

interface CityTimezone {
  id: string;
  name: string;
  city: string;
  offsetMinutes: number; // UTC offset in minutes
  flag: string;
}

const DEFAULT_CITIES: CityTimezone[] = [
  { id: 'sf', name: 'US Pacific', city: 'San Francisco', offsetMinutes: -420, flag: '🇺🇸' },
  { id: 'ny', name: 'US Eastern', city: 'New York', offsetMinutes: -240, flag: '🇺🇸' },
  { id: 'london', name: 'UK / UTC', city: 'London', offsetMinutes: 60, flag: '🇬🇧' },
  { id: 'delhi', name: 'India (IST)', city: 'New Delhi', offsetMinutes: 330, flag: '🇮🇳' },
  { id: 'tokyo', name: 'Japan (JST)', city: 'Tokyo', offsetMinutes: 540, flag: '🇯🇵' },
];

const PRESET_CATALOG: CityTimezone[] = [
  { id: 'sf', name: 'US Pacific', city: 'San Francisco', offsetMinutes: -420, flag: '🇺🇸' },
  { id: 'denver', name: 'US Mountain', city: 'Denver', offsetMinutes: -360, flag: '🇺🇸' },
  { id: 'chicago', name: 'US Central', city: 'Chicago', offsetMinutes: -300, flag: '🇺🇸' },
  { id: 'ny', name: 'US Eastern', city: 'New York', offsetMinutes: -240, flag: '🇺🇸' },
  { id: 'london', name: 'UK / GMT', city: 'London', offsetMinutes: 60, flag: '🇬🇧' },
  { id: 'paris', name: 'Central Europe', city: 'Paris / Berlin', offsetMinutes: 120, flag: '🇪🇺' },
  { id: 'dubai', name: 'Gulf (GST)', city: 'Dubai', offsetMinutes: 240, flag: '🇦🇪' },
  { id: 'delhi', name: 'India (IST)', city: 'New Delhi', offsetMinutes: 330, flag: '🇮🇳' },
  { id: 'singapore', name: 'Singapore (SGT)', city: 'Singapore', offsetMinutes: 480, flag: '🇸🇬' },
  { id: 'tokyo', name: 'Japan (JST)', city: 'Tokyo', offsetMinutes: 540, flag: '🇯🇵' },
  { id: 'sydney', name: 'Australia (AEST)', city: 'Sydney', offsetMinutes: 660, flag: '🇦🇺' },
  { id: 'auckland', name: 'New Zealand', city: 'Auckland', offsetMinutes: 780, flag: '🇳🇿' },
];

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  let activeCities: CityTimezone[] = [...DEFAULT_CITIES];
  let baseHour = 14; // 14:00 (2:00 PM in primary city, London)
  const baseCityIndex = 2; // London as reference anchor

  const slider = document.getElementById('meeting-hour-slider') as HTMLInputElement | null;
  const currentHourLabel = document.getElementById('slider-hour-label');
  const citiesContainer = document.getElementById('meeting-cities-container');
  const addCitySelect = document.getElementById('add-city-select') as HTMLSelectElement | null;
  const addCityBtn = document.getElementById('add-city-btn');
  const copySummaryBtn = document.getElementById('copy-meeting-summary-btn');
  const goldenHoursBadge = document.getElementById('golden-hours-badge');

  function render(): void {
    if (!citiesContainer) return;
    citiesContainer.innerHTML = '';

    const baseCity = activeCities[baseCityIndex] || activeCities[0];
    const baseTime24 = `${String(baseHour).padStart(2, '0')}:00`;

    if (currentHourLabel && baseCity) {
      currentHourLabel.textContent = `${baseCity.city}: ${formatTime12H(baseTime24)}`;
    }

    // Determine comfort score for current hour
    let suitableCount = 0;

    activeCities.forEach((city) => {
      const converted = convertMeetingTime(baseTime24, baseCity.offsetMinutes, city.offsetMinutes);
      const targetHour = parseInt(converted.targetTime24.split(':')[0], 10);
      const status = getHourComfortStatus(targetHour);
      if (status === 'work' || status === 'extended') suitableCount++;

      const statusColors: Record<string, { bg: string; text: string; label: string }> = {
        work: { bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', label: 'Work Hours (9AM-5PM)' },
        extended: { bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', label: 'Extended Hours' },
        night: { bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', label: 'Night / Sleeping' },
      };

      const card = document.createElement('div');
      card.className = `p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${statusColors[status].bg}`;

      let dayShiftBadge = '';
      if (converted.dayShift > 0) {
        dayShiftBadge = `<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">+${converted.dayShift} day</span>`;
      } else if (converted.dayShift < 0) {
        dayShiftBadge = `<span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold">${converted.dayShift} day</span>`;
      }

      card.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-2xl">${city.flag}</span>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-sm text-slate-900 dark:text-white">${city.city}</h3>
              <span class="text-[11px] text-slate-400">(${city.name})</span>
            </div>
            <div class="text-xs font-semibold ${statusColors[status].text} flex items-center gap-1.5 mt-0.5">
              <span>● ${statusColors[status].label}</span>
              ${dayShiftBadge}
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between sm:justify-end gap-4">
          <div class="text-right">
            <span class="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">${converted.targetTime12}</span>
            <div class="text-[11px] text-slate-400 font-mono">${converted.targetTime24} hrs</div>
          </div>
          ${
            activeCities.length > 2
              ? `<button type="button" data-remove-city="${city.id}" title="Remove city" class="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer">✕</button>`
              : ''
          }
        </div>
      `;

      citiesContainer.appendChild(card);
    });

    if (goldenHoursBadge) {
      if (suitableCount === activeCities.length) {
        goldenHoursBadge.textContent = '🌟 Perfect Slot: All participants are within working/waking hours!';
        goldenHoursBadge.className = 'text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
      } else {
        goldenHoursBadge.textContent = `⚠️ Sub-optimal: ${suitableCount} of ${activeCities.length} participants awake`;
        goldenHoursBadge.className = 'text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
      }
    }
  }

  // Slider input
  slider?.addEventListener('input', () => {
    baseHour = parseInt(slider.value, 10);
    render();
  });

  // Add city
  addCityBtn?.addEventListener('click', () => {
    const selectedId = addCitySelect?.value;
    if (!selectedId) return;

    if (activeCities.some((c) => c.id === selectedId)) {
      alert('This city is already in your comparison list.');
      return;
    }

    const found = PRESET_CATALOG.find((c) => c.id === selectedId);
    if (found) {
      activeCities.push(found);
      render();
    }
  });

  // Remove city
  citiesContainer?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-remove-city]') as HTMLElement | null;
    if (!btn) return;
    const id = btn.getAttribute('data-remove-city');
    if (!id) return;
    activeCities = activeCities.filter((c) => c.id !== id);
    render();
  });

  // Copy meeting summary
  copySummaryBtn?.addEventListener('click', () => {
    const baseCity = activeCities[baseCityIndex] || activeCities[0];
    const baseTime24 = `${String(baseHour).padStart(2, '0')}:00`;

    const lines = ['📅 Proposed Meeting Time Across Time Zones:', ''];
    activeCities.forEach((city) => {
      const conv = convertMeetingTime(baseTime24, baseCity.offsetMinutes, city.offsetMinutes);
      const shiftStr = conv.dayShift !== 0 ? ` (${conv.dayShift > 0 ? '+' : ''}${conv.dayShift} day)` : '';
      lines.push(`• ${city.flag} ${city.city}: ${conv.targetTime12}${shiftStr}`);
    });

    lines.push('', 'Scheduled via Toolora Meeting Time Converter');
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      const prev = copySummaryBtn.textContent;
      copySummaryBtn.textContent = '✓ Copied to Clipboard!';
      setTimeout(() => {
        copySummaryBtn.textContent = prev;
      }, 2000);
    });
  });

  render();
});
