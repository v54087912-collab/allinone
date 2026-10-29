/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// 1. DISCOUNT CALCULATOR
// ==========================================

export interface DiscountResult {
  originalPrice: number;
  discountAmount: number;
  priceAfterDiscount: number;
  extraDiscountAmount: number;
  taxAmount: number;
  finalPrice: number;
  totalSaved: number;
  savingsPercentage: number;
}

export function calculateDiscount(
  originalPrice: number,
  discountPercent: number,
  extraDiscountPercent: number = 0,
  taxPercent: number = 0
): DiscountResult {
  originalPrice = Math.max(0, originalPrice);
  discountPercent = Math.max(0, Math.min(100, discountPercent));
  extraDiscountPercent = Math.max(0, Math.min(100, extraDiscountPercent));
  taxPercent = Math.max(0, taxPercent);

  const discountAmount = originalPrice * (discountPercent / 100);
  const priceAfterDiscount = originalPrice - discountAmount;

  const extraDiscountAmount = priceAfterDiscount * (extraDiscountPercent / 100);
  const priceAfterExtra = priceAfterDiscount - extraDiscountAmount;

  const taxAmount = priceAfterExtra * (taxPercent / 100);
  const finalPrice = priceAfterExtra + taxAmount;

  const totalSaved = originalPrice - priceAfterExtra;
  const savingsPercentage = originalPrice > 0 ? (totalSaved / originalPrice) * 100 : 0;

  return {
    originalPrice,
    discountAmount,
    priceAfterDiscount,
    extraDiscountAmount,
    taxAmount,
    finalPrice,
    totalSaved,
    savingsPercentage,
  };
}

// ==========================================
// 2. GST CALCULATOR
// ==========================================

export interface GstResult {
  baseAmount: number;
  gstRate: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  isInclusive: boolean;
}

export function calculateGst(
  amount: number,
  ratePercent: number,
  isInclusive: boolean = false
): GstResult {
  amount = Math.max(0, amount);
  ratePercent = Math.max(0, ratePercent);

  let baseAmount: number;
  let gstAmount: number;
  let totalAmount: number;

  if (isInclusive) {
    totalAmount = amount;
    baseAmount = (amount * 100) / (100 + ratePercent);
    gstAmount = totalAmount - baseAmount;
  } else {
    baseAmount = amount;
    gstAmount = (baseAmount * ratePercent) / 100;
    totalAmount = baseAmount + gstAmount;
  }

  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  return {
    baseAmount,
    gstRate: ratePercent,
    gstAmount,
    cgst,
    sgst,
    totalAmount,
    isInclusive,
  };
}

// ==========================================
// 3. EMI & LOAN CALCULATOR
// ==========================================

export interface EmiScheduleMonth {
  month: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

export interface EmiResult {
  principal: number;
  annualRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
  interestRatioPercent: number;
  schedule: EmiScheduleMonth[];
}

export function calculateEmi(
  principal: number,
  annualRate: number,
  tenureMonths: number
): EmiResult {
  principal = Math.max(0, principal);
  annualRate = Math.max(0, annualRate);
  tenureMonths = Math.max(1, Math.round(tenureMonths));

  const monthlyRate = annualRate / 12 / 100;

  let monthlyEmi: number;
  if (monthlyRate === 0) {
    monthlyEmi = principal / tenureMonths;
  } else {
    monthlyEmi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  }

  const totalPayment = monthlyEmi * tenureMonths;
  const totalInterest = Math.max(0, totalPayment - principal);
  const interestRatioPercent = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;

  // Generate Schedule
  const schedule: EmiScheduleMonth[] = [];
  let balance = principal;

  for (let m = 1; m <= tenureMonths; m++) {
    const interestPart = balance * monthlyRate;
    const principalPart = monthlyEmi - interestPart;
    balance = Math.max(0, balance - principalPart);

    schedule.push({
      month: m,
      principalPaid: principalPart,
      interestPaid: interestPart,
      remainingBalance: balance,
    });
  }

  return {
    principal,
    annualRate,
    tenureMonths,
    monthlyEmi,
    totalInterest,
    totalPayment,
    interestRatioPercent,
    schedule,
  };
}

export interface LoanPrepayResult {
  standardTotalInterest: number;
  revisedTotalInterest: number;
  interestSaved: number;
  standardTenureMonths: number;
  revisedTenureMonths: number;
  monthsSaved: number;
}

export function calculateLoanPrepayment(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  extraMonthlyPayment: number
): LoanPrepayResult {
  const std = calculateEmi(principal, annualRate, tenureMonths);
  if (extraMonthlyPayment <= 0) {
    return {
      standardTotalInterest: std.totalInterest,
      revisedTotalInterest: std.totalInterest,
      interestSaved: 0,
      standardTenureMonths: tenureMonths,
      revisedTenureMonths: tenureMonths,
      monthsSaved: 0,
    };
  }

  const monthlyRate = annualRate / 12 / 100;
  const revisedMonthly = std.monthlyEmi + extraMonthlyPayment;

  let balance = principal;
  let revMonths = 0;
  let revTotalInterest = 0;

  while (balance > 0 && revMonths < tenureMonths * 2) {
    revMonths++;
    const interestPart = balance * monthlyRate;
    const principalPart = Math.min(balance, revisedMonthly - interestPart);
    revTotalInterest += interestPart;
    balance -= principalPart;
  }

  const interestSaved = Math.max(0, std.totalInterest - revTotalInterest);
  const monthsSaved = Math.max(0, tenureMonths - revMonths);

  return {
    standardTotalInterest: std.totalInterest,
    revisedTotalInterest: revTotalInterest,
    interestSaved,
    standardTenureMonths: tenureMonths,
    revisedTenureMonths: revMonths,
    monthsSaved,
  };
}

// ==========================================
// 4. DATE DIFFERENCE & DAYS BETWEEN DATES
// ==========================================

export interface DateDiffResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  businessDays: number;
  weekendDays: number;
}

export function calculateDateDifference(
  startDateStr: string,
  endDateStr: string,
  includeEndDate: boolean = false
): DateDiffResult {
  let d1 = new Date(startDateStr);
  let d2 = new Date(endDateStr);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      totalWeeks: 0,
      businessDays: 0,
      weekendDays: 0,
    };
  }

  // Ensure d1 <= d2
  if (d1 > d2) {
    const temp = d1;
    d1 = temp;
    d2 = temp;
  }

  // Calculate total days
  const oneDay = 24 * 60 * 60 * 1000;
  let diffTime = d2.getTime() - d1.getTime();
  let totalDays = Math.floor(diffTime / oneDay);
  if (includeEndDate) totalDays += 1;

  // Breakdown Y, M, D
  let years = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth() - d1.getMonth();
  let days = d2.getDate() - d1.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(d2.getFullYear(), d2.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Business vs Weekend days
  let businessDays = 0;
  let weekendDays = 0;
  const current = new Date(d1);
  const limit = new Date(d2);
  if (includeEndDate) limit.setDate(limit.getDate() + 1);

  while (current < limit) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDays++;
    } else {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  const totalWeeks = Math.floor(totalDays / 7);

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    businessDays,
    weekendDays,
  };
}

// ==========================================
// 5. TIME DURATION CALCULATOR
// ==========================================

export interface TimeDurationResult {
  totalSeconds: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  decimalHours: number;
}

export function calculateTimeBetween(
  startTime: string,
  endTime: string,
  crossMidnight: boolean = false
): TimeDurationResult {
  const parseTime = (t: string) => {
    const parts = t.split(':').map((p) => parseInt(p, 10) || 0);
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  };

  const sSec = parseTime(startTime);
  let eSec = parseTime(endTime);

  if (eSec < sSec || crossMidnight) {
    eSec += 24 * 3600;
  }

  const totalSeconds = Math.max(0, eSec - sSec);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const decimalHours = +(totalSeconds / 3600).toFixed(4);

  return {
    totalSeconds,
    hours,
    minutes,
    seconds,
    formatted,
    decimalHours,
  };
}

// ==========================================
// 6. TEMPERATURE CONVERTER
// ==========================================

export interface TemperatureResult {
  celsius: number;
  fahrenheit: number;
  kelvin: number;
  rankine: number;
  reaumur: number;
}

export function convertTemperature(value: number, fromUnit: string): TemperatureResult {
  let c: number;

  switch (fromUnit.toLowerCase()) {
    case 'f':
    case 'fahrenheit':
      c = ((value - 32) * 5) / 9;
      break;
    case 'k':
    case 'kelvin':
      c = value - 273.15;
      break;
    case 'r':
    case 'rankine':
      c = ((value - 491.67) * 5) / 9;
      break;
    case 're':
    case 'reaumur':
      c = (value * 5) / 4;
      break;
    default: // Celsius
      c = value;
      break;
  }

  const fahrenheit = (c * 9) / 5 + 32;
  const kelvin = c + 273.15;
  const rankine = ((c + 273.15) * 9) / 5;
  const reaumur = (c * 4) / 5;

  return {
    celsius: +c.toFixed(4),
    fahrenheit: +fahrenheit.toFixed(4),
    kelvin: +kelvin.toFixed(4),
    rankine: +rankine.toFixed(4),
    reaumur: +reaumur.toFixed(4),
  };
}

// ==========================================
// 7. LENGTH CONVERTER
// ==========================================

export function convertLength(value: number, fromUnit: string): Record<string, number> {
  const toMeters: Record<string, number> = {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: 0.0254,
    ft: 0.3048,
    yd: 0.9144,
    mi: 1609.344,
    nmi: 1852,
  };

  const factor = toMeters[fromUnit.toLowerCase()] || 1;
  const meters = value * factor;

  const result: Record<string, number> = {};
  for (const [unit, f] of Object.entries(toMeters)) {
    result[unit] = +(meters / f).toFixed(6);
  }
  return result;
}

// ==========================================
// 8. WEIGHT / MASS CONVERTER
// ==========================================

export function convertWeight(value: number, fromUnit: string): Record<string, number> {
  const toGrams: Record<string, number> = {
    mg: 0.001,
    g: 1,
    kg: 1000,
    t: 1000000,
    oz: 28.349523125,
    lb: 453.59237,
    st: 6350.29318,
    ton_us: 907184.74,
  };

  const factor = toGrams[fromUnit.toLowerCase()] || 1;
  const grams = value * factor;

  const result: Record<string, number> = {};
  for (const [unit, f] of Object.entries(toGrams)) {
    result[unit] = +(grams / f).toFixed(6);
  }
  return result;
}

// ==========================================
// 9. SPEED CONVERTER
// ==========================================

export interface SpeedConversionResult {
  kmh: number;
  mph: number;
  ms: number;
  knots: number;
  fts: number;
  mach: number;
  paceMinPerKm: string;
  paceMinPerMile: string;
}

export function convertSpeed(value: number, fromUnit: string): SpeedConversionResult {
  const toKmh: Record<string, number> = {
    kmh: 1,
    mph: 1.609344,
    ms: 3.6,
    knots: 1.852,
    fts: 1.09728,
    mach: 1234.8,
  };

  const factor = toKmh[fromUnit.toLowerCase()] || 1;
  const kmh = Math.max(0, value * factor);

  const mph = kmh / 1.609344;
  const ms = kmh / 3.6;
  const knots = kmh / 1.852;
  const fts = kmh / 1.09728;
  const mach = kmh / 1234.8;

  // Pace calculations (minutes per km, minutes per mile)
  let paceKmStr = '--';
  let paceMiStr = '--';

  if (kmh > 0) {
    const minPerKm = 60 / kmh;
    const kmMins = Math.floor(minPerKm);
    const kmSecs = Math.round((minPerKm - kmMins) * 60);
    paceKmStr = `${kmMins}:${String(kmSecs).padStart(2, '0')} /km`;

    const minPerMi = 60 / mph;
    const miMins = Math.floor(minPerMi);
    const miSecs = Math.round((minPerMi - miMins) * 60);
    paceMiStr = `${miMins}:${String(miSecs).padStart(2, '0')} /mi`;
  }

  return {
    kmh: +kmh.toFixed(2),
    mph: +mph.toFixed(2),
    ms: +ms.toFixed(2),
    knots: +knots.toFixed(2),
    fts: +fts.toFixed(2),
    mach: +mach.toFixed(4),
    paceMinPerKm: paceKmStr,
    paceMinPerMile: paceMiStr,
  };
}

// ==========================================
// 10. FUEL COST CALCULATOR
// ==========================================

export interface FuelCostResult {
  totalDistanceKm: number;
  fuelConsumedLiters: number;
  totalCost: number;
  costPerPerson: number;
  costPerKm: number;
}

export function calculateFuelCost(
  distance: number,
  efficiency: number, // km per liter
  fuelPrice: number, // price per liter
  passengers: number = 1,
  isRoundTrip: boolean = false
): FuelCostResult {
  const dist = (isRoundTrip ? distance * 2 : distance);
  const eff = Math.max(0.1, efficiency);
  const pass = Math.max(1, passengers);

  const fuelConsumedLiters = dist / eff;
  const totalCost = fuelConsumedLiters * fuelPrice;
  const costPerPerson = totalCost / pass;
  const costPerKm = dist > 0 ? totalCost / dist : 0;

  return {
    totalDistanceKm: dist,
    fuelConsumedLiters: +fuelConsumedLiters.toFixed(2),
    totalCost: +totalCost.toFixed(2),
    costPerPerson: +costPerPerson.toFixed(2),
    costPerKm: +costPerKm.toFixed(3),
  };
}

// ==========================================
// 11. ELECTRICITY BILL CALCULATOR
// ==========================================

export interface ElectricityBillItem {
  name: string;
  watts: number;
  hoursPerDay: number;
  quantity: number;
}

export interface ElectricityBillResult {
  dailyKwh: number;
  monthlyKwh: number;
  yearlyKwh: number;
  dailyCost: number;
  monthlyCost: number;
  yearlyCost: number;
}

export function calculateElectricityBill(
  items: ElectricityBillItem[],
  costPerKwh: number
): ElectricityBillResult {
  let dailyWattHours = 0;
  items.forEach((item) => {
    dailyWattHours += item.watts * item.hoursPerDay * (item.quantity || 1);
  });

  const dailyKwh = dailyWattHours / 1000;
  const monthlyKwh = dailyKwh * 30;
  const yearlyKwh = dailyKwh * 365;

  const dailyCost = dailyKwh * costPerKwh;
  const monthlyCost = monthlyKwh * costPerKwh;
  const yearlyCost = yearlyKwh * costPerKwh;

  return {
    dailyKwh: +dailyKwh.toFixed(3),
    monthlyKwh: +monthlyKwh.toFixed(2),
    yearlyKwh: +yearlyKwh.toFixed(2),
    dailyCost: +dailyCost.toFixed(2),
    monthlyCost: +monthlyCost.toFixed(2),
    yearlyCost: +yearlyCost.toFixed(2),
  };
}

// ==========================================
// 12. TIP CALCULATOR
// ==========================================

export interface TipResult {
  billAmount: number;
  tipPercent: number;
  tipAmount: number;
  totalAmount: number;
  splitCount: number;
  tipPerPerson: number;
  totalPerPerson: number;
}

export function calculateTip(
  billAmount: number,
  tipPercent: number,
  splitCount: number = 1,
  roundUp: boolean = false
): TipResult {
  const bill = Math.max(0, billAmount);
  const percent = Math.max(0, tipPercent);
  const splits = Math.max(1, Math.round(splitCount));

  let tipAmount = bill * (percent / 100);
  let totalAmount = bill + tipAmount;

  if (roundUp) {
    totalAmount = Math.ceil(totalAmount);
    tipAmount = totalAmount - bill;
  }

  const tipPerPerson = tipAmount / splits;
  const totalPerPerson = totalAmount / splits;

  return {
    billAmount: bill,
    tipPercent: percent,
    tipAmount: +tipAmount.toFixed(2),
    totalAmount: +totalAmount.toFixed(2),
    splitCount: splits,
    tipPerPerson: +tipPerPerson.toFixed(2),
    totalPerPerson: +totalPerPerson.toFixed(2),
  };
}
