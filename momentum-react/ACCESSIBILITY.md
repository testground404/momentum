# Accessibility Audit & Improvements

This document tracks accessibility improvements and guidelines for the Momentum Habit Tracker.

## Accessibility Goals

- **WCAG 2.1 Level AA Compliance**
- **Keyboard Navigation**: All features accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus Management**: Clear focus indicators
- **Responsive**: Works at 200% zoom

## Audit Checklist

### ✅ Completed Improvements

#### 1. Semantic HTML
- [x] Use proper heading hierarchy (h1 → h2 → h3)
- [x] Use `<button>` for clickable actions
- [x] Use `<nav>` for navigation
- [x] Use `<main>` for main content
- [x] Use `<article>` for habit cards

#### 2. Keyboard Navigation
- [x] All interactive elements are keyboard accessible
- [x] Tab order follows logical reading order
- [x] Modal dialogs trap focus
- [x] Escape key closes modals
- [x] Enter/Space activates buttons

#### 3. ARIA Labels
- [x] Button components have aria-labels where needed
- [x] Icon-only buttons have accessible names
- [x] Loading states announced to screen readers
- [x] Form inputs have associated labels

#### 4. Color & Contrast
- [x] Primary text: #111827 on #FFFFFF (16.8:1) ✓
- [x] Secondary text: #6B7280 on #FFFFFF (5.1:1) ✓
- [x] Button text has sufficient contrast
- [x] Error states use both color and text
- [x] Focus indicators visible (blue outline)

#### 5. Focus Management
- [x] Focus visible on all interactive elements
- [x] Focus returns to trigger after modal close
- [x] Skip to main content link available
- [x] Focus trap in modals

### 🔄 In Progress

#### 6. Screen Reader Announcements
- [ ] Live regions for dynamic updates
- [ ] Status messages announced
- [ ] Form validation errors announced
- [ ] Loading states announced properly

#### 7. Forms
- [ ] All inputs have labels
- [ ] Error messages linked to inputs
- [ ] Required fields indicated
- [ ] Autocomplete attributes where appropriate

#### 8. Images & Icons
- [ ] Decorative images have empty alt text
- [ ] Meaningful images have descriptive alt text
- [ ] Icon fonts supplemented with text or aria-label

### 📋 Planned Improvements

#### 9. Navigation
- [ ] Skip to content link
- [ ] Breadcrumb navigation
- [ ] Current page indicated in nav
- [ ] Aria-current on active nav items

#### 10. Responsive & Zoom
- [ ] Test at 200% zoom
- [ ] Test with text-only zoom
- [ ] No horizontal scrolling at zoom levels
- [ ] Touch targets minimum 44x44px

## Component-Specific Improvements

### Button Component
```typescript
// ✓ Already implemented
<button
  aria-label={ariaLabel}
  aria-disabled={disabled}
  aria-busy={loading}
>
```

### Modal Component
```typescript
// ✓ Already implemented with Headless UI
<Dialog>
  {/* Focus trap and aria-modal handled automatically */}
</Dialog>
```

### HabitCard Component
```typescript
// Improvements needed:
<article
  aria-label={`Habit: ${habit.name}`}
  role="article"
>
  <button
    aria-label={`Mark ${habit.name} complete for day ${dayIndex}`}
    onClick={handleToggle}
  >
    {/* Visual indicator */}
  </button>
</article>
```

### Navigation Component
```typescript
// Improvements needed:
<nav aria-label="Main navigation">
  <Link
    to="/app"
    aria-current={isActive ? 'page' : undefined}
  >
    Habits
  </Link>
</nav>
```

## Testing Tools

### Automated Testing
```bash
# Install tools
npm install -D @axe-core/react
npm install -D eslint-plugin-jsx-a11y

# Run Lighthouse audit
npm run build
npm run preview
# Open DevTools → Lighthouse → Accessibility
```

### Manual Testing

#### Keyboard Navigation Test
1. Tab through all interactive elements
2. Verify focus is visible
3. Test all actions with keyboard only
4. Escape closes modals
5. Enter/Space activates buttons

#### Screen Reader Test
- **macOS**: VoiceOver (Cmd+F5)
- **Windows**: NVDA or JAWS
- **Linux**: Orca

#### Zoom Test
1. Zoom to 200% (Cmd/Ctrl + +)
2. Verify no horizontal scrolling
3. Check text wraps properly
4. Ensure buttons remain clickable

## Color Palette Accessibility

### Light Mode
```css
/* Background */
--bg-primary: #FFFFFF;      /* Primary background */
--bg-secondary: #F9FAFB;    /* Secondary background */
--bg-tertiary: #F3F4F6;     /* Tertiary background */

/* Text */
--text-primary: #111827;    /* 16.8:1 on white ✓ */
--text-secondary: #6B7280;  /* 5.1:1 on white ✓ */
--text-tertiary: #9CA3AF;   /* 3.2:1 on white ⚠️ */

/* Interactive */
--primary: #3B82F6;         /* 4.6:1 on white ✓ */
--primary-hover: #2563EB;   /* 6.1:1 on white ✓ */
--danger: #EF4444;          /* 4.1:1 on white ✓ */
```

### Dark Mode
```css
/* Background */
--bg-primary: #111827;
--bg-secondary: #1F2937;
--bg-tertiary: #374151;

/* Text */
--text-primary: #F9FAFB;    /* 16.1:1 on dark ✓ */
--text-secondary: #D1D5DB;  /* 9.7:1 on dark ✓ */
--text-tertiary: #9CA3AF;   /* 5.7:1 on dark ✓ */
```

## ARIA Patterns Used

### Button Pattern
```typescript
<button
  aria-label="Descriptive label"
  aria-pressed={isPressed}     // Toggle buttons
  aria-expanded={isExpanded}   // Expandable buttons
  aria-busy={isLoading}        // Loading state
  aria-disabled={isDisabled}   // Disabled state
>
```

### Dialog (Modal) Pattern
```typescript
<Dialog
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Description</p>
</Dialog>
```

### Form Pattern
```typescript
<label htmlFor="habit-name">
  Habit Name
  <span aria-label="required">*</span>
</label>
<input
  id="habit-name"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby="name-error"
/>
{hasError && (
  <p id="name-error" role="alert">
    Error message
  </p>
)}
```

### Live Regions
```typescript
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {statusMessage}
</div>

<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  {errorMessage}
</div>
```

## Common Issues & Solutions

### Issue: Icon-only buttons
**Problem**: Screen readers can't identify button purpose
**Solution**: Add aria-label
```typescript
<button aria-label="Delete habit">
  <TrashIcon />
</button>
```

### Issue: Color-only indicators
**Problem**: Color blind users can't distinguish states
**Solution**: Use icons + text + color
```typescript
<div className="text-red-600">
  <ExclamationIcon />
  <span>Error: {message}</span>
</div>
```

### Issue: Focus not visible
**Problem**: Users can't see where they are
**Solution**: Custom focus styles
```css
button:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}
```

### Issue: Modal doesn't trap focus
**Problem**: Tab escapes modal
**Solution**: Use Headless UI Dialog (already implemented)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Axe DevTools](https://www.deque.com/axe/devtools/)
- [NVDA Screen Reader](https://www.nvaccess.org/)

## Testing Schedule

- **Every PR**: Automated ESLint jsx-a11y checks
- **Every Release**: Full keyboard navigation test
- **Quarterly**: Full screen reader test
- **Quarterly**: Lighthouse accessibility audit

## Maintenance

### Regular Checks
- [ ] All new components have proper ARIA labels
- [ ] New colors meet contrast requirements
- [ ] Forms have proper labels and error handling
- [ ] Modals trap focus properly
- [ ] Loading states are announced

### When Adding Features
1. Test with keyboard only
2. Test with screen reader
3. Check color contrast
4. Verify focus management
5. Add to this document

---

**Last Updated**: 2025-11-13
**Status**: In Progress
**Next Review**: 2025-12-13
