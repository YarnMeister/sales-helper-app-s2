import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import QuickLookupPage from '../quick-lookup/page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock the components
vi.mock('../components/ContactAccordion', () => ({
  ContactAccordion: ({ onSelectContact, className, viewOnly }: any) => (
    <div data-testid="contact-accordion" className={className}>
      Contact Accordion Component
    </div>
  ),
}));

vi.mock('../components/ProductAccordion', () => ({
  ProductAccordion: ({ onProductSelect, existingItems, className, viewOnly }: any) => (
    <div data-testid="product-accordion" className={className}>
      Product Accordion Component
    </div>
  ),
}));

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
    render(<QuickLookupPage />);
    
    expect(screen.getByTestId('common-header')).toHaveTextContent('Lookup');
  });

  it('shows contacts tab by default', () => {
    render(<QuickLookupPage />);
    
    expect(screen.getByTestId('contact-accordion')).toBeInTheDocument();
    expect(screen.queryByTestId('product-accordion')).not.toBeInTheDocument();
  });

  it('switches to price list tab when clicked', () => {
    render(<QuickLookupPage />);
    
    const priceListButton = screen.getByText('Price List');
    fireEvent.click(priceListButton);
    
    expect(screen.getByTestId('product-accordion')).toBeInTheDocument();
    expect(screen.queryByTestId('contact-accordion')).not.toBeInTheDocument();
  });

  it('switches back to contacts tab when clicked', () => {
    render(<QuickLookupPage />);
    
    // First switch to price list
    const priceListButton = screen.getByText('Price List');
    fireEvent.click(priceListButton);
    
    // Then switch back to contacts
    const contactsButton = screen.getByText('Contacts');
    fireEvent.click(contactsButton);
    
    expect(screen.getByTestId('contact-accordion')).toBeInTheDocument();
    expect(screen.queryByTestId('product-accordion')).not.toBeInTheDocument();
  });

  it('renders both tab buttons', () => {
    render(<QuickLookupPage />);
    
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Price List')).toBeInTheDocument();
  });

  it('applies correct styling to active tab', () => {
    render(<QuickLookupPage />);
    
    const contactsButton = screen.getByText('Contacts');
    const priceListButton = screen.getByText('Price List');
    
    // Contacts should be active by default
    expect(contactsButton.closest('button')).toHaveClass('bg-red-600');
    expect(priceListButton.closest('button')).toHaveClass('border');
  });
});
