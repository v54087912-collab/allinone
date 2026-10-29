import { calculateAge } from '../utils/calcUtils.ts';
import { showToast } from '../shared/site-shell.ts';

const birthInput = document.getElementById('age-birth') as HTMLInputElement | null;
const targetInput = document.getElementById('age-target') as HTMLInputElement | null;
const calcBtn = document.getElementById('age-calc-btn') as HTMLButtonElement | null;

const primaryRes = document.getElementById('age-primary-res') as HTMLElement | null;
const monthsRes = document.getElementById('age-months-res') as HTMLElement | null;
const daysRes = document.getElementById('age-days-res') as HTMLElement | null;
const weeksRes = document.getElementById('age-weeks-res') as HTMLElement | null;
const nextBdayRes = document.getElementById('age-next-bday') as HTMLElement | null;
const zodiacRes = document.getElementById('age-zodiac') as HTMLElement | null;

export function initAgeCalculator(): void {
  if (!birthInput) return;

  // Default target date to today
  if (targetInput && !targetInput.value) {
    targetInput.value = new Date().toISOString().split('T')[0];
  }

  function doCalculate() {
    const bStr = birthInput?.value;
    const tStr = targetInput?.value;
    if (!bStr) {
      showToast('Please enter your date of birth.', 'info');
      return;
    }

    try {
      const res = calculateAge(bStr, tStr);
      if (primaryRes) primaryRes.textContent = `${res.years} Years, ${res.months} Months, ${res.days} Days`;
      if (monthsRes) monthsRes.textContent = `${res.years * 12 + res.months}`;
      if (daysRes) daysRes.textContent = `${res.totalDays.toLocaleString()}`;
      if (weeksRes) weeksRes.textContent = `${res.totalWeeks.toLocaleString()}`;
      if (nextBdayRes) nextBdayRes.textContent = `${res.nextBirthdayDays} Days`;
      if (zodiacRes) zodiacRes.textContent = res.zodiacSign;
    } catch (e: any) {
      showToast('Invalid dates entered', 'error');
    }
  }

  calcBtn?.addEventListener('click', doCalculate);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAgeCalculator);
} else {
  initAgeCalculator();
}
