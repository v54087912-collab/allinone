/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateEmi } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const inputLoan = document.getElementById('input-loan') as HTMLInputElement | null;
  const inputRate = document.getElementById('input-rate') as HTMLInputElement | null;
  const inputTenure = document.getElementById('input-tenure') as HTMLInputElement | null;
  const tenureType = document.getElementById('tenure-type') as HTMLSelectElement | null;

  const resEmi = document.getElementById('res-emi');
  const resTotalInterest = document.getElementById('res-total-interest');
  const resTotalPayment = document.getElementById('res-total-payment');
  const ratioPrincipal = document.getElementById('ratio-principal');
  const ratioInterest = document.getElementById('ratio-interest');
  const scheduleTableBody = document.getElementById('schedule-table-body');

  const update = () => {
    const loan = parseFloat(inputLoan?.value || '0') || 0;
    const rate = parseFloat(inputRate?.value || '0') || 0;
    const rawTenure = parseFloat(inputTenure?.value || '0') || 0;
    const isYears = tenureType?.value === 'years';
    const months = isYears ? rawTenure * 12 : rawTenure;

    const res = calculateEmi(loan, rate, months);

    if (resEmi) resEmi.textContent = `$${res.monthlyEmi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (resTotalInterest) resTotalInterest.textContent = `$${res.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (resTotalPayment) resTotalPayment.textContent = `$${res.totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const pRatio = Math.max(0, 100 - res.interestRatioPercent);
    if (ratioPrincipal) ratioPrincipal.style.width = `${pRatio}%`;
    if (ratioInterest) ratioInterest.style.width = `${res.interestRatioPercent}%`;

    // Render schedule (sampled or first 12 months)
    if (scheduleTableBody) {
      scheduleTableBody.innerHTML = '';
      const sample = res.schedule.slice(0, 24);
      sample.forEach((item) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs';
        tr.innerHTML = `
          <td class="py-2.5 px-4 font-mono font-bold text-slate-500">M${item.month}</td>
          <td class="py-2.5 px-4 font-mono text-emerald-600 dark:text-emerald-400">$${item.principalPaid.toFixed(2)}</td>
          <td class="py-2.5 px-4 font-mono text-rose-600 dark:text-rose-400">$${item.interestPaid.toFixed(2)}</td>
          <td class="py-2.5 px-4 font-mono text-slate-800 dark:text-slate-200 text-right">$${item.remainingBalance.toFixed(2)}</td>
        `;
        scheduleTableBody.appendChild(tr);
      });
    }
  };

  [inputLoan, inputRate, inputTenure, tenureType].forEach((el) => {
    el?.addEventListener('input', update);
    el?.addEventListener('change', update);
  });

  update();
});
