/**
 * Modal Utilities Module
 * Provides custom confirmation and alert modal functionality
 */

/**
 * Show custom confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
export function showConfirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirm-modal-overlay');
    const titleEl = document.getElementById('confirm-modal-title');
    const messageEl = document.getElementById('confirm-modal-message');
    const confirmBtn = document.getElementById('confirm-modal-confirm');
    const cancelBtn = document.getElementById('confirm-modal-cancel');

    if (!overlay || !titleEl || !messageEl || !confirmBtn || !cancelBtn) {
      resolve(false);
      return;
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    overlay.classList.add('active');

    function cleanup() {
      overlay.classList.add('hiding');
      setTimeout(() => {
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
export function showAlert(title, message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('alert-modal-overlay');
    const titleEl = document.getElementById('alert-modal-title');
    const messageEl = document.getElementById('alert-modal-message');
    const okBtn = document.getElementById('alert-modal-ok');

    if (!overlay || !titleEl || !messageEl || !okBtn) {
      resolve();
      return;
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    overlay.classList.add('active');

    function cleanup() {
      overlay.classList.add('hiding');
      setTimeout(() => {
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
