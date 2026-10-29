/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { convertTemperature } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const inputVal = document.getElementById('input-temp') as HTMLInputElement | null;
  const selectUnit = document.getElementById('select-unit') as HTMLSelectElement | null;

  const resC = document.getElementById('res-c');
  const resF = document.getElementById('res-f');
  const resK = document.getElementById('res-k');
  const resR = document.getElementById('res-r');
  const resRe = document.getElementById('res-re');

  const update = () => {
    const val = parseFloat(inputVal?.value || '0') || 0;
    const unit = selectUnit?.value || 'c';

    const res = convertTemperature(val, unit);

    if (resC) resC.textContent = `${res.celsius} °C`;
    if (resF) resF.textContent = `${res.fahrenheit} °F`;
    if (resK) resK.textContent = `${res.kelvin} K`;
    if (resR) resR.textContent = `${res.rankine} °R`;
    if (resRe) resRe.textContent = `${res.reaumur} °Re`;
  };

  inputVal?.addEventListener('input', update);
  selectUnit?.addEventListener('change', update);

  update();
});
