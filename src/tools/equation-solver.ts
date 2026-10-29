/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { solveLinearEquation, solveQuadraticEquation, solveLinearSystem2 } from '../utils/educationUtils.ts';

export function initEquationSolver(): void {
  const typeSelect = document.getElementById('eq-type') as HTMLSelectElement | null;
  const linearForm = document.getElementById('linear-form') as HTMLDivElement | null;
  const quadForm = document.getElementById('quad-form') as HTMLDivElement | null;
  const systemForm = document.getElementById('system-form') as HTMLDivElement | null;
  const solveBtn = document.getElementById('solve-btn') as HTMLButtonElement | null;
  const solutionBox = document.getElementById('solution-box') as HTMLDivElement | null;
  const stepsList = document.getElementById('steps-list') as HTMLOListElement | null;

  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      const val = typeSelect.value;
      if (linearForm) linearForm.classList.toggle('hidden', val !== 'linear');
      if (quadForm) quadForm.classList.toggle('hidden', val !== 'quadratic');
      if (systemForm) systemForm.classList.toggle('hidden', val !== 'system');
    });
  }

  if (solveBtn) {
    solveBtn.addEventListener('click', () => {
      const type = typeSelect?.value || 'linear';
      let steps: string[] = [];

      try {
        if (type === 'linear') {
          const a = parseFloat((document.getElementById('lin-a') as HTMLInputElement)?.value || '1');
          const b = parseFloat((document.getElementById('lin-b') as HTMLInputElement)?.value || '0');
          const c = parseFloat((document.getElementById('lin-c') as HTMLInputElement)?.value || '0');
          const res = solveLinearEquation(a, b, c);
          steps = res.steps;
        } else if (type === 'quadratic') {
          const a = parseFloat((document.getElementById('quad-a') as HTMLInputElement)?.value || '1');
          const b = parseFloat((document.getElementById('quad-b') as HTMLInputElement)?.value || '0');
          const c = parseFloat((document.getElementById('quad-c') as HTMLInputElement)?.value || '0');
          const res = solveQuadraticEquation(a, b, c);
          steps = res.steps;
        } else {
          const a1 = parseFloat((document.getElementById('sys-a1') as HTMLInputElement)?.value || '1');
          const b1 = parseFloat((document.getElementById('sys-b1') as HTMLInputElement)?.value || '1');
          const c1 = parseFloat((document.getElementById('sys-c1') as HTMLInputElement)?.value || '5');
          const a2 = parseFloat((document.getElementById('sys-a2') as HTMLInputElement)?.value || '1');
          const b2 = parseFloat((document.getElementById('sys-b2') as HTMLInputElement)?.value || '-1');
          const c2 = parseFloat((document.getElementById('sys-c2') as HTMLInputElement)?.value || '1');
          const res = solveLinearSystem2(a1, b1, c1, a2, b2, c2);
          steps = res.steps;
        }

        if (stepsList) {
          stepsList.innerHTML = steps.map(s => `<li class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-mono text-xs">${s}</li>`).join('');
        }
        if (solutionBox) solutionBox.classList.remove('hidden');
      } catch (err: any) {
        alert(err.message || 'Error solving equation');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initEquationSolver);
