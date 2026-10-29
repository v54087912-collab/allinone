/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateGst } from '../utils/calcFinanceUtils';

document.addEventListener('DOMContentLoaded', () => {
  const inputAmount = document.getElementById('input-amount') as HTMLInputElement | null;
  const inputRate = document.getElementById('input-rate') as HTMLInputElement | null;
  const modeInclusive = document.getElementById('mode-inclusive') as HTMLInputElement | null;

  const resNet = document.getElementById('res-net');
  const resGst = document.getElementById('res-gst');
  const resTotal = document.getElementById('res-total');
  const resCgst = document.getElementById('res-cgst');
  const resSgst = document.getElementById('res-sgst');
  const resIgst = document.getElementById('res-igst');

  const update = () => {
    const amount = parseFloat(inputAmount?.value || '0') || 0;
    const rate = parseFloat(inputRate?.value || '18') || 0;
    const isInclusive = modeInclusive?.checked ?? false;

    const res = calculateGst(amount, rate, isInclusive);

    if (resNet) resNet.textContent = `$${res.baseAmount.toFixed(2)}`;
    if (resGst) resGst.textContent = `$${res.gstAmount.toFixed(2)}`;
    if (resTotal) resTotal.textContent = `$${res.totalAmount.toFixed(2)}`;
    if (resCgst) resCgst.textContent = `$${res.cgst.toFixed(2)}`;
    if (resSgst) resSgst.textContent = `$${res.sgst.toFixed(2)}`;
    if (resIgst) resIgst.textContent = `$${res.gstAmount.toFixed(2)}`;
  };

  inputAmount?.addEventListener('input', update);
  inputRate?.addEventListener('input', update);
  modeInclusive?.addEventListener('change', update);
  document.getElementById('mode-exclusive')?.addEventListener('change', update);

  document.querySelectorAll<HTMLButtonElement>('[data-rate-chip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (inputRate) {
        inputRate.value = btn.getAttribute('data-rate-chip') || '18';
        update();
      }
    });
  });

  update();
});
