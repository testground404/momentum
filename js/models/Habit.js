/**
 * Habit Model Module
 * Contains logic for creating, normalizing, and managing habit data
 */

import {
  CURRENTYEAR,
  daysInYear,
  startOfYear,
  dayIndexForYear,
  toDateInputValue,
  sanitizeStartDateValue,
  defaultStartDateForYear,
  getHabitStartDate,
  getHabitStartIndex
} from '../utils/DateUtils.js';
import { uid } from '../utils/GeneralUtils.js';

/**
 * Default frequency configuration
 */
export function defaultFrequency() {
  return {
    type: 'daily',
    daysOfWeek: [],
    timesPerWeek: 3
  };
}

/**
 * Create a new habit with frequency
 */
export function newHabit(name, accent, value, startDateValue) {
  const year = CURRENTYEAR;
  const days = daysInYear(year);
  const startDate = sanitizeStartDateValue(startDateValue, year);
  const h = {
    id: uid(),
    name: String(name).trim() || 'New Habit',
    visualType: 'icon',
    visualValue: value || 'target',
    year: year,
    days: days,
    dots: new Array(days).fill(false),
    offDays: new Array(days).fill(false),
    notes: new Array(days).fill(''),
    accent: accent || '#3d85c6',
    startDate: startDate,
    createdAt: new Date().toISOString(),
    frequency: defaultFrequency()
  };
  applyFrequencyToHabit(h); // mark offs right away
  return h;
}

/**
 * Normalize habit data and ensure frequency
 */
export function normalizeHabit(h) {
  if (!h || typeof h !== 'object') return null;
  const id = h.id || uid();
  const name = h.name || 'Habit';
  const visualValue = (h.visualValue && typeof h.visualValue === 'string') ? h.visualValue : 'target';
  const year = h.year || CURRENTYEAR;
  const expected = daysInYear(year);
  const accent = (h.accent && typeof h.accent === 'string') ? h.accent : '#3d85c6';
  const dots = (Array.isArray(h.dots) && h.dots.length === expected) ? h.dots.map(Boolean) : new Array(expected).fill(false);
  const offDays = (Array.isArray(h.offDays) && h.offDays.length === expected) ? h.offDays.map(Boolean) : new Array(expected).fill(false);
  const notes = (Array.isArray(h.notes) && h.notes.length === expected) ? h.notes.map(v => typeof v === 'string' ? v : '') : new Array(expected).fill('');
  const frequency = (h.frequency && typeof h.frequency === 'object') ? h.frequency : defaultFrequency();

  // Preserve original startDate without clamping to year
  const startDate = h.startDate || h.createdAt || toDateInputValue(new Date(year, 0, 1));

  // Initialize historical data storage if not present
  const yearHistory = h.yearHistory || {};

  const habit = {
    id: id,
    name: String(name),
    visualType: 'icon',
    visualValue: visualValue,
    year: year,
    days: expected,
    dots: dots,
    offDays: offDays,
    notes: notes,
    accent: accent,
    startDate: startDate,
    createdAt: h.createdAt || new Date().toISOString(),
    frequency: frequency,
    yearHistory: yearHistory  // Stores {year: {dots, offDays, notes}}
  };

  // ensure offdays match frequency
  applyFrequencyToHabit(habit);

  return habit;
}

/**
 * When year rolls to new year, rebuild offDays from frequency
 */
export function rolloverIfNeeded(h) {
  // Initialize yearHistory if not present
  if (!h.yearHistory) h.yearHistory = {};

  if (h.year !== CURRENTYEAR) {
    // PRESERVE historical data before rolling over
    const oldYear = h.year;
    h.yearHistory[oldYear] = {
      dots: h.dots.slice(),      // Clone arrays
      offDays: h.offDays.slice(),
      notes: h.notes.slice()
    };

    // Now roll to current year
    h.year = CURRENTYEAR;
    h.days = daysInYear(CURRENTYEAR);
    h.dots = new Array(h.days).fill(false);
    h.offDays = new Array(h.days).fill(false);
    h.notes = new Array(h.days).fill('');
    if (!h.frequency) h.frequency = defaultFrequency();
    applyFrequencyToHabit(h);
  } else {
    // same year but maybe no frequency
    if (!h.frequency) h.frequency = defaultFrequency();
    if (!h.startDate) {
      h.startDate = defaultStartDateForYear(h.year);
    }
    applyFrequencyToHabit(h);
  }
  return h;
}

/**
 * Apply frequency rules to offDays
 */
export function applyFrequencyToHabit(habit) {
  const year = habit.year;
  const totalDays = habit.days;
  const freq = habit.frequency || defaultFrequency();

  const newOff = new Array(totalDays).fill(false);

  if (freq.type === 'daily') {
    // no extra offs
  } else if (freq.type === 'weekdays') {
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(year, 0, 1 + i);
      const day = d.getDay();
      if (day === 0 || day === 6) {
        newOff[i] = true;
      }
    }
  } else if (freq.type === 'daysOfWeek') {
    const set = new Set(freq.daysOfWeek || []);
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(year, 0, 1 + i);
      const day = d.getDay();
      if (!set.has(day)) {
        newOff[i] = true;
      }
    }
  } else if (freq.type === 'timesPerWeek') {
    const target = freq.timesPerWeek || 3;
    // simple heuristic: if target >=5, weekends off
    if (target >= 5) {
      for (let i = 0; i < totalDays; i++) {
        const d = new Date(year, 0, 1 + i);
        const day = d.getDay();
        if (day === 0 || day === 6) {
          newOff[i] = true;
        }
      }
    } else {
      // leave all days on; user can right-click to mark off
    }
  }

  // don't hide days the user already completed
  for (let j = 0; j < totalDays; j++) {
    if (habit.dots[j]) {
      newOff[j] = false;
    }
  }

  habit.offDays = newOff;
  // Mark stats as dirty since offDays changed
  habit._dirtyStats = true;
}

/**
 * Format frequency for display
 */
export function formatFrequency(freq) {
  if (!freq) return 'Daily';
  if (freq.type === 'daily') return 'Daily';
  if (freq.type === 'weekdays') return 'Weekdays';
  if (freq.type === 'daysOfWeek') {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const arr = (freq.daysOfWeek || []).map(i => names[i]);
    return arr.length ? arr.join(', ') : 'Specific days';
  }
  if (freq.type === 'timesPerWeek') return (freq.timesPerWeek || 3) + '×/week';
  return 'Daily';
}

/**
 * Calculate habit statistics
 */
export function calcStats(dots, offDays, dayIdx) {
  const total = dots.reduce((a, b) => a + (b ? 1 : 0), 0);
  let longest = 0, run = 0;
  for (let i = 0; i < dots.length; i++) {
    if (dots[i]) {
      run++;
    } else if (offDays[i]) {
      // skip
    } else {
      if (run > longest) longest = run;
      run = 0;
    }
  }
  if (run > longest) longest = run;

  let current = 0;
  for (let j = Math.min(dayIdx, dots.length - 1); j >= 0; j--) {
    if (dots[j]) {
      current++;
    } else if (offDays[j]) {
      // keep alive
    } else {
      break;
    }
  }
  return { total: total, longest: longest, current: current };
}

/**
 * Memoized stats calculator - only recalculates when data changes
 */
export function getHabitStats(habit) {
  // Return cached stats if dirty flag isn't set
  if (habit._statsCache && !habit._dirtyStats) {
    return habit._statsCache;
  }

  // Perform calculation
  const todayIdx = dayIndexForYear(habit.year);
  const stats = calcStats(habit.dots, habit.offDays, todayIdx);

  // Save to cache
  habit._statsCache = stats;
  habit._dirtyStats = false;
  return stats;
}

/**
 * Compute completion rate ignoring offdays
 */
export function getCompletionRate(habit, stats) {
  const todayIdx = dayIndexForYear(habit.year);
  const elapsed = (habit.year === CURRENTYEAR) ? (todayIdx + 1) : habit.days;
  const startIndex = getHabitStartIndex(habit);
  if (elapsed <= startIndex) return 0;
  let eligible = 0;
  let completed = 0;
  for (let i = startIndex; i < elapsed; i++) {
    if (!habit.offDays[i]) {
      eligible++;
      if (habit.dots[i]) completed++;
    }
  }
  if (eligible === 0) return 0;
  return Math.round((completed / eligible) * 100);
}

/**
 * Get completion rate for sorting
 */
export function completionSortValue(habit) {
  const stats = getHabitStats(habit);
  return getCompletionRate(habit, stats);
}
