'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';

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

export const PipedriveStageExplorer: React.FC = () => {
  const [explorerState, setExplorerState] = useState<ExplorerState>({
    loading: true,
    error: null,
    data: null,
    pipelineCollapsed: {},
  });

  // Load pipelines on component mount
  useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchStagesForPipeline = async (pipelineId: number): Promise<Stage[]> => {
    const response = await fetch(`/api/pipedrive/stages?pipeline_id=${pipelineId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch stages");
    }

    return data.success ? data.data : [];
  };

  const fetchPipelines = async () => {
    setExplorerState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch("/api/pipedrive/pipelines");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch pipelines");
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

      setExplorerState(prev => ({ 
        ...prev, 
        loading: false, 
        data: pipelinesWithStages,
        pipelineCollapsed
      }));
    } catch (error) {
      console.error("Fetch pipelines error:", error);
      setExplorerState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  };

  const togglePipelineCollapse = (pipelineId: number) => {
    setExplorerState(prev => {
      const isCollapsed = prev.pipelineCollapsed[pipelineId];
      const newCollapsedState = !isCollapsed;
      
      // If expanding and stages haven't been loaded yet, set loading state
      if (isCollapsed && prev.data) {
        const pipeline = prev.data.find(p => p.id === pipelineId);
        if (pipeline && (!pipeline.stages || pipeline.stages.length === 0)) {
          // Set loading state for this pipeline
          const updatedData = prev.data.map(p => 
            p.id === pipelineId 
              ? { ...p, stagesLoading: true, stagesError: null }
              : p
          );

          // Fetch stages asynchronously
          fetchStagesForPipeline(pipelineId)
            .then(stages => {
              setExplorerState(current => ({
                ...current,
                data: current.data?.map(p =>
                  p.id === pipelineId 
                    ? { ...p, stages, stagesLoading: false, stagesError: null } 
                    : p,
                ) || null,
              }));
            })
            .catch(error => {
              setExplorerState(current => ({
                ...current,
                data: current.data?.map(p =>
                  p.id === pipelineId
                    ? {
                        ...p,
                        stagesLoading: false,
                        stagesError: error instanceof Error ? error.message : "Unknown error",
                      }
                    : p,
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
        }
      };
    });
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader className="cursor-pointer">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-blue-800">🏗️ Pipedrive Stage Explorer</span>
            {explorerState.loading && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
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
              explorerState.data.map((pipeline: Pipeline) => {
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
                                variant={pipeline.active ? "default" : "secondary"}
                                className={
                                  pipeline.active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-600"
                                }
                              >
                                {pipeline.active ? "Active" : "Inactive"}
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

                        {pipeline.stages && pipeline.stages.length > 0 && !pipeline.stagesLoading && !pipeline.stagesError ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-blue-300">
                              <thead>
                                <tr className="bg-blue-50">
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
                                {pipeline.stages.map((stage: Stage) => (
                                  <tr key={stage.id} className="hover:bg-blue-50">
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
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          !pipeline.stagesLoading &&
                          !pipeline.stagesError &&
                          pipeline.stages && pipeline.stages.length === 0 && (
                            <p className="text-gray-500 text-center py-4">
                              No stages found for this pipeline
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">No pipelines found</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
