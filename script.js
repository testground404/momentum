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

    function hexToRgbObj(hex) {
      var m = hex.replace('#','');
      var int = parseInt(m, 16);
      return { r: (int>>16)&255, g: (int>>8)&255, b: int&255 };
    }

    function channel(v) {
      v = v/255;
      return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
    }
    function luminance(hex) {
      var c = hexToRgbObj(hex);
      return 0.2126*channel(c.r) + 0.7152*channel(c.g) + 0.0722*channel(c.b);
    }
    function contrast(a, b) {
      var L1 = luminance(a), L2 = luminance(b);
      var light = Math.max(L1, L2), dark = Math.min(L1, L2);
      return (light+0.05)/(dark+0.05);
    }
    function mix(h1, h2, t) {
      var c1 = hexToRgbObj(h1), c2 = hexToRgbObj(h2);
      var r = Math.round(c1.r + (c2.r - c1.r)*t);
      var g = Math.round(c1.g + (c2.g - c1.g)*t);
      var b = Math.round(c1.b + (c2.b - c1.b)*t);
      return '#' + [r, g, b].map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    }
    function clampColorToMode(hex, isDark) {
      var bg = isDark ? '#18181b' : '#ffffff';
      var c = contrast(hex, bg);
      if (c >= 3) return hex;
      return isDark ? mix(hex, '#ffffff', 0.4) : mix(hex, '#000000', 0.4);
    }

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

    /* ────────── Date helpers ────────── */
    var now = new Date();
    var CURRENTYEAR = now.getFullYear();
    function isLeap(y){return (y%4===0 && y%100!==0) || (y%400===0);}
    function daysInYear(y){return isLeap(y) ? 366 : 365;}
    function startOfYear(y){return new Date(y,0,1);}
    function dayIndexForYear(y){
      if (y !== CURRENTYEAR) return daysInYear(y)-1;
      var todayNoTime = new Date(CURRENTYEAR, now.getMonth(), now.getDate());
      return Math.floor((todayNoTime - startOfYear(CURRENTYEAR))/86400000);
    }
    function fmt(d){
      return d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
    }

    function toDateInputValue(date) {
      if (!(date instanceof Date) || isNaN(date)) return '';
      var y = date.getFullYear();
      var m = String(date.getMonth() + 1).padStart(2, '0');
      var d = String(date.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + d;
    }

    function parseDateValue(value) {
      if (!value) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        var parts = value.split('-');
        var parsed = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return isNaN(parsed) ? null : parsed;
      }
      var dt = new Date(value);
      return isNaN(dt) ? null : dt;
    }

    function clampDateToYearBounds(date, year) {
      var safeYear = year || CURRENTYEAR;
      if (!(date instanceof Date) || isNaN(date)) return new Date(safeYear, 0, 1);
      if (date.getFullYear() < safeYear) return new Date(safeYear, 0, 1);
      if (date.getFullYear() > safeYear) return new Date(safeYear, 11, 31);
      return new Date(safeYear, date.getMonth(), date.getDate());
    }

    function sanitizeStartDateValue(value, year) {
      var parsed = parseDateValue(value);
      var clamped = clampDateToYearBounds(parsed || new Date(), year);
      return toDateInputValue(clamped);
    }

    function defaultStartDateForYear(year) {
      return sanitizeStartDateValue(toDateInputValue(new Date()), year);
    }

    function getHabitStartDate(habit) {
      if (!habit) return null;
      // Get the raw ISO string from the habit object
      var raw = habit.startDate || habit.createdAt;
      // Parse it into a true Date object
      var parsed = parseDateValue(raw);

      // If parsing fails for any reason, create a fallback date
      if (!parsed || isNaN(parsed)) {
          var creationYear = habit.createdAt ? new Date(habit.createdAt).getFullYear() : CURRENTYEAR;
          return new Date(creationYear, 0, 1);
      }

      // Return the real, unclamped start date
      return parsed;
    }

    function getHabitStartIndex(habit) {
      if (!habit) return 0;
      var viewYear = habit.year || CURRENTYEAR;
      var trueStartDate = getHabitStartDate(habit);
      if (!trueStartDate) return 0;
      var startYear = trueStartDate.getFullYear();

      // Case 1: Habit starts in future year (viewing past years)
      if (startYear > viewYear) {
        return daysInYear(viewYear);
      }

      // Case 2: Habit started in previous year (all dots available)
      if (startYear < viewYear) {
        return 0;
      }

      // Case 3: Same year - calculate specific day
      var idx = Math.floor((trueStartDate - startOfYear(viewYear)) / 86400000);
      return Math.max(0, idx);
    }

    function formatStartDateLabel(habit) {
      var d = getHabitStartDate(habit);
      if (!d) return 'N/A';
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function toDisplayDateValue(date) {
      if (!(date instanceof Date) || isNaN(date)) return '';
      var dd = String(date.getDate()).padStart(2, '0');
      var mm = String(date.getMonth() + 1).padStart(2, '0');
      var yyyy = date.getFullYear();
      return dd + '-' + mm + '-' + yyyy;
    }

    function parseDisplayDateValue(value, fallbackYear) {
      if (!value) return null;
      var parts = value.trim().split(/[-/]/);
      if (parts.length !== 3) return null;
      var day = Number(parts[0]);
      var month = Number(parts[1]) - 1;
      var year = Number(parts[2]);
      if (!year || String(year).length !== 4) year = fallbackYear || CURRENTYEAR;
      if (!day || !isFinite(day) || !month || !isFinite(month)) return null;
      var parsed = new Date(year, month, day);
      if (isNaN(parsed) || parsed.getDate() !== day || parsed.getMonth() !== month) return null;
      return parsed;
    }

    function convertDisplayToISO(value, year) {
      var parsed = parseDisplayDateValue(value, year) || new Date(year || CURRENTYEAR, 0, 1);
      var clamped = clampDateToYearBounds(parsed, year);
      return toDateInputValue(clamped);
    }

    // Unclamped version - preserves original date across years
    function convertDisplayToISOUnclamped(value, fallbackYear) {
      var parsed = parseDisplayDateValue(value, fallbackYear);
      if (!parsed || isNaN(parsed)) {
        return toDateInputValue(new Date(fallbackYear || CURRENTYEAR, 0, 1));
      }
      return toDateInputValue(parsed);
    }

    function isoToDisplay(value, year) {
      var parsed = parseDateValue(value) || new Date(year || CURRENTYEAR, 0, 1);
      var clamped = clampDateToYearBounds(parsed, year || CURRENTYEAR);
      return toDisplayDateValue(clamped);
    }

    // Unclamped version - preserves original date across years
    function isoToDisplayUnclamped(value, fallbackYear) {
      var parsed = parseDateValue(value);
      if (!parsed || isNaN(parsed)) {
        return toDisplayDateValue(new Date(fallbackYear || CURRENTYEAR, 0, 1));
      }
      return toDisplayDateValue(parsed);
    }

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
        console.error('Error loading habits:', e);
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
        console.warn('Save failed', e);
      } finally {
        saveQueued = false;
      }
    }
    function uid(){
      return "h" + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
    }

    /* frequency helpers (NEW) */
    function defaultFrequency() {
      return {
        type: 'daily',
        daysOfWeek: [],
        timesPerWeek: 3
      };
    }

    /* create habit with frequency */
    function newHabit(name, accent, value, startDateValue){
      var year = CURRENTYEAR;
      var days = daysInYear(year);
      var startDate = sanitizeStartDateValue(startDateValue, year);
      var h = {
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

    /* normalize now also ensures frequency */
    function normalizeHabit(h){
      if (!h || typeof h !== 'object') return null;
      var id = h.id;
      var name = h.name;
      var visualValue = h.visualValue;
      var year = h.year;
      var accent = h.accent;
      var dots = h.dots;
      var offDays = h.offDays;
      var notes = h.notes;
      var frequency = h.frequency;

      if (!id) id = uid();
      if (!name) name = 'Habit';
      if (!visualValue || typeof visualValue !== 'string') visualValue = 'target';
      if (!year) year = CURRENTYEAR;
      var expected = daysInYear(year);
      if (!accent || typeof accent !== 'string') accent = '#3d85c6';
      if (!Array.isArray(dots) || dots.length !== expected) dots = new Array(expected).fill(false);
      if (!Array.isArray(offDays) || offDays.length !== expected) offDays = new Array(expected).fill(false);
      if (!Array.isArray(notes) || notes.length !== expected) notes = new Array(expected).fill('');
      if (!frequency || typeof frequency !== 'object') frequency = defaultFrequency();

      // Preserve original startDate without clamping to year
      var startDate = h.startDate || h.createdAt || toDateInputValue(new Date(year,0,1));

      // Initialize historical data storage if not present
      var yearHistory = h.yearHistory || {};

      var habit = {
        id: id,
        name: String(name),
        visualType: 'icon',
        visualValue: visualValue,
        year: year,
        days: expected,
        dots: dots.map(Boolean),
        offDays: offDays.map(Boolean),
        notes: notes.map(function(v){ return typeof v === 'string' ? v : ''; }),
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

    /* when year rolls to new year, rebuild offDays from frequency */
    function rolloverIfNeeded(h){
      // Initialize yearHistory if not present
      if (!h.yearHistory) h.yearHistory = {};

      if (h.year !== CURRENTYEAR){
        // PRESERVE historical data before rolling over
        var oldYear = h.year;
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
        // REMOVED: Don't modify startDate - it's the habit's creation date
        if (!h.frequency) h.frequency = defaultFrequency();
        applyFrequencyToHabit(h);
      } else {
        // same year but maybe no frequency
        if (!h.frequency) h.frequency = defaultFrequency();
        if (!h.startDate) {
          h.startDate = defaultStartDateForYear(h.year);
        }
        // REMOVED: Don't sanitize existing startDate
        applyFrequencyToHabit(h);
      }
      return h;
    }

    /* apply frequency rules to offDays (NEW) */
    function applyFrequencyToHabit(habit) {
      var year = habit.year;
      var totalDays = habit.days;
      var freq = habit.frequency || defaultFrequency();

      var newOff = new Array(totalDays).fill(false);

      if (freq.type === 'daily') {
        // no extra offs
      } else if (freq.type === 'weekdays') {
        for (var i = 0; i < totalDays; i++) {
          var d = new Date(year, 0, 1 + i);
          var day = d.getDay();
          if (day === 0 || day === 6) {
            newOff[i] = true;
          }
        }
      } else if (freq.type === 'daysOfWeek') {
        var set = new Set(freq.daysOfWeek || []);
        for (var i = 0; i < totalDays; i++) {
          var d = new Date(year, 0, 1 + i);
          var day = d.getDay();
          if (!set.has(day)) {
            newOff[i] = true;
          }
        }
      } else if (freq.type === 'timesPerWeek') {
        var target = freq.timesPerWeek || 3;
        // simple heuristic: if target >=5, weekends off
        if (target >= 5) {
          for (var i = 0; i < totalDays; i++) {
            var d = new Date(year, 0, 1 + i);
            var day = d.getDay();
            if (day === 0 || day === 6) {
              newOff[i] = true;
            }
          }
        } else {
          // leave all days on; user can right-click to mark off
        }
      }

      // don't hide days the user already completed
      for (var j = 0; j < totalDays; j++) {
        if (habit.dots[j]) {
          newOff[j] = false;
        }
      }

      habit.offDays = newOff;
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
      const confirmed = await Utils.showConfirm(
        'Confirm Logout',
        'Are you sure you want to log out?'
      );

      if (confirmed) {
        await Auth.logout();
        window.location.href = 'index.html';
      }
    }

    async function handleDeleteAccountAction() {
      const confirmed = await Utils.showConfirm(
        'Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.'
      );

      if (confirmed) {
        try {
          const username = Auth.getCurrentUser();
          const cleared = await Storage.clearUserData();
          const deleted = await Auth.deleteAccount(username);

          if (cleared && deleted) {
            await Utils.showAlert('Success', 'Your account has been deleted.');
            window.location.href = 'index.html';
          } else {
            await Utils.showAlert('Error', 'Error deleting account. Please try again.');
          }
        } catch (error) {
          console.error('Account deletion error:', error);
          await Utils.showAlert('Error', 'Error deleting account. Please try again.');
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
      console.log('Set progress bar scaleX to:', scale.toFixed(4), '(' + percentage.toFixed(2) + '%)');
    }

    function updateYearBanner() {
      if (!yearBanner) {
        console.error('ERROR: yearBanner element not found!');
        return;
      }

      var y = CURRENTYEAR;
      var today = Math.min(dayIndexForYear(y)+1, daysInYear(y));
      var total = daysInYear(y);
      var completionPercentage = (today / total) * 100;

      console.log('=== YEAR BANNER DEBUG ===');
      console.log('Year:', y);
      console.log('Today (day of year):', today);
      console.log('Total days:', total);
      console.log('Completion percentage:', completionPercentage.toFixed(2) + '%');

      yearBanner.innerHTML =
        '<span class="yb-label">Year</span> <span class="yb-value">' + y + '</span>' +
        ' • ' +
        '<span class="yb-label">Days</span> <span class="yb-value">' + today + '/' + total + '</span>';

      // Animate fill on first load
      if (!hasAnimatedYearBanner) {
        hasAnimatedYearBanner = true;
        console.log('First load - animating from 0% to', completionPercentage.toFixed(2) + '%');

        // Start at 0%
        setProgressBarScale(0);

        // Animate to actual percentage after a brief delay
        setTimeout(function() {
          setProgressBarScale(completionPercentage);
          console.log('Animation started - smooth GPU-accelerated transition');

          // Verify after animation
          setTimeout(function() {
            var beforeStyle = getComputedStyle(yearBanner, '::before');
            console.log('Verification - ::before transform:', beforeStyle.transform);
            console.log('Verification - ::before background:', beforeStyle.background);
            console.log('Verification - ::before opacity:', beforeStyle.opacity);
          }, 1300);
        }, 100);
      } else {
        // Direct update for subsequent calls
        console.log('Direct update to', completionPercentage.toFixed(2) + '%');
        setProgressBarScale(completionPercentage);
      }
      console.log('=========================');
    }

    function dotTitle(habit, index, baseLabel, isToday) {
      var parts = [baseLabel];
      if (isToday) parts.push('(Today)');
      if (habit.offDays[index]) parts.push('Off day');
      var note = habit.notes && habit.notes[index] ? habit.notes[index].trim() : '';
      if (note) parts.push('Note: ' + note);
      return parts.join(' • ');
    }

    /* frequency -> text for card (NEW) */
    function formatFrequency(freq) {
      if (!freq) return 'Daily';
      if (freq.type === 'daily') return 'Daily';
      if (freq.type === 'weekdays') return 'Weekdays';
      if (freq.type === 'daysOfWeek') {
        var names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        var arr = (freq.daysOfWeek || []).map(function(i){ return names[i]; });
        return arr.length ? arr.join(', ') : 'Specific days';
      }
      if (freq.type === 'timesPerWeek') return (freq.timesPerWeek || 3) + '×/week';
      return 'Daily';
    }

    /* compute completion rate ignoring offdays (UPDATED) */
    function getCompletionRate(habit, stats) {
      var todayIdx = dayIndexForYear(habit.year);
      var elapsed = (habit.year === CURRENTYEAR) ? (todayIdx + 1) : habit.days;
      var startIndex = getHabitStartIndex(habit);
      if (elapsed <= startIndex) return 0;
      var eligible = 0;
      var completed = 0;
      for (var i = startIndex; i < elapsed; i++) {
        if (!habit.offDays[i]) {
          eligible++;
          if (habit.dots[i]) completed++;
        }
      }
      if (eligible === 0) return 0;
      return Math.round((completed / eligible) * 100);
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
          var todayIdx = dayIndexForYear(habit.year);
          var stats = calcStats(habit.dots, habit.offDays, todayIdx);
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
     * Render a lightweight placeholder card for lazy loading
     */
    function renderPlaceholderCard(habit) {
      var wrap = document.createElement('section');
      wrap.className = 'card card-placeholder';
      wrap.dataset.habitId = habit.id;
      wrap.style.minHeight = '400px'; // Reserve space to prevent layout shift

      var acc = habit.accent || '#3d85c6';
      try {
        var rgb = hexToRgb(acc);
        wrap.style.setProperty('--accent-base', acc);
        wrap.style.setProperty('--accent-rgb', rgb);
        wrap.style.borderColor = 'rgba(' + rgb + ',0.1)';
      } catch (e){}

      // Create minimal header with just the title
      var header = document.createElement('div');
      header.className = 'card-header';

      var title = document.createElement('h2');
      title.className = 'card-title';
      title.style.opacity = '0.5';

      var visualEl = document.createElement('span');
      visualEl.className = 'habit-visual';

      var icon = document.createElement('i');
      icon.className = 'ti ti-' + (habit.visualValue || 'target');
      icon.style.color = acc;
      visualEl.appendChild(icon);

      var nameSpan = document.createElement('span');
      nameSpan.className = 'habit-name';
      nameSpan.textContent = habit.name;

      title.appendChild(visualEl);
      title.appendChild(nameSpan);
      header.appendChild(title);
      wrap.appendChild(header);

      // Add loading indicator
      var loadingDiv = document.createElement('div');
      loadingDiv.className = 'card-loading';
      loadingDiv.style.cssText = 'padding: 2rem; text-align: center; opacity: 0.3;';
      loadingDiv.textContent = 'Loading...';
      wrap.appendChild(loadingDiv);

      return wrap;
    }

    /**
     * Hydrate a placeholder card with full content
     */
    function hydrateCard(placeholderCard, habitId) {
      var habit = HABITS.find(function(h) { return h.id === habitId; });
      if (!habit) return;

      // Render full card
      var fullCard = renderHabitCard(habit);

      // Copy over the placeholder's position in DOM
      placeholderCard.parentNode.replaceChild(fullCard, placeholderCard);

      // Remove placeholder class
      fullCard.classList.remove('card-placeholder');

      // Initialize year wheel for the hydrated card
      requestAnimationFrame(function() {
        initHabitYearWheel(habit);
      });
    }

    function renderHabitCard(habit) {
      var todayIdx = dayIndexForYear(habit.year);
      var stats = calcStats(habit.dots, habit.offDays, todayIdx);
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
      var isTodayMarked = habit.dots[todayIdx];
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

      // Stagger with 35ms delay between each card
      setTimeout(function() {
        card.classList.add('card-enter-active');
        card.classList.remove('card-entering');
      }, index * 35);
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

        // IMPROVED: Wait for cards to be fully rendered before hiding skeleton
        requestAnimationFrame(function() {
          if (skeletonEl) skeletonEl.hidden = true;

          // 1. Make list visible FIRST
          listEl.hidden = false;

          // 2. Animate cards
          if (!hasAnimatedInitialLoad) {
            hasAnimatedInitialLoad = true;
            cardsToAnimate.forEach(function(card, index) {
              animateCard(card, index);
            });
          }

          // 3. Initialize Year Wheels NOW that elements have width
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

    function buildYearView(habit, container, todayIndex) {
      // Create a document fragment to minimize reflows
      var frag = document.createDocumentFragment();

      for (var i=0;i<habit.days;i++){
        var dot = document.createElement('div'); // CHANGED: button -> div
        dot.className = 'dot';
        dot.dataset.index = String(i);
        dot.dataset.habitId = habit.id;

        // Only render the visual state
        if (habit.dots[i]) {
          dot.setAttribute('aria-pressed', 'true'); // CSS styling hook
        }
        if (habit.offDays[i]) {
          dot.dataset.off = 'true';
        }
        if (habit.notes && habit.notes[i] && habit.notes[i].trim()) {
          dot.dataset.note = 'true';
        }

        // OPTIONAL: Highlight today visually, but it's not a button
        if (habit.year === CURRENTYEAR && i === todayIndex) {
          dot.setAttribute('aria-current', 'date');
        }

        frag.appendChild(dot);
      }
      container.appendChild(frag);
    }

    function buildMonthViews(habit, container, todayIndex) {
      var year = habit.year;
      var dayOfYearIndex = 0;

      for (var month=0; month<12; month++) {
        var monthContainer = document.createElement('div');
        monthContainer.className = 'month-container';
        var monthGrid = document.createElement('div');
        monthGrid.className = 'month-grid';

        var firstDateOfMonth = new Date(year, month, 1);
        var startingDayOfWeek = firstDateOfMonth.getDay();
        var daysInMonth = new Date(year, month+1, 0).getDate();

        // Add empty cells for alignment
        for (var i=0;i<startingDayOfWeek;i++){
          monthGrid.appendChild(document.createElement('div'));
        }

        // Create a document fragment for this month's days
        var frag = document.createDocumentFragment();
        for (var dayOfMonth=1; dayOfMonth<=daysInMonth; dayOfMonth++) {
          var dot = document.createElement('div'); // CHANGED: button -> div
          dot.className = 'dot';
          dot.dataset.index = String(dayOfYearIndex);
          dot.dataset.habitId = habit.id;

          // Only render the visual state
          if (habit.dots[dayOfYearIndex]) {
            dot.setAttribute('aria-pressed', 'true'); // CSS styling hook
          }
          if (habit.offDays[dayOfYearIndex]) {
            dot.dataset.off = 'true';
          }
          if (habit.notes && habit.notes[dayOfYearIndex] && habit.notes[dayOfYearIndex].trim()) {
            dot.dataset.note = 'true';
          }
          if (habit.year === CURRENTYEAR && dayOfYearIndex === todayIndex) {
            dot.setAttribute('aria-current', 'date');
          }

          frag.appendChild(dot);
          dayOfYearIndex++;
        }

        monthGrid.appendChild(frag);
        monthContainer.appendChild(monthGrid);
        container.appendChild(monthContainer);
      }
    }

    function calcStats(dots, offDays, dayIdx) {
      var total = dots.reduce(function (a,b){ return a + (b ? 1 : 0); }, 0);
      var longest = 0, run = 0;
      for (var i=0;i<dots.length;i++){
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

      var current = 0;
      for (var j=Math.min(dayIdx, dots.length-1); j>=0; j--){
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

    function completionSortValue(habit) {
      var todayIdx = dayIndexForYear(habit.year);
      var stats = calcStats(habit.dots, habit.offDays, todayIdx);
      return getCompletionRate(habit, stats);
    }

    /* ────────── Simplified dot state toggling (used by Mark Today button) ────────── */
    function setDotState(dotEl, shouldBeChecked){
      if (!dotEl) return;
      var hid = dotEl.dataset.habitId;
      var idx = Number(dotEl.dataset.index);
      var h = HABITS.find(function (x){ return x.id === hid; });
      if (h && h.dots[idx] !== shouldBeChecked) {
        h.dots[idx] = shouldBeChecked;
        // if user checks a day that was auto-off, we should clear off for that day
        if (shouldBeChecked && h.offDays[idx]) {
          h.offDays[idx] = false;
        }
        dotEl.setAttribute('aria-pressed', String(shouldBeChecked));
        if (shouldBeChecked) {
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
            var currentState = habit.dots[todayIdx];
            var newState = !currentState;
            setDotState(todayDot, newState);

            // Update button visual state immediately
            markTodayBtn.classList.toggle('marked', newState);
            markTodayBtn.setAttribute('aria-label', newState ? 'Unmark today' : 'Mark today');
            markTodayBtn.setAttribute('title', newState ? 'Unmark today' : 'Mark today');

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
            habit.dots = history.dots.slice();
            habit.offDays = history.offDays.slice();
            habit.notes = history.notes.slice();
          } else {
            habit.dots = new Array(habit.days).fill(false);
            habit.offDays = new Array(habit.days).fill(false);
            habit.notes = new Array(habit.days).fill('');
            applyFrequencyToHabit(habit);
          }

          // Step C: Perform the mark/unmark action for today's date
          var todayIdx = dayIndexForYear(CURRENTYEAR);
          var todayIsBeforeStartDate = todayIdx < getHabitStartIndex(habit);

          if (!todayIsBeforeStartDate) {
            var newState = !habit.dots[todayIdx]; // Toggle the state
            habit.dots[todayIdx] = newState;
            // If we mark a day, it can't be an "off day"
            if (newState && habit.offDays[todayIdx]) {
              habit.offDays[todayIdx] = false;
            }
            announce("Switched to current year and " + (newState ? "marked today" : "unmarked today"));
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

    function onHabitChanged(habit){
      var card = listEl.querySelector('.card[data-habit-id="' + habit.id + '"]');
      if (card) {
        var dayIdx = dayIndexForYear(habit.year);
        var stats = calcStats(habit.dots, habit.offDays, dayIdx);
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
      var todayIdx = dayIndexForYear(habit.year);
      var stats = calcStats(habit.dots, habit.offDays, todayIdx);
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

      editHabitOverlay.open();
    }
    document.getElementById('edit-sheet-close').addEventListener('click', function (){ editHabitOverlay.close(); });
    document.getElementById('edit-sheet-cancel').addEventListener('click', function (){ editHabitOverlay.close(); });
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
            var hasCompletions = habit.dots && habit.dots.some(function(dot) { return dot === true; });

            // Also check historical years for completions
            if (!hasCompletions && habit.yearHistory) {
              for (var yr in habit.yearHistory) {
                if (habit.yearHistory[yr].dots && habit.yearHistory[yr].dots.some(function(dot) { return dot === true; })) {
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
      applyFrequencyToHabit(habit);

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
    function ensureWaveStyles() {
      if (document.getElementById(WAVE_STYLE_ID)) return;
      var s = document.createElement('style');
      s.id = WAVE_STYLE_ID;
      s.textContent = [
        '.dot-wave{animation:dotWave .42s cubic-bezier(0.4,0,0.2,1) both;}',
        '.dot-wave-active::before,.dot-wave[aria-pressed="true"]::before{animation:dotWaveInner .42s cubic-bezier(0.4,0,0.2,1) both;}',
        '.dot:disabled.dot-wave,.dot:disabled.dot-wave::before{opacity:.35!important;}',
        '@keyframes dotWave{0%{transform:scale(.4);opacity:0;}100%{transform:scale(1);opacity:1;}}',
        '@keyframes dotWaveInner{0%{transform:scale(.4);opacity:0;}100%{transform:scale(1);opacity:1;}}'
      ].join('');
      document.head.appendChild(s);
    }

    // wave applier
    function applyWave(dotsNodeList) {
      if (!dotsNodeList || !dotsNodeList.length) return;

      var dots = Array.prototype.slice.call(dotsNodeList).map(function (dot, idx) {
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

    /* view toggle - simplified CSS-driven approach with smooth height animation */
    viewToggle.addEventListener('click', function (){
      var currentView = document.documentElement.dataset.view || 'year';
      var targetView = currentView === 'year' ? 'month' : 'year';

      var cards = listEl.querySelectorAll('.card');
      var contentHeights = [];

      // Step 1: Capture current heights
      cards.forEach(function(card) {
        var content = card.querySelector('.card-content');
        if (content) {
          var currentHeight = content.offsetHeight;
          contentHeights.push({ content: content, oldHeight: currentHeight });
          // Set explicit height to current height
          content.style.height = currentHeight + 'px';
        }
      });

      // Step 2: Toggle the view (CSS will hide/show the containers)
      document.documentElement.dataset.view = targetView;
      localStorage.setItem(VIEWKEY, targetView);
      updateViewToggleLabels(targetView);

      // Step 3: Measure new heights and animate
      requestAnimationFrame(function() {
        contentHeights.forEach(function(item) {
          var newHeight = item.content.scrollHeight;
          // Animate to new height
          item.content.style.height = newHeight + 'px';
        });

        // Step 4: Clean up after transition
        setTimeout(function() {
          contentHeights.forEach(function(item) {
            item.content.style.height = '';
          });
        }, 500);
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

    /* Debounce helper */
    function debounce(func, wait) {
      var timeout;
      return function executedFunction() {
        var context = this;
        var args = arguments;
        var later = function() {
          timeout = null;
          func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    // Call skeleton generation on load and resize
    if (typeof window !== 'undefined') {
      window.addEventListener('load', generateSkeletonDots);
      window.addEventListener('resize', debounce(generateSkeletonDots, 250));
    }

    /* init */
    async function initializeApp() {
      // For Firebase mode, wait for auth state to be ready
      if (typeof Auth !== 'undefined' && Auth.useFirebase) {
        await new Promise(function(resolve) {
          var unsubscribe = Auth.onAuthStateChanged(function(user) {
            if (user) {
              console.log('Auth ready, loading data for user:', user.uid);
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

      // Render the UI
      render();
      ensureWaveStyles();

      initCustomSelects();
    }

    /* ────────── Year Wheel Centering Fix ────────── */
    var yearWheelResizeObservers = {}; // Store resize observers for cleanup

    function centerSelectedYear(habitId, smooth) {
      // 1. Find the relevant elements for this specific habit's year wheel.
      var container = document.getElementById('year-wheel-' + habitId);
      if (!container) return; // Exit if the card isn't in the DOM

      var scrollArea = container.querySelector('.year-wheel-scroll');
      var selectedItem = container.querySelector('.year-item.selected');

      if (!scrollArea || !selectedItem) {
        // If we can't find the necessary elements, we can't proceed.
        return;
      }

      // 2. Calculate the target scroll position.
      var scrollAreaWidth = scrollArea.offsetWidth;
      var selectedItemOffsetLeft = selectedItem.offsetLeft;
      var selectedItemWidth = selectedItem.offsetWidth;

      // The goal is to position the center of the selected item at the center of the scroll area.
      var scrollLeftTarget = selectedItemOffsetLeft - (scrollAreaWidth / 2) + (selectedItemWidth / 2);

      // 3. Apply the scroll with a smooth animation.
      scrollArea.scrollTo({
        left: scrollLeftTarget,
        behavior: smooth === false ? 'instant' : 'smooth'
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
            requestAnimationFrame(function() {
              centerSelectedYear(habitId, false);
            });
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
        console.warn('YearWheel container not found for habit:', habit.id);
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
              habit.dots = history.dots.slice();
              habit.offDays = history.offDays.slice();
              habit.notes = history.notes.slice();
            } else {
              // No historical data, create fresh arrays for this year
              habit.dots = new Array(habit.days).fill(false);
              habit.offDays = new Array(habit.days).fill(false);
              habit.notes = new Array(habit.days).fill('');

              // Apply the habit's frequency rules to the new, empty year
              if (habit.frequency) {
                applyFrequencyToHabit(habit);
              }
            }

            // Persist all changes to storage (Firebase or localStorage)
            saveHabits(HABITS);

            // Re-render the habit card with the new year's data
            updateHabitCardContent(habit);

            // After all data is updated, center the selected year in the view
            requestAnimationFrame(function() {
              centerSelectedYear(habit.id, true);
            });
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
      var stats = calcStats(habit.dots, habit.offDays, todayIdx);
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
      console.error('Error initializing app:', error);
    });
