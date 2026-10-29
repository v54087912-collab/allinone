/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateHaversineDistance } from '../utils/geoTimeUtils.ts';

export function initDistanceCalculator(): void {
  const city1Select = document.getElementById('city1-preset') as HTMLSelectElement | null;
  const lat1Input = document.getElementById('lat1') as HTMLInputElement | null;
  const lon1Input = document.getElementById('lon1') as HTMLInputElement | null;

  const city2Select = document.getElementById('city2-preset') as HTMLSelectElement | null;
  const lat2Input = document.getElementById('lat2') as HTMLInputElement | null;
  const lon2Input = document.getElementById('lon2') as HTMLInputElement | null;

  const calcBtn = document.getElementById('calc-btn') as HTMLButtonElement | null;
  const kmResult = document.getElementById('dist-km') as HTMLHeadingElement | null;
  const milesResult = document.getElementById('dist-miles') as HTMLSpanElement | null;
  const nmiResult = document.getElementById('dist-nmi') as HTMLSpanElement | null;
  const flightResult = document.getElementById('dist-flight') as HTMLSpanElement | null;
  const bearingResult = document.getElementById('dist-bearing') as HTMLSpanElement | null;

  const presets: Record<string, [number, number]> = {
    nyc: [40.7128, -74.0060],
    london: [51.5074, -0.1278],
    tokyo: [35.6762, 139.6503],
    paris: [48.8566, 2.3522],
    delhi: [28.6139, 77.2090],
    sydney: [-33.8688, 151.2093],
    dubai: [25.2048, 55.2708]
  };

  if (city1Select) {
    city1Select.addEventListener('change', () => {
      const p = presets[city1Select.value];
      if (p && lat1Input && lon1Input) {
        lat1Input.value = p[0].toString();
        lon1Input.value = p[1].toString();
        calculate();
      }
    });
  }

  if (city2Select) {
    city2Select.addEventListener('change', () => {
      const p = presets[city2Select.value];
      if (p && lat2Input && lon2Input) {
        lat2Input.value = p[0].toString();
        lon2Input.value = p[1].toString();
        calculate();
      }
    });
  }

  function calculate() {
    const lat1 = parseFloat(lat1Input?.value || '40.7128');
    const lon1 = parseFloat(lon1Input?.value || '-74.0060');
    const lat2 = parseFloat(lat2Input?.value || '51.5074');
    const lon2 = parseFloat(lon2Input?.value || '-0.1278');

    const res = calculateHaversineDistance(lat1, lon1, lat2, lon2);

    if (kmResult) kmResult.textContent = `${res.km.toLocaleString()} km`;
    if (milesResult) milesResult.textContent = `${res.miles.toLocaleString()} miles`;
    if (nmiResult) nmiResult.textContent = `${res.nauticalMiles.toLocaleString()} nmi`;
    if (flightResult) flightResult.textContent = `~${res.flightTimeEstimateHours} hours (Commercial Jet)`;
    if (bearingResult) bearingResult.textContent = `${res.bearingDegrees}° (${res.compassDirection})`;
  }

  if (calcBtn) calcBtn.addEventListener('click', calculate);
  [lat1Input, lon1Input, lat2Input, lon2Input].forEach(el => el?.addEventListener('input', calculate));

  calculate();
}

document.addEventListener('DOMContentLoaded', initDistanceCalculator);
