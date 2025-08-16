import { BaseFactory } from './base-factory';

export interface TContactJSON {
  personId: number;
  name: string;
  email: string;
  phone: string;
  orgId: number;
  orgName: string;
  mineGroup: string;
  mineName: string;
}

export class ContactFactory extends BaseFactory<TContactJSON> {
  private static readonly MINE_GROUPS = [
    'Anglo American',
    'Harmony Gold',
    'Gold Fields',
    'Sibanye-Stillwater'
  ];
  
  private static readonly MINE_NAMES = {
    'Anglo American': ['Zibulo Mine', 'Kopanang Mine', 'Moab Khotsong'],
    'Harmony Gold': ['Kusasalethu Mine', 'Bambanani Mine'],
    'Gold Fields': ['South Deep Mine', 'Beatrix Mine'],
    'Sibanye-Stillwater': ['Driefontein Mine', 'Kloof Mine']
  };
  
  private static readonly FIRST_NAMES = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 
    'James', 'Emma', 'Robert', 'Anna'
  ];
  
  private static readonly LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 
    'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'
  ];

  build(overrides: Partial<TContactJSON> = {}): TContactJSON {
    const mineGroup = overrides.mineGroup || 
      this.randomFromArray(ContactFactory.MINE_GROUPS);
    
    const availableMines = ContactFactory.MINE_NAMES[mineGroup as keyof typeof ContactFactory.MINE_NAMES] || 
      ContactFactory.MINE_NAMES[ContactFactory.MINE_GROUPS[0]];
    
    const mineName = overrides.mineName || 
      this.randomFromArray(availableMines);
    
    const firstName = this.randomFromArray(ContactFactory.FIRST_NAMES);
    const lastName = this.randomFromArray(ContactFactory.LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    
    const personId = overrides.personId || this.nextId() + 10000;
    const orgId = overrides.orgId || this.nextId() + 50000;
    
    return {
      personId,
      name: overrides.name || fullName,
      email: overrides.email || 
        `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${mineName.toLowerCase().replace(/\s+/g, '')}.co.za`,
      phone: overrides.phone || 
        `+2711${(Math.floor(Math.random() * 9000000) + 1000000).toString()}`,
      orgId,
      orgName: overrides.orgName || mineName,
      mineGroup,
      mineName,
      ...overrides
    };
  }
  
  // Specific factory methods for common test scenarios
  buildForMineGroup(mineGroup: string): TContactJSON {
    return this.build({ mineGroup });
  }
  
  buildForMine(mineGroup: string, mineName: string): TContactJSON {
    return this.build({ mineGroup, mineName });
  }
}
