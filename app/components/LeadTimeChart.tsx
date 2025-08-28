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

interface LeadTimeChartProps {
  deals: DealData[];
  metricTitle: string;
  canonicalStage: string;
}

const parseDuration = (seconds: number) => Math.round((seconds / 86400) * 100) / 100;

const prettyDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-AU", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric" 
  });
};

const formatDateForChart = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}-${month}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Find the deal data for this bar
    const dealData = payload[0]?.payload;
    const dealId = dealData?.dealId;
    const fullDate = dealData?.dateLabel;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900 mb-2">
          {fullDate} (Deal #{dealId})
        </p>
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

export default function LeadTimeChart({ deals, metricTitle, canonicalStage }: LeadTimeChartProps) {
  const [useComputedAverage, setUseComputedAverage] = useState(true);

  const { chartData, avg, maxDays } = useMemo(() => {
    if (!deals || deals.length === 0) {
      return { chartData: [], avg: 0, maxDays: 0 };
    }

    // Use the same precise calculation as the detail page
    const durationsInDays = deals.map(deal => 
      Math.round((deal.duration_seconds / 86400) * 100) / 100
    );
    const totalDays = durationsInDays.reduce((sum, days) => sum + days, 0);
    const computedAvg = Math.round((totalDays / durationsInDays.length) * 100) / 100;
    const maxDuration = Math.max(...durationsInDays);
    
    // Sort deals by start_date in ascending order (earliest to latest)
    const sortedDeals = [...deals].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    
    const data = sortedDeals.map((deal) => {
      const days = Math.round((deal.duration_seconds / 86400) * 100) / 100;
      
      return {
        name: formatDateForChart(deal.start_date),
        dateLabel: prettyDate(deal.start_date),
        dealId: deal.deal_id,
        startDate: deal.start_date,
        endDate: deal.end_date,
        Days: days,
        Average: 5, // constant line
        AverageComputed: computedAvg,
      };
    });

    return { 
      chartData: data, 
      avg: computedAvg,
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
          Average (computed): {avg.toFixed(2)} days
        </span>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={useComputedAverage}
            onChange={(e) => setUseComputedAverage(e.target.checked)}
          />
          Use constant 5-day line instead of computed average
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
          X-axis shows each deal by its start date (dd-mm format). 
          Bar = duration in days. Line = average ({useComputedAverage ? avg.toFixed(2) : 5} days).
        </p>
        <p>
          <strong>Total deals:</strong> {deals.length} | <strong>Canonical stage:</strong> {canonicalStage}
        </p>
      </div>
    </div>
  );
}
