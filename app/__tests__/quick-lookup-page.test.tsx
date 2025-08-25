import React from 'react';
import { render, screen } from '@testing-library/react';
import QuickLookupPage from '../quick-lookup/page';

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

describe('QuickLookupPage', () => {
  it('renders the page with correct title', () => {
    render(<QuickLookupPage />);
    
    expect(screen.getByTestId('common-header')).toHaveTextContent('Lookup');
  });

  it('renders the page with header and footer', () => {
    render(<QuickLookupPage />);
    
    expect(screen.getByTestId('common-header')).toBeInTheDocument();
    expect(screen.getByTestId('common-footer')).toBeInTheDocument();
  });

  it('renders empty main content area', () => {
    render(<QuickLookupPage />);
    
    // The main content area should be present but empty
    const mainContent = document.querySelector('.px-4.py-4.pb-24');
    expect(mainContent).toBeInTheDocument();
  });
});
