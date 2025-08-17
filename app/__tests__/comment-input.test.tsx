import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentInput } from '../components/CommentInput';

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

  it('calls onSave when save button is clicked', async () => {
    render(<CommentInput {...defaultProps} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    const saveButton = screen.getByTestId('sh-comment-save');
    
    fireEvent.change(textarea, { target: { value: 'Comment to save' } });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('Comment to save');
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<CommentInput {...defaultProps} initialValue="Original" />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    const cancelButton = screen.getByTestId('sh-comment-cancel');
    
    fireEvent.change(textarea, { target: { value: 'Modified' } });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
    expect(textarea).toHaveValue('Original'); // Should reset
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
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'This is a very long comment that should be truncated' } });
    
    // The textarea should have the maxLength attribute set
    expect(textarea).toHaveAttribute('maxlength', '10');
    // The browser will prevent typing beyond maxLength, but we can't test that directly
    // Instead, verify the maxLength attribute is properly set
  });

  it('disables save button when no changes', () => {
    render(<CommentInput {...defaultProps} initialValue="Original" />);
    
    const saveButton = screen.getByTestId('sh-comment-save');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when there are changes', () => {
    render(<CommentInput {...defaultProps} initialValue="Original" />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    const saveButton = screen.getByTestId('sh-comment-save');
    
    fireEvent.change(textarea, { target: { value: 'Modified' } });
    
    expect(saveButton).not.toBeDisabled();
  });

  it('handles save errors gracefully', async () => {
    const errorOnSave = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<CommentInput {...defaultProps} onSave={errorOnSave} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    const saveButton = screen.getByTestId('sh-comment-save');
    
    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    fireEvent.click(saveButton);
    
    // Should not crash, just log error
    await waitFor(() => {
      expect(errorOnSave).toHaveBeenCalled();
    });
  });

  it('shows loading state during save', async () => {
    const slowSave = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<CommentInput {...defaultProps} onSave={slowSave} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    const saveButton = screen.getByTestId('sh-comment-save');
    
    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    fireEvent.click(saveButton);
    
    // Should show loading spinner
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(slowSave).toHaveBeenCalledTimes(1);
    });
  });

  it('handles null initial value correctly', () => {
    render(<CommentInput {...defaultProps} initialValue={null as any} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    expect(textarea).toHaveValue('');
    
    // Should not crash when typing
    fireEvent.change(textarea, { target: { value: 'New comment' } });
    expect(textarea).toHaveValue('New comment');
  });

  it('prevents save when isSaving is true', async () => {
    const slowSave = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<CommentInput {...defaultProps} onSave={slowSave} />);
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    const saveButton = screen.getByTestId('sh-comment-save');
    
    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    fireEvent.click(saveButton);
    
    // Try to save again while first save is in progress
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(slowSave).toHaveBeenCalledTimes(1);
    });
  });
});
