import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isLeapYear,
  calculateSunriseSunset,
  calculateHaversineDistance,
  convertCoordinates,
  calculateDateMath,
  searchCountries
} from './geoTimeUtils.ts';

describe('Geo & Time Utilities Unit Tests', () => {
  it('isLeapYear identifies leap years and century rules correctly', () => {
    // 2024 is a leap year (divisible by 4)
    const y2024 = isLeapYear(2024);
    assert.equal(y2024.isLeap, true);
    assert.equal(y2024.daysInYear, 366);

    // 1900 is NOT a leap year (divisible by 100, not 400)
    const y1900 = isLeapYear(1900);
    assert.equal(y1900.isLeap, false);
    assert.equal(y1900.daysInYear, 365);

    // 2000 is a leap year (divisible by 400)
    const y2000 = isLeapYear(2000);
    assert.equal(y2000.isLeap, true);

    // 2026 is NOT a leap year
    const y2026 = isLeapYear(2026);
    assert.equal(y2026.isLeap, false);
    assert.ok(y2026.nextLeapYears.includes(2028));
  });

  it('calculateSunriseSunset computes reasonable sunrise/sunset for London', () => {
    // London lat: 51.5074, lng: -0.1278 on June 21 (Summer solstice)
    const date = new Date(Date.UTC(2026, 5, 21));
    const res = calculateSunriseSunset(51.5074, -0.1278, date, 1); // BST = UTC+1
    assert.ok(res.sunrise.includes('AM'));
    assert.ok(res.sunset.includes('PM'));
    assert.ok(res.dayLength.includes('h'));
  });

  it('calculateHaversineDistance computes accurate flight distance and bearing', () => {
    // New York (40.7128, -74.0060) to London (51.5074, -0.1278)
    // Great circle distance is ~5570 km
    const res = calculateHaversineDistance(40.7128, -74.0060, 51.5074, -0.1278);
    assert.ok(res.km > 5500 && res.km < 5650, `Expected ~5570km, got ${res.km}`);
    assert.ok(res.miles > 3400 && res.miles < 3550);
    assert.ok(res.flightTimeEstimateHours > 6);
  });

  it('convertCoordinates converts decimal to DMS and DDM', () => {
    // 37.7749, -122.4194 (San Francisco)
    const res = convertCoordinates(37.7749, -122.4194);
    assert.ok(res.dms.lat.includes('37° 46\''));
    assert.ok(res.dms.lat.includes('N'));
    assert.ok(res.dms.lng.includes('122° 25\''));
    assert.ok(res.dms.lng.includes('W'));
    assert.ok(res.utm.includes('Zone 10N'));
  });

  it('calculateDateMath adds and subtracts days, weeks, months, years', () => {
    const resAddDays = calculateDateMath('2026-05-10', 'add', 15, 'days');
    assert.equal(resAddDays.resultDate, '2026-05-25');

    const resSubWeeks = calculateDateMath('2026-06-01', 'subtract', 2, 'weeks');
    assert.equal(resSubWeeks.resultDate, '2026-05-18');

    const resAddYear = calculateDateMath('2026-01-01', 'add', 1, 'years');
    assert.equal(resAddYear.resultDate, '2027-01-01');
  });

  it('searchCountries searches by name, code and capital', () => {
    const japan = searchCountries('Japan');
    assert.equal(japan.length, 1);
    assert.equal(japan[0].code, 'JP');
    assert.equal(japan[0].capital, 'Tokyo');

    const codeSearch = searchCountries('in');
    assert.ok(codeSearch.some(c => c.code === 'IN'));
  });
});
