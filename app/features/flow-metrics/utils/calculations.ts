/**
 * Flow Metrics Calculation Utilities
 * 
 * Pure functions for metric calculations
 */

import type { DealData, CalculatedMetrics } from '../types';

/**
 * Convert duration in seconds to days
 * Rounds to 2 decimal places
 */
export function calculateDurationInDays(durationSeconds: number): number {
  return Math.round((durationSeconds / 86400) * 100) / 100;
}

/**
 * Calculate metrics from deal data
 * Returns average, best, worst, and total deal count
 */
export function calculateMetrics(deals: DealData[]): CalculatedMetrics {
  if (!deals || deals.length === 0) {
    return {
      average: 0,
      best: 0,
      worst: 0,
      totalDeals: 0,
    };
  }

  // Convert duration_seconds to days with precise calculation
  const durationsInDays = deals.map((deal) =>
    calculateDurationInDays(deal.duration_seconds)
  );

  // Calculate average
  const totalDays = durationsInDays.reduce((sum, days) => sum + days, 0);
  const average = Math.round((totalDays / durationsInDays.length) * 100) / 100;

  // Find best (minimum) and worst (maximum)
  const best = Math.min(...durationsInDays);
  const worst = Math.max(...durationsInDays);

  return {
    average,
    best,
    worst,
    totalDeals: deals.length,
  };
}

/**
 * Calculate average from array of numbers
 */
export function calculateAverage(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/**
 * Find best and worst values from array
 */
export function findBestAndWorst(values: number[]): {
  best: number;
  worst: number;
} {
  if (!values || values.length === 0) {
    return { best: 0, worst: 0 };
  }
  return {
    best: Math.min(...values),
    worst: Math.max(...values),
  };
}
