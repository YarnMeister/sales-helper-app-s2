/**
 * PipedriveStageExplorer Component
 * 
 * Displays Pipedrive pipelines and stages with two modes:
 * - View mode: Read-only accordion view of all pipelines/stages
 * - Select mode: Interactive stage selection for metric configuration
 * 
 * Supports cross-pipeline metric selection (start and end stages can be in different pipelines)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ChevronDown, ChevronRight, RefreshCw, Check } from 'lucide-react';
import type { StageSelection } from '../types';

interface Pipeline {
  id: number;
  name: string;
  order_nr: number;
  active: boolean;
  stages?: Stage[];
  stagesLoading?: boolean;
  stagesError?: string | null;
}

interface Stage {
  id: number;
  name: string;
  order_nr: number;
  pipeline_id: number;
  active_flag: boolean;
  deal_probability: number;
}

interface ExplorerState {
  loading: boolean;
  error: string | null;
  data: Pipeline[] | null;
  pipelineCollapsed: Record<number, boolean>;
}

interface PipedriveStageExplorerProps {
  mode?: 'view' | 'select';
  selectionType?: 'start' | 'end';
  currentSelection?: StageSelection | null;
  otherStageSelection?: StageSelection | null;
  onStageSelect?: (stage: StageSelection) => void;
  onCancel?: () => void;
}

export function PipedriveStageExplorer({
  mode = 'view',
  selectionType,
  currentSelection,
  otherStageSelection,
  onStageSelect,
  onCancel,
}: PipedriveStageExplorerProps) {
  const [explorerState, setExplorerState] = useState<ExplorerState>({
    loading: true,
    error: null,
    data: null,
    pipelineCollapsed: {},
  });

  const [tempSelection, setTempSelection] = useState<StageSelection | null>(
    currentSelection || null
  );

  // Load pipelines on component mount
  useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchStagesForPipeline = async (pipelineId: number): Promise<Stage[]> => {
    const response = await fetch(`/api/pipedrive/stages?pipeline_id=${pipelineId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch stages');
    }

    return data.success ? data.data : [];
  };

  const fetchPipelines = async () => {
    setExplorerState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/pipedrive/pipelines');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pipelines');
      }

      // Initialize pipelines without stages (will be loaded on demand)
      const pipelinesWithStages = data.success && data.data
        ? data.data.map((pipeline: Pipeline) => ({
            ...pipeline,
            stages: undefined,
            stagesLoading: false,
            stagesError: null,
          }))
        : [];

      // Initialize all pipelines as collapsed
      const pipelineCollapsed: Record<number, boolean> = {};
      pipelinesWithStages.forEach((pipeline: Pipeline) => {
        pipelineCollapsed[pipeline.id] = true;
      });

      setExplorerState((prev) => ({
        ...prev,
        loading: false,
        data: pipelinesWithStages,
        pipelineCollapsed,
      }));
    } catch (error) {
      console.error('Fetch pipelines error:', error);
      setExplorerState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  const togglePipelineCollapse = (pipelineId: number) => {
    setExplorerState((prev) => {
      const isCollapsed = prev.pipelineCollapsed[pipelineId];
      const newCollapsedState = !isCollapsed;

      // If expanding and stages haven't been loaded yet, set loading state
      if (isCollapsed && prev.data) {
        const pipeline = prev.data.find((p) => p.id === pipelineId);
        if (pipeline && (!pipeline.stages || pipeline.stages.length === 0)) {
          // Set loading state for this pipeline
          const updatedData = prev.data.map((p) =>
            p.id === pipelineId ? { ...p, stagesLoading: true, stagesError: null } : p
          );

          // Fetch stages asynchronously
          fetchStagesForPipeline(pipelineId)
            .then((stages) => {
              setExplorerState((current) => ({
                ...current,
                data:
                  current.data?.map((p) =>
                    p.id === pipelineId
                      ? { ...p, stages, stagesLoading: false, stagesError: null }
                      : p
                  ) || null,
              }));
            })
            .catch((error) => {
              setExplorerState((current) => ({
                ...current,
                data:
                  current.data?.map((p) =>
                    p.id === pipelineId
                      ? {
                          ...p,
                          stagesLoading: false,
                          stagesError:
                            error instanceof Error ? error.message : 'Unknown error',
                        }
                      : p
                  ) || null,
              }));
            });

          return {
            ...prev,
            pipelineCollapsed: {
              ...prev.pipelineCollapsed,
              [pipelineId]: newCollapsedState,
            },
            data: updatedData,
          };
        }
      }

      // Just toggle collapse state
      return {
        ...prev,
        pipelineCollapsed: {
          ...prev.pipelineCollapsed,
          [pipelineId]: newCollapsedState,
        },
      };
    });
  };

  const handleStageClick = (stage: Stage, pipeline: Pipeline) => {
    if (mode !== 'select') return;

    const selection: StageSelection = {
      stageId: stage.id,
      stageName: stage.name,
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
    };

    setTempSelection(selection);
  };

  const handleConfirmSelection = () => {
    if (tempSelection && onStageSelect) {
      onStageSelect(tempSelection);
    }
  };

  const handleCancelSelection = () => {
    setTempSelection(currentSelection || null);
    if (onCancel) {
      onCancel();
    }
  };

  const isStageSelected = (stageId: number) => {
    return tempSelection?.stageId === stageId;
  };

  const isStageFromOtherSelection = (stageId: number) => {
    return otherStageSelection?.stageId === stageId;
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-blue-800">
              🏗️ Pipedrive Stage Explorer
              {mode === 'select' && selectionType && (
                <span className="ml-2 text-sm font-normal">
                  - Select {selectionType === 'start' ? 'Start' : 'End'} Stage
                </span>
              )}
            </span>
            {explorerState.loading && (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fetchPipelines();
            }}
            className="border-blue-500 text-blue-600 hover:bg-blue-100"
            aria-label="Refresh pipelines"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-white">
        {/* Loading State */}
        {explorerState.loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading pipelines...</span>
          </div>
        )}

        {/* Error State */}
        {explorerState.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error loading pipelines:</p>
            <p className="text-red-600 text-sm">{explorerState.error}</p>
          </div>
        )}

        {/* Data Display */}
        {explorerState.data && !explorerState.loading && (
          <div className="space-y-4">
            {explorerState.data.length > 0 ? (
              <>
                {explorerState.data.map((pipeline: Pipeline) => {
                  const isCollapsed = explorerState.pipelineCollapsed[pipeline.id];
                  return (
                    <div key={pipeline.id} className="border-2 border-blue-300 rounded-lg">
                      {/* Pipeline Header */}
                      <div
                        className="bg-blue-100 px-4 py-3 border-b border-blue-300 cursor-pointer hover:bg-blue-200 transition-colors"
                        onClick={() => togglePipelineCollapse(pipeline.id)}
                        role="button"
                        tabIndex={0}
                        aria-expanded={!isCollapsed}
                        aria-label={`Toggle ${pipeline.name} stages`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            <div>
                              <h3 className="font-bold text-blue-900 text-lg">
                                {pipeline.name}
                              </h3>
                              <div className="text-sm text-blue-700">
                                <span className="font-medium">Pipeline ID: {pipeline.id}</span>
                                <span className="mx-2">•</span>
                                <span>Order: {pipeline.order_nr}</span>
                                <span className="mx-2">•</span>
                                <Badge
                                  variant={pipeline.active ? 'default' : 'secondary'}
                                  className={
                                    pipeline.active
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }
                                >
                                  {pipeline.active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {pipeline.stagesLoading && (
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                          )}
                        </div>
                      </div>

                      {/* Stages Table */}
                      {!isCollapsed && (
                        <div className="p-4">
                          {pipeline.stagesLoading && (
                            <div className="flex items-center justify-center py-4">
                              <RefreshCw className="w-4 h-4 animate-spin text-blue-500 mr-2" />
                              <span className="text-gray-600">Loading stages...</span>
                            </div>
                          )}

                          {pipeline.stagesError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                              <p className="text-red-800 font-medium">Error loading stages:</p>
                              <p className="text-red-600 text-sm">{pipeline.stagesError}</p>
                            </div>
                          )}

                          {pipeline.stages &&
                          pipeline.stages.length > 0 &&
                          !pipeline.stagesLoading &&
                          !pipeline.stagesError ? (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-blue-300">
                                <thead>
                                  <tr className="bg-blue-50">
                                    {mode === 'select' && (
                                      <th className="border border-blue-300 px-4 py-2 w-12"></th>
                                    )}
                                    <th className="border border-blue-300 px-4 py-2 text-left font-bold">
                                      Stage ID
                                    </th>
                                    <th className="border border-blue-300 px-4 py-2 text-left font-bold">
                                      Stage Name
                                    </th>
                                    <th className="border border-blue-300 px-4 py-2 text-left font-bold">
                                      Order
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pipeline.stages.map((stage: Stage) => {
                                    const selected = isStageSelected(stage.id);
                                    const fromOther = isStageFromOtherSelection(stage.id);
                                    
                                    return (
                                      <tr
                                        key={stage.id}
                                        className={`
                                          ${mode === 'select' ? 'cursor-pointer' : ''} 
                                          ${selected ? 'bg-green-100' : 'hover:bg-blue-50'}
                                          ${fromOther ? 'bg-amber-50' : ''}
                                        `}
                                        onClick={() =>
                                          mode === 'select' && handleStageClick(stage, pipeline)
                                        }
                                      >
                                        {mode === 'select' && (
                                          <td className="border border-blue-300 px-4 py-2 text-center">
                                            <div className="flex items-center justify-center">
                                              {selected && (
                                                <Check className="w-5 h-5 text-green-600" />
                                              )}
                                              {fromOther && !selected && (
                                                <span className="text-amber-600 text-xs">
                                                  {selectionType === 'start' ? 'End' : 'Start'}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                        )}
                                        <td className="border border-blue-300 px-4 py-2 font-mono font-bold text-blue-800">
                                          {stage.id}
                                        </td>
                                        <td className="border border-blue-300 px-4 py-2 font-medium">
                                          {stage.name}
                                        </td>
                                        <td className="border border-blue-300 px-4 py-2">
                                          {stage.order_nr}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            !pipeline.stagesLoading &&
                            !pipeline.stagesError &&
                            pipeline.stages &&
                            pipeline.stages.length === 0 && (
                              <p className="text-gray-500 text-center py-4">
                                No stages found for this pipeline
                              </p>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Selection Actions (in select mode) */}
                {mode === 'select' && (
                  <div className="flex gap-3 pt-4 border-t border-blue-300">
                    <Button
                      onClick={handleConfirmSelection}
                      disabled={!tempSelection}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Confirm Selection
                    </Button>
                    <Button
                      onClick={handleCancelSelection}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Current Selection Display (in select mode) */}
                {mode === 'select' && tempSelection && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
                    <div className="text-sm font-medium text-green-900 mb-1">
                      Current Selection:
                    </div>
                    <div className="text-sm text-green-800">
                      <span className="font-medium">{tempSelection.stageName}</span>
                      <span className="text-green-600 mx-2">•</span>
                      <span>{tempSelection.pipelineName}</span>
                      <span className="text-green-600 mx-2">•</span>
                      <span className="font-mono">Stage ID: {tempSelection.stageId}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">No pipelines found</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
