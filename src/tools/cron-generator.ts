import { buildCron, describeCron, getNextCronRuns } from '../utils/devUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initCronGenerator(): void {
  const cronOutput = document.getElementById('cron-output') as HTMLInputElement | null;
  const descEl = document.getElementById('cron-description') as HTMLElement | null;
  const nextRunsEl = document.getElementById('cron-next-runs') as HTMLElement | null;

  const minInput = document.getElementById('cron-min') as HTMLInputElement | null;
  const hrInput = document.getElementById('cron-hr') as HTMLInputElement | null;
  const domInput = document.getElementById('cron-dom') as HTMLInputElement | null;
  const monInput = document.getElementById('cron-mon') as HTMLInputElement | null;
  const dowInput = document.getElementById('cron-dow') as HTMLInputElement | null;

  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement | null;

  if (!cronOutput) return;

  function updateFromFields(): void {
    const min = minInput?.value || '*';
    const hr = hrInput?.value || '*';
    const dom = domInput?.value || '*';
    const mon = monInput?.value || '*';
    const dow = dowInput?.value || '*';

    const cron = buildCron(min, hr, dom, mon, dow);
    if (cronOutput) cronOutput.value = cron;
    renderDetails(cron);
  }

  function updateFromOutput(): void {
    if (!cronOutput) return;
    const cron = cronOutput.value.trim();
    const parts = cron.split(/\s+/);
    if (parts.length === 5) {
      if (minInput) minInput.value = parts[0];
      if (hrInput) hrInput.value = parts[1];
      if (domInput) domInput.value = parts[2];
      if (monInput) monInput.value = parts[3];
      if (dowInput) dowInput.value = parts[4];
    }
    renderDetails(cron);
  }

  function renderDetails(cron: string): void {
    const desc = describeCron(cron);
    if (descEl) descEl.textContent = desc;

    const runs = getNextCronRuns(cron, 5);
    if (nextRunsEl) {
      if (runs.length === 0) {
        nextRunsEl.innerHTML = '<li class="text-xs text-slate-400">Unable to calculate next runs for this expression.</li>';
      } else {
        nextRunsEl.innerHTML = runs
          .map((d, i) => `
            <li class="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-mono">
              <span class="text-slate-500">Run ${i + 1}:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">${d.toLocaleString()}</span>
            </li>
          `)
          .join('');
      }
    }
  }

  [minInput, hrInput, domInput, monInput, dowInput].forEach((inp) => {
    inp?.addEventListener('input', updateFromFields);
  });

  cronOutput.addEventListener('input', updateFromOutput);

  // Presets
  document.querySelectorAll<HTMLButtonElement>('[data-cron-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expr = btn.getAttribute('data-cron-preset');
      if (expr && cronOutput) {
        cronOutput.value = expr;
        updateFromOutput();
        showToast(`Loaded preset: ${expr}`, 'info');
      }
    });
  });

  btnCopy?.addEventListener('click', () => {
    if (!cronOutput.value) return;
    navigator.clipboard.writeText(cronOutput.value).then(
      () => showToast('Cron expression copied!', 'success'),
      () => showToast('Failed to copy', 'error')
    );
  });

  // Initial
  updateFromFields();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCronGenerator);
} else {
  initCronGenerator();
}
