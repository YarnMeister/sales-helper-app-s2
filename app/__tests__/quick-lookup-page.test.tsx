import React from 'react';
import { render, screen } from '@testing-library/react';
import QuickLookupPage from '../quick-lookup/page';

// Mock the components
vi.mock('../components/BottomNavigation', () => ({
  BottomNavigation: () => <div data-testid="bottom-navigation">Bottom Navigation Component</div>,
}));

describe('QuickLookupPage', () => {
  it('renders the page with correct title', () => {
    render(<QuickLookupPage />);
    
    expect(screen.getByText('Lookup')).toBeInTheDocument();
  });

  it('renders the page with header and bottom navigation', () => {
    render(<QuickLookupPage />);
    
    expect(screen.getByText('Lookup')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
  });

  it('renders accordion content', () => {
    render(<QuickLookupPage />);
    
    // The accordion should be present (showing loading state)
    expect(screen.getByTestId('sh-contacts-loading')).toBeInTheDocument();
  });
});
