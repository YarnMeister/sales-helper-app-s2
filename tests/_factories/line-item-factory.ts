import { BaseFactory } from './base-factory';

export interface TLineItem {
  pipedriveProductId: number;
  name: string;
  code: string;
  category: string;
  price: number;
  quantity: number;
  shortDescription: string;
}

export class LineItemFactory extends BaseFactory<TLineItem> {
  private static readonly CATEGORIES = [
    'Safety Equipment',
    'Communication Devices',
    'Monitoring Systems',
    'Power Equipment',
    'Ventilation Systems'
  ];
  
  private static readonly PRODUCTS = {
    'Safety Equipment': [
      { name: 'AirRobo Sensor', code: 'AR-001', price: 150.00 },
      { name: 'Safety Helmet', code: 'SH-001', price: 75.00 },
      { name: 'Emergency Beacon', code: 'EB-001', price: 200.00 }
    ],
    'Communication Devices': [
      { name: 'Radio Device', code: 'RD-001', price: 180.00 },
      { name: 'Intercom System', code: 'IS-001', price: 350.00 }
    ],
    'Monitoring Systems': [
      { name: 'Gas Monitor', code: 'GM-001', price: 250.00 },
      { name: 'Temperature Sensor', code: 'TS-001', price: 120.00 }
    ],
    'Power Equipment': [
      { name: 'Battery Pack', code: 'BP-001', price: 90.00 },
      { name: 'Power Converter', code: 'PC-001', price: 160.00 }
    ],
    'Ventilation Systems': [
      { name: 'Air Filter', code: 'AF-001', price: 80.00 },
      { name: 'Ventilation Fan', code: 'VF-001', price: 220.00 }
    ]
  };

  build(overrides: Partial<TLineItem> = {}): TLineItem {
    const category = overrides.category || 
      this.randomFromArray(LineItemFactory.CATEGORIES);
    
    const products = LineItemFactory.PRODUCTS[category as keyof typeof LineItemFactory.PRODUCTS] || 
      LineItemFactory.PRODUCTS[LineItemFactory.CATEGORIES[0] as keyof typeof LineItemFactory.PRODUCTS];
    
    const product = this.randomFromArray(products);
    
    return {
      pipedriveProductId: overrides.pipedriveProductId || this.nextId() + 90000,
      name: overrides.name || product.name,
      code: overrides.code || product.code,
      category: category,
      price: overrides.price !== undefined ? overrides.price : product.price,
      quantity: overrides.quantity || Math.floor(Math.random() * 5) + 1,
      shortDescription: overrides.shortDescription || 
        `${product.name} for mining operations`,
      ...overrides
    };
  }
  
  buildForCategory(category: string): TLineItem {
    return this.build({ category });
  }
  
  buildWithQuantity(quantity: number): TLineItem {
    return this.build({ quantity });
  }
}
