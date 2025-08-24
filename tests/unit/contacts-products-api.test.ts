import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getContacts } from '../../app/api/contacts/route';
import { GET as getProducts } from '../../app/api/products/route';

// Mock the cache module
vi.mock('../../lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn()
  },
  transformContactsHierarchy: vi.fn(),
  CACHE_KEYS: {
    CONTACTS: 'contacts:hierarchical:v1',
    PRODUCTS: 'products:categorized:v1'
  }
}));

// Mock the BFF module
vi.mock('../../lib/bff', () => ({
  transformRawProductsToCategorized: vi.fn()
}));

// Import the mocked modules
import { cache, transformContactsHierarchy } from '../../lib/cache';
import { transformRawProductsToCategorized } from '../../lib/bff';

// Mock the pipedrive module
vi.mock('../../lib/pipedrive', () => ({
  fetchContacts: vi.fn(),
  fetchProducts: vi.fn()
}));

// Mock the errors module
vi.mock('../../lib/errors', () => ({
  errorToResponse: vi.fn(),
  ExternalError: class ExternalError extends Error {
    status = 502;
    code = 'ERR_EXTERNAL';
  }
}));

// Import the mocked modules
import { fetchContacts, fetchProducts } from '../../lib/pipedrive';
import { errorToResponse } from '../../lib/errors';

describe('Contacts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should serve fresh data from cache when available', async () => {
    
    const mockCachedData = {
      data: { 'Group 1': { 'Mine A': [] } },
      stale: false
    };
    
    vi.mocked(cache.get).mockResolvedValue(mockCachedData);
    
    const request = new Request('http://localhost:3000/api/contacts');
    const response = await getContacts(request);
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.source).toBe('cache');
    expect(data.stale).toBe(false);
    expect(cache.get).toHaveBeenCalledWith('contacts:hierarchical:v1');
  });

  it('should fetch from Pipedrive and cache when no fresh cache available', async () => {
    // No cache available
    vi.mocked(cache.get).mockResolvedValue(null);
    
    // Mock Pipedrive response
    const mockPipedriveData = {
      persons: [{ id: 1, name: 'Test Person' }],
      organizations: [{ id: 1, name: 'Test Org' }]
    };
    vi.mocked(fetchContacts).mockResolvedValue(mockPipedriveData);
    
    // Mock transformation
    const mockTransformedData = { 'Group 1': { 'Mine A': [] } };
    vi.mocked(transformContactsHierarchy).mockReturnValue(mockTransformedData);
    
    const request = new Request('http://localhost:3000/api/contacts');
    const response = await getContacts(request);
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.source).toBe('pipedrive');
    expect(data.stale).toBe(false);
    expect(fetchContacts).toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalledWith('contacts:hierarchical:v1', mockTransformedData);
  });

  it('should serve stale cache when Pipedrive fails', async () => {
    // Stale cache available
    const mockStaleData = {
      data: { 'Group 1': { 'Mine A': [] } },
      stale: true
    };
    vi.mocked(cache.get).mockResolvedValue(mockStaleData);
    
    // Pipedrive fails
    vi.mocked(fetchContacts).mockRejectedValue(new Error('API Error'));
    
    const request = new Request('http://localhost:3000/api/contacts');
    const response = await getContacts(request);
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.source).toBe('cache_fallback');
    expect(data.stale).toBe(true);
    expect(data.error).toBe('Pipedrive temporarily unavailable');
  });
});

describe('Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should serve fresh data from cache when available', async () => {
    const mockCachedData = {
      data: { 'Safety Equipment': [] },
      stale: false
    };
    
    vi.mocked(cache.get).mockResolvedValue(mockCachedData);
    
    const request = new Request('http://localhost:3000/api/products');
    const response = await getProducts(request);
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.source).toBe('cache');
    expect(data.stale).toBe(false);
    expect(cache.get).toHaveBeenCalledWith('products:categorized:v1');
  });

  it('should fetch from Pipedrive and cache when no fresh cache available', async () => {
    // No cache available
    vi.mocked(cache.get).mockResolvedValue(null);
    
    // Mock Pipedrive response
    const mockPipedriveData = [{ id: 1, name: 'Test Product', category: '1' }];
    vi.mocked(fetchProducts).mockResolvedValue(mockPipedriveData);
    
    // Mock transformation
    const mockTransformedData = { 'Safety Equipment': [] };
    vi.mocked(transformRawProductsToCategorized).mockReturnValue(mockTransformedData);
    
    const request = new Request('http://localhost:3000/api/products');
    const response = await getProducts(request);
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.source).toBe('pipedrive');
    expect(data.stale).toBe(false);
    expect(fetchProducts).toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalledWith('products:categorized:v1', mockTransformedData);
  });

  it('should serve stale cache when Pipedrive fails', async () => {
    // Stale cache available
    const mockStaleData = {
      data: { 'Safety Equipment': [] },
      stale: true
    };
    vi.mocked(cache.get).mockResolvedValue(mockStaleData);
    
    // Pipedrive fails
    vi.mocked(fetchProducts).mockRejectedValue(new Error('API Error'));
    
    const request = new Request('http://localhost:3000/api/products');
    const response = await getProducts(request);
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.source).toBe('cache_fallback');
    expect(data.stale).toBe(true);
    expect(data.error).toBe('Pipedrive temporarily unavailable');
  });
});
