'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';

// Static list of stages from the database (as shown in the screenshot)
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
  // Note: Some stages appear twice in the original list, keeping unique values
];

interface CanonicalStageMapping {
  id: string;
  canonical_stage: string;
  start_stage: string;
  end_stage: string;
  created_at: string;
  updated_at: string;
}

export const CanonicalStageMappings: React.FC = () => {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<CanonicalStageMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CanonicalStageMapping>>({});
  const [isSaving, setIsSaving] = useState(false);

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
      start_stage: mapping.start_stage,
      end_stage: mapping.end_stage
    });
  };

  const handleSave = async () => {
    if (!editingId || !editForm.canonical_stage || !editForm.start_stage || !editForm.end_stage) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
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
          start_stage: editForm.start_stage,
          end_stage: editForm.end_stage
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
      start_stage: 'Start Stage',
      end_stage: 'End Stage'
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
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Start Stage</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700">End Stage</th>
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
                        <select
                          value={editForm.start_stage || ''}
                          onChange={(e) => setEditForm({ ...editForm, start_stage: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Select Start Stage</option>
                          {STAGE_OPTIONS.map((stage) => (
                            <option key={stage} value={stage}>
                              {stage}
                            </option>
                          ))}
                        </select>
                      ) : (
                        mapping.start_stage
                      )}
                    </td>
                    <td className="py-2 px-2 text-gray-700">
                      {editingId === mapping.id ? (
                        <select
                          value={editForm.end_stage || ''}
                          onChange={(e) => setEditForm({ ...editForm, end_stage: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Select End Stage</option>
                          {STAGE_OPTIONS.map((stage) => (
                            <option key={stage} value={stage}>
                              {stage}
                            </option>
                          ))}
                        </select>
                      ) : (
                        mapping.end_stage
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
            Define mappings between Pipedrive stages and canonical stages for lead time analysis. 
            Each mapping specifies a start and end stage, and the system will calculate the time 
            between when deals entered these stages to measure lifecycle efficiency.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
