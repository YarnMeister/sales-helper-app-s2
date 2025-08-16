import { BaseFactory } from './base-factory';
import { ContactFactory, TContactJSON } from './contact-factory';
import { LineItemFactory, TLineItem } from './line-item-factory';

export interface TRequestUpsert {
  salespersonFirstName?: string;
  mineGroup?: string;
  mineName?: string;
  contact?: TContactJSON;
  line_items: TLineItem[];
  comment?: string;
}

export class RequestFactory extends BaseFactory<TRequestUpsert> {
  private contactFactory = new ContactFactory();
  private lineItemFactory = new LineItemFactory();
  
  private static readonly SALESPEOPLE = [
    'Luyanda', 'James', 'Stefan'
  ];
  
  private static readonly COMMENTS = [
    'Standard equipment request for safety compliance',
    'Urgent replacement needed for damaged equipment',
    'Quarterly maintenance equipment order',
    'New employee safety equipment setup',
    'Equipment upgrade for improved efficiency'
  ];

  build(overrides: Partial<TRequestUpsert> = {}): TRequestUpsert {
    const mineGroup = overrides.mineGroup || 'Anglo American';
    const mineName = overrides.mineName || 'Zibulo Mine';
    
    return {
      salespersonFirstName: overrides.salespersonFirstName || 
        this.randomFromArray(RequestFactory.SALESPEOPLE),
      mineGroup,
      mineName,
      contact: overrides.contact || 
        this.contactFactory.buildForMine(mineGroup, mineName),
      line_items: overrides.line_items !== undefined ? 
        overrides.line_items : 
        this.lineItemFactory.buildMany(Math.floor(Math.random() * 3) + 1),
      comment: overrides.comment !== undefined ? 
        overrides.comment : 
        this.randomFromArray(RequestFactory.COMMENTS),
      ...overrides
    };
  }
  
  buildMinimal(): TRequestUpsert {
    return this.build({
      line_items: [],
      contact: undefined,
      comment: undefined
    });
  }
  
  buildWithoutContact(): TRequestUpsert {
    return this.build({ contact: undefined });
  }
  
  buildWithoutLineItems(): TRequestUpsert {
    return this.build({ line_items: [] });
  }
  
  buildReadyToSubmit(): TRequestUpsert {
    return this.build({
      contact: this.contactFactory.build(),
      line_items: this.lineItemFactory.buildMany(2)
    });
  }
}
