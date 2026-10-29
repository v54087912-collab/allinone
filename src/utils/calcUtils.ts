/**
 * Calculation Utilities for Unit Converter, Age Calculator, Percentage Calculator,
 * Timestamp Converter, and Calculator.
 */

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalHours: number;
  nextBirthdayDays: number;
  zodiacSign: string;
}

export function calculateAge(birthDateStr: string, targetDateStr?: string): AgeResult {
  const birth = new Date(birthDateStr);
  const target = targetDateStr ? new Date(targetDateStr) : new Date();

  if (isNaN(birth.getTime()) || isNaN(target.getTime())) {
    throw new Error('Invalid date provided.');
  }

  let years = target.getFullYear() - birth.getFullYear();
  let months = target.getMonth() - birth.getMonth();
  let days = target.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonthDays = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
    days += prevMonthDays;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const diffTime = Math.max(0, target.getTime() - birth.getTime());
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalHours = Math.floor(diffTime / (1000 * 60 * 60));

  // Next birthday calculation
  const currentYearBirthday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
  let nextBirthday = currentYearBirthday;
  if (currentYearBirthday.getTime() < target.getTime()) {
    nextBirthday = new Date(target.getFullYear() + 1, birth.getMonth(), birth.getDate());
  }
  const nextBirthdayDays = Math.ceil(
    (nextBirthday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Zodiac Sign
  const month = birth.getMonth() + 1;
  const day = birth.getDate();
  let zodiacSign = 'Unknown';

  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) zodiacSign = 'Aquarius ♒';
  else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) zodiacSign = 'Pisces ♓';
  else if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) zodiacSign = 'Aries ♈';
  else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) zodiacSign = 'Taurus ♉';
  else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) zodiacSign = 'Gemini ♊';
  else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) zodiacSign = 'Cancer ♋';
  else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) zodiacSign = 'Leo ♌';
  else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) zodiacSign = 'Virgo ♍';
  else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) zodiacSign = 'Libra ♎';
  else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) zodiacSign = 'Scorpio ♏';
  else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) zodiacSign = 'Sagittarius ♐';
  else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) zodiacSign = 'Capricorn ♑';

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    totalHours,
    nextBirthdayDays,
    zodiacSign,
  };
}

export type PercentageOp = 'percent-of' | 'is-percent-of' | 'percentage-change' | 'add-percent' | 'subtract-percent';

export function calculatePercentage(op: PercentageOp, a: number, b: number): number {
  switch (op) {
    case 'percent-of':
      // What is A% of B?
      return (a / 100) * b;

    case 'is-percent-of':
      // A is what % of B?
      if (b === 0) return 0;
      return (a / b) * 100;

    case 'percentage-change':
      // % change from A to B
      if (a === 0) return 0;
      return ((b - a) / a) * 100;

    case 'add-percent':
      // A + B%
      return a + (a * (b / 100));

    case 'subtract-percent':
      // A - B%
      return a - (a * (b / 100));

    default:
      return 0;
  }
}

// Unit conversion ratios to standard base units
export const LENGTH_RATES: Record<string, number> = {
  m: 1,
  km: 1000,
  cm: 0.01,
  mm: 0.001,
  inch: 0.0254,
  foot: 0.3048,
  yard: 0.9144,
  mile: 1609.344,
};

export const WEIGHT_RATES: Record<string, number> = {
  kg: 1,
  g: 0.001,
  mg: 0.000001,
  lb: 0.45359237,
  oz: 0.028349523,
  ton: 1000,
};

export const STORAGE_RATES: Record<string, number> = {
  b: 1,
  kb: 1024,
  mb: 1048576,
  gb: 1073741824,
  tb: 1099511627776,
};

export const SPEED_RATES: Record<string, number> = {
  'kmh': 1,
  'ms': 3.6,
  'mph': 1.60934,
  'knot': 1.852,
};

export function convertUnits(
  category: 'length' | 'weight' | 'storage' | 'speed' | 'temperature',
  val: number,
  from: string,
  to: string
): number {
  if (category === 'temperature') {
    // Temperature conversion
    let celsius = val;
    if (from === 'f') celsius = (val - 32) * (5 / 9);
    else if (from === 'k') celsius = val - 273.15;

    if (to === 'f') return (celsius * 9) / 5 + 32;
    if (to === 'k') return celsius + 273.15;
    return celsius;
  }

  let rates: Record<string, number> = LENGTH_RATES;
  if (category === 'weight') rates = WEIGHT_RATES;
  else if (category === 'storage') rates = STORAGE_RATES;
  else if (category === 'speed') rates = SPEED_RATES;

  const fromRate = rates[from.toLowerCase()];
  const toRate = rates[to.toLowerCase()];

  if (!fromRate || !toRate) return val;

  const base = val * fromRate;
  return base / toRate;
}

export function parseTimestamp(input: number | string): {
  seconds: number;
  milliseconds: number;
  utcIso: string;
  localString: string;
  relativeTime: string;
} {
  let ms: number;
  if (typeof input === 'number') {
    // If < 1e11 it's seconds, otherwise milliseconds
    ms = input < 1e11 ? input * 1000 : input;
  } else {
    const num = Number(input);
    if (!isNaN(num)) {
      ms = num < 1e11 ? num * 1000 : num;
    } else {
      ms = new Date(input).getTime();
    }
  }

  const date = new Date(ms);
  const now = Date.now();
  const diffSec = Math.round((now - ms) / 1000);

  let relativeTime = 'just now';
  if (diffSec > 0) {
    if (diffSec < 60) relativeTime = `${diffSec} seconds ago`;
    else if (diffSec < 3600) relativeTime = `${Math.floor(diffSec / 60)} minutes ago`;
    else if (diffSec < 86400) relativeTime = `${Math.floor(diffSec / 3600)} hours ago`;
    else relativeTime = `${Math.floor(diffSec / 86400)} days ago`;
  } else if (diffSec < 0) {
    const abs = Math.abs(diffSec);
    if (abs < 60) relativeTime = `in ${abs} seconds`;
    else if (abs < 3600) relativeTime = `in ${Math.floor(abs / 60)} minutes`;
    else if (abs < 86400) relativeTime = `in ${Math.floor(abs / 3600)} hours`;
    else relativeTime = `in ${Math.floor(abs / 86400)} days`;
  }

  return {
    seconds: Math.floor(ms / 1000),
    milliseconds: ms,
    utcIso: date.toISOString(),
    localString: date.toLocaleString(),
    relativeTime,
  };
}

/**
 * Safe client-side math expression evaluator without eval()
 */
export function evaluateMathExpression(expr: string): number {
  const clean = expr.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/');
  if (!clean) return 0;

  // Basic safe tokenization
  if (!/^[-+*/0-9.()%]+$/.test(clean)) {
    throw new Error('Invalid math expression.');
  }

  // Simple recursive descent / Function constructor with strict scope
  try {
    const sanitized = clean.replace(/%/g, '/100');
    // Function evaluates only numerical expressions safely
    const fn = new Function(`"use strict"; return (${sanitized})`);
    const res = fn();
    if (typeof res !== 'number' || isNaN(res) || !isFinite(res)) {
      throw new Error('Math error');
    }
    return Math.round(res * 1e10) / 1e10;
  } catch (err: any) {
    throw new Error('Calculation error');
  }
}
