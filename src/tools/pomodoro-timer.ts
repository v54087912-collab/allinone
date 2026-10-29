/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';
import { formatSecondsToTimer, playSyntheticAudioTone } from '../utils/productivityUtils.js';

type PomodoroMode = 'focus' | 'short_break' | 'long_break';

interface PomodoroSettings {
  focusDuration: number; // in seconds
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number; // e.g. 4
  autoStartBreaks: boolean;
  soundEnabled: boolean;
}

const SETTINGS_KEY = 'toolora_pomodoro_settings';
const STATS_KEY = 'toolora_pomodoro_stats';

function loadSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {
    focusDuration: 25 * 60,
    shortBreakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    longBreakInterval: 4,
    autoStartBreaks: false,
    soundEnabled: true,
  };
}

function saveSettings(s: PomodoroSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

interface PomodoroStats {
  todayRounds: number;
  totalFocusSeconds: number;
  lastDate: string;
}

function loadStats(): PomodoroStats {
  const today = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.lastDate === today) return parsed;
    }
  } catch {
    // fallback
  }
  return { todayRounds: 0, totalFocusSeconds: 0, lastDate: today };
}

function saveStats(stats: PomodoroStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save stats', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  let settings = loadSettings();
  let stats = loadStats();

  let currentMode: PomodoroMode = 'focus';
  let totalTime = settings.focusDuration;
  let timeRemaining = totalTime;
  let isRunning = false;
  let timerInterval: number | null = null;
  let roundCounter = 1;

  // DOM Elements
  const timerDisplay = document.getElementById('pomodoro-timer-display');
  const timerLabel = document.getElementById('pomodoro-timer-label');
  const startPauseBtn = document.getElementById('pomodoro-start-pause-btn');
  const resetBtn = document.getElementById('pomodoro-reset-btn');
  const skipBtn = document.getElementById('pomodoro-skip-btn');
  const progressCircle = document.getElementById('pomodoro-progress-circle') as SVGCircleElement | null;
  const roundDisplay = document.getElementById('pomodoro-round-display');

  // Mode Buttons
  const modeFocusBtn = document.getElementById('mode-focus-btn');
  const modeShortBtn = document.getElementById('mode-short-btn');
  const modeLongBtn = document.getElementById('mode-long-btn');

  // Stats Elements
  const todaySessionsEl = document.getElementById('pomodoro-today-sessions');
  const todayMinutesEl = document.getElementById('pomodoro-today-minutes');

  // Settings inputs
  const focusInput = document.getElementById('setting-focus-time') as HTMLInputElement | null;
  const shortBreakInput = document.getElementById('setting-short-break') as HTMLInputElement | null;
  const longBreakInput = document.getElementById('setting-long-break') as HTMLInputElement | null;
  const soundToggle = document.getElementById('setting-sound-toggle') as HTMLInputElement | null;

  // Circle circumference: 2 * PI * r = 2 * Math.PI * 140 ~= 879.64
  const CIRCLE_RADIUS = 140;
  const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
  if (progressCircle) {
    progressCircle.style.strokeDasharray = `${CIRCUMFERENCE}`;
    progressCircle.style.strokeDashoffset = '0';
  }

  function updateModeUI(): void {
    const btns = [modeFocusBtn, modeShortBtn, modeLongBtn];
    btns.forEach((b) => b?.classList.remove('bg-rose-600', 'bg-blue-600', 'bg-emerald-600', 'text-white', 'font-bold'));

    if (currentMode === 'focus') {
      modeFocusBtn?.classList.add('bg-rose-600', 'text-white', 'font-bold');
      if (timerLabel) timerLabel.textContent = 'Focus Session';
    } else if (currentMode === 'short_break') {
      modeShortBtn?.classList.add('bg-blue-600', 'text-white', 'font-bold');
      if (timerLabel) timerLabel.textContent = 'Short Break';
    } else {
      modeLongBtn?.classList.add('bg-emerald-600', 'text-white', 'font-bold');
      if (timerLabel) timerLabel.textContent = 'Long Break';
    }
  }

  function updateDisplay(): void {
    if (timerDisplay) {
      timerDisplay.textContent = formatSecondsToTimer(timeRemaining);
    }
    document.title = `${formatSecondsToTimer(timeRemaining)} - Pomodoro Timer`;

    if (progressCircle) {
      const progressFraction = totalTime > 0 ? (totalTime - timeRemaining) / totalTime : 0;
      const offset = CIRCUMFERENCE * (1 - progressFraction);
      progressCircle.style.strokeDashoffset = `${offset}`;
    }

    if (roundDisplay) {
      roundDisplay.textContent = `Round ${roundCounter} of ${settings.longBreakInterval}`;
    }

    if (todaySessionsEl) todaySessionsEl.textContent = String(stats.todayRounds);
    if (todayMinutesEl) todayMinutesEl.textContent = `${Math.round(stats.totalFocusSeconds / 60)} mins`;

    if (startPauseBtn) {
      startPauseBtn.textContent = isRunning ? 'Pause' : 'Start';
      if (isRunning) {
        startPauseBtn.classList.replace('bg-rose-600', 'bg-amber-600');
        startPauseBtn.classList.replace('hover:bg-rose-700', 'hover:bg-amber-700');
      } else {
        startPauseBtn.classList.replace('bg-amber-600', 'bg-rose-600');
        startPauseBtn.classList.replace('hover:bg-amber-700', 'hover:bg-rose-700');
      }
    }
  }

  function switchMode(mode: PomodoroMode, autoStart = false): void {
    pauseTimer();
    currentMode = mode;
    if (mode === 'focus') {
      totalTime = settings.focusDuration;
    } else if (mode === 'short_break') {
      totalTime = settings.shortBreakDuration;
    } else {
      totalTime = settings.longBreakDuration;
    }
    timeRemaining = totalTime;
    updateModeUI();
    updateDisplay();

    if (autoStart) {
      startTimer();
    }
  }

  function onTimerComplete(): void {
    pauseTimer();
    if (settings.soundEnabled) {
      playSyntheticAudioTone('pomodoro_complete');
    }

    if (currentMode === 'focus') {
      stats.todayRounds++;
      stats.totalFocusSeconds += settings.focusDuration;
      saveStats(stats);

      if (roundCounter >= settings.longBreakInterval) {
        roundCounter = 1;
        switchMode('long_break', settings.autoStartBreaks);
      } else {
        roundCounter++;
        switchMode('short_break', settings.autoStartBreaks);
      }
    } else {
      switchMode('focus', settings.autoStartBreaks);
    }
  }

  function startTimer(): void {
    if (isRunning) return;
    isRunning = true;
    timerInterval = window.setInterval(() => {
      if (timeRemaining > 0) {
        timeRemaining--;
        updateDisplay();
      } else {
        onTimerComplete();
      }
    }, 1000);
    updateDisplay();
  }

  function pauseTimer(): void {
    isRunning = false;
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    updateDisplay();
  }

  startPauseBtn?.addEventListener('click', () => {
    if (isRunning) pauseTimer();
    else startTimer();
  });

  resetBtn?.addEventListener('click', () => {
    pauseTimer();
    timeRemaining = totalTime;
    updateDisplay();
  });

  skipBtn?.addEventListener('click', () => {
    if (confirm('Skip to the next session?')) {
      if (currentMode === 'focus') {
        if (roundCounter >= settings.longBreakInterval) {
          roundCounter = 1;
          switchMode('long_break');
        } else {
          roundCounter++;
          switchMode('short_break');
        }
      } else {
        switchMode('focus');
      }
    }
  });

  modeFocusBtn?.addEventListener('click', () => switchMode('focus'));
  modeShortBtn?.addEventListener('click', () => switchMode('short_break'));
  modeLongBtn?.addEventListener('click', () => switchMode('long_break'));

  // Settings bindings
  if (focusInput) focusInput.value = String(settings.focusDuration / 60);
  if (shortBreakInput) shortBreakInput.value = String(settings.shortBreakDuration / 60);
  if (longBreakInput) longBreakInput.value = String(settings.longBreakDuration / 60);
  if (soundToggle) soundToggle.checked = settings.soundEnabled;

  const saveSettingsFromUI = () => {
    const fMins = Math.max(1, parseInt(focusInput?.value || '25', 10));
    const sMins = Math.max(1, parseInt(shortBreakInput?.value || '5', 10));
    const lMins = Math.max(1, parseInt(longBreakInput?.value || '15', 10));

    settings.focusDuration = fMins * 60;
    settings.shortBreakDuration = sMins * 60;
    settings.longBreakDuration = lMins * 60;
    settings.soundEnabled = soundToggle?.checked ?? true;
    saveSettings(settings);

    if (!isRunning) {
      switchMode(currentMode);
    }
  };

  focusInput?.addEventListener('change', saveSettingsFromUI);
  shortBreakInput?.addEventListener('change', saveSettingsFromUI);
  longBreakInput?.addEventListener('change', saveSettingsFromUI);
  soundToggle?.addEventListener('change', saveSettingsFromUI);

  switchMode('focus');
});
