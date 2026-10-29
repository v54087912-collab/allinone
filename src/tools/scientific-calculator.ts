/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { showToast } from '../shared/site-shell';

document.addEventListener('DOMContentLoaded', () => {
  const displayMain = document.getElementById('calc-display-main');
  const displayHistory = document.getElementById('calc-display-history');
  const btnRadDeg = document.getElementById('btn-rad-deg');
  const historyList = document.getElementById('calc-history-list');
  const btnClearHistory = document.getElementById('btn-clear-history');

  let currentExpr = '';
  let memoryVal = 0;
  let isRad = true;
  let historyEntries: string[] = [];

  const updateDisplay = () => {
    if (displayMain) displayMain.textContent = currentExpr || '0';
  };

  const handleKey = (key: string) => {
    if (key === 'AC') {
      currentExpr = '';
      if (displayHistory) displayHistory.textContent = '';
      updateDisplay();
      return;
    }
    if (key === 'DEL' || key === 'BACKSPACE') {
      currentExpr = currentExpr.slice(0, -1);
      updateDisplay();
      return;
    }
    if (key === '=') {
      evaluateCurrent();
      return;
    }

    // Memory operations
    if (key === 'MC') {
      memoryVal = 0;
      showToast('Memory Cleared (MC)', 'info');
      return;
    }
    if (key === 'MR') {
      currentExpr += String(memoryVal);
      updateDisplay();
      return;
    }
    if (key === 'M+') {
      try {
        const val = evalMath(currentExpr);
        memoryVal += val;
        showToast(`Memory +: ${memoryVal}`, 'info');
      } catch {}
      return;
    }
    if (key === 'M-') {
      try {
        const val = evalMath(currentExpr);
        memoryVal -= val;
        showToast(`Memory -: ${memoryVal}`, 'info');
      } catch {}
      return;
    }

    // Scientific functions
    if (key === 'sin' || key === 'cos' || key === 'tan' || key === 'asin' || key === 'acos' || key === 'atan' || key === 'log' || key === 'ln' || key === 'sqrt') {
      currentExpr += `${key}(`;
      updateDisplay();
      return;
    }
    if (key === 'pi') {
      currentExpr += 'π';
      updateDisplay();
      return;
    }
    if (key === 'e') {
      currentExpr += 'e';
      updateDisplay();
      return;
    }
    if (key === '^') {
      currentExpr += '^';
      updateDisplay();
      return;
    }

    currentExpr += key;
    updateDisplay();
  };

  const evalMath = (expr: string): number => {
    let sanitized = expr
      .replace(/π/g, String(Math.PI))
      .replace(/\be\b/g, String(Math.E))
      .replace(/\^/g, '**');

    // Handle trig in deg vs rad
    const toRad = isRad ? 1 : Math.PI / 180;
    sanitized = sanitized.replace(/sin\(([^)]+)\)/g, (_, a) => `Math.sin((${a}) * ${toRad})`);
    sanitized = sanitized.replace(/cos\(([^)]+)\)/g, (_, a) => `Math.cos((${a}) * ${toRad})`);
    sanitized = sanitized.replace(/tan\(([^)]+)\)/g, (_, a) => `Math.tan((${a}) * ${toRad})`);
    sanitized = sanitized.replace(/asin\(([^)]+)\)/g, (_, a) => `(Math.asin(${a}) / ${toRad})`);
    sanitized = sanitized.replace(/acos\(([^)]+)\)/g, (_, a) => `(Math.acos(${a}) / ${toRad})`);
    sanitized = sanitized.replace(/atan\(([^)]+)\)/g, (_, a) => `(Math.atan(${a}) / ${toRad})`);
    sanitized = sanitized.replace(/log\(([^)]+)\)/g, (_, a) => `Math.log10(${a})`);
    sanitized = sanitized.replace(/ln\(([^)]+)\)/g, (_, a) => `Math.log(${a})`);
    sanitized = sanitized.replace(/sqrt\(([^)]+)\)/g, (_, a) => `Math.sqrt(${a})`);

    // Only allow digits, math operators and Math functions
    if (!/^[0-9+\-*/().\s,eEMath*]+$/.test(sanitized)) {
      throw new Error('Invalid characters in expression');
    }

    const fn = new Function(`return (${sanitized});`);
    const val = fn();
    if (typeof val !== 'number' || isNaN(val)) throw new Error('Calculation error');
    return val;
  };

  const evaluateCurrent = () => {
    if (!currentExpr) return;
    try {
      const result = evalMath(currentExpr);
      const resFormatted = +result.toFixed(10);
      if (displayHistory) displayHistory.textContent = `${currentExpr} =`;

      historyEntries.unshift(`${currentExpr} = ${resFormatted}`);
      if (historyEntries.length > 20) historyEntries.pop();
      renderHistory();

      currentExpr = String(resFormatted);
      updateDisplay();
    } catch {
      if (displayMain) displayMain.textContent = 'Error';
      showToast('Syntax Error', 'error');
    }
  };

  const renderHistory = () => {
    if (!historyList) return;
    historyList.innerHTML = '';
    historyEntries.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'py-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-mono text-xs cursor-pointer truncate';
      li.textContent = item;
      li.addEventListener('click', () => {
        const parts = item.split('=');
        currentExpr = parts[1]?.trim() || '';
        updateDisplay();
      });
      historyList.appendChild(li);
    });
  };

  btnRadDeg?.addEventListener('click', () => {
    isRad = !isRad;
    btnRadDeg.textContent = isRad ? 'RAD' : 'DEG';
    showToast(`Angle mode: ${isRad ? 'Radians' : 'Degrees'}`, 'info');
  });

  btnClearHistory?.addEventListener('click', () => {
    historyEntries = [];
    renderHistory();
    showToast('History cleared', 'info');
  });

  document.querySelectorAll<HTMLButtonElement>('[data-calc-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-calc-btn') || '';
      handleKey(val);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;

    if ((e.key >= '0' && e.key <= '9') || ['+', '-', '*', '/', '.', '(', ')'].includes(e.key)) {
      handleKey(e.key);
    } else if (e.key === 'Enter') {
      handleKey('=');
    } else if (e.key === 'Backspace') {
      handleKey('DEL');
    } else if (e.key === 'Escape') {
      handleKey('AC');
    }
  });
});
