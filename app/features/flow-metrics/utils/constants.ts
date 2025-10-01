/**
 * Flow Metrics Constants
 */

import type { TimePeriod } from '../types';

/**
 * Time period options for metrics filtering
 */
export const TIME_PERIODS: TimePeriod[] = [
  { value: '7d', label: '7 days', days: 7 },
  { value: '14d', label: '14 days', days: 14 },
  { value: '1m', label: '1 month', days: 30 },
  { value: '3m', label: '3 months', days: 90 },
];

/**
 * Default time period
 */
export const DEFAULT_PERIOD = '7d';

/**
 * View modes for flow metrics pages
 */
export const VIEW_MODES = {
  METRICS: 'metrics',
  RAW_DATA: 'raw-data',
  MAPPINGS: 'mappings',
} as const;

export type ViewMode = typeof VIEW_MODES[keyof typeof VIEW_MODES];
