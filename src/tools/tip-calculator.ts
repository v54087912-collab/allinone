/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateTip } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const inputBill = document.getElementById('input-bill') as HTMLInputElement | null;
  const inputTip = document.getElementById('input-tip') as HTMLInputElement | null;
  const inputSplit = document.getElementById('input-split') as HTMLInputElement | null;
  const roundUpCheckbox = document.getElementById('round-up') as HTMLInputElement | null;

  const resTipTotal = document.getElementById('res-tip-total');
  const resBillTotal = document.getElementById('res-bill-total');
  const resTipPerPerson = document.getElementById('res-tip-per-person');
  const resTotalPerPerson = document.getElementById('res-total-per-person');

  const update = () => {
    const bill = parseFloat(inputBill?.value || '0') || 0;
    const tip = parseFloat(inputTip?.value || '15') || 0;
    const split = parseInt(inputSplit?.value || '1', 10) || 1;
    const round = roundUpCheckbox?.checked ?? false;

    const res = calculateTip(bill, tip, split, round);

    if (resTipTotal) resTipTotal.textContent = `$${res.tipAmount.toFixed(2)}`;
    if (resBillTotal) resBillTotal.textContent = `$${res.totalAmount.toFixed(2)}`;
    if (resTipPerPerson) resTipPerPerson.textContent = `$${res.tipPerPerson.toFixed(2)}`;
    if (resTotalPerPerson) resTotalPerPerson.textContent = `$${res.totalPerPerson.toFixed(2)}`;
  };

  [inputBill, inputTip, inputSplit].forEach((inp) => {
    inp?.addEventListener('input', update);
  });
  roundUpCheckbox?.addEventListener('change', update);

  document.querySelectorAll<HTMLButtonElement>('[data-tip-chip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (inputTip) {
        inputTip.value = btn.getAttribute('data-tip-chip') || '15';
        update();
      }
    });
  });

  update();
});
