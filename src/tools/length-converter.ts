/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { convertLength } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const inputVal = document.getElementById('input-length') as HTMLInputElement | null;
  const selectUnit = document.getElementById('select-unit') as HTMLSelectElement | null;

  const resM = document.getElementById('res-m');
  const resKm = document.getElementById('res-km');
  const resCm = document.getElementById('res-cm');
  const resMm = document.getElementById('res-mm');
  const resIn = document.getElementById('res-in');
  const resFt = document.getElementById('res-ft');
  const resYd = document.getElementById('res-yd');
  const resMi = document.getElementById('res-mi');
  const resNmi = document.getElementById('res-nmi');

  const update = () => {
    const val = parseFloat(inputVal?.value || '0') || 0;
    const unit = selectUnit?.value || 'm';

    const res = convertLength(val, unit);

    if (resM) resM.textContent = `${res.m} m`;
    if (resKm) resKm.textContent = `${res.km} km`;
    if (resCm) resCm.textContent = `${res.cm} cm`;
    if (resMm) resMm.textContent = `${res.mm} mm`;
    if (resIn) resIn.textContent = `${res.in} in`;
    if (resFt) resFt.textContent = `${res.ft} ft`;
    if (resYd) resYd.textContent = `${res.yd} yd`;
    if (resMi) resMi.textContent = `${res.mi} mi`;
    if (resNmi) resNmi.textContent = `${res.nmi} nmi`;
  };

  inputVal?.addEventListener('input', update);
  selectUnit?.addEventListener('change', update);

  update();
});
