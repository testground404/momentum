/**
 * Utility Functions Module
 * Common utility functions used across the application
 */

const Utils = (function() {
  'use strict';

  /**
   * Convert hex color to RGB string
   */
  function hexToRgb(hex) {
    try {
      var h = String(hex).trim();
      if (h.startsWith('#')) h = h.slice(1);
      if (h.length === 3) {
        h = h.split('').map(function (c) { return c + c; }).join('');
      }
      var num = parseInt(h, 16);
      return ((num >> 16) & 255) + ', ' + ((num >> 8) & 255) + ', ' + (num & 255);
    } catch (e) {
      return '59,130,246';
    }
  }

  /**
   * Convert hex color to RGB object
   */
  function hexToRgbObj(hex) {
    var m = hex.replace('#','');
    var int = parseInt(m, 16);
    return { r: (int>>16)&255, g: (int>>8)&255, b: int&255 };
  }

  /**
   * Calculate color channel value
   */
  function channel(v) {
    v = v/255;
    return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  }

  /**
   * Calculate luminance of a color
   */
  function luminance(hex) {
    var c = hexToRgbObj(hex);
    return 0.2126*channel(c.r) + 0.7152*channel(c.g) + 0.0722*channel(c.b);
  }

  /**
   * Calculate contrast between two colors
   */
  function contrast(a, b) {
    var L1 = luminance(a), L2 = luminance(b);
    var light = Math.max(L1, L2), dark = Math.min(L1, L2);
    return (light+0.05)/(dark+0.05);
  }

  /**
   * Mix two colors
   */
  function mix(h1, h2, t) {
    var c1 = hexToRgbObj(h1), c2 = hexToRgbObj(h2);
    var r = Math.round(c1.r + (c2.r - c1.r)*t);
    var g = Math.round(c1.g + (c2.g - c1.g)*t);
    var b = Math.round(c1.b + (c2.b - c1.b)*t);
    return '#' + [r, g, b].map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  }

  /**
   * Clamp color to ensure proper contrast in dark/light mode
   */
  function clampColorToMode(hex, isDark) {
    var bg = isDark ? '#18181b' : '#ffffff';
    var c = contrast(hex, bg);
    if (c >= 3) return hex;
    return isDark ? mix(hex, '#ffffff', 0.4) : mix(hex, '#000000', 0.4);
  }

  /**
   * Debounce function to limit rate of function calls
   */
  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(null, args);
      }, ms);
    }
  }

  /**
   * Generate unique ID
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Format date to DD-MM-YYYY
   */
  function formatDate(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Parse date from DD-MM-YYYY format
   */
  function parseDate(dateString) {
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  /**
   * Check if date is valid
   */
  function isValidDate(dateString) {
    const date = parseDate(dateString);
    return date !== null && !isNaN(date.getTime());
  }

  /**
   * Get days in month
   */
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Clone object deeply
   */
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Escape HTML special characters
   */
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  /**
   * Show custom confirmation modal
   * @param {string} title - Modal title
   * @param {string} message - Modal message
   * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
   */
  function showConfirm(title, message) {
    return new Promise(function(resolve) {
      const overlay = document.getElementById('confirm-modal-overlay');
      const titleEl = document.getElementById('confirm-modal-title');
      const messageEl = document.getElementById('confirm-modal-message');
      const confirmBtn = document.getElementById('confirm-modal-confirm');
      const cancelBtn = document.getElementById('confirm-modal-cancel');

      if (!overlay || !titleEl || !messageEl || !confirmBtn || !cancelBtn) {
        console.error('Confirm modal elements not found');
        resolve(false);
        return;
      }

      titleEl.textContent = title;
      messageEl.textContent = message;
      overlay.classList.add('active');

      function cleanup() {
        overlay.classList.add('hiding');
        setTimeout(function() {
          overlay.classList.remove('active', 'hiding');
          confirmBtn.removeEventListener('click', handleConfirm);
          cancelBtn.removeEventListener('click', handleCancel);
          overlay.removeEventListener('click', handleOverlayClick);
        }, 120); // 120ms exit animation
      }

      function handleConfirm() {
        cleanup();
        resolve(true);
      }

      function handleCancel() {
        cleanup();
        resolve(false);
      }

      function handleOverlayClick(e) {
        if (e.target === overlay) {
          cleanup();
          resolve(false);
        }
      }

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      overlay.addEventListener('click', handleOverlayClick);
    });
  }

  /**
   * Show custom alert modal
   * @param {string} title - Modal title
   * @param {string} message - Modal message
   * @returns {Promise<void>} - Resolves when OK is clicked
   */
  function showAlert(title, message) {
    return new Promise(function(resolve) {
      const overlay = document.getElementById('alert-modal-overlay');
      const titleEl = document.getElementById('alert-modal-title');
      const messageEl = document.getElementById('alert-modal-message');
      const okBtn = document.getElementById('alert-modal-ok');

      if (!overlay || !titleEl || !messageEl || !okBtn) {
        console.error('Alert modal elements not found');
        resolve();
        return;
      }

      titleEl.textContent = title;
      messageEl.textContent = message;
      overlay.classList.add('active');

      function cleanup() {
        overlay.classList.add('hiding');
        setTimeout(function() {
          overlay.classList.remove('active', 'hiding');
          okBtn.removeEventListener('click', handleOk);
          overlay.removeEventListener('click', handleOverlayClick);
        }, 120); // 120ms exit animation
      }

      function handleOk() {
        cleanup();
        resolve();
      }

      function handleOverlayClick(e) {
        if (e.target === overlay) {
          cleanup();
          resolve();
        }
      }

      okBtn.addEventListener('click', handleOk);
      overlay.addEventListener('click', handleOverlayClick);
    });
  }

  // Public API
  return {
    hexToRgb: hexToRgb,
    hexToRgbObj: hexToRgbObj,
    channel: channel,
    luminance: luminance,
    contrast: contrast,
    mix: mix,
    clampColorToMode: clampColorToMode,
    debounce: debounce,
    generateId: generateId,
    formatDate: formatDate,
    parseDate: parseDate,
    isValidDate: isValidDate,
    getDaysInMonth: getDaysInMonth,
    deepClone: deepClone,
    escapeHtml: escapeHtml,
    showConfirm: showConfirm,
    showAlert: showAlert
  };
})();

// Make Utils available globally
if (typeof window !== 'undefined') {
  window.Utils = Utils;
}
