import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { User, Package, ExternalLink, Trash2, Plus, Minus } from 'lucide-react';
import { CommentControl } from './CommentControl';

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
  quantity: number;
  price?: number;
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
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAddContact,
  onAddLineItems,
  onSubmit,
  onUpdateInline,
  onViewDeal
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PRD: Submit enabled only when contact AND line items exist
  const canSubmit = request.contact && request.line_items.length > 0;
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

  const handleDeleteLineItem = async (itemIndex: number) => {
    if (!onUpdateInline) return;
    
    const updatedItems = request.line_items.filter((_, index) => index !== itemIndex);
    await onUpdateInline(request.id, 'line_items', updatedItems);
  };

  const handleQuantityChange = async (itemIndex: number, newQuantity: number) => {
    if (!onUpdateInline) return;

    const updatedItems = [...request.line_items];
    updatedItems[itemIndex].quantity = newQuantity;
    await onUpdateInline(request.id, 'line_items', updatedItems);
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
          bgColor: 'bg-red-500',
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

  // Get service badge info from contact
  const getServiceBadge = () => {
    if (request.contact?.mineGroup) {
      return {
        text: request.contact.mineGroup,
        color: request.contact.mineGroup.includes('Blue') ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
      };
    }
    return null;
  };

  const serviceBadge = getServiceBadge();

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 mb-4">
      {/* Header with Request ID and Status */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h2 
              className="text-2xl font-bold text-red-600 font-mono mb-1"
              data-testid="sh-request-id"
            >
              {request.request_id}
            </h2>
            {serviceBadge && (
              <Badge className={`${serviceBadge.color} border-0 text-xs font-medium`}>
                {serviceBadge.text}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
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
        {request.contact ? (
          <div 
            className="bg-blue-50 border border-blue-200 rounded-lg p-3"
            data-testid="sh-request-contact-display"
          >
            <div className="flex items-start gap-2 mb-2">
              <User className="h-4 w-4 text-blue-600 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-blue-900">{request.contact.name}</p>
                  {!isSubmitted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddContact?.(request.id)}
                      className="text-blue-700 hover:text-blue-900 p-1"
                      data-testid="sh-request-change-contact"
                    >
                      Change
                    </Button>
                  )}
                </div>
                
                {request.contact.mineGroup && request.contact.mineName && (
                  <p className="text-sm text-blue-700 mb-1">
                    {request.contact.mineGroup} → {request.contact.mineName}
                  </p>
                )}
                
                <div className="space-y-1">
                  {request.contact.email && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <span>📧</span>
                      <span>{request.contact.email}</span>
                    </p>
                  )}
                  {request.contact.phone && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <span>📞</span>
                      <span>{request.contact.phone}</span>
                    </p>
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
        {/* Display existing line items */}
        {request.line_items.length > 0 && (
          <div 
            className="bg-white border border-green-200 rounded-lg p-3"
            data-testid="sh-request-items-display"
          >
            <div className="mb-2">
              <p className="font-medium text-green-900">
                Items: {request.line_items.length}
              </p>
            </div>
            <div className="space-y-2">
              {request.line_items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded p-2">
                  {/* Top row: Description spanning to delete button */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 pr-2">
                      <div className="text-sm text-gray-800">
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </div>
                    {!isSubmitted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLineItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 flex-shrink-0"
                        data-testid={`sh-delete-line-item-${index}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Bottom row: Quantity controls and price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(index, item.quantity + 1)}
                        disabled={isSubmitted}
                        className="text-red-600 hover:text-red-700 bg-white border border-red-300 hover:border-red-400 hover:bg-red-50 p-1 h-5 w-5 flex items-center justify-center rounded"
                        data-testid={`sh-increase-quantity-${index}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 1;
                          handleQuantityChange(index, Math.max(1, newQuantity));
                        }}
                        min="1"
                        disabled={isSubmitted}
                        className="w-16 text-center text-sm border border-gray-300 rounded px-1 py-1 bg-white h-8"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        data-testid={`sh-quantity-input-${index}`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(index, Math.max(1, item.quantity - 1))}
                        disabled={isSubmitted || item.quantity <= 1}
                        className="text-red-600 hover:text-red-700 bg-white border border-red-300 hover:border-red-400 hover:bg-red-50 p-1 h-5 w-5 flex items-center justify-center rounded"
                        data-testid={`sh-decrease-quantity-${index}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.price && (
                        <span>
                          R{(item.price * item.quantity).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Always show Add Line Items button */}
        <div className="mt-3">
          <Button
            variant="outline"
            className="w-full border-green-200 text-green-700 hover:bg-green-50"
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
            className="w-full bg-blue-600 hover:bg-blue-700"
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
              className={`w-full ${!canSubmit ? 'border-gray-300' : ''}`}
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
              {!request.contact && !request.line_items.length 
                ? 'Add contact and line items to submit'
                : !request.contact 
                  ? 'Add contact to submit'
                  : 'Add line items to submit'
              }
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
