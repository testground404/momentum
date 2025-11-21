/**
 * Date Utilities Module
 * Provides date manipulation and formatting functions
 *
 * IMPORTANT: All date calculations use UTC to avoid timezone-related bugs.
 * This ensures that January 1st is the same "day" for all users regardless
 * of their timezone. Display functions can use local time.
 */

const now = new Date();
export const CURRENTYEAR = now.getFullYear();

export function isLeap(y) {
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

export function daysInYear(y) {
  return isLeap(y) ? 366 : 365;
}

/**
 * Get start of year in UTC
 * Using UTC avoids timezone bugs where users in different timezones see different days
 */
export function startOfYear(y) {
  return new Date(Date.UTC(y, 0, 1));
}

/**
 * Get the current day index for a year (0-based)
 * Uses local date for "today" but UTC for calculations to avoid timezone shifts
 */
export function dayIndexForYear(y) {
  if (y !== CURRENTYEAR) return daysInYear(y) - 1;
  // Get today's local date components
  const localYear = now.getFullYear();
  const localMonth = now.getMonth();
  const localDay = now.getDate();
  // Create UTC date from local components to avoid timezone shift
  const todayUTC = new Date(Date.UTC(localYear, localMonth, localDay));
  return Math.floor((todayUTC - startOfYear(CURRENTYEAR)) / 86400000);
}

export function fmt(d) {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Convert Date object to ISO date string (YYYY-MM-DD)
 * Uses UTC components to avoid timezone shifts
 */
export function toDateInputValue(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

/**
 * Parse date string to Date object
 * Creates UTC dates to avoid timezone-related bugs
 */
export function parseDateValue(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parts = value.split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    const parsed = new Date(Date.UTC(y, m, d));
    return isNaN(parsed) ? null : parsed;
  }
  // For ISO strings, parse as UTC
  const dt = new Date(value);
  return isNaN(dt) ? null : dt;
}

/**
 * Clamp date to year boundaries
 * Uses UTC to avoid timezone shifts
 */
export function clampDateToYearBounds(date, year) {
  const safeYear = year || CURRENTYEAR;
  if (!(date instanceof Date) || isNaN(date)) return new Date(Date.UTC(safeYear, 0, 1));
  const dateYear = date.getUTCFullYear();
  if (dateYear < safeYear) return new Date(Date.UTC(safeYear, 0, 1));
  if (dateYear > safeYear) return new Date(Date.UTC(safeYear, 11, 31));
  return new Date(Date.UTC(safeYear, date.getUTCMonth(), date.getUTCDate()));
}

export function sanitizeStartDateValue(value, year) {
  const parsed = parseDateValue(value);
  const clamped = clampDateToYearBounds(parsed || new Date(), year);
  return toDateInputValue(clamped);
}

export function defaultStartDateForYear(year) {
  return sanitizeStartDateValue(toDateInputValue(new Date()), year);
}

/**
 * Get habit's start date as Date object
 * Uses UTC to avoid timezone bugs
 */
export function getHabitStartDate(habit) {
  if (!habit) return null;
  const raw = habit.startDate || habit.createdAt;
  const parsed = parseDateValue(raw);

  if (!parsed || isNaN(parsed)) {
    const creationYear = habit.createdAt ? new Date(habit.createdAt).getUTCFullYear() : CURRENTYEAR;
    return new Date(Date.UTC(creationYear, 0, 1));
  }

  return parsed;
}

/**
 * Get the starting day index for a habit in a given year
 * Uses UTC for calculations to avoid timezone bugs
 */
export function getHabitStartIndex(habit) {
  if (!habit) return 0;
  const viewYear = habit.year || CURRENTYEAR;
  const trueStartDate = getHabitStartDate(habit);
  if (!trueStartDate) return 0;
  const startYear = trueStartDate.getUTCFullYear();

  // Case 1: Habit starts in future year (viewing past years)
  if (startYear > viewYear) {
    return daysInYear(viewYear);
  }

  // Case 2: Habit started in previous year (all dots available)
  if (startYear < viewYear) {
    return 0;
  }

  // Case 3: Same year - calculate specific day
  const idx = Math.floor((trueStartDate - startOfYear(viewYear)) / 86400000);
  return Math.max(0, idx);
}

export function formatStartDateLabel(habit) {
  const d = getHabitStartDate(habit);
  if (!d) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Convert Date to display format (DD-MM-YYYY)
 * Uses UTC to avoid timezone shifts
 */
export function toDisplayDateValue(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return dd + '-' + mm + '-' + yyyy;
}

/**
 * Parse display format (DD-MM-YYYY) to Date object
 * Creates UTC dates to avoid timezone bugs
 */
export function parseDisplayDateValue(value, fallbackYear) {
  if (!value) return null;
  const parts = value.trim().split(/[-/]/);
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  let year = Number(parts[2]);
  if (!year || String(year).length !== 4) year = fallbackYear || CURRENTYEAR;
  if (!day || !isFinite(day) || !month || !isFinite(month)) return null;
  const parsed = new Date(Date.UTC(year, month, day));
  // Validate using UTC methods
  if (isNaN(parsed) || parsed.getUTCDate() !== day || parsed.getUTCMonth() !== month) return null;
  return parsed;
}

export function convertDisplayToISO(value, year) {
  const parsed = parseDisplayDateValue(value, year) || new Date(Date.UTC(year || CURRENTYEAR, 0, 1));
  const clamped = clampDateToYearBounds(parsed, year);
  return toDateInputValue(clamped);
}

export function convertDisplayToISOUnclamped(value, fallbackYear) {
  const parsed = parseDisplayDateValue(value, fallbackYear);
  if (!parsed || isNaN(parsed)) {
    return toDateInputValue(new Date(Date.UTC(fallbackYear || CURRENTYEAR, 0, 1)));
  }
  return toDateInputValue(parsed);
}

export function isoToDisplay(value, year) {
  const parsed = parseDateValue(value) || new Date(Date.UTC(year || CURRENTYEAR, 0, 1));
  const clamped = clampDateToYearBounds(parsed, year || CURRENTYEAR);
  return toDisplayDateValue(clamped);
}

export function isoToDisplayUnclamped(value, fallbackYear) {
  const parsed = parseDateValue(value);
  if (!parsed || isNaN(parsed)) {
    return toDisplayDateValue(new Date(Date.UTC(fallbackYear || CURRENTYEAR, 0, 1)));
  }
  return toDisplayDateValue(parsed);
}
