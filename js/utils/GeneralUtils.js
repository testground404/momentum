/**
 * General Utilities Module
 * Provides common utility functions
 */

export function debounce(fn, ms) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => {
      fn.apply(null, args);
    }, ms);
  };
}

export function uid() {
  return "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
