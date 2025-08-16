'use client';

import { useState, useEffect } from 'react';

interface Contact {
  personId: number;
  name: string;
  email: string | null;
  phone: string | null;
  orgId: number;
  orgName: string;
  mineGroup: string;
  mineName: string;
}

interface Product {
  pipedriveProductId: number;
  name: string;
  code: string;
  price: number;
  shortDescription: string;
}

interface ContactsData {
  [mineGroup: string]: {
    [mineName: string]: Contact[];
  };
}

interface ProductsData {
  [category: string]: Product[];
}

export default function DataDisplay() {
  const [contacts, setContacts] = useState<ContactsData>({});
  const [products, setProducts] = useState<ProductsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');
  const [cacheHealth, setCacheHealth] = useState<string>('unknown');
  const [checkingCache, setCheckingCache] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch contacts and products sequentially for debugging
        console.log('Fetching contacts...');
        const contactsResponse = await fetch('/api/contacts');
        console.log('Contacts response status:', contactsResponse.status);
        const contactsData = await contactsResponse.json();
        console.log('Contacts data received:', contactsData.ok);
        
        console.log('Fetching products...');
        const productsResponse = await fetch('/api/products');
        console.log('Products response status:', productsResponse.status);
        const productsData = await productsResponse.json();
        console.log('Products data received:', productsData.ok);

        if (contactsData.ok && productsData.ok) {
          setContacts(contactsData.data);
          setProducts(productsData.data);
          setSource(`${contactsData.source} / ${productsData.source}`);
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        setError('Error loading data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Temporarily disable cache health check to debug
    // checkCacheHealthNonBlocking();
  }, []);
  
  const checkCacheHealth = async () => {
    try {
      setCheckingCache(true);
      const response = await fetch('/api/cache/health');
      const data = await response.json();
      setCacheHealth(data.ok ? 'healthy' : 'unhealthy');
    } catch (err) {
      setCacheHealth('unavailable');
    } finally {
      setCheckingCache(false);
    }
  };
  
  // Don't block the main data loading on cache health check
  const checkCacheHealthNonBlocking = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/cache/health', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      setCacheHealth(data.ok ? 'healthy' : 'unhealthy');
    } catch (err) {
      setCacheHealth('unavailable');
    }
  };
  
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch fresh data from Pipedrive (this will update the cache)
      const [contactsResponse, productsResponse] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/products')
      ]);

      const contactsData = await contactsResponse.json();
      const productsData = await productsResponse.json();

      if (contactsData.ok && productsData.ok) {
        setContacts(contactsData.data);
        setProducts(productsData.data);
        setSource(`${contactsData.source} / ${productsData.source}`);
      } else {
        setError('Failed to refresh data');
      }
    } catch (err) {
      setError('Error refreshing data');
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading contacts and products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  // Flatten contacts for display
  const allContacts: Contact[] = [];
  Object.entries(contacts).forEach(([mineGroup, mines]) => {
    Object.entries(mines).forEach(([mineName, contactList]) => {
      contactList.forEach(contact => {
        allContacts.push(contact);
      });
    });
  });

  // Flatten products for display
  const allProducts: Product[] = [];
  Object.entries(products).forEach(([category, productList]) => {
    productList.forEach(product => {
      allProducts.push(product);
    });
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Data loaded successfully from: {source}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Cache Status:</span> Data is served from Redis cache when available, with fallback to Pipedrive API
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              cacheHealth === 'healthy' ? 'bg-green-100 text-green-800' :
              cacheHealth === 'unhealthy' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {checkingCache ? 'Checking...' : 
               cacheHealth === 'healthy' ? '✅ Cache Healthy' :
               cacheHealth === 'unhealthy' ? '❌ Cache Unhealthy' :
               '⚠️ Cache Unavailable'}
            </div>
            <button
              onClick={checkCacheHealth}
              disabled={checkingCache}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {checkingCache ? 'Checking...' : 'Test Cache'}
            </button>
            <button
              onClick={refreshData}
              disabled={loading}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Contacts ({allContacts.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Hierarchical: Mine Group → Mine Name → Persons
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allContacts.map((contact, index) => (
                  <tr key={contact.personId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {contact.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium">{contact.mineName}</div>
                        <div className="text-xs text-gray-400">{contact.mineGroup}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {contact.email && <div>{contact.email}</div>}
                        {contact.phone && <div>{contact.phone}</div>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
              Showing all {allContacts.length} contacts from cache
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Products ({allProducts.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Categorized by type
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allProducts.map((product, index) => (
                  <tr key={product.pipedriveProductId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.code || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      R {product.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
              Showing all {allProducts.length} products from cache
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <div className="text-2xl font-bold">{allContacts.length}</div>
          <div className="text-sm">Total Contacts</div>
        </div>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <div className="text-2xl font-bold">{allProducts.length}</div>
          <div className="text-sm">Total Products</div>
        </div>
        <div className="bg-purple-100 border border-purple-400 text-purple-700 px-4 py-3 rounded">
          <div className="text-2xl font-bold">{Object.keys(contacts).length}</div>
          <div className="text-sm">Mine Groups</div>
        </div>
        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded">
          <div className="text-2xl font-bold">{Object.keys(products).length}</div>
          <div className="text-sm">Product Categories</div>
        </div>
      </div>
    </div>
  );
}
