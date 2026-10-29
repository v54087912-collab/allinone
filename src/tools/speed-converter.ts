/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { convertSpeed } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const inputVal = document.getElementById('input-speed') as HTMLInputElement | null;
  const selectUnit = document.getElementById('select-unit') as HTMLSelectElement | null;

  const resKmh = document.getElementById('res-kmh');
  const resMph = document.getElementById('res-mph');
  const resMs = document.getElementById('res-ms');
  const resKnots = document.getElementById('res-knots');
  const resFts = document.getElementById('res-fts');
  const resMach = document.getElementById('res-mach');
  const resPaceKm = document.getElementById('res-pace-km');
  const resPaceMi = document.getElementById('res-pace-mi');

  const update = () => {
    const val = parseFloat(inputVal?.value || '0') || 0;
    const unit = selectUnit?.value || 'kmh';

    const res = convertSpeed(val, unit);

    if (resKmh) resKmh.textContent = `${res.kmh} km/h`;
    if (resMph) resMph.textContent = `${res.mph} mph`;
    if (resMs) resMs.textContent = `${res.ms} m/s`;
    if (resKnots) resKnots.textContent = `${res.knots} knots`;
    if (resFts) resFts.textContent = `${res.fts} ft/s`;
    if (resMach) resMach.textContent = `${res.mach} Mach`;
    if (resPaceKm) resPaceKm.textContent = res.paceMinPerKm;
    if (resPaceMi) resPaceMi.textContent = res.paceMinPerMile;
  };

  inputVal?.addEventListener('input', update);
  selectUnit?.addEventListener('change', update);

  update();
});
