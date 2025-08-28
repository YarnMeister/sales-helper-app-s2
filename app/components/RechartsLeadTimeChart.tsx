"use client";

import React, { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DealData {
  deal_id: string;
  start_date: string;
  end_date: string;
  duration_seconds: number;
}

interface RechartsLeadTimeChartProps {
  deals: DealData[];
  metricTitle: string;
  canonicalStage: string;
  useComputedAverage: boolean;
}

const parseDuration = (seconds: number) => Math.round(seconds / 86400);

const prettyDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-AU", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric" 
  });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value} days
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RechartsLeadTimeChart({ deals, metricTitle, canonicalStage, useComputedAverage }: RechartsLeadTimeChartProps) {
  const { chartData, avg, maxDays } = useMemo(() => {
    if (!deals || deals.length === 0) {
      return { chartData: [], avg: 0, maxDays: 0 };
    }

    const durations = deals.map(deal => parseDuration(deal.duration_seconds));
    const computedAvg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    
    const data = deals.map((deal) => {
      const days = parseDuration(deal.duration_seconds);
      
      return {
        name: `#${deal.deal_id}`,
        dateLabel: prettyDate(deal.start_date),
        dealId: deal.deal_id,
        startDate: deal.start_date,
        endDate: deal.end_date,
        Days: days,
        Average: 5, // constant line
        AverageComputed: Number.isFinite(computedAvg) ? Number(computedAvg.toFixed(1)) : 0,
      };
    });

    return { 
      chartData: data, 
      avg: Number(computedAvg.toFixed(1)),
      maxDays: maxDuration
    };
  }, [deals]);

  if (!deals || deals.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">No deals found for this canonical stage</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">{metricTitle}</h2>
        <span className="text-sm text-gray-500">
          Average (computed): {avg} days
        </span>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={useComputedAverage}
            disabled
          />
          Use computed average instead of 5
        </label>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              domain={[0, maxDays + 1]}
              tick={{ fontSize: 12 }}
              label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="Days" 
              fill="#447DF7" 
              radius={[4, 4, 0, 0]}
            />
            <Line 
              type="monotone" 
              dataKey={useComputedAverage ? "AverageComputed" : "Average"} 
              stroke="#FF6B35" 
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-sm text-gray-500 space-y-2">
        <p>
          X-axis shows each deal by its ID (labelled as <em>#ID</em>). 
          Bar = duration in days. Line = average ({useComputedAverage ? avg : 5} days).
        </p>
        <p>
          <strong>Total deals:</strong> {deals.length} | <strong>Canonical stage:</strong> {canonicalStage}
        </p>
      </div>
    </div>
  );
}
