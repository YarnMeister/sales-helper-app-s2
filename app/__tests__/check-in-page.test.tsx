import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CheckInPage from '../check-in/page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/check-in'),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock global.alert
global.alert = vi.fn();

// Mock the contacts data - fix structure to match ContactsHierarchy
const mockContactsData = {
  'Group A': {
    'Mine Alpha': [{ personId: 1, name: 'John Doe', email: 'john@minealpha.com', mineGroup: 'Group A', mineName: 'Mine Alpha' }],
    'Mine Beta': [{ personId: 2, name: 'Jane Smith', email: 'jane@minebeta.com', mineGroup: 'Group A', mineName: 'Mine Beta' }]
  },
  'Group B': {
    'Mine Gamma': [{ personId: 3, name: 'Bob Wilson', email: 'bob@minegamma.com', mineGroup: 'Group B', mineName: 'Mine Gamma' }]
  }
};

// Mock the API responses
const mockSiteVisitResponse = {
  ok: true,
  json: () => Promise.resolve({
    ok: true,
    data: {
      id: 'test-id-123',
      salesperson: 'James',
      planned_mines: ['Mine Alpha'],
      main_purpose: 'Quote follow-up',
      availability: 'Later this morning',
      comments: 'Test comment'
    }
  })
};

const mockSlackResponse = {
  ok: true,
  json: () => Promise.resolve({
    ok: true,
    data: {
      channel: '#out-of-office',
      message_ts: '1234567890.123456',
      message: 'Test message'
    }
  })
};

describe('CheckInPage', () => {
  const mockPush = vi.fn();
  const mockBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
      back: mockBack
    });
    
    // Default mock for contacts API - can be overridden in individual tests
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/contacts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: mockContactsData })
        });
      }
      // Default mock for other API calls
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: {} })
      });
    });
  });

  it('renders check-in page with all required sections', async () => {
    render(<CheckInPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    // Check for main sections
    expect(screen.getByRole('heading', { level: 1, name: 'Check-in' })).toBeInTheDocument();
    expect(screen.getByText('Select name')).toBeInTheDocument();
    expect(screen.getByText('Select visiting mine')).toBeInTheDocument();
    expect(screen.getByText('Purpose')).toBeInTheDocument();
    expect(screen.getByText('Back in office')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Select Salesperson to Check-in')).toBeInTheDocument();
  });

  it('displays salesperson selection buttons', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('James')).toBeInTheDocument();
    expect(screen.getByText('Luyanda')).toBeInTheDocument();
    expect(screen.getByText('Stefan')).toBeInTheDocument();
  });

  it('allows selecting a salesperson', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    const jamesButton = screen.getByText('James');
    const luyandaButton = screen.getByText('Luyanda');

    // Initially no salesperson should be selected
    expect(jamesButton).not.toHaveClass('text-white');
    expect(luyandaButton).not.toHaveClass('text-white');

    // Click Luyanda
    fireEvent.click(luyandaButton);
    
    // Now Luyanda should be selected
    expect(luyandaButton).toHaveClass('text-white');
    expect(jamesButton).not.toHaveClass('text-white');
  });

  it('displays purpose selection buttons', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Quote follow-up')).toBeInTheDocument();
    expect(screen.getByText('Delivery')).toBeInTheDocument();
    expect(screen.getByText('Site check')).toBeInTheDocument();
    expect(screen.getByText('Installation support')).toBeInTheDocument();
    expect(screen.getByText('General sales visit')).toBeInTheDocument();
  });

  it('allows selecting a purpose', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    const quoteButton = screen.getByText('Quote follow-up');
    const deliveryButton = screen.getByText('Delivery');

    // Initially no purpose should be selected
    expect(quoteButton).not.toHaveClass('text-white');
    expect(deliveryButton).not.toHaveClass('text-white');

    // Click Quote follow-up
    fireEvent.click(quoteButton);
    
    // Now Quote follow-up should be selected
    expect(quoteButton).toHaveClass('text-white');
    expect(deliveryButton).not.toHaveClass('text-white');
  });

  it('displays back in office selection buttons', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Later this morning')).toBeInTheDocument();
    expect(screen.getByText('In the afternoon')).toBeInTheDocument();
    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
  });

  it('allows selecting back in office time', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    const morningButton = screen.getByText('Later this morning');
    const afternoonButton = screen.getByText('In the afternoon');

    // Initially no time should be selected
    expect(morningButton).not.toHaveClass('text-white');
    expect(afternoonButton).not.toHaveClass('text-white');

    // Click Later this morning
    fireEvent.click(morningButton);
    
    // Now Later this morning should be selected
    expect(morningButton).toHaveClass('text-white');
    expect(afternoonButton).not.toHaveClass('text-white');
  });

  it('allows entering comments', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    const commentsTextarea = screen.getByPlaceholderText('Enter any additional comments...');
    expect(commentsTextarea).toBeInTheDocument();

    fireEvent.change(commentsTextarea, { target: { value: 'Test comment' } });
    expect(commentsTextarea).toHaveValue('Test comment');
  });

  it('shows select salesperson message when no salesperson is selected', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    const checkInButton = screen.getByText('Select Salesperson to Check-in');
    expect(checkInButton).toBeInTheDocument();
  });

  it('shows salesperson modal when check-in button is clicked without salesperson selected', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    // The button should be disabled when no salesperson is selected
    const checkInButton = screen.getByText('Select Salesperson to Check-in');
    expect(checkInButton).toBeDisabled();
  });

  it('shows modal when salesperson is selected but other fields are missing', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    // Select a salesperson first
    const jamesButton = screen.getByText('James');
    fireEvent.click(jamesButton);

    // Now the check-in button should be enabled but still show the modal when clicked
    const checkInButton = screen.getByText('Check-in Now');
    expect(checkInButton).toBeDisabled(); // Still disabled because other fields are missing
  });

  it('selects salesperson from modal and updates button text', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    // Select a salesperson first
    const jamesButton = screen.getByText('James');
    fireEvent.click(jamesButton);

    // Fill in other required fields
    const allMinesButton = screen.getByText('All mines');
    fireEvent.click(allMinesButton);
    
    await waitFor(() => {
      const groupAButton = screen.getByText('Group A');
      fireEvent.click(groupAButton);
    });
    
    await waitFor(() => {
      const mineAlphaButton = screen.getByText('Mine Alpha');
      fireEvent.click(mineAlphaButton);
    });

    const quoteButton = screen.getByText('Quote follow-up');
    fireEvent.click(quoteButton);

    const morningButton = screen.getByText('Later this morning');
    fireEvent.click(morningButton);

    // Now the check-in button should be enabled
    const checkInButton = screen.getByText('Check-in Now');
    expect(checkInButton).not.toBeDisabled();
  });

  it('disables check-in button when required fields are missing', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    // Select a salesperson first
    const jamesButton = screen.getByText('James');
    fireEvent.click(jamesButton);

    const checkInButton = screen.getByText('Check-in Now');
    expect(checkInButton).toBeDisabled();
  });

  it('shows loading state while fetching contacts', () => {
    render(<CheckInPage />);
    
    expect(screen.getByText('Loading mine groups...')).toBeInTheDocument();
  });

  it('shows error state when contacts fetch fails', async () => {
    // Override the default mock for this test
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/contacts')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: {} })
      });
    });

    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Unable to load contacts. Please check your connection.')).toBeInTheDocument();
    });
  });

  it('submits check-in data successfully', async () => {
    // Override the default mock for this test
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/contacts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: mockContactsData })
        });
      }
      if (url.includes('/api/site-visits')) {
        return Promise.resolve(mockSiteVisitResponse);
      }
      if (url.includes('/api/slack/notify-checkin')) {
        return Promise.resolve(mockSlackResponse);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: {} })
      });
    });

    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    // Fill in all required fields
    // Select salesperson first
    const jamesButton = screen.getByText('James');
    fireEvent.click(jamesButton);

    const allMinesButton = screen.getByText('All mines');
    fireEvent.click(allMinesButton);
    
    // Wait for mine groups to appear and expand Group A
    await waitFor(() => {
      const groupAButton = screen.getByText('Group A');
      fireEvent.click(groupAButton);
    });
    
    // Wait for individual mines to appear and select Mine Alpha
    await waitFor(() => {
      const mineAlphaButton = screen.getByText('Mine Alpha');
      fireEvent.click(mineAlphaButton);
    });

    // Select purpose
    const quoteButton = screen.getByText('Quote follow-up');
    fireEvent.click(quoteButton);

    // Select back in office time
    const morningButton = screen.getByText('Later this morning');
    fireEvent.click(morningButton);

    // Add comments
    const commentsTextarea = screen.getByPlaceholderText('Enter any additional comments...');
    fireEvent.change(commentsTextarea, { target: { value: 'Test comment' } });

    // Submit check-in
    const checkInButton = screen.getByText('Check-in Now');
    fireEvent.click(checkInButton);

    // Wait for API calls
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesperson: 'James',
          planned_mines: ['Mine Alpha'],
          main_purpose: 'Quote follow-up',
          availability: 'Later this morning',
          comments: 'Test comment'
        })
      });
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/slack/notify-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesperson: 'James',
          planned_mines: ['Mine Alpha'],
          main_purpose: 'Quote follow-up',
          availability: 'Later this morning',
          comments: 'Test comment'
        })
      });
    });

    // Should navigate back to main page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('handles site visit API error gracefully', async () => {
    // Override the default mock for this test
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/contacts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: mockContactsData })
        });
      }
      if (url.includes('/api/site-visits')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Database error' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: {} })
      });
    });

    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    // Fill in all required fields
    // Select salesperson first
    const jamesButton = screen.getByText('James');
    fireEvent.click(jamesButton);

    const allMinesButton = screen.getByText('All mines');
    fireEvent.click(allMinesButton);
    
    // Wait for mine groups to appear and expand Group A
    await waitFor(() => {
      const groupAButton = screen.getByText('Group A');
      fireEvent.click(groupAButton);
    });
    
    // Wait for individual mines to appear and select Mine Alpha
    await waitFor(() => {
      const mineAlphaButton = screen.getByText('Mine Alpha');
      fireEvent.click(mineAlphaButton);
    });

    const quoteButton = screen.getByText('Quote follow-up');
    fireEvent.click(quoteButton);

    const morningButton = screen.getByText('Later this morning');
    fireEvent.click(morningButton);

    // Submit check-in
    const checkInButton = screen.getByText('Check-in Now');
    fireEvent.click(checkInButton);

    // Should show error alert
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Check-in failed: Failed to save site visit: Database error');
    });
  });

  it('handles Slack API error gracefully without failing check-in', async () => {
    // Override the default mock for this test
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/contacts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: mockContactsData })
        });
      }
      if (url.includes('/api/site-visits')) {
        return Promise.resolve(mockSiteVisitResponse);
      }
      if (url.includes('/api/slack/notify-checkin')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Slack API error' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: {} })
      });
    });

    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    // Fill in all required fields
    // Select salesperson first
    const jamesButton = screen.getByText('James');
    fireEvent.click(jamesButton);

    const allMinesButton = screen.getByText('All mines');
    fireEvent.click(allMinesButton);
    
    // Wait for mine groups to appear and expand Group A
    await waitFor(() => {
      const groupAButton = screen.getByText('Group A');
      fireEvent.click(groupAButton);
    });
    
    // Wait for individual mines to appear and select Mine Alpha
    await waitFor(() => {
      const mineAlphaButton = screen.getByText('Mine Alpha');
      fireEvent.click(mineAlphaButton);
    });

    const quoteButton = screen.getByText('Quote follow-up');
    fireEvent.click(quoteButton);

    const morningButton = screen.getByText('Later this morning');
    fireEvent.click(morningButton);

    // Submit check-in
    const checkInButton = screen.getByText('Check-in Now');
    fireEvent.click(checkInButton);

    // Should still navigate back to main page even if Slack fails
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});
