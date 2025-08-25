import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { HamburgerMenu } from '../components/HamburgerMenu';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('HamburgerMenu', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders hamburger button', () => {
    render(<HamburgerMenu />);
    
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('opens menu when hamburger button is clicked', () => {
    render(<HamburgerMenu />);
    
    const menuButton = screen.getByText('Menu');
    fireEvent.click(menuButton);
    
    expect(screen.getByText('Flow Metrics Report')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });

  it('closes menu when close button is clicked', () => {
    render(<HamburgerMenu />);
    
    // Open menu
    const menuButton = screen.getByText('Menu');
    fireEvent.click(menuButton);
    
    // Close menu
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Flow Metrics Report')).not.toBeInTheDocument();
  });

  it('closes menu when overlay is clicked', () => {
    render(<HamburgerMenu />);
    
    // Open menu
    const menuButton = screen.getByText('Menu');
    fireEvent.click(menuButton);
    
    // Click overlay
    const overlay = screen.getByTestId('overlay');
    fireEvent.click(overlay);
    
    expect(screen.queryByText('Flow Metrics Report')).not.toBeInTheDocument();
  });

  it('navigates to flow metrics report when menu item is clicked', () => {
    render(<HamburgerMenu />);
    
    // Open menu
    const menuButton = screen.getByText('Menu');
    fireEvent.click(menuButton);
    
    // Click menu item
    const flowMetricsButton = screen.getByText('Flow Metrics Report');
    fireEvent.click(flowMetricsButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report');
    expect(screen.queryByText('Flow Metrics Report')).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<HamburgerMenu className="custom-class" />);
    
    const menuButton = screen.getByText('Menu');
    expect(menuButton.closest('button')).toHaveClass('custom-class');
  });

  it('does not show menu items when closed', () => {
    render(<HamburgerMenu />);
    
    expect(screen.queryByText('Flow Metrics Report')).not.toBeInTheDocument();
  });
});
