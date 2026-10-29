/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateDiscount } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const inputPrice = document.getElementById('input-price') as HTMLInputElement | null;
  const inputDiscount = document.getElementById('input-discount') as HTMLInputElement | null;
  const inputExtra = document.getElementById('input-extra') as HTMLInputElement | null;
  const inputTax = document.getElementById('input-tax') as HTMLInputElement | null;

  const resFinalPrice = document.getElementById('res-final-price');
  const resTotalSaved = document.getElementById('res-total-saved');
  const resSavingsPercent = document.getElementById('res-savings-percent');
  const resDiscountAmount = document.getElementById('res-discount-amount');
  const resExtraAmount = document.getElementById('res-extra-amount');
  const resTaxAmount = document.getElementById('res-tax-amount');
  const savingsBar = document.getElementById('savings-bar');

  const update = () => {
    const price = parseFloat(inputPrice?.value || '0') || 0;
    const discount = parseFloat(inputDiscount?.value || '0') || 0;
    const extra = parseFloat(inputExtra?.value || '0') || 0;
    const tax = parseFloat(inputTax?.value || '0') || 0;

    const res = calculateDiscount(price, discount, extra, tax);

    if (resFinalPrice) resFinalPrice.textContent = `$${res.finalPrice.toFixed(2)}`;
    if (resTotalSaved) resTotalSaved.textContent = `$${res.totalSaved.toFixed(2)}`;
    if (resSavingsPercent) resSavingsPercent.textContent = `${res.savingsPercentage.toFixed(1)}% OFF`;
    if (resDiscountAmount) resDiscountAmount.textContent = `-$${res.discountAmount.toFixed(2)}`;
    if (resExtraAmount) resExtraAmount.textContent = `-$${res.extraDiscountAmount.toFixed(2)}`;
    if (resTaxAmount) resTaxAmount.textContent = `+$${res.taxAmount.toFixed(2)}`;

    if (savingsBar) {
      savingsBar.style.width = `${Math.min(100, Math.max(0, res.savingsPercentage))}%`;
    }
  };

  [inputPrice, inputDiscount, inputExtra, inputTax].forEach((inp) => {
    inp?.addEventListener('input', update);
  });

  // Quick discount chips
  document.querySelectorAll<HTMLButtonElement>('[data-discount-chip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (inputDiscount) {
        inputDiscount.value = btn.getAttribute('data-discount-chip') || '0';
        update();
      }
    });
  });

  update();
});
