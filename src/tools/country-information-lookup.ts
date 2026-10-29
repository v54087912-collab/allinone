/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { COUNTRIES_DATA, searchCountries, CountryInfo } from '../utils/geoTimeUtils.ts';

export function initCountryInformationLookup(): void {
  const searchInput = document.getElementById('search-country') as HTMLInputElement | null;
  const countriesGrid = document.getElementById('countries-grid') as HTMLDivElement | null;

  function render(list: CountryInfo[]) {
    if (!countriesGrid) return;
    countriesGrid.innerHTML = '';

    list.forEach(c => {
      const card = document.createElement('div');
      card.className = 'p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3';
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">${c.flagEmoji}</span>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">${c.name}</h3>
              <span class="text-xs text-slate-500">${c.capital} (Capital)</span>
            </div>
          </div>
          <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">${c.code}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-2 text-slate-600 dark:text-slate-400">
          <div>Region: <strong class="text-slate-800 dark:text-slate-200">${c.region}</strong></div>
          <div>Calling: <strong class="text-slate-800 dark:text-slate-200">${c.callingCode}</strong></div>
          <div>Currency: <strong class="text-slate-800 dark:text-slate-200">${c.currencies.join(', ')}</strong></div>
          <div>Population: <strong class="text-slate-800 dark:text-slate-200">${c.population.toLocaleString()}</strong></div>
          <div class="col-span-2">Timezones: <strong class="text-slate-800 dark:text-slate-200">${c.timezones.join(', ')}</strong></div>
        </div>
      `;
      countriesGrid.appendChild(card);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      render(searchCountries(searchInput.value));
    });
  }

  render(COUNTRIES_DATA);
}

document.addEventListener('DOMContentLoaded', initCountryInformationLookup);
