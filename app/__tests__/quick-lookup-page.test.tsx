import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders both tab buttons', () => {
    render(<QuickLookupPage />);
    
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Price List')).toBeInTheDocument();
  });

  it('shows contacts tab by default', () => {
    render(<QuickLookupPage />);
    
    // The contacts accordion should be present (showing loading state)
    expect(screen.getByTestId('sh-contacts-loading')).toBeInTheDocument();
  });

  it('switches to price list tab when clicked', () => {
    render(<QuickLookupPage />);
    
    const priceListButton = screen.getByText('Price List');
    fireEvent.click(priceListButton);
    
    // The products accordion should be present (showing loading state)
    expect(screen.getByTestId('sh-products-loading')).toBeInTheDocument();
  });
});
