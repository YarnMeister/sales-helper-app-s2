'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { PipedriveStageExplorer } from './PipedriveStageExplorer';

// Static list of stages from the database
const STAGE_OPTIONS = [
  'RFQ Received',
  'RFQ Sent',
  'Order Received - Johan',
  'In Progress- Johan',
  'Order Ready - Johan',
  'Delivery Scheduled',
  'Quality Control',
  'Order Inv Paid',
  'Units Collected',
  'Generate Quote',
  'Quote Sent - Repair',
  'Order Received - Repair',
  'Generate Invoice',
];

interface FlowMetricConfig {
  id: string;
  metric_key: string;
  display_title: string;
  canonical_stage: string;
  sort_order: number;
  is_active: boolean;
  start_stage_id?: number;
  end_stage_id?: number;
  avg_min_days?: number;
  avg_max_days?: number;
  metric_comment?: string;
  created_at: string;
  updated_at: string;
}

export const MetricsManagement: React.FC = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<FlowMetricConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FlowMetricConfig>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    metric_key: '',
    display_title: '',
    canonical_stage: '',
    start_stage_id: '',
    end_stage_id: '',
    avg_min_days: '',
    avg_max_days: '',
    metric_comment: '',
    sort_order: 0,
    is_active: true
  });

  // Load metrics from database
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/flow-metrics-config');
        const result = await response.json();
        
        if (result.success) {
          setMetrics(result.data || []);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to fetch metrics",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
        toast({
          title: "Error",
          description: "Failed to fetch metrics",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [toast]); // Include toast in dependency array

  const handleEdit = (metric: FlowMetricConfig) => {
    setEditingId(metric.id);
    setEditForm({
      display_title: metric.display_title,
      canonical_stage: metric.canonical_stage,
      start_stage_id: metric.start_stage_id || undefined,
      end_stage_id: metric.end_stage_id || undefined,
      avg_min_days: metric.avg_min_days || undefined,
      avg_max_days: metric.avg_max_days || undefined,
      metric_comment: metric.metric_comment || undefined,
      sort_order: metric.sort_order,
      is_active: metric.is_active
    });
  };

  const handleSave = async () => {
    if (!editingId || !editForm.display_title || !editForm.canonical_stage) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/flow-metrics-config/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const result = await response.json();

      if (result.success) {
        setMetrics(metrics.map(metric => 
          metric.id === editingId 
            ? result.data
            : metric
        ));
        setEditingId(null);
        setEditForm({});
        toast({
          title: "Success",
          description: "Metric updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update metric",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating metric:', error);
      toast({
        title: "Error",
        description: "Failed to update metric",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
    setShowAddForm(false);
    setAddForm({
      metric_key: '',
      display_title: '',
      canonical_stage: '',
      start_stage_id: '',
      end_stage_id: '',
      avg_min_days: '',
      avg_max_days: '',
      metric_comment: '',
      sort_order: 0,
      is_active: true
    });
  };

  const handleAdd = async () => {
    if (!addForm.metric_key || !addForm.display_title || !addForm.canonical_stage) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate metric_key format
    if (!/^[a-z0-9-]+$/.test(addForm.metric_key)) {
      toast({
        title: "Error",
        description: "Metric key must be in kebab-case format (e.g., lead-conversion)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/flow-metrics-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addForm),
      });

      const result = await response.json();

      if (result.success) {
        setMetrics([...metrics, result.data]);
        setShowAddForm(false);
        setAddForm({
          metric_key: '',
          display_title: '',
          canonical_stage: '',
          start_stage_id: '',
          end_stage_id: '',
          avg_min_days: '',
          avg_max_days: '',
          metric_comment: '',
          sort_order: 0,
          is_active: true
        });
        toast({
          title: "Success",
          description: "New metric added successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add metric",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding metric:', error);
      toast({
        title: "Error",
        description: "Failed to add metric",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this metric? This will also remove it from the main page.')) {
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/flow-metrics-config/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setMetrics(metrics.filter(metric => metric.id !== id));
        toast({
          title: "Success",
          description: "Metric deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete metric",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting metric:', error);
      toast({
        title: "Error",
        description: "Failed to delete metric",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getNextSortOrder = () => {
    return Math.max(...metrics.map(m => m.sort_order), 0) + 1;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Flow Metrics Management</CardTitle>
              <p className="text-sm text-gray-600">
                Manage metrics displayed on the main reporting page. Add, edit, or delete metrics to customize your dashboard.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(true);
                setAddForm(prev => ({ ...prev, sort_order: getNextSortOrder() }));
              }}
              disabled={isSaving}
              size="sm"
              className="border-green-700 text-green-700 hover:bg-green-50"
            >
              Add New Metric
            </Button>
          </div>
        </CardHeader>
        <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading metrics...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add New Metric Form */}
            {showAddForm && (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Add New Metric</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="metric-key" className="block text-sm font-medium text-gray-700 mb-1">
                      Metric Key *
                    </label>
                    <input
                      id="metric-key"
                      type="text"
                      value={addForm.metric_key}
                      onChange={(e) => setAddForm({ ...addForm, metric_key: e.target.value })}
                      placeholder="e.g., lead-conversion"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="display-title" className="block text-sm font-medium text-gray-700 mb-1">
                      Display Title *
                    </label>
                    <input
                      id="display-title"
                      type="text"
                      value={addForm.display_title}
                      onChange={(e) => setAddForm({ ...addForm, display_title: e.target.value })}
                      placeholder="e.g., Lead Conversion Time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="canonical-stage" className="block text-sm font-medium text-gray-700 mb-1">
                      Canonical Stage *
                    </label>
                    <input
                      id="canonical-stage"
                      type="text"
                      value={addForm.canonical_stage}
                      onChange={(e) => setAddForm({ ...addForm, canonical_stage: e.target.value })}
                      placeholder="e.g., Lead Conversion"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      id="sort-order"
                      type="number"
                      value={addForm.sort_order}
                      onChange={(e) => setAddForm({ ...addForm, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="start-stage-id" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Stage ID
                    </label>
                    <input
                      id="start-stage-id"
                      type="number"
                      value={addForm.start_stage_id || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          setAddForm({ ...addForm, start_stage_id: value });
                        }
                      }}
                      placeholder="Enter stage ID (e.g., 104)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="end-stage-id" className="block text-sm font-medium text-gray-700 mb-1">
                      End Stage ID
                    </label>
                    <input
                      id="end-stage-id"
                      type="number"
                      value={addForm.end_stage_id || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          setAddForm({ ...addForm, end_stage_id: value });
                        }
                      }}
                      placeholder="Enter stage ID (e.g., 108)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="avg-min-days" className="block text-sm font-medium text-gray-700 mb-1">
                      Avg Min (days)
                    </label>
                    <input
                      id="avg-min-days"
                      type="number"
                      value={addForm.avg_min_days || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          setAddForm({ ...addForm, avg_min_days: value });
                        }
                      }}
                      placeholder="Enter minimum threshold (e.g., 1)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="avg-max-days" className="block text-sm font-medium text-gray-700 mb-1">
                      Avg Max (days)
                    </label>
                    <input
                      id="avg-max-days"
                      type="number"
                      value={addForm.avg_max_days || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          setAddForm({ ...addForm, avg_max_days: value });
                        }
                      }}
                      placeholder="Enter maximum threshold (e.g., 30)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="metric-comment" className="block text-sm font-medium text-gray-700 mb-1">
                      Comment
                    </label>
                    <textarea
                      id="metric-comment"
                      value={addForm.metric_comment || ''}
                      onChange={(e) => setAddForm({ ...addForm, metric_comment: e.target.value })}
                      placeholder="Enter narrative or interpretation about this metric"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={addForm.is_active}
                    onChange={(e) => setAddForm({ ...addForm, is_active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Active (show on main page)
                  </label>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={handleAdd}
                    disabled={isSaving}
                    size="sm"
                    className="border-green-700 text-green-700 hover:bg-green-50"
                  >
                    {isSaving ? 'Adding...' : 'Add Metric'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={isSaving}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Metrics Table */}
            {metrics.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                                 <div className="text-gray-500">No metrics found. Click &quot;Add New Metric&quot; to create one.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Metric Key</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Display Title</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Canonical Stage</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Start Stage ID</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">End Stage ID</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Avg Min</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Avg Max</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Sort</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Status</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.filter(metric => metric && metric.id).map((metric) => (
                      <tr key={metric.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-2 text-gray-900 font-mono text-xs">
                          {editingId === metric.id ? (
                            <input
                              type="text"
                              value={editForm.metric_key || metric.metric_key}
                              disabled
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100"
                            />
                          ) : (
                            metric.metric_key
                          )}
                        </td>
                        <td className="py-2 px-2 text-gray-900">
                          {editingId === metric.id ? (
                            <input
                              type="text"
                              value={editForm.display_title || ''}
                              onChange={(e) => setEditForm({ ...editForm, display_title: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            metric.display_title
                          )}
                        </td>
                        <td className="py-2 px-2 text-gray-700">
                          {editingId === metric.id ? (
                            <input
                              type="text"
                              value={editForm.canonical_stage || ''}
                              onChange={(e) => setEditForm({ ...editForm, canonical_stage: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            metric.canonical_stage
                          )}
                        </td>
                        <td className="py-2 px-2 text-gray-700">
                          {editingId === metric.id ? (
                            <input
                              type="number"
                              value={editForm.start_stage_id || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*$/.test(value)) {
                                  setEditForm({ ...editForm, start_stage_id: value ? Number(value) : undefined });
                                }
                              }}
                              placeholder="Enter stage ID"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            metric.start_stage_id || '-'
                          )}
                        </td>
                        <td className="py-2 px-2 text-gray-700">
                          {editingId === metric.id ? (
                            <input
                              type="number"
                              value={editForm.end_stage_id || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*$/.test(value)) {
                                  setEditForm({ ...editForm, end_stage_id: value ? Number(value) : undefined });
                                }
                              }}
                              placeholder="Enter stage ID"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            metric.end_stage_id || '-'
                          )}
                        </td>
                        <td className="py-2 px-2 text-gray-700">
                          {editingId === metric.id ? (
                            <input
                              type="number"
                              value={editForm.avg_min_days || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*$/.test(value)) {
                                  setEditForm({ ...editForm, avg_min_days: value ? Number(value) : undefined });
                                }
                              }}
                              placeholder="Min days"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            metric.avg_min_days || '-'
                          )}
                        </td>
                        <td className="py-2 px-2 text-gray-700">
                          {editingId === metric.id ? (
                            <input
                              type="number"
                              value={editForm.avg_max_days || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*$/.test(value)) {
                                  setEditForm({ ...editForm, avg_max_days: value ? Number(value) : undefined });
                                }
                              }}
                              placeholder="Max days"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            metric.avg_max_days || '-'
                          )}
                        </td>
                        <td className="py-2 px-2 text-gray-700">
                          {editingId === metric.id ? (
                            <input
                              type="number"
                              value={editForm.sort_order || 0}
                              onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) || 0 })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            metric.sort_order
                          )}
                        </td>
                        <td className="py-2 px-2 text-gray-700">
                          {editingId === metric.id ? (
                            <input
                              type="checkbox"
                              checked={editForm.is_active !== false}
                              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              metric.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {metric.is_active ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-gray-600">
                          {editingId === metric.id ? (
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                size="sm"
                                className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white"
                              >
                                {isSaving ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                onClick={handleCancel}
                                disabled={isSaving}
                                variant="outline"
                                size="sm"
                                className="text-xs px-2 py-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleEdit(metric)}
                                variant="outline"
                                size="sm"
                                className="text-xs px-2 py-1"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDelete(metric.id)}
                                disabled={isSaving}
                                variant="outline"
                                size="sm"
                                className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Flow Metrics Management</h4>
              <p className="text-sm text-gray-600">
                Manage the metrics displayed on the main reporting page. Each metric represents a stage in your sales process 
                and can be configured with start and end stages for lead time calculation. Active metrics will appear as 
                widgets on the main page, while inactive metrics are hidden but can be reactivated at any time.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      </Card>

      {/* Pipedrive Stage Explorer */}
      <PipedriveStageExplorer />
    </div>
  );
};
