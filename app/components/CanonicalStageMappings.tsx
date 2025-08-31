'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';

interface CanonicalStageMapping {
  id: string;
  canonical_stage: string;
  start_stage: string;
  end_stage: string;
  start_stage_id?: number | null;
  end_stage_id?: number | null;
  created_at: string;
  updated_at: string;
  avg_min_days?: number | null;
  avg_max_days?: number | null;
  metric_comment?: string | null;
  metric_config_id?: string | null;
}

interface StageInfo {
  [stageId: number]: {
    name: string;
    pipeline_id: number;
    pipeline_name: string;
  };
}

export const CanonicalStageMappings: React.FC = () => {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<CanonicalStageMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CanonicalStageMapping>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [stageInfo, setStageInfo] = useState<StageInfo>({});

  // Helper function to validate stage ID input
  const validateStageId = (value: string): boolean => {
    return /^\d*$/.test(value); // Only allow digits
  };

  // Helper function to handle stage ID changes
  const handleStageIdChange = (field: 'start_stage_id' | 'end_stage_id', value: string) => {
    if (validateStageId(value)) {
      setEditForm({ ...editForm, [field]: value ? parseInt(value) : null });
    }
  };

  // Helper function to resolve stage names from stage IDs
  const resolveStageNames = useCallback(async (stageIds: number[]) => {
    if (stageIds.length === 0) return;

    try {
      const response = await fetch('/api/pipedrive/resolve-stage-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage_ids: stageIds }),
      });

      const result = await response.json();
      if (result.success) {
        setStageInfo(result.data);
      }
    } catch (error) {
      console.error('Error resolving stage names:', error);
    }
  }, []);

  // Load mappings from database
  useEffect(() => {
    const fetchMappings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/canonical-mappings');
        const result = await response.json();
        
        if (result.success) {
          setMappings(result.data || []);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to fetch mappings",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching mappings:', error);
        toast({
          title: "Error",
          description: "Failed to fetch mappings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMappings();
  }, [toast]);

  const handleEdit = (mapping: CanonicalStageMapping) => {
    setEditingId(mapping.id);
    setEditForm({
      canonical_stage: mapping.canonical_stage,
      start_stage_id: mapping.start_stage_id,
      end_stage_id: mapping.end_stage_id,
      start_stage: mapping.start_stage,
      end_stage: mapping.end_stage,
      avg_min_days: mapping.avg_min_days,
      avg_max_days: mapping.avg_max_days,
      metric_comment: mapping.metric_comment
    });

    // Resolve stage names for display only if we don't already have them
    const stageIds = [];
    if (mapping.start_stage_id) stageIds.push(mapping.start_stage_id);
    if (mapping.end_stage_id) stageIds.push(mapping.end_stage_id);
    
    // Only fetch if we don't already have the stage info
    const missingStageIds = stageIds.filter(id => !stageInfo[id]);
    if (missingStageIds.length > 0) {
      resolveStageNames(missingStageIds);
    }
  };

  const handleSave = async () => {
    if (!editingId || !editForm.canonical_stage) {
      toast({
        title: "Error",
        description: "Please fill in the canonical stage field",
        variant: "destructive",
      });
      return;
    }

    // Require either stage IDs or stage names
    if ((!editForm.start_stage_id && !editForm.start_stage) || (!editForm.end_stage_id && !editForm.end_stage)) {
      toast({
        title: "Error",
        description: "Please fill in both start and end stages (either as IDs or names)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/canonical-mappings/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          canonical_stage: editForm.canonical_stage,
          start_stage_id: editForm.start_stage_id,
          end_stage_id: editForm.end_stage_id,
          start_stage: editForm.start_stage,
          end_stage: editForm.end_stage,
          avg_min_days: editForm.avg_min_days,
          avg_max_days: editForm.avg_max_days,
          metric_comment: editForm.metric_comment
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMappings(mappings.map(mapping => 
          mapping.id === editingId 
            ? result.data
            : mapping
        ));
        setEditingId(null);
        setEditForm({});
        toast({
          title: "Success",
          description: "Mapping updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update mapping",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating mapping:', error);
      toast({
        title: "Error",
        description: "Failed to update mapping",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAddNew = async () => {
    const newMapping = {
      canonical_stage: 'New Canonical Stage',
      start_stage_id: null,
      end_stage_id: null,
      start_stage: '',
      end_stage: ''
    };

    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/canonical-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMapping),
      });

      const result = await response.json();

      if (result.success) {
        setMappings([...mappings, result.data]);
        toast({
          title: "Success",
          description: "New mapping added successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add mapping",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding mapping:', error);
      toast({
        title: "Error",
        description: "Failed to add mapping",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Canonical Stage Mappings</CardTitle>
            <p className="text-sm text-gray-600">
              Define mappings between Pipedrive stages and canonical stages for lead time analysis
            </p>
          </div>
          <Button
            onClick={handleAddNew}
            disabled={isSaving}
            size="sm"
          >
            Add New Mapping
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading mappings...</div>
          </div>
        ) : mappings.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">No mappings found. Click &quot;Add New Mapping&quot; to create one.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Canonical Stage</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Start Stage ID</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Start Stage Name</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700">End Stage ID</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700">End Stage Name</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Avg Min Days</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Avg Max Days</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Comment</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((mapping) => (
                  <tr key={mapping.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-gray-900 font-medium">
                      {editingId === mapping.id ? (
                        <input
                          type="text"
                          value={editForm.canonical_stage || ''}
                          onChange={(e) => setEditForm({ ...editForm, canonical_stage: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        mapping.canonical_stage
                      )}
                    </td>
                    <td className="py-2 px-2 text-gray-700">
                      {editingId === mapping.id ? (
                        <input
                          type="number"
                          value={editForm.start_stage_id || ''}
                          onChange={(e) => handleStageIdChange('start_stage_id', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Enter Stage ID"
                        />
                      ) : (
                        mapping.start_stage_id || '-'
                      )}
                    </td>
                    <td className="py-2 px-2 text-gray-700">
                      {editingId === mapping.id ? (
                        <input
                          type="text"
                          value={editForm.start_stage || ''}
                          onChange={(e) => setEditForm({ ...editForm, start_stage: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Stage name (optional)"
                        />
                      ) : (
                        mapping.start_stage_id && stageInfo[mapping.start_stage_id] 
                          ? stageInfo[mapping.start_stage_id].name 
                          : mapping.start_stage || '-'
                      )}
                    </td>
                    <td className="py-2 px-2 text-gray-700">
                      {editingId === mapping.id ? (
                        <input
                          type="number"
                          value={editForm.end_stage_id || ''}
                          onChange={(e) => handleStageIdChange('end_stage_id', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Enter Stage ID"
                        />
                      ) : (
                        mapping.end_stage_id || '-'
                      )}
                    </td>
                    <td className="py-2 px-2 text-gray-700">
                      {editingId === mapping.id ? (
                        <input
                          type="text"
                          value={editForm.end_stage || ''}
                          onChange={(e) => setEditForm({ ...editForm, end_stage: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Stage name (optional)"
                        />
                      ) : (
                        mapping.end_stage_id && stageInfo[mapping.end_stage_id] 
                          ? stageInfo[mapping.end_stage_id].name 
                          : mapping.end_stage || '-'
                      )}
                    </td>

                    <td className="py-2 px-2 text-gray-700">
                      {editingId === mapping.id ? (
                        <input
                          type="number"
                          value={editForm.avg_min_days || ''}
                          onChange={(e) => setEditForm({ ...editForm, avg_min_days: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Min days"
                        />
                      ) : (
                        mapping.avg_min_days || '-'
                      )}
                    </td>
                    <td className="py-2 px-2 text-gray-700">
                      {editingId === mapping.id ? (
                        <input
                          type="number"
                          value={editForm.avg_max_days || ''}
                          onChange={(e) => setEditForm({ ...editForm, avg_max_days: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Max days"
                        />
                      ) : (
                        mapping.avg_max_days || '-'
                      )}
                    </td>
                    <td className="py-2 px-2 text-gray-700">
                      {editingId === mapping.id ? (
                        <input
                          type="text"
                          value={editForm.metric_comment || ''}
                          onChange={(e) => setEditForm({ ...editForm, metric_comment: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Comment"
                        />
                      ) : (
                        <span className="max-w-xs truncate" title={mapping.metric_comment || ''}>
                          {mapping.metric_comment || '-'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-gray-600">
                      {editingId === mapping.id ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            size="sm"
                            className="text-xs px-2 py-1"
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
                        <Button
                          onClick={() => handleEdit(mapping)}
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 py-1"
                        >
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Canonical Stage Mappings</h4>
          <p className="text-sm text-gray-600">
            Define mappings between Pipedrive stage IDs and canonical stages for lead time analysis. 
            Each mapping specifies a start and end stage ID, and the system will calculate the time 
            between when deals entered these stages to measure lifecycle efficiency. 
            Stage IDs are preferred over stage names for accuracy and consistency.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
