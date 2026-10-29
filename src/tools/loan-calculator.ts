/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateLoanPrepayment } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const inputLoan = document.getElementById('input-loan') as HTMLInputElement | null;
  const inputRate = document.getElementById('input-rate') as HTMLInputElement | null;
  const inputTenure = document.getElementById('input-tenure') as HTMLInputElement | null;
  const inputPrepay = document.getElementById('input-prepay') as HTMLInputElement | null;

  const resSavings = document.getElementById('res-savings');
  const resMonthsSaved = document.getElementById('res-months-saved');
  const resStdInterest = document.getElementById('res-std-interest');
  const resRevInterest = document.getElementById('res-rev-interest');
  const resNewTenure = document.getElementById('res-new-tenure');

  const update = () => {
    const loan = parseFloat(inputLoan?.value || '0') || 0;
    const rate = parseFloat(inputRate?.value || '0') || 0;
    const tenureYears = parseFloat(inputTenure?.value || '0') || 0;
    const prepay = parseFloat(inputPrepay?.value || '0') || 0;

    const res = calculateLoanPrepayment(loan, rate, tenureYears * 12, prepay);

    if (resSavings) resSavings.textContent = `$${res.interestSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (resMonthsSaved) resMonthsSaved.textContent = `${res.monthsSaved} months (${(res.monthsSaved / 12).toFixed(1)} years)`;
    if (resStdInterest) resStdInterest.textContent = `$${res.standardTotalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (resRevInterest) resRevInterest.textContent = `$${res.revisedTotalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (resNewTenure) resNewTenure.textContent = `${(res.revisedTenureMonths / 12).toFixed(1)} years (${res.revisedTenureMonths} months)`;
  };

  [inputLoan, inputRate, inputTenure, inputPrepay].forEach((el) => {
    el?.addEventListener('input', update);
  });

  update();
});
