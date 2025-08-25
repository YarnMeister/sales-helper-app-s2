import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import FlowMetricsReportPage from '../flow-metrics-report/page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock the components
vi.mock('../components/CommonHeader', () => ({
  CommonHeader: ({ title }: any) => <div data-testid="common-header">{title}</div>,
}));

vi.mock('../components/CommonFooter', () => ({
  CommonFooter: ({ onNewRequest, isCreating }: any) => (
    <div data-testid="common-footer">
      Common Footer Component
    </div>
  ),
}));

describe('FlowMetricsReportPage', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page with correct title', () => {
    render(<FlowMetricsReportPage />);
    
    expect(screen.getByTestId('common-header')).toHaveTextContent('Flow Metrics Report');
  });

  it('renders the common footer', () => {
    render(<FlowMetricsReportPage />);
    
    expect(screen.getByTestId('common-footer')).toBeInTheDocument();
  });

  it('has the correct page structure', () => {
    render(<FlowMetricsReportPage />);
    
    // Check that the main container has the correct classes
    const mainContainer = screen.getByTestId('common-header').closest('.min-h-screen');
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-gray-50');
  });

  it('has content area with correct padding', () => {
    render(<FlowMetricsReportPage />);
    
    // The content area should have the correct padding classes
    const contentArea = screen.getByTestId('common-header').nextElementSibling;
    expect(contentArea).toHaveClass('px-4', 'py-4', 'pb-24');
  });
});
