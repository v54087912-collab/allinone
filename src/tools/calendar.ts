/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initSiteShell } from '../shared/site-shell.js';
import { generateCalendarGrid, formatDateKey, generateIcsCalendar } from '../utils/productivityUtils.js';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: 'work' | 'personal' | 'meeting' | 'reminder';
}

const STORAGE_KEY = 'toolora_calendar_events';

function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  const today = formatDateKey(new Date());
  return [
    {
      id: 'ev-1',
      title: 'Sprint Planning & Goal Setting',
      date: today,
      time: '10:00',
      category: 'work',
    },
    {
      id: 'ev-2',
      title: 'Team Coffee Catchup',
      date: today,
      time: '15:30',
      category: 'meeting',
    },
  ];
}

function saveEvents(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteShell();

  let events = loadEvents();
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth(); // 0 to 11
  let selectedDateKey = formatDateKey(new Date());

  // DOM elements
  const monthYearHeading = document.getElementById('calendar-month-year');
  const prevMonthBtn = document.getElementById('calendar-prev-month');
  const nextMonthBtn = document.getElementById('calendar-next-month');
  const todayBtn = document.getElementById('calendar-today-btn');
  const daysGrid = document.getElementById('calendar-days-grid');

  // Selected Day Panel
  const selectedDateHeading = document.getElementById('selected-date-heading');
  const dayEventsList = document.getElementById('day-events-list');
  const addEventForm = document.getElementById('add-event-form') as HTMLFormElement | null;
  const eventTitleInput = document.getElementById('event-title-input') as HTMLInputElement | null;
  const eventTimeInput = document.getElementById('event-time-input') as HTMLInputElement | null;
  const eventCategorySelect = document.getElementById('event-category-select') as HTMLSelectElement | null;
  const exportIcsBtn = document.getElementById('calendar-export-ics-btn');

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function renderCalendar(): void {
    if (monthYearHeading) {
      monthYearHeading.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
    }

    if (!daysGrid) return;
    daysGrid.innerHTML = '';

    const grid = generateCalendarGrid(currentYear, currentMonth);

    grid.forEach((day) => {
      const dayCell = document.createElement('div');
      const isSelected = day.dateKey === selectedDateKey;

      dayCell.className = `min-h-[70px] sm:min-h-[85px] p-2 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col justify-between transition-all cursor-pointer ${
        isSelected
          ? 'ring-2 ring-blue-600 bg-blue-50/40 dark:bg-blue-950/20'
          : day.isToday
          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
          : day.isCurrentMonth
          ? 'bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
          : 'bg-slate-50/60 dark:bg-slate-900/30 opacity-40'
      }`;

      // Date number
      const numRow = document.createElement('div');
      numRow.className = 'flex items-center justify-between text-xs font-semibold';
      numRow.innerHTML = `
        <span class="${day.isToday ? 'px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold' : 'text-slate-700 dark:text-slate-300'}">
          ${day.dayNumber}
        </span>
      `;

      // Events for this day
      const dayEvs = events.filter((e) => e.date === day.dateKey);
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'space-y-1 mt-1';

      dayEvs.slice(0, 2).forEach((e) => {
        const tag = document.createElement('div');
        const badgeColor =
          e.category === 'work'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
            : e.category === 'meeting'
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
            : e.category === 'reminder'
            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';

        tag.className = `text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${badgeColor}`;
        tag.textContent = e.title;
        dotsContainer.appendChild(tag);
      });

      if (dayEvs.length > 2) {
        const more = document.createElement('span');
        more.className = 'text-[9px] text-slate-400 font-semibold pl-1';
        more.textContent = `+${dayEvs.length - 2} more`;
        dotsContainer.appendChild(more);
      }

      dayCell.appendChild(numRow);
      dayCell.appendChild(dotsContainer);

      dayCell.addEventListener('click', () => {
        selectedDateKey = day.dateKey;
        renderCalendar();
        renderDayPanel();
      });

      daysGrid.appendChild(dayCell);
    });

    renderDayPanel();
  }

  function renderDayPanel(): void {
    if (selectedDateHeading) {
      const d = new Date(selectedDateKey + 'T00:00:00');
      selectedDateHeading.textContent = d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }

    if (!dayEventsList) return;
    dayEventsList.innerHTML = '';

    const dayEvs = events
      .filter((e) => e.date === selectedDateKey)
      .sort((a, b) => a.time.localeCompare(b.time));

    if (dayEvs.length === 0) {
      dayEventsList.innerHTML = `
        <div class="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
          No events scheduled for this day.
        </div>
      `;
      return;
    }

    dayEvs.forEach((e) => {
      const card = document.createElement('div');
      card.className =
        'p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2 shadow-xs';

      card.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-xs font-mono font-bold text-slate-500 shrink-0">${e.time || '--:--'}</span>
          <div class="truncate">
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">${escapeHtml(e.title)}</h4>
            <span class="text-[10px] text-slate-400 uppercase tracking-wider">${e.category}</span>
          </div>
        </div>
        <button type="button" data-delete-event="${e.id}" title="Delete event" class="text-slate-400 hover:text-red-500 p-1 rounded-md text-xs cursor-pointer">
          ✕
        </button>
      `;

      dayEventsList.appendChild(card);
    });
  }

  function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  }

  // Month navigation
  prevMonthBtn?.addEventListener('click', () => {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
    renderCalendar();
  });

  nextMonthBtn?.addEventListener('click', () => {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
    renderCalendar();
  });

  todayBtn?.addEventListener('click', () => {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    selectedDateKey = formatDateKey(today);
    renderCalendar();
  });

  // Add event
  addEventForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = (eventTitleInput?.value || '').trim();
    if (!title) return;

    const newEvent: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title,
      date: selectedDateKey,
      time: eventTimeInput?.value || '09:00',
      category: (eventCategorySelect?.value as CalendarEvent['category']) || 'work',
    };

    events.push(newEvent);
    saveEvents(events);
    if (eventTitleInput) eventTitleInput.value = '';
    renderCalendar();
  });

  // Delete event
  dayEventsList?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-delete-event]') as HTMLElement | null;
    if (!btn) return;
    const id = btn.getAttribute('data-delete-event');
    if (!id) return;
    events = events.filter((ev) => ev.id !== id);
    saveEvents(events);
    renderCalendar();
  });

  // Export .ics
  exportIcsBtn?.addEventListener('click', () => {
    const icsString = generateIcsCalendar(
      events.map((ev) => ({
        title: ev.title,
        date: ev.date,
        startTime: ev.time,
        description: `Category: ${ev.category}`,
      }))
    );
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-events-${new Date().toISOString().split('T')[0]}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  });

  renderCalendar();
});
