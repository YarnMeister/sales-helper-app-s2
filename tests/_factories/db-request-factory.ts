import { BaseFactory } from './base-factory';
import { RequestFactory } from './request-factory';

export interface TestRequestDB {
  id: string;
  request_id: string;
  status: 'draft' | 'submitted' | 'in_progress' | 'won' | 'lost';
  salesperson_first_name?: string;
  mine_group?: string;
  mine_name?: string;
  contact?: any;
  line_items: any[];
  comment?: string;
  pipedrive_deal_id?: number;
  created_at: string;
  updated_at: string;
}

export class DBRequestFactory extends BaseFactory<TestRequestDB> {
  private requestFactory = new RequestFactory();

  build(overrides: Partial<TestRequestDB> = {}): TestRequestDB {
    const baseRequest = this.requestFactory.build();
    const now = new Date().toISOString();
    
    return {
      id: overrides.id || `00000000-0000-0000-0000-${this.nextId().toString().padStart(12, '0')}`,
      request_id: overrides.request_id || this.nextString('QR'),
      status: overrides.status || 'draft',
      salesperson_first_name: overrides.salesperson_first_name || baseRequest.salespersonFirstName,
      mine_group: overrides.mine_group || baseRequest.mineGroup,
      mine_name: overrides.mine_name || baseRequest.mineName,
      contact: overrides.contact !== undefined ? overrides.contact : baseRequest.contact,
      line_items: overrides.line_items !== undefined ? overrides.line_items : baseRequest.line_items,
      comment: overrides.comment !== undefined ? overrides.comment : baseRequest.comment,
      pipedrive_deal_id: overrides.pipedrive_deal_id || undefined,
      created_at: overrides.created_at || now,
      updated_at: overrides.updated_at || now,
      ...overrides
    };
  }
  
  buildDraft(): TestRequestDB {
    return this.build({ status: 'draft' });
  }
  
  buildSubmitted(): TestRequestDB {
    return this.build({ 
      status: 'submitted',
      pipedrive_deal_id: this.nextId() + 100000
    });
  }
}
