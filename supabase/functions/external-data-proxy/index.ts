const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EXTERNAL_API_BASE = 'https://your-external-api.com/api'; // Replace with your actual API URL
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU5NDA5NzQ0LCJleHAiOjE3NTk0OTYxNDR9.2pWD_uILqclYl3GcGk5R-3PMCDQC3p1yljG3UDhuejw';

interface ExternalApiRequest {
  source: 'myhome' | 'daft' | 'wordpress' | 'acquaint';
  action: 'search' | 'get_property' | 'get_agencies';
  params: {
    property_id?: string;
    address?: string;
    location?: string;
    api_key?: string;
    group_id?: string;
    [key: string]: any;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const source = url.searchParams.get('source') as 'myhome' | 'daft' | 'wordpress' | 'acquaint';
    const action = url.searchParams.get('action') || 'search';
    
    if (!source) {
      return new Response(
        JSON.stringify({ error: 'Missing source parameter (myhome, daft, wordpress, acquaint)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract all search parameters
    const params: Record<string, any> = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== 'source' && key !== 'action') {
        params[key] = value;
      }
    }

    console.log(`📡 External API request: ${source} - ${action}`, params);

    let apiEndpoint = '';
    let requestBody: any = null;

    switch (source) {
      case 'myhome':
        if (action === 'search' && params.address) {
          // Search MyHome by address
          apiEndpoint = '/myhome';
          requestBody = {
            key: params.api_key,
            id: params.property_id || '',
            search_address: params.address,
            group_id: params.group_id
          };
        } else if (params.property_id) {
          // Get specific MyHome property
          apiEndpoint = '/myhome';
          requestBody = {
            key: params.api_key,
            id: params.property_id,
            group_id: params.group_id
          };
        }
        break;

      case 'daft':
        if (action === 'search' && params.address) {
          // Search Daft by address - using your database API
          apiEndpoint = '/daft';
          requestBody = {
            key: params.api_key,
            search_address: params.address,
            location: params.location,
            min_price: params.minPrice,
            max_price: params.maxPrice,
            property_type: params.propertyType
          };
        } else if (params.property_id) {
          // Get specific Daft property
          apiEndpoint = '/daft';
          requestBody = {
            key: params.api_key,
            id: params.property_id
          };
        }
        break;

      case 'wordpress':
        apiEndpoint = '/wordpress';
        requestBody = {
          site_url: params.site_url,
          search_title: params.title || params.address,
          property_id: params.property_id
        };
        break;

      case 'acquaint':
        apiEndpoint = '/acquaint';
        requestBody = {
          key: params.api_key,
          id: params.property_id,
          site_prefix: params.site_prefix,
          site_id: params.site_id || '0'
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid source' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    if (!apiEndpoint) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid action or missing required parameters',
          required: source === 'myhome' ? ['api_key', 'group_id'] : ['api_key']
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Call your external database API
    console.log(`🔗 Calling external API: ${EXTERNAL_API_BASE}${apiEndpoint}`);
    
    const externalResponse = await fetch(`${EXTERNAL_API_BASE}${apiEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!externalResponse.ok) {
      console.error(`External API error: ${externalResponse.status} ${externalResponse.statusText}`);
      
      // Return "No API" data instead of mock data
      const noApiData = [{
        id: `${source}-no-api-1`,
        title: 'No API Key Available',
        price: 0,
        bedrooms: 0,
        bathrooms: 0,
        [source === 'myhome' ? 'displayAddress' : 'address']: 'No API Key Configured',
        [source === 'myhome' ? 'propertyType' : 'propertyType']: 'No API',
        county: 'No API',
        description: `${source.charAt(0).toUpperCase() + source.slice(1)} API key not configured for this agency`,
        _isNoApiData: true
      }];

      return new Response(
        JSON.stringify({ 
          data: noApiData,
          isNoApiData: true,
          message: `${source} API key not configured`
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const responseData = await externalResponse.json();
    console.log(`✅ External API response received from ${source}:`, responseData);

    // Check if response indicates no API key
    if (responseData.error && responseData.error.includes('API key')) {
      const noApiData = [{
        id: `${source}-no-api-1`,
        title: 'No API Key Available',
        price: 0,
        bedrooms: 0,
        bathrooms: 0,
        [source === 'myhome' ? 'displayAddress' : 'address']: 'No API Key Configured',
        [source === 'myhome' ? 'propertyType' : 'propertyType']: 'No API',
        county: 'No API',
        description: `${source.charAt(0).toUpperCase() + source.slice(1)} API key not configured for this agency`,
        _isNoApiData: true
      }];

      return new Response(
        JSON.stringify({ 
          data: noApiData,
          isNoApiData: true,
          message: responseData.error
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        data: responseData,
        isRealData: true,
        message: `Real data from ${source} API via external database`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('External data proxy error:', error);
    
    // Return "No API" data on any error
    const source = new URL(req.url).searchParams.get('source') || 'unknown';
    const noApiData = [{
      id: `${source}-error-1`,
      title: 'API Error',
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      address: 'API Connection Error',
      propertyType: 'Error',
      county: 'Error',
      description: `Error connecting to ${source} API: ${error.message}`,
      _isErrorData: true
    }];

    return new Response(
      JSON.stringify({ 
        data: noApiData,
        isErrorData: true,
        error: error.message,
        message: `Error connecting to ${source} API`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});