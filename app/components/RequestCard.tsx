import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { User, Package, ExternalLink, Trash2, Plus, Minus, Mail, Phone } from 'lucide-react';
import { CommentControl } from './CommentControl';
import { LineItemCard } from './LineItemCard';

interface Contact {
  personId: number;
  name: string;
  email?: string;
  phone?: string;
  mineGroup?: string;
  mineName?: string;
}

interface LineItem {
  pipedriveProductId: number;
  name: string;
  code?: string | null;
  quantity: number;
  price?: number;
  shortDescription?: string;
}

interface Request {
  id: string;
  request_id: string;
  status: 'draft' | 'submitted' | 'failed';
  salesperson_first_name?: string;
  contact?: Contact;
  line_items: LineItem[];
  comment?: string;
  pipedrive_deal_id?: number;
  created_at: string;
  updated_at: string;
}

interface RequestCardProps {
  request: Request;
  onAddContact?: (requestId: string) => void;
  onAddLineItems?: (requestId: string) => void;
  onSubmit?: (requestId: string) => Promise<void>;
  onUpdateInline?: (requestId: string, field: string, value: any) => Promise<void>;
  onViewDeal?: (dealId: number) => void;
  onDeleteRequest?: (requestId: string) => Promise<void>;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAddContact,
  onAddLineItems,
  onSubmit,
  onUpdateInline,
  onViewDeal,
  onDeleteRequest
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticQuantities, setOptimisticQuantities] = useState<{[key: number]: number}>({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // PRD: Submit enabled only when contact AND line items AND salesperson exist
  const canSubmit = request.contact &&
                   request.line_items.length > 0 &&
                   request.salesperson_first_name &&
                   request.salesperson_first_name !== 'Select Name';
  const isSubmitted = request.status === 'submitted';
  const isFailed = request.status === 'failed';

  const handleSubmit = async () => {
    if (!canSubmit || !onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(request.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDeleteRequest) return;

    setIsDeleting(true);
    try {
      await onDeleteRequest(request.id);
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error('Failed to delete request:', error);
      // Keep the modal open if deletion fails
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
  };

  const handleDeleteLineItem = async (itemIndex: number) => {
    if (!onUpdateInline) return;
    
    const updatedItems = request.line_items.filter((_, index) => index !== itemIndex);
    await onUpdateInline(request.id, 'line_items', updatedItems);
  };

  const handleQuantityChange = async (itemIndex: number, newQuantity: number) => {
    if (!onUpdateInline) return;

    // Optimistic update - immediately update the UI
    setOptimisticQuantities(prev => ({
      ...prev,
      [itemIndex]: newQuantity
    }));
    
    // Then update the backend
    try {
      const updatedItems = [...request.line_items];
      updatedItems[itemIndex].quantity = newQuantity;
      await onUpdateInline(request.id, 'line_items', updatedItems);
      
      // Clear optimistic state on success
      setOptimisticQuantities(prev => {
        const newState = { ...prev };
        delete newState[itemIndex];
        return newState;
      });
    } catch (error) {
      // If backend update fails, revert the optimistic update
      setOptimisticQuantities(prev => {
        const newState = { ...prev };
        delete newState[itemIndex];
        return newState;
      });
      console.error('Failed to update quantity:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'submitted':
        return {
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          label: 'Submitted'
        };
      case 'draft':
        return {
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          label: 'Draft'
        };
      case 'failed':
        return {
          bgColor: 'bg-red-600',
          textColor: 'text-white',
          label: 'Failed'
        };
      default:
        return {
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          label: 'Draft'
        };
    }
  };

  const statusConfig = getStatusConfig(request.status);



  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 mb-4">
      {/* Header with Request ID and Status */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2
              className="text-2xl font-bold text-red-600 font-mono"
              data-testid="sh-request-id"
            >
              {request.request_id}
            </h2>
            {/* Delete button - only show for draft requests */}
            {!isSubmitted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                data-testid="sh-delete-request"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Salesperson selection/display */}
            {isSubmitted ? (
              // Static display for submitted requests - show the name or "Not Selected" if still default
              <p className="text-sm text-gray-600 font-medium">
                {request.salesperson_first_name && request.salesperson_first_name !== 'Select Name'
                  ? request.salesperson_first_name
                  : 'Not Selected'}
              </p>
            ) : (
              // Dropdown for draft requests
              <select
                value={request.salesperson_first_name || 'Select Name'}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (onUpdateInline && newValue !== 'Select Name') {
                    onUpdateInline(request.id, 'salespersonFirstName', newValue);
                  }
                }}
                className="w-32 h-8 text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Select Name" disabled>
                  Select Name
                </option>
                <option value="Stefan">Stefan</option>
                <option value="James">James</option>
                <option value="Luyanda">Luyanda</option>
              </select>
            )}
            <Badge
              className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0 text-xs font-medium`}
              data-testid="sh-request-status"
            >
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="p-4 border-b border-gray-100">
        {request.contact && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Contact</h3>
          </div>
        )}
        {request.contact ? (
          <div 
            className="bg-white border border-blue-200 rounded-lg p-3"
            data-testid="sh-request-contact-display"
          >
            <div className="flex-1">
              {/* Mobile Layout: 3 separate rows */}
              <div className="md:hidden">
                {/* Row 1: Contact Name with Change button */}
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-blue-900">{request.contact.name}</p>
                  {!isSubmitted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddContact?.(request.id)}
                      className="text-red-600 hover:text-red-700 text-xs"
                      data-testid="sh-request-change-contact"
                    >
                      Change
                    </Button>
                  )}
                </div>
                
                {/* Row 2: Mine Group and Mine Name as separate badges */}
                <div className="mb-2 flex gap-2">
                  {request.contact.mineGroup && (
                    <Badge className="bg-blue-100 text-blue-800 border-0 text-xs font-medium">
                      {request.contact.mineGroup}
                    </Badge>
                  )}
                  {request.contact.mineName && (
                    <Badge className="bg-green-100 text-green-800 border-0 text-xs font-medium">
                      {request.contact.mineName}
                    </Badge>
                  )}
                </div>
                  
                {/* Row 3: Email and Phone */}
                <div className="space-y-1">
                  {request.contact.email && (
                    <a 
                      href={`mailto:${request.contact.email}`}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      <span>{request.contact.email}</span>
                    </a>
                  )}
                  {request.contact.phone && (
                    <a 
                      href={`tel:${request.contact.phone}`}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      <span>{request.contact.phone}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Desktop Layout: Original compact layout */}
              <div className="hidden md:block">
                {/* Row 1: Name and Mine Group | Mine Name */}
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-blue-900">{request.contact.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-2">
                      {request.contact.mineGroup && (
                        <Badge className="bg-blue-100 text-blue-800 border-0 text-xs font-medium">
                          {request.contact.mineGroup}
                        </Badge>
                      )}
                      {request.contact.mineName && (
                        <Badge className="bg-green-100 text-green-800 border-0 text-xs font-medium">
                          {request.contact.mineName}
                        </Badge>
                      )}
                    </div>
                    {!isSubmitted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddContact?.(request.id)}
                        className="text-red-600 hover:text-red-700 text-xs"
                        data-testid="sh-request-change-contact-desktop"
                      >
                        Change
                      </Button>
                    )}
                  </div>
                </div>
                  
                {/* Row 2: Email and Phone on same row */}
                <div className="flex items-center gap-4">
                  {request.contact.email && (
                    <a 
                      href={`mailto:${request.contact.email}`}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      <span>{request.contact.email}</span>
                    </a>
                  )}
                  {request.contact.phone && (
                    <a 
                      href={`tel:${request.contact.phone}`}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      <span>{request.contact.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => onAddContact?.(request.id)}
            disabled={isSubmitted}
            data-testid="sh-request-add-contact"
          >
            <User className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        )}
      </div>

      {/* Line Items Section */}
      <div className="p-4 border-b border-gray-100">
        {request.line_items.length > 0 && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Line Items</h3>
          </div>
        )}
        {/* Display existing line items */}
        {request.line_items.length > 0 && (
          <div className="space-y-3" data-testid="sh-request-items-display">
            {request.line_items.map((item, index) => (
              <LineItemCard
                key={index}
                item={item}
                index={index}
                isSubmitted={isSubmitted}
                onQuantityChange={handleQuantityChange}
                onDelete={handleDeleteLineItem}
              />
            ))}
          </div>
        )}

        {/* Always show Add Line Items button */}
        <div className="mt-3">
          <Button
            variant="outline"
            className="w-full border-green-700 text-green-700 hover:bg-green-50"
            onClick={() => onAddLineItems?.(request.id)}
            disabled={isSubmitted}
            data-testid="sh-request-add-items"
          >
            <Package className="h-4 w-4 mr-2" />
            Add Line Items
          </Button>
        </div>
      </div>

      {/* Enhanced Comment Section with Inline Editing */}
      <div className="p-4 border-b border-gray-100">
        <CommentControl
          comment={request.comment}
          onCommentChange={async (newComment) => {
            if (onUpdateInline) {
              await onUpdateInline(request.id, 'comment', newComment);
            }
          }}
          disabled={isSubmitted}
          requestId={request.request_id}
        />
      </div>

      {/* Action Buttons */}
      <div className="p-4">
        {isSubmitted ? (
          <Button
            variant="default"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => onViewDeal?.(request.pipedrive_deal_id!)}
            data-testid="sh-request-see-deal"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            See Deal
          </Button>
        ) : isFailed ? (
          <Button
            variant={canSubmit ? "active" : "disabled"}
            className="w-full"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            data-testid="sh-request-retry"
          >
            {isSubmitting ? 'Retrying...' : 'Retry Submission'}
          </Button>
        ) : (
          <div className="flex justify-end">
            <Button
              variant={canSubmit ? "active" : "disabled"}
              className={`w-full ${!canSubmit ? 'border-gray-300' : 'bg-green-700 hover:bg-green-800 text-white border-green-700'}`}
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              data-testid="sh-request-submit"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        )}

        {/* Validation Message */}
        {!canSubmit && !isSubmitted && !isFailed && (
          <div className="text-center mt-2">
            <p className="text-xs text-gray-500">
              {(() => {
                const missingItems = [];
                if (!request.contact) missingItems.push('contact');
                if (!request.line_items.length) missingItems.push('line items');
                if (!request.salesperson_first_name || request.salesperson_first_name === 'Select Name') {
                  missingItems.push('salesperson name');
                }

                if (missingItems.length === 0) return '';
                if (missingItems.length === 1) return `Add ${missingItems[0]} to submit`;
                if (missingItems.length === 2) return `Add ${missingItems[0]} and ${missingItems[1]} to submit`;
                return `Add ${missingItems.slice(0, -1).join(', ')}, and ${missingItems[missingItems.length - 1]} to submit`;
              })()}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Request?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete request {request.request_id}? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
