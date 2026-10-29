/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateSunriseSunset } from '../utils/geoTimeUtils.ts';

export function initSunriseSunsetCalculator(): void {
  const citySelect = document.getElementById('city-preset') as HTMLSelectElement | null;
  const latInput = document.getElementById('lat-input') as HTMLInputElement | null;
  const lngInput = document.getElementById('lng-input') as HTMLInputElement | null;
  const dateInput = document.getElementById('date-input') as HTMLInputElement | null;
  const calcBtn = document.getElementById('calc-btn') as HTMLButtonElement | null;

  const sunriseDisplay = document.getElementById('time-sunrise') as HTMLHeadingElement | null;
  const sunsetDisplay = document.getElementById('time-sunset') as HTMLHeadingElement | null;
  const noonDisplay = document.getElementById('time-noon') as HTMLSpanElement | null;
  const lengthDisplay = document.getElementById('time-length') as HTMLSpanElement | null;
  const dawnDisplay = document.getElementById('time-dawn') as HTMLSpanElement | null;
  const duskDisplay = document.getElementById('time-dusk') as HTMLSpanElement | null;

  const presets: Record<string, [number, number]> = {
    london: [51.5074, -0.1278],
    newyork: [40.7128, -74.0060],
    tokyo: [35.6762, 139.6503],
    delhi: [28.6139, 77.2090],
    paris: [48.8566, 2.3522],
    sydney: [-33.8688, 151.2093]
  };

  if (citySelect) {
    citySelect.addEventListener('change', () => {
      const coords = presets[citySelect.value];
      if (coords && latInput && lngInput) {
        latInput.value = coords[0].toString();
        lngInput.value = coords[1].toString();
        calculate();
      }
    });
  }

  // Set today
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

  function calculate() {
    const lat = parseFloat(latInput?.value || '51.5074');
    const lng = parseFloat(lngInput?.value || '-0.1278');
    const d = dateInput?.value ? new Date(dateInput.value) : new Date();

    const res = calculateSunriseSunset(lat, lng, d);

    if (sunriseDisplay) sunriseDisplay.textContent = res.sunrise;
    if (sunsetDisplay) sunsetDisplay.textContent = res.sunset;
    if (noonDisplay) noonDisplay.textContent = res.solarNoon;
    if (lengthDisplay) lengthDisplay.textContent = res.dayLength;
    if (dawnDisplay) dawnDisplay.textContent = res.civilDawn;
    if (duskDisplay) duskDisplay.textContent = res.civilDusk;
  }

  if (calcBtn) calcBtn.addEventListener('click', calculate);
  [latInput, lngInput, dateInput].forEach(el => el?.addEventListener('input', calculate));

  calculate();
}

document.addEventListener('DOMContentLoaded', initSunriseSunsetCalculator);
