/**
 * Flow Metrics Validation Utilities
 * 
 * Validation functions for metric configuration
 * IMPORTANT: Supports cross-pipeline metrics!
 */

import type {
  MetricConfigForm,
  StageSelection,
  ValidationResult,
} from '../types';

/**
 * Validates metric configuration
 * 
 * Cross-pipeline metrics are VALID and supported.
 * Example: "Order to Cash" can start in "New Orders" pipeline
 * and end in "Finance" pipeline.
 */
export function validateMetricConfig(
  config: MetricConfigForm
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!config.metricKey || config.metricKey.trim() === '') {
    errors.push('Metric key is required');
  } else if (!/^[a-z0-9-]+$/.test(config.metricKey)) {
    errors.push(
      'Metric key must contain only lowercase letters, numbers, and hyphens'
    );
  }

  if (!config.displayTitle || config.displayTitle.trim() === '') {
    errors.push('Display title is required');
  }

  if (!config.startStage) {
    errors.push('Start stage is required');
  }

  if (!config.endStage) {
    errors.push('End stage is required');
  }

  // Stage-specific validations
  if (config.startStage && config.endStage) {
    // Same stage validation (not allowed)
    if (config.startStage.stageId === config.endStage.stageId) {
      errors.push('Start and end stages cannot be the same stage');
    }

    // Cross-pipeline warning (informational only - NOT an error!)
    if (config.startStage.pipelineId !== config.endStage.pipelineId) {
      warnings.push(
        `This is a cross-pipeline metric (${config.startStage.pipelineName} → ${config.endStage.pipelineName}). ` +
          `Ensure deal flow data captures transitions between pipelines.`
      );
    }
  }

  // Threshold validation
  if (
    config.avgMinDays !== undefined &&
    config.avgMaxDays !== undefined &&
    config.avgMinDays > config.avgMaxDays
  ) {
    errors.push('Minimum days cannot be greater than maximum days');
  }

  if (config.avgMinDays !== undefined && config.avgMinDays < 0) {
    errors.push('Minimum days cannot be negative');
  }

  if (config.avgMaxDays !== undefined && config.avgMaxDays < 0) {
    errors.push('Maximum days cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates that start and end are different stages
 */
export function validateDifferentStages(
  startStage: StageSelection,
  endStage: StageSelection
): boolean {
  return startStage.stageId !== endStage.stageId;
}

/**
 * Checks if metric spans multiple pipelines
 * This is a VALID scenario!
 */
export function isCrossPipelineMetric(
  startStage: StageSelection,
  endStage: StageSelection
): boolean {
  return startStage.pipelineId !== endStage.pipelineId;
}

/**
 * Validates metric key format
 */
export function validateMetricKey(key: string): boolean {
  return /^[a-z0-9-]+$/.test(key);
}

/**
 * Generate a metric key from display title
 */
export function generateMetricKey(displayTitle: string): string {
  return displayTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
