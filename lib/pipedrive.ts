import { ExternalError } from './errors';

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_BASE_URL = process.env.PIPEDRIVE_BASE_URL || 'https://api.pipedrive.com/v1';

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
  const url = `${PIPEDRIVE_BASE_URL}${endpoint}?api_token=${PIPEDRIVE_API_TOKEN}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    if (!response.ok) {
      throw new ExternalError(`Pipedrive API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new ExternalError(`Failed to call Pipedrive API: ${error.message}`);
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
    callPipedriveAPI('/persons?limit=500'),
    callPipedriveAPI('/organizations?limit=500')
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
