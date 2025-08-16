import { supabase, supabaseAdmin } from './supabase';
import { 
  Request, 
  RequestInsert, 
  RequestUpdate, 
  ContactJSON, 
  LineItem,
  TABLES,
  validateRequest,
  validateContact,
  validateLineItem,
  isRequestSubmittable,
  getMissingRequirements
} from './types/database';

// Request operations
export const createRequest = async (data: RequestInsert): Promise<Request> => {
  const { data: request, error } = await supabase
    .from(TABLES.REQUESTS)
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  if (!validateRequest(request)) throw new Error('Invalid request data returned');
  
  return request;
};

export const getRequest = async (id: string): Promise<Request | null> => {
  const { data: request, error } = await supabase
    .from(TABLES.REQUESTS)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  if (!validateRequest(request)) throw new Error('Invalid request data returned');
  
  return request;
};

export const getRequestByRequestId = async (requestId: string): Promise<Request | null> => {
  const { data: request, error } = await supabase
    .from(TABLES.REQUESTS)
    .select('*')
    .eq('request_id', requestId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  if (!validateRequest(request)) throw new Error('Invalid request data returned');
  
  return request;
};

export const updateRequest = async (id: string, data: RequestUpdate): Promise<Request> => {
  const { data: request, error } = await supabase
    .from(TABLES.REQUESTS)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  if (!validateRequest(request)) throw new Error('Invalid request data returned');
  
  return request;
};

export const deleteRequest = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLES.REQUESTS)
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const listRequests = async (options?: {
  status?: string;
  salesperson?: string;
  mineGroup?: string;
  limit?: number;
  offset?: number;
}): Promise<Request[]> => {
  let query = supabase
    .from(TABLES.REQUESTS)
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }
  
  if (options?.salesperson) {
    query = query.eq('salesperson_selection', options.salesperson);
  }
  
  if (options?.mineGroup) {
    query = query.eq('contact_mine_group', options.mineGroup);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data: requests, error } = await query;

  if (error) throw error;
  
  // Validate all requests
  const validRequests = requests.filter(validateRequest);
  if (validRequests.length !== requests.length) {
    console.warn('Some requests failed validation');
  }
  
  return validRequests;
};

// Contact operations
export const updateRequestContact = async (requestId: string, contact: ContactJSON): Promise<Request> => {
  if (!validateContact(contact)) {
    throw new Error('Invalid contact data');
  }

  return updateRequest(requestId, { contact });
};

// Line items operations
export const updateRequestLineItems = async (requestId: string, lineItems: LineItem[]): Promise<Request> => {
  if (!lineItems.every(validateLineItem)) {
    throw new Error('Invalid line items data');
  }

  return updateRequest(requestId, { line_items: lineItems });
};

export const addLineItemToRequest = async (requestId: string, lineItem: LineItem): Promise<Request> => {
  if (!validateLineItem(lineItem)) {
    throw new Error('Invalid line item data');
  }

  const request = await getRequest(requestId);
  if (!request) throw new Error('Request not found');

  const updatedLineItems = [...request.line_items, lineItem];
  return updateRequest(requestId, { line_items: updatedLineItems });
};

export const removeLineItemFromRequest = async (requestId: string, lineItemIndex: number): Promise<Request> => {
  const request = await getRequest(requestId);
  if (!request) throw new Error('Request not found');

  if (lineItemIndex < 0 || lineItemIndex >= request.line_items.length) {
    throw new Error('Invalid line item index');
  }

  const updatedLineItems = request.line_items.filter((_, index) => index !== lineItemIndex);
  return updateRequest(requestId, { line_items: updatedLineItems });
};

// KV Cache operations
export const getCacheValue = async (key: string): Promise<any | null> => {
  const { data, error } = await supabase
    .from(TABLES.KV_CACHE)
    .select('value')
    .eq('key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data.value;
};

export const setCacheValue = async (key: string, value: any): Promise<void> => {
  const { error } = await supabase
    .from(TABLES.KV_CACHE)
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) throw error;
};

export const deleteCacheValue = async (key: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLES.KV_CACHE)
    .delete()
    .eq('key', key);

  if (error) throw error;
};

// Mock submissions operations
export const createMockSubmission = async (data: {
  request_id: string;
  payload: any;
  simulated_deal_id: number;
  status?: string;
}): Promise<void> => {
  const { error } = await supabase
    .from(TABLES.MOCK_PIPEDRIVE_SUBMISSIONS)
    .insert({
      ...data,
      status: data.status || 'Submitted'
    });

  if (error) throw error;
};

export const getMockSubmissions = async (requestId?: string): Promise<any[]> => {
  let query = supabase
    .from(TABLES.MOCK_PIPEDRIVE_SUBMISSIONS)
    .select('*')
    .order('created_at', { ascending: false });

  if (requestId) {
    query = query.eq('request_id', requestId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
};

// Validation helpers
export const validateRequestForSubmission = (request: Request): {
  isValid: boolean;
  missingRequirements: string[];
  message: string;
} => {
  const missingRequirements = getMissingRequirements(request);
  const isValid = isRequestSubmittable(request);

  let message = '';
  if (missingRequirements.length > 0) {
    if (missingRequirements.length === 1) {
      message = `Add ${missingRequirements[0]} to submit`;
    } else if (missingRequirements.length === 2) {
      message = `Add ${missingRequirements.join(' and ')} to submit`;
    } else {
      message = `Add ${missingRequirements.slice(0, -1).join(', ')}, and ${missingRequirements[missingRequirements.length - 1]} to submit`;
    }
  } else if (request.status !== 'draft') {
    message = `Cannot submit ${request.status} request`;
  }

  return {
    isValid,
    missingRequirements,
    message
  };
};
