'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

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
  canonicalStage: string;
  startStage: string;
  endStage: string;
}

export const CanonicalStageMappings: React.FC = () => {
  const [mappings, setMappings] = useState<CanonicalStageMapping[]>([
    {
      id: '1',
      canonicalStage: 'Order Conversion',
      startStage: 'Order Received - Johan',
      endStage: 'Order Inv Paid'
    }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CanonicalStageMapping>>({});

  const handleEdit = (mapping: CanonicalStageMapping) => {
    setEditingId(mapping.id);
    setEditForm({
      canonicalStage: mapping.canonicalStage,
      startStage: mapping.startStage,
      endStage: mapping.endStage
    });
  };

  const handleSave = () => {
    if (editingId && editForm.canonicalStage && editForm.startStage && editForm.endStage) {
      setMappings(mappings.map(mapping => 
        mapping.id === editingId 
          ? { ...mapping, ...editForm }
          : mapping
      ));
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Canonical Stage Mappings</CardTitle>
        <p className="text-sm text-gray-600">
          Define mappings between Pipedrive stages and canonical stages for Order Conversion analysis
        </p>
      </CardHeader>
      <CardContent>
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
                        value={editForm.canonicalStage || ''}
                        onChange={(e) => setEditForm({ ...editForm, canonicalStage: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      mapping.canonicalStage
                    )}
                  </td>
                  <td className="py-2 px-2 text-gray-700">
                    {editingId === mapping.id ? (
                      <select
                        value={editForm.startStage || ''}
                        onChange={(e) => setEditForm({ ...editForm, startStage: e.target.value })}
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
                      mapping.startStage
                    )}
                  </td>
                  <td className="py-2 px-2 text-gray-700">
                    {editingId === mapping.id ? (
                      <select
                        value={editForm.endStage || ''}
                        onChange={(e) => setEditForm({ ...editForm, endStage: e.target.value })}
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
                      mapping.endStage
                    )}
                  </td>
                  <td className="py-2 px-2 text-gray-600">
                    {editingId === mapping.id ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSave}
                          size="sm"
                          className="text-xs px-2 py-1"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={handleCancel}
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
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Order Conversion Focus</h4>
          <p className="text-sm text-gray-600">
            This mapping defines the Order Conversion canonical stage, which tracks the time from when an order is received 
            until payment is confirmed. This helps measure the efficiency of the order processing workflow.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
