/**
 * MetricsManagement Component
 * 
 * Manage flow metrics configurations with JSONB-based storage
 * Supports cross-pipeline metrics using PipedriveStageExplorer
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../hooks/use-toast';
import { PipedriveStageExplorer } from './PipedriveStageExplorer';
import { StageConfigDisplay } from './StageConfigDisplay';
import { useMetricConfigs } from '../hooks';
import { validateMetricConfig, generateMetricKey } from '../utils';
import type { StageSelection, MetricConfigForm } from '../types';

type SelectionMode = 'none' | 'start' | 'end';

export function MetricsManagement() {
  const { toast } = useToast();
  const { configs, loading, refresh } = useMetricConfigs();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('none');
  
  const [formData, setFormData] = useState<MetricConfigForm>({
    metricKey: '',
    displayTitle: '',
    startStage: null,
    endStage: null,
    avgMinDays: undefined,
    avgMaxDays: undefined,
    metricComment: '',
    sortOrder: 0,
    isActive: true,
  });

  const getNextSortOrder = useCallback(() => {
    if (!configs || configs.length === 0) return 1;
    return Math.max(...configs.map((m) => m.sort_order), 0) + 1;
  }, [configs]);

  const handleShowAddForm = () => {
    setShowAddForm(true);
    setFormData((prev) => ({
      ...prev,
      sortOrder: getNextSortOrder(),
    }));
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setSelectionMode('none');
    setFormData({
      metricKey: '',
      displayTitle: '',
      startStage: null,
      endStage: null,
      avgMinDays: undefined,
      avgMaxDays: undefined,
      metricComment: '',
      sortOrder: 0,
      isActive: true,
    });
  };

  const handleDisplayTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      displayTitle: value,
      // Auto-generate metric key if it hasn't been manually edited
      metricKey: prev.metricKey === '' ? generateMetricKey(value) : prev.metricKey,
    }));
  };

  const handleSelectStartStage = () => {
    setSelectionMode('start');
  };

  const handleSelectEndStage = () => {
    setSelectionMode('end');
  };

  const handleStageSelected = (stage: StageSelection) => {
    if (selectionMode === 'start') {
      setFormData((prev) => ({
        ...prev,
        startStage: stage,
      }));
    } else if (selectionMode === 'end') {
      setFormData((prev) => ({
        ...prev,
        endStage: stage,
      }));
    }
    setSelectionMode('none');
  };

  const handleCancelSelection = () => {
    setSelectionMode('none');
  };

  const handleSubmit = async () => {
    // Validate form
    const validation = validateMetricConfig(formData);

    if (!validation.valid) {
      toast({
        title: 'Validation Error',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      toast({
        title: 'Note',
        description: validation.warnings[0],
        variant: 'default',
      });
    }

    try {
      setIsSaving(true);

      if (!formData.startStage || !formData.endStage) {
        toast({
          title: 'Error',
          description: 'Both start and end stages are required',
          variant: 'destructive',
        });
        return;
      }

      // Build request body
      const requestBody = {
        metric_key: formData.metricKey,
        display_title: formData.displayTitle,
        config: {
          startStage: {
            id: formData.startStage.stageId,
            name: formData.startStage.stageName,
            pipelineId: formData.startStage.pipelineId,
            pipelineName: formData.startStage.pipelineName,
          },
          endStage: {
            id: formData.endStage.stageId,
            name: formData.endStage.stageName,
            pipelineId: formData.endStage.pipelineId,
            pipelineName: formData.endStage.pipelineName,
          },
          thresholds: {
            minDays: formData.avgMinDays,
            maxDays: formData.avgMaxDays,
          },
          comment: formData.metricComment,
        },
        sort_order: formData.sortOrder,
        is_active: formData.isActive,
      };

      const response = await fetch('/api/admin/flow-metrics-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Metric created successfully',
        });
        handleCancel();
        refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create metric',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating metric:', error);
      toast({
        title: 'Error',
        description: 'Failed to create metric',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Flow Metrics Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage metrics displayed on the main reporting page.{' '}
                {configs && `(${configs.length} metrics loaded)`}
              </p>
            </div>
            {!showAddForm && (
              <Button
                variant="outline"
                onClick={handleShowAddForm}
                disabled={isSaving || loading}
                size="sm"
                className="border-green-700 text-green-700 hover:bg-green-50"
              >
                + Add New Metric
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading metrics...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add New Metric Form */}
              {showAddForm && (
                <div className="p-6 border-2 border-green-200 rounded-lg bg-green-50">
                  <h4 className="font-medium text-gray-900 mb-4 text-lg">
                    Add New Metric
                  </h4>

                  {/* Basic Information */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label
                        htmlFor="display-title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Display Title *
                      </label>
                      <Input
                        id="display-title"
                        type="text"
                        placeholder="e.g., General Supplies Lead Time"
                        value={formData.displayTitle}
                        onChange={(e) => handleDisplayTitleChange(e.target.value)}
                        disabled={isSaving}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="metric-key"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Metric Key * <span className="text-gray-500">(auto-generated)</span>
                      </label>
                      <Input
                        id="metric-key"
                        type="text"
                        placeholder="e.g., general-supplies-lead-time"
                        value={formData.metricKey}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            metricKey: e.target.value,
                          }))
                        }
                        disabled={isSaving}
                        className="w-full font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Lowercase letters, numbers, and hyphens only
                      </p>
                    </div>
                  </div>

                  {/* Stage Selection */}
                  {selectionMode === 'none' ? (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Stage Configuration *
                      </label>
                      <StageConfigDisplay
                        startStage={formData.startStage}
                        endStage={formData.endStage}
                        onEditStart={handleSelectStartStage}
                        onEditEnd={handleSelectEndStage}
                      />
                    </div>
                  ) : (
                    <div className="mb-6">
                      <PipedriveStageExplorer
                        mode="select"
                        selectionType={selectionMode}
                        currentSelection={
                          selectionMode === 'start' ? formData.startStage : formData.endStage
                        }
                        otherStageSelection={
                          selectionMode === 'start' ? formData.endStage : formData.startStage
                        }
                        onStageSelect={handleStageSelected}
                        onCancel={handleCancelSelection}
                      />
                    </div>
                  )}

                  {/* Thresholds */}
                  {selectionMode === 'none' && (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label
                            htmlFor="min-days"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Minimum Days (Threshold)
                          </label>
                          <Input
                            id="min-days"
                            type="number"
                            placeholder="e.g., 2"
                            value={formData.avgMinDays || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                avgMinDays: e.target.value ? parseInt(e.target.value) : undefined,
                              }))
                            }
                            disabled={isSaving}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="max-days"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Maximum Days (Threshold)
                          </label>
                          <Input
                            id="max-days"
                            type="number"
                            placeholder="e.g., 14"
                            value={formData.avgMaxDays || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                avgMaxDays: e.target.value ? parseInt(e.target.value) : undefined,
                              }))
                            }
                            disabled={isSaving}
                          />
                        </div>
                      </div>

                      {/* Comment */}
                      <div className="mb-6">
                        <label
                          htmlFor="comment"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Comment
                        </label>
                        <Textarea
                          id="comment"
                          placeholder="e.g., Tracks fulfillment time for general supply orders"
                          value={formData.metricComment}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              metricComment: e.target.value,
                            }))
                          }
                          disabled={isSaving}
                          rows={3}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSubmit}
                          disabled={isSaving || !formData.startStage || !formData.endStage}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isSaving ? 'Creating...' : 'Create Metric'}
                        </Button>
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          disabled={isSaving}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Existing Metrics Table */}
              {!showAddForm && configs && configs.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="py-3 px-4 text-left font-medium text-gray-900">
                          Display Title
                        </th>
                        <th className="py-3 px-4 text-left font-medium text-gray-900">
                          Metric Key
                        </th>
                        <th className="py-3 px-4 text-left font-medium text-gray-900">
                          Configuration
                        </th>
                        <th className="py-3 px-4 text-left font-medium text-gray-900">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {configs
                        .filter((metric) => metric && metric.id)
                        .map((metric) => (
                          <tr key={metric.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{metric.display_title}</td>
                            <td className="py-3 px-4 font-mono text-sm text-gray-600">
                              {metric.metric_key}
                            </td>
                            <td className="py-3 px-4">
                              {metric.config && typeof metric.config === 'object' ? (
                                <div className="text-xs space-y-1">
                                  <div>
                                    <span className="text-gray-500">Start:</span>{' '}
                                    {(metric.config as any).startStage?.name ||
                                      metric.start_stage_id ||
                                      'N/A'}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">End:</span>{' '}
                                    {(metric.config as any).endStage?.name ||
                                      metric.end_stage_id ||
                                      'N/A'}
                                  </div>
                                  {(metric.config as any).startStage &&
                                    (metric.config as any).endStage &&
                                    (metric.config as any).startStage.pipelineId !==
                                      (metric.config as any).endStage.pipelineId && (
                                      <div className="text-blue-600 font-medium">
                                        ⚡ Cross-Pipeline
                                      </div>
                                    )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">View only</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs ${
                                  metric.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {metric.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!showAddForm && (!configs || configs.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No metrics found. Click &ldquo;Add New Metric&rdquo; to create one.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipedrive Stage Explorer (View Mode) */}
      {!showAddForm && <PipedriveStageExplorer mode="view" />}
    </div>
  );
}
