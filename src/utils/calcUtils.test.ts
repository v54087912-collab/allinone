import test from 'node:test';
import assert from 'node:assert';
import {
  calculateAge,
  calculatePercentage,
  convertUnits,
  parseTimestamp,
  evaluateMathExpression,
} from './calcUtils.ts';

test('calculateAge computes exact age between dates and determines zodiac', () => {
  const age = calculateAge('1995-05-15', '2026-10-27');
  assert.strictEqual(age.years, 31);
  assert.strictEqual(age.months, 5);
  assert.strictEqual(age.days, 12);
  assert.ok(age.totalDays > 10000);
  assert.ok(age.zodiacSign.includes('Taurus'));
});

test('calculatePercentage evaluates all percent operations accurately', () => {
  assert.strictEqual(calculatePercentage('percent-of', 20, 500), 100);
  assert.strictEqual(calculatePercentage('is-percent-of', 50, 200), 25);
  assert.strictEqual(calculatePercentage('percentage-change', 100, 150), 50);
  assert.strictEqual(calculatePercentage('add-percent', 100, 10), 110);
  assert.strictEqual(calculatePercentage('subtract-percent', 100, 15), 85);
});

test('convertUnits handles length, weight, storage, and temperature conversions', () => {
  assert.strictEqual(convertUnits('length', 1, 'km', 'm'), 1000);
  assert.strictEqual(convertUnits('weight', 1, 'kg', 'g'), 1000);
  assert.strictEqual(convertUnits('storage', 1, 'mb', 'kb'), 1024);
  assert.strictEqual(convertUnits('temperature', 0, 'c', 'f'), 32);
  assert.strictEqual(convertUnits('temperature', 100, 'c', 'f'), 212);
});

test('parseTimestamp handles epoch seconds and milliseconds properly', () => {
  const parsed = parseTimestamp(1700000000);
  assert.strictEqual(parsed.seconds, 1700000000);
  assert.ok(parsed.utcIso.includes('2023-11-14'));
});

test('evaluateMathExpression computes basic arithmetic and percentages', () => {
  assert.strictEqual(evaluateMathExpression('2 + 3 * 4'), 14);
  assert.strictEqual(evaluateMathExpression('(10 - 2) / 4'), 2);
  assert.strictEqual(evaluateMathExpression('50 * 10%'), 5);
});
