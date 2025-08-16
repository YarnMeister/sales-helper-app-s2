import { describe, it, expect } from 'vitest';

// Copy the transformation functions here to test them in isolation
const transformContactsHierarchy = (persons: any[], organizations: any[]) => {
  const orgMap = new Map(organizations.map(org => [org.id, org]));
  
  const grouped = persons.reduce((acc, person) => {
    const org = orgMap.get(person.org_id?.value);
    // PRD requirement: Group by Mine Group > Mine Name > Persons
    const mineGroup = org?.['your_mine_group_field_id'] || 'Unknown Group';
    const mineName = person.org_id?.name || 'Unknown Mine';
    
    if (!acc[mineGroup]) acc[mineGroup] = {};
    if (!acc[mineGroup][mineName]) acc[mineGroup][mineName] = [];
    
    acc[mineGroup][mineName].push({
      personId: person.id,
      name: person.name,
      email: person.email?.[0]?.value || null,
      phone: person.phone?.[0]?.value || null,
      orgId: person.org_id?.value,
      orgName: person.org_id?.name,
      mineGroup,
      mineName
    });
    
    return acc;
  }, {});
  
  return grouped;
};

const transformProductsHierarchy = (products: any[]) => {
  const categoryMap: Record<string, string> = {
    '1': 'Safety Equipment',
    '2': 'Mining Tools',
    '3': 'Personal Protective Equipment',
    '4': 'Machinery Parts'
  };
  
  return products.reduce((acc, product) => {
    const category = categoryMap[product.category as string] || 'Other';
    
    if (!acc[category]) acc[category] = [];
    
    acc[category].push({
      pipedriveProductId: product.id,
      name: product.name,
      code: product.code,
      price: product.price || 0,
      shortDescription: product.description || ''
    });
    
    return acc;
  }, {});
};

describe('Transformation Functions', () => {
  describe('transformContactsHierarchy', () => {
    it('should transform contacts to hierarchical structure', () => {
      const persons = [
        {
          id: 1,
          name: 'John Doe',
          email: [{ value: 'john@mine.com' }],
          phone: [{ value: '+1234567890' }],
          org_id: { value: 1, name: 'Mine A' }
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: [{ value: 'jane@mine.com' }],
          phone: [{ value: '+0987654321' }],
          org_id: { value: 2, name: 'Mine B' }
        }
      ];

      const organizations = [
        {
          id: 1,
          name: 'Mine A',
          your_mine_group_field_id: 'Group 1'
        },
        {
          id: 2,
          name: 'Mine B',
          your_mine_group_field_id: 'Group 2'
        }
      ];

      const result = transformContactsHierarchy(persons, organizations);

      expect(result).toEqual({
        'Group 1': {
          'Mine A': [
            {
              personId: 1,
              name: 'John Doe',
              email: 'john@mine.com',
              phone: '+1234567890',
              orgId: 1,
              orgName: 'Mine A',
              mineGroup: 'Group 1',
              mineName: 'Mine A'
            }
          ]
        },
        'Group 2': {
          'Mine B': [
            {
              personId: 2,
              name: 'Jane Smith',
              email: 'jane@mine.com',
              phone: '+0987654321',
              orgId: 2,
              orgName: 'Mine B',
              mineGroup: 'Group 2',
              mineName: 'Mine B'
            }
          ]
        }
      });
    });

    it('should handle missing organization data gracefully', () => {
      const persons = [
        {
          id: 1,
          name: 'John Doe',
          email: [{ value: 'john@mine.com' }],
          phone: [{ value: '+1234567890' }],
          org_id: { value: 999, name: 'Unknown Mine' }
        }
      ];

      const organizations = [];

      const result = transformContactsHierarchy(persons, organizations);

      expect(result).toEqual({
        'Unknown Group': {
          'Unknown Mine': [
            {
              personId: 1,
              name: 'John Doe',
              email: 'john@mine.com',
              phone: '+1234567890',
              orgId: 999,
              orgName: 'Unknown Mine',
              mineGroup: 'Unknown Group',
              mineName: 'Unknown Mine'
            }
          ]
        }
      });
    });
  });

  describe('transformProductsHierarchy', () => {
    it('should transform products to categorized structure', () => {
      const products = [
        {
          id: 1,
          name: 'Safety Helmet',
          category: '1',
          price: 50,
          code: 'SH-001',
          description: 'Hard hat for safety'
        },
        {
          id: 2,
          name: 'Mining Pick',
          category: '2',
          price: 100,
          code: 'MP-001',
          description: 'Tool for mining'
        },
        {
          id: 3,
          name: 'Unknown Product',
          category: '999',
          price: 25,
          code: 'UP-001'
        }
      ];

      const result = transformProductsHierarchy(products);

      expect(result).toEqual({
        'Safety Equipment': [
          {
            pipedriveProductId: 1,
            name: 'Safety Helmet',
            code: 'SH-001',
            price: 50,
            shortDescription: 'Hard hat for safety'
          }
        ],
        'Mining Tools': [
          {
            pipedriveProductId: 2,
            name: 'Mining Pick',
            code: 'MP-001',
            price: 100,
            shortDescription: 'Tool for mining'
          }
        ],
        'Other': [
          {
            pipedriveProductId: 3,
            name: 'Unknown Product',
            code: 'UP-001',
            price: 25,
            shortDescription: ''
          }
        ]
      });
    });

    it('should handle all PRD category mappings', () => {
      const products = [
        { id: 1, name: 'Safety Item', category: '1' },
        { id: 2, name: 'Mining Tool', category: '2' },
        { id: 3, name: 'PPE Item', category: '3' },
        { id: 4, name: 'Machine Part', category: '4' }
      ];

      const result = transformProductsHierarchy(products);

      expect(result['Safety Equipment']).toBeDefined();
      expect(result['Mining Tools']).toBeDefined();
      expect(result['Personal Protective Equipment']).toBeDefined();
      expect(result['Machinery Parts']).toBeDefined();
    });
  });
});
