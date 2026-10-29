/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateDiscount,
  calculateGst,
  calculateEmi,
  calculateLoanPrepayment,
  calculateDateDifference,
  calculateTimeBetween,
  convertTemperature,
  convertLength,
  convertWeight,
  convertSpeed,
  calculateFuelCost,
  calculateElectricityBill,
  calculateTip,
} from './calcFinanceUtils';

describe('Calculator & Finance Utilities Unit Tests', () => {
  it('calculateDiscount computes discounts, stackable vouchers, and sales taxes', () => {
    // 100 with 20% discount = 80. Extra 10% on 80 = 72. Tax 5% on 72 = 75.60
    const res = calculateDiscount(100, 20, 10, 5);
    assert.strictEqual(res.priceAfterDiscount, 80);
    assert.strictEqual(res.extraDiscountAmount, 8);
    assert.strictEqual(res.taxAmount, 3.6);
    assert.strictEqual(res.finalPrice, 75.6);
    assert.strictEqual(res.totalSaved, 28);
  });

  it('calculateGst handles both inclusive and exclusive GST rates', () => {
    // Exclusive: 1000 + 18% = 1180
    const excl = calculateGst(1000, 18, false);
    assert.strictEqual(excl.baseAmount, 1000);
    assert.strictEqual(excl.gstAmount, 180);
    assert.strictEqual(excl.cgst, 90);
    assert.strictEqual(excl.sgst, 90);
    assert.strictEqual(excl.totalAmount, 1180);

    // Inclusive: 1180 with 18% GST -> base 1000, GST 180
    const incl = calculateGst(1180, 18, true);
    assert.strictEqual(Math.round(incl.baseAmount), 1000);
    assert.strictEqual(Math.round(incl.gstAmount), 180);
  });

  it('calculateEmi calculates accurate monthly payments and amortization schedules', () => {
    // 100,000 at 12% for 12 months
    const emi = calculateEmi(100000, 12, 12);
    assert.ok(emi.monthlyEmi > 8800 && emi.monthlyEmi < 8900);
    assert.strictEqual(emi.schedule.length, 12);
    assert.ok(emi.schedule[11].remainingBalance < 1);
  });

  it('calculateLoanPrepayment calculates interest and time saved with extra payments', () => {
    const prepay = calculateLoanPrepayment(100000, 12, 36, 500);
    assert.ok(prepay.interestSaved > 0);
    assert.ok(prepay.monthsSaved > 0);
  });

  it('calculateDateDifference handles exact date deltas and business days', () => {
    // Mon Jan 1, 2024 to Mon Jan 8, 2024
    const diff = calculateDateDifference('2024-01-01', '2024-01-08', true);
    assert.strictEqual(diff.totalDays, 8);
    assert.strictEqual(diff.businessDays, 6);
    assert.strictEqual(diff.weekendDays, 2);
  });

  it('calculateTimeBetween computes elapsed hours, minutes, and seconds', () => {
    const time = calculateTimeBetween('09:15:00', '17:45:30');
    assert.strictEqual(time.hours, 8);
    assert.strictEqual(time.minutes, 30);
    assert.strictEqual(time.seconds, 30);
    assert.strictEqual(time.formatted, '08:30:30');
  });

  it('convertTemperature converts across Celsius, Fahrenheit, Kelvin, and Rankine', () => {
    const t = convertTemperature(100, 'c');
    assert.strictEqual(t.celsius, 100);
    assert.strictEqual(t.fahrenheit, 212);
    assert.strictEqual(t.kelvin, 373.15);
  });

  it('convertLength converts between metric and imperial distances', () => {
    const l = convertLength(1, 'km');
    assert.strictEqual(l.m, 1000);
    assert.strictEqual(l.cm, 100000);
    assert.ok(l.mi > 0.62 && l.mi < 0.63);
  });

  it('convertWeight converts mass accurately', () => {
    const w = convertWeight(1, 'kg');
    assert.strictEqual(w.g, 1000);
    assert.ok(w.lb > 2.2 && w.lb < 2.21);
  });

  it('convertSpeed converts velocity and computes runner paces', () => {
    const s = convertSpeed(10, 'kmh');
    assert.strictEqual(s.kmh, 10);
    assert.strictEqual(s.paceMinPerKm, '6:00 /km');
  });

  it('calculateFuelCost calculates vehicle travel fuel costs', () => {
    // 500 km at 10 km/L = 50 L. At $1.50/L = $75. 3 passengers = $25 each.
    const f = calculateFuelCost(500, 10, 1.5, 3, false);
    assert.strictEqual(f.totalDistanceKm, 500);
    assert.strictEqual(f.fuelConsumedLiters, 50);
    assert.strictEqual(f.totalCost, 75);
    assert.strictEqual(f.costPerPerson, 25);
  });

  it('calculateElectricityBill evaluates appliance power usage and tariffs', () => {
    const bill = calculateElectricityBill(
      [
        { name: 'AC', watts: 1500, hoursPerDay: 8, quantity: 1 },
        { name: 'Lights', watts: 100, hoursPerDay: 5, quantity: 4 },
      ],
      0.15
    );
    // 1500*8 = 12000 Wh, 400*5 = 2000 Wh -> 14 kWh/day. 14 * 0.15 = $2.10/day
    assert.strictEqual(bill.dailyKwh, 14);
    assert.strictEqual(bill.dailyCost, 2.1);
  });

  it('calculateTip computes split bills and tips with rounding', () => {
    const tip = calculateTip(100, 15, 2, false);
    assert.strictEqual(tip.tipAmount, 15);
    assert.strictEqual(tip.totalAmount, 115);
    assert.strictEqual(tip.tipPerPerson, 7.5);
    assert.strictEqual(tip.totalPerPerson, 57.5);
  });
});
