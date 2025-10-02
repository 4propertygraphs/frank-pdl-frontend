const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DaftSearchParams {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  minBeds?: number;
  maxBeds?: number;
  sort?: string;
  limit?: number;
  address?: string;
  apiKey?: string;
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
    const params: DaftSearchParams = {};
    
    // Extract search parameters
    params.location = url.searchParams.get('location') || undefined;
    params.minPrice = url.searchParams.get('minPrice') ? parseInt(url.searchParams.get('minPrice')!) : undefined;
    params.maxPrice = url.searchParams.get('maxPrice') ? parseInt(url.searchParams.get('maxPrice')!) : undefined;
    params.propertyType = url.searchParams.get('propertyType') || undefined;
    params.minBeds = url.searchParams.get('minBeds') ? parseInt(url.searchParams.get('minBeds')!) : undefined;
    params.maxBeds = url.searchParams.get('maxBeds') ? parseInt(url.searchParams.get('maxBeds')!) : undefined;
    params.sort = url.searchParams.get('sort') || 'relevance';
    params.limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20;
    params.address = url.searchParams.get('address') || undefined;
    params.apiKey = url.searchParams.get('apiKey') || undefined;

    console.log('Daft API request params:', params);

    // Build Daft API URL - using their public search endpoint
    const daftUrl = new URL('https://www.daft.ie/api/v1/listings');
    
    if (params.location) daftUrl.searchParams.append('location', params.location);
    if (params.minPrice) daftUrl.searchParams.append('priceFrom', params.minPrice.toString());
    if (params.maxPrice) daftUrl.searchParams.append('priceTo', params.maxPrice.toString());
    if (params.propertyType) daftUrl.searchParams.append('propertyType', params.propertyType);
    if (params.minBeds) daftUrl.searchParams.append('numBedsFrom', params.minBeds.toString());
    if (params.maxBeds) daftUrl.searchParams.append('numBedsTo', params.maxBeds.toString());
    if (params.address) daftUrl.searchParams.append('q', params.address);
    
    daftUrl.searchParams.append('sort', params.sort);
    daftUrl.searchParams.append('limit', params.limit.toString());

    console.log('Calling Daft API:', daftUrl.toString());

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (compatible; 4PropertyCodes/1.0)',
      'Accept': 'application/json',
      'Referer': 'https://www.daft.ie/',
    };

    if (params.apiKey) {
      headers['Authorization'] = `Bearer ${params.apiKey}`;
      headers['X-API-Key'] = params.apiKey;
    }

    const daftResponse = await fetch(daftUrl.toString(), {
      method: 'GET',
      headers,
    });

    if (!daftResponse.ok) {
      console.error('Daft API error:', daftResponse.status, daftResponse.statusText);
      
      // Return mock data on API failure
      const mockData = [{
        id: 'daft-mock-1',
        title: '3 Bed Semi-Detached House, Dublin 4',
        price: 485000,
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'Semi-Detached House',
        address: 'Sandymount, Dublin 4',
        county: 'Dublin',
        eircode: 'D04 X1Y2',
        berRating: 'B3',
        floorArea: 125,
        description: 'Beautiful family home in sought-after Sandymount location...',
        images: ['https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg'],
        contactName: 'Sarah Murphy',
        phone: '+353 1 234 5678',
        latitude: 53.3331,
        longitude: -6.2267,
        publishDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        _isMockData: true
      }];

      return new Response(
        JSON.stringify({ 
          data: mockData,
          isMockData: true,
          message: 'Daft API unavailable, using mock data'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const responseData = await daftResponse.json();
    console.log('Daft API response received:', responseData);

    return new Response(
      JSON.stringify({ 
        data: responseData,
        isMockData: false,
        message: 'Real data from Daft API'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Daft proxy error:', error);
    
    // Return mock data on any error
    const mockData = [{
      id: 'daft-error-fallback',
      title: 'Mock Property (API Error)',
      price: 450000,
      bedrooms: 3,
      bathrooms: 2,
      propertyType: 'House',
      address: 'Mock Address, Dublin',
      county: 'Dublin',
      eircode: 'D01 X1Y2',
      berRating: 'B3',
      floorArea: 120,
      description: 'Mock property data due to API error...',
      images: ['https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg'],
      contactName: 'Mock Agent',
      phone: '+353 1 234 5678',
      latitude: 53.3498,
      longitude: -6.2603,
      publishDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      _isMockData: true
    }];

    return new Response(
      JSON.stringify({ 
        data: mockData,
        isMockData: true,
        error: error.message,
        message: 'Error occurred, using mock data'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});