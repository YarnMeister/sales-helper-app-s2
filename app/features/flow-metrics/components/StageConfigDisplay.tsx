/**
 * StageConfigDisplay Component
 * 
 * Displays start and end stage configuration for a metric
 * Highlights cross-pipeline metrics with visual indicator
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { isCrossPipelineMetric, type StageSelection } from '../utils';

interface StageConfigDisplayProps {
  startStage: StageSelection | null;
  endStage: StageSelection | null;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

export function StageConfigDisplay({
  startStage,
  endStage,
  onEditStart,
  onEditEnd,
}: StageConfigDisplayProps) {
  const crossPipeline =
    startStage && endStage && isCrossPipelineMetric(startStage, endStage);

  return (
    <div className="space-y-4">
      {/* Start Stage Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Start Stage</CardTitle>
        </CardHeader>
        <CardContent>
          {startStage ? (
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500">Pipeline</div>
                <div className="font-medium text-gray-900">
                  {startStage.pipelineName}
                </div>
                <div className="text-xs text-gray-400">
                  Pipeline ID: {startStage.pipelineId}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mt-2">Stage</div>
                <div className="font-medium text-gray-900">
                  {startStage.stageName}
                </div>
                <div className="text-xs text-gray-400">
                  Stage ID: {startStage.stageId}
                </div>
              </div>
              {onEditStart && (
                <Button
                  onClick={onEditStart}
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                >
                  Change Start Stage
                </Button>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No start stage selected</div>
          )}
        </CardContent>
      </Card>

      {/* Cross-Pipeline Indicator */}
      {crossPipeline && (
        <div className="flex items-center justify-center">
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border border-blue-200">
            <span className="text-lg">⚡</span>
            <span>Cross-Pipeline Metric</span>
          </div>
        </div>
      )}

      {/* End Stage Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">End Stage</CardTitle>
        </CardHeader>
        <CardContent>
          {endStage ? (
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500">Pipeline</div>
                <div className="font-medium text-gray-900">
                  {endStage.pipelineName}
                </div>
                <div className="text-xs text-gray-400">
                  Pipeline ID: {endStage.pipelineId}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mt-2">Stage</div>
                <div className="font-medium text-gray-900">
                  {endStage.stageName}
                </div>
                <div className="text-xs text-gray-400">
                  Stage ID: {endStage.stageId}
                </div>
              </div>
              {onEditEnd && (
                <Button
                  onClick={onEditEnd}
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                >
                  Change End Stage
                </Button>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No end stage selected</div>
          )}
        </CardContent>
      </Card>

      {/* Warning for cross-pipeline metrics */}
      {crossPipeline && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 text-sm">ℹ️</span>
            <div className="text-xs text-amber-800">
              <p className="font-medium mb-1">Cross-Pipeline Metric</p>
              <p>
                This metric spans multiple pipelines (
                {startStage?.pipelineName} → {endStage?.pipelineName}). Ensure
                deal flow data captures transitions between pipelines.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
