/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateFuelCost } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const inputDistance = document.getElementById('input-distance') as HTMLInputElement | null;
  const inputEfficiency = document.getElementById('input-efficiency') as HTMLInputElement | null;
  const inputPrice = document.getElementById('input-price') as HTMLInputElement | null;
  const inputPassengers = document.getElementById('input-passengers') as HTMLInputElement | null;
  const roundTripCheckbox = document.getElementById('round-trip') as HTMLInputElement | null;

  const resTotalCost = document.getElementById('res-total-cost');
  const resFuelLiters = document.getElementById('res-fuel-liters');
  const resCostPerPerson = document.getElementById('res-cost-per-person');
  const resCostPerKm = document.getElementById('res-cost-per-km');

  const update = () => {
    const dist = parseFloat(inputDistance?.value || '0') || 0;
    const eff = parseFloat(inputEfficiency?.value || '12') || 12;
    const price = parseFloat(inputPrice?.value || '1.5') || 1.5;
    const pass = parseInt(inputPassengers?.value || '1', 10) || 1;
    const roundTrip = roundTripCheckbox?.checked ?? false;

    const res = calculateFuelCost(dist, eff, price, pass, roundTrip);

    if (resTotalCost) resTotalCost.textContent = `$${res.totalCost.toFixed(2)}`;
    if (resFuelLiters) resFuelLiters.textContent = `${res.fuelConsumedLiters} Liters`;
    if (resCostPerPerson) resCostPerPerson.textContent = `$${res.costPerPerson.toFixed(2)}`;
    if (resCostPerKm) resCostPerKm.textContent = `$${res.costPerKm.toFixed(3)} /km`;
  };

  [inputDistance, inputEfficiency, inputPrice, inputPassengers].forEach((el) => {
    el?.addEventListener('input', update);
  });
  roundTripCheckbox?.addEventListener('change', update);

  update();
});
