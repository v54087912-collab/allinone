import { convertUnits, LENGTH_RATES, WEIGHT_RATES, STORAGE_RATES, SPEED_RATES } from '../utils/calcUtils.ts';

const catSelect = document.getElementById('unit-category') as HTMLSelectElement | null;
const valFromInput = document.getElementById('unit-from-val') as HTMLInputElement | null;
const valToInput = document.getElementById('unit-to-val') as HTMLInputElement | null;
const unitFromSelect = document.getElementById('unit-from-type') as HTMLSelectElement | null;
const unitToSelect = document.getElementById('unit-to-type') as HTMLSelectElement | null;
const swapBtn = document.getElementById('unit-swap-btn') as HTMLButtonElement | null;

const CATEGORY_UNITS: Record<string, string[]> = {
  length: Object.keys(LENGTH_RATES),
  weight: Object.keys(WEIGHT_RATES),
  storage: Object.keys(STORAGE_RATES),
  speed: Object.keys(SPEED_RATES),
  temperature: ['c', 'f', 'k'],
};

export function initUnitConverter(): void {
  if (!catSelect || !unitFromSelect || !unitToSelect) return;

  function populateUnits() {
    const cat = catSelect?.value || 'length';
    const units = CATEGORY_UNITS[cat] || [];
    unitFromSelect!.innerHTML = '';
    unitToSelect!.innerHTML = '';

    units.forEach((u, i) => {
      const o1 = document.createElement('option');
      o1.value = u;
      o1.textContent = u.toUpperCase();
      unitFromSelect!.appendChild(o1);

      const o2 = document.createElement('option');
      o2.value = u;
      o2.textContent = u.toUpperCase();
      unitToSelect!.appendChild(o2);
    });

    if (units.length > 1) {
      unitToSelect!.selectedIndex = 1;
    }
    doConvert();
  }

  function doConvert() {
    const cat = (catSelect?.value || 'length') as any;
    const val = parseFloat(valFromInput?.value || '1');
    const from = unitFromSelect?.value || 'm';
    const to = unitToSelect?.value || 'km';

    if (isNaN(val)) {
      if (valToInput) valToInput.value = '';
      return;
    }

    const res = convertUnits(cat, val, from, to);
    if (valToInput) valToInput.value = `${Math.round(res * 1e8) / 1e8}`;
  }

  catSelect.addEventListener('change', populateUnits);
  valFromInput?.addEventListener('input', doConvert);
  unitFromSelect.addEventListener('change', doConvert);
  unitToSelect.addEventListener('change', doConvert);

  swapBtn?.addEventListener('click', () => {
    const tmp = unitFromSelect.value;
    unitFromSelect.value = unitToSelect.value;
    unitToSelect.value = tmp;
    doConvert();
  });

  populateUnits();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUnitConverter);
} else {
  initUnitConverter();
}
