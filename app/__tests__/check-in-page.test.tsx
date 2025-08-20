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
      salesperson: 'Current User',
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
    expect(screen.getByText('Select visiting mine')).toBeInTheDocument();
    expect(screen.getByText('Purpose')).toBeInTheDocument();
    expect(screen.getByText('Back in office')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Check in Now')).toBeInTheDocument();
  });

  it('does not display salesperson selection UI', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    // Should not have salesperson selection
    expect(screen.queryByText('Select name')).not.toBeInTheDocument();
    expect(screen.queryByText('James')).not.toBeInTheDocument();
    expect(screen.queryByText('Luyanda')).not.toBeInTheDocument();
    expect(screen.queryByText('Stefan')).not.toBeInTheDocument();
    expect(screen.queryByText('Please select a salesperson to continue')).not.toBeInTheDocument();
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

  it('shows check-in button with correct text', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    const checkInButton = screen.getByText('Check in Now');
    expect(checkInButton).toBeInTheDocument();
  });

  it('disables check-in button when required fields are missing', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    const checkInButton = screen.getByText('Check in Now');
    expect(checkInButton).toBeDisabled();
  });

  it('enables check-in button when all required fields are filled', async () => {
    render(<CheckInPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading mine groups...')).not.toBeInTheDocument();
    });

    // Fill in all required fields
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

    // Now the check-in button should be enabled
    const checkInButton = screen.getByText('Check in Now');
    expect(checkInButton).not.toBeDisabled();
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

  it('submits check-in data successfully and shows success message', async () => {
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
    const checkInButton = screen.getByText('Check in Now');
    fireEvent.click(checkInButton);

    // Wait for API calls
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesperson: 'Current User',
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
          salesperson: 'Current User',
          planned_mines: ['Mine Alpha'],
          main_purpose: 'Quote follow-up',
          availability: 'Later this morning',
          comments: 'Test comment'
        })
      });
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Check-in Successful!')).toBeInTheDocument();
      expect(screen.getByText('Redirecting to main page...')).toBeInTheDocument();
    });

    // Should navigate back to main page after delay
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    }, { timeout: 3000 });
  });

  it('shows loading state during check-in submission', async () => {
    // Override the default mock for this test with a delayed response
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/contacts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: mockContactsData })
        });
      }
      if (url.includes('/api/site-visits')) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(mockSiteVisitResponse);
          }, 100);
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

    // Submit check-in
    const checkInButton = screen.getByText('Check in Now');
    fireEvent.click(checkInButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Checking in...')).toBeInTheDocument();
    });

    // Button should be disabled during submission
    expect(screen.getByText('Checking in...')).toBeDisabled();
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
    const checkInButton = screen.getByText('Check in Now');
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
    const checkInButton = screen.getByText('Check in Now');
    fireEvent.click(checkInButton);

    // Should still show success message and navigate back to main page even if Slack fails
    await waitFor(() => {
      expect(screen.getByText('Check-in Successful!')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    }, { timeout: 3000 });
  });
});
