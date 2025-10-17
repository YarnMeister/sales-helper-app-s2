/**
 * Legacy Database Adapter Functions
 * 
 * This file provides backward-compatible functions that wrap the new
 * feature-based repository pattern. All new code should use repositories directly.
 */

import { logInfo } from './log';
import { withDbErrorHandling } from './database/core/connection';
import { getTypedRepository, registerAllRepositories } from './database/core/repository-registry';

registerAllRepositories();

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
    const repo = getTypedRepository('salesRequests');
    const result = await repo.create({
      requestId: data.request_id || undefined,
      salespersonFirstName: data.salesperson_first_name || undefined,
      salespersonSelection: data.salesperson_selection || undefined,
      mineGroup: data.mine_group || undefined,
      mineName: data.mine_name || undefined,
      contact: data.contact || null,
      lineItems: data.line_items || [],
      comment: data.comment || undefined,
      status: 'draft'
    });
    if (result.isError()) throw new Error(result.getError().message);
    const created = result.getData();
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
      created_at: created.createdAt,
      updated_at: created.updatedAt
    };
  }, 'createRequest');
};

export const addLineItemAtomic = async (requestId: string, newItem: any) => {
  return withDbErrorHandling(async () => {
    logInfo('Adding line item atomically', { requestId, itemCode: newItem.code });
    const repo = getTypedRepository('salesRequests');
    const getResult = await repo.findById(requestId);
    if (getResult.isError() || !getResult.getData()) throw new Error('Request not found');
    const currentRequest = getResult.getData();
    if (!currentRequest) throw new Error('Request not found');
    const currentLineItems = Array.isArray(currentRequest.lineItems) ? currentRequest.lineItems : [];
    const updatedLineItems = [...currentLineItems, newItem];
    const updateResult = await repo.update(requestId, { lineItems: updatedLineItems });
    if (updateResult.isError()) throw new Error(updateResult.getError().message);
    const updated = updateResult.getData();
    if (!updated) throw new Error('Request not found');
    logInfo('Line item added successfully', { requestId, newLineItemsCount: Array.isArray(updated.lineItems) ? updated.lineItems.length : 0 });
    return {
      id: updated.id, request_id: updated.requestId, salesperson_first_name: updated.salespersonFirstName,
      salesperson_selection: updated.salespersonSelection, mine_group: updated.mineGroup, mine_name: updated.mineName,
      contact: updated.contact, line_items: updated.lineItems, comment: updated.comment, status: updated.status,
      created_at: updated.createdAt, updated_at: updated.updatedAt
    };
  }, 'addLineItemAtomic');
};

export const updateRequest = async (id: string, updates: any) => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('salesRequests');
    const updateData: any = {};
    if (updates.contact !== undefined) updateData.contact = updates.contact;
    if (updates.line_items !== undefined) updateData.lineItems = updates.line_items;
    if (updates.comment !== undefined) updateData.comment = updates.comment;
    if (updates.salesperson_first_name !== undefined) updateData.salespersonFirstName = updates.salesperson_first_name;
    if (updates.salesperson_selection !== undefined) updateData.salespersonSelection = updates.salesperson_selection;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.pipedrive_deal_id !== undefined) updateData.pipedriveDealId = updates.pipedrive_deal_id;
    const result = await repo.update(id, updateData);
    if (result.isError()) throw new Error(result.getError().message);
    const updated = result.getData();
    if (!updated) throw new Error('Request not found or update failed');
    return {
      id: updated.id, request_id: updated.requestId, salesperson_first_name: updated.salespersonFirstName,
      salesperson_selection: updated.salespersonSelection, mine_group: updated.mineGroup, mine_name: updated.mineName,
      contact: updated.contact, line_items: updated.lineItems, comment: updated.comment, status: updated.status,
      pipedrive_deal_id: updated.pipedriveDealId, created_at: updated.createdAt, updated_at: updated.updatedAt
    };
  }, 'updateRequest');
};

export const getRequestById = async (id: string) => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('salesRequests');
    const result = await repo.findById(id);
    if (result.isError()) throw new Error(result.getError().message);
    const request = result.getData();
    if (!request) return null;
    return {
      id: request.id, request_id: request.requestId, salesperson_first_name: request.salespersonFirstName,
      salesperson_selection: request.salespersonSelection, mine_group: request.mineGroup, mine_name: request.mineName,
      contact: request.contact, line_items: request.lineItems, comment: request.comment, status: request.status,
      pipedrive_deal_id: request.pipedriveDealId, created_at: request.createdAt, updated_at: request.updatedAt
    };
  }, 'getRequestById');
};

export const getRequests = async (filters: { status?: string; salesperson?: string; limit?: number; }) => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('salesRequests');
    const searchFilters: any = {};
    if (filters.status) searchFilters.status = filters.status;
    if (filters.salesperson && filters.salesperson !== 'all') searchFilters.salesperson = filters.salesperson;
    const result = await repo.search(searchFilters);
    if (result.isError()) throw new Error(result.getError().message);
    return result.getData().slice(0, filters.limit || 50).map((r: any) => ({
      id: r.id, request_id: r.requestId, salesperson_first_name: r.salespersonFirstName,
      salesperson_selection: r.salespersonSelection, mine_group: r.mineGroup, mine_name: r.mineName,
      contact: r.contact, line_items: r.lineItems, comment: r.comment, status: r.status,
      pipedrive_deal_id: r.pipedriveDealId, created_at: r.createdAt, updated_at: r.updatedAt
    }));
  }, 'getRequests');
};

export const deleteRequest = async (id: string) => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('salesRequests');
    const getResult = await repo.findById(id);
    if (getResult.isError() || !getResult.getData()) return null;
    const requestToDelete = getResult.getData();
    const result = await repo.delete(id);
    if (result.isError()) throw new Error(result.getError().message);
    return {
      id: requestToDelete.id, request_id: requestToDelete.requestId, salesperson_first_name: requestToDelete.salespersonFirstName,
      salesperson_selection: requestToDelete.salespersonSelection, mine_group: requestToDelete.mineGroup,
      mine_name: requestToDelete.mineName, contact: requestToDelete.contact, line_items: requestToDelete.lineItems,
      comment: requestToDelete.comment, status: requestToDelete.status, created_at: requestToDelete.createdAt,
      updated_at: requestToDelete.updatedAt
    };
  }, 'deleteRequest');
};

export const insertDealFlowData = async (flowData: any[]) => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('pipedriveDealFlow');
    const formattedData = flowData.map((d: any) => ({
      pipedriveEventId: d.pipedrive_event_id, dealId: d.deal_id, pipelineId: d.pipeline_id,
      stageId: d.stage_id, stageName: d.stage_name, enteredAt: new Date(d.entered_at),
      leftAt: d.left_at ? new Date(d.left_at) : undefined, durationSeconds: d.duration_seconds || undefined
    }));
    const result = await repo.bulkInsertWithConflictHandling(formattedData);
    if (result.isError()) throw new Error(result.getError().message);
    return result.getData().map((r: any) => ({
      id: r.id, pipedrive_event_id: r.pipedriveEventId, deal_id: r.dealId, pipeline_id: r.pipelineId,
      stage_id: r.stageId, stage_name: r.stageName, entered_at: r.enteredAt, left_at: r.leftAt,
      duration_seconds: r.durationSeconds, created_at: r.createdAt, updated_at: r.updatedAt
    }));
  }, 'insertDealFlowData');
};

export const insertDealMetadata = async (dealMetadata: any) => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('pipedriveMetricData');
    const result = await repo.upsert({
      id: dealMetadata.id, title: dealMetadata.title, pipelineId: dealMetadata.pipeline_id,
      stageId: dealMetadata.stage_id, status: dealMetadata.status
    });
    if (result.isError()) throw new Error(result.getError().message);
    const u = result.getData();
    return { id: u.id, title: u.title, pipeline_id: u.pipelineId, stage_id: u.stageId, status: u.status, last_fetched_at: u.lastFetchedAt };
  }, 'insertDealMetadata');
};

export const getDealFlowData = async (dealId?: number) => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('pipedriveDealFlow');
    const result = dealId ? await repo.findByDealId(dealId) : await repo.findAll({});
    if (result.isError()) throw new Error(result.getError().message);
    return result.getData().map((r: any) => ({
      id: r.id, pipedrive_event_id: r.pipedriveEventId, deal_id: r.dealId, pipeline_id: r.pipelineId,
      stage_id: r.stageId, stage_name: r.stageName, entered_at: r.enteredAt, left_at: r.leftAt,
      duration_seconds: r.durationSeconds, created_at: r.createdAt, updated_at: r.updatedAt
    }));
  }, 'getDealFlowData');
};

export const getDealsForMetric = async (metricKey: string, period?: string) => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('pipedriveDealFlow');
    const result = await repo.getDealsForMetric(metricKey, period);
    if (result.isError()) throw new Error(result.getError().message);
    return result.getData();
  }, 'getDealsForMetric');
};

export const getFlowMetricsConfig = async () => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('flowMetricsConfig');
    const result = await repo.findAll(true);
    if (result.isError()) throw new Error(result.getError().message);
    return result.getData().map((c: any) => ({
      id: c.id, metric_key: c.metricKey, display_title: c.displayTitle, config: c.config,
      sort_order: c.sortOrder, is_active: c.isActive, created_at: c.createdAt, updated_at: c.updatedAt
    }));
  }, 'getFlowMetricsConfig');
};

export const getActiveFlowMetricsConfig = async (): Promise<any[]> => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('flowMetricsConfig');
    const result = await repo.getActive();
    if (result.isError()) throw new Error(result.getError().message);
    return result.getData().map((c: any) => ({
      id: c.id, metric_key: c.metricKey, display_title: c.displayTitle, config: c.config,
      sort_order: c.sortOrder, is_active: c.isActive, created_at: c.createdAt, updated_at: c.updatedAt
    }));
  }, 'getActiveFlowMetricsConfig');
};

export const getFlowMetricConfig = async (metricKeyOrId: string) => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('flowMetricsConfig');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(metricKeyOrId);
    const result = isUuid ? await repo.findById(metricKeyOrId) : await repo.getByKey(metricKeyOrId);
    if (result.isError()) throw new Error(result.getError().message);
    const config = result.getData();
    if (!config) return null;
    return {
      id: config.id, metric_key: config.metricKey, display_title: config.displayTitle, config: config.config,
      sort_order: config.sortOrder, is_active: config.isActive, created_at: config.createdAt, updated_at: config.updatedAt
    };
  }, 'getFlowMetricConfig');
};

export const createFlowMetricConfig = async (data: any) => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('flowMetricsConfig');
    const result = await repo.create({
      metricKey: data.metric_key, displayTitle: data.display_title, config: data.config || {},
      sortOrder: data.sort_order || 0, isActive: data.is_active !== false
    });
    if (result.isError()) throw new Error(result.getError().message);
    const c = result.getData();
    return {
      id: c.id, metric_key: c.metricKey, display_title: c.displayTitle, config: c.config,
      sort_order: c.sortOrder, is_active: c.isActive, created_at: c.createdAt, updated_at: c.updatedAt
    };
  }, 'createFlowMetricConfig');
};

export const updateFlowMetricConfig = async (id: string, data: any) => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('flowMetricsConfig');
    const updateData: any = {};
    if (data.display_title !== undefined) updateData.displayTitle = data.display_title;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.sort_order !== undefined) updateData.sortOrder = data.sort_order;
    if (data.is_active !== undefined) updateData.isActive = data.is_active;
    const result = await repo.update(id, updateData);
    if (result.isError()) throw new Error(result.getError().message);
    const u = result.getData();
    if (!u) throw new Error('Flow metric config not found');
    return {
      id: u.id, metric_key: u.metricKey, display_title: u.displayTitle, config: u.config,
      sort_order: u.sortOrder, is_active: u.isActive, created_at: u.createdAt, updated_at: u.updatedAt
    };
  }, 'updateFlowMetricConfig');
};

export const deleteFlowMetricConfig = async (id: string) => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('flowMetricsConfig');
    const getResult = await repo.findById(id);
    if (getResult.isError() || !getResult.getData()) throw new Error('Flow metric config not found');
    const configToDelete = getResult.getData();
    const result = await repo.delete(id);
    if (result.isError()) throw new Error(result.getError().message);
    return {
      id: configToDelete.id, metric_key: configToDelete.metricKey, display_title: configToDelete.displayTitle,
      config: configToDelete.config, sort_order: configToDelete.sortOrder, is_active: configToDelete.isActive,
      created_at: configToDelete.createdAt, updated_at: configToDelete.updatedAt
    };
  }, 'deleteFlowMetricConfig');
};

export const reorderFlowMetrics = async (reorderData: Array<{ id: string; sort_order: number }>) => {
  return withDbErrorHandling(async () => {
    const repo = getTypedRepository('flowMetricsConfig');
    const formattedData = reorderData.map((item: any) => ({ id: item.id, sortOrder: item.sort_order }));
    const result = await repo.reorderMetrics(formattedData);
    if (result.isError()) throw new Error(result.getError().message);
    return { success: true };
  }, 'reorderFlowMetrics');
};

export const getDatabaseConnection = () => {
  throw new Error('getDatabaseConnection is deprecated. Use repositories instead.');
};

export { sql } from './database/connection';
