import { describe, it, expect } from 'vitest';
import { transformContactsHierarchy, transformProductsHierarchy } from '../../lib/cache';

// Pipedrive field IDs from legacy tech specs
const MINE_GROUP_FIELD_ID = 'd0b6b2d1d53bed3053e896f938c6051a790bd15e';
const JOB_TITLE_FIELD_ID = 'd84955e5e1a7284521f90bca9aa2b94a533ed24e';

describe('Cache Transformations', () => {
  describe('transformContactsHierarchy', () => {
    it('should transform contacts to hierarchical structure', () => {
      const persons = [
        {
          id: 1,
          name: 'John Doe',
          email: [{ value: 'john@mine.com' }],
          phone: [{ value: '+1234567890' }],
          org_id: { value: 1, name: 'Mine A' },
          [JOB_TITLE_FIELD_ID]: 'Mining Engineer'
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: [{ value: 'jane@mine.com' }],
          phone: [{ value: '+0987654321' }],
          org_id: { value: 2, name: 'Mine B' },
          [JOB_TITLE_FIELD_ID]: 'Safety Manager'
        }
      ];

      const organizations = [
        {
          id: 1,
          name: 'Mine A',
          [MINE_GROUP_FIELD_ID]: 'Group 1'
        },
        {
          id: 2,
          name: 'Mine B',
          [MINE_GROUP_FIELD_ID]: 'Group 2'
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
              mineName: 'Mine A',
              jobTitle: 'Mining Engineer'
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
              mineName: 'Mine B',
              jobTitle: 'Safety Manager'
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
          org_id: { value: 999, name: 'Unknown Mine' },
          [JOB_TITLE_FIELD_ID]: 'Engineer'
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
              mineName: 'Unknown Mine',
              jobTitle: 'Engineer'
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
