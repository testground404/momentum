/**
 * Color Utilities Module
 * Provides color manipulation and conversion functions
 */

export function hexToRgb(hex) {
  try {
    let h = String(hex).trim();
    if (h.startsWith('#')) h = h.slice(1);
    if (h.length === 3) {
      h = h.split('').map(c => c + c).join('');
    }
    const num = parseInt(h, 16);
    return ((num >> 16) & 255) + ', ' + ((num >> 8) & 255) + ', ' + (num & 255);
  } catch (e) {
    return '59,130,246';
  }
}

export function hexToRgbObj(hex) {
  const m = hex.replace('#', '');
  const int = parseInt(m, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function channel(v) {
  v = v / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function luminance(hex) {
  const c = hexToRgbObj(hex);
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

export function contrast(a, b) {
  const L1 = luminance(a);
  const L2 = luminance(b);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

export function mix(h1, h2, t) {
  const c1 = hexToRgbObj(h1);
  const c2 = hexToRgbObj(h2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function clampColorToMode(hex, isDark) {
  const bg = isDark ? '#18181b' : '#ffffff';
  const c = contrast(hex, bg);
  if (c >= 3) return hex;
  return isDark ? mix(hex, '#ffffff', 0.4) : mix(hex, '#000000', 0.4);
}
