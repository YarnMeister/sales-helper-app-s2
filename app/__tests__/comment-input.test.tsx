import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentInput } from '@/components/CommentInput';

describe('CommentInput', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  
  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    requestId: 'QR-001',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with initial value', () => {
    render(
      <CommentInput 
        {...defaultProps} 
        initialValue="Initial comment"
      />
    );
    
    expect(screen.getByDisplayValue('Initial comment')).toBeInTheDocument();
  });

  it('auto-focuses textarea when autoFocus is true', () => {
    render(<CommentInput {...defaultProps} autoFocus={true} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    expect(textarea).toHaveFocus();
  });

  it('updates value on change', () => {
    render(<CommentInput {...defaultProps} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'New text' } });
    
    expect(textarea).toHaveValue('New text');
  });

  it('calls onSave on blur with non-empty text', async () => {
    render(<CommentInput {...defaultProps} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'Comment to save' } });
    fireEvent.blur(textarea);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('Comment to save');
    });
  });

  it('calls onCancel on blur with empty text', async () => {
    render(<CommentInput {...defaultProps} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.blur(textarea);
    
    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalled();
    });
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('saves on Ctrl+Enter', async () => {
    render(<CommentInput {...defaultProps} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'Ctrl save' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('Ctrl save');
    });
  });

  it('cancels on Escape', () => {
    render(<CommentInput {...defaultProps} initialValue="Original" />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'Modified' } });
    fireEvent.keyDown(textarea, { key: 'Escape' });
    
    expect(mockOnCancel).toHaveBeenCalled();
    expect(textarea).toHaveValue('Original'); // Should reset
  });

  it('shows character count near limit', () => {
    render(<CommentInput {...defaultProps} maxLength={100} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'a'.repeat(95) } });
    
    expect(screen.getByText('5 characters remaining')).toBeInTheDocument();
  });

  it('prevents typing beyond character limit', () => {
    render(<CommentInput {...defaultProps} maxLength={10} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'a'.repeat(15) } });
    
    // Should be truncated to max length
    expect(textarea.value.length).toBeLessThanOrEqual(10);
  });

  it('shows save/cancel buttons on mobile screens', () => {
    // Mock small screen
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400,
    });
    
    render(<CommentInput {...defaultProps} />);
    
    expect(screen.getByTestId('sh-comment-save')).toBeInTheDocument();
    expect(screen.getByTestId('sh-comment-cancel')).toBeInTheDocument();
  });

  it('handles save errors', async () => {
    const failingSave = vi.fn().mockRejectedValue(new Error('Network error'));
    
    render(
      <CommentInput 
        {...defaultProps} 
        onSave={failingSave}
      />
    );
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    fireEvent.blur(textarea);
    
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('shows loading state during save', async () => {
    const slowSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<CommentInput {...defaultProps} onSave={slowSave} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'Saving...' } });
    fireEvent.blur(textarea);
    
    // Should show loading spinner
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
    
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  it('disables interactions when disabled prop is true', () => {
    render(<CommentInput {...defaultProps} disabled={true} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    expect(textarea).toBeDisabled();
    
    const saveButton = screen.queryByTestId('sh-comment-save');
    if (saveButton) {
      expect(saveButton).toBeDisabled();
    }
  });

  it('shows help text for keyboard shortcuts', () => {
    render(<CommentInput {...defaultProps} />);
    
    expect(screen.getByText(/Ctrl\+Enter to save/)).toBeInTheDocument();
    expect(screen.getByText(/Esc to cancel/)).toBeInTheDocument();
  });

  it('updates help text after blur', async () => {
    render(<CommentInput {...defaultProps} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.blur(textarea);
    
    await waitFor(() => {
      expect(screen.getByText(/Comment will auto-save when you click outside/)).toBeInTheDocument();
    });
  });

  it('auto-resizes textarea based on content', () => {
    render(<CommentInput {...defaultProps} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea') as HTMLTextAreaElement;
    const originalHeight = textarea.style.height;
    
    // Add multi-line content
    fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5' } });
    
    // Height should have changed
    expect(textarea.style.height).not.toBe(originalHeight);
  });

  it('places cursor at end of text when auto-focusing', () => {
    render(<CommentInput {...defaultProps} initialValue="Existing text" autoFocus={true} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea') as HTMLTextAreaElement;
    expect(textarea.selectionStart).toBe(textarea.value.length);
    expect(textarea.selectionEnd).toBe(textarea.value.length);
  });

  it('handles empty initial value correctly', () => {
    render(<CommentInput {...defaultProps} initialValue="" />);
    
    const textarea = screen.getByTestId('sh-comment-textarea') as HTMLTextAreaElement;
    expect(textarea).toHaveValue('');
  });

  it('handles null initial value correctly', () => {
    render(<CommentInput {...defaultProps} initialValue={null as any} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea') as HTMLTextAreaElement;
    expect(textarea).toHaveValue('');
  });

  it('prevents save when isSaving is true', async () => {
    const slowSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<CommentInput {...defaultProps} onSave={slowSave} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    
    // Trigger multiple saves quickly
    fireEvent.blur(textarea);
    fireEvent.focus(textarea);
    fireEvent.blur(textarea);
    
    await waitFor(() => {
      expect(slowSave).toHaveBeenCalledTimes(1);
    });
  });
});
