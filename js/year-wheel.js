/**
 * Year Wheel Selector Component
 * A smooth, animated year selector with scrolling functionality
 */
export class YearWheel {
  constructor(elementId, options = {}) {
    this.options = {
      startYear: options.startYear || 1990,
      endYear: options.endYear || 2030,
      initialYear: options.initialYear,
      minSelectableYear: options.minSelectableYear || options.startYear || 1990,
      maxSelectableYear: options.maxSelectableYear || options.endYear || 2030,
      onChange: options.onChange || (() => {}),
      animationSpeed: options.animationSpeed || 400,
      fadePercent: options.fadePercent || 25,
      fadeColor: options.fadeColor || null,
      autoDetectFade: options.autoDetectFade !== false,
      windowSize: options.windowSize || 201,
      edgeMargin: options.edgeMargin || 30,
    };

    this.half = Math.floor(this.options.windowSize / 2);
    this.defaultYear = this.options.initialYear ??
      (Math.round((Math.max(this.options.startYear, this.options.initialYear || 0) + this.options.endYear) / 2) ||
      new Date().getFullYear());

    this.selected = this.defaultYear;
    this.windowStart = this.selected - this.half;
    this.showAllYears = false;
    this.animating = false;
    this.animationFrame = null;
    this.itemElements = new Map();

    // Detect mobile for performance optimizations
    this.isMobile = window.innerWidth <= 900;

    this.container = document.getElementById(elementId);
    this.detectFadeColor();
    this.render();
    this.init();
  }

  detectFadeColor() {
    if (this.options.fadeColor) {
      this.fade = this.options.fadeColor;
    } else if (this.options.autoDetectFade && typeof window !== "undefined") {
      try {
        const bg = getComputedStyle(document.body).backgroundColor;
        this.fade = (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") ? bg : "#ffffff";
      } catch (e) {
        this.fade = "#ffffff";
      }
    } else {
      this.fade = "#ffffff";
    }
  }

  getYears() {
    return Array.from({ length: this.options.windowSize }, (_, i) => this.windowStart + i);
  }

  render() {
    const years = this.getYears();
    const { minSelectableYear, maxSelectableYear } = this.options;

    // Remove mask entirely on mobile for better performance
    const maskStyle = this.isMobile ? '' : `
      -webkit-mask-image: linear-gradient(to right, ${this.fade} 0%, black 10%, black 90%, ${this.fade} 100%);
      mask-image: linear-gradient(to right, ${this.fade} 0%, black 10%, black 90%, ${this.fade} 100%);
    `;

    // Simplify or remove overlays on mobile
    const leftOverlayStyle = this.isMobile ? 'display:none;' : `background: linear-gradient(to right, ${this.fade} 0%, rgba(255,255,255,0) 100%);`;
    const rightOverlayStyle = this.isMobile ? 'display:none;' : `background: linear-gradient(to left, ${this.fade} 0%, rgba(255,255,255,0) 100%);`;

    this.container.innerHTML = `
      <div class="year-wheel-container">
        <div class="year-wheel-scroll" role="listbox" aria-label="Year selector" tabindex="0" style="${maskStyle}">
          <div class="year-wheel-items">
            ${years.map(y => {
              const isDisabled = y < minSelectableYear || y > maxSelectableYear;
              return `
                <div class="year-item${isDisabled ? ' disabled' : ''}${y === this.selected ? ' selected visible' : ''}" data-year="${y}" role="option" aria-selected="${y === this.selected}" ${isDisabled ? 'aria-disabled="true"' : ''} style="${y === this.selected ? 'opacity: 1 !important;' : ''}">
                  ${y}
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="overlay overlay-left" style="${leftOverlayStyle}"></div>
        <div class="overlay overlay-right" style="${rightOverlayStyle}"></div>
      </div>
    `;

    this.scrollContainer = this.container.querySelector('.year-wheel-scroll');
    this.itemsContainer = this.container.querySelector('.year-wheel-items');

    this.itemElements.clear();
    this.container.querySelectorAll('.year-item').forEach(el => {
      const year = parseInt(el.dataset.year);
      this.itemElements.set(year, el);
    });

    this.updateVisibility();
  }

  init() {
    // Reduce centering attempts on mobile for better performance
    if (this.isMobile) {
      // Single immediate center on mobile
      this.centerYear(this.selected, false);

      // One delayed attempt to ensure layout is ready
      setTimeout(() => {
        this.centerYear(this.selected, false);
      }, 100);
    } else {
      // Desktop: multiple attempts for smoother centering
      this.centerYear(this.selected, false);

      requestAnimationFrame(() => {
        this.centerYear(this.selected, false);
      });

      setTimeout(() => {
        this.centerYear(this.selected, false);
      }, 100);
    }

    // Mouse wheel scroll support (passive on mobile)
    this.scrollContainer.addEventListener('wheel', (e) => {
      if (e.deltaY === 0) return;
      if (!this.isMobile) {
        e.preventDefault();
      }
      this.scrollContainer.scrollLeft += e.deltaY;
    }, { passive: this.isMobile });

    // Click to select year
    this.container.addEventListener('click', (e) => {
      const item = e.target.closest('.year-item');
      if (item) {
        const year = parseInt(item.dataset.year);
        this.handleSelect(year);
      }
    });

    // Skip drag scroll on mobile - use native scrolling instead
    if (!this.isMobile) {
      // Touch/drag scroll support for desktop only
      let isDown = false;
      let startX;
      let scrollLeft;

      this.scrollContainer.addEventListener('mousedown', (e) => {
        if (e.target.closest('.year-item')) return; // Allow clicks on items
        isDown = true;
        this.scrollContainer.style.cursor = 'grabbing';
        startX = e.pageX - this.scrollContainer.offsetLeft;
        scrollLeft = this.scrollContainer.scrollLeft;
      });

      this.scrollContainer.addEventListener('mouseleave', () => {
        isDown = false;
        this.scrollContainer.style.cursor = 'grab';
      });

      this.scrollContainer.addEventListener('mouseup', () => {
        isDown = false;
        this.scrollContainer.style.cursor = 'grab';
      });

      this.scrollContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - this.scrollContainer.offsetLeft;
        const walk = (x - startX) * 2;
        this.scrollContainer.scrollLeft = scrollLeft - walk;
      });
    }
  }

  centerYear(year, smooth = true) {
    const el = this.itemElements.get(year);
    if (!this.scrollContainer || !el) {
      return;
    }

    // Ensure element has been laid out
    const containerWidth = this.scrollContainer.clientWidth;
    const elementWidth = el.clientWidth;
    const elementLeft = el.offsetLeft;

    if (containerWidth === 0 || elementWidth === 0) {
      // Container not ready, try again
      requestAnimationFrame(() => this.centerYear(year, smooth));
      return;
    }

    // Calculate the scroll position to center the element
    const left = elementLeft - (containerWidth / 2) + (elementWidth / 2);

    if (smooth) {
      this.scrollContainer.scrollTo({ left: left, behavior: 'smooth' });
    } else {
      this.scrollContainer.scrollLeft = left;
    }
  }

  recenterWindowPreserveScroll(newWindowStart, callback) {
    const oldFirstYear = this.windowStart;
    const oldFirstEl = this.itemElements.get(oldFirstYear);
    const oldOffset = oldFirstEl ? oldFirstEl.offsetLeft : null;

    this.windowStart = newWindowStart;
    this.render();
    this.init();

    requestAnimationFrame(() => {
      const newFirstEl = this.itemElements.get(newWindowStart);
      if (oldOffset != null && newFirstEl) {
        const newOffset = newFirstEl.offsetLeft;
        const delta = newOffset - oldOffset;
        this.scrollContainer.scrollLeft += delta;
      }
      if (callback) callback();
    });
  }

  smoothAnimateToYear(targetYear) {
    if (this.animating) return;

    const years = this.getYears();
    const fromIdx = years.indexOf(this.selected);
    const toIdx = years.indexOf(targetYear);

    if (toIdx === -1) {
      const newStart = targetYear - this.half;
      this.recenterWindowPreserveScroll(newStart, () =>
        requestAnimationFrame(() => this.smoothAnimateToYear(targetYear))
      );
      return;
    }

    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) {
      this.selected = targetYear;
      this.options.onChange(targetYear);
      this.updateVisibility();
      return;
    }

    this.animating = true;
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / this.options.animationSpeed, 1);
      const easedProgress = 0.5 - Math.cos(progress * Math.PI) / 2;
      const currentIdx = Math.round(fromIdx + (toIdx - fromIdx) * easedProgress);
      const currentYear = years[currentIdx];

      if (currentYear !== undefined && currentYear !== this.selected) {
        this.selected = currentYear;
        // Only update visibility during animation, don't call onChange yet
        this.updateVisibility(true); // Pass true to skip onChange
      }

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.selected = targetYear;
        this.animating = false;
        // Call onChange only once at the end
        this.options.onChange(targetYear);
        this.updateVisibility();
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  handleSelect(year) {
    // Prevent selecting disabled years (before habit start date or far future)
    if (year < this.options.minSelectableYear || year > this.options.maxSelectableYear) {
      return;
    }

    if (year === this.selected) {
      this.showAllYears = !this.showAllYears;
      this.updateVisibility();
      return;
    }

    if (this.animating) {
      cancelAnimationFrame(this.animationFrame);
      this.animating = false;
    }

    this.smoothAnimateToYear(year);

    const years = this.getYears();
    const idx = years.indexOf(this.selected);
    if (idx !== -1 && (idx < this.options.edgeMargin || idx > this.options.windowSize - 1 - this.options.edgeMargin)) {
      this.recenterWindowPreserveScroll(this.selected - this.half, () =>
        requestAnimationFrame(() => this.centerYear(this.selected, false))
      );
    }
  }

  updateVisibility(skipCentering = false) {
    const years = this.getYears();
    const selectedIdx = years.indexOf(this.selected);

    years.forEach((y, idx) => {
      const el = this.itemElements.get(y);
      if (!el) return;

      const isSelected = y === this.selected;
      const isVisible = this.showAllYears || isSelected;
      const isLeft = idx < selectedIdx;

      // Force selected year to always be visible with !important overrides
      if (isSelected) {
        el.style.opacity = '1';
        el.style.setProperty('opacity', '1', 'important');
        el.classList.add('selected');
        el.classList.add('visible');
      } else {
        el.style.opacity = isVisible ? 1 : 0;
        el.classList.toggle('selected', false);
        el.classList.toggle('visible', isVisible);
      }

      el.classList.toggle('left', isLeft && !isVisible);
      el.setAttribute('aria-selected', isSelected);
    });

    // Always center the selected year
    if (!skipCentering) {
      this.centerYear(this.selected, true);
    } else {
      // During animation, still center but use the animation timing
      this.centerYear(this.selected, true);
    }
  }

  // Public method to programmatically set year
  setYear(year) {
    this.handleSelect(year);
  }

  // Public method to get current year
  getYear() {
    return this.selected;
  }
}
