import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentDisplay } from '../components/CommentDisplay';

describe('CommentDisplay', () => {
  const mockOnEdit = vi.fn();
  
  const defaultProps = {
    comment: 'This is a test comment',
    onEdit: mockOnEdit,
    requestId: 'QR-001',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays comment text', () => {
    render(<CommentDisplay {...defaultProps} />);
    
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
  });

  it('calls onEdit when clicked', () => {
    render(<CommentDisplay {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('sh-comment-display-content-QR-001'));
    
    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('calls onEdit with Enter key', () => {
    render(<CommentDisplay {...defaultProps} />);
    
    const display = screen.getByTestId('sh-comment-display-content-QR-001');
    fireEvent.keyDown(display, { key: 'Enter' });
    
    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('calls onEdit with Space key', () => {
    render(<CommentDisplay {...defaultProps} />);
    
    const display = screen.getByTestId('sh-comment-display-content-QR-001');
    fireEvent.keyDown(display, { key: ' ' });
    
    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('does not call onEdit when disabled', () => {
    render(<CommentDisplay {...defaultProps} disabled={true} />);
    
    fireEvent.click(screen.getByTestId('sh-comment-display-content-QR-001'));
    
    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  it('preserves line breaks in comment text', () => {
    const multiLineComment = 'Line 1\nLine 2\nLine 3';
    
    render(
      <CommentDisplay 
        {...defaultProps} 
        comment={multiLineComment}
      />
    );
    
    // Check that the text is rendered with proper whitespace handling
    const commentElement = screen.getByText((content, element) => {
      return element?.textContent === multiLineComment;
    });
    expect(commentElement).toHaveClass('whitespace-pre-wrap');
  });

  it('shows edit button on hover', () => {
    render(<CommentDisplay {...defaultProps} showEditButton={true} />);
    
    expect(screen.getByTestId('sh-comment-edit-button')).toBeInTheDocument();
  });

  it('hides edit button when showEditButton is false', () => {
    render(<CommentDisplay {...defaultProps} showEditButton={false} />);
    
    expect(screen.queryByTestId('sh-comment-edit-button')).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    render(<CommentDisplay {...defaultProps} showEditButton={true} />);
    
    fireEvent.click(screen.getByTestId('sh-comment-edit-button'));
    
    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('stops propagation on edit button click', () => {
    const containerClick = vi.fn();
    
    render(
      <div onClick={containerClick}>
        <CommentDisplay {...defaultProps} showEditButton={true} />
      </div>
    );
    
    fireEvent.click(screen.getByTestId('sh-comment-edit-button'));
    
    expect(mockOnEdit).toHaveBeenCalled();
    expect(containerClick).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<CommentDisplay {...defaultProps} />);
    
    const display = screen.getByTestId('sh-comment-display-content-QR-001');
    expect(display).toHaveAttribute('role', 'button');
    expect(display).toHaveAttribute('tabIndex', '0');
    expect(display).toHaveAttribute('aria-label', 'Edit comment for request QR-001');
  });

  it('removes interactivity when disabled', () => {
    render(<CommentDisplay {...defaultProps} disabled={true} />);
    
    const display = screen.getByTestId('sh-comment-display-content-QR-001');
    expect(display).toHaveAttribute('role', 'text');
    expect(display).toHaveAttribute('tabIndex', '-1');
    expect(display).not.toHaveAttribute('aria-label');
  });

  it('applies hover styles when not disabled', () => {
    render(<CommentDisplay {...defaultProps} />);
    
    const display = screen.getByTestId('sh-comment-display-content-QR-001');
    expect(display).toHaveClass('cursor-pointer', 'hover:bg-gray-100', 'transition-colors');
  });

  it('does not apply hover styles when disabled', () => {
    render(<CommentDisplay {...defaultProps} disabled={true} />);
    
    const display = screen.getByTestId('sh-comment-display-content-QR-001');
    expect(display).not.toHaveClass('cursor-pointer', 'hover:bg-gray-100');
  });

  it('displays comment icon', () => {
    render(<CommentDisplay {...defaultProps} />);
    
    // Check that the MessageSquare icon is present
    const icon = screen.getByTestId('sh-comment-display-content-QR-001').querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('shows "Click to edit comment" text', () => {
    render(<CommentDisplay {...defaultProps} showEditButton={true} />);
    
    expect(screen.getByText('Click to edit comment')).toBeInTheDocument();
  });

  it('handles very long comments', () => {
    const longComment = 'a'.repeat(1000);
    
    render(
      <CommentDisplay 
        {...defaultProps} 
        comment={longComment}
      />
    );
    
    expect(screen.getByText(longComment)).toBeInTheDocument();
  });

  it('handles comments with special characters', () => {
    const specialComment = 'Comment with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
    
    render(
      <CommentDisplay 
        {...defaultProps} 
        comment={specialComment}
      />
    );
    
    expect(screen.getByText(specialComment)).toBeInTheDocument();
  });

  it('handles comments with HTML-like content', () => {
    const htmlComment = 'Comment with <script>alert("test")</script> tags';
    
    render(
      <CommentDisplay 
        {...defaultProps} 
        comment={htmlComment}
      />
    );
    
    expect(screen.getByText(htmlComment)).toBeInTheDocument();
  });

  it('handles empty comment gracefully', () => {
    render(
      <CommentDisplay 
        {...defaultProps} 
        comment=""
      />
    );
    
    expect(screen.getByTestId('sh-comment-display-content-QR-001')).toBeInTheDocument();
  });

  it('handles whitespace-only comment', () => {
    render(
      <CommentDisplay 
        {...defaultProps} 
        comment="   "
      />
    );
    
    expect(screen.getByTestId('sh-comment-display-content-QR-001')).toBeInTheDocument();
  });
});
