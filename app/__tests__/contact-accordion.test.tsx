import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactAccordion } from '../components/ContactAccordion';

const mockContactsData = {
  'Mining Group A': {
    'Mine 1': [
      {
        personId: 1,
        name: 'Alice Johnson',
        email: 'alice@mine1.com',
        phone: '+27111111111',
        mineGroup: 'Mining Group A',
        mineName: 'Mine 1'
      }
    ],
    'Mine 2': [
      {
        personId: 2,
        name: 'Bob Wilson',
        email: 'bob@mine2.com',
        mineGroup: 'Mining Group A', 
        mineName: 'Mine 2'
      }
    ]
  }
};

global.fetch = vi.fn();

describe('ContactAccordion', () => {
  const mockOnSelectContact = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        data: mockContactsData,
        stale: false
      })
    });
  });

  it('renders loading state initially', () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} />);
    
    expect(screen.getByTestId('sh-contacts-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading contacts...')).toBeInTheDocument();
  });

  it('displays contacts hierarchy after loading', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} />);

    await waitFor(() => {
      expect(screen.getByText('Mining Group A')).toBeInTheDocument();
      expect(screen.getByText('2 contacts')).toBeInTheDocument();
    });
  });

  it('expands and collapses mine groups', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} />);

    await waitFor(() => {
      expect(screen.getByText('Mining Group A')).toBeInTheDocument();
    });

    // Initially mines should not be visible
    expect(screen.queryByText('Mine 1')).not.toBeInTheDocument();

    // Expand group
    fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));

    await waitFor(() => {
      expect(screen.getByText('Mine 1')).toBeInTheDocument();
      expect(screen.getByText('Mine 2')).toBeInTheDocument();
    });

    // Collapse group
    fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));

    await waitFor(() => {
      expect(screen.queryByText('Mine 1')).not.toBeInTheDocument();
    });
  });

  it('handles contact selection', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} />);

    // Navigate to contact
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-mine-mining-group-a-mine-1'));
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('sh-contact-person-1'));

    expect(mockOnSelectContact).toHaveBeenCalledWith({
      personId: 1,
      name: 'Alice Johnson',
      email: 'alice@mine1.com',
      phone: '+27111111111',
      mineGroup: 'Mining Group A',
      mineName: 'Mine 1'
    });
  });

  it('filters contacts based on search', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} />);

    await waitFor(() => {
      expect(screen.getByTestId('sh-contact-search')).toBeInTheDocument();
    });

    // Search for specific contact
    const searchInput = screen.getByTestId('sh-contact-search');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    // Should still show the group but filtered
    await waitFor(() => {
      expect(screen.getByText('Mining Group A')).toBeInTheDocument();
    });
  });

  it('displays stale data warning', async () => {
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        data: mockContactsData,
        stale: true
      })
    });

    render(<ContactAccordion onSelectContact={mockOnSelectContact} />);

    await waitFor(() => {
      expect(screen.getByText(/Using offline data/)).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} />);

    await waitFor(() => {
      expect(screen.getByText('Mining Group A')).toBeInTheDocument();
    });

    const groupButton = screen.getByTestId('sh-contact-group-mining-group-a');
    
    // Test Enter key
    fireEvent.keyDown(groupButton, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Mine 1')).toBeInTheDocument();
    });

    // Test Space key
    fireEvent.keyDown(groupButton, { key: ' ' });
    
    await waitFor(() => {
      expect(screen.queryByText('Mine 1')).not.toBeInTheDocument();
    });
  });
});
