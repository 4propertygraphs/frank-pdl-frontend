const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MyHomeSearchParams {
  county?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  minBeds?: number;
  maxBeds?: number;
  page?: number;
  pageSize?: number;
  address?: string;
  apiKey?: string;
  groupId?: number;
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
    const params: MyHomeSearchParams = {};
    
    // Extract search parameters
    params.county = url.searchParams.get('county') || undefined;
    params.minPrice = url.searchParams.get('minPrice') ? parseInt(url.searchParams.get('minPrice')!) : undefined;
    params.maxPrice = url.searchParams.get('maxPrice') ? parseInt(url.searchParams.get('maxPrice')!) : undefined;
    params.propertyType = url.searchParams.get('propertyType') || undefined;
    params.minBeds = url.searchParams.get('minBeds') ? parseInt(url.searchParams.get('minBeds')!) : undefined;
    params.maxBeds = url.searchParams.get('maxBeds') ? parseInt(url.searchParams.get('maxBeds')!) : undefined;
    params.page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;
    params.pageSize = url.searchParams.get('pageSize') ? parseInt(url.searchParams.get('pageSize')!) : 20;
    params.address = url.searchParams.get('address') || undefined;
    params.apiKey = url.searchParams.get('apiKey') || undefined;
    params.groupId = url.searchParams.get('groupId') ? parseInt(url.searchParams.get('groupId')!) : undefined;

    console.log('MyHome API request params:', params);

    if (!params.apiKey || !params.groupId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required MyHome API credentials',
          required: ['apiKey', 'groupId']
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build MyHome API URL
    const myhomeUrl = new URL('https://www.myhome.ie/api/search');
    
    if (params.county) myhomeUrl.searchParams.append('county', params.county);
    if (params.minPrice) myhomeUrl.searchParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) myhomeUrl.searchParams.append('maxPrice', params.maxPrice.toString());
    if (params.propertyType) myhomeUrl.searchParams.append('propertyType', params.propertyType);
    if (params.minBeds) myhomeUrl.searchParams.append('minBeds', params.minBeds.toString());
    if (params.maxBeds) myhomeUrl.searchParams.append('maxBeds', params.maxBeds.toString());
    if (params.address) myhomeUrl.searchParams.append('address', params.address);
    
    myhomeUrl.searchParams.append('page', params.page.toString());
    myhomeUrl.searchParams.append('pageSize', params.pageSize.toString());
    myhomeUrl.searchParams.append('groupId', params.groupId.toString());

    console.log('Calling MyHome API:', myhomeUrl.toString());

    const myhomeResponse = await fetch(myhomeUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${params.apiKey}`,
        'X-API-Key': params.apiKey,
        'X-Group-ID': params.groupId.toString(),
        'User-Agent': 'Mozilla/5.0 (compatible; 4PropertyCodes/1.0)',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!myhomeResponse.ok) {
      console.error('MyHome API error:', myhomeResponse.status, myhomeResponse.statusText);
      
      // Return mock data on API failure
      const mockData = [{
        id: 'myhome-mock-1',
        displayAddress: '4 Bed Detached House, Naas, Co. Kildare',
        price: 425000,
        bedrooms: 4,
        bathrooms: 3,
        propertyType: 'Detached House',
        county: 'Kildare',
        region: 'Naas',
        eircode: 'W91 X2Y3',
        berRating: 'B2',
        floorArea: 145,
        description: 'Spacious family home in excellent condition with large garden...',
        photos: ['https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg'],
        contactDetails: {
          firstName: 'John',
          lastName: 'O\'Brien',
          phone: '+353 45 123 456',
          email: 'john@example.ie',
        },
        location: {
          latitude: 53.2157,
          longitude: -6.6673,
        },
        createdOnDate: new Date().toISOString(),
        modifiedOnDate: new Date().toISOString(),
        _isMockData: true
      }];

      return new Response(
        JSON.stringify({ 
          data: mockData,
          isMockData: true,
          message: 'MyHome API unavailable, using mock data'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const responseData = await myhomeResponse.json();
    console.log('MyHome API response received:', responseData);

    return new Response(
      JSON.stringify({ 
        data: responseData,
        isMockData: false,
        message: 'Real data from MyHome API'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('MyHome proxy error:', error);
    
    // Return mock data on any error
    const mockData = [{
      id: 'myhome-error-fallback',
      displayAddress: 'Mock Property (API Error)',
      price: 350000,
      bedrooms: 3,
      bathrooms: 2,
      propertyType: 'Semi-Detached House',
      county: 'Dublin',
      region: 'Dublin',
      eircode: 'D04 X1Y2',
      berRating: 'B3',
      floorArea: 120,
      description: 'Mock property data due to API error...',
      photos: ['https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg'],
      contactDetails: {
        firstName: 'Mock',
        lastName: 'Agent',
        phone: '+353 1 234 5678',
        email: 'mock@example.ie',
      },
      location: { latitude: 53.3498, longitude: -6.2603 },
      createdOnDate: new Date().toISOString(),
      modifiedOnDate: new Date().toISOString(),
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