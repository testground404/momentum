import { hexToRgb, hexToRgbObj, luminance, contrast, mix, clampColorToMode } from './js/utils/ColorUtils.js';
import {
  CURRENTYEAR,
  daysInYear,
  isLeap,
  startOfYear,
  dayIndexForYear,
  fmt,
  toDateInputValue,
  parseDateValue,
  clampDateToYearBounds,
  sanitizeStartDateValue,
  defaultStartDateForYear,
  getHabitStartDate,
  getHabitStartIndex,
  formatStartDateLabel,
  toDisplayDateValue,
  parseDisplayDateValue,
  convertDisplayToISO,
  convertDisplayToISOUnclamped,
  isoToDisplay,
  isoToDisplayUnclamped
} from './js/utils/DateUtils.js';
import { debounce, uid } from './js/utils/GeneralUtils.js';
import { showConfirm, showAlert } from './js/utils/ModalUtils.js';
import { YearWheel } from './js/year-wheel.js';
import {
  defaultFrequency,
  newHabit,
  normalizeHabit,
  rolloverIfNeeded,
  applyFrequencyToHabit,
  formatFrequency,
  calcStats,
  getHabitStats,
  getCompletionRate,
  completionSortValue
} from './js/models/Habit.js';
import {
  register as authRegister,
  login as authLogin,
  loginGoogle,
  isAuthenticated,
  getCurrentUser,
  getCurrentUserEmail,
  logout as authLogout,
  deleteAccount,
  onAuthStateChanged,
  useFirebase as authUseFirebase
} from './js/services/Auth.js';
import {
  saveHabits as storageSaveHabits,
  loadHabits as storageLoadHabits,
  saveSettings,
  loadSettings,
  clearUserData,
  exportData,
  importData,
  useFirebase as storageUseFirebase
} from './js/services/Storage.js';

// Create global Auth and Storage objects for backward compatibility with inline scripts
const Auth = {
  register: authRegister,
  login: authLogin,
  loginGoogle,
  isAuthenticated,
  getCurrentUser,
  getCurrentUserEmail,
  logout: authLogout,
  deleteAccount,
  onAuthStateChanged,
  useFirebase: authUseFirebase
};

const Storage = {
  saveHabits: storageSaveHabits,
  loadHabits: storageLoadHabits,
  saveSettings,
  loadSettings,
  clearUserData,
  exportData,
  importData,
  useFirebase: storageUseFirebase
};

// Expose to window for inline scripts in HTML
window.Auth = Auth;
window.Storage = Storage;

    /* ────────── Picker State ────────── */
    var ipEls = {
      modal: document.getElementById('picker-modal'),
      overlay: document.getElementById('picker-overlay'),
      search: document.getElementById('ip-search'),
      cats: document.getElementById('ip-cats'),
      colors: document.getElementById('ip-colors'),
      icons: document.getElementById('ip-icons'),
      empty: document.getElementById('ip-empty'),
      select: document.getElementById('ip-select'),
      cancel: document.getElementById('ip-cancel'),
      close: document.getElementById('ip-closeBtn'),
      density: document.getElementById('ip-densityBtn'),
      colorPreview: document.getElementById('ip-colorPreview'),
      customColor: document.getElementById('ip-customColor'),
      scroll: document.getElementById('ip-scroll')
    };

    var ipState = {
      allIcons: [],
      filteredIcons: [],
      selectedIcon: null,
      selectedColor: '#1e293b',
      searchQuery: '',
      selectedCategory: 'All',
      gridDensity: 'comfortable',
      resolver: null,
      observer: null,
      renderOffset: 0,
      renderBatch: 90
    };

    var ipPalette = ['#1e293b','#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6','#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e'];

    var SORT_OPTIONS = [
      { value: 'created-newest', description: 'Newest first' },
      { value: 'created-oldest', description: 'Oldest first' },
      { value: 'name-az', description: 'Name A → Z' },
      { value: 'name-za', description: 'Name Z → A' },
      { value: 'rate-high-low', description: 'Highest completion' },
      { value: 'rate-low-high', description: 'Lowest completion' }
    ];

    function updatePickerThemeConsistency() {
      if (!ipState.selectedColor) return;
      var safe = clampColorToMode(ipState.selectedColor, document.documentElement.classList.contains('dark'));
      ipState.selectedColor = safe;
      document.documentElement.style.setProperty('--icon-selected', safe);
      document.documentElement.style.setProperty(
        '--icon-selected-bg',
        document.documentElement.classList.contains('dark') ? 'rgba(228,228,231,.08)' : 'rgba(30,41,59,.12)'
      );
      if (ipEls.colorPreview) ipEls.colorPreview.style.backgroundColor = safe;
      if (ipEls.customColor) ipEls.customColor.value = safe;
    }

    /* ────────── Theme ────────── */
    var themeToggle = document.getElementById('theme-toggle');
    var THEMEKEY = 'themepreference';
    function getInitialTheme() {
      var stored = localStorage.getItem(THEMEKEY);
      if (stored) return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function applyTheme(theme) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      if (themeToggle) {
        themeToggle.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
        themeToggle.setAttribute('title', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
      }
      localStorage.setItem(THEMEKEY, theme);
      updatePickerThemeConsistency();
    }
    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        var next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(next);
      });
    }
    applyTheme(getInitialTheme());

    /* ────────── View Controls ────────── */
    var viewToggle = document.getElementById('view-toggle');
    var VIEWKEY = 'viewpreference';
    function getInitialView() {
      return localStorage.getItem(VIEWKEY) || 'year';
    }
    var EASEIO = getComputedStyle(document.documentElement).getPropertyValue('--ease-io').trim() || 'cubic-bezier(0.4,0,0.2,1)';

    /* ────────── Width Controls ────────── */
    var widthToggle = document.getElementById('width-toggle');
    var WIDTHKEY = 'cardwidthpreference';
    function getInitialWidth() {
      return localStorage.getItem(WIDTHKEY) || 'normal';
    }
    function applyCardWidth(width) {
      if (width === 'wide') {
        document.documentElement.setAttribute('data-card-width', 'wide');
        if (widthToggle) {
          widthToggle.setAttribute('aria-label', 'Toggle to normal width');
          widthToggle.setAttribute('title', 'Toggle to normal width');
        }
      } else {
        document.documentElement.removeAttribute('data-card-width');
        if (widthToggle) {
          widthToggle.setAttribute('aria-label', 'Toggle to wide width');
          widthToggle.setAttribute('title', 'Toggle to wide width');
        }
      }
      localStorage.setItem(WIDTHKEY, width);

      // Log header, card, and skeleton widths after DOM update
      requestAnimationFrame(function() {
        var header = document.querySelector('.app-header');
        var cards = document.querySelectorAll('.card');
        var skeletonCards = document.querySelectorAll('.skeleton-card');
        var skeletonList = document.querySelector('.skeleton-list');
        var rootStyles = window.getComputedStyle(document.documentElement);
      });
    }
    if (widthToggle) {
      widthToggle.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-card-width') === 'wide' ? 'wide' : 'normal';
        var next = current === 'wide' ? 'normal' : 'wide';
        applyCardWidth(next);
      });
    }
    applyCardWidth(getInitialWidth());

    /* ────────── Storage Model ────────── */
    var STORAGEKEY = 'habits';
    var habitCache = {
      data: null,
      timestamp: 0,
      TTL: 5 * 60 * 1000 // 5 minutes
    };

    async function loadHabits(force = false) {
      const now = Date.now();
      if (!force && habitCache.data && (now - habitCache.timestamp < habitCache.TTL)) {
        return habitCache.data;
      }

      try {
        var arr = await Storage.loadHabits();
        if (!Array.isArray(arr)) {
          habitCache.data = [];
        } else {
          habitCache.data = arr.map(normalizeHabit).filter(Boolean);
        }
        habitCache.timestamp = now;
        return habitCache.data;
      } catch (e) {
        return [];
      }
    }
    var saveQueued = false;
    var saveTimeout = null;
    var lastSavedHabitsJSON = null;

    async function saveHabits(habits, immediate = false){
      // Invalidate cache when habits change
      invalidateVisibleHabitsCache();

      // Clear any pending save
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }

      // Check if habits actually changed
      const currentJSON = JSON.stringify(habits);
      if (currentJSON === lastSavedHabitsJSON) {
        return; // No changes, skip save
      }

      // Debounce: wait 500ms before saving (unless immediate)
      if (!immediate && !saveQueued) {
        saveTimeout = setTimeout(() => {
          saveHabits(habits, true);
        }, 500);
        return;
      }

      if (saveQueued) return;
      saveQueued = true;

      try {
        await Storage.saveHabits(habits);
        lastSavedHabitsJSON = currentJSON;
      } catch (e){
      } finally {
        saveQueued = false;
      }
    }
    var HABITS = [];

    /* measure layer */
    var measureLayer = document.createElement('div');
    measureLayer.id = 'measure-layer';
    measureLayer.style.position = 'fixed';
    measureLayer.style.inset = '0';
    measureLayer.style.visibility = 'hidden';
    measureLayer.style.pointerEvents = 'none';
    measureLayer.style.zIndex = '-1';
    document.body.appendChild(measureLayer);

    var listEl = document.getElementById('list');
    var skeletonEl = document.getElementById('skeleton-list');
    var emptyEl = document.getElementById('empty');
    var searchEmptyEl = document.getElementById('search-empty');
    var yearBanner = document.getElementById('year-banner');
    var searchInput = document.getElementById('habit-search');
    var searchFieldWrap = document.getElementById('search-field');
    var navSearchToggle = document.getElementById('nav-search-toggle');
    var sortSelect = document.getElementById('habit-sort');
    var sortDisplay = document.getElementById('habit-sort-display');
    var sortToggleBtn = document.getElementById('sort-toggle');
    var sortModal = document.getElementById('sort-modal');
    var sortOptionsEl = document.getElementById('sort-options');
    var mobileToolbarMedia = window.matchMedia('(max-width: 750px)');
    var accountToggleBtn = document.getElementById('account-toggle');
    var accountModal = document.getElementById('account-modal');
    var accountThemeToggleBtn = document.getElementById('account-theme-toggle');
    var accountLogoutBtn = document.getElementById('account-logout');
    var accountDeleteBtn = document.getElementById('account-delete');
    var accountMenuWrap = document.querySelector('.account-menu');
    var accountMenuBtn = document.getElementById('account-menu-btn');
    var accountMenuDropdown = document.getElementById('account-menu');
    var navViewToggle = document.getElementById('nav-view-toggle');
    var navAddBtn = document.getElementById('nav-add');

    var habitViewState = {
      searchQuery: searchInput ? searchInput.value.trim() : '',
      sortKey: sortSelect ? sortSelect.value : 'created-newest'
    };

    if (searchInput) {
      var handleSearchInput = debounce(function (value) {
        var next = value.trim();
        if (next === habitViewState.searchQuery) return;
        habitViewState.searchQuery = next;
        render();
      }, 180);
      searchInput.addEventListener('input', function (e) {
        handleSearchInput(e.target.value || '');
      });
      searchInput.addEventListener('focus', function () {
        if (mobileToolbarMedia.matches) {
          expandMobileSearch(false);
        }
      });
      searchInput.addEventListener('blur', function () {
        if (mobileToolbarMedia.matches) {
          collapseMobileSearchIfNeeded(false);
        }
      });
    }

    function toggleMobileSearchVisibility() {
      if (!mobileToolbarMedia.matches) {
        if (searchInput) searchInput.focus();
        return;
      }
      if (document.body.classList.contains('search-expanded')) {
        collapseMobileSearchIfNeeded(true, true);
      } else {
        expandMobileSearch(false);
      }
    }

    if (navSearchToggle) {
      navSearchToggle.setAttribute('aria-expanded', 'false');
      navSearchToggle.addEventListener('click', toggleMobileSearchVisibility);
    }

    if (navViewToggle) {
      navViewToggle.addEventListener('click', function () {
        if (viewToggle) viewToggle.click();
      });
    }

    if (navAddBtn) {
      navAddBtn.addEventListener('click', function () {
        var addBtn = document.getElementById('btn-new');
        if (addBtn) addBtn.click();
      });
    }

    if (sortToggleBtn) {
      sortToggleBtn.addEventListener('click', function () {
        if (mobileToolbarMedia.matches) {
          openSortModal();
        } else if (sortDisplay) {
          sortDisplay.focus();
        } else if (sortSelect) {
          sortSelect.focus();
        }
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', function (e) {
        setSortValue(e.target.value || 'created-newest', true);
      });
    }

    if (sortOptionsEl) {
      sortOptionsEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.sort-option-btn');
        if (!btn) return;
        setSortValue(btn.dataset.value);
        closeSortModal();
      });
    }

    function updateNavSearchState(expanded) {
      if (!navSearchToggle) return;
      navSearchToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      navSearchToggle.classList.toggle('is-active', expanded && mobileToolbarMedia.matches);
    }

    function updateViewToggleLabels(currentView) {
      var next = currentView === 'year' ? 'month' : 'year';
      if (viewToggle) {
        viewToggle.setAttribute('aria-label', 'Switch to ' + next + ' view');
        viewToggle.setAttribute('title', 'Switch to ' + next + ' view');
      }
      if (navViewToggle) {
        navViewToggle.setAttribute('aria-label', 'Switch to ' + next + ' view');
        navViewToggle.setAttribute('title', 'Switch to ' + next + ' view');
      }
    }

    function expandMobileSearch(shouldFocus) {
      if (!searchFieldWrap) return;
      document.body.classList.add('search-expanded');
      updateNavSearchState(true);
      if (shouldFocus && searchInput) {
        setTimeout(function () {
          searchInput.focus();
        }, 150);
      }
    }

    function collapseMobileSearchIfNeeded(force, blurInput) {
      if (!searchFieldWrap) return;
      if (!force && !mobileToolbarMedia.matches) return;
      var hasValue = searchInput && searchInput.value.trim().length;
      if (!force && hasValue) return;
      if (blurInput && searchInput) {
        searchInput.blur();
      }
      document.body.classList.remove('search-expanded');
      updateNavSearchState(false);
    }

    function handleSearchMediaChange(e) {
      if (sortModal && !e.matches) {
        closeSortModal();
      }
      if (!searchFieldWrap) return;
      if (!e.matches) {
        document.body.classList.add('search-expanded');
        updateNavSearchState(false);
      } else {
        document.body.classList.remove('search-expanded');
        updateNavSearchState(false);
      }
    }

    if (mobileToolbarMedia.addEventListener) {
      mobileToolbarMedia.addEventListener('change', handleSearchMediaChange);
    } else if (mobileToolbarMedia.addListener) {
      mobileToolbarMedia.addListener(handleSearchMediaChange);
    }
    handleSearchMediaChange(mobileToolbarMedia);

    function renderSortOptions() {
      if (!sortOptionsEl) return;
      sortOptionsEl.innerHTML = '';
      SORT_OPTIONS.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sort-option-btn';
        btn.dataset.value = opt.value;
        var label = document.createElement('span');
        label.textContent = opt.description;
        btn.appendChild(label);
        if (habitViewState.sortKey === opt.value) btn.classList.add('is-active');
        sortOptionsEl.appendChild(btn);
      });
    }

    function highlightSortOption() {
      if (!sortOptionsEl) return;
      var current = habitViewState.sortKey;
      var buttons = sortOptionsEl.querySelectorAll('.sort-option-btn');
      buttons.forEach(function (btn) {
        btn.classList.toggle('is-active', btn.dataset.value === current);
      });
    }

    function openSortModal() {
      if (!sortModal || !mobileToolbarMedia.matches) return;
      renderSortOptions();
      sortModal.classList.add('open');
      sortModal.setAttribute('aria-hidden', 'false');
    }

    function closeSortModal() {
      if (!sortModal) return;
      sortModal.classList.remove('open');
      sortModal.setAttribute('aria-hidden', 'true');
    }

    function setSortValue(value, skipSelectSync) {
      var next = value || 'created-newest';
      var changed = habitViewState.sortKey !== next;
      habitViewState.sortKey = next;
      highlightSortOption();
      if (!skipSelectSync && sortSelect) {
        if (sortSelect.value !== next) {
          sortSelect.value = next;
        }
        sortSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (changed) render();
    }

    if (sortModal) {
      sortModal.addEventListener('click', function (e) {
        if (e.target.closest('[data-sort-close]')) {
          closeSortModal();
        }
      });
    }

    highlightSortOption();

    function openAccountMenu() {
      if (!accountMenuWrap || !accountMenuBtn) return;
      accountMenuWrap.classList.add('open');
      accountMenuBtn.setAttribute('aria-expanded', 'true');
    }

    function closeAccountMenu() {
      if (!accountMenuWrap || !accountMenuBtn) return;
      accountMenuWrap.classList.remove('open');
      accountMenuBtn.setAttribute('aria-expanded', 'false');
    }

    function openAccountModal() {
      if (!accountModal) return;
      accountModal.classList.add('open');
      accountModal.setAttribute('aria-hidden', 'false');
    }

    function closeAccountModal() {
      if (!accountModal) return;
      accountModal.classList.remove('open');
      accountModal.setAttribute('aria-hidden', 'true');
    }

    async function handleLogoutAction() {
      const confirmed = await showConfirm(
        'Confirm Logout',
        'Are you sure you want to log out?'
      );

      if (confirmed) {
        await Auth.logout();
        window.location.href = 'index.html';
      }
    }

    async function handleDeleteAccountAction() {
      const confirmed = await showConfirm(
        'Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.'
      );

      if (confirmed) {
        try {
          const username = Auth.getCurrentUser();
          const cleared = await Storage.clearUserData();
          const deleted = await Auth.deleteAccount(username);

          if (cleared && deleted) {
            await showAlert('Success', 'Your account has been deleted.');
            window.location.href = 'index.html';
          } else {
            await showAlert('Error', 'Error deleting account. Please try again.');
          }
        } catch (error) {
          await showAlert('Error', 'Error deleting account. Please try again.');
        }
      }
    }

    if (accountMenuBtn) {
      accountMenuBtn.addEventListener('click', function () {
        if (accountMenuWrap && accountMenuWrap.classList.contains('open')) {
          closeAccountMenu();
        } else {
          closeAccountModal();
          openAccountMenu();
        }
      });
    }

    if (accountToggleBtn) {
      accountToggleBtn.addEventListener('click', function () {
        openAccountModal();
      });
    }

    if (accountModal) {
      accountModal.addEventListener('click', function (e) {
        if (e.target.closest('[data-account-close]')) {
          closeAccountModal();
        }
      });
    }

    if (accountThemeToggleBtn) {
      accountThemeToggleBtn.addEventListener('click', function () {
        var next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(next);
        closeAccountModal();
        closeAccountMenu();
      });
    }
    if (accountLogoutBtn) {
      accountLogoutBtn.addEventListener('click', function () {
        handleLogoutAction();
        closeAccountModal();
        closeAccountMenu();
      });
    }
    if (accountDeleteBtn) {
      accountDeleteBtn.addEventListener('click', function () {
        handleDeleteAccountAction();
        closeAccountModal();
        closeAccountMenu();
      });
    }

    if (accountMenuDropdown) {
      accountMenuDropdown.addEventListener('click', function (e) {
        var item = e.target.closest('.account-menu-item');
        if (!item) return;
        var action = item.dataset.accountMenu;
        if (action === 'logout') {
          handleLogoutAction();
        } else if (action === 'delete') {
          handleDeleteAccountAction();
        }
        closeAccountMenu();
      });
    }

    document.addEventListener('click', function (e) {
      if (!accountMenuWrap || !accountMenuWrap.classList.contains('open')) return;
      if (accountMenuWrap.contains(e.target)) return;
      closeAccountMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeSortModal();
        closeAccountModal();
        closeAccountMenu();
      }
    });

    var hasAnimatedYearBanner = false;
    var progressBarStyle = null;

    function createProgressBar() {
      // Create a style element to directly control the ::before transform
      if (!progressBarStyle) {
        progressBarStyle = document.createElement('style');
        progressBarStyle.id = 'year-progress-style';
        document.head.appendChild(progressBarStyle);
      }
      return progressBarStyle;
    }

    function setProgressBarScale(percentage) {
      var scale = percentage / 100; // Convert percentage to 0-1 scale
      var style = createProgressBar();
      style.textContent = '.header-top .year-banner::before { transform: scaleX(' + scale + ') !important; }';
    }

    function updateYearBanner() {
      if (!yearBanner) {
        return;
      }

      var y = CURRENTYEAR;
      var today = Math.min(dayIndexForYear(y)+1, daysInYear(y));
      var total = daysInYear(y);
      var completionPercentage = (today / total) * 100;

      yearBanner.innerHTML =
        '<span class="yb-label">Year</span> <span class="yb-value">' + y + '</span>' +
        ' • ' +
        '<span class="yb-label">Days</span> <span class="yb-value">' + today + '/' + total + '</span>';

      // Animate fill on first load
      if (!hasAnimatedYearBanner) {
        hasAnimatedYearBanner = true;

        // Start at 0%
        setProgressBarScale(0);

        // Animate to actual percentage after a brief delay
        setTimeout(function() {
          setProgressBarScale(completionPercentage);
        }, 100);
      } else {
        // Direct update for subsequent calls
        setProgressBarScale(completionPercentage);
      }
    }

    function dotTitle(habit, index, baseLabel, isToday) {
      var parts = [baseLabel];
      if (isToday) parts.push('(Today)');
      if (habit.offDays[index]) parts.push('Off day');
      var note = habit.notes && habit.notes[index] ? habit.notes[index].trim() : '';
      if (note) parts.push('Note: ' + note);
      return parts.join(' • ');
    }

    // Memoization cache for getVisibleHabits
    var visibleHabitsCache = {
      habitsLength: -1,
      searchQuery: null,
      sortKey: null,
      result: null
    };

    function getVisibleHabits() {
      var query = (habitViewState.searchQuery || '').toLowerCase();
      var sortKey = habitViewState.sortKey;

      // Check if we can use cached result
      if (visibleHabitsCache.result !== null &&
          visibleHabitsCache.habitsLength === HABITS.length &&
          visibleHabitsCache.searchQuery === query &&
          visibleHabitsCache.sortKey === sortKey) {
        return visibleHabitsCache.result;
      }

      // Compute new result
      var filtered = HABITS.filter(function (habit) {
        if (!query) return true;
        return String(habit.name || '').toLowerCase().indexOf(query) !== -1;
      });
      var result = sortHabits(filtered, sortKey);

      // Update cache
      visibleHabitsCache = {
        habitsLength: HABITS.length,
        searchQuery: query,
        sortKey: sortKey,
        result: result
      };

      return result;
    }

    // Function to invalidate cache when habits change
    function invalidateVisibleHabitsCache() {
      visibleHabitsCache.result = null;
    }

    function sortHabits(list, sortKey) {
      var key = sortKey || 'created-newest';
      var arr = list.slice();
      var completionCache;
      var statsCache;

      // Pre-calculate completion rates if needed
      if (key === 'rate-high-low' || key === 'rate-low-high') {
        completionCache = new Map();
        arr.forEach(function (habit) {
          completionCache.set(habit.id, completionSortValue(habit));
        });
      }

      // Pre-calculate stats if needed for streak/total sorts
      if (key.includes('streak') || key.includes('total')) {
        statsCache = new Map();
        arr.forEach(function (habit) {
          var stats = getHabitStats(habit);
          statsCache.set(habit.id, stats);
        });
      }

      arr.sort(function (a, b) {
        switch (key) {
          case 'name-az':
            return compareHabitNames(a, b);
          case 'name-za':
            return compareHabitNames(b, a);
          case 'created-oldest':
            return createdAtValue(a) - createdAtValue(b);
          case 'rate-high-low':
            return (completionCache.get(b.id) || 0) - (completionCache.get(a.id) || 0);
          case 'rate-low-high':
            return (completionCache.get(a.id) || 0) - (completionCache.get(b.id) || 0);

          // NEW: Custom manual order
          case 'custom-manual':
            return (a.customOrder || 0) - (b.customOrder || 0);

          // NEW: Sort by longest streak
          case 'streak-longest':
            var statsA = statsCache.get(a.id);
            var statsB = statsCache.get(b.id);
            return (statsB.longest || 0) - (statsA.longest || 0);

          // NEW: Sort by current streak
          case 'streak-current':
            var statsA = statsCache.get(a.id);
            var statsB = statsCache.get(b.id);
            return (statsB.current || 0) - (statsA.current || 0);

          // NEW: Sort by total completions (high to low)
          case 'total-high':
            var statsA = statsCache.get(a.id);
            var statsB = statsCache.get(b.id);
            return (statsB.total || 0) - (statsA.total || 0);

          // NEW: Sort by total completions (low to high)
          case 'total-low':
            var statsA = statsCache.get(a.id);
            var statsB = statsCache.get(b.id);
            return (statsA.total || 0) - (statsB.total || 0);

          case 'created-newest':
          default:
            return createdAtValue(b) - createdAtValue(a);
        }
      });
      return arr;
    }

    function compareHabitNames(a, b) {
      return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
    }

    function createdAtValue(habit) {
      var raw = habit.createdAt || habit.startDate || '';
      var parsed = raw ? Date.parse(raw) : NaN;
      if (!isNaN(parsed)) return parsed;
      var year = habit.year || CURRENTYEAR;
      return new Date(year, 0, 1).getTime();
    }

    /**
     * Render a skeleton card for lazy loading
     */
    function renderPlaceholderCard(habit) {
      var wrap = document.createElement('section');
      wrap.className = 'card skeleton-card card-placeholder';
      wrap.dataset.habitId = habit.id;

      // Apply accent color to skeleton
      var acc = habit.accent || '#3d85c6';
      try {
        var rgb = hexToRgb(acc);
        wrap.style.setProperty('--accent-base', acc);
        wrap.style.setProperty('--accent-rgb', rgb);
        wrap.style.borderColor = 'rgba(' + rgb + ',0.1)';
      } catch (e){}

      // Create skeleton header
      var header = document.createElement('div');
      header.className = 'card-header';

      var headerTopRow = document.createElement('div');
      headerTopRow.className = 'header-top-row';

      var left = document.createElement('div');
      left.className = 'left';

      var skCircle = document.createElement('div');
      skCircle.className = 'sk-circle skeleton-shimmer';
      left.appendChild(skCircle);

      var skLine = document.createElement('div');
      skLine.className = 'sk-line sk-line-lg skeleton-shimmer';
      left.appendChild(skLine);

      headerTopRow.appendChild(left);

      var buttons = document.createElement('div');
      buttons.className = 'card-header-buttons';

      var btn1 = document.createElement('div');
      btn1.className = 'sk-button sk-button-small skeleton-shimmer';
      buttons.appendChild(btn1);

      var btn2 = document.createElement('div');
      btn2.className = 'sk-button sk-button-small skeleton-shimmer';
      buttons.appendChild(btn2);

      headerTopRow.appendChild(buttons);
      header.appendChild(headerTopRow);

      // Pills wrapper
      var pillsWrapper = document.createElement('div');
      pillsWrapper.className = 'card-pills-wrapper';

      var subtitleWrap = document.createElement('div');
      subtitleWrap.className = 'card-subtitle-wrap';

      var subtitle = document.createElement('div');
      subtitle.className = 'card-subtitle';

      for (var i = 0; i < 4; i++) {
        var pill = document.createElement('div');
        pill.className = 'sk-pill skeleton-shimmer';
        subtitle.appendChild(pill);
      }

      for (var j = 0; j < 2; j++) {
        var widePill = document.createElement('div');
        widePill.className = 'sk-pill sk-pill-wide skeleton-shimmer';
        subtitle.appendChild(widePill);
      }

      subtitleWrap.appendChild(subtitle);
      pillsWrapper.appendChild(subtitleWrap);
      header.appendChild(pillsWrapper);

      // Divider with year wheel skeleton
      var divider = document.createElement('div');
      divider.className = 'divider';

      var yearWheel = document.createElement('div');
      yearWheel.className = 'sk-year-wheel skeleton-shimmer';
      divider.appendChild(yearWheel);

      header.appendChild(divider);
      wrap.appendChild(header);

      // Card content with skeleton dots
      var content = document.createElement('div');
      content.className = 'card-content';

      var dotsGrid = document.createElement('div');
      dotsGrid.className = 'dots-grid sk-dots-desktop';
      content.appendChild(dotsGrid);

      wrap.appendChild(content);

      return wrap;
    }

    /**
     * Hydrate a placeholder card with full content
     * Creates smooth fade transition from skeleton to real card
     */
    function hydrateCard(placeholderCard, habitId) {
      var habit = HABITS.find(function(h) { return h.id === habitId; });
      if (!habit) return;

      // Render full card
      var fullCard = renderHabitCard(habit);

      // Start with card invisible
      fullCard.style.opacity = '0';
      fullCard.classList.add('card-hydrating');

      // Insert full card before placeholder
      placeholderCard.parentNode.insertBefore(fullCard, placeholderCard);

      // Fade out skeleton and fade in real card simultaneously
      requestAnimationFrame(function() {
        // Start fade out of skeleton
        placeholderCard.classList.add('skeleton-fading-out');

        // Start fade in of real card
        fullCard.style.transition = 'opacity 0.3s ease-in';
        fullCard.style.opacity = '1';

        // After transition completes, remove skeleton and cleanup
        setTimeout(function() {
          if (placeholderCard.parentNode) {
            placeholderCard.parentNode.removeChild(placeholderCard);
          }
          fullCard.classList.remove('card-hydrating');
          fullCard.style.transition = '';
          fullCard.style.opacity = '';

          // Initialize year wheel for the hydrated card
          requestAnimationFrame(function() {
            initHabitYearWheel(habit);
          });
        }, 300);
      });
    }

    function renderHabitCard(habit) {
      var todayIdx = dayIndexForYear(habit.year);
      var stats = getHabitStats(habit);
      var completionRate = getCompletionRate(habit, stats);

      var wrap = document.createElement('section');
      wrap.className = 'card';
      wrap.dataset.habitId = habit.id;

      var acc = habit.accent || '#3d85c6';
      try {
        var rgb = hexToRgb(acc);
        wrap.style.setProperty('--accent-base', acc);
        wrap.style.setProperty('--accent-rgb', rgb);
        wrap.style.setProperty('--accent-a-07', 'rgba(' + rgb + ',0.7)');
        wrap.style.setProperty('--accent-a-05', 'rgba(' + rgb + ',0.5)');
        wrap.style.setProperty('--accent-a-03', 'rgba(' + rgb + ',0.3)');
        wrap.style.setProperty('--accent-a-02', 'rgba(' + rgb + ',0.2)');
        wrap.style.setProperty('--accent-a-01', 'rgba(' + rgb + ',0.1)');
        wrap.style.setProperty('--accent-tint', 'rgba(' + rgb + ',0.3)');
        wrap.style.borderColor = 'rgba(' + rgb + ',0.1)';
      } catch (e){}

      var header = document.createElement('div');
      header.className = 'card-header';

      var left = document.createElement('div');
      left.className = 'left';

      var title = document.createElement('h2');
      title.className = 'card-title';

      var titleBtn = document.createElement('button');
      titleBtn.type = 'button';
      titleBtn.className = 'habit-title-btn';
      titleBtn.dataset.habitId = habit.id;

      var visualEl = document.createElement('span');
      visualEl.className = 'habit-visual';

      var icon = document.createElement('i');
      icon.className = 'ti ti-' + (habit.visualValue || 'target');
      icon.style.color = acc;
      visualEl.appendChild(icon);

      titleBtn.appendChild(visualEl);

      var nameSpan = document.createElement('span');
      nameSpan.className = 'habit-name';
      nameSpan.textContent = habit.name;
      titleBtn.appendChild(nameSpan);

      title.appendChild(titleBtn);
      left.appendChild(title);

      var markTodayBtn = document.createElement('button');
      markTodayBtn.className = 'control-btn mark-today-btn';
      markTodayBtn.dataset.action = 'mark-today';
      var isTodayMarked = habit.dots[todayIdx] > 0;
      if (isTodayMarked) {
        markTodayBtn.classList.add('marked');
      }
      markTodayBtn.setAttribute('aria-label', isTodayMarked ? 'Unmark today' : 'Mark today');
      markTodayBtn.setAttribute('title', isTodayMarked ? 'Unmark today' : 'Mark today');
      markTodayBtn.innerHTML = '<span class="mark-today-dot"></span>';

      var editBtn = document.createElement('button');
      editBtn.className = 'control-btn';
      editBtn.dataset.action = 'edit';
      editBtn.setAttribute('aria-label', 'Edit habit');
      editBtn.setAttribute('title', 'Edit habit');
      editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';

      var buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'card-header-buttons';
      buttonsContainer.appendChild(markTodayBtn);
      buttonsContainer.appendChild(editBtn);

      var headerTopRow = document.createElement('div');
      headerTopRow.className = 'header-top-row';
      headerTopRow.appendChild(left);
      headerTopRow.appendChild(buttonsContainer);
      header.appendChild(headerTopRow);

      var subtitle = document.createElement('p');
      subtitle.className = 'card-subtitle';
      var startLabel = formatStartDateLabel(habit);
      subtitle.innerHTML =
        '<span class="stat-item">Total <span class="total-count">' + stats.total + '</span></span>' +
        '<span class="stat-item">Longest <span class="longest-streak">' + stats.longest + '</span></span>' +
        '<span class="stat-item">Current <span class="current-streak">' + stats.current + '</span></span>' +
        '<span class="stat-item">Rate <span class="completion-rate">' + completionRate + '%</span></span>' +
        '<span class="stat-item start-pill">Start <span class="start-date">' + startLabel + '</span></span>' +
        '<span class="stat-item frequency-pill">' + formatFrequency(habit.frequency) + '</span>';

      var subtitleWrap = document.createElement('div');
      subtitleWrap.className = 'card-subtitle-wrap';
      subtitleWrap.appendChild(subtitle);

      var pillsWrapper = document.createElement('div');
      pillsWrapper.className = 'card-pills-wrapper';
      pillsWrapper.appendChild(subtitleWrap);
      header.appendChild(pillsWrapper);

      var divider = document.createElement('div');
      divider.className = 'divider';

      // Create year wheel container for this habit
      var yearWheelContainer = document.createElement('div');
      yearWheelContainer.id = 'year-wheel-' + habit.id;
      yearWheelContainer.className = 'habit-year-wheel';
      divider.appendChild(yearWheelContainer);

      header.appendChild(divider);

      var content = document.createElement('div');
      content.className = 'card-content';

      // Create both year and month views
      var yearGridContainer = document.createElement('div');
      yearGridContainer.className = 'dots-grid dots-grid-year-view';
      buildYearView(habit, yearGridContainer, todayIdx);

      var monthGridContainer = document.createElement('div');
      monthGridContainer.className = 'months-container months-container-month-view';
      buildMonthViews(habit, monthGridContainer, todayIdx);

      content.appendChild(yearGridContainer);
      content.appendChild(monthGridContainer);
      wrap.appendChild(header);
      wrap.appendChild(content);

      return wrap;
    }

    var hasAnimatedInitialLoad = false;
    var hasHydratedList = false;

    function animateCard(card, index) {
      // Add entering class immediately
      card.classList.add('card-entering');

      // Stagger with 100ms delay between each card (Adjust this number to control speed)
      setTimeout(function() {
        card.classList.add('card-enter-active');
        card.classList.remove('card-entering');
      }, index * 100);
    }

    // Lazy loading with Intersection Observer
    var cardObserver = null;
    var lazyLoadQueue = new Set();

    function initLazyLoading() {
      if (cardObserver) return;

      // Create Intersection Observer for lazy loading cards
      cardObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var card = entry.target;
            var habitId = card.dataset.habitId;

            // Hydrate the card if it's a placeholder
            if (card.classList.contains('card-placeholder')) {
              hydrateCard(card, habitId);
              cardObserver.unobserve(card);
            }
          }
        });
      }, {
        root: null,
        rootMargin: '50px', // Start loading 50px before card enters viewport
        threshold: 0.01
      });
    }

    function render() {
      var visibleHabits = getVisibleHabits();

      // Initialize lazy loading observer
      initLazyLoading();

      // Update empty states
      emptyEl.hidden = HABITS.length !== 0;
      if (searchEmptyEl) {
        searchEmptyEl.hidden = !(HABITS.length && visibleHabits.length === 0);
      }

      // DOM reconciliation: map existing cards by habit ID
      var existingCards = new Map();
      Array.prototype.forEach.call(listEl.children, function(card) {
        if (card.dataset && card.dataset.habitId) {
          existingCards.set(card.dataset.habitId, card);
        }
      });

      // Create a fragment for efficient reordering
      var fragment = document.createDocumentFragment();
      var visibleIds = new Set();
      var newCards = [];
      var cardsToAnimate = [];

      // Number of cards to render immediately (visible above fold)
      var EAGER_LOAD_COUNT = 3;

      // Reorder existing cards and create new ones
      visibleHabits.forEach(function(habit, index) {
        visibleIds.add(habit.id);
        var card = existingCards.get(habit.id);

        if (card) {
          // Card already exists, just move it to the fragment for reordering
          fragment.appendChild(card);

          // If it's still a placeholder, observe it
          if (card.classList.contains('card-placeholder')) {
            cardObserver.observe(card);
          }
        } else {
          // Card is new - render full card for first few, placeholder for rest
          if (index < EAGER_LOAD_COUNT) {
            // Eagerly load first few cards
            card = renderHabitCard(habit);
            fragment.appendChild(card);
            newCards.push(habit);
            cardsToAnimate.push(card);
          } else {
            // Lazy load remaining cards
            card = renderPlaceholderCard(habit);
            fragment.appendChild(card);
            cardsToAnimate.push(card);
            // Observe for lazy loading
            setTimeout(function() {
              cardObserver.observe(card);
            }, 100);
          }
        }
      });

      // Remove cards that are no longer visible
      existingCards.forEach(function(card, id) {
        if (!visibleIds.has(id)) {
          if (listEl.contains(card)) {
            listEl.removeChild(card);
          }
        }
      });

      // Append the reordered and new cards in one efficient operation
      listEl.appendChild(fragment);

      updateYearBanner();

      // Logic for the FIRST load (transition from Skeleton to Real List)
      if (!hasHydratedList) {
        hasHydratedList = true;

        // IMPROVED: Smooth crossfade from skeleton to cards
        requestAnimationFrame(function() {
          // 1. Make list visible FIRST (cards still have opacity: 0 from card-entering)
          listEl.hidden = false;

          // 2. Start card animations immediately
          if (!hasAnimatedInitialLoad) {
            hasAnimatedInitialLoad = true;
            cardsToAnimate.forEach(function(card, index) {
              animateCard(card, index);
            });
          }

          // 3. Trigger skeleton fade-out by adding class
          if (skeletonEl) {
            skeletonEl.classList.add('fading-out');

            // 4. After fade-out completes (250ms), actually hide it
            setTimeout(function() {
              skeletonEl.hidden = true;
            }, 250);
          }

          // 5. Initialize Year Wheels NOW that elements have width
          // This ensures offsetWidth is > 0 so centering works
          if (newCards.length > 0) {
            requestAnimationFrame(function() {
              newCards.forEach(function(habit) {
                initHabitYearWheel(habit);
              });
            });
          }
        });
      }
      // Logic for SUBSEQUENT renders (Sorting, Filtering, Adding New Habit)
      else {
        // The list is already visible, so we can init immediately
        if (newCards.length > 0) {
          requestAnimationFrame(function() {
            newCards.forEach(function(habit) {
              initHabitYearWheel(habit);
            });
          });
        }
      }

      // NEW: run staggered wave on initial load
      if (!HAS_RUN_INITIAL_WAVE) {
        ensureWaveStyles();
        var cards = listEl.querySelectorAll('.card');
        cards.forEach(function (card) {
          var dots = card.querySelectorAll('.dot');
          applyWave(dots);
        });
        HAS_RUN_INITIAL_WAVE = true;
      }

      // Add scroll listeners for fade effect (only for new cards to avoid duplicate listeners)
      if (newCards.length > 0) {
        newCards.forEach(function(habit) {
          var card = listEl.querySelector('[data-habit-id="' + habit.id + '"]');
          if (card) {
            var scroller = card.querySelector('.card-subtitle');
            if (scroller) {
              var wrap = scroller.parentElement; // .card-subtitle-wrap

              function updateFades() {
                var atStart = scroller.scrollLeft < 1;
                var atEnd = Math.ceil(scroller.scrollLeft + scroller.clientWidth) >= scroller.scrollWidth - 1;

                wrap.classList.toggle('fade-right', !atEnd);
                wrap.classList.toggle('fade-left', !atStart);
              }

              scroller.addEventListener('scroll', updateFades);
              updateFades(); // run once
            }
          }
        });
      }

      // Check and initialize year wheels for reused cards after DOM settles
      // This handles cards that were reused during re-render (sorting, filtering, etc.)
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          visibleHabits.forEach(function(habit) {
            var card = listEl.querySelector('[data-habit-id="' + habit.id + '"]');

            if (card && !card.classList.contains('card-placeholder')) {
              if (!habitYearWheels[habit.id]) {
                // Case 1: Wheel doesn't exist yet, initialize it
                initHabitYearWheel(habit);
              } else {
                // Case 2: Wheel exists, but sorting moved the DOM element.
                // Moving DOM elements resets their scrollLeft to 0.
                // We must re-attach observers and force the scroll position back to center.
                setupDynamicCentering(habit.id);
                centerSelectedYear(habit.id, false); // false = instant jump, no animation
              }
            }
          });
        });
      });

      // Enable drag-and-drop for manual sorting
      enableDragAndDrop();
    }

    // ========== DRAG-AND-DROP FOR MANUAL SORTING ==========
    var draggedCard = null;
    var draggedHabitId = null;
    var dragPlaceholder = null;

    function enableDragAndDrop() {
      var isManualSort = habitViewState.sortKey === 'custom-manual';
      var cards = listEl.querySelectorAll('.card');

      cards.forEach(function(card) {
        if (isManualSort) {
          card.setAttribute('draggable', 'true');
          card.classList.add('draggable-card');

          // Remove old listeners to avoid duplicates
          card.removeEventListener('dragstart', handleDragStart);
          card.removeEventListener('dragover', handleDragOver);
          card.removeEventListener('drop', handleDrop);
          card.removeEventListener('dragend', handleDragEnd);
          card.removeEventListener('dragenter', handleDragEnter);
          card.removeEventListener('dragleave', handleDragLeave);

          // Add new listeners
          card.addEventListener('dragstart', handleDragStart);
          card.addEventListener('dragover', handleDragOver);
          card.addEventListener('drop', handleDrop);
          card.addEventListener('dragend', handleDragEnd);
          card.addEventListener('dragenter', handleDragEnter);
          card.addEventListener('dragleave', handleDragLeave);
        } else {
          card.removeAttribute('draggable');
          card.classList.remove('draggable-card');
        }
      });
    }

    function handleDragStart(e) {
      draggedCard = this;
      draggedHabitId = this.dataset.habitId;
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragOver(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.dataTransfer.dropEffect = 'move';
      return false;
    }

    function handleDragEnter(e) {
      if (this !== draggedCard) {
        this.classList.add('drag-over');
      }
    }

    function handleDragLeave(e) {
      this.classList.remove('drag-over');
    }

    function handleDrop(e) {
      if (e.stopPropagation) {
        e.stopPropagation();
      }

      this.classList.remove('drag-over');

      if (draggedCard !== this) {
        var draggedId = draggedHabitId;
        var targetId = this.dataset.habitId;

        var draggedIndex = HABITS.findIndex(function(h) { return h.id === draggedId; });
        var targetIndex = HABITS.findIndex(function(h) { return h.id === targetId; });

        if (draggedIndex !== -1 && targetIndex !== -1) {
          // Reorder the HABITS array
          var draggedHabit = HABITS.splice(draggedIndex, 1)[0];
          HABITS.splice(targetIndex, 0, draggedHabit);

          // Update customOrder for all habits
          HABITS.forEach(function(habit, index) {
            habit.customOrder = index;
            habit.lastModified = Date.now();
          });

          // Save and re-render
          saveHabits(HABITS);
          render();
          announce('Habit order updated');
        }
      }

      return false;
    }

    function handleDragEnd(e) {
      this.classList.remove('dragging');

      var cards = listEl.querySelectorAll('.card');
      cards.forEach(function(card) {
        card.classList.remove('drag-over');
      });
    }

    /**
     * Update aria-disabled state on existing dots when start date changes
     * Also updates visual state to ensure disabled dots appear correctly
     */
    function updateDotsDisabledState(habit) {
      var card = listEl.querySelector('[data-habit-id="' + habit.id + '"]');
      if (!card) return;

      var isCurrentYear = habit.year === CURRENTYEAR;
      var todayIndex = dayIndexForYear(CURRENTYEAR);
      var startIndex = getHabitStartIndex(habit);

      // Get the start date year to properly handle dots in the start year
      var startDate = getHabitStartDate(habit);
      var startYear = startDate ? startDate.getFullYear() : habit.year;

      var allDots = card.querySelectorAll('.dot');
      allDots.forEach(function(dot) {
        var index = Number(dot.dataset.index);
        var isFuture = isCurrentYear && index > todayIndex;

        // For the start year, check against the actual start index
        // For years before start year, all dots are disabled
        // For years after start year, only future dates are disabled
        var isBeforeStart = false;
        if (habit.year === startYear) {
          isBeforeStart = index < startIndex;
        } else if (habit.year < startYear) {
          isBeforeStart = true; // Entire year is before start
        }

        if (isFuture || isBeforeStart) {
          dot.setAttribute('aria-disabled', 'true');
          // Remove checked state from dots that are now disabled
          if (isBeforeStart && habit.dots && habit.dots[index] > 0) {
            habit.dots[index] = 0;
            dot.removeAttribute('aria-pressed');
          }
        } else {
          dot.removeAttribute('aria-disabled');
          // Update visual state to match data
          if (habit.dots && habit.dots[index] > 0) {
            dot.setAttribute('aria-pressed', 'true');
          } else {
            dot.removeAttribute('aria-pressed');
          }
        }
      });

      // Mark stats as dirty since we may have changed dot states
      habit._dirtyStats = true;
    }

    function buildYearView(habit, container, todayIndex) {
      // Create a document fragment to minimize reflows
      var frag = document.createDocumentFragment();

      // Hoist constant checks outside loop
      var isCurrentYear = habit.year === CURRENTYEAR;
      var hasNotes = habit.notes && habit.notes.length > 0;
      var habitId = habit.id;
      var days = habit.days;
      var dots = habit.dots;
      var offDays = habit.offDays;
      var notes = habit.notes;
      var startIndex = getHabitStartIndex(habit);
      var dailyTarget = habit.dailyTarget || 1;

      for (var i = 0; i < days; i++) {
        var dot = document.createElement('div');
        dot.className = 'dot';

        // Only set essential data attributes for read-only divs
        dot.dataset.index = i;
        dot.dataset.habitId = habitId;

        // Set visual state using attributes (minimal DOM operations)
        if (dots[i] > 0) {
          dot.setAttribute('aria-pressed', 'true');
          // Apply opacity heatmap: opacity = count / dailyTarget
          var opacity = Math.min(dots[i] / dailyTarget, 1);
          dot.style.setProperty('--dot-opacity', opacity);
        }
        if (offDays[i]) {
          dot.dataset.off = 'true';
        }
        if (hasNotes && notes[i] && notes[i].trim()) {
          dot.dataset.note = 'true';
        }
        if (isCurrentYear && i === todayIndex) {
          dot.setAttribute('aria-current', 'date');
        }

        // Mark future dates and dates before start as disabled
        var isFuture = isCurrentYear && i > todayIndex;
        var isBeforeStart = i < startIndex;
        if (isFuture || isBeforeStart) {
          dot.setAttribute('aria-disabled', 'true');
        }

        frag.appendChild(dot);
      }

      container.appendChild(frag);
    }

    function buildMonthViews(habit, container, todayIndex) {
      var year = habit.year;
      var dayOfYearIndex = 0;

      // Hoist constant checks outside loops
      var isCurrentYear = habit.year === CURRENTYEAR;
      var hasNotes = habit.notes && habit.notes.length > 0;
      var habitId = habit.id;
      var dots = habit.dots;
      var offDays = habit.offDays;
      var notes = habit.notes;
      var startIndex = getHabitStartIndex(habit);
      var dailyTarget = habit.dailyTarget || 1;

      for (var month = 0; month < 12; month++) {
        var monthContainer = document.createElement('div');
        monthContainer.className = 'month-container';
        var monthGrid = document.createElement('div');
        monthGrid.className = 'month-grid';

        // Date calculations needed for calendar layout (only 12x per habit)
        var firstDateOfMonth = new Date(year, month, 1);
        var startingDayOfWeek = firstDateOfMonth.getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty cells for alignment
        for (var i = 0; i < startingDayOfWeek; i++) {
          monthGrid.appendChild(document.createElement('div'));
        }

        // Create a document fragment for this month's days
        var frag = document.createDocumentFragment();
        for (var dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth++) {
          var dot = document.createElement('div');
          dot.className = 'dot';

          // Only set essential data attributes for read-only divs
          dot.dataset.index = dayOfYearIndex;
          dot.dataset.habitId = habitId;

          // Set visual state using attributes (minimal DOM operations)
          if (dots[dayOfYearIndex] > 0) {
            dot.setAttribute('aria-pressed', 'true');
            // Apply opacity heatmap: opacity = count / dailyTarget
            var opacity = Math.min(dots[dayOfYearIndex] / dailyTarget, 1);
            dot.style.setProperty('--dot-opacity', opacity);
          }
          if (offDays[dayOfYearIndex]) {
            dot.dataset.off = 'true';
          }
          if (hasNotes && notes[dayOfYearIndex] && notes[dayOfYearIndex].trim()) {
            dot.dataset.note = 'true';
          }
          if (isCurrentYear && dayOfYearIndex === todayIndex) {
            dot.setAttribute('aria-current', 'date');
          }

          // Mark future dates and dates before start as disabled
          var isFuture = isCurrentYear && dayOfYearIndex > todayIndex;
          var isBeforeStart = dayOfYearIndex < startIndex;
          if (isFuture || isBeforeStart) {
            dot.setAttribute('aria-disabled', 'true');
          }

          frag.appendChild(dot);
          dayOfYearIndex++;
        }

        monthGrid.appendChild(frag);
        monthContainer.appendChild(monthGrid);
        container.appendChild(monthContainer);
      }
    }

    /* ────────── Simplified dot state toggling (used by Mark Today button) ────────── */
    function setDotState(dotEl, incrementCount){
      if (!dotEl) return;
      var hid = dotEl.dataset.habitId;
      var idx = Number(dotEl.dataset.index);
      var h = HABITS.find(function (x){ return x.id === hid; });
      if (h) {
        var target = h.dailyTarget || 1;
        var oldValue = h.dots[idx] || 0;

        // Cycle through counts: 0 → 1 → 2 → ... → dailyTarget → 0
        if (incrementCount) {
          h.dots[idx] = (oldValue + 1) % (target + 1);
        } else {
          // Allow direct setting for backward compatibility
          h.dots[idx] = incrementCount;
        }

        var newValue = h.dots[idx];

        // if user increments a day that was auto-off, we should clear off for that day
        if (newValue > 0 && h.offDays[idx]) {
          h.offDays[idx] = false;
        }
        // Mark stats as dirty so they recalculate next time
        h._dirtyStats = true;

        dotEl.setAttribute('aria-pressed', String(newValue > 0));
        if (newValue > oldValue || (oldValue > 0 && newValue === 0)) {
          dotEl.classList.add('just-toggled');
          dotEl.addEventListener('animationend', function (){
            dotEl.classList.remove('just-toggled');
          }, { once: true });
        }
      }
    }

    listEl.addEventListener('click', function (e){
      var markTodayBtn = e.target.closest('[data-action="mark-today"]');
      if (markTodayBtn) {
        var card = markTodayBtn.closest('.card');
        var habitId = card.dataset.habitId;
        var habit = HABITS.find(function(h) { return h.id === habitId; });

        if (!habit) return;

        // --- SMART MARK TODAY LOGIC ---

        // Case 1: The user is already viewing the current year
        if (habit.year === CURRENTYEAR) {
          var todayIdx = dayIndexForYear(CURRENTYEAR);

          // Find the dot in the currently active view (year or month)
          var currentView = document.documentElement.dataset.view || 'year';
          var activeContainer = currentView === 'year'
            ? card.querySelector('.dots-grid-year-view')
            : card.querySelector('.months-container-month-view');

          var todayDot = activeContainer ? activeContainer.querySelector('.dot[data-index="' + todayIdx + '"]') : null;

          if (todayDot) {
            // Increment the count for today
            setDotState(todayDot, true);

            var newCount = habit.dots[todayIdx];
            var newState = newCount > 0;

            // Update button visual state immediately
            markTodayBtn.classList.toggle('marked', newState);
            markTodayBtn.setAttribute('aria-label', newState ? 'Unmark today' : 'Mark today');
            markTodayBtn.setAttribute('title', newState ? 'Unmark today' : 'Mark today');

            // Show count in habit icon for 1 second with animation
            var habitVisual = card.querySelector('.habit-visual');
            if (habitVisual) {
              var originalHTML = habitVisual.innerHTML;
              var countSpan = document.createElement('span');
              countSpan.textContent = newCount;
              countSpan.style.cssText = 'font-size:1.5em;font-weight:700;display:flex;align-items:center;justify-content:center;animation:countFeedback 1s ease-in-out forwards';
              habitVisual.innerHTML = '';
              habitVisual.appendChild(countSpan);
              setTimeout(function() {
                habitVisual.innerHTML = originalHTML;
                // Fade in the restored icon
                var icon = habitVisual.querySelector('i');
                if (icon) {
                  icon.style.animation = 'iconFadeIn 0.2s ease-in-out';
                }
              }, 1000);
            }

            onHabitChanged(habit); // This updates stats and saves
            announce(newState ? "Marked today" : "Unmarked today");
          }

        // Case 2: The user is viewing a different year - switch to current year first
        } else {
          var yearToSave = habit.year;
          var habitStartDate = getHabitStartDate(habit);
          var startYear = habitStartDate ? habitStartDate.getFullYear() : CURRENTYEAR;

          // Step A: Save the data for the year we are leaving (for persistence)
          if (yearToSave >= startYear && yearToSave <= CURRENTYEAR) {
            if (!habit.yearHistory) habit.yearHistory = {};
            habit.yearHistory[yearToSave] = {
              dots: habit.dots.slice(),
              offDays: habit.offDays.slice(),
              notes: habit.notes.slice()
            };
          }

          // Step B: Switch the habit's state to the CURRENT YEAR
          habit.year = CURRENTYEAR;
          habit.days = daysInYear(CURRENTYEAR);

          // Load data for the current year from history, or create new arrays
          if (habit.yearHistory && habit.yearHistory[CURRENTYEAR]) {
            var history = habit.yearHistory[CURRENTYEAR];
            // Normalize dots to handle old boolean data (backwards compatibility)
            habit.dots = history.dots.map(function(v) {
              return typeof v === 'boolean' ? (v ? 1 : 0) : (typeof v === 'number' ? Math.max(0, Math.floor(v)) : 0);
            });
            habit.offDays = history.offDays.slice();
            habit.notes = history.notes.slice();
            // Mark stats as dirty since dots/offDays changed
            habit._dirtyStats = true;
          } else {
            habit.dots = new Array(habit.days).fill(0);
            habit.offDays = new Array(habit.days).fill(false);
            habit.notes = new Array(habit.days).fill('');
            applyFrequencyToHabit(habit); // This will mark as dirty
          }

          // Step C: Perform the mark/unmark action for today's date
          var todayIdx = dayIndexForYear(CURRENTYEAR);
          var todayIsBeforeStartDate = todayIdx < getHabitStartIndex(habit);

          if (!todayIsBeforeStartDate) {
            // Increment the count for today
            var target = habit.dailyTarget || 1;
            var oldValue = habit.dots[todayIdx] || 0;
            habit.dots[todayIdx] = (oldValue + 1) % (target + 1);
            var newValue = habit.dots[todayIdx];

            // If we mark a day, it can't be an "off day"
            if (newValue > 0 && habit.offDays[todayIdx]) {
              habit.offDays[todayIdx] = false;
            }
            // Mark stats as dirty since we just toggled today's dot
            habit._dirtyStats = true;
            announce("Switched to current year and " + (newValue > 0 ? "marked today" : "unmarked today"));
          } else {
            announce("Switched to current year. Cannot mark today as it is before the habit's start date.");
          }

          // Step D: Save all changes and re-render the entire list
          saveHabits(HABITS);
          render(); // This will redraw the card with the correct year and dot state
        }

        return; // Ensure no other click actions fire
      }
      var editBtn = e.target.closest('[data-action="edit"]');
      if (editBtn){
        var card = editBtn.closest('.card');
        var habitId = card.dataset.habitId;
        var habit = HABITS.find(function (h){ return h.id === habitId; });
        if (habit) openEditOverlay(habit);
      }
      var titleBtn = e.target.closest('.habit-title-btn');
      if (titleBtn) {
        var hid = titleBtn.dataset.habitId;
        var habit = HABITS.find(function (h){ return h.id === hid; });
        if (habit) openStatsOverlay(habit);
      }
    });

    /* ────────── Mobile Double-Tap to Toggle Today ────────── */
    // Double-tap on card body in mobile mode to toggle today's date
    var lastTapTime = 0;
    var lastTapTarget = null;
    var DOUBLE_TAP_DELAY = 300; // milliseconds

    listEl.addEventListener('touchend', function(e) {
      // Only on mobile screens
      if (window.innerWidth > 900) return;

      var currentTime = new Date().getTime();
      var tapTimeDiff = currentTime - lastTapTime;

      // Check if tap is on card body (not on buttons, inputs, or interactive elements)
      var card = e.target.closest('.card');
      var isInteractiveElement = e.target.closest('button, input, select, textarea, a, .dot, .control-btn, .habit-title-btn');

      if (card && !isInteractiveElement && tapTimeDiff < DOUBLE_TAP_DELAY && tapTimeDiff > 0 && lastTapTarget === card) {
        // Double tap detected on card body!
        e.preventDefault(); // Prevent zoom or other default behavior

        var habitId = card.dataset.habitId;
        var habit = HABITS.find(function(h) { return h.id === habitId; });

        if (!habit) return;

        // Same logic as mark-today button
        if (habit.year === CURRENTYEAR) {
          var todayIdx = dayIndexForYear(CURRENTYEAR);

          // Find the dot in the currently active view
          var currentView = document.documentElement.dataset.view || 'year';
          var activeContainer = currentView === 'year'
            ? card.querySelector('.dots-grid-year-view')
            : card.querySelector('.months-container-month-view');

          var todayDot = activeContainer ? activeContainer.querySelector('.dot[data-index="' + todayIdx + '"]') : null;

          if (todayDot) {
            // Increment the count for today
            setDotState(todayDot, true);

            var newCount = habit.dots[todayIdx];
            var newState = newCount > 0;

            // Update mark-today button visual state
            var markTodayBtn = card.querySelector('.mark-today-btn');
            if (markTodayBtn) {
              markTodayBtn.classList.toggle('marked', newState);
              markTodayBtn.setAttribute('aria-label', newState ? 'Unmark today' : 'Mark today');
              markTodayBtn.setAttribute('title', newState ? 'Unmark today' : 'Mark today');
            }

            // Show count in habit icon for 1 second with animation
            var habitVisual = card.querySelector('.habit-visual');
            if (habitVisual) {
              var originalHTML = habitVisual.innerHTML;
              var countSpan = document.createElement('span');
              countSpan.textContent = newCount;
              countSpan.style.cssText = 'font-size:1.5em;font-weight:700;display:flex;align-items:center;justify-content:center;animation:countFeedback 1s ease-in-out forwards';
              habitVisual.innerHTML = '';
              habitVisual.appendChild(countSpan);
              setTimeout(function() {
                habitVisual.innerHTML = originalHTML;
                // Fade in the restored icon
                var icon = habitVisual.querySelector('i');
                if (icon) {
                  icon.style.animation = 'iconFadeIn 0.2s ease-in-out';
                }
              }, 1000);
            }

            onHabitChanged(habit);
            announce(newState ? "Marked today" : "Unmarked today");

            // Add visual feedback for double-tap using scale property (no transform conflicts)
            card.style.scale = '0.98';
            setTimeout(function() {
              card.style.scale = '';
            }, 100);
          }
        } else {
          // If viewing a different year, switch to current year first
          var yearToSave = habit.year;
          var habitStartDate = getHabitStartDate(habit);
          var startYear = habitStartDate ? habitStartDate.getFullYear() : CURRENTYEAR;

          if (yearToSave >= startYear && yearToSave <= CURRENTYEAR) {
            if (!habit.yearHistory) habit.yearHistory = {};
            habit.yearHistory[yearToSave] = {
              dots: habit.dots.slice(),
              offDays: habit.offDays.slice(),
              notes: habit.notes.slice()
            };
          }

          habit.year = CURRENTYEAR;
          habit.days = daysInYear(CURRENTYEAR);

          if (habit.yearHistory && habit.yearHistory[CURRENTYEAR]) {
            var history = habit.yearHistory[CURRENTYEAR];
            // Normalize dots to handle old boolean data (backwards compatibility)
            habit.dots = history.dots.map(function(v) {
              return typeof v === 'boolean' ? (v ? 1 : 0) : (typeof v === 'number' ? Math.max(0, Math.floor(v)) : 0);
            });
            habit.offDays = history.offDays.slice();
            habit.notes = history.notes.slice();
            habit._dirtyStats = true;
          } else {
            habit.dots = new Array(habit.days).fill(0);
            habit.offDays = new Array(habit.days).fill(false);
            habit.notes = new Array(habit.days).fill('');
            applyFrequencyToHabit(habit);
          }

          var todayIdx = dayIndexForYear(CURRENTYEAR);
          var todayIsBeforeStartDate = todayIdx < getHabitStartIndex(habit);

          if (!todayIsBeforeStartDate) {
            // Increment the count for today
            var target = habit.dailyTarget || 1;
            var oldValue = habit.dots[todayIdx] || 0;
            habit.dots[todayIdx] = (oldValue + 1) % (target + 1);
            var newValue = habit.dots[todayIdx];
            if (newValue > 0) habit.offDays[todayIdx] = false;
            habit._dirtyStats = true;
          }

          saveHabits(HABITS);
          render();
        }

        // Reset tap tracking
        lastTapTime = 0;
        lastTapTarget = null;
      } else {
        // Record this tap
        lastTapTime = currentTime;
        lastTapTarget = card;
      }
    });

    function onHabitChanged(habit){
      var card = listEl.querySelector('.card[data-habit-id="' + habit.id + '"]');
      if (card) {
        var stats = getHabitStats(habit);
        var completionRate = getCompletionRate(habit, stats);
        function updateStat(sel, val, suffix){
          var el = card.querySelector(sel);
          if (el) {
            var displayVal = suffix ? val + suffix : val;
            if (el.textContent !== String(displayVal)){
              el.textContent = String(displayVal);
              el.classList.add('stat-updated');
              el.addEventListener('animationend', function (){
                el.classList.remove('stat-updated');
              }, { once: true });
            }
          }
        }
        updateStat('.total-count', stats.total);
        updateStat('.longest-streak', stats.longest);
        updateStat('.current-streak', stats.current);
        updateStat('.completion-rate', completionRate, '%');
        updateStat('.start-date', formatStartDateLabel(habit));
        updateStat('.frequency-pill', formatFrequency(habit.frequency));
      }
      saveHabits(HABITS);
    }

    /* overlays */
    var appRoot = document.querySelector('.container');
    var lastFocus = null;
    function getFocusableWithin(el){
      return Array.prototype.slice.call(el.querySelectorAll('a[href],area[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])'));
    }
    function createOverlayManager(id){
      var overlay = document.getElementById(id);
      if (!overlay) return { open:function(){}, close:function(){} };
      function trap(e){
        if (e.key !== 'Tab') return;
        var f = getFocusableWithin(overlay);
        if (!f.length) return;
        var first = f[0];
        var last = f[f.length-1];
        if (e.shiftKey){
          if (document.activeElement === first){
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last){
            e.preventDefault();
            first.focus();
          }
        }
      }
      function esc(e){
        if (e.key === 'Escape') close();
      }
      function open(){
        lastFocus = document.activeElement;
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
        appRoot.setAttribute('aria-hidden', 'true');
        document.body.classList.add('scroll-lock');
        var f = getFocusableWithin(overlay)[0];
        if (f) f.focus();
        document.addEventListener('keydown', trap);
        document.addEventListener('keydown', esc);
      }
      function close(){
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
        appRoot.removeAttribute('aria-hidden');
        document.body.classList.remove('scroll-lock');
        document.removeEventListener('keydown', trap);
        document.removeEventListener('keydown', esc);
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
      }
      overlay.addEventListener('click', function (e){
        if (e.target === overlay) close();
      });
      return { open: open, close: close };
    }
    var newHabitOverlay = createOverlayManager('new-habit-overlay');
    var editHabitOverlay = createOverlayManager('edit-habit-overlay');
    var pickerOverlay = createOverlayManager('picker-overlay');
    var statsOverlayMgr = createOverlayManager('stats-overlay');
    var confirmOverlayElem = document.getElementById('confirm-overlay');
    var confirmOverlayMgr = createOverlayManager('confirm-overlay');
    var confirmResolver = null;

    /* Confirm modal helper */
    function openConfirmModal(options) {
      var title = options.title || 'Confirm';
      var message = options.message || 'Are you sure?';
      var confirmText = options.confirmText || 'OK';
      var variant = options.variant || 'danger';

      document.getElementById('confirm-title').textContent = title;
      document.getElementById('confirm-message').textContent = message;
      var okBtn = document.getElementById('confirm-ok-btn');
      okBtn.textContent = confirmText;
      okBtn.className = 'btn ' + (variant === 'danger' ? 'danger' : 'primary');

      confirmOverlayMgr.open();
      return new Promise(function(resolve){
        confirmResolver = resolve;
      });
    }
    document.getElementById('confirm-close').addEventListener('click', function () {
      confirmOverlayMgr.close();
      if (confirmResolver) confirmResolver(false);
      confirmResolver = null;
    });
    document.getElementById('confirm-cancel-btn').addEventListener('click', function () {
      confirmOverlayMgr.close();
      if (confirmResolver) confirmResolver(false);
      confirmResolver = null;
    });
    document.getElementById('confirm-ok-btn').addEventListener('click', function () {
      confirmOverlayMgr.close();
      if (confirmResolver) confirmResolver(true);
      confirmResolver = null;
    });

    /* stats overlay logic */
    function monthName(idx) {
      return new Date(2000, idx, 1).toLocaleString(undefined, { month: 'short' });
    }
    function openStatsOverlay(habit) {
      var stats = getHabitStats(habit);
      var completionRate = getCompletionRate(habit, stats);

      var body = document.getElementById('stats-body');
      document.getElementById('stats-title').textContent = 'Stats • ' + habit.name;
      body.innerHTML = '';

      var topStats = document.createElement('div');
      topStats.innerHTML = `
        <div class="stats-block">
          <span>Total days done</span>
          <strong>${stats.total}</strong>
        </div>
        <div class="stats-block">
          <span>Current streak</span>
          <strong>${stats.current}</strong>
        </div>
        <div class="stats-block">
          <span>Longest streak</span>
          <strong>${stats.longest}</strong>
        </div>
        <div class="stats-block">
          <span>Completion rate</span>
          <strong>${completionRate}%</strong>
        </div>
      `;
      body.appendChild(topStats);

      var monthGrid = document.createElement('div');
      monthGrid.className = 'month-grid-stats';

      var year = habit.year;
      var globalIdx = 0;
      var startIndex = getHabitStartIndex(habit);
      for (var m = 0; m < 12; m++) {
        var daysInMonth = new Date(year, m + 1, 0).getDate();
        var done = 0;
        var off = 0;
        var eligibleDays = 0;

        for (var day = 1; day <= daysInMonth; day++) {
          var isFuture = (year === CURRENTYEAR && globalIdx > todayIdx);
          var isBeforeStart = globalIdx < startIndex;
          if (!isFuture && !isBeforeStart) {
            if (!habit.offDays[globalIdx]) {
              eligibleDays++;
            } else {
              off++;
            }
            if (habit.dots[globalIdx]) done++;
          }
          globalIdx++;
        }

        var monthCard = document.createElement('div');
        monthCard.className = 'month-card';
        var monthRate = eligibleDays > 0 ? Math.round((done / eligibleDays) * 100) : 0;
        monthCard.innerHTML = `
          <h3>${monthName(m)}</h3>
          <p>Done: ${done}/${eligibleDays} (${monthRate}%)</p>
          <p style="opacity:.68">Off days: ${off}</p>
        `;
        monthGrid.appendChild(monthCard);
      }

      body.appendChild(monthGrid);

      statsOverlayMgr.open();
    }
    document.getElementById('stats-close').addEventListener('click', function () {
      statsOverlayMgr.close();
    });
    document.getElementById('stats-ok').addEventListener('click', function () {
      statsOverlayMgr.close();
    });

    /* new habit flow */
    var PRESETCOLORS = ['#bf2525','#ed7d31','#ffc000','#69b647','#3d85c6','#7467ff','#a259ff','#f34e1e','#eb008b','#edd526','#b00020','#6200ee','#2196f3','#cddc39','#795548','#607d8b'];
    var newSelectedAccent = PRESETCOLORS[4];
    var newSelectedIcon = 'target';
    var newStartInput = document.getElementById('habit-start-date');
    var editStartInput = document.getElementById('edit-habit-start-date');
    function renderPreview(which, iconKey, accent){
      var chip = document.getElementById(which === 'new' ? 'new-preview-chip' : 'edit-preview-chip');
      chip.style.color = accent;
      chip.innerHTML = '<i class="ti ti-' + (iconKey || 'target') + '"></i>';
    }
    document.getElementById('btn-new').addEventListener('click', function (){
      renderPreview('new', newSelectedIcon, newSelectedAccent);
      if (newStartInput) {
        var isoDefault = defaultStartDateForYear(CURRENTYEAR);
        newStartInput.value = isoToDisplay(isoDefault, CURRENTYEAR);
      }
      newHabitOverlay.open();
    });
    document.getElementById('new-sheet-close').addEventListener('click', function (){ newHabitOverlay.close(); });
    document.getElementById('new-sheet-cancel').addEventListener('click', function (){ newHabitOverlay.close(); });

    /* frequency extra renderers (NEW) */
    function renderWeekdayButtons(prefix, selected) {
      var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      selected = selected || [];
      return `
        <div class="form-label">On these days</div>
        <div style="display:flex; gap:6px; flex-wrap:wrap">
          ${days.map(function(d,i){
            var active = selected.indexOf(i) !== -1;
            return `<button type="button" class="btn ${active ? 'primary' : ''}" data-${prefix}-dow="${i}">${d}</button>`;
          }).join('')}
        </div>
      `;
    }
    function renderTimesPerWeek(prefix, val) {
      return `
        <label class="form-label">Times per week</label>
        <input type="number" min="1" max="7" value="${val || 3}" class="input" id="${prefix}-tpw">
      `;
    }

    var freqSelect = document.getElementById('habit-frequency');
    var freqExtra = document.getElementById('freq-extra');
    freqSelect.addEventListener('change', function () {
      var val = freqSelect.value;
      if (val === 'daysOfWeek') {
        freqExtra.style.display = 'block';
        freqExtra.innerHTML = renderWeekdayButtons('new', [1,3,5]); // default MWF
      } else if (val === 'timesPerWeek') {
        freqExtra.style.display = 'block';
        freqExtra.innerHTML = renderTimesPerWeek('new', 3);
      } else {
        freqExtra.style.display = 'none';
        freqExtra.innerHTML = '';
      }
    });

    // handle clicking weekday buttons for NEW
    freqExtra.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-new-dow]');
      if (!btn) return;
      btn.classList.toggle('primary');
    });

    document.getElementById('new-preview-btn').addEventListener('click', async function (){
      var res = await openIconColorPicker(newSelectedIcon, newSelectedAccent);
      if (res) {
        newSelectedIcon = res.icon;
        newSelectedAccent = res.color;
        renderPreview('new', newSelectedIcon, newSelectedAccent);
      }
    });
    document.getElementById('new-habit-form').addEventListener('submit', function (e){
      e.preventDefault();
      var nameEl = document.getElementById('habit-name');
      var name = nameEl.value.trim();
      if (!name) {
        nameEl.classList.add('input-invalid');
        nameEl.addEventListener('animationend', function (){
          nameEl.classList.remove('input-invalid');
        }, { once: true });
        return;
      }

      // build frequency from form
      var fsel = document.getElementById('habit-frequency').value;
      var freqObj = { type: fsel, daysOfWeek: [], timesPerWeek: 3 };
      if (fsel === 'daysOfWeek') {
        var chosen = [];
        freqExtra.querySelectorAll('[data-new-dow]').forEach(function (btn){
          if (btn.classList.contains('primary')) chosen.push(Number(btn.dataset.newDow));
        });
        freqObj.daysOfWeek = chosen;
      } else if (fsel === 'timesPerWeek') {
        var tpw = Number(document.getElementById('new-tpw') ? document.getElementById('new-tpw').value : 3);
        if (!tpw || tpw < 1) tpw = 1;
        if (tpw > 7) tpw = 7;
        freqObj.timesPerWeek = tpw;
      }

      var startDateValue = newStartInput
        ? convertDisplayToISO(newStartInput.value, CURRENTYEAR)
        : defaultStartDateForYear(CURRENTYEAR);
      var h = newHabit(name, newSelectedAccent, newSelectedIcon, startDateValue);
      h.frequency = freqObj;

      // Read dailyTarget from form
      var dailyTargetEl = document.getElementById('habit-daily-target');
      var dailyTarget = dailyTargetEl ? Number(dailyTargetEl.value) : 1;
      if (!dailyTarget || dailyTarget < 1) dailyTarget = 1;
      if (dailyTarget > 99) dailyTarget = 99;
      h.dailyTarget = dailyTarget;

      applyFrequencyToHabit(h);

      HABITS.unshift(h);
      saveHabits(HABITS);
      render();
      announce('Habit created');
      newHabitOverlay.close();
      document.getElementById('new-habit-form').reset();
      if (newStartInput) {
        newStartInput.value = isoToDisplay(defaultStartDateForYear(CURRENTYEAR), CURRENTYEAR);
      }
      freqExtra.style.display = 'none';
      freqExtra.innerHTML = '';
      var card = listEl.querySelector('.card');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* edit flow */
    var editSelectedAccent = PRESETCOLORS[0];
    var editSelectedIcon = 'target';
    var editFreqSelect = document.getElementById('edit-habit-frequency');
    var editFreqExtra = document.getElementById('edit-freq-extra');

    editFreqSelect.addEventListener('change', function () {
      var val = editFreqSelect.value;
      if (val === 'daysOfWeek') {
        editFreqExtra.style.display = 'block';
        editFreqExtra.innerHTML = renderWeekdayButtons('edit', [1,3,5]);
      } else if (val === 'timesPerWeek') {
        editFreqExtra.style.display = 'block';
        editFreqExtra.innerHTML = renderTimesPerWeek('edit', 3);
      } else {
        editFreqExtra.style.display = 'none';
        editFreqExtra.innerHTML = '';
      }
    });

    // click weekdays in edit
    editFreqExtra.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-edit-dow]');
      if (!btn) return;
      btn.classList.toggle('primary');
    });

    function openEditOverlay(h){
      document.getElementById('edit-habit-id').value = h.id;
      document.getElementById('edit-habit-name').value = h.name;
      editSelectedAccent = h.accent;
      editSelectedIcon = h.visualValue || 'target';
      renderPreview('edit', editSelectedIcon, editSelectedAccent);
      if (editStartInput) {
        // Preserve original startDate without clamping to viewed year
        var originalStartDate = h.startDate || h.createdAt;
        editStartInput.value = isoToDisplayUnclamped(originalStartDate, CURRENTYEAR);
      }

      // prefill frequency
      var freq = h.frequency || defaultFrequency();
      editFreqSelect.value = freq.type;
      if (freq.type === 'daysOfWeek') {
        editFreqExtra.style.display = 'block';
        editFreqExtra.innerHTML = renderWeekdayButtons('edit', freq.daysOfWeek || []);
      } else if (freq.type === 'timesPerWeek') {
        editFreqExtra.style.display = 'block';
        editFreqExtra.innerHTML = renderTimesPerWeek('edit', freq.timesPerWeek || 3);
      } else {
        editFreqExtra.style.display = 'none';
        editFreqExtra.innerHTML = '';
      }

      // prefill dailyTarget
      var dailyTargetEl = document.getElementById('edit-habit-daily-target');
      if (dailyTargetEl) {
        dailyTargetEl.value = h.dailyTarget || 1;
      }

      editHabitOverlay.open();
    }
    document.getElementById('edit-sheet-close').addEventListener('click', function (){ editHabitOverlay.close(); });
    document.getElementById('edit-sheet-cancel').addEventListener('click', function (){ editHabitOverlay.close(); });

    // Clear All / Reset History Button
    var editResetBtn = document.getElementById('edit-reset-btn');
    if (editResetBtn) {
      editResetBtn.addEventListener('click', async function() {
        var id = document.getElementById('edit-habit-id').value;
        var habit = HABITS.find(function(h) { return h.id === id; });
        if (!habit) {
          return;
        }

        // 1. Confirm with the user
        var confirmed = await showConfirm(
          'Reset Habit',
          'Are you sure you want to reset "' + habit.name + '"? This will delete the habit and create a new one with the same settings. This cannot be undone.'
        );

        if (confirmed) {
          // 2. Store habit properties before deletion
          var habitName = habit.name;
          var habitAccent = habit.accent;
          var habitIcon = habit.visualValue;
          var habitStartDate = habit.startDate;
          var habitFrequency = habit.frequency;
          var habitDailyTarget = habit.dailyTarget;
          var habitIndex = HABITS.findIndex(function(h) { return h.id === id; });

          // 3. Remove old habit
          if (habitIndex !== -1) {
            HABITS.splice(habitIndex, 1);
          }

          // 4. Create new habit with same properties
          var newHabitObj = newHabit(habitName, habitAccent, habitIcon, habitStartDate);
          newHabitObj.frequency = habitFrequency;
          newHabitObj.dailyTarget = habitDailyTarget || 1;
          applyFrequencyToHabit(newHabitObj);

          // 5. Insert at the same position or at the top
          HABITS.splice(habitIndex, 0, newHabitObj);

          // 6. Save and Render
          await saveHabits(HABITS);
          render();
          announce('Habit reset');

          // Optional: Close the modal after resetting
          editHabitOverlay.close();
        }
      });
    }
    document.getElementById('edit-preview-btn').addEventListener('click', async function (){
      var res = await openIconColorPicker(editSelectedIcon, editSelectedAccent);
      if (res) {
        editSelectedIcon = res.icon;
        editSelectedAccent = res.color;
        renderPreview('edit', editSelectedIcon, editSelectedAccent);
      }
    });
    document.getElementById('edit-habit-form').addEventListener('submit', function (e){
      e.preventDefault();
      var id = document.getElementById('edit-habit-id').value;
      var habit = HABITS.find(function (h){ return h.id === id; });
      if (!habit) return;
      var nameEl = document.getElementById('edit-habit-name');
      var name = nameEl.value.trim();
      if (!name){
        nameEl.classList.add('input-invalid');
        nameEl.addEventListener('animationend', function (){
          nameEl.classList.remove('input-invalid');
        }, { once: true });
        return;
      }
      habit.name = name;
      habit.accent = editSelectedAccent;
      habit.visualType = 'icon';
      habit.visualValue = editSelectedIcon;

      // Validate and set start date
      if (editStartInput) {
        var newStartDateISO = convertDisplayToISOUnclamped(editStartInput.value || habit.startDate, CURRENTYEAR);
        var newStartDate = parseDateValue(newStartDateISO);

        if (newStartDate && !isNaN(newStartDate)) {
          var today = new Date();
          today.setHours(0, 0, 0, 0);

          // Check if new start date is in the future
          if (newStartDate > today) {
            // Check if habit has any existing completions in current year
            var hasCompletions = habit.dots && habit.dots.some(function(dot) { return dot > 0; });

            // Also check historical years for completions
            if (!hasCompletions && habit.yearHistory) {
              for (var yr in habit.yearHistory) {
                if (habit.yearHistory[yr].dots && habit.yearHistory[yr].dots.some(function(dot) { return dot > 0; })) {
                  hasCompletions = true;
                  break;
                }
              }
            }

            if (hasCompletions) {
              // Invalid: can't set future start date if habit has completions
              editStartInput.classList.add('input-invalid');
              editStartInput.addEventListener('animationend', function (){
                editStartInput.classList.remove('input-invalid');
              }, { once: true });
              announce('Cannot set future start date for habit with existing completions');
              return;
            }
          }

          // Additional validation: Check if new start date invalidates existing completions
          var newStartYear = newStartDate.getFullYear();
          var oldStartDate = parseDateValue(habit.startDate);
          var oldStartYear = oldStartDate ? oldStartDate.getFullYear() : newStartYear;

          // If moving start date LATER (forward in time), check if it invalidates existing completions
          if (newStartDate > oldStartDate) {
            // Check if there are completions between old start date and new start date
            var hasInvalidatedCompletions = false;

            // Check all years for completions that would become invalid
            var yearsToCheck = [habit.year];
            if (habit.yearHistory) {
              for (var yr in habit.yearHistory) {
                yearsToCheck.push(parseInt(yr));
              }
            }

            for (var i = 0; i < yearsToCheck.length; i++) {
              var checkYear = yearsToCheck[i];
              var checkDots = checkYear === habit.year ? habit.dots : (habit.yearHistory && habit.yearHistory[checkYear] ? habit.yearHistory[checkYear].dots : null);

              if (checkDots && checkYear >= oldStartYear && checkYear <= newStartYear) {
                // Calculate indices for this year
                var yearStart = new Date(checkYear, 0, 1);

                for (var dayIdx = 0; dayIdx < checkDots.length; dayIdx++) {
                  if (checkDots[dayIdx]) {
                    var dayDate = new Date(checkYear, 0, 1 + dayIdx);

                    // If this completion is after old start but before new start, it's invalid
                    if (dayDate >= oldStartDate && dayDate < newStartDate) {
                      hasInvalidatedCompletions = true;
                      break;
                    }
                  }
                }
              }

              if (hasInvalidatedCompletions) break;
            }

            if (hasInvalidatedCompletions) {
              editStartInput.classList.add('input-invalid');
              editStartInput.addEventListener('animationend', function (){
                editStartInput.classList.remove('input-invalid');
              }, { once: true });
              announce('Cannot move start date forward - would invalidate existing completions');
              return;
            }
          }

          habit.startDate = newStartDateISO;

          // If start date changed, the year wheel needs to be reinitialized
          // to update the minSelectableYear (will happen on render())
        }
      }

      // read frequency from edit form
      var fsel = document.getElementById('edit-habit-frequency').value;
      var freqObj = { type: fsel, daysOfWeek: [], timesPerWeek: 3 };
      if (fsel === 'daysOfWeek') {
        var chosen = [];
        editFreqExtra.querySelectorAll('[data-edit-dow]').forEach(function (btn){
          if (btn.classList.contains('primary')) chosen.push(Number(btn.dataset.editDow));
        });
        freqObj.daysOfWeek = chosen;
      } else if (fsel === 'timesPerWeek') {
        var tpw = Number(document.getElementById('edit-tpw') ? document.getElementById('edit-tpw').value : 3);
        if (!tpw || tpw < 1) tpw = 1;
        if (tpw > 7) tpw = 7;
        freqObj.timesPerWeek = tpw;
      }
      habit.frequency = freqObj;

      // Read dailyTarget from edit form
      var dailyTargetEl = document.getElementById('edit-habit-daily-target');
      var dailyTarget = dailyTargetEl ? Number(dailyTargetEl.value) : 1;
      if (!dailyTarget || dailyTarget < 1) dailyTarget = 1;
      if (dailyTarget > 99) dailyTarget = 99;
      habit.dailyTarget = dailyTarget;

      applyFrequencyToHabit(habit);

      // Update disabled state of dots if start date changed
      // This may clear some dot states, so do it before saving
      updateDotsDisabledState(habit);

      saveHabits(HABITS);
      render();
      announce('Habit saved');
      editHabitOverlay.close();
    });

    document.getElementById('btn-delete').addEventListener('click', async function (){
      var id = document.getElementById('edit-habit-id').value;
      var habit = HABITS.find(function (h){ return h.id === id; });
      if (!habit) return;
      var ok = await openConfirmModal({
        title: 'Delete habit',
        message: 'Are you sure you want to delete "' + habit.name + '"? This action cannot be undone.',
        confirmText: 'Delete',
        variant: 'danger'
      });
      if (!ok) return;
      var idx = HABITS.findIndex(function (h){ return h.id === id; });
      if (idx === -1) return;
      var removed = HABITS.splice(idx, 1);
      saveHabits(HABITS);
      render();
      announce('Habit deleted');
      showUndoToast(removed);
      editHabitOverlay.close();
    });

    /* picker */
    var ipLoaded = false;
    function loadIconsOnce(){
      if (ipLoaded) return Promise.resolve();
      return fetch('https://cdn.jsdelivr.net/npm/@tabler/icons@latest/icons.json')
        .then(function (r){ return r.json(); })
        .then(function (json){
          var names = Object.keys(json).sort();
          ipState.allIcons = names.map(function (n){ return { name: n, category: n.split('-')[0] || 'other' }; });
          ipLoaded = true;
        })
        .catch(function (){
          ipState.allIcons = ['activity','alert-circle','home','user','settings','target','book','run','dumbbell'].map(function (n){ return { name: n, category: n.split('-')[0] || 'other' }; });
          ipLoaded = true;
        });
    }
    function ipBuildCategories(){
      if (ipEls.cats) {
        ipEls.cats.innerHTML = '';
        ipEls.cats.style.display = 'none';
      }
    }
    function ipApplyFilter(){
      var q = ipState.searchQuery.toLowerCase();
      ipState.filteredIcons = ipState.allIcons.filter(function (ic){ return ic.name.toLowerCase().includes(q); });
      ipBuildCategories();
      ipRenderIcons(true);
    }
    function ipRenderColors(){
      ipEls.colors.innerHTML = ipPalette.map(function (c){
        var active = ipState.selectedColor === c;
        return '<button type="button" data-color="' + c + '" class="picker-color-swatch" style="background:' + c + (active ? '; outline:2px solid var(--icon-selected); outline-offset:2px' : '') + '"></button>';
      }).join('');
      Array.prototype.forEach.call(ipEls.colors.querySelectorAll('button'), function (btn){
        btn.onclick = function (){
          var c = btn.dataset.color;
          var safe = clampColorToMode(c, document.documentElement.classList.contains('dark'));
          ipState.selectedColor = safe;
          document.documentElement.style.setProperty('--icon-selected', safe);
          document.documentElement.style.setProperty(
            '--icon-selected-bg',
            document.documentElement.classList.contains('dark') ? 'rgba(228,228,231,.08)' : 'rgba(30,41,59,.12)'
          );
          ipEls.customColor.value = safe;
          ipEls.colorPreview.style.backgroundColor = safe;
          ipRenderColors();
          ipRecolorVisible();
        }
      });
    }
    function setupIconObserver(){
      if (ipState.observer) return;
      ipState.observer = new IntersectionObserver(function (entries){
        for (var i=0;i<entries.length;i++){
          var entry = entries[i];
          if (entry.isIntersecting){
            ipRenderIcons(false);
            ipState.observer.unobserve(entry.target);
          }
        }
      }, { root: ipEls.scroll, rootMargin: '150px', threshold: 0 });
    }
    function ipRenderIcons(reset){
      if (reset) {
        ipState.renderOffset = 0;
        ipEls.icons.innerHTML = '';
      }
      var batch = ipState.filteredIcons.slice(ipState.renderOffset, ipState.renderOffset + ipState.renderBatch);
      if (!batch.length) {
        if (!ipState.renderOffset) {
          ipEls.empty.classList.remove('hidden');
          ipEls.icons.classList.add('hidden');
        }
        return;
      }
      ipEls.empty.classList.add('hidden');
      ipEls.icons.classList.remove('hidden');
      var frag = document.createDocumentFragment();
      batch.forEach(function (ic){
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'picker-icon-btn-entry';
        if (ipState.selectedIcon === ic.name) btn.classList.add('is-selected');
        btn.dataset.icon = ic.name;
        btn.innerHTML = '<i class="ti ti-' + ic.name + '"></i>';
        btn.onclick = function (){
          ipState.selectedIcon = ic.name;
          ipEls.select.disabled = false;
          Array.prototype.forEach.call(ipEls.icons.querySelectorAll('.is-selected'), function (x){
            x.classList.remove('is-selected');
          });
          btn.classList.add('is-selected');
        }
        frag.appendChild(btn);
      });
      ipEls.icons.appendChild(frag);
      ipState.renderOffset += ipState.renderBatch;
      if (ipState.renderOffset < ipState.filteredIcons.length) {
        var sentinel = document.createElement('div');
        sentinel.style.height = '1px';
        ipEls.icons.appendChild(sentinel);
        ipState.observer.observe(sentinel);
      }
    }
    function ipRecolorVisible(){
      Array.prototype.forEach.call(ipEls.icons.querySelectorAll('.picker-icon-btn-entry'), function (btn){
        var icon = btn.dataset.icon;
        if (ipState.selectedIcon === icon) {
          btn.style.color = ipState.selectedColor;
        } else {
          btn.style.color = '';
        }
      });
    }
    function ipSetup(){
      ipRenderColors();
      ipEls.customColor.value = ipState.selectedColor;
      ipEls.colorPreview.style.backgroundColor = ipState.selectedColor;
      ipEls.customColor.oninput = debounce(function (){
        var val = ipEls.customColor.value.trim();
        if (!/^#?[0-9A-Fa-f]{6}$/.test(val)) return;
        if (val.charAt(0) !== '#') val = '#' + val;
        var safe = clampColorToMode(val, document.documentElement.classList.contains('dark'));
        ipState.selectedColor = safe;
        document.documentElement.style.setProperty('--icon-selected', safe);
        document.documentElement.style.setProperty(
          '--icon-selected-bg',
          document.documentElement.classList.contains('dark') ? 'rgba(228,228,231,.08)' : 'rgba(30,41,59,.12)'
        );
        ipEls.colorPreview.style.backgroundColor = safe;
        ipRenderColors();
        ipRecolorVisible();
      }, 300);
      ipEls.search.oninput = debounce(function (){
        ipState.searchQuery = ipEls.search.value.trim();
        ipApplyFilter();
      }, 200);
      ipEls.density.disabled = true;
      ipEls.density.style.opacity = '0.5';
      ipEls.density.style.cursor = 'not-allowed';
      ipEls.close.onclick = function (){
        if (ipState.resolver) ipState.resolver(null);
        pickerOverlay.close();
      };
      ipEls.cancel.onclick = function (){
        if (ipState.resolver) ipState.resolver(null);
        pickerOverlay.close();
      };
      ipEls.select.onclick = function (){
        if (ipState.resolver) {
          ipState.resolver({ icon: ipState.selectedIcon, color: ipState.selectedColor });
        }
        pickerOverlay.close();
      };
    }
    async function openIconColorPicker(initialIcon, initialColor){
      await loadIconsOnce();
      setupIconObserver();
      ipState.selectedIcon = initialIcon || 'target';
      ipState.selectedColor = clampColorToMode(initialColor || '#1e293b', document.documentElement.classList.contains('dark'));
      ipState.searchQuery = '';
      ipState.selectedCategory = 'All';
      document.documentElement.style.setProperty('--icon-selected', ipState.selectedColor);
      document.documentElement.style.setProperty(
        '--icon-selected-bg',
        document.documentElement.classList.contains('dark') ? 'rgba(228,228,231,.08)' : 'rgba(30,41,59,.12)'
      );
      ipSetup();
      ipApplyFilter();
      var selected = ipEls.icons.querySelector('.picker-icon-btn-entry[data-icon="' + ipState.selectedIcon + '"]');
      if (selected) selected.scrollIntoView({ behavior:'smooth', block:'center' });
      pickerOverlay.open();
      ipEls.select.disabled = false;
      return new Promise(function (resolve){
        ipState.resolver = resolve;
      });
    }

    /* undo */
    var undoToast = document.getElementById('undo-toast');
    var undoTrigger = undoToast ? undoToast.querySelector('[data-undo-trigger]') : null;
    var undoMessage = undoToast ? undoToast.querySelector('[data-undo-message]') : null;
    var undoProgress = undoToast ? undoToast.querySelector('.toast-progress div') : null;
    var undoData = null;
    var undoTimer = null;
    function showUndoToast(removed){
      if (!undoToast) return;
      undoData = removed;
      if (undoMessage && removed && removed.length) {
        undoMessage.textContent = 'Deleted "' + removed[0].name + '"';
      }
      undoToast.classList.add('show');
      if (undoProgress) {
        undoProgress.style.transitionDuration = '0ms';
        undoProgress.style.transform = 'scaleX(1)';
        requestAnimationFrame(function (){
          requestAnimationFrame(function (){
            undoProgress.style.transitionDuration = '10000ms';
            undoProgress.style.transform = 'scaleX(0)';
          });
        });
      }
      clearTimeout(undoTimer);
      undoTimer = setTimeout(function (){
        undoToast.classList.remove('show');
        if (undoProgress) {
          undoProgress.style.transitionDuration = '0ms';
          undoProgress.style.transform = 'scaleX(0)';
        }
        undoData = null;
      }, 10000);
    }
    if (undoTrigger) {
      undoTrigger.addEventListener('click', function (){
        if (undoData) {
          HABITS.push.apply(HABITS, undoData);
          saveHabits(HABITS);
          render();
          announce('Habit restored');
          undoData = null;
        }
        undoToast.classList.remove('show');
        if (undoProgress) {
          undoProgress.style.transitionDuration = '0ms';
          undoProgress.style.transform = 'scaleX(0)';
        }
        clearTimeout(undoTimer);
      });
    }

    /* wave styles — UPDATED to keep disabled dots faded */
    var WAVE_STYLE_ID = 'dot-wave-style';
    var HAS_RUN_INITIAL_WAVE = false;

    function ensureWaveStyles() {
      if (document.getElementById(WAVE_STYLE_ID)) return;
      var s = document.createElement('style');
      s.id = WAVE_STYLE_ID;
      s.textContent = [
        '.dot-wave{animation:dotWave .42s cubic-bezier(0.4,0,0.2,1) both;}',
        '.dot-wave-active::before,.dot-wave[aria-pressed="true"]::before{animation:dotWaveInner .42s cubic-bezier(0.4,0,0.2,1) both;}',
        '.dot[aria-disabled="true"].dot-wave,.dot[aria-disabled="true"].dot-wave::before{opacity:.3!important;}',
        '@keyframes dotWave{0%{transform:scale(.4);opacity:0;}100%{transform:scale(1);opacity:1;}}',
        '@keyframes dotWaveInner{0%{transform:scale(.4);opacity:0;}100%{transform:scale(1);opacity:1;}}'
      ].join('');
      document.head.appendChild(s);
    }

    // wave applier
    function applyWave(dotsNodeList) {
      if (!dotsNodeList || !dotsNodeList.length) return;

      // Filter out disabled dots - they should not animate
      var enabledDots = Array.prototype.slice.call(dotsNodeList).filter(function(dot) {
        return !dot.getAttribute('aria-disabled');
      });

      var dots = enabledDots.map(function (dot, idx) {
        var rect = dot.getBoundingClientRect();
        return {
          el: dot,
          left: rect.left,
          top: rect.top,
          idx: idx
        };
      });

      dots.sort(function (a, b) {
        if (a.left === b.left) {
          return a.top - b.top;
        }
        return a.left - b.left;
      });

      dots.forEach(function (item, order) {
        var dot = item.el;
        var delay = order * 1;
        dot.style.animationDelay = delay + 'ms';
        dot.classList.add('dot-wave');

        if (dot.getAttribute('aria-pressed') === 'true') {
          dot.classList.add('dot-wave-active');
        }

        dot.addEventListener('animationend', function () {
          dot.classList.remove('dot-wave');
          dot.classList.remove('dot-wave-active');
          dot.style.removeProperty('animation-delay');
        }, { once: true });
      });
    }

    /* view toggle - synchronized card and dot animations */
    viewToggle.addEventListener('click', function (){
      var currentView = document.documentElement.dataset.view || 'year';
      var targetView = currentView === 'year' ? 'month' : 'year';

      var cards = listEl.querySelectorAll('.card');
      var contentHeights = [];

      // Step 1: Capture current heights and lock them
      cards.forEach(function(card) {
        var content = card.querySelector('.card-content');
        if (content) {
          var currentHeight = content.offsetHeight;
          contentHeights.push({ content: content, oldHeight: currentHeight });
          // Lock current height to prevent immediate change
          content.style.height = currentHeight + 'px';
        }
      });

      // Step 2: Clear old animation states to allow re-triggering
      var allDots = document.querySelectorAll('.dot');
      allDots.forEach(function(dot) {
        dot.style.animation = 'none';
        dot.style.animationDelay = '';
      });

      var allMonthContainers = document.querySelectorAll('.month-container');
      allMonthContainers.forEach(function(container) {
        container.style.animation = 'none';
      });

      // Force reflow to reset animations
      void document.body.offsetHeight;

      // Step 3: Toggle the view (this changes which containers are visible)
      document.documentElement.dataset.view = targetView;
      localStorage.setItem(VIEWKEY, targetView);
      updateViewToggleLabels(targetView);

      // Step 4: Wait for DOM to update, then prepare animations
      requestAnimationFrame(function() {
        // Set animation delays for the dots
        if (targetView === 'year') {
          var yearViewDots = document.querySelectorAll('.dots-grid-year-view .dot');
          yearViewDots.forEach(function(dot, index) {
            var delay = Math.min(index * 0.003, 1.0); // 3ms per dot, max 1s
            dot.style.animationDelay = delay + 's';
          });
        } else {
          var monthContainers = document.querySelectorAll('.months-container-month-view .month-container');
          monthContainers.forEach(function(container, monthIndex) {
            var monthDots = container.querySelectorAll('.dot');
            monthDots.forEach(function(dot, dotIndex) {
              var delay = dotIndex * 0.01; // 10ms per dot
              dot.style.animationDelay = delay + 's';
            });
          });
        }

        // Measure new heights (after view has changed)
        contentHeights.forEach(function(item) {
          var newHeight = item.content.scrollHeight;
          item.newHeight = newHeight;
        });

        // Step 5: Force another reflow to ensure heights are measured
        void document.body.offsetHeight;

        // Step 6: Trigger BOTH animations at exactly the same instant
        requestAnimationFrame(function() {
          // Set new heights to trigger CSS transition
          contentHeights.forEach(function(item) {
            item.content.style.height = item.newHeight + 'px';
          });

          // Enable dot animations at the same instant
          document.documentElement.classList.add('view-transitioning');
          allDots.forEach(function(dot) {
            dot.style.animation = '';
          });
          allMonthContainers.forEach(function(container) {
            container.style.animation = '';
          });

          // Step 7: Clean up after all animations complete
          setTimeout(function() {
            contentHeights.forEach(function(item) {
              item.content.style.height = '';
            });
            document.documentElement.classList.remove('view-transitioning');
          }, 1500);
        });
      });
    });

    function initCustomSelects(){
      var wrappers = document.querySelectorAll('[data-custom-select]');
      if (!wrappers.length) return;
      var openWrapper = null;
      var activeBackdrop = null;
      var activeSheet = null;

      wrappers.forEach(function (wrapper){
        var select = wrapper.querySelector('.custom-select-source');
        var display = wrapper.querySelector('[data-select-display]');
        var list = wrapper.querySelector('[data-select-options]');
        if (!select || !display || !list) return;

        function renderOptions(){
          list.innerHTML = '';
          Array.prototype.forEach.call(select.options, function (opt){
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'select-option';
            btn.textContent = opt.textContent;
            btn.dataset.value = opt.value;
            if (opt.selected) {
              btn.setAttribute('aria-selected', 'true');
            }
            list.appendChild(btn);
          });
        }

        function updateDisplay(){
          var selected = select.options[select.selectedIndex] || select.options[0];
          if (selected) {
            display.textContent = selected.textContent;
          }
          list.querySelectorAll('.select-option').forEach(function (node){
            var isSelected = node.dataset.value === select.value;
            node.setAttribute('aria-selected', isSelected ? 'true' : 'false');
          });
        }

        renderOptions();
        if (select.selectedIndex < 0 && select.options.length) {
          select.selectedIndex = 0;
        }
        updateDisplay();

        display.addEventListener('click', function (){
          if (wrapper.classList.contains('open')) {
            closeCustomSelect(wrapper);
          } else {
            if (list) list.scrollTop = 0;
            openCustomSelect(wrapper);
          }
        });

        list.addEventListener('click', function (event){
          var optionBtn = event.target.closest('.select-option');
          if (!optionBtn) return;
          var newValue = optionBtn.dataset.value;
          if (select.value !== newValue) {
            select.value = newValue;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
          updateDisplay();
          wrapper.classList.remove('open');
          openWrapper = null;
        });

        select.addEventListener('change', updateDisplay);
      });

      document.addEventListener('click', function (event){
        wrappers.forEach(function (wrapper){
          if (!wrapper.contains(event.target)) {
            closeCustomSelect(wrapper);
          }
        });
      });

      function openCustomSelect(wrapper){
        if (openWrapper && openWrapper !== wrapper) {
          closeCustomSelect(openWrapper);
        }
        wrapper.classList.add('open');
        openWrapper = wrapper;
        var sheet = wrapper.closest('.sheet');
        if (sheet) {
          activeSheet = sheet;
          sheet.classList.add('select-open');
          ensureSelectBackdrop(sheet);
        }
      }

      function closeCustomSelect(wrapper){
        if (!wrapper.classList.contains('open')) return;
        wrapper.classList.remove('open');
        if (openWrapper === wrapper) openWrapper = null;
        if (activeSheet && !activeSheet.querySelector('.select-control.open')) {
          activeSheet.classList.remove('select-open');
          removeSelectBackdrop();
        }
      }

      function ensureSelectBackdrop(sheet){
        removeSelectBackdrop();
        var backdrop = document.createElement('div');
        backdrop.className = 'select-backdrop';
        sheet.appendChild(backdrop);
        activeBackdrop = backdrop;
        requestAnimationFrame(function (){
          backdrop.classList.add('show');
        });
      }

      function removeSelectBackdrop(){
        if (activeBackdrop) {
          activeBackdrop.classList.remove('show');
          activeBackdrop.addEventListener('transitionend', function (){
            if (activeBackdrop && activeBackdrop.parentNode) {
              activeBackdrop.parentNode.removeChild(activeBackdrop);
            }
          }, { once: true });
          activeBackdrop = null;
        }
      }
    }

    /* sr announce */
    var srAnnouncer = document.createElement('div');
    srAnnouncer.className = 'visually-hidden';
    srAnnouncer.setAttribute('aria-live', 'polite');
    srAnnouncer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(srAnnouncer);
    function announce(msg){
      srAnnouncer.textContent = msg;
      setTimeout(function (){ srAnnouncer.textContent = ''; }, 1000);
    }

    /* Generate dynamic skeleton dots per screen size */
    function generateSkeletonDots() {
      // Helper to calculate dots per row based on container width
      function calculateDotsPerRow(containerWidth) {
        var dotSize = 24; // Approximate dot outer size
        var gap = 8; // Approximate gap
        return Math.floor(containerWidth / (dotSize + gap));
      }

      // Helper to generate dots with varied sizes and incomplete last row
      function generateDotsForGrid(grid, screenType) {
        grid.innerHTML = '';
        var containerWidth = grid.offsetWidth || (screenType === 'desktop' ? 800 : screenType === 'tablet' ? 600 : 400);
        var dotsPerRow = Math.max(10, calculateDotsPerRow(containerWidth));

        // Generate at least 5 rows, with last row ~60-70% filled
        var fullRows = 5;
        var lastRowFillPercent = 0.6 + Math.random() * 0.15; // 60-75%
        var lastRowDots = Math.floor(dotsPerRow * lastRowFillPercent);
        var totalDots = (fullRows * dotsPerRow) + lastRowDots;

        for (var i = 0; i < totalDots; i++) {
          var dot = document.createElement('span');
          // Randomly make ~30% of dots small
          var isSmall = Math.random() < 0.3;
          dot.className = (isSmall ? 'sk-dot-small' : 'sk-dot') + ' skeleton-shimmer';
          grid.appendChild(dot);
        }
      }

      // Desktop dots (>900px)
      var desktopGrids = document.querySelectorAll('.sk-dots-desktop');
      desktopGrids.forEach(function(grid) {
        generateDotsForGrid(grid, 'desktop');
      });

      // Tablet dots (640-900px)
      var tabletGrids = document.querySelectorAll('.sk-dots-tablet');
      tabletGrids.forEach(function(grid) {
        generateDotsForGrid(grid, 'tablet');
      });

      // Mobile dots (<640px)
      var mobileGrids = document.querySelectorAll('.sk-dots-mobile');
      mobileGrids.forEach(function(grid) {
        generateDotsForGrid(grid, 'mobile');
      });
    }

    // Call skeleton generation on load and resize
    if (typeof window !== 'undefined') {
      window.addEventListener('load', generateSkeletonDots);
      window.addEventListener('resize', debounce(generateSkeletonDots, 250));
    }

    /* init */
    async function initializeApp() {
      // Ensure skeleton loader is visible during authentication and data loading
      if (skeletonEl) {
        skeletonEl.hidden = false;
      }
      if (listEl) {
        listEl.hidden = true;
      }

      // For Firebase mode, wait for auth state to be ready
      if (typeof Auth !== 'undefined' && Auth.useFirebase) {
        await new Promise(function(resolve) {
          var unsubscribe = Auth.onAuthStateChanged(function(user) {
            if (user) {
              unsubscribe();
              resolve();
            }
          });
        });
      }

      // Load habits from storage (Firebase or localStorage)
      var loadedHabits = await loadHabits();
      HABITS = loadedHabits.map(rolloverIfNeeded);

      // Set initial view
      var initialView = getInitialView();
      document.documentElement.dataset.view = initialView;
      updateViewToggleLabels(initialView);

      // Render the UI (this will hide skeleton and show list)
      render();
      ensureWaveStyles();

      initCustomSelects();
    }

    /* ────────── Year Wheel Centering Fix ────────── */
    var yearWheelResizeObservers = {}; // Store resize observers for cleanup

    function centerSelectedYear(habitId, smooth) {
      // Batch reads and writes to prevent layout thrashing
      requestAnimationFrame(function() {
        // 1. Find the relevant elements for this specific habit's year wheel.
        var container = document.getElementById('year-wheel-' + habitId);
        if (!container) return; // Exit if the card isn't in the DOM

        var scrollArea = container.querySelector('.year-wheel-scroll');
        var selectedItem = container.querySelector('.year-item.selected');

        if (!scrollArea || !selectedItem) {
          // If we can't find the necessary elements, we can't proceed.
          return;
        }

        // 2. Batch all DOM reads together (before any writes)
        var scrollAreaWidth = scrollArea.offsetWidth;
        var selectedItemOffsetLeft = selectedItem.offsetLeft;
        var selectedItemWidth = selectedItem.offsetWidth;

        // The goal is to position the center of the selected item at the center of the scroll area.
        var scrollLeftTarget = selectedItemOffsetLeft - (scrollAreaWidth / 2) + (selectedItemWidth / 2);

        // 3. Perform DOM write after all reads are complete
        scrollArea.scrollTo({
          left: scrollLeftTarget,
          behavior: smooth === false ? 'instant' : 'smooth'
        });
      });
    }

    function setupDynamicCentering(habitId) {
      var container = document.getElementById('year-wheel-' + habitId);
      if (!container) return;

      var scrollArea = container.querySelector('.year-wheel-scroll');
      if (!scrollArea) return;

      // Clean up existing observer if any
      if (yearWheelResizeObservers[habitId]) {
        yearWheelResizeObservers[habitId].disconnect();
      }

      var resizeTimeout = null;
      var lastWidth = scrollArea.offsetWidth;

      // Create a new ResizeObserver to watch for size changes
      var resizeObserver = new ResizeObserver(function(entries) {
        var entry = entries[0];
        var currentWidth = entry.contentRect.width;

        // Only recenter if width actually changed
        if (Math.abs(currentWidth - lastWidth) > 1) {
          lastWidth = currentWidth;

          // Clear previous timeout
          if (resizeTimeout) {
            clearTimeout(resizeTimeout);
          }

          // Debounce the recentering
          resizeTimeout = setTimeout(function() {
            centerSelectedYear(habitId, false);
          }, 50);
        }
      });

      // Observe the scroll area for size changes
      resizeObserver.observe(scrollArea);

      // Also observe the card itself for width changes
      var card = container.closest('.card');
      if (card) {
        resizeObserver.observe(card);
      }

      // Store the observer for cleanup later
      yearWheelResizeObservers[habitId] = resizeObserver;

      // Store cleanup function
      if (!container._cleanupResize) {
        container._cleanupResize = function() {
          if (resizeTimeout) {
            clearTimeout(resizeTimeout);
          }
          if (yearWheelResizeObservers[habitId]) {
            yearWheelResizeObservers[habitId].disconnect();
            delete yearWheelResizeObservers[habitId];
          }
        };
      }
    }

    /* ────────── Individual Habit Year Wheel Initialization ────────── */
    var habitYearWheels = {}; // Store year wheel instances

    function initHabitYearWheel(habit) {
      var containerId = 'year-wheel-' + habit.id;
      var container = document.getElementById(containerId);

      if (!container) {
        return;
      }

      // Clean up existing wheel if it exists
      if (habitYearWheels[habit.id]) {
        // If you have a destroy method on YearWheel, call it here.
        // e.g., habitYearWheels[habit.id].destroy();
        delete habitYearWheels[habit.id];
      }

      // Clean up existing ResizeObserver for this habit
      if (yearWheelResizeObservers[habit.id]) {
        yearWheelResizeObservers[habit.id].disconnect();
        delete yearWheelResizeObservers[habit.id];
      }

      // Clean up container's cleanup function if it exists
      if (container._cleanupResize) {
        container._cleanupResize();
        container._cleanupResize = null;
      }

      // Function to create the year wheel
      function createYearWheel() {
        // Calculate the minimum year based on habit start date
        var habitStartDate = getHabitStartDate(habit);
        var minYear = 2000; // Default fallback

        if (habitStartDate && !isNaN(habitStartDate.getTime())) {
          minYear = habitStartDate.getFullYear();
        } else if (habit.createdAt) {
          // Fallback to createdAt if startDate is invalid
          var createdDate = parseDateValue(habit.createdAt);
          if (createdDate && !isNaN(createdDate.getTime())) {
            minYear = createdDate.getFullYear();
          }
        }

        var currentYear = new Date().getFullYear();
        var maxSelectableYear = currentYear; // Only allow up to current year
        var maxYear = Math.max(maxSelectableYear + 5, 2040); // Display range extends further

        // Ensure the habit's current year is within the range
        if (habit.year < minYear) {
          habit.year = minYear;
        }
        if (habit.year > maxSelectableYear) {
          habit.year = maxSelectableYear;
        }

        var yearWheel = new YearWheel(containerId, {
          startYear: minYear,
          endYear: maxYear,
          initialYear: habit.year,
          minSelectableYear: minYear,
          maxSelectableYear: maxSelectableYear,
          fadeColor: getComputedStyle(document.body).backgroundColor,
          onChange: function(selectedYear) {
            // The year we are navigating AWAY from
            var yearToSave = habit.year;

            // Determine the valid range for saving data
            var habitStartDate = getHabitStartDate(habit);

            // Robust check in case the start date is missing or invalid
            if (habitStartDate && !isNaN(habitStartDate.getTime())) {
              var startYear = habitStartDate.getFullYear();

              // ONLY save the data if the year we are leaving is within the valid range
              // (from its start year up to the current year)
              if (yearToSave >= startYear && yearToSave <= CURRENTYEAR) {
                if (!habit.yearHistory) habit.yearHistory = {};

                // Unconditionally save the state for the valid year we are leaving
                // This ensures any changes made are persistent
                habit.yearHistory[yearToSave] = {
                  dots: habit.dots.slice(),
                  offDays: habit.offDays.slice(),
                  notes: habit.notes.slice()
                };
              }
            }

            // Now, proceed to load the data for the newly selected year
            habit.year = selectedYear;
            habit.days = daysInYear(selectedYear);

            // Check if we have historical data for the new year
            if (habit.yearHistory && habit.yearHistory[selectedYear]) {
              // Restore historical data
              var history = habit.yearHistory[selectedYear];
              // Normalize dots to handle old boolean data (backwards compatibility)
              habit.dots = history.dots.map(function(v) {
                return typeof v === 'boolean' ? (v ? 1 : 0) : (typeof v === 'number' ? Math.max(0, Math.floor(v)) : 0);
              });
              habit.offDays = history.offDays.slice();
              habit.notes = history.notes.slice();
              // Mark stats as dirty since dots/offDays changed
              habit._dirtyStats = true;
            } else {
              // No historical data, create fresh arrays for this year
              habit.dots = new Array(habit.days).fill(0);
              habit.offDays = new Array(habit.days).fill(false);
              habit.notes = new Array(habit.days).fill('');

              // Apply the habit's frequency rules to the new, empty year
              if (habit.frequency) {
                applyFrequencyToHabit(habit); // This will mark as dirty
              } else {
                // No frequency to apply, but still mark dirty since arrays were replaced
                habit._dirtyStats = true;
              }
            }

            // Persist all changes to storage (Firebase or localStorage)
            saveHabits(HABITS);

            // Re-render the habit card with the new year's data
            updateHabitCardContent(habit);

            // After all data is updated, center the selected year in the view
            centerSelectedYear(habit.id, true);
          },
          animationSpeed: 300,
          fadePercent: 20,
          windowSize: 11,
          edgeMargin: 3
        });

        habitYearWheels[habit.id] = yearWheel;

        // Set up dynamic centering that responds to size changes
        setupDynamicCentering(habit.id);

        // Center the initial year after a brief delay to ensure everything is rendered
        setTimeout(function() {
          centerSelectedYear(habit.id, false);
        }, 150);
      }

      // Check if container already has dimensions (common on initial render)
      var currentWidth = container.offsetWidth || container.clientWidth;
      if (currentWidth > 0) {
        // Container already has dimensions, initialize immediately
        createYearWheel();
      } else {
        // Container doesn't have dimensions yet, wait for ResizeObserver
        var hasInitialized = false;
        var observer = new ResizeObserver(function(entries) {
          var entry = entries[0];

          // Only initialize once and when we have a stable width
          if (!hasInitialized && entry.contentRect.width > 0) {
            hasInitialized = true;
            createYearWheel();
            // Once initialized, we don't need to observe anymore
            observer.unobserve(container);
          }
        });

        // Start observing the container element
        observer.observe(container);
      }
    }

    function updateHabitCardContent(habit) {
      var card = document.querySelector('[data-habit-id="' + habit.id + '"]');
      if (!card) return;

      // Update stats
      var todayIdx = dayIndexForYear(habit.year);
      var stats = getHabitStats(habit);
      var completionRate = getCompletionRate(habit, stats);

      // Update subtitle stats
      var subtitle = card.querySelector('.card-subtitle');
      if (subtitle) {
        var startLabel = formatStartDateLabel(habit);
        subtitle.innerHTML =
          '<span class="stat-item">Total <span class="total-count">' + stats.total + '</span></span>' +
          '<span class="stat-item">Longest <span class="longest-streak">' + stats.longest + '</span></span>' +
          '<span class="stat-item">Current <span class="current-streak">' + stats.current + '</span></span>' +
          '<span class="stat-item">Rate <span class="completion-rate">' + completionRate + '%</span></span>' +
          '<span class="stat-item start-pill">Start <span class="start-date">' + startLabel + '</span></span>' +
          '<span class="stat-item frequency-pill">' + formatFrequency(habit.frequency) + '</span>';
      }

      // Update mark today button
      var markTodayBtn = card.querySelector('.mark-today-btn');
      if (markTodayBtn) {
        var isTodayMarked = habit.dots[todayIdx];
        if (isTodayMarked) {
          markTodayBtn.classList.add('marked');
        } else {
          markTodayBtn.classList.remove('marked');
        }
        markTodayBtn.setAttribute('aria-label', isTodayMarked ? 'Unmark today' : 'Mark today');
        markTodayBtn.setAttribute('title', isTodayMarked ? 'Unmark today' : 'Mark today');
      }

      // Update both year and month views (since both exist in DOM now)
      var yearGridContainer = card.querySelector('.dots-grid-year-view');
      if (yearGridContainer) {
        yearGridContainer.innerHTML = '';
        buildYearView(habit, yearGridContainer, todayIdx);
      }

      var monthGridContainer = card.querySelector('.months-container-month-view');
      if (monthGridContainer) {
        monthGridContainer.innerHTML = '';
        buildMonthViews(habit, monthGridContainer, todayIdx);
      }
    }

    // Start the app
    initializeApp().catch(function(error) {
    });
