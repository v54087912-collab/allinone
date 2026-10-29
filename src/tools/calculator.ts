import { evaluateMathExpression } from '../utils/calcUtils.ts';

export function initCalculator(): void {
  const display = document.getElementById('calc-display');
  const history = document.getElementById('calc-history');

  if (!display) return;

  let currentExpr = '';
  let justEvaluated = false;

  function setDisplay(text: string) {
    if (!display) return;
    display.textContent = text;
    if ('value' in display) {
      (display as HTMLInputElement).value = text;
    }
  }

  function updateDisplay() {
    setDisplay(currentExpr || '0');
  }

  function handleInput(btnVal: string) {
    if (btnVal === 'C' || btnVal === 'AC') {
      currentExpr = '';
      justEvaluated = false;
      if (history) history.textContent = '';
      updateDisplay();
      return;
    }

    if (btnVal === 'DEL' || btnVal === 'Backspace') {
      if (justEvaluated) {
        currentExpr = '';
        justEvaluated = false;
        if (history) history.textContent = '';
      } else {
        currentExpr = currentExpr.trimEnd();
        currentExpr = currentExpr.slice(0, -1).trimEnd();
      }
      updateDisplay();
      return;
    }

    if (btnVal === '+/-') {
      if (!currentExpr || currentExpr === '0') return;
      try {
        const val = evaluateMathExpression(currentExpr);
        currentExpr = String(-val);
        justEvaluated = false;
      } catch {
        // keep current
      }
      updateDisplay();
      return;
    }

    if (btnVal === '%') {
      if (!currentExpr) return;
      try {
        const val = evaluateMathExpression(currentExpr);
        currentExpr = String(Math.round((val / 100) * 1e10) / 1e10);
        justEvaluated = true;
      } catch {
        currentExpr = 'Error';
      }
      updateDisplay();
      return;
    }

    if (btnVal === '=') {
      if (!currentExpr) return;
      try {
        const res = evaluateMathExpression(currentExpr);
        if (history) history.textContent = currentExpr + ' =';
        const rounded = Math.round(res * 1e10) / 1e10;
        currentExpr = `${rounded}`;
        justEvaluated = true;
      } catch {
        currentExpr = 'Error';
        justEvaluated = true;
      }
      updateDisplay();
      return;
    }

    // Binary operators
    if (['+', '-', '*', '/', '÷', '×'].includes(btnVal)) {
      if (currentExpr === 'Error') currentExpr = '0';
      justEvaluated = false;
      const normalizedOp = btnVal === '÷' ? '/' : btnVal === '×' ? '*' : btnVal;
      
      const trimmed = currentExpr.trim();
      const lastChar = trimmed.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar)) {
        currentExpr = trimmed.slice(0, -1) + ' ' + normalizedOp + ' ';
      } else {
        currentExpr = (trimmed || '0') + ' ' + normalizedOp + ' ';
      }
      updateDisplay();
      return;
    }

    // Number digit (0-9) or dot (.)
    if (justEvaluated) {
      currentExpr = '';
      justEvaluated = false;
    }

    if (btnVal === '.') {
      // Prevent double dots in the current token
      const lastToken = currentExpr.split(/[\s+\-*/]/).pop() || '';
      if (lastToken.includes('.')) return;
      if (!lastToken) {
        currentExpr += '0.';
        updateDisplay();
        return;
      }
    }

    if (currentExpr === '0' && btnVal !== '.') {
      currentExpr = btnVal;
    } else {
      currentExpr += btnVal;
    }
    updateDisplay();
  }

  // Bind all buttons with [data-calc-key] or [data-calc]
  document.querySelectorAll<HTMLButtonElement>('[data-calc-key], [data-calc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-calc-key') || btn.getAttribute('data-calc');
      if (val) handleInput(val);
    });
  });

  // Keyboard events
  window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement?.tagName;
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

    if (/[0-9.]/.test(e.key)) {
      handleInput(e.key);
    } else if (['+', '-', '*', '/'].includes(e.key)) {
      e.preventDefault();
      handleInput(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      handleInput('=');
    } else if (e.key === 'Backspace') {
      handleInput('DEL');
    } else if (e.key === 'Escape') {
      handleInput('C');
    } else if (e.key === '%') {
      handleInput('%');
    }
  });

  updateDisplay();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculator);
} else {
  initCalculator();
}
