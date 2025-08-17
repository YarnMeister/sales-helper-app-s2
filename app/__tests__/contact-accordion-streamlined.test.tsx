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

describe('ContactAccordion - Streamlined Selection', () => {
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

  it('immediately calls onSelectContact when contact is clicked', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

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

    // Click contact - should immediately trigger selection
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

  it('does not show selected contact preview', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    await waitFor(() => {
      expect(screen.getByText('Mining Group A')).toBeInTheDocument();
    });

    // Should not show any "Selected Contact" preview
    expect(screen.queryByText(/Selected Contact/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('sh-selected-contact-preview')).not.toBeInTheDocument();
  });

  it('does not show save/cancel buttons', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    await waitFor(() => {
      expect(screen.getByText('Mining Group A')).toBeInTheDocument();
    });

    // Should not show any action buttons
    expect(screen.queryByText('Save Contact')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('does not highlight selected contacts', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-mine-mining-group-a-mine-1'));
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    // Contact should not have selection highlighting
    const contactElement = screen.getByTestId('sh-contact-person-1');
    expect(contactElement).not.toHaveClass('bg-blue-100', 'border-blue-300');
  });

  it('handles contact selection with keyboard', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-mine-mining-group-a-mine-1'));
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    // Test Enter key selection
    const contactElement = screen.getByTestId('sh-contact-person-1');
    fireEvent.keyDown(contactElement, { key: 'Enter' });

    expect(mockOnSelectContact).toHaveBeenCalledWith({
      personId: 1,
      name: 'Alice Johnson',
      email: 'alice@mine1.com',
      phone: '+27111111111',
      mineGroup: 'Mining Group A',
      mineName: 'Mine 1'
    });
  });

  it('handles contact selection with Space key', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-mine-mining-group-a-mine-1'));
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    // Test Space key selection
    const contactElement = screen.getByTestId('sh-contact-person-1');
    fireEvent.keyDown(contactElement, { key: ' ' });

    expect(mockOnSelectContact).toHaveBeenCalledWith({
      personId: 1,
      name: 'Alice Johnson',
      email: 'alice@mine1.com',
      phone: '+27111111111',
      mineGroup: 'Mining Group A',
      mineName: 'Mine 1'
    });
  });

  it('maintains accessibility attributes', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-mine-mining-group-a-mine-1'));
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const contactElement = screen.getByTestId('sh-contact-person-1');
    expect(contactElement).toHaveAttribute('role', 'button');
    expect(contactElement).toHaveAttribute('tabIndex', '0');
  });

  it('handles multiple contact selections correctly', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-mine-mining-group-a-mine-1'));
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    // Select first contact
    fireEvent.click(screen.getByTestId('sh-contact-person-1'));
    expect(mockOnSelectContact).toHaveBeenCalledTimes(1);

    // Navigate to second contact
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-mine-mining-group-a-mine-2'));
    });

    await waitFor(() => {
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    // Select second contact
    fireEvent.click(screen.getByTestId('sh-contact-person-2'));
    expect(mockOnSelectContact).toHaveBeenCalledTimes(2);
  });

  it('handles contact selection with missing optional fields', async () => {
    const contactsWithMissingFields = {
      'Mining Group A': {
        'Mine 1': [
          {
            personId: 3,
            name: 'Charlie Brown',
            mineGroup: 'Mining Group A',
            mineName: 'Mine 1'
            // Missing email and phone
          }
        ]
      }
    };

    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        data: contactsWithMissingFields,
        stale: false
      })
    });

    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-mine-mining-group-a-mine-1'));
    });

    await waitFor(() => {
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('sh-contact-person-3'));

    expect(mockOnSelectContact).toHaveBeenCalledWith({
      personId: 3,
      name: 'Charlie Brown',
      mineGroup: 'Mining Group A',
      mineName: 'Mine 1'
    });
  });
});
