/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  generateCalendarGrid,
  formatDateKey,
  formatSecondsToTimer,
  formatTime12H,
  timeToMinutes,
  minutesToTime,
  convertMeetingTime,
  getHourComfortStatus,
  pickRandomItem,
  shuffleArray,
  calculateProsConsScore,
  calculateHabitStreaks,
  generateIcsCalendar,
} from './productivityUtils.js';

describe('Productivity & Time Management Utilities Unit Tests', () => {
  test('generateCalendarGrid creates a full 35 or 42 grid with proper days', () => {
    // October 2026
    const grid = generateCalendarGrid(2026, 9);
    assert.ok(grid.length === 35 || grid.length === 42, 'Grid length should be 35 or 42');
    const currentMonthDays = grid.filter((g) => g.isCurrentMonth);
    assert.strictEqual(currentMonthDays.length, 31, 'October should have 31 days');
    assert.strictEqual(currentMonthDays[0].dayNumber, 1);
    assert.strictEqual(currentMonthDays[30].dayNumber, 31);
  });

  test('formatDateKey formats YYYY-MM-DD properly', () => {
    const d = new Date(2026, 9, 28);
    const key = formatDateKey(d);
    assert.strictEqual(key, '2026-10-28');
  });

  test('formatSecondsToTimer formats MM:SS and HH:MM:SS accurately', () => {
    assert.strictEqual(formatSecondsToTimer(0), '00:00');
    assert.strictEqual(formatSecondsToTimer(65), '01:05');
    assert.strictEqual(formatSecondsToTimer(1500), '25:00'); // Standard Pomodoro
    assert.strictEqual(formatSecondsToTimer(3665), '01:01:05');
  });

  test('formatTime12H converts 24h to 12h AM/PM properly', () => {
    assert.strictEqual(formatTime12H('00:00'), '12:00 AM');
    assert.strictEqual(formatTime12H('09:30'), '9:30 AM');
    assert.strictEqual(formatTime12H('12:00'), '12:00 PM');
    assert.strictEqual(formatTime12H('15:45'), '3:45 PM');
    assert.strictEqual(formatTime12H('23:59'), '11:59 PM');
  });

  test('timeToMinutes and minutesToTime round trip accurately', () => {
    assert.strictEqual(timeToMinutes('00:00'), 0);
    assert.strictEqual(timeToMinutes('09:30'), 570);
    assert.strictEqual(timeToMinutes('23:59'), 1439);

    assert.strictEqual(minutesToTime(0), '00:00');
    assert.strictEqual(minutesToTime(570), '09:30');
    assert.strictEqual(minutesToTime(1439), '23:59');
  });

  test('convertMeetingTime calculates cross-timezone time and day shift', () => {
    // London (UTC+0, 0 min) to New York (UTC-5, -300 min) at 14:00
    const ny = convertMeetingTime('14:00', 0, -300);
    assert.strictEqual(ny.targetTime24, '09:00');
    assert.strictEqual(ny.dayShift, 0);

    // London (0 min) to Tokyo (+540 min) at 22:00 (shifts to next day 07:00)
    const tokyo = convertMeetingTime('22:00', 0, 540);
    assert.strictEqual(tokyo.targetTime24, '07:00');
    assert.strictEqual(tokyo.dayShift, 1);

    // New York (-300 min) to London (0 min) at 02:00 (shifts from previous day if reversed)
    const reverse = convertMeetingTime('01:00', 0, -300);
    assert.strictEqual(reverse.targetTime24, '20:00');
    assert.strictEqual(reverse.dayShift, -1);
  });

  test('getHourComfortStatus flags working, extended, and night hours', () => {
    assert.strictEqual(getHourComfortStatus(10), 'work');
    assert.strictEqual(getHourComfortStatus(14), 'work');
    assert.strictEqual(getHourComfortStatus(8), 'extended');
    assert.strictEqual(getHourComfortStatus(20), 'extended');
    assert.strictEqual(getHourComfortStatus(23), 'night');
    assert.strictEqual(getHourComfortStatus(3), 'night');
  });

  test('pickRandomItem and shuffleArray handle item lists', () => {
    const list = ['Alice', 'Bob', 'Charlie', 'David'];
    const picked = pickRandomItem(list);
    assert.ok(picked !== null);
    assert.ok(list.includes(picked.item));

    const shuffled = shuffleArray(list);
    assert.strictEqual(shuffled.length, list.length);
    assert.ok(list.every((item) => shuffled.includes(item)));
  });

  test('calculateProsConsScore calculates weighted scores and recommendations', () => {
    const pros = [
      { id: '1', text: 'Higher salary', weight: 5 },
      { id: '2', text: 'Great team', weight: 4 },
    ];
    const cons = [
      { id: '3', text: 'Longer commute', weight: 3 },
    ];
    const res = calculateProsConsScore(pros, cons);
    assert.strictEqual(res.prosTotal, 9);
    assert.strictEqual(res.consTotal, 3);
    assert.strictEqual(res.netScore, 6);
    assert.strictEqual(res.recommendation, 'strong_yes');
  });

  test('calculateHabitStreaks handles consecutive and broken streak records', () => {
    const dates = [
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23', // 4-day streak
      '2026-10-25',
      '2026-10-26', // 2-day streak
    ];
    const streaks = calculateHabitStreaks(dates);
    assert.strictEqual(streaks.longestStreak, 4);
    assert.strictEqual(streaks.totalCompletions, 6);
  });

  test('generateIcsCalendar produces valid iCalendar format', () => {
    const events = [
      {
        title: 'Team Sync',
        date: '2026-11-01',
        startTime: '10:00',
        endTime: '11:00',
        description: 'Weekly team catch-up',
      },
    ];
    const ics = generateIcsCalendar(events);
    assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('SUMMARY:Team Sync'));
    assert.ok(ics.includes('DTSTART:20261101T100000'));
    assert.ok(ics.includes('DTEND:20261101T110000'));
    assert.ok(ics.endsWith('END:VCALENDAR'));
  });
});
