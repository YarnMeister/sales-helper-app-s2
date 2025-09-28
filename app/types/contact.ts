/**
 * Contact types for the application
 * Consolidated to avoid module resolution issues
 */

/**
 * Contact interface for UI components
 */
export interface Contact {
  personId: number;
  orgId?: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  mineGroup: string;
  mineName: string;
  company?: string;
  title?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Contacts hierarchy for UI display
 */
export interface ContactsHierarchy {
  [mineGroup: string]: {
    [mineName: string]: Contact[];
  };
}

/**
 * Contact selection state for UI components
 */
export interface ContactSelectionState {
  expandedGroups: Set<string>;
  expandedMines: Set<string>;
  searchTerm: string;
}

/**
 * API Response types
 */
export interface ContactsApiResponse {
  ok: boolean;
  data: ContactsHierarchy;
  stale?: boolean;
  source?: 'cache' | 'pipedrive' | 'cache_fallback';
  message?: string;
}
