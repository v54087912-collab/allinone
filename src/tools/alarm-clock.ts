/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';
import { formatTime12H, playSyntheticAudioTone } from '../utils/productivityUtils.js';

interface Alarm {
  id: string;
  time24: string; // "07:30"
  label: string;
  days: number[]; // 0 for Sun, 1 for Mon, ... empty array means every day / once
  enabled: boolean;
  snoozeMinutes: number;
}

const STORAGE_KEY = 'toolora_alarms';

function loadAlarms(): Alarm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [
    {
      id: 'alarm-1',
      time24: '07:00',
      label: 'Wake Up & Morning Routine',
      days: [1, 2, 3, 4, 5],
      enabled: true,
      snoozeMinutes: 5,
    },
    {
      id: 'alarm-2',
      time24: '08:30',
      label: 'Daily Team Standup',
      days: [1, 2, 3, 4, 5],
      enabled: false,
      snoozeMinutes: 5,
    },
  ];
}

function saveAlarms(alarms: Alarm[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  } catch (err) {
    console.error('Failed to save alarms to localStorage', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  let alarms = loadAlarms();
  let ringingAlarm: Alarm | null = null;
  let ringInterval: number | null = null;

  // Clock DOM
  const clockTimeEl = document.getElementById('clock-time');
  const clockAmpmEl = document.getElementById('clock-ampm');
  const clockDateEl = document.getElementById('clock-date');

  // Form DOM
  const form = document.getElementById('alarm-form') as HTMLFormElement | null;
  const timeInput = document.getElementById('alarm-time-input') as HTMLInputElement | null;
  const labelInput = document.getElementById('alarm-label-input') as HTMLInputElement | null;
  const snoozeSelect = document.getElementById('alarm-snooze-select') as HTMLSelectElement | null;
  const dayCheckboxes = document.querySelectorAll<HTMLInputElement>('.alarm-day-checkbox');

  // List & Test
  const alarmsListContainer = document.getElementById('alarms-list-container');
  const testSoundBtn = document.getElementById('test-alarm-sound-btn');

  // Ringing Modal
  const ringingModal = document.getElementById('alarm-ringing-modal');
  const ringingLabel = document.getElementById('alarm-ringing-label');
  const ringingTime = document.getElementById('alarm-ringing-time');
  const snoozeBtn = document.getElementById('alarm-snooze-btn');
  const dismissBtn = document.getElementById('alarm-dismiss-btn');

  // Live Digital Clock
  function updateLiveClock(): void {
    const now = new Date();
    let hrs = now.getHours();
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12;
    if (hrs === 0) hrs = 12;
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');

    if (clockTimeEl) clockTimeEl.textContent = `${hrs}:${mins}:${secs}`;
    if (clockAmpmEl) clockAmpmEl.textContent = ampm;
    if (clockDateEl) {
      clockDateEl.textContent = now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    // Check alarms once per minute at second 0
    if (now.getSeconds() === 0 && !ringingAlarm) {
      const current24 = `${String(now.getHours()).padStart(2, '0')}:${mins}`;
      const currentDay = now.getDay();

      alarms.forEach((alarm) => {
        if (alarm.enabled && alarm.time24 === current24) {
          const matchesDay = alarm.days.length === 0 || alarm.days.includes(currentDay);
          if (matchesDay) {
            triggerAlarm(alarm);
          }
        }
      });
    }
  }

  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  function triggerAlarm(alarm: Alarm): void {
    ringingAlarm = alarm;
    if (ringingLabel) ringingLabel.textContent = alarm.label || 'Alarm';
    if (ringingTime) ringingTime.textContent = formatTime12H(alarm.time24);
    if (ringingModal) ringingModal.classList.remove('hidden');

    playSyntheticAudioTone('alarm_ring');
    ringInterval = window.setInterval(() => {
      playSyntheticAudioTone('alarm_ring');
    }, 1500);
  }

  function stopRinging(): void {
    if (ringInterval !== null) {
      clearInterval(ringInterval);
      ringInterval = null;
    }
    if (ringingModal) ringingModal.classList.add('hidden');
    ringingAlarm = null;
  }

  snoozeBtn?.addEventListener('click', () => {
    if (ringingAlarm) {
      const snoozeMins = ringingAlarm.snoozeMinutes || 5;
      const now = new Date();
      now.setMinutes(now.getMinutes() + snoozeMins);
      const snoozeTime24 = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Create a temporary snooze alarm
      const tempAlarm: Alarm = {
        id: `snooze-${Date.now()}`,
        time24: snoozeTime24,
        label: `Snooze: ${ringingAlarm.label}`,
        days: [],
        enabled: true,
        snoozeMinutes: snoozeMins,
      };
      alarms.push(tempAlarm);
      saveAlarms(alarms);
      renderAlarms();
    }
    stopRinging();
  });

  dismissBtn?.addEventListener('click', () => {
    stopRinging();
  });

  testSoundBtn?.addEventListener('click', () => {
    playSyntheticAudioTone('alarm_ring');
  });

  function renderAlarms(): void {
    if (!alarmsListContainer) return;
    alarmsListContainer.innerHTML = '';

    if (alarms.length === 0) {
      alarmsListContainer.innerHTML = `
        <div class="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p class="text-xs text-slate-400">No alarms set. Use the form above to schedule your first alarm!</p>
        </div>
      `;
      return;
    }

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    alarms.forEach((alarm) => {
      const card = document.createElement('div');
      card.className = `p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
        alarm.enabled
          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
          : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
      }`;

      let repeatLabel = 'Every Day';
      if (alarm.days.length > 0 && alarm.days.length < 7) {
        if (alarm.days.length === 5 && [1, 2, 3, 4, 5].every((d) => alarm.days.includes(d))) {
          repeatLabel = 'Weekdays';
        } else if (alarm.days.length === 2 && [0, 6].every((d) => alarm.days.includes(d))) {
          repeatLabel = 'Weekends';
        } else {
          repeatLabel = alarm.days.map((d) => DAY_NAMES[d]).join(', ');
        }
      }

      card.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            ${formatTime12H(alarm.time24)}
          </div>
          <div>
            <div class="font-bold text-sm text-slate-800 dark:text-slate-100">${escapeHtml(alarm.label || 'Alarm')}</div>
            <div class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>🔁 ${repeatLabel}</span>
              <span>&bull;</span>
              <span>Snooze ${alarm.snoozeMinutes}m</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" data-toggle-id="${alarm.id}" ${alarm.enabled ? 'checked' : ''} class="sr-only peer">
            <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <button type="button" data-delete-id="${alarm.id}" title="Delete alarm" class="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer text-sm">
            ✕
          </button>
        </div>
      `;

      alarmsListContainer.appendChild(card);
    });
  }

  function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  }

  // Toggle & Delete handlers
  alarmsListContainer?.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    const id = target.getAttribute('data-toggle-id');
    if (!id) return;
    alarms = alarms.map((a) => (a.id === id ? { ...a, enabled: target.checked } : a));
    saveAlarms(alarms);
    renderAlarms();
  });

  alarmsListContainer?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-delete-id]') as HTMLElement | null;
    if (!btn) return;
    const id = btn.getAttribute('data-delete-id');
    if (!id) return;
    alarms = alarms.filter((a) => a.id !== id);
    saveAlarms(alarms);
    renderAlarms();
  });

  // Add Alarm Form
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const time24 = timeInput?.value;
    if (!time24) return;

    const selectedDays: number[] = [];
    dayCheckboxes.forEach((cb) => {
      if (cb.checked) {
        selectedDays.push(parseInt(cb.value, 10));
      }
    });

    const newAlarm: Alarm = {
      id: `alarm-${Date.now()}`,
      time24,
      label: (labelInput?.value || '').trim() || 'Alarm',
      days: selectedDays,
      enabled: true,
      snoozeMinutes: parseInt(snoozeSelect?.value || '5', 10),
    };

    alarms.push(newAlarm);
    saveAlarms(alarms);
    if (labelInput) labelInput.value = '';
    renderAlarms();
  });

  renderAlarms();
});
