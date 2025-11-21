/**
 * Date Utilities Module
 * Provides date manipulation and formatting functions
 */

const now = new Date();
export const CURRENTYEAR = now.getFullYear();

export function isLeap(y) {
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

export function daysInYear(y) {
  return isLeap(y) ? 366 : 365;
}

export function startOfYear(y) {
  return new Date(y, 0, 1);
}

export function dayIndexForYear(y) {
  if (y !== CURRENTYEAR) return daysInYear(y) - 1;
  const todayNoTime = new Date(CURRENTYEAR, now.getMonth(), now.getDate());
  return Math.floor((todayNoTime - startOfYear(CURRENTYEAR)) / 86400000);
}

export function fmt(d) {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function toDateInputValue(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

export function parseDateValue(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parts = value.split('-');
    const parsed = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(parsed) ? null : parsed;
  }
  const dt = new Date(value);
  return isNaN(dt) ? null : dt;
}

export function clampDateToYearBounds(date, year) {
  const safeYear = year || CURRENTYEAR;
  if (!(date instanceof Date) || isNaN(date)) return new Date(safeYear, 0, 1);
  if (date.getFullYear() < safeYear) return new Date(safeYear, 0, 1);
  if (date.getFullYear() > safeYear) return new Date(safeYear, 11, 31);
  return new Date(safeYear, date.getMonth(), date.getDate());
}

export function sanitizeStartDateValue(value, year) {
  const parsed = parseDateValue(value);
  const clamped = clampDateToYearBounds(parsed || new Date(), year);
  return toDateInputValue(clamped);
}

export function defaultStartDateForYear(year) {
  return sanitizeStartDateValue(toDateInputValue(new Date()), year);
}

export function getHabitStartDate(habit) {
  if (!habit) return null;
  const raw = habit.startDate || habit.createdAt;
  const parsed = parseDateValue(raw);

  if (!parsed || isNaN(parsed)) {
    const creationYear = habit.createdAt ? new Date(habit.createdAt).getFullYear() : CURRENTYEAR;
    return new Date(creationYear, 0, 1);
  }

  return parsed;
}

export function getHabitStartIndex(habit) {
  if (!habit) return 0;
  const viewYear = habit.year || CURRENTYEAR;
  const trueStartDate = getHabitStartDate(habit);
  if (!trueStartDate) return 0;
  const startYear = trueStartDate.getFullYear();

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

export function toDisplayDateValue(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return dd + '-' + mm + '-' + yyyy;
}

export function parseDisplayDateValue(value, fallbackYear) {
  if (!value) return null;
  const parts = value.trim().split(/[-/]/);
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  let year = Number(parts[2]);
  if (!year || String(year).length !== 4) year = fallbackYear || CURRENTYEAR;
  if (!day || !isFinite(day) || !month || !isFinite(month)) return null;
  const parsed = new Date(year, month, day);
  if (isNaN(parsed) || parsed.getDate() !== day || parsed.getMonth() !== month) return null;
  return parsed;
}

export function convertDisplayToISO(value, year) {
  const parsed = parseDisplayDateValue(value, year) || new Date(year || CURRENTYEAR, 0, 1);
  const clamped = clampDateToYearBounds(parsed, year);
  return toDateInputValue(clamped);
}

export function convertDisplayToISOUnclamped(value, fallbackYear) {
  const parsed = parseDisplayDateValue(value, fallbackYear);
  if (!parsed || isNaN(parsed)) {
    return toDateInputValue(new Date(fallbackYear || CURRENTYEAR, 0, 1));
  }
  return toDateInputValue(parsed);
}

export function isoToDisplay(value, year) {
  const parsed = parseDateValue(value) || new Date(year || CURRENTYEAR, 0, 1);
  const clamped = clampDateToYearBounds(parsed, year || CURRENTYEAR);
  return toDisplayDateValue(clamped);
}

export function isoToDisplayUnclamped(value, fallbackYear) {
  const parsed = parseDateValue(value);
  if (!parsed || isNaN(parsed)) {
    return toDisplayDateValue(new Date(fallbackYear || CURRENTYEAR, 0, 1));
  }
  return toDisplayDateValue(parsed);
}
