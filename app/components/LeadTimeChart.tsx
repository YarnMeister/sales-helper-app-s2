"use client";

import React, { useMemo, useState } from "react";
import { ComboChart } from "./ComboChart";
import RechartsLeadTimeChart from "./RechartsLeadTimeChart";

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

const parseDuration = (seconds: number) => Math.round(seconds / 86400);

const prettyDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-AU", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric" 
  });
};

export default function LeadTimeChart({ deals, metricTitle, canonicalStage }: LeadTimeChartProps) {
  const [useComputedAverage, setUseComputedAverage] = useState(false);
  const [useRecharts, setUseRecharts] = useState(false);

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
          index: `#${deal.deal_id}`,
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

  const dataForChart = chartData.map(d => ({
    index: d.index,
    Days: d.Days,
    Average: useComputedAverage ? d.AverageComputed : d.Average,
  }));

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
        <div className="ml-auto flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={useComputedAverage}
              onChange={(e) => setUseComputedAverage(e.target.checked)}
            />
            Use computed average instead of 5
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={useRecharts}
              onChange={(e) => setUseRecharts(e.target.checked)}
            />
            Use Recharts (pure) instead of Tremor
          </label>
        </div>
      </div>

      {useRecharts ? (
        <RechartsLeadTimeChart 
          deals={deals}
          metricTitle={metricTitle}
          canonicalStage={canonicalStage}
        />
      ) : (
        <div className="h-80 w-full">
          <ComboChart
            data={dataForChart}
            index="index"
            barSeries={{
              categories: ["Days"],
              colors: ["violet"],
              valueFormatter: (value) => `${value} days`,
              yAxisWidth: 60,
              showYAxis: true,
              allowDecimals: false,
              minValue: 0,
              maxValue: maxDays + 1,
            }}
            lineSeries={{
              categories: ["Average"],
              colors: ["amber"],
              valueFormatter: (value) => `${value} days`,
              yAxisLabel: "Average (days)",
              showYAxis: false,
            }}
            showLegend={true}
            showTooltip={true}
            showXAxis={true}
            showGridLines={true}
            tickGap={2}

            className="h-full"
          />
        </div>
      )}

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
