/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateElectricityBill, ElectricityBillItem } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const inputTariff = document.getElementById('input-tariff') as HTMLInputElement | null;
  const appliancesList = document.getElementById('appliances-list');
  const btnAddAppliance = document.getElementById('btn-add-appliance');

  const resMonthlyCost = document.getElementById('res-monthly-cost');
  const resDailyCost = document.getElementById('res-daily-cost');
  const resYearlyCost = document.getElementById('res-yearly-cost');
  const resMonthlyKwh = document.getElementById('res-monthly-kwh');
  const resDailyKwh = document.getElementById('res-daily-kwh');

  let items: ElectricityBillItem[] = [
    { name: 'Air Conditioner (1.5 Ton)', watts: 1500, hoursPerDay: 8, quantity: 1 },
    { name: 'Refrigerator', watts: 200, hoursPerDay: 24, quantity: 1 },
    { name: 'LED Lights', watts: 15, hoursPerDay: 6, quantity: 6 },
    { name: 'Television', watts: 100, hoursPerDay: 5, quantity: 1 },
  ];

  const renderAppliances = () => {
    if (!appliancesList) return;
    appliancesList.innerHTML = '';

    items.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 dark:border-slate-800 text-xs';
      tr.innerHTML = `
        <td class="py-2.5 px-3">
          <input type="text" data-idx="${idx}" data-field="name" value="${item.name}" class="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
        </td>
        <td class="py-2.5 px-3 w-28">
          <input type="number" data-idx="${idx}" data-field="watts" value="${item.watts}" min="1" class="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
        </td>
        <td class="py-2.5 px-3 w-24">
          <input type="number" data-idx="${idx}" data-field="hoursPerDay" value="${item.hoursPerDay}" min="0" max="24" class="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
        </td>
        <td class="py-2.5 px-3 w-20">
          <input type="number" data-idx="${idx}" data-field="quantity" value="${item.quantity}" min="1" class="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
        </td>
        <td class="py-2.5 px-3 text-right w-12">
          <button type="button" data-idx="${idx}" class="btn-remove-row text-rose-500 hover:text-rose-700 font-bold">&times;</button>
        </td>
      `;
      appliancesList.appendChild(tr);
    });

    appliancesList.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const idx = parseInt(target.getAttribute('data-idx') || '0', 10);
        const field = target.getAttribute('data-field') as keyof ElectricityBillItem;
        if (field === 'name') items[idx].name = target.value;
        else if (field === 'watts') items[idx].watts = parseFloat(target.value) || 0;
        else if (field === 'hoursPerDay') items[idx].hoursPerDay = parseFloat(target.value) || 0;
        else if (field === 'quantity') items[idx].quantity = parseInt(target.value, 10) || 1;
        updateCalculations();
      });
    });

    appliancesList.querySelectorAll('.btn-remove-row').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.target as HTMLElement).getAttribute('data-idx') || '0', 10);
        items.splice(idx, 1);
        renderAppliances();
        updateCalculations();
      });
    });
  };

  const updateCalculations = () => {
    const tariff = parseFloat(inputTariff?.value || '0.15') || 0.15;
    const res = calculateElectricityBill(items, tariff);

    if (resMonthlyCost) resMonthlyCost.textContent = `$${res.monthlyCost.toFixed(2)}`;
    if (resDailyCost) resDailyCost.textContent = `$${res.dailyCost.toFixed(2)}`;
    if (resYearlyCost) resYearlyCost.textContent = `$${res.yearlyCost.toFixed(2)}`;
    if (resMonthlyKwh) resMonthlyKwh.textContent = `${res.monthlyKwh.toFixed(1)} kWh/mo`;
    if (resDailyKwh) resDailyKwh.textContent = `${res.dailyKwh.toFixed(2)} kWh/day`;
  };

  btnAddAppliance?.addEventListener('click', () => {
    items.push({ name: 'New Appliance', watts: 100, hoursPerDay: 4, quantity: 1 });
    renderAppliances();
    updateCalculations();
  });

  inputTariff?.addEventListener('input', updateCalculations);

  renderAppliances();
  updateCalculations();
});
