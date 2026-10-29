/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { convertWeight } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const inputVal = document.getElementById('input-weight') as HTMLInputElement | null;
  const selectUnit = document.getElementById('select-unit') as HTMLSelectElement | null;

  const resKg = document.getElementById('res-kg');
  const resG = document.getElementById('res-g');
  const resMg = document.getElementById('res-mg');
  const resLb = document.getElementById('res-lb');
  const resOz = document.getElementById('res-oz');
  const resSt = document.getElementById('res-st');
  const resT = document.getElementById('res-t');
  const resTonUs = document.getElementById('res-ton-us');

  const update = () => {
    const val = parseFloat(inputVal?.value || '0') || 0;
    const unit = selectUnit?.value || 'kg';

    const res = convertWeight(val, unit);

    if (resKg) resKg.textContent = `${res.kg} kg`;
    if (resG) resG.textContent = `${res.g} g`;
    if (resMg) resMg.textContent = `${res.mg} mg`;
    if (resLb) resLb.textContent = `${res.lb} lbs`;
    if (resOz) resOz.textContent = `${res.oz} oz`;
    if (resSt) resSt.textContent = `${res.st} st`;
    if (resT) resT.textContent = `${res.t} metric tonnes`;
    if (resTonUs) resTonUs.textContent = `${res.ton_us} US tons`;
  };

  inputVal?.addEventListener('input', update);
  selectUnit?.addEventListener('change', update);

  update();
});
