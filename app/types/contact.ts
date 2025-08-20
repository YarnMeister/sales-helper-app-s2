export interface Contact {
  personId: number;
  name: string;
  email?: string;
  phone?: string;
  orgId?: number;
  orgName?: string;
  mineGroup: string;
  mineName: string;
  jobTitle?: string;
}

export interface ContactsHierarchy {
  [mineGroup: string]: {
    [mineName: string]: Contact[];
  };
}

export interface ContactsApiResponse {
  ok: boolean;
  data: ContactsHierarchy;
  stale?: boolean;
  source?: 'cache' | 'pipedrive' | 'cache_fallback';
  message?: string;
}

export interface ContactSelectionState {
  expandedGroups: Set<string>;
  expandedMines: Set<string>;
  searchTerm: string;
}
