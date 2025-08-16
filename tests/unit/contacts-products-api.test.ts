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
  transformProductsHierarchy: vi.fn(),
  CACHE_KEYS: {
    CONTACTS: 'contacts:hierarchical:v1',
    PRODUCTS: 'products:categorized:v1'
  }
}));

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

describe('Contacts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should serve fresh data from cache when available', async () => {
    const mockCache = require('../../lib/cache');
    const mockErrorToResponse = require('../../lib/errors').errorToResponse;
    
    const mockCachedData = {
      data: { 'Group 1': { 'Mine A': [] } },
      stale: false
    };
    
    mockCache.cache.get.mockResolvedValue(mockCachedData);
    
    const request = new Request('http://localhost:3000/api/contacts');
    const response = await getContacts(request);
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.source).toBe('cache');
    expect(data.stale).toBe(false);
    expect(mockCache.cache.get).toHaveBeenCalledWith('contacts:hierarchical:v1');
  });

  it('should fetch from Pipedrive and cache when no fresh cache available', async () => {
    const mockCache = require('../../lib/cache');
    const mockPipedrive = require('../../lib/pipedrive');
    
    // No cache available
    mockCache.cache.get.mockResolvedValue(null);
    
    // Mock Pipedrive response
    const mockPipedriveData = {
      persons: [{ id: 1, name: 'Test Person' }],
      organizations: [{ id: 1, name: 'Test Org' }]
    };
    mockPipedrive.fetchContacts.mockResolvedValue(mockPipedriveData);
    
    // Mock transformation
    const mockTransformedData = { 'Group 1': { 'Mine A': [] } };
    mockCache.transformContactsHierarchy.mockReturnValue(mockTransformedData);
    
    const request = new Request('http://localhost:3000/api/contacts');
    const response = await getContacts(request);
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.source).toBe('pipedrive');
    expect(data.stale).toBe(false);
    expect(mockPipedrive.fetchContacts).toHaveBeenCalled();
    expect(mockCache.cache.set).toHaveBeenCalledWith('contacts:hierarchical:v1', mockTransformedData);
  });

  it('should serve stale cache when Pipedrive fails', async () => {
    const mockCache = require('../../lib/cache');
    const mockPipedrive = require('../../lib/pipedrive');
    const mockErrorToResponse = require('../../lib/errors').errorToResponse;
    
    // Stale cache available
    const mockStaleData = {
      data: { 'Group 1': { 'Mine A': [] } },
      stale: true
    };
    mockCache.cache.get.mockResolvedValue(mockStaleData);
    
    // Pipedrive fails
    mockPipedrive.fetchContacts.mockRejectedValue(new Error('API Error'));
    
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
    const mockCache = require('../../lib/cache');
    
    const mockCachedData = {
      data: { 'Safety Equipment': [] },
      stale: false
    };
    
    mockCache.cache.get.mockResolvedValue(mockCachedData);
    
    const request = new Request('http://localhost:3000/api/products');
    const response = await getProducts(request);
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.source).toBe('cache');
    expect(data.stale).toBe(false);
    expect(mockCache.cache.get).toHaveBeenCalledWith('products:categorized:v1');
  });

  it('should fetch from Pipedrive and cache when no fresh cache available', async () => {
    const mockCache = require('../../lib/cache');
    const mockPipedrive = require('../../lib/pipedrive');
    
    // No cache available
    mockCache.cache.get.mockResolvedValue(null);
    
    // Mock Pipedrive response
    const mockPipedriveData = [{ id: 1, name: 'Test Product', category: '1' }];
    mockPipedrive.fetchProducts.mockResolvedValue(mockPipedriveData);
    
    // Mock transformation
    const mockTransformedData = { 'Safety Equipment': [] };
    mockCache.transformProductsHierarchy.mockReturnValue(mockTransformedData);
    
    const request = new Request('http://localhost:3000/api/products');
    const response = await getProducts(request);
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.source).toBe('pipedrive');
    expect(data.stale).toBe(false);
    expect(mockPipedrive.fetchProducts).toHaveBeenCalled();
    expect(mockCache.cache.set).toHaveBeenCalledWith('products:categorized:v1', mockTransformedData);
  });

  it('should serve stale cache when Pipedrive fails', async () => {
    const mockCache = require('../../lib/cache');
    const mockPipedrive = require('../../lib/pipedrive');
    
    // Stale cache available
    const mockStaleData = {
      data: { 'Safety Equipment': [] },
      stale: true
    };
    mockCache.cache.get.mockResolvedValue(mockStaleData);
    
    // Pipedrive fails
    mockPipedrive.fetchProducts.mockRejectedValue(new Error('API Error'));
    
    const request = new Request('http://localhost:3000/api/products');
    const response = await getProducts(request);
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.source).toBe('cache_fallback');
    expect(data.stale).toBe(true);
    expect(data.error).toBe('Pipedrive temporarily unavailable');
  });
});
