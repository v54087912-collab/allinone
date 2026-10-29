/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Productivity & Time Management Utility Functions
 */

export interface TimeSlot {
  hours: number;
  minutes: number;
  label: string; // e.g. "09:00 AM"
}

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateKey: string; // YYYY-MM-DD
}

export interface TimezoneInfo {
  id: string;
  name: string;
  city: string;
  offsetMinutes: number; // Offset from UTC in minutes
}

export interface ProsConsItem {
  id: string;
  text: string;
  weight: number; // 1 to 5
}

/**
 * Generate a 42-cell calendar grid for any given month/year (6 rows x 7 days)
 */
export function generateCalendarGrid(year: number, monthZeroBased: number): CalendarDay[] {
  const firstDayOfMonth = new Date(year, monthZeroBased, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, monthZeroBased + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthZeroBased, 0).getDate();

  const today = new Date();
  const todayKey = formatDateKey(today);

  const grid: CalendarDay[] = [];

  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const date = new Date(year, monthZeroBased - 1, dayNum);
    grid.push({
      date,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: formatDateKey(date) === todayKey,
      dateKey: formatDateKey(date),
    });
  }

  // Current month days
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const date = new Date(year, monthZeroBased, dayNum);
    grid.push({
      date,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isToday: formatDateKey(date) === todayKey,
      dateKey: formatDateKey(date),
    });
  }

  // Next month leading days to complete 42 or 35 cells
  const remainingCells = (grid.length <= 35 ? 35 : 42) - grid.length;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const date = new Date(year, monthZeroBased + 1, dayNum);
    grid.push({
      date,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: formatDateKey(date) === todayKey,
      dateKey: formatDateKey(date),
    });
  }

  return grid;
}

/**
 * Formats a Date object as YYYY-MM-DD in local time
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
export function formatSecondsToTimer(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format 24h HH:MM string to 12h AM/PM string
 */
export function formatTime12H(time24: string): string {
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let hrs = parseInt(parts[0], 10);
  const mins = parts[1];
  if (isNaN(hrs)) return time24;
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12;
  if (hrs === 0) hrs = 12;
  return `${hrs}:${mins} ${ampm}`;
}

/**
 * Parses time string "HH:MM" into minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
  return parts[0] * 60 + parts[1];
}

/**
 * Converts minutes from midnight into "HH:MM" 24h format
 */
export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Converts a time between timezones given standard offset difference in minutes
 */
export function convertMeetingTime(
  sourceTime24: string,
  sourceOffsetMinutes: number,
  targetOffsetMinutes: number
): { targetTime24: string; targetTime12: string; dayShift: number } {
  const sourceMins = timeToMinutes(sourceTime24);
  const diffMinutes = targetOffsetMinutes - sourceOffsetMinutes;
  const targetTotalMins = sourceMins + diffMinutes;

  let dayShift = 0;
  if (targetTotalMins >= 1440) {
    dayShift = Math.floor(targetTotalMins / 1440);
  } else if (targetTotalMins < 0) {
    dayShift = Math.floor(targetTotalMins / 1440);
  }

  const normalizedMins = ((targetTotalMins % 1440) + 1440) % 1440;
  const targetTime24 = minutesToTime(normalizedMins);
  const targetTime12 = formatTime12H(targetTime24);

  return { targetTime24, targetTime12, dayShift };
}

/**
 * Identifies if an hour is within normal working hours (9 AM - 5 PM), extended (8 AM - 8 PM), or sleeping (night)
 */
export function getHourComfortStatus(hour: number): 'work' | 'extended' | 'night' {
  if (hour >= 9 && hour < 17) return 'work';
  if (hour >= 8 && hour < 21) return 'extended';
  return 'night';
}

/**
 * Pick a random item from an array with optional exclusion
 */
export function pickRandomItem<T>(items: T[], excludeIndex?: number): { item: T; index: number } | null {
  if (!items || items.length === 0) return null;
  if (items.length === 1) return { item: items[0], index: 0 };

  const eligibleIndices: number[] = [];
  for (let i = 0; i < items.length; i++) {
    if (excludeIndex === undefined || i !== excludeIndex) {
      eligibleIndices.push(i);
    }
  }

  const chosenIndex = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
  return { item: items[chosenIndex], index: chosenIndex };
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Calculate Pros & Cons Weighted Score
 */
export function calculateProsConsScore(pros: ProsConsItem[], cons: ProsConsItem[]): {
  prosTotal: number;
  consTotal: number;
  netScore: number;
  recommendation: 'strong_yes' | 'lean_yes' | 'neutral' | 'lean_no' | 'strong_no';
} {
  const prosTotal = pros.reduce((acc, item) => acc + (Math.max(1, Math.min(5, item.weight || 1))), 0);
  const consTotal = cons.reduce((acc, item) => acc + (Math.max(1, Math.min(5, item.weight || 1))), 0);
  const netScore = prosTotal - consTotal;

  let recommendation: 'strong_yes' | 'lean_yes' | 'neutral' | 'lean_no' | 'strong_no';
  if (netScore >= 5) recommendation = 'strong_yes';
  else if (netScore > 0) recommendation = 'lean_yes';
  else if (netScore === 0) recommendation = 'neutral';
  else if (netScore >= -4) recommendation = 'lean_no';
  else recommendation = 'strong_no';

  return { prosTotal, consTotal, netScore, recommendation };
}

/**
 * Calculates habit streak statistics given an array of completed date keys (YYYY-MM-DD)
 */
export function calculateHabitStreaks(completedDateKeys: string[]): {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
} {
  if (!completedDateKeys || completedDateKeys.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalCompletions: 0 };
  }

  const uniqueSorted = Array.from(new Set(completedDateKeys)).sort();
  const totalCompletions = uniqueSorted.length;

  let longest = 0;
  let currentRunning = 0;

  // Calculate longest streak
  for (let i = 0; i < uniqueSorted.length; i++) {
    if (i === 0) {
      currentRunning = 1;
    } else {
      const prevDate = new Date(uniqueSorted[i - 1]);
      const currDate = new Date(uniqueSorted[i]);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentRunning++;
      } else if (diffDays > 1) {
        currentRunning = 1;
      }
    }
    if (currentRunning > longest) {
      longest = currentRunning;
    }
  }

  // Calculate current streak counting back from today or yesterday
  const today = new Date();
  const todayKey = formatDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  let currentStreak = 0;
  const dateSet = new Set(uniqueSorted);

  let checkDate = new Date(today);
  if (!dateSet.has(todayKey)) {
    if (dateSet.has(yesterdayKey)) {
      checkDate = yesterday;
    } else {
      return { currentStreak: 0, longestStreak: longest, totalCompletions };
    }
  }

  while (dateSet.has(formatDateKey(checkDate))) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return {
    currentStreak,
    longestStreak: Math.max(longest, currentStreak),
    totalCompletions,
  };
}

/**
 * Generate standard iCalendar (.ics) string for events
 */
export function generateIcsCalendar(
  events: Array<{
    title: string;
    description?: string;
    date: string; // YYYY-MM-DD
    startTime?: string; // HH:MM
    endTime?: string; // HH:MM
  }>
): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Toolora//Productivity Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((ev, idx) => {
    const cleanDate = ev.date.replace(/-/g, '');
    let dtStart = cleanDate;
    let dtEnd = cleanDate;

    if (ev.startTime) {
      const cleanTime = ev.startTime.replace(/:/g, '') + '00';
      dtStart = `${cleanDate}T${cleanTime}`;
      if (ev.endTime) {
        const cleanEndTime = ev.endTime.replace(/:/g, '') + '00';
        dtEnd = `${cleanDate}T${cleanEndTime}`;
      } else {
        dtEnd = `${cleanDate}T${cleanTime}`;
      }
    }

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:event-${idx}-${Date.now()}@toolora.local`);
    lines.push(`DTSTAMP:${cleanDate}T000000Z`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcsText(ev.title)}`);
    if (ev.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    }
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/**
 * Browser Web Audio API synthesizer for offline timers and alarms
 */
export function playSyntheticAudioTone(
  type: 'pomodoro_complete' | 'alarm_ring' | 'spinner_tick' | 'success_fanfare'
): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'spinner_tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
      return;
    }

    if (type === 'pomodoro_complete') {
      // Gentle chime: E5, G#5, B5, E6
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.6);
      });
      return;
    }

    if (type === 'alarm_ring') {
      // Energetic digital alarm beep sequence
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime + i * 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 0.1);
      }
      return;
    }

    if (type === 'success_fanfare') {
      // Celebratory arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.5);
      });
    }
  } catch {
    // AudioContext blocked by browser policy or unsupported; fail silently
  }
}

/**
 * Trigger celebratory confetti animation on canvas
 */
export function fireCanvasConfetti(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4'];
  const particles: Array<{
    x: number;
    y: number;
    r: number;
    d: number;
    color: string;
    tilt: number;
    tiltAngle: number;
    tiltAngleIncrement: number;
  }> = [];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 8 + 4,
      d: Math.random() * 80 + 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngle: 0,
      tiltAngleIncrement: Math.random() * 0.08 + 0.04,
    });
  }

  let animationFrameId: number;
  let elapsed = 0;

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    elapsed++;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.tiltAngle += p.tiltAngleIncrement;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) * 1.5;
      p.tilt = Math.sin(p.tiltAngle) * 15;

      ctx.beginPath();
      ctx.lineWidth = p.r / 2;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
      ctx.stroke();
    }

    if (elapsed < 180) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrameId);
    }
  }

  render();
}
