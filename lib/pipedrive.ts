import { ExternalError } from './errors';

// Read environment variables at runtime to ensure they're available
const getPipedriveConfig = () => ({
  token: process.env.PIPEDRIVE_API_TOKEN,
  baseUrl: process.env.PIPEDRIVE_BASE_URL || 'https://api.pipedrive.com/v1'
});

export interface PipedriveDeal {
  title: string;
  pipeline_id: number;
  stage_id: number;
  person_id: number;
  org_id?: number;
  user_id: number;
}

export interface PipedriveProduct {
  product_id: number;
  quantity: number;
  item_price: number;
}

const callPipedriveAPI = async (endpoint: string, method: string = 'GET', data?: any) => {
  const config = getPipedriveConfig();
  
  // Fix: Use & instead of ? if endpoint already has query parameters
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${config.baseUrl}${endpoint}${separator}api_token=${config.token}`;
  
  console.log('callPipedriveAPI called with:', { endpoint, method, url: url.substring(0, 50) + '...' });
  console.log('Token preview:', config.token ? `${config.token.substring(0, 8)}...` : 'NOT_SET');
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    console.log('Pipedrive API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Pipedrive API error response:', errorText);
      throw new ExternalError(`Pipedrive API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('Pipedrive API call failed:', errorMessage);
    throw new ExternalError(`Failed to call Pipedrive API: ${errorMessage}`);
  }
};

export const createDeal = async (dealData: PipedriveDeal) => {
  const response = await callPipedriveAPI('/deals', 'POST', dealData);
  return response.data;
};

export const addProductsToDeal = async (dealId: number, products: PipedriveProduct[]) => {
  const promises = products.map(product => 
    callPipedriveAPI(`/deals/${dealId}/products`, 'POST', product)
  );
  
  return await Promise.all(promises);
};

export const fetchContacts = async () => {
  const [personsResponse, orgsResponse] = await Promise.all([
    callPipedriveAPI('/persons?limit=500&custom_fields=1'),
    callPipedriveAPI('/organizations?limit=500&custom_fields=1')
  ]);
  
  return {
    persons: personsResponse.data || [],
    organizations: orgsResponse.data || []
  };
};

export const fetchProducts = async () => {
  const response = await callPipedriveAPI('/products?limit=500');
  return response.data || [];
};
