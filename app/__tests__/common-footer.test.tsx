import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { CommonFooter } from '../components/CommonFooter';

// Mock Next.js router and pathname (partial mock to preserve other exports)
vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useRouter: vi.fn(),
    usePathname: vi.fn(),
  };
});

// Mock the HamburgerMenu component
vi.mock('../components/HamburgerMenu', () => ({
  HamburgerMenu: ({ className }: any) => (
    <button data-testid="hamburger-menu" className={className}>
      <span>Menu</span>
    </button>
  ),
}));

// Mock the SalespersonModal component
vi.mock('../components/SalespersonModal', () => ({
  SalespersonModal: ({ isOpen, onSelect, title }: any) => 
    isOpen ? (
      <div data-testid="salesperson-modal">
        <h2>{title}</h2>
        <button onClick={() => onSelect('James')}>James</button>
        <button onClick={() => onSelect('Luyanda')}>Luyanda</button>
        <button onClick={() => onSelect('Stefan')}>Stefan</button>
      </div>
    ) : null,
}));

// Use global fetch mock from tests/setup.ts

describe('CommonFooter', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  const mockPathname = '/';

  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter);
    (usePathname as any).mockReturnValue(mockPathname);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders all navigation items', () => {
    render(<CommonFooter />);
    
    expect(screen.getByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('Check-in')).toBeInTheDocument();
    expect(screen.getByText('Lookup')).toBeInTheDocument();
    expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
  });

  it('renders new request button', () => {
    render(<CommonFooter />);
    
    const newRequestButton = screen.getByRole('button', { name: '' });
    expect(newRequestButton).toBeInTheDocument();
  });

  it('calls onNewRequest when new request button is clicked on main page with specific salesperson', () => {
    const mockOnNewRequest = vi.fn();
    render(<CommonFooter onNewRequest={mockOnNewRequest} selectedSalesperson="James" />);
    
    const newRequestButton = screen.getByRole('button', { name: '' });
    fireEvent.click(newRequestButton);
    
    expect(mockOnNewRequest).toHaveBeenCalled();
  });

  it('shows salesperson modal when new request button is clicked on non-main page', async () => {
    (usePathname as any).mockReturnValue('/quick-lookup');
    
    render(<CommonFooter />);
    
    const newRequestButton = screen.getByRole('button', { name: '' });
    fireEvent.click(newRequestButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests', expect.any(Object));
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('navigates to deals page when deals button is clicked', () => {
    render(<CommonFooter />);
    
    const dealsButton = screen.getByText('Deals');
    fireEvent.click(dealsButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('navigates to check-in page when check-in button is clicked', () => {
    render(<CommonFooter />);
    
    const checkInButton = screen.getByText('Check-in');
    fireEvent.click(checkInButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/check-in');
  });

  it('navigates to quick lookup page when quick lookup button is clicked', () => {
    render(<CommonFooter />);
    
    const lookupButton = screen.getByText('Lookup').closest('button');
    if (!lookupButton) throw new Error('Lookup button not found');
    fireEvent.click(lookupButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/quick-lookup');
  });

  it('shows active state for current page', () => {
    (usePathname as any).mockReturnValue('/quick-lookup');
    
    render(<CommonFooter />);
    
    const lookupButton = screen.getByText('Lookup').closest('button');
    expect(lookupButton).toHaveClass('text-red-600');
  });

  it('shows loading state when isCreating is true', () => {
    render(<CommonFooter isCreating={true} />);
    
    const newRequestButton = screen.getByRole('button', { name: '' });
    expect(newRequestButton).toBeDisabled();
    
    // Should show loading spinner
    const spinner = newRequestButton.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders hamburger menu with correct props', () => {
    (usePathname as any).mockReturnValue('/flow-metrics-report');
    
    render(<CommonFooter />);
    
    const hamburgerMenu = screen.getByTestId('hamburger-menu');
    expect(hamburgerMenu).toBeInTheDocument();
    expect(hamburgerMenu).toHaveClass('text-red-600');
  });

  it('creates new request and navigates to main page when salesperson is selected', async () => {
    (usePathname as any).mockReturnValue('/quick-lookup');
    
    render(<CommonFooter />);
    
    const newRequestButton = screen.getByRole('button', { name: '' });
    fireEvent.click(newRequestButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests', expect.any(Object));
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });
});
