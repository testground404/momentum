/**
 * Performance monitoring using Web Vitals
 * Tracks Core Web Vitals and sends to analytics
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Core Web Vitals (web-vitals v5+):
 * - CLS (Cumulative Layout Shift): Visual stability
 * - INP (Interaction to Next Paint): Interactivity (replaces FID)
 * - FCP (First Contentful Paint): Initial load
 * - LCP (Largest Contentful Paint): Loading performance
 * - TTFB (Time to First Byte): Server response time
 */

interface PerformanceConfig {
  enableConsoleLog?: boolean;
  enableAnalytics?: boolean;
  analyticsEndpoint?: string;
}

const config: PerformanceConfig = {
  enableConsoleLog: import.meta.env.DEV,
  enableAnalytics: import.meta.env.PROD,
  analyticsEndpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT,
};

/**
 * Send metric to analytics service
 */
function sendToAnalytics(metric: Metric): void {
  const { name, value, rating, delta, id } = metric;

  // Log in development
  if (config.enableConsoleLog) {
    console.log(`[Web Vitals] ${name}:`, {
      value: Math.round(value),
      rating,
      delta: Math.round(delta),
      id,
    });
  }

  // Send to analytics in production
  if (config.enableAnalytics) {
    // Firebase Analytics example
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(name === 'CLS' ? delta * 1000 : delta),
        event_label: id,
        non_interaction: true,
      });
    }

    // Custom analytics endpoint
    if (config.analyticsEndpoint) {
      const body = JSON.stringify({
        name,
        value: Math.round(value),
        rating,
        delta: Math.round(delta),
        id,
        timestamp: Date.now(),
        url: window.location.href,
      });

      // Use sendBeacon for reliability
      if (navigator.sendBeacon) {
        navigator.sendBeacon(config.analyticsEndpoint, body);
      } else {
        fetch(config.analyticsEndpoint, {
          method: 'POST',
          body,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch((error) => {
          console.error('Failed to send analytics:', error);
        });
      }
    }
  }
}

/**
 * Get metric rating thresholds
 */
export function getMetricThresholds(metricName: string) {
  const thresholds = {
    CLS: { good: 0.1, needsImprovement: 0.25 },
    INP: { good: 200, needsImprovement: 500 },
    FCP: { good: 1800, needsImprovement: 3000 },
    LCP: { good: 2500, needsImprovement: 4000 },
    TTFB: { good: 800, needsImprovement: 1800 },
  };

  return thresholds[metricName as keyof typeof thresholds] || { good: 0, needsImprovement: 0 };
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);

  // Log initialization
  if (config.enableConsoleLog) {
    console.log('[Performance] Web Vitals monitoring initialized');
  }
}

/**
 * Track custom performance marks
 */
export function trackPerformanceMark(markName: string): void {
  if (typeof window === 'undefined' || !window.performance) return;

  try {
    performance.mark(markName);

    if (config.enableConsoleLog) {
      console.log(`[Performance] Mark: ${markName}`);
    }
  } catch (error) {
    console.error('Failed to create performance mark:', error);
  }
}

/**
 * Measure time between two marks
 */
export function measurePerformance(
  measureName: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof window === 'undefined' || !window.performance) return null;

  try {
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName)[0];

    if (config.enableConsoleLog) {
      console.log(`[Performance] ${measureName}: ${Math.round(measure.duration)}ms`);
    }

    return measure.duration;
  } catch (error) {
    console.error('Failed to measure performance:', error);
    return null;
  }
}

/**
 * Get all performance metrics
 */
export function getPerformanceMetrics() {
  if (typeof window === 'undefined' || !window.performance) return null;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    ttfb: navigation?.responseStart - navigation?.requestStart,
    download: navigation?.responseEnd - navigation?.responseStart,
    domInteractive: navigation?.domInteractive - navigation?.fetchStart,
    domComplete: navigation?.domComplete - navigation?.fetchStart,
    loadComplete: navigation?.loadEventEnd - navigation?.fetchStart,

    // Paint timing
    fcp: paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime,

    // Memory (if available)
    memory: (performance as any).memory
      ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        }
      : null,
  };
}

/**
 * Log current performance metrics
 */
export function logPerformanceMetrics(): void {
  const metrics = getPerformanceMetrics();

  if (metrics && config.enableConsoleLog) {
    console.table(metrics);
  }
}

/**
 * Monitor long tasks (> 50ms)
 */
export function monitorLongTasks(): void {
  if (typeof window === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (config.enableConsoleLog) {
          console.warn(`[Performance] Long task detected: ${Math.round(entry.duration)}ms`);
        }

        // Send to analytics
        if (config.enableAnalytics && (window as any).gtag) {
          (window as any).gtag('event', 'long_task', {
            event_category: 'Performance',
            value: Math.round(entry.duration),
            non_interaction: true,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    // PerformanceObserver not supported
    console.warn('Long task monitoring not supported');
  }
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  // Wait for page load
  if (document.readyState === 'complete') {
    initPerformanceMonitoring();
  } else {
    window.addEventListener('load', initPerformanceMonitoring);
  }
}
