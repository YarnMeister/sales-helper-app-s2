/**
 * Flow Metrics Formatting Utilities
 * 
 * Functions for formatting metric values and determining visual states
 */

import type { MetricStatus } from '../types';

/**
 * Format duration in days to human-readable string
 */
export function formatDuration(days: number): string {
  if (days === 0) return '0 days';
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${Math.round(days)} ${Math.round(days) === 1 ? 'day' : 'days'}`;
}

/**
 * Format metric value for display
 */
export function formatMetricValue(value: number): string {
  return Math.round(value).toString();
}

/**
 * Determine metric color based on average and thresholds
 * Returns Tailwind CSS color classes
 */
export function getMetricColor(
  average: number,
  avgMinDays?: number,
  avgMaxDays?: number
): string {
  // No data
  if (average === 0) return 'text-gray-400';

  // No thresholds defined - neutral
  if (!avgMinDays && !avgMaxDays) return 'text-blue-600';

  // Within acceptable range
  if (avgMinDays && avgMaxDays) {
    if (average >= avgMinDays && average <= avgMaxDays) {
      return 'text-green-600';
    }
  }

  // Better than minimum (if defined)
  if (avgMinDays && average < avgMinDays) {
    return 'text-green-600';
  }

  // Worse than maximum (if defined)
  if (avgMaxDays && average > avgMaxDays) {
    return 'text-red-600';
  }

  // Between thresholds or partial threshold
  if (avgMinDays && average >= avgMinDays) {
    return 'text-yellow-600';
  }
  if (avgMaxDays && average <= avgMaxDays) {
    return 'text-yellow-600';
  }

  return 'text-blue-600';
}

/**
 * Get metric status for programmatic use
 */
export function getMetricStatus(
  average: number,
  avgMinDays?: number,
  avgMaxDays?: number
): MetricStatus {
  // No data
  if (average === 0) return 'no-data';

  // No thresholds defined
  if (!avgMinDays && !avgMaxDays) return 'good';

  // Within acceptable range
  if (avgMinDays && avgMaxDays) {
    if (average >= avgMinDays && average <= avgMaxDays) {
      return 'good';
    }
  }

  // Better than minimum
  if (avgMinDays && average < avgMinDays) {
    return 'good';
  }

  // Worse than maximum
  if (avgMaxDays && average > avgMaxDays) {
    return 'critical';
  }

  // Warning state
  return 'warning';
}

/**
 * Get background color for metric status badges
 */
export function getStatusBadgeColor(status: MetricStatus): string {
  switch (status) {
    case 'good':
      return 'bg-green-100 text-green-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'no-data':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-blue-100 text-blue-800';
  }
}
