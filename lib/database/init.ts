/**
 * Database Initialization
 * 
 * Simple initialization that can be called during app startup
 * to ensure the repository system is ready.
 */

import { initializeDatabaseSystem } from './startup';

// Global flag to track initialization
let isInitialized = false;

/**
 * Ensure database system is initialized
 * This is safe to call multiple times
 */
export function ensureDatabaseInitialized() {
  if (!isInitialized) {
    try {
      initializeDatabaseSystem();
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database system:', error);
      // Don't throw - let the app continue with legacy system
    }
  }
}

/**
 * Reset initialization state (for testing)
 */
export function resetDatabaseInitialization() {
  isInitialized = false;
}
