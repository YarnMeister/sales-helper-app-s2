import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentControl } from '../components/CommentControl';

describe('CommentControl', () => {
  const mockOnCommentChange = vi.fn();
  const defaultProps = {
    onCommentChange: mockOnCommentChange,
    requestId: 'QR-001',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Add Comment button when no comment exists', () => {
    render(<CommentControl {...defaultProps} />);
    
    expect(screen.getByTestId('sh-comment-add-button')).toBeInTheDocument();
    expect(screen.getByText('Add Comment')).toBeInTheDocument();
  });

  it('displays existing comment', () => {
    render(
      <CommentControl 
        {...defaultProps} 
        comment="This is a test comment" 
      />
    );
    
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    expect(screen.getByText('Click to edit comment')).toBeInTheDocument();
  });

  it('enters edit mode when Add Comment button clicked', () => {
    render(<CommentControl {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('sh-comment-add-button'));
    
    expect(screen.getByTestId('sh-comment-textarea')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
  });

  it('enters edit mode when existing comment clicked', () => {
    render(
      <CommentControl 
        {...defaultProps} 
        comment="Existing comment" 
      />
    );
    
    fireEvent.click(screen.getByTestId('sh-comment-display-content-QR-001'));
    
    expect(screen.getByTestId('sh-comment-textarea')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing comment')).toBeInTheDocument();
  });

  it('saves comment when save button clicked', async () => {
    render(<CommentControl {...defaultProps} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByTestId('sh-comment-add-button'));
    
    // Type comment
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'New comment' } });
    
    // Click save button
    fireEvent.click(screen.getByTestId('sh-comment-save'));
    
    await waitFor(() => {
      expect(mockOnCommentChange).toHaveBeenCalledWith('New comment');
    });
  });

  it('cancels edit mode when cancel button clicked', async () => {
    render(<CommentControl {...defaultProps} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByTestId('sh-comment-add-button'));
    
    // Click cancel button
    fireEvent.click(screen.getByTestId('sh-comment-cancel'));
    
    await waitFor(() => {
      expect(screen.getByTestId('sh-comment-add-button')).toBeInTheDocument();
    });
    
    expect(mockOnCommentChange).not.toHaveBeenCalled();
  });

  it('saves comment with Ctrl+Enter', async () => {
    render(<CommentControl {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('sh-comment-add-button'));
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'Keyboard save' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    await waitFor(() => {
      expect(mockOnCommentChange).toHaveBeenCalledWith('Keyboard save');
    });
  });

  it('cancels edit with Escape key', () => {
    render(
      <CommentControl 
        {...defaultProps} 
        comment="Original comment" 
      />
    );
    
    // Enter edit mode
    fireEvent.click(screen.getByTestId('sh-comment-display-content-QR-001'));
    
    // Modify text
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'Modified comment' } });
    
    // Press Escape
    fireEvent.keyDown(textarea, { key: 'Escape' });
    
    // Should return to display mode with original comment
    expect(screen.getByText('Original comment')).toBeInTheDocument();
    expect(mockOnCommentChange).not.toHaveBeenCalled();
  });

  it('shows loading state during save', async () => {
    const slowSave = vi.fn(() => new Promise<void>(resolve => setTimeout(resolve, 100)));
    
    render(<CommentControl {...defaultProps} onCommentChange={slowSave} />);
    
    fireEvent.click(screen.getByTestId('sh-comment-add-button'));
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'Slow save' } });
    fireEvent.click(screen.getByTestId('sh-comment-save'));
    
    // Should show loading state
    expect(screen.getByText('Saving comment...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Saving comment...')).not.toBeInTheDocument();
    });
  });

  it('handles save errors gracefully', async () => {
    const failingSave = vi.fn().mockRejectedValue(new Error('Save failed'));
    
    render(<CommentControl {...defaultProps} onCommentChange={failingSave} />);
    
    fireEvent.click(screen.getByTestId('sh-comment-add-button'));
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'Failing comment' } });
    fireEvent.click(screen.getByTestId('sh-comment-save'));
    
    // Should show loading state during save
    expect(screen.getByText('Saving comment...')).toBeInTheDocument();
    
    // Wait for the error to be handled
    await waitFor(() => {
      expect(screen.getByTestId('sh-comment-textarea')).toBeInTheDocument();
    });
    
    // Verify the error was logged (we can't easily test the console.error)
    expect(failingSave).toHaveBeenCalledWith('Failing comment');
  });

  it('disables editing when disabled prop is true', () => {
    render(
      <CommentControl 
        {...defaultProps} 
        comment="Cannot edit this"
        disabled={true}
      />
    );
    
    // Click should not enter edit mode
    fireEvent.click(screen.getByTestId('sh-comment-display-QR-001'));
    
    expect(screen.queryByTestId('sh-comment-textarea')).not.toBeInTheDocument();
    expect(screen.getByText('Cannot edit this')).toBeInTheDocument();
  });

  it('shows character count warning near limit', () => {
    render(<CommentControl {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('sh-comment-add-button'));
    
    // Create a long comment (near the 2000 character limit)
    const longComment = 'a'.repeat(1950);
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: longComment } });
    
    expect(screen.getByText('50 characters remaining')).toBeInTheDocument();
  });

  it('handles multi-line comments correctly', async () => {
    const multiLineComment = 'Line 1\nLine 2\nLine 3';
    
    render(<CommentControl {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('sh-comment-add-button'));
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: multiLineComment } });
    fireEvent.click(screen.getByTestId('sh-comment-save'));
    
    await waitFor(() => {
      expect(mockOnCommentChange).toHaveBeenCalledWith(multiLineComment);
    });
  });

  it('trims whitespace from saved comments', async () => {
    render(<CommentControl {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('sh-comment-add-button'));
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: '  Padded comment  ' } });
    fireEvent.click(screen.getByTestId('sh-comment-save'));
    
    await waitFor(() => {
      expect(mockOnCommentChange).toHaveBeenCalledWith('Padded comment');
    });
  });

  it('auto-focuses textarea when entering edit mode', () => {
    render(<CommentControl {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('sh-comment-add-button'));
    
    const textarea = screen.getByTestId('sh-comment-textarea');
    expect(textarea).toHaveFocus();
  });

  it('places cursor at end of text when editing existing comment', () => {
    render(
      <CommentControl 
        {...defaultProps} 
        comment="Existing comment" 
      />
    );
    
    fireEvent.click(screen.getByTestId('sh-comment-display-content-QR-001'));
    
    const textarea = screen.getByTestId('sh-comment-textarea') as HTMLTextAreaElement;
    expect(textarea).toHaveFocus();
    expect(textarea.selectionStart).toBe(textarea.value.length);
  });
});
