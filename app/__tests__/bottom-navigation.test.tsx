import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNavigation } from '../components/BottomNavigation';

// Mock Next.js router and pathname
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

// Mock the HamburgerMenu component
vi.mock('../components/HamburgerMenu', () => ({
  HamburgerMenu: ({ className }: any) => (
    <button data-testid="hamburger-menu" className={className}>
      <span>Menu</span>
    </button>
  ),
}));

describe('BottomNavigation', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  const mockPathname = '/';

  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter);
    (usePathname as any).mockReturnValue(mockPathname);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders all navigation items', () => {
    render(<BottomNavigation />);
    
    expect(screen.getByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('Check-in')).toBeInTheDocument();
    expect(screen.getByText('Lookup')).toBeInTheDocument();
    expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
  });

  it('renders new request button', () => {
    render(<BottomNavigation />);
    
    const newRequestButton = screen.getByRole('button', { name: '' });
    expect(newRequestButton).toBeInTheDocument();
  });

  it('calls onNewRequest when new request button is clicked', () => {
    const mockOnNewRequest = vi.fn();
    render(<BottomNavigation onNewRequest={mockOnNewRequest} />);
    
    const newRequestButton = screen.getByRole('button', { name: '' });
    fireEvent.click(newRequestButton);
    
    expect(mockOnNewRequest).toHaveBeenCalled();
  });

  it('navigates to deals page when deals button is clicked', () => {
    render(<BottomNavigation />);
    
    const dealsButton = screen.getByText('Deals');
    fireEvent.click(dealsButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('navigates to check-in page when check-in button is clicked', () => {
    render(<BottomNavigation />);
    
    const checkInButton = screen.getByText('Check-in');
    fireEvent.click(checkInButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/check-in');
  });

  it('navigates to quick lookup page when quick lookup button is clicked', () => {
    render(<BottomNavigation />);
    
    const lookupButton = screen.getByText('Lookup').closest('button');
    if (!lookupButton) throw new Error('Lookup button not found');
    fireEvent.click(lookupButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/quick-lookup');
  });

  it('shows active state for current page', () => {
    (usePathname as any).mockReturnValue('/quick-lookup');
    
    render(<BottomNavigation />);
    
    const lookupButton = screen.getByText('Lookup').closest('button');
    expect(lookupButton).toHaveClass('text-red-600');
  });

  it('shows loading state when isCreating is true', () => {
    render(<BottomNavigation isCreating={true} />);
    
    const newRequestButton = screen.getByRole('button', { name: '' });
    expect(newRequestButton).toBeDisabled();
    
    // Should show loading spinner
    const spinner = newRequestButton.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders hamburger menu with correct props', () => {
    (usePathname as any).mockReturnValue('/flow-metrics-report');
    
    render(<BottomNavigation />);
    
    const hamburgerMenu = screen.getByTestId('hamburger-menu');
    expect(hamburgerMenu).toBeInTheDocument();
    expect(hamburgerMenu).toHaveClass('text-red-600');
  });
});
