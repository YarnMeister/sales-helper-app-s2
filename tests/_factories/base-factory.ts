// Base factory with guaranteed non-null data
export abstract class BaseFactory<T> {
  protected sequence = 1;
  
  protected nextId(): number {
    return this.sequence++;
  }
  
  protected nextString(prefix: string): string {
    return `${prefix}-${this.nextId().toString().padStart(3, '0')}`;
  }
  
  protected randomFromArray<U>(array: U[]): U {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  abstract build(overrides?: Partial<T>): T;
  
  buildMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}
