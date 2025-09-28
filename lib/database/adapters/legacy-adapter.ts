/**
 * Legacy Database Adapter
 * 
 * Provides backward compatibility for the legacy lib/db.ts API
 * while using the new repository system internally.
 * This allows gradual migration without breaking existing code.
 */

import { getRepository } from '../core/repository-factory';
import { logInfo, logError } from '../../log';
import { withDbErrorHandling } from '../core/connection';

/**
 * Legacy request creation function
 */
export const createRequest = async (data: {
  request_id?: string;
  salesperson_first_name?: string;
  salesperson_selection?: string;
  mine_group?: string;
  mine_name?: string;
  contact?: any;
  line_items?: any[];
  comment?: string;
}) => {
  return withDbErrorHandling(async () => {
    const repo = getRepository('salesRequests');
    
    // Transform legacy data format to repository format
    const repositoryData = {
      requestId: data.request_id || undefined,
      salespersonFirstName: data.salesperson_first_name || undefined,
      salespersonSelection: data.salesperson_selection as any,
      mineGroup: data.mine_group || undefined,
      mineName: data.mine_name || undefined,
      contact: data.contact || null,
      lineItems: data.line_items || [],
      comment: data.comment || undefined,
      status: 'draft' as const
    };
    
    const result = await repo.create(repositoryData);
    
    if (result.isError()) {
      throw new Error(result.getError().message);
    }
    
    // Transform back to legacy format
    const created = result.getData() as any;
    return {
      id: created.id,
      request_id: created.requestId,
      salesperson_first_name: created.salespersonFirstName,
      salesperson_selection: created.salespersonSelection,
      mine_group: created.mineGroup,
      mine_name: created.mineName,
      contact: created.contact,
      line_items: created.lineItems,
      comment: created.comment,
      status: created.status,
      pipedrive_deal_id: created.pipedriveDealId,
      created_at: created.createdAt,
      updated_at: created.updatedAt
    };
  }, 'createRequest');
};

/**
 * Legacy request update function
 */
export const updateRequest = async (id: string, updates: {
  contact?: any;
  line_items?: any[];
  comment?: string;
  salesperson_first_name?: string;
  salesperson_selection?: string;
  status?: string;
  pipedrive_deal_id?: number;
}) => {
  return withDbErrorHandling(async () => {
    const repo = getRepository('salesRequests');
    
    // Transform legacy updates format to repository format
    const repositoryUpdates: any = {};
    
    if (updates.contact !== undefined) repositoryUpdates.contact = updates.contact;
    if (updates.line_items !== undefined) repositoryUpdates.lineItems = updates.line_items;
    if (updates.comment !== undefined) repositoryUpdates.comment = updates.comment;
    if (updates.salesperson_first_name !== undefined) repositoryUpdates.salespersonFirstName = updates.salesperson_first_name;
    if (updates.salesperson_selection !== undefined) repositoryUpdates.salespersonSelection = updates.salesperson_selection;
    if (updates.status !== undefined) repositoryUpdates.status = updates.status;
    if (updates.pipedrive_deal_id !== undefined) repositoryUpdates.pipedriveDealId = updates.pipedrive_deal_id;
    
    const result = await repo.update(id, repositoryUpdates);
    
    if (result.isError()) {
      throw new Error(result.getError().message);
    }
    
    const updated = result.getData() as any;
    if (!updated) {
      throw new Error('Request not found or update failed');
    }

    // Transform back to legacy format
    return {
      id: updated.id,
      request_id: updated.requestId,
      salesperson_first_name: updated.salespersonFirstName,
      salesperson_selection: updated.salespersonSelection,
      mine_group: updated.mineGroup,
      mine_name: updated.mineName,
      contact: updated.contact,
      line_items: updated.lineItems,
      comment: updated.comment,
      status: updated.status,
      pipedrive_deal_id: updated.pipedriveDealId,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt
    };
  }, 'updateRequest');
};

/**
 * Legacy get request by ID function
 */
export const getRequestById = async (id: string) => {
  return withDbErrorHandling(async () => {
    const repo = getRepository('salesRequests');
    const result = await repo.findById(id);
    
    if (result.isError()) {
      throw new Error(result.getError().message);
    }
    
    const request = result.getData() as any;
    if (!request) {
      return null;
    }

    // Transform to legacy format
    return {
      id: request.id,
      request_id: request.requestId,
      salesperson_first_name: request.salespersonFirstName,
      salesperson_selection: request.salespersonSelection,
      mine_group: request.mineGroup,
      mine_name: request.mineName,
      contact: request.contact,
      line_items: request.lineItems,
      comment: request.comment,
      status: request.status,
      pipedrive_deal_id: request.pipedriveDealId,
      created_at: request.createdAt,
      updated_at: request.updatedAt
    };
  }, 'getRequestById');
};

/**
 * Legacy get requests with filters function
 */
export const getRequests = async (filters: {
  status?: string;
  salesperson?: string;
  limit?: number;
}) => {
  return withDbErrorHandling(async () => {
    const repo = getRepository('salesRequests') as any;

    // Use specific repository methods based on filters
    let result;

    if (filters.status && filters.salesperson && filters.salesperson !== 'all') {
      // Need to implement combined filter in repository
      const statusResult = await repo.findByStatus(filters.status);
      if (statusResult.isError()) {
        throw new Error(statusResult.getError().message);
      }

      // Filter by salesperson in memory for now
      const requests = (statusResult.getData() as any[]).filter(req =>
        req.salespersonFirstName === filters.salesperson
      );

      result = requests.slice(0, filters.limit || 50);
    } else if (filters.status) {
      const statusResult = await repo.findByStatus(filters.status);
      if (statusResult.isError()) {
        throw new Error(statusResult.getError().message);
      }
      result = (statusResult.getData() as any[]).slice(0, filters.limit || 50);
    } else if (filters.salesperson && filters.salesperson !== 'all') {
      const salespersonResult = await repo.findBySalesperson(filters.salesperson);
      if (salespersonResult.isError()) {
        throw new Error(salespersonResult.getError().message);
      }
      result = (salespersonResult.getData() as any[]).slice(0, filters.limit || 50);
    } else {
      const allResult = await repo.findAll();
      if (allResult.isError()) {
        throw new Error(allResult.getError().message);
      }
      result = (allResult.getData() as any[]).slice(0, filters.limit || 50);
    }
    
    // Transform to legacy format
    return result.map(request => ({
      id: request.id,
      request_id: request.requestId,
      salesperson_first_name: request.salespersonFirstName,
      salesperson_selection: request.salespersonSelection,
      mine_group: request.mineGroup,
      mine_name: request.mineName,
      contact: request.contact,
      line_items: request.lineItems,
      comment: request.comment,
      status: request.status,
      pipedrive_deal_id: request.pipedriveDealId,
      created_at: request.createdAt,
      updated_at: request.updatedAt
    }));
  }, 'getRequests');
};

/**
 * Legacy delete request function
 */
export const deleteRequest = async (id: string) => {
  return withDbErrorHandling(async () => {
    const repo = getRepository('salesRequests');
    
    // First get the request to return it
    const getResult = await repo.findById(id);
    if (getResult.isError()) {
      throw new Error(getResult.getError().message);
    }
    
    const request = getResult.getData() as any;
    if (!request) {
      return null;
    }

    // Delete the request
    const deleteResult = await repo.delete(id);
    if (deleteResult.isError()) {
      throw new Error(deleteResult.getError().message);
    }

    if (!deleteResult.getData()) {
      return null;
    }
    
    // Return the deleted request in legacy format
    return {
      id: request.id,
      request_id: request.requestId,
      salesperson_first_name: request.salespersonFirstName,
      salesperson_selection: request.salespersonSelection,
      mine_group: request.mineGroup,
      mine_name: request.mineName,
      contact: request.contact,
      line_items: request.lineItems,
      comment: request.comment,
      status: request.status,
      pipedrive_deal_id: request.pipedriveDealId,
      created_at: request.createdAt,
      updated_at: request.updatedAt
    };
  }, 'deleteRequest');
};

/**
 * Legacy atomic line item addition function
 */
export const addLineItemAtomic = async (requestId: string, newItem: any) => {
  return withDbErrorHandling(async () => {
    logInfo('Adding line item atomically', {
      requestId,
      itemCode: newItem.code,
      itemName: newItem.name
    });

    const repo = getRepository('salesRequests');
    
    // Get current request
    const getResult = await repo.findById(requestId);
    if (getResult.isError()) {
      throw new Error(getResult.getError().message);
    }
    
    const request = getResult.getData() as any;
    if (!request) {
      throw new Error('Request not found');
    }

    // Add new item to line items
    const updatedLineItems = [...(request.lineItems || []), newItem];
    
    // Update the request
    const updateResult = await repo.update(requestId, {
      lineItems: updatedLineItems
    });
    
    if (updateResult.isError()) {
      throw new Error(updateResult.getError().message);
    }
    
    const updated = updateResult.getData() as any;
    if (!updated) {
      throw new Error('Request not found');
    }

    logInfo('Line item added successfully', {
      requestId,
      newLineItemsCount: updated.lineItems?.length || 0
    });

    // Transform to legacy format
    return {
      id: updated.id,
      request_id: updated.requestId,
      salesperson_first_name: updated.salespersonFirstName,
      salesperson_selection: updated.salespersonSelection,
      mine_group: updated.mineGroup,
      mine_name: updated.mineName,
      contact: updated.contact,
      line_items: updated.lineItems,
      comment: updated.comment,
      status: updated.status,
      pipedrive_deal_id: updated.pipedriveDealId,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt
    };
  }, 'addLineItemAtomic');
};
