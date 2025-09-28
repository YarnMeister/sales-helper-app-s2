/**
 * Shared Types Index
 *
 * Central export point for all shared types used across feature modules.
 * This ensures consistent type definitions and easy imports.
 */

// Repository types
export * from './repository';

// Database types
export * from './database';

// UI component types
export * from './ui';

// API types
export * from './api';

// Common utility types
export * from './common';

// Environment configuration types
export * from './environment';

// Feature-specific types (re-exported for convenience)
export * from '../features';

// External service types (re-exported for convenience)
export * from '../external';
