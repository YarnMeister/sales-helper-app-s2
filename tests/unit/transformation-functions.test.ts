import { describe, it, expect } from 'vitest';
import { transformProductsHierarchy } from '../../lib/cache';

// Pipedrive field IDs from legacy tech specs
const MINE_GROUP_FIELD_ID = 'd0b6b2d1d53bed3053e896f938c6051a790bd15e';
const JOB_TITLE_FIELD_ID = 'd84955e5e1a7284521f90bca9aa2b94a533ed24e';

// Copy the transformation functions here to test them in isolation
const transformContactsHierarchy = (persons: any[], organizations: any[]) => {
  const orgMap = new Map(organizations.map(org => [org.id, org]));
  
  const grouped = persons.reduce((acc, person) => {
    const org = orgMap.get(person.org_id?.value);
    // PRD requirement: Group by Mine Group > Mine Name > Persons
    // Use correct Pipedrive field ID from legacy tech specs
    const mineGroup = org?.[MINE_GROUP_FIELD_ID] || 'Unknown Group';
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
      mineName,
      jobTitle: person[JOB_TITLE_FIELD_ID] || null
    });
    
    return acc;
  }, {});
  
  return grouped;
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

    it('should handle null email and phone values from Pipedrive', () => {
      const persons = [
        {
          id: 789,
          name: 'Shreeya Pandya',
          email: null, // Pipedrive sends null when no email
          phone: null, // Pipedrive sends null when no phone
          org_id: { value: 1, name: 'Kriel' },
          [JOB_TITLE_FIELD_ID]: null
        },
        {
          id: 101,
          name: 'Jane Smith',
          email: null,
          phone: [{ value: '+27123456789' }],
          org_id: { value: 2, name: 'Zibulo Mine' },
          [JOB_TITLE_FIELD_ID]: 'Manager'
        },
        {
          id: 102,
          name: 'Bob Johnson',
          email: [{ value: 'bob@example.com' }],
          phone: null,
          org_id: { value: 3, name: 'Grootegeluk' },
          [JOB_TITLE_FIELD_ID]: null
        }
      ];

      const organizations = [
        {
          id: 1,
          name: 'Kriel',
          [MINE_GROUP_FIELD_ID]: 'Seriti'
        },
        {
          id: 2,
          name: 'Zibulo Mine',
          [MINE_GROUP_FIELD_ID]: 'Anglo American'
        },
        {
          id: 3,
          name: 'Grootegeluk',
          [MINE_GROUP_FIELD_ID]: 'Exxaro'
        }
      ];

      const result = transformContactsHierarchy(persons, organizations);

      expect(result).toEqual({
        'Seriti': {
          'Kriel': [
            {
              personId: 789,
              name: 'Shreeya Pandya',
              email: null,
              phone: null,
              orgId: 1,
              orgName: 'Kriel',
              mineGroup: 'Seriti',
              mineName: 'Kriel',
              jobTitle: null
            }
          ]
        },
        'Anglo American': {
          'Zibulo Mine': [
            {
              personId: 101,
              name: 'Jane Smith',
              email: null,
              phone: '+27123456789',
              orgId: 2,
              orgName: 'Zibulo Mine',
              mineGroup: 'Anglo American',
              mineName: 'Zibulo Mine',
              jobTitle: 'Manager'
            }
          ]
        },
        'Exxaro': {
          'Grootegeluk': [
            {
              personId: 102,
              name: 'Bob Johnson',
              email: 'bob@example.com',
              phone: null,
              orgId: 3,
              orgName: 'Grootegeluk',
              mineGroup: 'Exxaro',
              mineName: 'Grootegeluk',
              jobTitle: null
            }
          ]
        }
      });
    });

    it('should handle missing email and phone arrays gracefully', () => {
      const persons = [
        {
          id: 103,
          name: 'Alice Brown',
          // No email or phone arrays at all
          org_id: { value: 4, name: 'Driefontein' },
          [JOB_TITLE_FIELD_ID]: 'Supervisor'
        }
      ];

      const organizations = [
        {
          id: 4,
          name: 'Driefontein',
          [MINE_GROUP_FIELD_ID]: 'Sibanye'
        }
      ];

      const result = transformContactsHierarchy(persons, organizations);

      expect(result).toEqual({
        'Sibanye': {
          'Driefontein': [
            {
              personId: 103,
              name: 'Alice Brown',
              email: null,
              phone: null,
              orgId: 4,
              orgName: 'Driefontein',
              mineGroup: 'Sibanye',
              mineName: 'Driefontein',
              jobTitle: 'Supervisor'
            }
          ]
        }
      });
    });

    it('should handle empty email and phone arrays', () => {
      const persons = [
        {
          id: 104,
          name: 'Charlie Wilson',
          email: [], // Empty array
          phone: [], // Empty array
          org_id: { value: 5, name: 'Kusasalethu' },
          [JOB_TITLE_FIELD_ID]: null
        }
      ];

      const organizations = [
        {
          id: 5,
          name: 'Kusasalethu',
          [MINE_GROUP_FIELD_ID]: 'Harmony'
        }
      ];

      const result = transformContactsHierarchy(persons, organizations);

      expect(result).toEqual({
        'Harmony': {
          'Kusasalethu': [
            {
              personId: 104,
              name: 'Charlie Wilson',
              email: null,
              phone: null,
              orgId: 5,
              orgName: 'Kusasalethu',
              mineGroup: 'Harmony',
              mineName: 'Kusasalethu',
              jobTitle: null
            }
          ]
        }
      });
    });
  });

  describe('transformProductsHierarchy', () => {
    it('should transform products to categorized structure with custom fields', () => {
      const products = [
        {
          id: 1,
          name: 'Safety Helmet',
          category: '28', // Cable category
          prices: [{ price: 50, currency: 'ZAR' }],
          code: 'SH-001',
          description: 'Safety helmet for mining operations', // Main description
          'f320da5e15bef8b83d8c9d997533107dfdb66d5c': 'Hard hat for safety', // Short description field
          '59af9d567fc57492de93e82653ce01d0c967f6f5': 79 // Show on Sales Helper = Yes
        },
        {
          id: 2,
          name: 'Mining Pick',
          category: '29', // Conveyor Belt Equipment category
          prices: [{ price: 100, currency: 'ZAR' }],
          code: 'MP-001',
          description: 'Mining pick for excavation work', // Main description
          'f320da5e15bef8b83d8c9d997533107dfdb66d5c': 'Tool for mining', // Short description field
          '59af9d567fc57492de93e82653ce01d0c967f6f5': 79 // Show on Sales Helper = Yes
        },
        {
          id: 3,
          name: 'Hidden Product',
          category: '30', // Environmental Monitoring category
          prices: [{ price: 25, currency: 'ZAR' }],
          code: 'HP-001',
          description: 'Hidden product description', // Main description
          'f320da5e15bef8b83d8c9d997533107dfdb66d5c': 'Hidden product', // Short description field
          '59af9d567fc57492de93e82653ce01d0c967f6f5': 78 // Show on Sales Helper = No
        }
      ];

      const result = transformProductsHierarchy(products);

      expect(result).toEqual({
        'Cable': [
          {
            pipedriveProductId: 1,
            name: 'Safety Helmet',
            code: 'SH-001',
            price: 50,
            description: 'Safety helmet for mining operations',
            shortDescription: 'Hard hat for safety',
            showOnSalesHelper: true
          }
        ],
        'Conveyor Belt Equipment': [
          {
            pipedriveProductId: 2,
            name: 'Mining Pick',
            code: 'MP-001',
            price: 100,
            description: 'Mining pick for excavation work',
            shortDescription: 'Tool for mining',
            showOnSalesHelper: true
          }
        ]
        // Hidden product should not appear in results
      });
    });

    it('should handle all PRD category mappings', () => {
      const products = [
        { 
          id: 1, 
          name: 'Cable Item', 
          category: '28',
          '59af9d567fc57492de93e82653ce01d0c967f6f5': 79 // Show on Sales Helper = Yes
        },
        { 
          id: 2, 
          name: 'Conveyor Item', 
          category: '29',
          '59af9d567fc57492de93e82653ce01d0c967f6f5': 79 // Show on Sales Helper = Yes
        },
        { 
          id: 3, 
          name: 'Environmental Item', 
          category: '30',
          '59af9d567fc57492de93e82653ce01d0c967f6f5': 79 // Show on Sales Helper = Yes
        },
        { 
          id: 4, 
          name: 'General Item', 
          category: '31',
          '59af9d567fc57492de93e82653ce01d0c967f6f5': 79 // Show on Sales Helper = Yes
        }
      ];

      const result = transformProductsHierarchy(products);

      expect(result['Cable']).toBeDefined();
      expect(result['Conveyor Belt Equipment']).toBeDefined();
      expect(result['Environmental Monitoring']).toBeDefined();
      expect(result['General Supplies']).toBeDefined();
    });
  });
});
