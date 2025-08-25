'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CommonHeader } from '../../components/CommonHeader';
import { CommonFooter } from '../../components/CommonFooter';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

// Mock data for individual deals
const mockDealsData = {
  'lead-conversion': [
    {
      id: 'D001',
      startDate: '2024-01-15',
      endDate: '2024-01-18',
      duration: 3,
      isBest: true,
    },
    {
      id: 'D002',
      startDate: '2024-01-16',
      endDate: '2024-01-28',
      duration: 12,
      isBest: false,
    },
    {
      id: 'D004',
      startDate: '2024-01-10',
      endDate: '2024-01-25',
      duration: 15,
      isBest: false,
    },
    {
      id: 'D007',
      startDate: '2024-01-05',
      endDate: '2024-02-19',
      duration: 45,
      isWorst: true,
    },
    {
      id: 'D008',
      startDate: '2024-01-12',
      endDate: '2024-01-20',
      duration: 8,
      isBest: false,
    },
  ],
  'quote-conversion': [
    {
      id: 'D003',
      startDate: '2024-01-20',
      endDate: '2024-01-28',
      duration: 8,
      isBest: true,
    },
    {
      id: 'D005',
      startDate: '2024-01-25',
      endDate: '2024-02-02',
      duration: 8,
      isBest: false,
    },
    {
      id: 'D009',
      startDate: '2024-01-30',
      endDate: '2024-02-07',
      duration: 8,
      isBest: false,
    },
    {
      id: 'D010',
      startDate: '2024-02-01',
      endDate: '2024-02-09',
      duration: 8,
      isBest: false,
    },
    {
      id: 'D011',
      startDate: '2024-02-05',
      endDate: '2024-02-13',
      duration: 8,
      isWorst: false,
    },
  ],
  'order-conversion': [
    {
      id: 'D012',
      startDate: '2024-01-10',
      endDate: '2024-01-15',
      duration: 5,
      isBest: true,
    },
    {
      id: 'D013',
      startDate: '2024-01-15',
      endDate: '2024-01-30',
      duration: 15,
      isBest: false,
    },
    {
      id: 'D014',
      startDate: '2024-01-20',
      endDate: '2024-02-04',
      duration: 15,
      isBest: false,
    },
    {
      id: 'D015',
      startDate: '2024-01-25',
      endDate: '2024-03-26',
      duration: 60,
      isWorst: true,
    },
    {
      id: 'D016',
      startDate: '2024-02-01',
      endDate: '2024-02-16',
      duration: 15,
      isBest: false,
    },
  ],
  'procurement': [
    {
      id: 'D017',
      startDate: '2024-01-15',
      endDate: '2024-01-25',
      duration: 10,
      isBest: true,
    },
    {
      id: 'D018',
      startDate: '2024-01-20',
      endDate: '2024-02-19',
      duration: 30,
      isBest: false,
    },
    {
      id: 'D019',
      startDate: '2024-01-25',
      endDate: '2024-03-26',
      duration: 60,
      isBest: false,
    },
    {
      id: 'D020',
      startDate: '2024-02-01',
      endDate: '2024-05-02',
      duration: 90,
      isWorst: true,
    },
    {
      id: 'D021',
      startDate: '2024-02-05',
      endDate: '2024-03-07',
      duration: 30,
      isBest: false,
    },
  ],
  'manufacturing': [
    {
      id: 'D022',
      startDate: '2024-01-15',
      endDate: '2024-02-04',
      duration: 20,
      isBest: true,
    },
    {
      id: 'D023',
      startDate: '2024-01-20',
      endDate: '2024-03-21',
      duration: 60,
      isBest: false,
    },
    {
      id: 'D024',
      startDate: '2024-01-25',
      endDate: '2024-04-25',
      duration: 90,
      isBest: false,
    },
    {
      id: 'D025',
      startDate: '2024-02-01',
      endDate: '2024-06-01',
      duration: 120,
      isWorst: true,
    },
    {
      id: 'D026',
      startDate: '2024-02-05',
      endDate: '2024-04-06',
      duration: 60,
      isBest: false,
    },
  ],
  'delivery': [
    {
      id: 'D027',
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      duration: 2,
      isBest: true,
    },
    {
      id: 'D028',
      startDate: '2024-01-20',
      endDate: '2024-01-27',
      duration: 7,
      isBest: false,
    },
    {
      id: 'D029',
      startDate: '2024-01-25',
      endDate: '2024-02-01',
      duration: 7,
      isBest: false,
    },
    {
      id: 'D030',
      startDate: '2024-02-01',
      endDate: '2024-02-22',
      duration: 21,
      isWorst: true,
    },
    {
      id: 'D031',
      startDate: '2024-02-05',
      endDate: '2024-02-12',
      duration: 7,
      isBest: false,
    },
  ],
};

// Metric configuration
const metricConfig = {
  'lead-conversion': {
    title: 'Lead Conversion Time',
    canonicalStage: 'Lead Conversion',
    average: 17,
    best: 3,
    worst: 45,
  },
  'quote-conversion': {
    title: 'Quote Conversion Time',
    canonicalStage: 'Quote Conversion',
    average: 8,
    best: 8,
    worst: 8,
  },
  'order-conversion': {
    title: 'Order Conversion Time',
    canonicalStage: 'Order Conversion',
    average: 22,
    best: 5,
    worst: 60,
  },
  'procurement': {
    title: 'Procurement Lead Time',
    canonicalStage: 'Procurement',
    average: 44,
    best: 10,
    worst: 90,
  },
  'manufacturing': {
    title: 'Manufacturing Lead Time',
    canonicalStage: 'Manufacturing',
    average: 70,
    best: 20,
    worst: 120,
  },
  'delivery': {
    title: 'Delivery Lead Time',
    canonicalStage: 'Delivery',
    average: 9,
    best: 2,
    worst: 21,
  },
};

interface DealData {
  deal_id: string;
  start_date: string;
  end_date: string;
  duration_seconds: number;
}

interface PageProps {
  params: {
    'metric-id': string;
  };
}

export default function FlowMetricDetailPage({ params }: PageProps) {
  const router = useRouter();
  const metricId = params['metric-id'];
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [deals, setDeals] = useState<DealData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = metricConfig[metricId as keyof typeof metricConfig];

  // Fetch deals data for the canonical stage
  useEffect(() => {
    const fetchDeals = async () => {
      if (!config?.canonicalStage) {
        setError('No canonical stage configured for this metric');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/flow/canonical-stage-deals?canonicalStage=${encodeURIComponent(config.canonicalStage)}`);
        const result = await response.json();

        if (result.success) {
          setDeals(result.data || []);
        } else {
          setError(result.error || 'Failed to fetch deals data');
        }
      } catch (err) {
        setError('Failed to fetch deals data');
        console.error('Error fetching deals:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();
  }, [config?.canonicalStage]);

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommonHeader title="Metric Not Found" showDivider={false} />
        <div className="px-4 py-4 pb-24">
          <p className="text-gray-600">The requested metric could not be found.</p>
        </div>
        <CommonFooter onNewRequest={() => {}} isCreating={false} />
      </div>
    );
  }

  const handleBack = () => {
    router.push('/flow-metrics-report');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Header with Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
              <p className="text-gray-600">Last 7 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 pb-24">
        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{config.average} days</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Best Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{config.best} days</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Worst Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{config.worst} days</div>
            </CardContent>
          </Card>
        </div>

        {/* Individual Deal Performance Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <CardTitle className="text-lg">Individual Deal Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading deals data...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-red-500">{error}</div>
              </div>
            ) : deals.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">No deals found for this canonical stage</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Deal ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Start Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">End Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal) => {
                      const durationDays = Math.ceil(deal.duration_seconds / 86400);
                      const startDate = new Date(deal.start_date).toLocaleDateString();
                      const endDate = new Date(deal.end_date).toLocaleDateString();
                      
                      return (
                        <tr key={deal.deal_id} className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium text-gray-900">{deal.deal_id}</td>
                          <td className="py-3 px-4 text-gray-700">{startDate}</td>
                          <td className="py-3 px-4 text-gray-700">{endDate}</td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">
                              {durationDays} days
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Common Footer */}
      <CommonFooter onNewRequest={() => {}} isCreating={false} />
    </div>
  );
}
