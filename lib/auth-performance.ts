// Performance monitoring for authentication

interface AuthMetrics {
  sessionFetchTime: number;
  userProfileTime: number;
  totalTime: number;
  platform: string;
  timestamp: number;
}

class AuthPerformanceMonitor {
  private metrics: AuthMetrics[] = [];
  private readonly MAX_METRICS = 100; // Keep last 100 metrics

  startSession(): number {
    return performance.now();
  }

  endSession(sessionStart: number, profileStart: number, profileEnd: number): void {
    const metrics: AuthMetrics = {
      sessionFetchTime: profileStart - sessionStart,
      userProfileTime: profileEnd - profileStart,
      totalTime: profileEnd - sessionStart,
      platform: this.getPlatform(),
      timestamp: Date.now()
    };

    this.addMetrics(metrics);
  }

  private addMetrics(metrics: AuthMetrics): void {
    this.metrics.push(metrics);

    // Keep only the last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow authentication
    if (metrics.totalTime > 3000) { // 3 seconds
      console.warn(`Slow authentication detected: ${metrics.totalTime.toFixed(2)}ms`, {
        platform: metrics.platform,
        sessionFetch: `${metrics.sessionFetchTime.toFixed(2)}ms`,
        userProfile: `${metrics.userProfileTime.toFixed(2)}ms`
      });
    }
  }

  private getPlatform(): string {
    if (typeof window === 'undefined') return 'server';

    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone/.test(ua)) return 'mobile';
    if (/ipad|tablet/.test(ua)) return 'tablet';
    return 'desktop';
  }

  getAverageTime(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.totalTime, 0);
    return sum / this.metrics.length;
  }

  getMetricsByPlatform(): { [platform: string]: AuthMetrics[] } {
    const grouped: { [platform: string]: AuthMetrics[] } = {};

    this.metrics.forEach(metric => {
      if (!grouped[metric.platform]) {
        grouped[metric.platform] = [];
      }
      grouped[metric.platform].push(metric);
    });

    return grouped;
  }

  getPerformanceReport(): string {
    const avgTime = this.getAverageTime();
    const byPlatform = this.getMetricsByPlatform();

    let report = `=== Authentication Performance Report ===\n`;
    report += `Average time: ${avgTime.toFixed(2)}ms\n`;
    report += `Total measurements: ${this.metrics.length}\n\n`;

    Object.entries(byPlatform).forEach(([platform, metrics]) => {
      const avg = metrics.reduce((acc, m) => acc + m.totalTime, 0) / metrics.length;
      const max = Math.max(...metrics.map(m => m.totalTime));
      const min = Math.min(...metrics.map(m => m.totalTime));

      report += `${platform.toUpperCase()}:\n`;
      report += `  Measurements: ${metrics.length}\n`;
      report += `  Average: ${avg.toFixed(2)}ms\n`;
      report += `  Max: ${max.toFixed(2)}ms\n`;
      report += `  Min: ${min.toFixed(2)}ms\n\n`;
    });

    return report;
  }

  // Clear all metrics
  clear(): void {
    this.metrics = [];
  }
}

export const authPerformance = new AuthPerformanceMonitor();